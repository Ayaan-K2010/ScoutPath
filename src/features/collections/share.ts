/**
 * Shareable collection files. A shared export is sanitized by default:
 * private notes are left out unless the author explicitly opts in, and no
 * personal progress is ever included.
 */
import { z } from 'zod';
import type { Collection } from '../progress/schema';

export const sharedCollection = z.object({
  format: z.literal('scoutpath-collection'),
  formatVersion: z.literal(1),
  exportedAt: z.string(),
  collection: z.object({
    title: z.string().min(1).max(120),
    description: z.string().max(2000).default(''),
    resourceIds: z.array(z.string().regex(/^res\.[a-z0-9-]+$/)).max(500),
    badgeIds: z.array(z.string().regex(/^mb\.[a-z0-9-]+$/)).max(200).default([]),
    requirementIds: z.array(z.string().regex(/^(mb|rank)\.[a-z0-9-]+\.[a-z0-9]+$/)).max(500).default([]),
    privateNotes: z.string().max(10000).optional(),
  }),
});
export type SharedCollection = z.infer<typeof sharedCollection>;

export function exportCollection(c: Collection, options: { includePrivateNotes?: boolean } = {}, now = new Date().toISOString()): string {
  const payload: SharedCollection = {
    format: 'scoutpath-collection',
    formatVersion: 1,
    exportedAt: now,
    collection: {
      title: c.title,
      description: c.description,
      resourceIds: c.resourceIds,
      badgeIds: c.badgeIds,
      requirementIds: c.requirementIds,
      ...(options.includePrivateNotes && c.privateNotes ? { privateNotes: c.privateNotes } : {}),
    },
  };
  return JSON.stringify(payload, null, 2);
}

export type CollectionImport =
  | { ok: true; collection: SharedCollection['collection']; unknownResourceIds: string[] }
  | { ok: false; errors: string[] };

/** Parse and validate a shared collection file. Unknown resource IDs are dropped and reported. */
export function parseCollectionImport(text: string, knownResourceIds: Set<string>): CollectionImport {
  if (text.length > 1024 * 1024) return { ok: false, errors: ['The file is larger than 1 MB, which is too large for a collection.'] };
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, errors: ['The file is not valid JSON.'] };
  }
  const parsed = sharedCollection.safeParse(json);
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.issues.slice(0, 6).map((i) => `${i.path.join('.') || '(file)'}: ${i.message}`) };
  }
  const unknownResourceIds = parsed.data.collection.resourceIds.filter((id) => !knownResourceIds.has(id));
  return {
    ok: true,
    collection: { ...parsed.data.collection, resourceIds: parsed.data.collection.resourceIds.filter((id) => knownResourceIds.has(id)) },
    unknownResourceIds,
  };
}
