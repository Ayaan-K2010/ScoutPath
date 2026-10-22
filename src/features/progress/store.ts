/**
 * A small external store for personal data, persisted to localStorage.
 *
 * - If storage is unavailable (private mode, blocked cookies, quota), the app
 *   keeps working in memory and reports `persistent: false`.
 * - If stored data is malformed, it is preserved under a backup key and the
 *   app starts fresh instead of crashing or silently discarding it.
 */
import { emptyUserData, userData, type UserData } from './schema';

export const STORAGE_KEY = 'scoutpath:user:v1';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface StoreStatus {
  persistent: boolean;
  recoveredFromCorruption: boolean;
  lastError: string | null;
}

export interface UserStore {
  getSnapshot(): UserData;
  getStatus(): StoreStatus;
  subscribe(listener: () => void): () => void;
  update(mutator: (draft: UserData) => UserData): void;
  replace(next: UserData): void;
  clear(): void;
}

function probe(storage: StorageLike | null): boolean {
  if (!storage) return false;
  try {
    const key = '__scoutpath_probe__';
    storage.setItem(key, '1');
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export function createUserStore(storage: StorageLike | null, now: () => string = () => new Date().toISOString()): UserStore {
  const status: StoreStatus = { persistent: probe(storage), recoveredFromCorruption: false, lastError: null };
  let state: UserData = emptyUserData(now());

  if (status.persistent && storage) {
    let stored: string | null = null;
    try {
      stored = storage.getItem(STORAGE_KEY);
    } catch (error) {
      status.lastError = (error as Error).message;
    }
    if (stored) {
      let parsed: ReturnType<typeof userData.safeParse> | null;
      try {
        parsed = userData.safeParse(JSON.parse(stored));
      } catch {
        parsed = null; // Not even valid JSON.
      }
      if (parsed?.success) {
        state = parsed.data;
      } else {
        status.recoveredFromCorruption = true;
        try {
          storage.setItem(`${STORAGE_KEY}:corrupt:${Date.now()}`, stored);
        } catch (error) {
          status.lastError = (error as Error).message;
        }
      }
    }
  }

  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((l) => l());

  const persist = () => {
    if (!status.persistent || !storage) return;
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(state));
      status.lastError = null;
    } catch (error) {
      status.lastError = (error as Error).message || 'Could not save to browser storage';
    }
  };

  return {
    getSnapshot: () => state,
    getStatus: () => status,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    update(mutator) {
      const next = mutator(state);
      if (next === state) return;
      state = { ...next, updatedAt: now() };
      persist();
      emit();
    },
    replace(next) {
      state = next;
      persist();
      emit();
    },
    clear() {
      state = emptyUserData(now());
      if (status.persistent && storage) {
        try {
          storage.removeItem(STORAGE_KEY);
        } catch (error) {
          status.lastError = (error as Error).message;
        }
      }
      emit();
    },
  };
}

function browserStorage(): StorageLike | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

export const userStore = createUserStore(browserStorage());
