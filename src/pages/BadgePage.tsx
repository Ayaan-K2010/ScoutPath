import { CalendarDays, CircleHelp, GraduationCap, Plus, Printer, Check } from 'lucide-react';
import { Link, useParams } from 'react-router';
import { EagleTag } from '../components/BadgeCard';
import { BadgeMark } from '../components/BadgeMark';
import { Callout } from '../components/Callout';
import { EmptyState } from '../components/EmptyState';
import { ExternalLink } from '../components/ExternalLink';
import { OwnerSidebar } from '../components/OwnerSidebar';
import { PageHeader } from '../components/PageHeader';
import { PrintHeader } from '../components/PrintHeader';
import { RequirementTree } from '../components/RequirementTree';
import { ResourceRow } from '../components/ResourceRow';
import { VerificationTag } from '../components/StatusTag';
import { content } from '../features/content/data';
import { toggleSelectedBadge } from '../features/progress/actions';
import { useDocumentTitle, useRecordVisit } from '../hooks/usePageMeta';
import { useUpdateUser, useUserData } from '../hooks/useUserData';
import { useToast } from '../lib/toastContext';
import { NotFoundPage } from './NotFoundPage';

export function BadgePage() {
  const { slug = '' } = useParams();
  const badge = content.badgeBySlug.get(slug);
  useDocumentTitle(badge ? `${badge.name} merit badge` : 'Badge not found');
  useRecordVisit(badge ? { kind: 'badge', id: badge.id, title: `${badge.name} merit badge`, path: `/merit-badges/${badge.slug}` } : null);
  const data = useUserData();
  const update = useUpdateUser();
  const toast = useToast();

  if (!badge) {
    return <NotFoundPage title="We couldn’t find that merit badge" message={`There is no merit badge listed at “${slug}”. It may be spelled differently or not yet in ScoutPath’s index.`} />;
  }

  const category = content.categories.find((c) => c.id === badge.category);
  const selected = data.profile.selectedBadgeIds.includes(badge.id);
  const related = (badge.detail?.relatedResourceIds ?? []).map((id) => content.resourceById.get(id)).filter((r) => r !== undefined);
  const studySets = (badge.detail?.studySetIds ?? []).map((id) => content.studyById.get(id)).filter((s) => s !== undefined);
  const version = badge.version;

  return (
    <div className="container page">
      <PrintHeader title={`${badge.name} personal checklist`} />
      <PageHeader
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Merit badges', to: '/merit-badges' }, { label: badge.name }]}
        eyebrow={
          <>
            {category?.name} · Merit badge
          </>
        }
        title={
          <span className="owner-hero" style={{ alignItems: 'center' }}>
            <BadgeMark category={badge.category} size="lg" />
            <span>{badge.name}</span>
          </span>
        }
        lede={badge.detail?.description ?? 'ScoutPath has not written learning content for this badge yet. Use the official requirements while it is being prepared.'}
        meta={
          <>
            <EagleTag badge={badge} />
            {badge.lifecycle === 'discontinued' && <span className="tag tag--alert">Discontinued</span>}
            {badge.lifecycle === 'test-lab' && <span className="tag">Test Lab</span>}
            <VerificationTag status={version ? version.status : 'missing'} />
            {badge.catalogStatus !== 'verified' && <span className="tag tag--outline">Listing unverified</span>}
          </>
        }
        actions={
          <>
            <ExternalLink href={badge.officialUrl} className="btn btn--primary">
              Official requirements
            </ExternalLink>
            <button
              type="button"
              className="btn"
              aria-pressed={selected}
              onClick={() => {
                update((d) => toggleSelectedBadge(d, badge.id));
                toast.show(selected ? `Removed ${badge.name} from your badges` : `Added ${badge.name} to your badges`);
              }}
            >
              {selected ? <Check size={16} aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />}
              {selected ? 'In my badges' : 'Add to my badges'}
            </button>
            {version && (
              <>
                <Link to={`/planner?target=${encodeURIComponent(badge.id)}`} className="btn">
                  <CalendarDays size={16} aria-hidden="true" /> Plan study sessions
                </Link>
                <button type="button" className="btn btn--ghost" onClick={() => window.print()}>
                  <Printer size={16} aria-hidden="true" /> Print checklist
                </button>
              </>
            )}
          </>
        }
      />

      {badge.lifecycleNote && (
        <div style={{ marginBottom: 'var(--s-8)' }}>
          <Callout tone={badge.lifecycle === 'discontinued' ? 'alert' : 'info'} title={badge.lifecycle === 'discontinued' ? 'Discontinued' : badge.lifecycle === 'test-lab' ? 'Test Lab badge' : 'Recent change'}>
            {badge.lifecycleNote}
          </Callout>
        </div>
      )}

      {!version ? (
        <div className="with-aside">
          <div className="stack-lg">
            <EmptyState
              icon={CircleHelp}
              title="Content being reviewed"
              actions={
                <ExternalLink href={badge.officialUrl} className="btn btn--primary">
                  Read the official requirements
                </ExternalLink>
              }
            >
              ScoutPath has not outlined the requirements for {badge.name} yet, so there are no requirement pages or progress tracking for it. We would
              rather show nothing than guess at official requirements.
            </EmptyState>
            {related.length > 0 && (
              <section aria-labelledby="related-title">
                <div className="section-head">
                  <h2 id="related-title">Background resources</h2>
                  <span className="section-head__aside">Not yet mapped to specific requirements</span>
                </div>
                <ul className="resource-list">
                  {related.map((r) => (
                    <li key={r.id}>
                      <ResourceRow resource={r} />
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {studySets.length > 0 && <StudyLinks sets={studySets} />}
          </div>
          <OwnerSidebar ownerId={badge.id} ownerName={badge.name} version={null} officialUrl={badge.officialUrl} />
        </div>
      ) : (
        <div className="with-aside">
          <div className="stack-lg">
            {version.status !== 'verified' && (
              <Callout tone="warn" title="Draft outline — check the official requirements">
                These are ScoutPath’s own topic summaries, not the official wording, and the numbering has not been verified against
                Scouting America’s current requirements. Use them to find learning resources. Always work from the official requirements and
                your counselor’s guidance.
              </Callout>
            )}
            {badge.detail?.safety.sensitive && badge.detail.safety.note && (
              <Callout tone="safety" title="Safety first">
                {badge.detail.safety.note}
              </Callout>
            )}
            <section aria-labelledby="req-title">
              <div className="section-head section-head--serif">
                <h2 id="req-title">Requirements</h2>
                <span className="section-head__aside">Open any item for its learning page</span>
              </div>
              <RequirementTree ownerId={badge.id} />
            </section>
            {studySets.length > 0 && <StudyLinks sets={studySets} />}
            {related.length > 0 && (
              <section aria-labelledby="related-title" className="no-print">
                <div className="section-head">
                  <h2 id="related-title">Start here</h2>
                  <span className="section-head__aside">Badge-wide background reading</span>
                </div>
                <ul className="resource-list">
                  {related.map((r) => (
                    <li key={r.id}>
                      <ResourceRow resource={r} compact />
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
          <OwnerSidebar ownerId={badge.id} ownerName={badge.name} version={version} officialUrl={badge.officialUrl} />
        </div>
      )}
    </div>
  );
}

function StudyLinks({ sets }: { sets: { id: string; slug: string; title: string; flashcards: unknown[]; quiz: unknown[] }[] }) {
  return (
    <section aria-labelledby="study-title" className="no-print">
      <div className="section-head">
        <h2 id="study-title">Study tools</h2>
        <Link to="/study" className="text-link">
          All study sets
        </Link>
      </div>
      <ul className="plain-list" style={{ display: 'grid', gap: 'var(--s-3)' }}>
        {sets.map((s) => (
          <li key={s.id}>
            <Link to={`/study/${s.slug}`} className="continue-row continue-row--simple" style={{ background: 'var(--paper)', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', padding: 'var(--s-4)' }}>
              <span>
                <span className="continue-row__title">
                  <GraduationCap size={15} aria-hidden="true" style={{ display: 'inline', verticalAlign: '-2px', marginRight: 6 }} />
                  {s.title}
                </span>
                <span className="continue-row__meta">
                  Study guide · {s.flashcards.length} flashcards · {s.quiz.length}-question practice quiz
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
