import { describe, expect, it } from 'vitest';
import { content } from '../src/features/content/data';
import { buildContent } from '../src/features/content/model';
import { recordVisit, setNote, setProgress, toggleSaved } from '../src/features/progress/actions';
import { emptyUserData } from '../src/features/progress/schema';
import { createUserStore, STORAGE_KEY, type StorageLike } from '../src/features/progress/store';
import { ownerProgress, stateOf, suggestNext } from '../src/features/progress/summary';
import { badgeFile, fixtureRaw } from './fixtures';

function memoryStorage(initial: Record<string, string> = {}): StorageLike & { data: Record<string, string> } {
  const data = { ...initial };
  return { data, getItem: (k) => data[k] ?? null, setItem: (k, v) => void (data[k] = v), removeItem: (k) => void delete data[k] };
}

describe('progress calculations', () => {
  it('reports partial counts without a percentage for unverified outlines', () => {
    let data = emptyUserData();
    data = setProgress(data, 'rank.tenderfoot.3a', 'completed-personal');
    data = setProgress(data, 'rank.tenderfoot.3b', 'learning');
    const s = ownerProgress(content, data, 'rank.tenderfoot');
    expect(s.counts['completed-personal']).toBe(1);
    expect(s.counts.learning).toBe(1);
    expect(s.percentComplete).toBeNull();
    expect(s.partial).toBe(true);
  });

  it('computes a percentage only when the dataset is verified and complete', () => {
    const raw = fixtureRaw();
    const v = badgeFile(raw).versions[0];
    v.status = 'verified';
    (v as Record<string, unknown>).sourceCheckedOn = '2026-01-02';
    const { content: c } = buildContent(raw);
    const data = setProgress(emptyUserData(), 'mb.knots.1', 'completed-personal');
    const s = ownerProgress(c, data, 'mb.knots');
    expect(s.total).toBe(3);
    expect(s.percentComplete).toBe(33);
    expect(s.partial).toBe(false);
  });

  it('removes the record when set back to not started', () => {
    let data = setProgress(emptyUserData(), 'mb.first-aid.2a', 'learning');
    data = setProgress(data, 'mb.first-aid.2a', 'not-started');
    expect(data.progress['mb.first-aid.2a']).toBeUndefined();
    expect(stateOf(data, 'mb.first-aid.2a')).toBe('not-started');
  });

  it('suggests requirements already in progress before new ones', () => {
    const data = setProgress(emptyUserData(), 'rank.scout.4a', 'learning');
    const next = suggestNext(content, data, 'rank.scout', 3);
    expect(next[0]).toEqual({ requirementId: 'rank.scout.4a', reason: 'continue' });
    expect(next).toHaveLength(3);
  });

  it('keeps recently viewed unique, newest first, and capped', () => {
    let data = emptyUserData();
    for (let i = 0; i < 25; i++) data = recordVisit(data, { kind: 'badge', id: `b${i}`, title: `B${i}`, path: `/b${i}` });
    data = recordVisit(data, { kind: 'badge', id: 'b10', title: 'B10', path: '/b10' });
    expect(data.recent).toHaveLength(20);
    expect(data.recent[0].id).toBe('b10');
    expect(data.recent.filter((r) => r.id === 'b10')).toHaveLength(1);
  });
});

describe('local persistence', () => {
  it('saves to and reloads from storage', () => {
    const storage = memoryStorage();
    const store = createUserStore(storage);
    store.update((d) => toggleSaved(setNote(d, 'mb.first-aid.1', 'practice splints'), 'res.cdc-ticks'));
    const reloaded = createUserStore(storage).getSnapshot();
    expect(reloaded.notes['mb.first-aid.1'].text).toBe('practice splints');
    expect(reloaded.saved['res.cdc-ticks']).toBeDefined();
  });

  it('keeps a backup and starts fresh when stored data is corrupt', () => {
    const storage = memoryStorage({ [STORAGE_KEY]: '{"version":1,"progress":"broken"' });
    const store = createUserStore(storage);
    expect(store.getStatus().recoveredFromCorruption).toBe(true);
    expect(store.getSnapshot().progress).toEqual({});
    expect(Object.keys(storage.data).some((k) => k.startsWith(`${STORAGE_KEY}:corrupt:`))).toBe(true);
  });

  it('works in memory when storage is unavailable', () => {
    const throwing: StorageLike = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
      removeItem: () => {},
    };
    const store = createUserStore(throwing);
    expect(store.getStatus().persistent).toBe(false);
    store.update((d) => setProgress(d, 'mb.first-aid.1', 'learning'));
    expect(store.getSnapshot().progress['mb.first-aid.1'].state).toBe('learning');
    expect(createUserStore(null).getStatus().persistent).toBe(false);
  });

  it('reports a failed save (for example a full quota) without throwing', () => {
    const storage = memoryStorage();
    const store = createUserStore(storage);
    storage.setItem = (k) => {
      if (k === STORAGE_KEY) throw new Error('QuotaExceededError');
    };
    expect(() => store.update((d) => setProgress(d, 'mb.first-aid.1', 'learning'))).not.toThrow();
    expect(store.getStatus().lastError).toContain('Quota');
  });

  it('clear() deletes everything', () => {
    const storage = memoryStorage();
    const store = createUserStore(storage);
    store.update((d) => setProgress(d, 'mb.first-aid.1', 'learning'));
    store.clear();
    expect(storage.data[STORAGE_KEY]).toBeUndefined();
    expect(store.getSnapshot().progress).toEqual({});
  });

  it('notifies subscribers', () => {
    const store = createUserStore(memoryStorage());
    let calls = 0;
    const unsubscribe = store.subscribe(() => calls++);
    store.update((d) => setProgress(d, 'mb.first-aid.1', 'learning'));
    store.update((d) => d);
    unsubscribe();
    store.update((d) => setProgress(d, 'mb.first-aid.1', 'ready-for-review'));
    expect(calls).toBe(1);
  });
});
