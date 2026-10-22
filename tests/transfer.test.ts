import { describe, expect, it } from 'vitest';
import { exportCollection, parseCollectionImport } from '../src/features/collections/share';
import { setNote, setProgress, toggleSaved, upsertCollection } from '../src/features/progress/actions';
import { emptyUserData, type Collection } from '../src/features/progress/schema';
import { exportUserData, mergeUserData, parseUserDataImport } from '../src/features/progress/transfer';

const collection: Collection = {
  id: 'col-1',
  title: 'First Aid workshop',
  description: 'Saturday session',
  resourceIds: ['res.cdc-ticks', 'res.redcross-burns'],
  badgeIds: ['mb.first-aid'],
  requirementIds: ['mb.first-aid.2c'],
  privateNotes: 'Call the Smith family about rides',
  origin: 'user',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('personal data export and import', () => {
  it('round-trips an export', () => {
    let data = setProgress(emptyUserData(), 'mb.first-aid.2a', 'learning');
    data = toggleSaved(data, 'res.cdc-ticks');
    const result = parseUserDataImport(exportUserData(data));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.progress['mb.first-aid.2a'].state).toBe('learning');
      expect(result.summary.saved).toBe(1);
    }
  });

  it('rejects malformed JSON, wrong files and invalid fields', () => {
    expect(parseUserDataImport('{not json').ok).toBe(false);
    expect(parseUserDataImport(JSON.stringify({ hello: 'world' })).ok).toBe(false);
    const bad = JSON.parse(exportUserData(emptyUserData()));
    bad.data.progress = { 'mb.first-aid.1': { state: 'officially-approved', updatedAt: '2026-01-01T00:00:00Z' } };
    const result = parseUserDataImport(JSON.stringify(bad));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join(' ')).toMatch(/progress/);
  });

  it('points shared collection files to the right importer', () => {
    const result = parseUserDataImport(exportCollection(collection));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors[0]).toMatch(/Collections page/);
  });

  it('rejects oversized files', () => {
    expect(parseUserDataImport('x'.repeat(6 * 1024 * 1024)).ok).toBe(false);
  });

  it('merges without losing existing data and keeps the newest edits', () => {
    let current = setProgress(emptyUserData(), 'a', 'learning');
    current = { ...current, progress: { a: { state: 'learning', updatedAt: '2026-03-01T00:00:00Z' } } };
    current = setNote(current, 'n', 'mine');
    current = upsertCollection(current, collection);
    let incoming = emptyUserData();
    incoming = { ...incoming, progress: { a: { state: 'completed-personal', updatedAt: '2026-02-01T00:00:00Z' }, b: { state: 'learning', updatedAt: '2026-02-01T00:00:00Z' } } };
    incoming = toggleSaved(incoming, 'res.x');
    incoming = upsertCollection(incoming, { ...collection, title: 'Changed elsewhere' });
    const merged = mergeUserData(current, incoming);
    expect(merged.progress.a.state).toBe('learning');
    expect(merged.progress.b.state).toBe('learning');
    expect(merged.notes.n.text).toBe('mine');
    expect(merged.saved['res.x']).toBeDefined();
    expect(merged.collections).toHaveLength(1);
    expect(merged.collections[0].title).toBe('First Aid workshop');
  });
});

describe('shared collections', () => {
  const known = new Set(['res.cdc-ticks', 'res.redcross-burns']);

  it('leaves private notes out by default and never includes progress', () => {
    const file = JSON.parse(exportCollection(collection));
    expect(file.collection.privateNotes).toBeUndefined();
    expect(JSON.stringify(file)).not.toContain('Smith');
    expect(Object.keys(file.collection).sort()).toEqual(['badgeIds', 'description', 'requirementIds', 'resourceIds', 'title']);
  });

  it('includes private notes only when asked', () => {
    expect(JSON.parse(exportCollection(collection, { includePrivateNotes: true })).collection.privateNotes).toBe(collection.privateNotes);
  });

  it('validates imports and drops unknown resources', () => {
    const text = exportCollection({ ...collection, resourceIds: [...collection.resourceIds, 'res.removed-later'] });
    const result = parseCollectionImport(text, known);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.collection.resourceIds).toEqual(['res.cdc-ticks', 'res.redcross-burns']);
      expect(result.unknownResourceIds).toEqual(['res.removed-later']);
    }
  });

  it('rejects malformed collection files', () => {
    expect(parseCollectionImport('[]', known).ok).toBe(false);
    expect(parseCollectionImport('{"format":"scoutpath-collection","formatVersion":1,"exportedAt":"x","collection":{"title":"","resourceIds":[]}}', known).ok).toBe(false);
    expect(parseCollectionImport('{"format":"scoutpath-collection","formatVersion":1,"exportedAt":"x","collection":{"title":"T","resourceIds":["javascript:alert(1)"]}}', known).ok).toBe(false);
    expect(parseCollectionImport('nope', known).ok).toBe(false);
  });
});
