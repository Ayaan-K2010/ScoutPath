import { ArrowLeft, ArrowRight, CalendarDays, Check, Flag, Printer } from 'lucide-react';
import { useEffect } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { ExternalLink } from '../components/ExternalLink';
import { OwnerSidebar } from '../components/OwnerSidebar';
import { PageHeader } from '../components/PageHeader';
import { PrintHeader } from '../components/PrintHeader';
import { RequirementTree } from '../components/RequirementTree';
import { VerificationTag } from '../components/StatusTag';
import { VersionNotice } from '../components/VersionNotice';
import { SuggestedTasks } from '../components/SuggestedTasks';
import { content } from '../features/content/data';
import { setSelectedRank } from '../features/progress/actions';
import { useDocumentTitle, useRecordVisit } from '../hooks/usePageMeta';
import { useUpdateUser, useUserData } from '../hooks/useUserData';
import { useToast } from '../lib/toastContext';
import { NotFoundPage } from './NotFoundPage';

export function RankPage() {
  const { slug = '' } = useParams();
  const [params] = useSearchParams();
  const rank = content.rankBySlug.get(slug);
  useDocumentTitle(rank ? `${rank.name} rank` : 'Rank not found');
  useRecordVisit(rank ? { kind: 'rank', id: rank.id, title: `${rank.name} rank`, path: `/ranks/${rank.slug}` } : null);
  const data = useUserData();
  const update = useUpdateUser();
  const toast = useToast();
  const wantsPrint = params.get('print') === '1';

  useEffect(() => {
    if (rank && wantsPrint) {
      const t = window.setTimeout(() => window.print(), 300);
      return () => window.clearTimeout(t);
    }
  }, [rank, wantsPrint]);

  if (!rank) return <NotFoundPage title="We couldn’t find that rank" message={`There is no rank at “${slug}”. The seven ranks are Scout, Tenderfoot, Second Class, First Class, Star, Life and Eagle.`} />;

  const isCurrent = data.profile.selectedRankId === rank.id;
  const prev = content.ranks.find((r) => r.order === rank.order - 1);
  const next = content.ranks.find((r) => r.order === rank.order + 1);
  const studySets = rank.studySetIds.map((id) => content.studyById.get(id)).filter((s) => s !== undefined);

  return (
    <div className="container page">
      <PrintHeader title={`${rank.name} rank personal checklist`} />
      <PageHeader
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Ranks', to: '/ranks' }, { label: rank.name }]}
        eyebrow={`Rank ${rank.order} of 7`}
        title={rank.name}
        lede={rank.description}
        meta={
          <>
            {rank.version && <VerificationTag status={rank.version.status} />}
            {isCurrent && <span className="tag tag--brand">Your current rank</span>}
          </>
        }
        actions={
          <>
            <ExternalLink href={rank.officialUrl} className="btn btn--primary">
              Official requirements
            </ExternalLink>
            <button
              type="button"
              className="btn"
              aria-pressed={isCurrent}
              onClick={() => {
                update((d) => setSelectedRank(d, isCurrent ? null : rank.id));
                toast.show(isCurrent ? 'Current rank cleared' : `${rank.name} set as your current rank`);
              }}
            >
              {isCurrent ? <Check size={16} aria-hidden="true" /> : <Flag size={16} aria-hidden="true" />}
              {isCurrent ? 'Current rank' : 'Set as my current rank'}
            </button>
            <Link to={`/planner?target=${encodeURIComponent(rank.id)}`} className="btn">
              <CalendarDays size={16} aria-hidden="true" /> Plan study sessions
            </Link>
            <button type="button" className="btn btn--ghost" onClick={() => window.print()}>
              <Printer size={16} aria-hidden="true" /> Print checklist
            </button>
          </>
        }
      />

      <div className="with-aside">
        <div className="stack-lg">
          {rank.version && <VersionNotice version={rank.version} kind="rank" />}

          <section aria-labelledby="next-title" className="no-print">
            <div className="section-head">
              <h2 id="next-title">Suggested next</h2>
              <span className="section-head__aside">Based on your personal progress</span>
            </div>
            <SuggestedTasks ownerId={rank.id} />
          </section>

          <section aria-labelledby="req-title">
            <div className="section-head section-head--serif">
              <h2 id="req-title">Requirements</h2>
              <span className="section-head__aside">Open any item for its learning page</span>
            </div>
            {rank.version ? <RequirementTree ownerId={rank.id} /> : <p className="muted">The outline for this rank is still being written.</p>}
          </section>

          {studySets.length > 0 && (
            <section aria-labelledby="study-title" className="no-print">
              <div className="section-head">
                <h2 id="study-title">Study tools</h2>
              </div>
              <div className="button-row">
                {studySets.map((s) => (
                  <Link key={s.id} to={`/study/${s.slug}`} className="btn">
                    {s.title}
                  </Link>
                ))}
              </div>
            </section>
          )}

          <nav className="prev-next no-print" aria-label="Other ranks">
            {prev ? (
              <Link to={`/ranks/${prev.slug}`}>
                <span className="prev-next__label">
                  <ArrowLeft size={13} aria-hidden="true" /> Previous rank
                </span>
                <span className="prev-next__title">{prev.name}</span>
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link to={`/ranks/${next.slug}`} className="next">
                <span className="prev-next__label">
                  Next rank <ArrowRight size={13} aria-hidden="true" />
                </span>
                <span className="prev-next__title">{next.name}</span>
              </Link>
            ) : (
              <span />
            )}
          </nav>
        </div>
        <OwnerSidebar ownerId={rank.id} ownerName={rank.name} version={rank.version} officialUrl={rank.officialUrl} />
      </div>
    </div>
  );
}
