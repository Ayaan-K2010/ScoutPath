import { uid } from '../../lib/ids';
import type { Collection } from '../progress/schema';

export function newCollection(partial: Partial<Collection> & Pick<Collection, 'title'>): Collection {
  const now = new Date().toISOString();
  return {
    id: uid('col'),
    description: '',
    resourceIds: [],
    badgeIds: [],
    requirementIds: [],
    privateNotes: '',
    origin: 'user',
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
}
