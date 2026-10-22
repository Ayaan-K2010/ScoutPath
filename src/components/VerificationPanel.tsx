import { ShieldCheck } from 'lucide-react';
import type { RequirementVersion } from '../schemas/content';
import { formatIsoDate } from '../lib/format';
import { Disclosure } from './Disclosure';
import { ExternalLink } from './ExternalLink';
import { LinkStatusTag, VerificationTag } from './StatusTag';
import { VERIFICATION_HELP } from '../lib/labels';

const COMPLETENESS: Record<RequirementVersion['completeness'], string> = {
  complete: 'Complete outline',
  partial: 'Partial outline',
  'outline-only': 'Topic outline only',
};

/** Shows where requirement data came from and how far it can be trusted. */
export function VerificationPanel({ version, officialUrl, ownerName }: { version: RequirementVersion | null; officialUrl: string; ownerName: string }) {
  return (
    <section className="panel" aria-labelledby="verification-title">
      <h2 className="panel__title" id="verification-title">
        <ShieldCheck size={16} aria-hidden="true" /> Source and verification
      </h2>
      {version ? (
        <>
          <div className="tag-list" style={{ marginBottom: 'var(--s-4)' }}>
            <VerificationTag status={version.status} />
            <span className="tag tag--outline">{COMPLETENESS[version.completeness]}</span>
          </div>
          <dl className="meta-list">
            <div>
              <dt>Dataset</dt>
              <dd>{version.label}</dd>
            </div>
            <div>
              <dt>Effective date</dt>
              <dd>{version.effectiveDate ? formatIsoDate(version.effectiveDate) : 'Not verified'}</dd>
            </div>
            <div>
              <dt>Source checked</dt>
              <dd>{version.sourceCheckedOn ? formatIsoDate(version.sourceCheckedOn) : 'Not yet'}</dd>
            </div>
            <div>
              <dt>Wording</dt>
              <dd>{version.wordingPolicy === 'link-only' ? 'ScoutPath summaries; official wording linked' : 'Official wording reproduced with permission'}</dd>
            </div>
          </dl>
          <p className="field__hint" style={{ marginTop: 'var(--s-3)' }}>{VERIFICATION_HELP[version.status]}</p>
        </>
      ) : (
        <p className="muted" style={{ fontSize: 'var(--fs-sm)' }}>
          ScoutPath has not outlined the requirements for {ownerName} yet. Use the official requirements.
        </p>
      )}
      <div style={{ marginTop: 'var(--s-4)', display: 'grid', gap: 'var(--s-2)' }}>
        <ExternalLink href={version?.sourceUrl ?? officialUrl} className="btn btn--sm">
          Official requirements
        </ExternalLink>
        <LinkStatusTag status={version?.sourceLinkStatus ?? 'unchecked'} />
      </div>
      {version && (
        <div style={{ marginTop: 'var(--s-4)' }}>
          <Disclosure title={<span style={{ fontSize: 'var(--fs-sm)' }}>How this outline was made</span>}>
            <p>{version.provenance.notes}</p>
            <p className="muted" style={{ marginTop: 'var(--s-2)' }}>
              Recorded by {version.provenance.recordedBy} on {formatIsoDate(version.provenance.recordedOn)}.
            </p>
            {version.provenance.references.length > 0 && (
              <ul style={{ marginTop: 'var(--s-2)', paddingLeft: 'var(--s-5)' }}>
                {version.provenance.references.map((r) => (
                  <li key={r.url}>
                    <ExternalLink href={r.url}>{r.label}</ExternalLink>
                  </li>
                ))}
              </ul>
            )}
          </Disclosure>
        </div>
      )}
    </section>
  );
}
