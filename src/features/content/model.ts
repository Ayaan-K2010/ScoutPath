/**
 * Builds the in-memory content index from raw JSON inputs.
 *
 * `buildContent` is environment-agnostic: the browser passes statically
 * imported JSON, while the Node scripts pass files read from disk. Invalid
 * records are dropped from the index and reported as issues, so one bad file
 * never takes the whole application down.
 */
import {
  badgeDetail,
  catalogFile,
  categoriesFile,
  datasetMeta,
  mappingsFile,
  rank as rankSchema,
  resourcesFile,
  studyFile,
  templatesFile,
  type BadgeDetail,
  type CatalogEntry,
  type Category,
  type CollectionTemplate,
  type DatasetMeta,
  type Mapping,
  type Rank,
  type Requirement,
  type RequirementVersion,
  type Resource,
  type StudySet,
} from '../../schemas/content';
import type { z } from 'zod';

export interface RawContent {
  meta: unknown;
  categories: unknown;
  catalog: unknown;
  badgeDetails: Record<string, unknown>;
  ranks: Record<string, unknown>;
  resources: unknown;
  mappings: unknown;
  study: unknown;
  templates: unknown;
}

export interface ContentIssue {
  severity: 'error' | 'warning' | 'info';
  code: string;
  message: string;
  file?: string;
  recordId?: string;
}

export type OwnerType = 'badge' | 'rank';

export interface Badge extends CatalogEntry {
  detail: BadgeDetail | null;
  version: RequirementVersion | null;
}

export interface RankRecord extends Rank {
  version: RequirementVersion | null;
}

export interface RequirementNode {
  requirement: Requirement;
  id: string;
  ownerType: OwnerType;
  ownerId: string;
  ownerSlug: string;
  ownerName: string;
  parentId: string | null;
  depth: number;
  isLeaf: boolean;
  childIds: string[];
  versionId: string;
  path: string;
}

export interface MappedResource {
  resource: Resource;
  mapping: Mapping;
}

export interface Content {
  meta: DatasetMeta | null;
  categories: Category[];
  badges: Badge[];
  ranks: RankRecord[];
  resources: Resource[];
  mappings: Mapping[];
  studySets: StudySet[];
  templates: CollectionTemplate[];
  badgeBySlug: Map<string, Badge>;
  badgeById: Map<string, Badge>;
  rankBySlug: Map<string, RankRecord>;
  rankById: Map<string, RankRecord>;
  resourceById: Map<string, Resource>;
  studyBySlug: Map<string, StudySet>;
  studyById: Map<string, StudySet>;
  requirements: Map<string, RequirementNode>;
  /** Requirement IDs in document order, per owner. */
  requirementOrder: Map<string, string[]>;
  resourcesByRequirement: Map<string, MappedResource[]>;
  requirementsByResource: Map<string, { node: RequirementNode; mapping: Mapping }[]>;
}

export function ownerPath(type: OwnerType, slug: string): string {
  return type === 'badge' ? `/merit-badges/${slug}` : `/ranks/${slug}`;
}

export function requirementPath(type: OwnerType, slug: string, number: string): string {
  return `${ownerPath(type, slug)}/requirements/${number}`;
}

function formatZodIssues(error: z.ZodError): string {
  return error.issues
    .slice(0, 4)
    .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('; ');
}

function parseOr<T>(schema: z.ZodType<T>, value: unknown, file: string, issues: ContentIssue[], recordId?: string): T | null {
  const result = schema.safeParse(value);
  if (result.success) return result.data;
  issues.push({ severity: 'error', code: 'schema', message: formatZodIssues(result.error), file, recordId });
  return null;
}

/** Validate each element of an array separately so one bad record does not drop its neighbours. */
function parseEach<T extends { id: string }>(schema: z.ZodType<T>, values: unknown, file: string, issues: ContentIssue[]): T[] {
  if (!Array.isArray(values)) return [];
  const out: T[] = [];
  values.forEach((value, index) => {
    const id = typeof value === 'object' && value && 'id' in value ? String((value as { id: unknown }).id) : `#${index}`;
    const parsed = parseOr(schema, value, file, issues, id);
    if (parsed) out.push(parsed);
  });
  return out;
}

