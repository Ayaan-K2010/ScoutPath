import { ArrowLeft, ArrowRight, BookOpen, GraduationCap, Hand, Library, Link2, ListChecks, MessageSquare, NotebookPen, SearchX, Users } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router';
import { Callout } from '../components/Callout';
import { EmptyState } from '../components/EmptyState';
import { ExternalLink } from '../components/ExternalLink';
import { PageHeader } from '../components/PageHeader';
import { ProgressControl } from '../components/ProgressControl';
import { ProgressMeter } from '../components/ProgressMeter';
import { ResourceRow } from '../components/ResourceRow';
import { StatePill } from '../components/StatePill';
import { VerificationTag } from '../components/StatusTag';
import { content } from '../features/content/data';
import { findRequirement, leafIdsUnder, ownerOf, versionOfOwner, type OwnerType, type RequirementNode } from '../features/content/model';
import { setNote, setProgress } from '../features/progress/actions';
import { PROGRESS_LABELS } from '../features/progress/schema';
import { stateOf, summarizeIds } from '../features/progress/summary';
import { useDocumentTitle, useRecordVisit } from '../hooks/usePageMeta';
import { useUpdateUser, useUserData } from '../hooks/useUserData';
import { useSearchPalette } from '../lib/searchContext';
import { useToast } from '../lib/toastContext';
import type { RequirementKind } from '../schemas/content';
import { NotFoundPage } from './NotFoundPage';

const KIND_GUIDANCE: Record<RequirementKind, { label: string; icon: typeof Hand; text: string }> = {
  knowledge: { label: 'Knowledge', icon: BookOpen, text: 'Your counselor or leader will check your understanding. Resources and practice quizzes here help you prepare; they are not the check itself.' },
  discussion: { label: 'Discussion', icon: MessageSquare, text: 'This is completed by discussing it with your counselor or leader. Reading helps you prepare, but the discussion is what counts.' },
  demonstration: { label: 'Demonstration', icon: Hand, text: 'This must be shown in person. Watching a video or reading an article does not complete it — practice the skill hands-on until you can demonstrate it.' },
  activity: { label: 'Activity', icon: Hand, text: 'This requires actually doing something, often over time or on an outing. Resources help you plan and prepare.' },
  service: { label: 'Service', icon: Users, text: 'This requires approved service. Check with your leaders about which projects qualify.' },
  leadership: { label: 'Leadership', icon: Users, text: 'This requires serving or leading over time under your unit’s guidance.' },
  conference: { label: 'Conference', icon: MessageSquare, text: 'This is a conversation with your Scoutmaster. Come ready to talk about what you have learned.' },
  review: { label: 'Board of review', icon: Users, text: 'This is completed with your unit’s board of review. ScoutPath cannot record or approve it.' },
  mixed: { label: 'Several kinds of work', icon: ListChecks, text: 'This includes knowledge as well as things you must show or do in person. Online resources only cover part of it.' },
};

function NotesPanel({ requirementId }: { requirementId: string }) {
  const data = useUserData();
  const update = useUpdateUser();
  const stored = data.notes[requirementId]?.text ?? '';
  const [text, setText] = useState(stored);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const save = (value: string) => {
    update((d) => setNote(d, requirementId, value));
    setStatus('saved');
  };

  return (
    <section className="panel" aria-labelledby="notes-title">
      <h2 className="panel__title" id="notes-title">
        <NotebookPen size={16} aria-hidden="true" /> Study notes
      </h2>
      <label htmlFor="req-notes" className="sr-only">
        Your notes for this requirement
      </label>
      <textarea
        id="req-notes"
        className="textarea"
        placeholder="Questions for your counselor, things to practice, what you learned…"
        value={text}
        maxLength={20000}
        onChange={(e) => {
          const value = e.target.value;
          setText(value);
          setStatus('saving');
          window.clearTimeout(timer.current);
          timer.current = window.setTimeout(() => save(value), 600);
        }}
        onBlur={() => {
          window.clearTimeout(timer.current);
          if (text !== stored) save(text);
        }}
      />
      <p className="saved-note" aria-live="polite">
        {status === 'saving' ? 'Saving…' : status === 'saved' ? 'Saved on this device' : stored ? 'Notes are stored only in this browser' : 'Notes stay on this device'}
      </p>
    </section>
  );
}

