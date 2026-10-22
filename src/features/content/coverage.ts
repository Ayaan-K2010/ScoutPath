/**
 * Content coverage: how close each badge and rank is to ScoutPath's
 * publication standard. The standard is deliberately strict so that the
 * interface never overstates what has been checked.
 */
import type { VerificationStatus } from '../../schemas/content';
import { leafRequirementIds, type Content } from './model';

export interface CoverageCriteria {
  /** An official source URL is recorded. */
  officialSourceKnown: boolean;
  /** The current requirement version was verified against that source. */
  sourceVersionVerified: boolean;
  /** The requirement outline is complete (not partial or outline-only). */
  requirementDataComplete: boolean;
  /** Every leaf requirement has at least one mapped resource. */
  resourcesExist: boolean;
  /** Every mapped resource link has been checked and is working. */
  linksChecked: boolean;
  /** Safety-sensitive content and resources have been reviewed. */
  safetyReviewed: boolean;
  /** All of the above. */
  readyForPublication: boolean;
}

export interface OwnerCoverage {
  ownerId: string;
  ownerType: 'badge' | 'rank';
  name: string;
  slug: string;
  rating: VerificationStatus;
  criteria: CoverageCriteria;
  leafCount: number;
  leavesWithResources: number;
  resourceCount: number;
  hasOutline: boolean;
}

export const CRITERIA_LABELS: Record<keyof CoverageCriteria, string> = {
  officialSourceKnown: 'Official source recorded',
  sourceVersionVerified: 'Requirement version verified against source',
  requirementDataComplete: 'Requirement data complete',
  resourcesExist: 'Every requirement has resources',
  linksChecked: 'Resource links checked',
  safetyReviewed: 'Safety-sensitive content reviewed',
  readyForPublication: 'Ready for publication',
};

function ownerCoverage(
  content: Content,
  args: {
    ownerId: string;
    ownerType: 'badge' | 'rank';
    name: string;
    slug: string;
    officialUrl: string | null;
    safetySensitive: boolean;
    safetyReviewed: boolean;
  },
): OwnerCoverage {
  const version = args.ownerType === 'badge' ? content.badgeById.get(args.ownerId)?.version : content.rankById.get(args.ownerId)?.version;
  const leaves = leafRequirementIds(content, args.ownerId);
  const leavesWithResources = leaves.filter((id) => (content.resourcesByRequirement.get(id)?.length ?? 0) > 0).length;
  const mapped = new Map<string, NonNullable<ReturnType<Content['resourceById']['get']>>>();
  for (const id of content.requirementOrder.get(args.ownerId) ?? []) {
    for (const { resource } of content.resourcesByRequirement.get(id) ?? []) mapped.set(resource.id, resource);
  }
  const mappedList = [...mapped.values()];
  const anySafetyRequirement = (content.requirementOrder.get(args.ownerId) ?? []).some((id) => content.requirements.get(id)?.requirement.safetySensitive);

  const criteria: CoverageCriteria = {
    officialSourceKnown: Boolean(args.officialUrl || version?.sourceUrl),
    sourceVersionVerified: version?.status === 'verified' && version.sourceCheckedOn !== null,
    requirementDataComplete: version?.completeness === 'complete',
    resourcesExist: leaves.length > 0 && leavesWithResources === leaves.length,
    linksChecked: mappedList.length > 0 && mappedList.every((r) => r.linkStatus === 'ok' && r.lastChecked !== null),
    safetyReviewed:
      !(args.safetySensitive || anySafetyRequirement) ||
      (args.safetyReviewed && mappedList.every((r) => r.safetyReview === 'approved' || r.safetyReview === 'not-required')),
    readyForPublication: false,
  };
  criteria.readyForPublication =
    criteria.officialSourceKnown &&
    criteria.sourceVersionVerified &&
    criteria.requirementDataComplete &&
    criteria.resourcesExist &&
    criteria.linksChecked &&
    criteria.safetyReviewed;

  let rating: VerificationStatus;
  if (!version) rating = 'missing';
  else if (criteria.readyForPublication) rating = 'verified';
  else if (version.status === 'needs-review') rating = 'needs-review';
  else if (criteria.sourceVersionVerified || version.status === 'partially-verified') rating = 'partially-verified';
  else rating = 'unverified';

  return {
    ownerId: args.ownerId,
    ownerType: args.ownerType,
    name: args.name,
    slug: args.slug,
    rating,
    criteria,
    leafCount: leaves.length,
    leavesWithResources,
    resourceCount: mappedList.length,
    hasOutline: Boolean(version),
  };
}

