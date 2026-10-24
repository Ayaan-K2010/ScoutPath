import { Award, BookA, GraduationCap, Library, ListChecks, Medal, type IconComponent } from './icons';
import type { SearchKind } from '../features/search/searchIndex';

export const KIND_ICONS: Record<SearchKind, IconComponent> = {
  badge: Award,
  rank: Medal,
  requirement: ListChecks,
  resource: Library,
  study: GraduationCap,
  vocabulary: BookA,
};