function currentVersionOf(
  versions: RequirementVersion[],
  currentVersion: string | null,
  ownerId: string,
  file: string,
  issues: ContentIssue[],
): RequirementVersion | null {
  if (currentVersion === null) return null;
  const found = versions.find((v) => v.versionId === currentVersion);
  if (!found) {
    issues.push({ severity: 'error', code: 'missing-version', message: `currentVersion "${currentVersion}" is not among the stored versions`, file, recordId: ownerId });
    return null;
  }
  return found;
}

export function flattenRequirements(
  requirements: Requirement[],
  owner: { type: OwnerType; id: string; slug: string; name: string; versionId: string },
): RequirementNode[] {
  const out: RequirementNode[] = [];
  const walk = (items: Requirement[], parentId: string | null, depth: number) => {
    for (const requirement of items) {
      out.push({
        requirement,
        id: requirement.id,
        ownerType: owner.type,
        ownerId: owner.id,
        ownerSlug: owner.slug,
        ownerName: owner.name,
        parentId,
        depth,
        isLeaf: requirement.children.length === 0,
        childIds: requirement.children.map((c) => c.id),
        versionId: owner.versionId,
        path: requirementPath(owner.type, owner.slug, requirement.number),
      });
      walk(requirement.children, requirement.id, depth + 1);
    }
  };
  walk(requirements, null, 0);
  return out;
}

