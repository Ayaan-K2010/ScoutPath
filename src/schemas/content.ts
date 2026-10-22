/**
 * Content schemas for ScoutPath's local JSON datasets.
 *
 * These schemas are shared by the app (runtime loading), the review tool,
 * the command-line content scripts and the automated tests, so there is one
 * definition of what a valid record looks like.
 */
import { z } from 'zod';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** A calendar date written as YYYY-MM-DD that also exists on the calendar. */
export const isoDate = z.string().regex(ISO_DATE, 'Expected a date in YYYY-MM-DD format').refine((value) => {
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}, 'Date does not exist on the calendar');

/** Only http(s) URLs are accepted; javascript:, data: and relative URLs are rejected. */
export const httpUrl = z.string().refine((value) => {
  try {
    const url = new URL(value);
    return (url.protocol === 'https:' || url.protocol === 'http:') && url.hostname.includes('.');
  } catch {
    return false;
  }
}, 'Expected an absolute http(s) URL');

export const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Expected a lowercase, hyphenated slug');

export const verificationStatus = z.enum(['verified', 'partially-verified', 'unverified', 'needs-review', 'missing']);
export type VerificationStatus = z.infer<typeof verificationStatus>;

export const linkStatus = z.enum(['ok', 'redirected', 'broken', 'unchecked']);
export type LinkStatus = z.infer<typeof linkStatus>;

export const reviewStatus = z.enum(['approved', 'pending', 'flagged', 'not-required']);
export type ReviewStatus = z.infer<typeof reviewStatus>;

export const provenance = z.object({
  method: z.enum(['official-structured-import', 'human-transcription', 'maintainer-draft']),
  notes: z.string().min(1),
  recordedBy: z.string().min(1),
  recordedOn: isoDate,
  references: z.array(z.object({ label: z.string().min(1), url: httpUrl })).default([]),
});
export type Provenance = z.infer<typeof provenance>;

export const requirementKind = z.enum([
  'knowledge',
  'discussion',
  'demonstration',
  'activity',
  'service',
  'leadership',
  'conference',
  'review',
  'mixed',
]);
export type RequirementKind = z.infer<typeof requirementKind>;

export interface Requirement {
  id: string;
  number: string;
  title: string;
  summary: string;
  officialText?: string;
  kind: RequirementKind;
  safetySensitive?: boolean;
  orientation?: string;
  note?: string;
  relatedRequirementIds?: string[];
  children: Requirement[];
}

export const requirement: z.ZodType<Requirement> = z.lazy(() =>
  z.object({
    id: z.string().regex(/^(mb|rank)\.[a-z0-9-]+\.[a-z0-9]+$/, 'Requirement IDs look like mb.first-aid.2a or rank.tenderfoot.4a'),
    number: z.string().regex(/^[0-9]+[a-z]?[0-9]*$/, 'Requirement numbers look like 2, 2a or 9b1'),
    title: z.string().min(2).max(90),
    summary: z.string().min(10),
    officialText: z.string().min(1).optional(),
    kind: requirementKind,
    safetySensitive: z.boolean().optional(),
    orientation: z.string().min(20).optional(),
    note: z.string().min(1).optional(),
    relatedRequirementIds: z.array(z.string()).optional(),
    children: z.array(requirement),
  }),
);

export const requirementVersion = z
  .object({
    versionId: z.string().regex(/^[a-z0-9-]+$/),
    label: z.string().min(1),
    effectiveDate: isoDate.nullable(),
    status: verificationStatus,
    completeness: z.enum(['complete', 'partial', 'outline-only']),
    wordingPolicy: z.enum(['link-only', 'reproduced-with-permission']),
    sourceUrl: httpUrl,
    sourceLinkStatus: linkStatus,
    sourceCheckedOn: isoDate.nullable(),
    supersedes: z.string().nullable().default(null),
    provenance,
    requirements: z.array(requirement).min(1),
  })
  .superRefine((version, ctx) => {
    if (version.status === 'verified' && version.sourceCheckedOn === null) {
      ctx.addIssue({ code: 'custom', message: 'A verified version must record when its source was checked', path: ['sourceCheckedOn'] });
    }
    if (version.wordingPolicy === 'link-only') {
      const walk = (items: Requirement[]) =>
        items.forEach((item) => {
          if (item.officialText) {
            ctx.addIssue({
              code: 'custom',
              message: `Requirement ${item.id} stores official wording but the version is link-only`,
              path: ['requirements'],
            });
          }
          walk(item.children);
        });
      walk(version.requirements);
    }
  });
