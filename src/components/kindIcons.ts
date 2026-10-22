import { Award, BookA, GraduationCap, Library, ListChecks, Medal, type LucideIcon } from 'lucide-react';
import type { SearchKind } from '../features/search/searchIndex';

export const KIND_ICONS: Record<SearchKind, LucideIcon> = {
  badge: Award,
  rank: Medal,
  requirement: ListChecks,
  resource: Library,
  study: GraduationCap,
  vocabulary: BookA,
};
