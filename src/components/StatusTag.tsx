import { CircleCheck, CircleDashed, CircleHelp, TriangleAlert, CircleDot } from 'lucide-react';
import type { LinkStatus, ReviewStatus, VerificationStatus } from '../schemas/content';

const VERIFICATION: Record<VerificationStatus, { label: string; tone: string; icon: typeof CircleCheck; help: string }> = {
  verified: { label: 'Verified', tone: 'ok', icon: CircleCheck, help: 'Checked against the official source by a reviewer.' },
  'partially-verified': { label: 'Partially verified', tone: 'warn', icon: CircleDot, help: 'Some parts have been checked against the official source.' },
  unverified: { label: 'Unverified draft', tone: 'warn', icon: CircleDashed, help: 'Not yet checked against the official source. Always use the official requirements.' },
  'needs-review': { label: 'Needs review', tone: 'alert', icon: TriangleAlert, help: 'Flagged for review; it may be out of date.' },
  missing: { label: 'Content being reviewed', tone: 'neutral', icon: CircleHelp, help: 'ScoutPath does not have this content yet.' },
};

export function VerificationTag({ status, label }: { status: VerificationStatus; label?: string }) {
  const v = VERIFICATION[status];
  const Icon = v.icon;
  return (
    <span className={`tag tag--${v.tone}`} title={v.help}>
      <Icon aria-hidden="true" />
      {label ?? v.label}
    </span>
  );
}

const LINK: Record<LinkStatus, { label: string; tone: string }> = {
  ok: { label: 'Link checked', tone: 'ok' },
  redirected: { label: 'Link redirects', tone: 'warn' },
  broken: { label: 'Link broken', tone: 'alert' },
  unchecked: { label: 'Link not yet checked', tone: 'neutral' },
};

export function LinkStatusTag({ status }: { status: LinkStatus }) {
  return <span className={`tag tag--${LINK[status].tone}`}>{LINK[status].label}</span>;
}

const REVIEW: Record<ReviewStatus, { label: string; tone: string }> = {
  approved: { label: 'Safety reviewed', tone: 'ok' },
  pending: { label: 'Safety review pending', tone: 'warn' },
  flagged: { label: 'Safety concern flagged', tone: 'alert' },
  'not-required': { label: 'No safety review needed', tone: 'neutral' },
};

export function SafetyReviewTag({ status }: { status: ReviewStatus }) {
  return <span className={`tag tag--${REVIEW[status].tone}`}>{REVIEW[status].label}</span>;
}
