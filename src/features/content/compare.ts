/**
 * Requirement-version comparison.
 *
 * Requirement IDs embed the requirement number, so a renumbered requirement
 * looks like one removal plus one addition. Matching therefore runs in three
 * passes: same number and title, then same title under a different number
 * (renumbered), then same number with changed content (modified). Titles are
 * compared using official text instead when it is stored.
 */
import type { Requirement, RequirementVersion } from '../../schemas/content';

export interface FlatRequirement {
  id: string;
  number: string;
  title: string;
  summary: string;
  kind: string;
  officialText?: string;
  parentNumber: string | null;
}

export interface FieldChange {
  field: 'title' | 'summary' | 'kind' | 'officialText' | 'parent';
  before: string;
  after: string;
}

export interface VersionComparison {
  from: string;
  to: string;
  added: FlatRequirement[];
  removed: FlatRequirement[];
  modified: { before: FlatRequirement; after: FlatRequirement; changes: FieldChange[] }[];
  renumbered: { before: FlatRequirement; after: FlatRequirement; changes: FieldChange[] }[];
  unchanged: number;
}

export function flattenVersion(version: RequirementVersion): FlatRequirement[] {
  const out: FlatRequirement[] = [];
  const walk = (items: Requirement[], parent: Requirement | null) => {
    for (const r of items) {
      out.push({
        id: r.id,
        number: r.number,
        title: r.title,
        summary: r.summary,
        kind: r.kind,
        officialText: r.officialText,
        parentNumber: parent?.number ?? null,
      });
      walk(r.children, r);
    }
  };
  walk(version.requirements, null);
  return out;
}

function diffFields(a: FlatRequirement, b: FlatRequirement, includeParent: boolean): FieldChange[] {
  const changes: FieldChange[] = [];
  const fields = ['title', 'summary', 'kind', 'officialText'] as const;
  for (const field of fields) {
    const before = a[field] ?? '';
    const after = b[field] ?? '';
    if (before !== after) changes.push({ field, before, after });
  }
  if (includeParent && a.parentNumber !== b.parentNumber) {
    changes.push({ field: 'parent', before: a.parentNumber ?? '(top level)', after: b.parentNumber ?? '(top level)' });
  }
  return changes;
}

const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');

export function compareVersions(from: RequirementVersion, to: RequirementVersion): VersionComparison {
  const before = flattenVersion(from);
  const after = flattenVersion(to);
  const key = (r: FlatRequirement) => (r.officialText ? normalize(r.officialText) : normalize(r.title));
  const modified: VersionComparison['modified'] = [];
  const renumbered: VersionComparison['renumbered'] = [];
  let unchanged = 0;
  let restBefore = [...before];
  let restAfter = [...after];
  const take = (b: FlatRequirement, a: FlatRequirement) => {
    restBefore = restBefore.filter((x) => x !== b);
    restAfter = restAfter.filter((x) => x !== a);
  };

  // 1. Same ID, same title: unchanged, or modified in other fields.
  for (const b of before) {
    const a = restAfter.find((x) => x.id === b.id && key(x) === key(b));
    if (!a) continue;
    take(b, a);
    const changes = diffFields(b, a, true);
    if (changes.length) modified.push({ before: b, after: a, changes });
    else unchanged += 1;
  }
  // 2. Same title under a different number: renumbered.
  for (const b of [...restBefore]) {
    const a = restAfter.find((x) => key(x) === key(b));
    if (!a) continue;
    take(b, a);
    renumbered.push({ before: b, after: a, changes: diffFields(b, a, false) });
  }
  // 3. Same number with different content: modified.
  for (const b of [...restBefore]) {
    const a = restAfter.find((x) => x.id === b.id);
    if (!a) continue;
    take(b, a);
    modified.push({ before: b, after: a, changes: diffFields(b, a, true) });
  }

  return { from: from.versionId, to: to.versionId, added: restAfter, removed: restBefore, modified, renumbered, unchanged };
}

export function comparisonSummary(c: VersionComparison): string {
  return `${c.added.length} added, ${c.removed.length} removed, ${c.modified.length} modified, ${c.renumbered.length} renumbered, ${c.unchanged} unchanged`;
}