export function badgeCoverage(content: Content, badgeId: string): OwnerCoverage | null {
  const badge = content.badgeById.get(badgeId);
  if (!badge) return null;
  return ownerCoverage(content, {
    ownerId: badge.id,
    ownerType: 'badge',
    name: badge.name,
    slug: badge.slug,
    officialUrl: badge.officialUrl,
    safetySensitive: badge.detail?.safety.sensitive ?? false,
    safetyReviewed: badge.detail?.safety.reviewed ?? false,
  });
}

export function rankCoverage(content: Content, rankId: string): OwnerCoverage | null {
  const rank = content.rankById.get(rankId);
  if (!rank) return null;
  return ownerCoverage(content, {
    ownerId: rank.id,
    ownerType: 'rank',
    name: rank.name,
    slug: rank.slug,
    officialUrl: rank.officialUrl,
    safetySensitive: false,
    safetyReviewed: false,
  });
}

export interface CoverageReport {
  generatedFor: string;
  badges: OwnerCoverage[];
  ranks: OwnerCoverage[];
  totals: {
    badgesListed: number;
    badgesWithOutline: number;
    badgesByRating: Record<VerificationStatus, number>;
    ranksWithOutline: number;
    requirements: number;
    leafRequirements: number;
    leafRequirementsWithResources: number;
    resources: number;
    resourcesLinkChecked: number;
    resourcesContentReviewed: number;
    mappings: number;
  };
  requirementsWithoutResources: { id: string; owner: string; number: string; title: string }[];
  resourcesWithoutRequirements: { id: string; title: string }[];
  needsReview: { id: string; kind: string; reason: string }[];
}

export function coverageReport(content: Content): CoverageReport {
  const badges = content.badges.map((b) => badgeCoverage(content, b.id)!);
  const ranks = content.ranks.map((r) => rankCoverage(content, r.id)!);
  const byRating = { verified: 0, 'partially-verified': 0, unverified: 0, 'needs-review': 0, missing: 0 } as Record<VerificationStatus, number>;
  for (const b of badges) byRating[b.rating] += 1;

  const leaves = [...content.requirements.values()].filter((n) => n.isLeaf);
  const requirementsWithoutResources = leaves
    .filter((n) => !content.resourcesByRequirement.has(n.id))
    .map((n) => ({ id: n.id, owner: n.ownerName, number: n.requirement.number, title: n.requirement.title }));
  const resourcesWithoutRequirements = content.resources
    .filter((r) => !content.requirementsByResource.has(r.id))
    .map((r) => ({ id: r.id, title: r.title }));

  const needsReview: CoverageReport['needsReview'] = [];
  for (const b of content.badges) {
    if (b.version && b.version.status !== 'verified') needsReview.push({ id: b.id, kind: 'badge requirements', reason: `Requirement version "${b.version.versionId}" is ${b.version.status}` });
    if (b.detail && b.detail.safety.sensitive && !b.detail.safety.reviewed) needsReview.push({ id: b.id, kind: 'safety review', reason: 'Safety-sensitive badge content has not been reviewed' });
  }
  for (const r of content.ranks) {
    if (r.version && r.version.status !== 'verified') needsReview.push({ id: r.id, kind: 'rank requirements', reason: `Requirement version "${r.version.versionId}" is ${r.version.status}` });
  }
  for (const res of content.resources) {
    if (res.linkStatus !== 'ok') needsReview.push({ id: res.id, kind: 'link check', reason: `Link status is ${res.linkStatus}` });
    if (res.safetyReview === 'pending' || res.safetyReview === 'flagged') needsReview.push({ id: res.id, kind: 'safety review', reason: `Safety review is ${res.safetyReview}` });
  }
  for (const s of content.studySets) {
    if (s.status !== 'verified') needsReview.push({ id: s.id, kind: 'study set', reason: `Study set is ${s.status}` });
  }

  return {
    generatedFor: content.meta?.datasetVersion ?? 'unknown',
    badges,
    ranks,
    totals: {
      badgesListed: content.badges.length,
      badgesWithOutline: badges.filter((b) => b.hasOutline).length,
      badgesByRating: byRating,
      ranksWithOutline: ranks.filter((r) => r.hasOutline).length,
      requirements: content.requirements.size,
      leafRequirements: leaves.length,
      leafRequirementsWithResources: leaves.length - requirementsWithoutResources.length,
      resources: content.resources.length,
      resourcesLinkChecked: content.resources.filter((r) => r.linkStatus === 'ok' && r.lastChecked).length,
      resourcesContentReviewed: content.resources.filter((r) => r.contentReviewedOn).length,
      mappings: content.mappings.length,
    },
    requirementsWithoutResources,
    resourcesWithoutRequirements,
    needsReview,
  };
}