export type RequirementVersion = z.infer<typeof requirementVersion>;

export const categoryId = z.enum([
  'outdoor',
  'nature',
  'aquatics',
  'health-safety',
  'citizenship',
  'science-tech',
  'arts-communication',
  'trades-crafts',
  'sports',
  'hobbies-heritage',
]);
export type CategoryId = z.infer<typeof categoryId>;

export const category = z.object({
  id: categoryId,
  name: z.string().min(1),
  description: z.string().min(1),
});
export type Category = z.infer<typeof category>;

export const eagleStatus = z.object({
  status: z.enum(['required', 'required-option', 'elective', 'unknown']),
  group: z.string().optional(),
  verified: z.boolean(),
  note: z.string().optional(),
});

/** A merit badge listing in the catalog index (every listed badge has one). */
export const catalogEntry = z.object({
  id: z.string().regex(/^mb\.[a-z0-9-]+$/),
  slug,
  name: z.string().min(2),
  category: categoryId,
  lifecycle: z.enum(['active', 'discontinued', 'unknown']),
  lifecycleNote: z.string().optional(),
  eagle: eagleStatus,
  catalogStatus: verificationStatus,
  officialUrl: httpUrl,
  officialUrlStatus: linkStatus,
});
export type CatalogEntry = z.infer<typeof catalogEntry>;

export const catalogFile = z.object({
  schemaVersion: z.literal(1),
  listedOn: isoDate,
  provenance,
  badges: z.array(catalogEntry).min(1),
});
export type CatalogFile = z.infer<typeof catalogFile>;

/** Detailed content for a badge that has moved beyond a bare listing. */
export const badgeDetail = z.object({
  schemaVersion: z.literal(1),
  id: z.string().regex(/^mb\.[a-z0-9-]+$/),
  slug,
  description: z.string().min(20),
  lastReviewed: isoDate.nullable(),
  safety: z.object({ sensitive: z.boolean(), reviewed: z.boolean(), note: z.string().optional() }),
  currentVersion: z.string().nullable(),
  versions: z.array(requirementVersion),
  relatedResourceIds: z.array(z.string()).default([]),
  studySetIds: z.array(z.string()).default([]),
});
export type BadgeDetail = z.infer<typeof badgeDetail>;

export const rank = z.object({
  schemaVersion: z.literal(1),
  id: z.string().regex(/^rank\.[a-z0-9-]+$/),
  slug,
  name: z.string().min(2),
  order: z.number().int().min(1).max(7),
  description: z.string().min(20),
  officialUrl: httpUrl,
  officialUrlStatus: linkStatus,
  lastReviewed: isoDate.nullable(),
  currentVersion: z.string().nullable(),
  versions: z.array(requirementVersion),
  relatedResourceIds: z.array(z.string()).default([]),
  studySetIds: z.array(z.string()).default([]),
});
export type Rank = z.infer<typeof rank>;

export const resourceType = z.enum([
  'video',
  'article',
  'official-page',
  'pdf',
  'diagram',
  'interactive',
  'podcast',
  'simulation',
  'vocabulary',
  'practice',
  'other',
]);
export type ResourceType = z.infer<typeof resourceType>;

export const publisherType = z.enum(['official-scouting', 'government', 'university', 'scientific', 'nonprofit', 'independent']);
export type PublisherType = z.infer<typeof publisherType>;

