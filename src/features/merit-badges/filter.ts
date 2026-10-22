/**
 * Catalog filtering and sorting for the merit badge library.
 */
import type { CategoryId, ResourceType } from '../../schemas/content';
import type { Badge, Content } from '../content/model';

export interface CatalogFilters {
  query: string;
  categories: CategoryId[];
  eagleOnly: boolean;
  outlinedOnly: boolean;
  resourceTypes: ResourceType[];
  sort: 'alpha' | 'reviewed';
}

export const DEFAULT_FILTERS: CatalogFilters = { query: '', categories: [], eagleOnly: false, outlinedOnly: false, resourceTypes: [], sort: 'alpha' };

export function badgeResourceTypes(content: Content, badge: Badge): Set<ResourceType> {
  const types = new Set<ResourceType>();
  for (const id of content.requirementOrder.get(badge.id) ?? []) {
    for (const { resource } of content.resourcesByRequirement.get(id) ?? []) types.add(resource.type);
  }
  for (const id of badge.detail?.relatedResourceIds ?? []) {
    const r = content.resourceById.get(id);
    if (r) types.add(r.type);
  }
  return types;
}

function matchesQuery(content: Content, badge: Badge, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystacks = [badge.name, badge.detail?.description ?? '', content.categories.find((c) => c.id === badge.category)?.name ?? ''];
  for (const id of content.requirementOrder.get(badge.id) ?? []) {
    const req = content.requirements.get(id)?.requirement;
    if (req) haystacks.push(req.title, req.summary, req.number);
  }
  for (const id of content.requirementOrder.get(badge.id) ?? []) {
    for (const { resource } of content.resourcesByRequirement.get(id) ?? []) haystacks.push(...resource.topics);
  }
  const words = q.split(/\s+/).filter(Boolean);
  const text = haystacks.join(' ').toLowerCase();
  return words.every((w) => text.includes(w));
}

export function filterBadges(content: Content, filters: CatalogFilters): Badge[] {
  const out = content.badges.filter((b) => {
    if (filters.categories.length && !filters.categories.includes(b.category)) return false;
    if (filters.eagleOnly && b.eagle.status !== 'required' && b.eagle.status !== 'required-option') return false;
    if (filters.outlinedOnly && !b.version) return false;
    if (filters.resourceTypes.length) {
      const types = badgeResourceTypes(content, b);
      if (!filters.resourceTypes.some((t) => types.has(t))) return false;
    }
    return matchesQuery(content, b, filters.query);
  });
  if (filters.sort === 'reviewed') {
    const key = (b: Badge) => b.detail?.lastReviewed ?? (b.version ? b.version.provenance.recordedOn : '');
    return out.sort((a, b) => key(b).localeCompare(key(a)) || a.name.localeCompare(b.name));
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}
