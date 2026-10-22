/**
 * Cross-reference validation that schemas alone cannot express:
 * duplicate IDs, dangling references, malformed requirement trees,
 * duplicate mappings and records that are missing their provenance trail.
 */
import type { Requirement, RequirementVersion } from '../../schemas/content';
import { buildContent, type Content, type ContentIssue, type RawContent } from './model';

function duplicates(values: string[]): string[] {
  const seen = new Set<string>();
  const dupes = new Set<string>();
  for (const v of values) {
    if (seen.has(v)) dupes.add(v);
    seen.add(v);
  }
  return [...dupes];
}

function checkRequirementTree(
  version: RequirementVersion,
  owner: { prefix: 'mb' | 'rank'; slug: string; id: string },
  file: string,
  issues: ContentIssue[],
) {
  const walk = (items: Requirement[], parent: Requirement | null) => {
    const numbers = items.map((i) => i.number);
    for (const dupe of duplicates(numbers)) {
      issues.push({ severity: 'error', code: 'duplicate-number', message: `Requirement number ${dupe} appears twice at the same level`, file, recordId: owner.id });
    }
    for (const item of items) {
      const expectedId = `${owner.prefix}.${owner.slug}.${item.number}`;
      if (item.id !== expectedId) {
        issues.push({ severity: 'error', code: 'malformed-requirement', message: `Requirement ${item.id} should have the ID ${expectedId} to match its number`, file, recordId: item.id });
      }
      if (parent && !item.number.startsWith(parent.number)) {
        issues.push({ severity: 'error', code: 'malformed-requirement', message: `Sub-requirement ${item.number} is nested under ${parent.number} but its number does not start with the parent number`, file, recordId: item.id });
      }
      if (parent && item.number === parent.number) {
        issues.push({ severity: 'error', code: 'malformed-requirement', message: `Sub-requirement ${item.id} repeats its parent number`, file, recordId: item.id });
      }
      walk(item.children, item);
    }
  };
  walk(version.requirements, null);
}