export const resource = z
  .object({
    id: z.string().regex(/^res\.[a-z0-9-]+$/),
    title: z.string().min(2),
    url: httpUrl,
    publisher: z.string().min(2),
    publisherType,
    sourceClass: z.enum(['official', 'independent']),
    type: resourceType,
    description: z.string().min(20),
    topics: z.array(z.string().min(1)).min(1),
    durationMinutes: z.number().int().positive().nullable(),
    durationVerified: z.boolean(),
    language: z.string().regex(/^[a-z]{2}(-[A-Z]{2})?$/),
    linkStatus,
    lastChecked: isoDate.nullable(),
    contentReviewedOn: isoDate.nullable(),
    verification: verificationStatus,
    safetyReview: reviewStatus,
    attribution: z.string().optional(),
    discovery: z.object({ method: z.enum(['web-search', 'maintainer', 'official-list']), on: isoDate, note: z.string().optional() }),
    notes: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.durationVerified && value.durationMinutes === null) {
      ctx.addIssue({ code: 'custom', message: 'A verified duration needs durationMinutes', path: ['durationMinutes'] });
    }
    if (value.linkStatus !== 'unchecked' && value.lastChecked === null) {
      ctx.addIssue({ code: 'custom', message: 'A checked link must record lastChecked', path: ['lastChecked'] });
    }
    if (value.sourceClass === 'official' && value.publisherType !== 'official-scouting') {
      ctx.addIssue({ code: 'custom', message: 'Only Scouting America publications are classified as official', path: ['sourceClass'] });
    }
  });
export type Resource = z.infer<typeof resource>;

export const resourcesFile = z.object({ schemaVersion: z.literal(1), resources: z.array(resource) });

export const mapping = z.object({
  resourceId: z.string(),
  requirementId: z.string(),
  relevance: z.enum(['core', 'supporting', 'background']),
  note: z.string().optional(),
});
export type Mapping = z.infer<typeof mapping>;
export const mappingsFile = z.object({ schemaVersion: z.literal(1), mappings: z.array(mapping) });

const sourced = { sourceResourceIds: z.array(z.string()).min(1, 'Every study item needs at least one source') };

export const flashcard = z.object({ id: z.string().min(1), front: z.string().min(3), back: z.string().min(3), ...sourced });
export type Flashcard = z.infer<typeof flashcard>;

export const quizQuestion = z
  .object({
    id: z.string().min(1),
    prompt: z.string().min(5),
    choices: z.array(z.string().min(1)).min(2).max(5),
    answerIndex: z.number().int().min(0),
    explanation: z.string().min(10),
    ...sourced,
  })
  .refine((q) => q.answerIndex < q.choices.length, { message: 'answerIndex is outside the choices list', path: ['answerIndex'] });
export type QuizQuestion = z.infer<typeof quizQuestion>;

export const studySet = z.object({
  id: z.string().regex(/^study\.[a-z0-9-]+$/),
  slug,
  title: z.string().min(2),
  description: z.string().min(10),
  status: verificationStatus,
  reviewedOn: isoDate.nullable(),
  badgeIds: z.array(z.string()).default([]),
  rankIds: z.array(z.string()).default([]),
  requirementIds: z.array(z.string()).default([]),
  guide: z.object({
    intro: z.string().min(10),
    sections: z.array(z.object({ heading: z.string().min(2), body: z.string().min(10), ...sourced })).min(1),
    vocabulary: z.array(z.object({ term: z.string().min(1), definition: z.string().min(5), ...sourced })),
  }),
  flashcards: z.array(flashcard),
  quiz: z.array(quizQuestion),
});
export type StudySet = z.infer<typeof studySet>;
export const studyFile = z.object({ schemaVersion: z.literal(1), sets: z.array(studySet) });

export const collectionTemplate = z.object({
  id: z.string().regex(/^tpl\.[a-z0-9-]+$/),
  title: z.string().min(2),
  description: z.string().min(10),
  resourceIds: z.array(z.string()).min(1),
  badgeIds: z.array(z.string()).default([]),
  requirementIds: z.array(z.string()).default([]),
});
export type CollectionTemplate = z.infer<typeof collectionTemplate>;
export const templatesFile = z.object({ schemaVersion: z.literal(1), templates: z.array(collectionTemplate) });

export const categoriesFile = z.object({ schemaVersion: z.literal(1), categories: z.array(category) });

export const datasetMeta = z.object({
  schemaVersion: z.literal(1),
  datasetVersion: z.string().min(1),
  updatedOn: isoDate,
  environmentNote: z.string(),
});
export type DatasetMeta = z.infer<typeof datasetMeta>;
