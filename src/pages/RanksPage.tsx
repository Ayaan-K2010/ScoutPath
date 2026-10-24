import { ArrowRight, Printer } from '../components/icons';
import { Link } from 'react-router';
import { Callout } from '../components/Callout';
import { PageHeader } from '../components/PageHeader';
import { ProgressMeter } from '../components/ProgressMeter';
import { VerificationTag } from '../components/StatusTag';
import { SuggestedTasks } from '../components/SuggestedTasks';
import { content } from '../features/content/data';
import { leafRequirementIds } from '../features/content/model';
import { setSelectedRank } from '../features/progress/actions';
import { ownerProgress } from '../features/progress/summary';
import { useDocumentTitle } from '../hooks/usePageMeta';
import { useUpdateUser, useUserData } from '../hooks/useUserData';

const COMPLETENESS = { complete: 'Full outline', partial: 'Partial outline', 'outline-only': 'Topic outline' } as const;

/** Only claim the ranks were checked when every rank's current outline actually was. */
const ranksChecked = content.ranks.every((r) => r.version?.status === 'verified' || r.version?.status === 'partially-verified');

function RankDashboard({ rankId }: { rankId: string }) {
  const data = useUserData();
  const rank = content.rankById.get(rankId);
  if (!rank) return null;
  const summary = ownerProgress(content, data, rank.id);
  const leaves = leafRequirementIds(content, rank.id);
  const withResources = leaves.filter((id) => content.resourcesByRequirement.has(id)).length;
  const remaining = summary.total - summary.counts['completed-personal'];
  return (
    <section className="panel" aria-labelledby="rank-dash-title" style={{ padding: 'var(--s-8)' }}>
      <div className="with-aside" style={{ gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 'var(--s-10)' }}>
        <div>
          <p className="eyebrow">Working toward</p>
          <h2 id="rank-dash-title" className="dash-greeting" style={{ fontSize: 'var(--fs-2xl)', marginTop: 'var(--s-2)' }}>
            {rank.name}
          </h2>
          <div style={{ marginTop: 'var(--s-5)' }}>
            <ProgressMeter counts={summary.counts} total={summary.total} label={`${rank.name} progress`} size="lg" showLegend />
          </div>
          <dl className="meta-list" style={{ marginTop: 'var(--s-5)' }}>
            <div>
              <dt>Remaining</dt>
              <dd>
                {remaining} of {summary.total} outlined items{summary.partial ? ' (partial outline)' : ''}
              </dd>
            </div>
            <div>
              <dt>Resources</dt>
              <dd>
                {withResources} items have curated resources
              </dd>
            </div>
          </dl>
          <div className="button-row" style={{ marginTop: 'var(--s-5)' }}>
            <Link to={`/ranks/${rank.slug}`} className="btn btn--primary">
              Open {rank.name} checklist
            </Link>
            <Link to={`/ranks/${rank.slug}?print=1`} className="btn btn--ghost">
              <Printer size={16} aria-hidden="true" /> Printable checklist
            </Link>
          </div>
        </div>
        <div>
          <h3 className="mini-heading">Suggested next</h3>
          <SuggestedTasks ownerId={rank.id} limit={4} />
        </div>
      </div>
    </section>
  );
}

export function RanksPage() {
  useDocumentTitle('Ranks');
  const data = useUserData();
  const update = useUpdateUser();
  const selected = data.profile.selectedRankId;

  return (
    <div className="container page">
      <PageHeader
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Ranks' }]}
        title="Rank advancement"
        lede="Seven ranks, earned in order from Scout to Eagle. Each has its own checklist of requirements with learning resources, personal progress and notes."
        aside={
          <div className="field" style={{ minWidth: '15rem' }}>
            <label htmlFor="current-rank">The rank I am working on</label>
            <select id="current-rank" className="select" value={selected ?? ''} onChange={(e) => update((d) => setSelectedRank(d, e.target.value || null))}>
              <option value="">Choose a rank…</option>
              {content.ranks.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
            <span className="field__hint">Saved in this browser only.</span>
          </div>
        }
      />

      <div className="stack-lg">
        {selected && content.rankById.has(selected) && <RankDashboard rankId={selected} />}

        {ranksChecked ? (
          <Callout tone="info" title="Checked against the 2025 rank requirements">
            Rank outlines follow the official Scouts BSA rank requirements effective January 1, 2025, with ScoutPath’s own summaries in place of the official
            wording. The version that applies to you depends on when you started. Confirm with your unit leader and the official Scouts BSA requirements.
          </Callout>
        ) : (
          <Callout tone="warn" title="Draft outlines">
            Some rank outlines here are ScoutPath summaries that have not been checked against the current official requirements. Requirements change, and
            the version that applies to you depends on when you started. Confirm with your unit leader and the official Scouts BSA requirements.
          </Callout>
        )}

        <ol className="rank-ladder">
          {content.ranks.map((rank) => {
            const summary = ownerProgress(content, data, rank.id);
            return (
              <li key={rank.id}>
                <Link to={`/ranks/${rank.slug}`} className={`rank-row${rank.id === selected ? ' rank-row--current' : ''}`}>
                  <span className="rank-row__order" aria-hidden="true">
                    {rank.order}
                  </span>
                  <span>
                    <span className="rank-row__name">
                      {rank.name}
                      {rank.id === selected && <span className="sr-only"> (your current rank)</span>}
                    </span>
                    <span className="rank-row__desc" style={{ display: 'block' }}>
                      {rank.description}
                    </span>
                    <span className="tag-list" style={{ marginTop: 'var(--s-3)' }}>
                      {rank.version && <VerificationTag status={rank.version.status} />}
                      {rank.version && <span className="tag tag--outline">{COMPLETENESS[rank.version.completeness]}</span>}
                      {rank.id === selected && <span className="tag tag--brand">Current</span>}
                    </span>
                  </span>
                  <span className="rank-row__progress">
                    <ProgressMeter counts={summary.counts} total={summary.total} label={`${rank.name} progress`} />
                    <span className="small muted" style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--s-2)' }}>
                      <span>
                        {summary.counts['completed-personal']}/{summary.total} complete
                      </span>
                      <ArrowRight size={15} aria-hidden="true" />
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
        <p className="small muted">
          Personal progress is your own record and does not represent official advancement. Ranks are awarded through your unit’s Scoutmaster
          conferences and boards of review.
        </p>
      </div>
    </div>
  );
}
