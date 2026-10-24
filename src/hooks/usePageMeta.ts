import { useEffect } from 'react';
import { userStore } from '../features/progress/store';
import { recordVisit } from '../features/progress/actions';
import type { RecentItem } from '../features/progress/schema';

export function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = title ? `${title} · ScoutPath` : 'ScoutPath: Every requirement. A clearer path forward.';
  }, [title]);
}

/** Records a page in "recently viewed". Stored only in this browser. */
export function useRecordVisit(item: Omit<RecentItem, 'viewedAt'> | null) {
  const key = item ? `${item.kind}:${item.id}` : '';
  useEffect(() => {
    if (!item) return;
    userStore.update((data) => recordVisit(data, item));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}