export function buildContent(raw: RawContent): { content: Content; issues: ContentIssue[] } {
  const issues: ContentIssue[] = [];

  const meta = parseOr(datasetMeta, raw.meta, 'meta.json', issues);
  const categories = parseOr(categoriesFile, raw.categories, 'categories.json', issues)?.categories ?? [];

  // The catalog is parsed entry by entry so a single malformed listing is skipped, not the whole catalog.
  const catalogRaw = (raw.catalog ?? {}) as { badges?: unknown };
  const catalogHeader = catalogFile.omit({ badges: true }).safeParse(raw.catalog);
  if (!catalogHeader.success) {
    issues.push({ severity: 'error', code: 'schema', message: formatZodIssues(catalogHeader.error), file: 'catalog.json' });
  }
  const catalogEntries = parseEach(catalogFile.shape.badges.element, catalogRaw.badges, 'catalog.json', issues);

  const details = new Map<string, BadgeDetail>();
  for (const [file, value] of Object.entries(raw.badgeDetails)) {
    const parsed = parseOr(badgeDetail, value, file, issues);
    if (parsed) details.set(parsed.slug, parsed);
  }

  const badges: Badge[] = catalogEntries.map((entry) => {
    const detail = details.get(entry.slug) ?? null;
    const version = detail ? currentVersionOf(detail.versions, detail.currentVersion, entry.id, `badges/${entry.slug}.json`, issues) : null;
    return { ...entry, detail, version };
  });
  const listed = new Set(catalogEntries.map((e) => e.slug));
  for (const slug of details.keys()) {
    if (!listed.has(slug)) {
      issues.push({ severity: 'error', code: 'orphan-detail', message: `Detail file for ${slug} has no catalog listing, so it would never be shown`, file: `badges/${slug}.json` });
    }
  }

  const ranks: RankRecord[] = [];
  for (const [file, value] of Object.entries(raw.ranks)) {
    const parsed = parseOr(rankSchema, value, file, issues);
    if (parsed) ranks.push({ ...parsed, version: currentVersionOf(parsed.versions, parsed.currentVersion, parsed.id, file, issues) });
  }
  ranks.sort((a, b) => a.order - b.order);

  const resourcesRaw = (raw.resources ?? {}) as { resources?: unknown };
  const resources = parseEach(resourcesFile.shape.resources.element, resourcesRaw.resources, 'resources.json', issues);
  const mappings = parseOr(mappingsFile, raw.mappings, 'mappings.json', issues)?.mappings ?? [];
  const studyRaw = (raw.study ?? {}) as { sets?: unknown };
  const studySets = parseEach(studyFile.shape.sets.element, studyRaw.sets, 'study.json', issues);
  const templates = parseOr(templatesFile, raw.templates, 'collection-templates.json', issues)?.templates ?? [];

  const requirements = new Map<string, RequirementNode>();
  const requirementOrder = new Map<string, string[]>();
  const addOwner = (type: OwnerType, id: string, slug: string, name: string, version: RequirementVersion | null) => {
    if (!version) {
      requirementOrder.set(id, []);
      return;
    }
    const nodes = flattenRequirements(version.requirements, { type, id, slug, name, versionId: version.versionId });
    requirementOrder.set(
      id,
      nodes.map((n) => n.id),
    );
    for (const node of nodes) {
      if (!requirements.has(node.id)) requirements.set(node.id, node);
    }
  };
  badges.forEach((b) => addOwner('badge', b.id, b.slug, b.name, b.version));
  ranks.forEach((r) => addOwner('rank', r.id, r.slug, r.name, r.version));

  const resourceById = new Map(resources.map((r) => [r.id, r]));
  const resourcesByRequirement = new Map<string, MappedResource[]>();
  const requirementsByResource = new Map<string, { node: RequirementNode; mapping: Mapping }[]>();
  const relevanceRank = { core: 0, supporting: 1, background: 2 } as const;
  for (const mapping of mappings) {
    const resource = resourceById.get(mapping.resourceId);
    const node = requirements.get(mapping.requirementId);
    if (!resource || !node) continue;
    const list = resourcesByRequirement.get(node.id) ?? [];
    if (!list.some((m) => m.resource.id === resource.id)) list.push({ resource, mapping });
    resourcesByRequirement.set(node.id, list);
    const back = requirementsByResource.get(resource.id) ?? [];
    back.push({ node, mapping });
    requirementsByResource.set(resource.id, back);
  }
  for (const list of resourcesByRequirement.values()) {
    list.sort((a, b) => relevanceRank[a.mapping.relevance] - relevanceRank[b.mapping.relevance]);
  }

  const content: Content = {
    meta,
    categories,
    badges,
    ranks,
    resources,
    mappings,
    studySets,
    templates,
    badgeBySlug: new Map(badges.map((b) => [b.slug, b])),
    badgeById: new Map(badges.map((b) => [b.id, b])),
    rankBySlug: new Map(ranks.map((r) => [r.slug, r])),
    rankById: new Map(ranks.map((r) => [r.id, r])),
    resourceById,
    studyBySlug: new Map(studySets.map((s) => [s.slug, s])),
    studyById: new Map(studySets.map((s) => [s.id, s])),
    requirements,
    requirementOrder,
    resourcesByRequirement,
    requirementsByResource,
  };
  return { content, issues };
}

/** Leaf requirements of an owner in document order — the unit used for progress and planning. */
export function leafRequirementIds(content: Content, ownerId: string): string[] {
  return (content.requirementOrder.get(ownerId) ?? []).filter((id) => content.requirements.get(id)?.isLeaf);
}

/** All descendant leaf IDs of a requirement (or the requirement itself when it is a leaf). */
export function leafIdsUnder(content: Content, requirementId: string): string[] {
  const node = content.requirements.get(requirementId);
  if (!node) return [];
  if (node.isLeaf) return [node.id];
  return node.childIds.flatMap((id) => leafIdsUnder(content, id));
}

export function findRequirement(content: Content, type: OwnerType, slug: string, number: string): RequirementNode | null {
  const prefix = type === 'badge' ? 'mb' : 'rank';
  return content.requirements.get(`${prefix}.${slug}.${number.toLowerCase()}`) ?? null;
}

export function ownerOf(content: Content, node: RequirementNode): Badge | RankRecord | null {
  return node.ownerType === 'badge' ? (content.badgeById.get(node.ownerId) ?? null) : (content.rankById.get(node.ownerId) ?? null);
}

export function versionOfOwner(content: Content, ownerId: string): RequirementVersion | null {
  return content.badgeById.get(ownerId)?.version ?? content.rankById.get(ownerId)?.version ?? null;
}
