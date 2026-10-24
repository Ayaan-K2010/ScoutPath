import type { RequirementVersion } from '../schemas/content';
import { Callout } from './Callout';

/** Explains how far a requirement outline has been checked, so nobody mistakes a summary for the official text. */
export function VersionNotice({ version, kind }: { version: RequirementVersion; kind: 'badge' | 'rank' }) {
  const decides = kind === 'rank' ? 'Your Scoutmaster and board of review decide when a rank is complete.' : 'Your counselor decides when a requirement is complete.';
  if (version.status === 'verified') return null;
  if (version.status === 'partially-verified') {
    return (
      <Callout tone="info" title={version.completeness === 'complete' ? 'Summaries checked against official sources' : 'Partial outline — some requirements not shown yet'}>
        The numbering and topics were checked against Scouting America’s published requirements, but the wording here is ScoutPath’s own summary, not the
        official text.
        {version.completeness !== 'complete' && ' Requirements that could not be confirmed are left out rather than guessed.'} Always work from the official
        requirements. {decides}
      </Callout>
    );
  }
  return (
    <Callout tone="warn" title="Draft outline — check the official requirements">
      These are ScoutPath’s own topic summaries, not the official wording, and the numbering has not been verified against Scouting America’s current
      requirements. Use them to find learning resources. Always work from the official requirements. {decides}
    </Callout>
  );
}
