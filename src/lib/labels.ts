import type { PublisherType, Resource, ResourceType, VerificationStatus } from '../schemas/content';

export const PUBLISHER_TYPE_LABELS: Record<PublisherType, string> = {
  'official-scouting': 'Official Scouting America',
  government: 'Government agency',
  university: 'University',
  scientific: 'Scientific organization',
  nonprofit: 'Nonprofit organization',
  independent: 'Independent publisher',
};

export const RESOURCE_TYPE_LABELS: Record<ResourceType, string> = {
  video: 'Video',
  article: 'Article',
  'official-page': 'Reference page',
  pdf: 'PDF',
  diagram: 'Diagram or chart',
  interactive: 'Interactive lesson',
  podcast: 'Podcast',
  simulation: 'Simulation',
  vocabulary: 'Vocabulary guide',
  practice: 'Practice activity',
  other: 'Other',
};

export const VERIFICATION_HELP: Record<VerificationStatus, string> = {
  verified: 'Checked against the official source by a reviewer.',
  'partially-verified': 'Some parts have been checked against the official source.',
  unverified: 'Not yet checked against the official source. Always use the official requirements.',
  'needs-review': 'Flagged for review; it may be out of date.',
  missing: 'ScoutPath does not have this content yet.',
};

export function resourcePath(resource: Pick<Resource, 'id'>): string {
  return `/resources/${resource.id.replace(/^res\./, '')}`;
}