export function validateContent(content: Content, initialIssues: ContentIssue[] = []): ContentIssue[] {
  const issues = [...initialIssues];

  const idGroups: [string, string[]][] = [
    ['badge', content.badges.map((b) => b.id)],
    ['badge slug', content.badges.map((b) => b.slug)],
    ['rank', content.ranks.map((r) => r.id)],
    ['rank order', content.ranks.map((r) => String(r.order))],
    ['resource', content.resources.map((r) => r.id)],
    ['study set', content.studySets.map((s) => s.id)],
    ['study set slug', content.studySets.map((s) => s.slug)],
    ['collection template', content.templates.map((t) => t.id)],
  ];
  for (const [label, ids] of idGroups) {
    for (const dupe of duplicates(ids)) {
      issues.push({ severity: 'error', code: 'duplicate-id', message: `Duplicate ${label}: ${dupe}`, recordId: dupe });
    }
  }

  // Requirement IDs must be globally unique across every owner and version in use.
  const allRequirementIds: string[] = [];
  const collect = (items: Requirement[]) => items.forEach((r) => (allRequirementIds.push(r.id), collect(r.children)));

  for (const badge of content.badges) {
    const file = `badges/${badge.slug}.json`;
    const detail = badge.detail;
    if (!detail) continue;
    if (detail.id !== badge.id) {
      issues.push({ severity: 'error', code: 'id-mismatch', message: `Detail file ID ${detail.id} does not match catalog ID ${badge.id}`, file, recordId: badge.id });
    }
    for (const dupe of duplicates(detail.versions.map((v) => v.versionId))) {
      issues.push({ severity: 'error', code: 'duplicate-version', message: `Version ${dupe} is stored twice`, file, recordId: badge.id });
    }
    for (const version of detail.versions) {
      if (version.supersedes && !detail.versions.some((v) => v.versionId === version.supersedes)) {
        issues.push({ severity: 'error', code: 'missing-version', message: `Version ${version.versionId} supersedes ${version.supersedes}, which is not stored. Historical versions must be preserved.`, file, recordId: badge.id });
      }
      checkRequirementTree(version, { prefix: 'mb', slug: badge.slug, id: badge.id }, file, issues);
    }
    if (badge.version) collect(badge.version.requirements);
    if (detail.versions.length === 0) {
      issues.push({ severity: 'warning', code: 'missing-content', message: `${badge.name} has a detail record but no requirement outline yet`, file, recordId: badge.id });
    }
    for (const id of detail.relatedResourceIds) {
      if (!content.resourceById.has(id)) issues.push({ severity: 'error', code: 'missing-resource', message: `Related resource ${id} does not exist`, file, recordId: badge.id });
    }
    for (const id of detail.studySetIds) {
      if (!content.studyById.has(id)) issues.push({ severity: 'error', code: 'missing-study-set', message: `Study set ${id} does not exist`, file, recordId: badge.id });
    }
  }

  for (const rank of content.ranks) {
    const file = `ranks/${rank.slug}.json`;
    for (const dupe of duplicates(rank.versions.map((v) => v.versionId))) {
      issues.push({ severity: 'error', code: 'duplicate-version', message: `Version ${dupe} is stored twice`, file, recordId: rank.id });
    }
    for (const version of rank.versions) {
      if (version.supersedes && !rank.versions.some((v) => v.versionId === version.supersedes)) {
        issues.push({ severity: 'error', code: 'missing-version', message: `Version ${version.versionId} supersedes ${version.supersedes}, which is not stored`, file, recordId: rank.id });
      }
      checkRequirementTree(version, { prefix: 'rank', slug: rank.slug, id: rank.id }, file, issues);
    }
    if (rank.version) collect(rank.version.requirements);
    for (const id of rank.relatedResourceIds) {
      if (!content.resourceById.has(id)) issues.push({ severity: 'error', code: 'missing-resource', message: `Related resource ${id} does not exist`, file, recordId: rank.id });
    }
    for (const id of rank.studySetIds) {
      if (!content.studyById.has(id)) issues.push({ severity: 'error', code: 'missing-study-set', message: `Study set ${id} does not exist`, file, recordId: rank.id });
    }
  }

  for (const dupe of duplicates(allRequirementIds)) {
    issues.push({ severity: 'error', code: 'duplicate-id', message: `Duplicate requirement ID: ${dupe}`, recordId: dupe });
  }

  for (const node of content.requirements.values()) {
    for (const related of node.requirement.relatedRequirementIds ?? []) {
      if (!content.requirements.has(related)) {
        issues.push({ severity: 'error', code: 'missing-requirement', message: `${node.id} links to related requirement ${related}, which does not exist`, recordId: node.id });
      }
    }
  }

  const mappingKeys = content.mappings.map((m) => `${m.resourceId} → ${m.requirementId}`);
  for (const dupe of duplicates(mappingKeys)) {
    issues.push({ severity: 'error', code: 'duplicate-mapping', message: `Duplicate mapping ${dupe}`, file: 'mappings.json' });
  }
  for (const m of content.mappings) {
    if (!content.resourceById.has(m.resourceId)) {
      issues.push({ severity: 'error', code: 'missing-resource', message: `Mapping references missing resource ${m.resourceId}`, file: 'mappings.json', recordId: m.resourceId });
    }
    if (!content.requirements.has(m.requirementId)) {
      issues.push({ severity: 'error', code: 'missing-requirement', message: `Mapping references missing requirement ${m.requirementId}`, file: 'mappings.json', recordId: m.requirementId });
    }
  }

  for (const set of content.studySets) {
    for (const dupe of duplicates([...set.flashcards.map((c) => c.id), ...set.quiz.map((q) => q.id)])) {
      issues.push({ severity: 'error', code: 'duplicate-id', message: `Duplicate study item ID ${dupe} in ${set.id}`, file: 'study.json', recordId: set.id });
    }
    const sources = [
      ...set.guide.sections.flatMap((s) => s.sourceResourceIds),
      ...set.guide.vocabulary.flatMap((v) => v.sourceResourceIds),
      ...set.flashcards.flatMap((c) => c.sourceResourceIds),
      ...set.quiz.flatMap((q) => q.sourceResourceIds),
    ];
    for (const id of new Set(sources)) {
      if (!content.resourceById.has(id)) issues.push({ severity: 'error', code: 'missing-source', message: `Study set ${set.id} cites missing source ${id}`, file: 'study.json', recordId: set.id });
    }
    for (const id of set.badgeIds) if (!content.badgeById.has(id)) issues.push({ severity: 'error', code: 'missing-badge', message: `Study set ${set.id} references missing badge ${id}`, file: 'study.json', recordId: set.id });
    for (const id of set.rankIds) if (!content.rankById.has(id)) issues.push({ severity: 'error', code: 'missing-rank', message: `Study set ${set.id} references missing rank ${id}`, file: 'study.json', recordId: set.id });
    for (const id of set.requirementIds) if (!content.requirements.has(id)) issues.push({ severity: 'error', code: 'missing-requirement', message: `Study set ${set.id} references missing requirement ${id}`, file: 'study.json', recordId: set.id });
  }

  for (const t of content.templates) {
    for (const id of t.resourceIds) if (!content.resourceById.has(id)) issues.push({ severity: 'error', code: 'missing-resource', message: `Template ${t.id} references missing resource ${id}`, file: 'collection-templates.json', recordId: t.id });
    for (const id of t.badgeIds) if (!content.badgeById.has(id)) issues.push({ severity: 'error', code: 'missing-badge', message: `Template ${t.id} references missing badge ${id}`, file: 'collection-templates.json', recordId: t.id });
    for (const id of t.requirementIds) if (!content.requirements.has(id)) issues.push({ severity: 'error', code: 'missing-requirement', message: `Template ${t.id} references missing requirement ${id}`, file: 'collection-templates.json', recordId: t.id });
  }

  // Informational: coverage gaps are expected while the library grows, so they are not errors.
  for (const node of content.requirements.values()) {
    if (node.isLeaf && !content.resourcesByRequirement.has(node.id)) {
      issues.push({ severity: 'info', code: 'requirement-without-resources', message: `${node.ownerName} ${node.requirement.number} has no mapped resources`, recordId: node.id });
    }
  }
  for (const resource of content.resources) {
    if (!content.requirementsByResource.has(resource.id)) {
      issues.push({ severity: 'info', code: 'resource-without-requirements', message: `${resource.id} is not mapped to any requirement`, recordId: resource.id });
    }
  }

  return issues;
}

/** Parse, index and validate raw content in one step. */
export function validateRaw(raw: RawContent): { content: Content; issues: ContentIssue[] } {
  const { content, issues } = buildContent(raw);
  return { content, issues: validateContent(content, issues) };
}

export function summarizeIssues(issues: ContentIssue[]) {
  return {
    errors: issues.filter((i) => i.severity === 'error').length,
    warnings: issues.filter((i) => i.severity === 'warning').length,
    info: issues.filter((i) => i.severity === 'info').length,
  };
}
