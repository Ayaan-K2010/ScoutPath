import { useCallback, useSyncExternalStore } from 'react';
import { userStore } from '../features/progress/store';
import type { UserData } from '../features/progress/schema';

export function useUserData(): UserData {
  return useSyncExternalStore(userStore.subscribe, userStore.getSnapshot, userStore.getSnapshot);
}

export function useUpdateUser() {
  return useCallback((mutator: (data: UserData) => UserData) => userStore.update(mutator), []);
}