function ProgressPanel({ node }: { node: RequirementNode }) {
  const data = useUserData();
  const update = useUpdateUser();
  const toast = useToast();
  if (!node.isLeaf) {
    const leaves = leafIdsUnder(content, node.id);
    const counts = summarizeIds(data, leaves);
    return (
      <section className="panel" aria-labelledby="progress-title">
        <h2 className="panel__title" id="progress-title">
          <ListChecks size={16} aria-hidden="true" /> Your progress on {node.requirement.number}
        </h2>
        <p className="small" style={{ marginBottom: 'var(--s-3)' }}>
          <strong className="tabular">{counts['completed-personal']}</strong> of {leaves.length} sub-items marked complete. Track each one on its own page.
        </p>
        <ProgressMeter counts={counts} total={leaves.length} label={`Requirement ${node.requirement.number}`} />
      </section>
    );
  }
  const state = stateOf(data, node.id);
  return (
    <section className="panel" aria-labelledby="progress-title">
      <h2 className="panel__title" id="progress-title">
        <ListChecks size={16} aria-hidden="true" /> Your progress
      </h2>
      <ProgressControl
        legend={`Your personal progress on ${node.ownerName} ${node.requirement.number}`}
        value={state}
        onChange={(next) => {
          update((d) => setProgress(d, node.id, next));
          toast.show(`Marked “${PROGRESS_LABELS[next]}”`);
        }}
      />
      <p className="field__hint" style={{ marginTop: 'var(--s-3)' }}>
        A personal learning record, saved in this browser. It is not an official sign-off — your counselor or leader records completion.
      </p>
    </section>
  );
}

