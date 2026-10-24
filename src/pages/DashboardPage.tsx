import { ArrowRight, Bookmark, CalendarDays, Check, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { BadgeMark } from '../components/BadgeMark';
import { PageHeader } from '../components/PageHeader';
import { ProgressMeter } from '../components/ProgressMeter';
import { StatePill } from '../components/StatePill';
import { SuggestedTasks } from '../components/SuggestedTasks';
import { resourcePath } from '../lib/labels';
import { content } from '../features/content/data';
import { addGoal, removeGoal, setSelectedRank, todayKey, toggleGoal } from '../features/progress/actions';
import { inProgress, ownerProgress } from '../features/progress/summary';
import { useDocumentTitle } from '../hooks/usePageMeta';
import { useUpdateUser, useUserData } from '../hooks/useUserData';
import { formatIsoDate, formatShortDate, minutesLabel, relativeTime } from '../lib/format';
import { uid } from '../lib/ids';

function Section({ id, title, action, children }: { id: string; title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id}>
      <div className="section-head">
        <h2 id={id} style={{ fontSize: 'var(--fs-lg)' }}>
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Goals() {
  const data = useUserData();
  const update = useUpdateUser();
  const [text, setText] = useState('');
  const [date, setDate] = useState('');
  return (
    <Section id="goals-title" title="Learning goals">
      {data.goals.length > 0 ? (
        <ul className="plain-list">
          {data.goals.map((g) => (
            <li key={g.id} className="goal-row" data-done={g.done}>
              <input type="checkbox" checked={g.done} onChange={() => update((d) => toggleGoal(d, g.id))} aria-label={`Mark goal “${g.text}” ${g.done ? 'not done' : 'done'}`} style={{ width: '1.1rem', height: '1.1rem', accentColor: 'var(--forest)' }} />
              <span>
                <span className="goal-row__text">{g.text}</span>
                {g.targetDate && <span className="field__hint" style={{ display: 'block' }}>by {formatIsoDate(g.targetDate)}</span>}
              </span>
              <button type="button" className="icon-button" aria-label={`Delete goal “${g.text}”`} onClick={() => update((d) => removeGoal(d, g.id))}>
                <Trash2 size={15} />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="small muted">Set a goal in your own words, like “Finish Tenderfoot first aid before summer camp.”</p>
      )}
      <form
        style={{ display: 'grid', gap: 'var(--s-2)', marginTop: 'var(--s-4)' }}
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim()) return;
          update((d) => addGoal(d, text, date || null, uid('goal')));
          setText('');
          setDate('');
        }}
      >
        <label htmlFor="goal-text" className="sr-only">
          New goal
        </label>
        <input id="goal-text" className="input" placeholder="Add a goal…" maxLength={300} value={text} onChange={(e) => setText(e.target.value)} />
        <div style={{ display: 'flex', gap: 'var(--s-2)' }}>
          <label htmlFor="goal-date" className="sr-only">
            Target date (optional)
          </label>
          <input id="goal-date" type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
          <button type="submit" className="btn" disabled={!text.trim()}>
            <Plus size={16} aria-hidden="true" /> Add
          </button>
        </div>
      </form>
    </Section>
  );
}

function Activity() {
  const data = useUserData();
  const cells = Array.from({ length: 28 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (27 - i));
    const key = todayKey(d);
    const n = data.activity[key] ?? 0;
    return { key, n, level: n === 0 ? 0 : n < 3 ? 1 : n < 8 ? 2 : 3 };
  });
  const activeDays = cells.filter((c) => c.n > 0).length;
  const quizzes = Object.entries(data.quizzes)
    .map(([setId, q]) => ({ set: content.studyById.get(setId), last: q.attempts[q.attempts.length - 1] }))
    .filter((q) => q.set && q.last);
  return (
    <Section id="activity-title" title="Study activity">
      <p className="small muted" style={{ marginBottom: 'var(--s-3)' }}>
        You studied on {activeDays} of the last 28 days. Counts progress updates, flashcards and practice quizzes.
      </p>
      <div className="activity" role="img" aria-label={`Study activity: active on ${activeDays} of the last 28 days`}>
        {cells.map((c) => (
          <span key={c.key} className="activity__cell" data-level={c.level} title={`${formatIsoDate(c.key)}: ${c.n} learning actions`} />
        ))}
      </div>
      {quizzes.length > 0 && (
        <ul className="plain-list" style={{ marginTop: 'var(--s-4)', fontSize: 'var(--fs-sm)' }}>
          {quizzes.map(({ set, last }) => (
            <li key={set!.id} style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--s-2) 0', borderBottom: '1px solid var(--border)' }}>
              <Link to={`/study/${set!.slug}?tab=quiz`}>{set!.title} quiz</Link>
              <span className="muted tabular">
                {last!.score}/{last!.total} · {relativeTime(last!.at)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

export function DashboardPage() {
  useDocumentTitle('Dashboard');
  const data = useUserData();
  const update = useUpdateUser();
  const active = inProgress(content, data).slice(0, 6);
  const rank = data.profile.selectedRankId ? content.rankById.get(data.profile.selectedRankId) : undefined;
  const badges = data.profile.selectedBadgeIds.map((id) => content.badgeById.get(id)).filter((b) => b !== undefined);
  const saved = Object.entries(data.saved)
    .sort((a, b) => b[1].savedAt.localeCompare(a[1].savedAt))
    .map(([id]) => content.resourceById.get(id))
    .filter((r) => r !== undefined)
    .slice(0, 5);
  const today = todayKey();
  const sessions = data.plans
    .flatMap((p) => p.sessions.filter((s) => !s.done && s.date >= today).map((s) => ({ ...s, plan: p })))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);
  const isEmpty = !rank && badges.length === 0 && active.length === 0 && saved.length === 0 && data.recent.length === 0;

  return (
    <div className="container page">
      <PageHeader
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Dashboard' }]}
        title="Your learning dashboard"
        lede="Everything here is stored only in this browser. Nothing is shared, synced or sent anywhere."
        actions={
          <>
            <Link to="/planner" className="btn">
              <CalendarDays size={16} aria-hidden="true" /> Planner
            </Link>
            <Link to="/settings" className="btn btn--ghost">
              Export or back up
            </Link>
          </>
        }
      />

      {isEmpty && (
        <div className="panel panel--muted" style={{ marginBottom: 'var(--s-10)', padding: 'var(--s-8)' }}>
          <h2 className="how__title" style={{ maxWidth: 'none' }}>
            Welcome. Let’s set up your path.
          </h2>
          <p className="muted" style={{ marginTop: 'var(--s-3)', maxWidth: '60ch' }}>
            Choose the rank you are working on, then add any merit badges you have started. Your dashboard will fill in as you mark progress, save
            resources and practice.
          </p>
          <div className="button-row" style={{ marginTop: 'var(--s-5)' }}>
            <label htmlFor="dash-rank" className="sr-only">
              Your current rank
            </label>
            <select id="dash-rank" className="select" style={{ width: 'auto' }} value="" onChange={(e) => e.target.value && update((d) => setSelectedRank(d, e.target.value))}>
              <option value="">Choose your current rank…</option>
              {content.ranks.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
            <Link to="/merit-badges" className="btn">
              Find merit badges
            </Link>
          </div>
        </div>
      )}

      <div className="dash-grid">
        <div className="stack-lg">
          <Section id="continue-title" title="Continue learning">
            {active.length ? (
              <ul className="plain-list">
                {active.map((a) => {
                  const node = content.requirements.get(a.requirementId)!;
                  return (
                    <li key={a.requirementId}>
                      <Link to={node.path} className="continue-row">
                        <span className="continue-row__num">{node.requirement.number}</span>
                        <span>
                          <span className="continue-row__title">{node.requirement.title}</span>
                          <span className="continue-row__meta">
                            {node.ownerName} · updated {relativeTime(a.updatedAt)}
                          </span>
                        </span>
                        <StatePill state={a.state} />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="small muted">Requirements you mark as “Learning” or “Ready for review” will appear here.</p>
            )}
          </Section>

          <Section
            id="rank-title"
            title={rank ? `Current rank: ${rank.name}` : 'Current rank'}
            action={
              rank && (
                <Link to={`/ranks/${rank.slug}`} className="text-link">
                  Open checklist <ArrowRight size={14} className="arrow" aria-hidden="true" />
                </Link>
              )
            }
          >
            {rank ? (
              <div className="stack">
                {(() => {
                  const s = ownerProgress(content, data, rank.id);
                  return (
                    <>
                      <ProgressMeter counts={s.counts} total={s.total} label={`${rank.name} progress`} size="lg" showLegend />
                      {s.partial && s.partialReason && <p className="field__hint">Partial figure. {s.partialReason}</p>}
                    </>
                  );
                })()}
                <h3 className="mini-heading" style={{ marginTop: 'var(--s-5)' }}>
                  Suggested next
                </h3>
                <SuggestedTasks ownerId={rank.id} />
              </div>
            ) : (
              <p className="small muted">
                No rank selected. <Link to="/ranks">Choose the rank you are working on</Link>.
              </p>
            )}
          </Section>

          <Section
            id="badges-title"
            title="My merit badges"
            action={
              <Link to="/merit-badges" className="text-link">
                Browse badges <ArrowRight size={14} className="arrow" aria-hidden="true" />
              </Link>
            }
          >
            {badges.length ? (
              <ul className="plain-list">
                {badges.map((b) => {
                  const s = ownerProgress(content, data, b.id);
                  return (
                    <li key={b.id} className="owner-progress">
                      <div className="owner-progress__head">
                        <Link to={`/merit-badges/${b.slug}`} className="owner-progress__name" style={{ display: 'flex', gap: 'var(--s-3)', alignItems: 'center' }}>
                          <BadgeMark category={b.category} size="sm" />
                          {b.name}
                        </Link>
                        <span className="small muted tabular">{s.total ? `${s.counts['completed-personal']}/${s.total}` : 'No outline yet'}</span>
                      </div>
                      {s.total > 0 && <ProgressMeter counts={s.counts} total={s.total} label={`${b.name} progress`} />}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="small muted">Use “Add to my badges” on any merit badge page to track it here.</p>
            )}
          </Section>

          <Section
            id="sessions-title"
            title="Upcoming study sessions"
            action={
              <Link to="/planner" className="text-link">
                Planner <ArrowRight size={14} className="arrow" aria-hidden="true" />
              </Link>
            }
          >
            {sessions.length ? (
              <ul className="plain-list">
                {sessions.map((s) => {
                  const node = content.requirements.get(s.requirementId);
                  return (
                    <li key={s.id} className="goal-row" style={{ gridTemplateColumns: '7rem minmax(0,1fr) auto' }}>
                      <strong className="small">{s.date === today ? 'Today' : formatShortDate(s.date)}</strong>
                      <span>{node ? <Link to={node.path}>{`${node.ownerName} ${node.requirement.number} · ${node.requirement.title}`}</Link> : s.requirementId}</span>
                      <span className="small muted">{minutesLabel(s.minutes)}</span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="small muted">
                No sessions scheduled. <Link to="/planner">Build a study plan</Link>.
              </p>
            )}
          </Section>
        </div>

        <div className="stack-lg">
          <Goals />
          <Section
            id="saved-title"
            title="Saved resources"
            action={
              <Link to="/saved" className="text-link">
                All <ArrowRight size={14} className="arrow" aria-hidden="true" />
              </Link>
            }
          >
            {saved.length ? (
              <ul className="plain-list">
                {saved.map((r) => (
                  <li key={r.id}>
                    <Link to={resourcePath(r)} className="continue-row continue-row--simple">
                      <span>
                        <span className="continue-row__title">{r.title}</span>
                        <span className="continue-row__meta">{r.publisher}</span>
                      </span>
                      <Bookmark size={14} aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="small muted">Saved resources appear here.</p>
            )}
          </Section>
          <Activity />
          <Section id="recent-title" title="Recently viewed">
            {data.recent.length ? (
              <ul className="plain-list">
                {data.recent.slice(0, 6).map((r) => (
                  <li key={`${r.kind}:${r.id}`}>
                    <Link to={r.path} className="continue-row continue-row--simple">
                      <span>
                        <span className="continue-row__title">{r.title}</span>
                        <span className="continue-row__meta">{relativeTime(r.viewedAt)}</span>
                      </span>
                      <Check size={14} aria-hidden="true" style={{ opacity: 0 }} />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="small muted">Nothing yet.</p>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}
