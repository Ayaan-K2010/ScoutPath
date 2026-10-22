import type { RawContent } from '../src/features/content/model';

const provenance = { method: 'maintainer-draft', notes: 'Fixture', recordedBy: 'tests', recordedOn: '2026-01-01', references: [] };

export function version(overrides: Record<string, unknown> = {}) {
  return {
    versionId: 'v1',
    label: 'Fixture version',
    effectiveDate: null,
    status: 'unverified',
    completeness: 'complete',
    wordingPolicy: 'link-only',
    sourceUrl: 'https://example.org/official',
    sourceLinkStatus: 'unchecked',
    sourceCheckedOn: null,
    supersedes: null,
    provenance,
    requirements: [
      { id: 'mb.knots.1', number: '1', title: 'Knot basics', summary: 'Tying and using basic knots.', kind: 'demonstration', children: [] },
      {
        id: 'mb.knots.2',
        number: '2',
        title: 'Lashings',
        summary: 'Joining poles with lashings.',
        kind: 'mixed',
        children: [
          { id: 'mb.knots.2a', number: '2a', title: 'Square lashing', summary: 'Binding crossed poles.', kind: 'demonstration', children: [] },
          { id: 'mb.knots.2b', number: '2b', title: 'Shear lashing', summary: 'Binding parallel poles.', kind: 'demonstration', children: [] },
        ],
      },
    ],
    ...overrides,
  };
}

export function resource(id: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    title: `Resource ${id}`,
    url: `https://example.org/${id}`,
    publisher: 'Example Publisher',
    publisherType: 'nonprofit',
    sourceClass: 'independent',
    type: 'article',
    description: 'An example resource used only in automated tests.',
    topics: ['knots'],
    durationMinutes: null,
    durationVerified: false,
    language: 'en',
    linkStatus: 'unchecked',
    lastChecked: null,
    contentReviewedOn: null,
    verification: 'unverified',
    safetyReview: 'not-required',
    discovery: { method: 'maintainer', on: '2026-01-01' },
    ...overrides,
  };
}

/** A small, fully valid dataset. Tests clone it and break one thing at a time. */
export function fixtureRaw(): RawContent {
  return structuredClone({
    meta: { schemaVersion: 1, datasetVersion: 'test', updatedOn: '2026-01-01', environmentNote: 'test' },
    categories: { schemaVersion: 1, categories: [{ id: 'outdoor', name: 'Outdoor', description: 'Outdoor skills' }] },
    catalog: {
      schemaVersion: 1,
      listedOn: '2026-01-01',
      provenance,
      badges: [
        { id: 'mb.knots', slug: 'knots', name: 'Knots', category: 'outdoor', lifecycle: 'active', eagle: { status: 'elective', verified: false }, catalogStatus: 'unverified', officialUrl: 'https://example.org/knots', officialUrlStatus: 'unchecked' },
        { id: 'mb.rowing', slug: 'rowing', name: 'Rowing', category: 'outdoor', lifecycle: 'active', eagle: { status: 'elective', verified: false }, catalogStatus: 'unverified', officialUrl: 'https://example.org/rowing', officialUrlStatus: 'unchecked' },
      ],
    },
    badgeDetails: {
      'badges/knots.json': {
        schemaVersion: 1,
        id: 'mb.knots',
        slug: 'knots',
        description: 'A fixture badge about knots and lashings.',
        lastReviewed: null,
        safety: { sensitive: false, reviewed: false },
        currentVersion: 'v1',
        versions: [version()],
        relatedResourceIds: [],
        studySetIds: [],
      },
    },
    ranks: {},
    resources: { schemaVersion: 1, resources: [resource('res.a'), resource('res.b')] },
    mappings: {
      schemaVersion: 1,
      mappings: [
        { resourceId: 'res.a', requirementId: 'mb.knots.1', relevance: 'core' },
        { resourceId: 'res.a', requirementId: 'mb.knots.2a', relevance: 'supporting' },
        { resourceId: 'res.b', requirementId: 'mb.knots.2a', relevance: 'core' },
      ],
    },
    study: { schemaVersion: 1, sets: [] },
    templates: { schemaVersion: 1, templates: [] },
  }) as RawContent;
}

export const badgeFile = (raw: RawContent) => raw.badgeDetails['badges/knots.json'] as ReturnType<typeof fixtureRaw>['badgeDetails'][string] & {
  versions: ReturnType<typeof version>[];
  currentVersion: string | null;
};