export function RequirementPage({ ownerType }: { ownerType: OwnerType }) {
  const { slug = '', number = '' } = useParams();
  const node = findRequirement(content, ownerType, slug, number);
  const owner = node ? ownerOf(content, node) : null;
  const ownerLabel = ownerType === 'badge' ? 'merit badge' : 'rank';
  useDocumentTitle(node ? `${node.ownerName} ${node.requirement.number}: ${node.requirement.title}` : 'Requirement not found');
  useRecordVisit(node ? { kind: 'requirement', id: node.id, title: `${node.ownerName} ${node.requirement.number} · ${node.requirement.title}`, path: node.path } : null);
  const data = useUserData();
  const palette = useSearchPalette();

  if (!node || !owner) {
    const ownerExists = ownerType === 'badge' ? content.badgeBySlug.has(slug) : content.rankBySlug.has(slug);
    return (
      <NotFoundPage
        title="We couldn’t find that requirement"
        message={
          ownerExists
            ? `ScoutPath’s outline has no requirement “${number}” here. Numbering can differ between requirement versions — check the requirement list instead.`
            : `There is no ${ownerLabel} at “${slug}” in ScoutPath.`
        }
      />
    );
  }

  const req = node.requirement;
  const version = versionOfOwner(content, node.ownerId);
  const ownerBase = ownerType === 'badge' ? `/merit-badges/${slug}` : `/ranks/${slug}`;
  const parent = node.parentId ? content.requirements.get(node.parentId) : null;
  const mapped = content.resourcesByRequirement.get(node.id) ?? [];
  const childResources = node.isLeaf ? [] : node.childIds.flatMap((id) => content.resourcesByRequirement.get(id) ?? []);
  const kind = KIND_GUIDANCE[req.kind];
  const KindIcon = kind.icon;
  const officialName = ownerType === 'badge' ? `${node.ownerName} merit badge` : `${node.ownerName} rank`;

  const relatedIds = new Set(req.relatedRequirementIds ?? []);
  for (const other of content.requirements.values()) if (other.requirement.relatedRequirementIds?.includes(node.id)) relatedIds.add(other.id);
  const related = [...relatedIds].map((id) => content.requirements.get(id)).filter((n): n is RequirementNode => Boolean(n));

  const practice = content.studySets.filter(
    (s) => s.requirementIds.includes(node.id) || (parent && s.requirementIds.includes(parent.id)) || node.childIds.some((c) => s.requirementIds.includes(c)),
  );
  const ownerStudy = practice.length === 0 ? content.studySets.filter((s) => s.badgeIds.includes(node.ownerId) || s.rankIds.includes(node.ownerId)) : [];

  const order = content.requirementOrder.get(node.ownerId) ?? [];
  const idx = order.indexOf(node.id);
  const prev = idx > 0 ? content.requirements.get(order[idx - 1]) : null;
  const next = idx >= 0 && idx < order.length - 1 ? content.requirements.get(order[idx + 1]) : null;

  const crumbs = [
    { label: 'Home', to: '/' },
    ownerType === 'badge' ? { label: 'Merit badges', to: '/merit-badges' } : { label: 'Ranks', to: '/ranks' },
    { label: node.ownerName, to: ownerBase },
    ...(parent ? [{ label: `Requirement ${parent.requirement.number}`, to: parent.path }] : []),
    { label: `Requirement ${req.number}` },
  ];

  return (
    <div className="container page">
      <PageHeader
        crumbs={crumbs}
        eyebrow={
          <>
            {officialName} · Requirement
          </>
        }
        title={
          <>
            <span className="req-hero__number">
              <strong>{req.number}</strong>
            </span>{' '}
            {req.title}
          </>
        }
        meta={
          <>
            <VerificationTag status={version?.status ?? 'missing'} label={version?.status === 'verified' ? 'Verified requirement' : 'Unverified draft'} />
            <span className="tag tag--outline">
              <KindIcon aria-hidden="true" /> {kind.label}
            </span>
            {req.safetySensitive && <span className="tag tag--warn">Safety-sensitive</span>}
          </>
        }
      />

      <div className="with-aside">
        <div className="stack-lg">
          <section className="official-box" aria-labelledby="official-title">
            <div className="official-box__label">
              <h2 id="official-title" className="eyebrow">
                {req.officialText ? 'Official requirement wording' : 'What this requirement covers'}
              </h2>
              {!req.officialText && <span className="tag tag--outline">ScoutPath summary · not official wording</span>}
            </div>
            {req.officialText ? <blockquote className="official-box__text" style={{ margin: 0 }}>{req.officialText}</blockquote> : <p className="official-box__summary">{req.summary}</p>}
            <p className="small muted" style={{ marginTop: 'var(--s-4)' }}>
              {req.officialText
                ? 'Reproduced from the source listed under Source and verification.'
                : 'This summary describes the topic so you can find resources. It may simplify or omit details, and numbering may differ from the current official version.'}{' '}
              <ExternalLink href={version?.sourceUrl ?? ('officialUrl' in owner ? owner.officialUrl : 'https://www.scouting.org/')}>Read the official {officialName} requirements</ExternalLink>
            </p>
          </section>

          <div className="kind-note">
            <KindIcon size={18} aria-hidden="true" />
            <p>
              <strong>{kind.label}.</strong> {kind.text}
            </p>
          </div>

          {req.safetySensitive && (
            <Callout tone="safety" title="Safety-sensitive topic">
              Follow current guidance from qualified instructors, your counselor and local emergency services. Online material is background reading and
              is no substitute for hands-on training or supervision.
            </Callout>
          )}
          {req.note && <Callout title="Note">{req.note}</Callout>}

          <section aria-labelledby="orientation-title">
            <div className="section-head section-head--serif">
              <h2 id="orientation-title">Orientation</h2>
              <span className="section-head__aside">Written by ScoutPath</span>
            </div>
            {req.orientation ? (
              <p className="orientation">{req.orientation}</p>
            ) : (
              <p className="muted">
                An orientation for this requirement has not been written yet.{' '}
                {mapped.length > 0 ? 'The resources below are a good place to start.' : 'Your handbook or merit badge pamphlet and your counselor are the best starting points.'}
              </p>
            )}
          </section>

          {!node.isLeaf && (
            <section aria-labelledby="subs-title">
              <div className="section-head">
                <h2 id="subs-title">Sub-requirements</h2>
              </div>
              <ul className="sub-list">
                {node.childIds.map((id) => {
                  const child = content.requirements.get(id)!;
                  return (
                    <li key={id}>
                      <Link to={child.path} className="req-item" style={{ borderBottom: '1px solid var(--border)', borderRadius: 0 }}>
                        <span className="req-item__number">{child.requirement.number}</span>
                        <span>
                          <span className="req-item__title">{child.requirement.title}</span>
                          <span className="req-item__summary" style={{ display: 'block' }}>
                            {child.requirement.summary}
                          </span>
                        </span>
                        <span className="req-item__side">
                          <StatePill state={stateOf(data, id)} />
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          <section aria-labelledby="resources-title">
            <div className="section-head">
              <h2 id="resources-title">Learning resources</h2>
              {mapped.length > 0 && <span className="section-head__aside">{mapped.length} curated · background learning only</span>}
            </div>
            {mapped.length > 0 ? (
              <ul className="resource-list">
                {mapped.map(({ resource, mapping }) => (
                  <li key={resource.id}>
                    <ResourceRow resource={resource} relevance={mapping.relevance} />
                  </li>
                ))}
              </ul>
            ) : childResources.length > 0 ? (
              <p className="muted">
                Resources are attached to the individual sub-requirements above. Open one to see what is available for that step.
              </p>
            ) : (
              <EmptyState
                icon={SearchX}
                title="No resources curated yet"
                actions={
                  <>
                    <button type="button" className="btn" onClick={() => palette.open(req.title)}>
                      Search related topics
                    </button>
                    <Link to={ownerBase} className="btn btn--ghost">
                      Back to {node.ownerName}
                    </Link>
                  </>
                }
              >
                ScoutPath has not yet found and reviewed resources for this requirement. Your handbook, merit badge pamphlet and counselor are the best
                guides for it.
              </EmptyState>
            )}
          </section>

          {(practice.length > 0 || ownerStudy.length > 0) && (
            <section aria-labelledby="practice-title">
              <div className="section-head">
                <h2 id="practice-title">Practice</h2>
                <span className="section-head__aside">{practice.length ? 'Covers this requirement' : `Related to ${node.ownerName}`}</span>
              </div>
              <ul className="plain-list" style={{ display: 'grid', gap: 'var(--s-3)' }}>
                {(practice.length ? practice : ownerStudy).map((s) => (
                  <li key={s.id}>
                    <Link
                      to={`/study/${s.slug}`}
                      className="continue-row continue-row--simple"
                      style={{ background: 'var(--paper)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: 'var(--s-4)' }}
                    >
                      <span>
                        <span className="continue-row__title">
                          <GraduationCap size={15} aria-hidden="true" style={{ display: 'inline', verticalAlign: '-2px', marginRight: 6 }} />
                          {s.title}
                        </span>
                        <span className="continue-row__meta">
                          {s.flashcards.length} flashcards · {s.quiz.length}-question practice quiz · study guide. Practice only, not an official test.
                        </span>
                      </span>
                      <ArrowRight size={16} aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {related.length > 0 && (
            <section aria-labelledby="related-title">
              <div className="section-head">
                <h2 id="related-title">Related requirements</h2>
                <span className="section-head__aside">Overlapping skills elsewhere</span>
              </div>
              <ul className="sub-list">
                {related.map((r) => (
                  <li key={r.id}>
                    <Link to={r.path} className="req-item" style={{ borderBottom: '1px solid var(--border)', borderRadius: 0 }}>
                      <Link2 size={16} aria-hidden="true" style={{ color: 'var(--text-muted)' }} />
                      <span>
                        <span className="req-item__title">
                          {r.ownerName} {r.requirement.number} · {r.requirement.title}
                        </span>
                        <span className="req-item__summary" style={{ display: 'block' }}>
                          {r.ownerType === 'badge' ? 'Merit badge' : 'Rank'} requirement
                        </span>
                      </span>
                      <span className="req-item__side">
                        <StatePill state={stateOf(data, r.id)} />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <nav className="prev-next" aria-label="Requirement navigation">
            {prev ? (
              <Link to={prev.path}>
                <span className="prev-next__label">
                  <ArrowLeft size={13} aria-hidden="true" /> Previous
                </span>
                <span className="prev-next__title">
                  {prev.requirement.number} · {prev.requirement.title}
                </span>
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link to={next.path} className="next">
                <span className="prev-next__label">
                  Next <ArrowRight size={13} aria-hidden="true" />
                </span>
                <span className="prev-next__title">
                  {next.requirement.number} · {next.requirement.title}
                </span>
              </Link>
            ) : (
              <span />
            )}
          </nav>
        </div>

        <aside className="with-aside__aside">
          <ProgressPanel node={node} />
          <NotesPanel key={node.id} requirementId={node.id} />
          <Link to={ownerBase} className="btn">
            <ArrowLeft size={16} aria-hidden="true" /> All {node.ownerName} requirements
          </Link>
          <section className="panel panel--muted" aria-labelledby="source-title">
            <h2 className="panel__title" id="source-title">
              <Library size={16} aria-hidden="true" /> Source and verification
            </h2>
            <dl className="meta-list">
              <div>
                <dt>Status</dt>
                <dd>{version?.status === 'verified' ? 'Verified against the official source' : 'Not yet verified against the official source'}</dd>
              </div>
              <div>
                <dt>Dataset</dt>
                <dd>{version?.label ?? '—'}</dd>
              </div>
              <div>
                <dt>Requirement ID</dt>
                <dd>
                  <code>{node.id}</code>
                </dd>
              </div>
            </dl>
            <p className="field__hint" style={{ marginTop: 'var(--s-3)' }}>
              Requirements change over time, and not every version applies to every Scout. Ask your unit leader which version you should follow.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
