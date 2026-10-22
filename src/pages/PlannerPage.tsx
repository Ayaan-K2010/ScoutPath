import { CalendarDays, CalendarPlus, Plus, Printer, RefreshCw, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Callout } from '../components/Callout';
import { Dialog } from '../components/Dialog';
import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';
import { PrintHeader } from '../components/PrintHeader';
import { content } from '../features/content/data';
import { leafRequirementIds } from '../features/content/model';
import { generateSchedule, type ScheduleResult } from '../features/planner/schedule';
import { removePlan, upsertPlan } from '../features/progress/actions';
import type { Plan, PlanSession } from '../features/progress/schema';
import { stateOf } from '../features/progress/summary';
import { useDocumentTitle } from '../hooks/usePageMeta';
import { useUpdateUser, useUserData } from '../hooks/useUserData';
import { todayKey } from '../features/progress/actions';
import { formatShortDate, minutesLabel } from '../lib/format';
import { uid } from '../lib/ids';
import { useToast } from '../lib/toastContext';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return date.toISOString().slice(0, 10);
}

const targets = [
  ...content.ranks.filter((r) => r.version).map((r) => ({ id: r.id, kind: 'rank' as const, label: `${r.name} rank` })),
  ...content.badges.filter((b) => b.version).map((b) => ({ id: b.id, kind: 'badge' as const, label: `${b.name} merit badge` })),
];

function sessionsFrom(result: ScheduleResult): PlanSession[] {
  return result.sessions.map((s) => ({ id: uid('ses'), date: s.date, requirementId: s.requirementId, minutes: s.minutes, part: s.part, parts: s.parts, done: false }));
}

function PlanBuilder({ initialTarget, existing, onDone }: { initialTarget: string | null; existing?: Plan; onDone: (plan: Plan) => void }) {
  const data = useUserData();
  const today = todayKey();
  const [targetId, setTargetId] = useState(existing?.target.id ?? (initialTarget && targets.some((t) => t.id === initialTarget) ? initialTarget : (data.profile.selectedRankId ?? targets[0]?.id ?? '')));
  const leaves = useMemo(() => leafRequirementIds(content, targetId), [targetId]);
  const [selected, setSelected] = useState<string[]>(() => existing?.requirementIds ?? leaves.filter((id) => stateOf(data, id) !== 'completed-personal'));
  const [startDate, setStartDate] = useState(existing?.startDate ?? today);
  const [targetDate, setTargetDate] = useState(existing?.targetDate ?? addDays(today, 28));
  const [days, setDays] = useState<number[]>(existing?.availableDays ?? [1, 3, 6]);
  const [dailyMinutes, setDailyMinutes] = useState(existing?.dailyMinutes ?? 45);
  const [estimates, setEstimates] = useState<Record<string, number | null>>(existing?.estimates ?? {});

  const changeTarget = (id: string) => {
    setTargetId(id);
    setSelected(leafRequirementIds(content, id).filter((r) => stateOf(data, r) !== 'completed-personal'));
  };

  const target = targets.find((t) => t.id === targetId);
  const preview = generateSchedule({
    tasks: selected.map((id) => ({ requirementId: id, minutes: estimates[id] ?? null })),
    startDate,
    targetDate,
    availableDays: days,
    dailyMinutes,
  });
  const blocking = preview.warnings.some((w) => w.code === 'no-tasks' || w.code === 'date-order' || w.code === 'no-days' || w.code === 'budget');

  const create = () => {
    if (!target) return;
    const now = new Date().toISOString();
    const keepDone = existing?.sessions.filter((s) => s.done) ?? [];
    onDone({
      id: existing?.id ?? uid('plan'),
      title: target.label,
      target: { kind: target.kind, id: target.id },
      requirementIds: selected,
      startDate,
      targetDate,
      availableDays: [...days].sort(),
      dailyMinutes,
      estimates: Object.fromEntries(selected.map((id) => [id, estimates[id] ?? null])),
      sessions: [...keepDone, ...sessionsFrom(preview)],
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    });
  };

  return (
    <form
      className="stack-lg"
      onSubmit={(e) => {
        e.preventDefault();
        if (!blocking) create();
      }}
    >
      <div className="form-grid">
        <div className="field">
          <label htmlFor="plan-target">What are you studying?</label>
          <select id="plan-target" className="select" value={targetId} onChange={(e) => changeTarget(e.target.value)} disabled={Boolean(existing)}>
            {targets.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
          <span className="field__hint">Only ranks and badges with a ScoutPath outline can be planned.</span>
        </div>
        <div className="field">
          <label htmlFor="plan-start">Start date</label>
          <input id="plan-start" type="date" className="input" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="plan-end">Target date</label>
          <input id="plan-end" type="date" className="input" value={targetDate} min={startDate} onChange={(e) => setTargetDate(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="plan-minutes">Study time per day (minutes)</label>
          <input
            id="plan-minutes"
            type="number"
            className="input"
            min={15}
            max={600}
            step={5}
            value={dailyMinutes}
            onChange={(e) => setDailyMinutes(Math.max(0, Math.min(600, Number(e.target.value) || 0)))}
          />
        </div>
      </div>
      <fieldset className="field">
        <legend>Days you can study</legend>
        <div className="day-picker">
          {WEEKDAYS.map((label, i) => (
            <label className="chip" key={label}>
              <input type="checkbox" checked={days.includes(i)} onChange={(e) => setDays(e.target.checked ? [...days, i] : days.filter((d) => d !== i))} />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="section-head" style={{ width: '100%', display: 'flex' }}>
          <span style={{ fontWeight: 650, fontSize: 'var(--fs-lg)' }}>Requirements and time estimates</span>
        </legend>
        <p className="small muted" style={{ marginBottom: 'var(--s-4)' }}>
          ScoutPath does not know how long each requirement takes you. Enter your own estimate where you can. Items left blank are scheduled as
          “time unknown” placeholders and are not counted against your daily budget.
        </p>
        <div className="table-wrap">
          <table className="table estimate-table">
            <thead>
              <tr>
                <th scope="col">Include</th>
                <th scope="col">Requirement</th>
                <th scope="col">Your estimate (min)</th>
              </tr>
            </thead>
            <tbody>
              {leaves.map((id) => {
                const node = content.requirements.get(id)!;
                const checked = selected.includes(id);
                const done = stateOf(data, id) === 'completed-personal';
                return (
                  <tr key={id}>
                    <td>
                      <input
                        type="checkbox"
                        aria-label={`Include ${node.requirement.number} ${node.requirement.title}`}
                        checked={checked}
                        onChange={(e) => setSelected(e.target.checked ? leaves.filter((x) => x === id || selected.includes(x)) : selected.filter((x) => x !== id))}
                        style={{ width: '1.1rem', height: '1.1rem', accentColor: 'var(--forest)' }}
                      />
                    </td>
                    <td>
                      <strong>{node.requirement.number}</strong> {node.requirement.title}
                      {done && <span className="tag tag--ok" style={{ marginLeft: 'var(--s-2)' }}>Completed (personal)</span>}
                    </td>
                    <td>
                      <label className="sr-only" htmlFor={`est-${id}`}>
                        Estimate in minutes for {node.requirement.number}
                      </label>
                      <input
                        id={`est-${id}`}
                        type="number"
                        min={5}
                        max={6000}
                        step={5}
                        className="input"
                        placeholder="Unknown"
                        disabled={!checked}
                        value={estimates[id] ?? ''}
                        onChange={(e) => setEstimates((est) => ({ ...est, [id]: e.target.value === '' ? null : Math.max(1, Math.round(Number(e.target.value))) }))}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </fieldset>

      <div className="panel panel--muted">
        <h3 className="panel__title">Preview</h3>
        <p className="small">
          {preview.workload.studyDays} study days · {preview.sessions.length} sessions · {minutesLabel(preview.workload.knownMinutes)} estimated of{' '}
          {minutesLabel(preview.workload.capacityMinutes)} available
          {preview.workload.unknownTasks ? ` · ${preview.workload.unknownTasks} without an estimate` : ''}
        </p>
        {preview.warnings.length > 0 && (
          <ul className="plain-list stack" style={{ marginTop: 'var(--s-3)' }}>
            {preview.warnings.map((w) => (
              <li key={w.code}>
                <Callout tone={w.code === 'unknown-durations' ? 'info' : 'warn'}>{w.message}</Callout>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="button-row">
        <button type="submit" className="btn btn--primary" disabled={blocking}>
          <CalendarPlus size={16} aria-hidden="true" /> {existing ? 'Rebuild schedule' : 'Create study plan'}
        </button>
        {existing && <span className="small muted">Completed sessions are kept; everything else is rescheduled.</span>}
      </div>
    </form>
  );
}

function SessionRow({ plan, session, onChange, onDelete }: { plan: Plan; session: PlanSession; onChange: (s: PlanSession) => void; onDelete: () => void }) {
  const node = content.requirements.get(session.requirementId);
  return (
    <div className="session" data-done={session.done}>
      <input
        type="checkbox"
        checked={session.done}
        onChange={(e) => onChange({ ...session, done: e.target.checked })}
        aria-label={`Mark study session for ${node?.requirement.number ?? session.requirementId} as done`}
        style={{ width: '1.15rem', height: '1.15rem', accentColor: 'var(--forest)' }}
      />
      <div>
        <div className="session__title">
          {node ? (
            <Link to={node.path}>
              {node.requirement.number} · {node.requirement.title}
            </Link>
          ) : (
            session.requirementId
          )}
        </div>
        <div className="session__meta">
          {minutesLabel(session.minutes)}
          {session.parts > 1 ? ` · part ${session.part} of ${session.parts}` : ''}
          {session.manual ? ' · added by you' : ''} · {plan.title}
        </div>
      </div>
      <div className="session__actions no-print">
        <label className="sr-only" htmlFor={`move-${session.id}`}>
          Move session to date
        </label>
        <input
          id={`move-${session.id}`}
          type="date"
          className="input"
          style={{ minHeight: '2.25rem', width: '9.5rem' }}
          value={session.date}
          onChange={(e) => e.target.value && onChange({ ...session, date: e.target.value })}
        />
        <button type="button" className="icon-button" aria-label="Delete session" onClick={onDelete}>
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

function PlanView({ plan, onEdit }: { plan: Plan; onEdit: () => void }) {
  const update = useUpdateUser();
  const toast = useToast();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [adding, setAdding] = useState({ requirementId: plan.requirementIds[0] ?? '', date: todayKey(), minutes: '' });
  const today = todayKey();
  const save = (next: Plan) => update((d) => upsertPlan(d, next));

  const upcoming = plan.sessions.filter((s) => !s.done).sort((a, b) => a.date.localeCompare(b.date));
  const completed = plan.sessions.filter((s) => s.done).sort((a, b) => b.date.localeCompare(a.date));
  const scheduledIds = new Set(plan.sessions.map((s) => s.requirementId));
  const unscheduled = plan.requirementIds.filter((id) => !scheduledIds.has(id));
  const knownMinutes = plan.sessions.reduce((n, s) => n + (s.minutes ?? 0), 0);
  const doneMinutes = completed.reduce((n, s) => n + (s.minutes ?? 0), 0);
  const unknownCount = plan.sessions.filter((s) => s.minutes === null).length;
  const overdue = upcoming.filter((s) => s.date < today).length;

  const byDate = new Map<string, PlanSession[]>();
  for (const s of upcoming) byDate.set(s.date, [...(byDate.get(s.date) ?? []), s]);
  const overBudgetDays = [...byDate.entries()].filter(([, list]) => list.reduce((n, s) => n + (s.minutes ?? 0), 0) > plan.dailyMinutes).map(([d]) => d);

  const changeSession = (s: PlanSession) => save({ ...plan, sessions: plan.sessions.map((x) => (x.id === s.id ? s : x)) });
  const deleteSession = (id: string) => save({ ...plan, sessions: plan.sessions.filter((x) => x.id !== id) });

  return (
    <div className="stack-lg">
      <PrintHeader title={`Study plan: ${plan.title}`} />
      <div className="stat-strip">
        <div className="stat">
          <div className="stat__value">{upcoming.length}</div>
          <div className="stat__label">Upcoming sessions{overdue ? ` (${overdue} overdue)` : ''}</div>
        </div>
        <div className="stat">
          <div className="stat__value">{completed.length}</div>
          <div className="stat__label">Completed sessions</div>
        </div>
        <div className="stat">
          <div className="stat__value">{minutesLabel(knownMinutes)}</div>
          <div className="stat__label">Estimated workload ({minutesLabel(doneMinutes)} done)</div>
        </div>
        <div className="stat">
          <div className="stat__value">{unknownCount}</div>
          <div className="stat__label">Sessions with unknown length</div>
        </div>
      </div>

      <p className="small muted">
        {formatShortDate(plan.startDate)} to {formatShortDate(plan.targetDate)} · {plan.availableDays.map((d) => WEEKDAYS[d]).join(', ')} · up to {plan.dailyMinutes} min a day.
        Following a study plan helps you prepare; it does not complete requirements.
      </p>

      {overBudgetDays.length > 0 && (
        <Callout tone="warn" title="Time budget warning">
          {overBudgetDays.length} day{overBudgetDays.length === 1 ? ' has' : 's have'} more estimated study time than your {plan.dailyMinutes}-minute budget (
          {overBudgetDays.map(formatShortDate).join(', ')}). Move a session or adjust your budget.
        </Callout>
      )}
      {unscheduled.length > 0 && (
        <Callout tone="warn" title={`${unscheduled.length} requirement${unscheduled.length === 1 ? '' : 's'} not scheduled`}>
          {unscheduled.map((id) => content.requirements.get(id)?.requirement.number ?? id).join(', ')} did not fit before the target date. Add study days, extend the target
          date, or add sessions by hand below.
        </Callout>
      )}

      <div className="button-row no-print">
        <button type="button" className="btn" onClick={onEdit}>
          <RefreshCw size={16} aria-hidden="true" /> Edit settings & rebuild
        </button>
        <button type="button" className="btn btn--ghost" onClick={() => window.print()}>
          <Printer size={16} aria-hidden="true" /> Print schedule
        </button>
        <button type="button" className="btn btn--danger" onClick={() => setConfirmDelete(true)}>
          <Trash2 size={16} aria-hidden="true" /> Delete plan
        </button>
      </div>

      <section aria-labelledby="upcoming-title">
        <div className="section-head">
          <h2 id="upcoming-title">Upcoming</h2>
        </div>
        {upcoming.length === 0 ? (
          <p className="muted">No upcoming sessions. Rebuild the schedule or add a session below.</p>
        ) : (
          <ol className="schedule">
            {[...byDate.entries()].map(([date, list]) => (
              <li key={date} className="schedule__day">
                <div className={`schedule__date${date < today ? ' schedule__date--past' : ''}`}>
                  {formatShortDate(date)}
                  <span>
                    {date === today ? 'Today' : date < today ? 'Overdue' : ''} {minutesLabel(list.reduce((n, s) => n + (s.minutes ?? 0), 0) || null)}
                  </span>
                </div>
                <div>
                  {list.map((s) => (
                    <SessionRow key={s.id} plan={plan} session={s} onChange={changeSession} onDelete={() => deleteSession(s.id)} />
                  ))}
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section aria-labelledby="add-title" className="no-print">
        <div className="section-head">
          <h2 id="add-title">Add a session</h2>
        </div>
        <form
          className="form-grid"
          onSubmit={(e) => {
            e.preventDefault();
            if (!adding.requirementId || !adding.date) return;
            const minutes = adding.minutes === '' ? null : Math.max(1, Math.round(Number(adding.minutes)));
            save({ ...plan, sessions: [...plan.sessions, { id: uid('ses'), date: adding.date, requirementId: adding.requirementId, minutes, part: 1, parts: 1, done: false, manual: true }] });
            toast.show('Session added');
          }}
        >
          <div className="field">
            <label htmlFor="add-req">Requirement</label>
            <select id="add-req" className="select" value={adding.requirementId} onChange={(e) => setAdding({ ...adding, requirementId: e.target.value })}>
              {plan.requirementIds.map((id) => {
                const n = content.requirements.get(id);
                return (
                  <option key={id} value={id}>
                    {n ? `${n.requirement.number} · ${n.requirement.title}` : id}
                  </option>
                );
              })}
            </select>
          </div>
          <div className="field">
            <label htmlFor="add-date">Date</label>
            <input id="add-date" type="date" className="input" value={adding.date} onChange={(e) => setAdding({ ...adding, date: e.target.value })} />
          </div>
          <div className="field">
            <label htmlFor="add-min">Minutes (optional)</label>
            <input id="add-min" type="number" min={5} step={5} className="input" placeholder="Unknown" value={adding.minutes} onChange={(e) => setAdding({ ...adding, minutes: e.target.value })} />
          </div>
          <div className="field" style={{ alignSelf: 'end' }}>
            <button type="submit" className="btn">
              <Plus size={16} aria-hidden="true" /> Add session
            </button>
          </div>
        </form>
      </section>

      {completed.length > 0 && (
        <section aria-labelledby="done-title">
          <div className="section-head">
            <h2 id="done-title">Completed study sessions</h2>
          </div>
          <div>
            {completed.map((s) => (
              <SessionRow key={s.id} plan={plan} session={s} onChange={changeSession} onDelete={() => deleteSession(s.id)} />
            ))}
          </div>
        </section>
      )}

      <Dialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete this study plan?"
        footer={
          <>
            <button type="button" className="btn btn--ghost" onClick={() => setConfirmDelete(false)}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn--danger-solid"
              onClick={() => {
                update((d) => removePlan(d, plan.id));
                setConfirmDelete(false);
                toast.show('Plan deleted');
              }}
            >
              Delete plan
            </button>
          </>
        }
      >
        <div className="dialog__body">
          <p>The schedule for {plan.title} will be removed from this browser. Your requirement progress and notes are not affected.</p>
        </div>
      </Dialog>
    </div>
  );
}

export function PlannerPage() {
  useDocumentTitle('Learning planner');
  const data = useUserData();
  const update = useUpdateUser();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const initialTarget = params.get('target');
  const [activeId, setActiveId] = useState<string | null>(() => (initialTarget ? null : (data.plans[0]?.id ?? null)));
  const [mode, setMode] = useState<'view' | 'new' | 'edit'>(() => (initialTarget || data.plans.length === 0 ? 'new' : 'view'));
  const active = data.plans.find((p) => p.id === activeId) ?? null;

  const finish = (plan: Plan) => {
    update((d) => upsertPlan(d, plan));
    setActiveId(plan.id);
    setMode('view');
    if (initialTarget) setParams({}, { replace: true });
    toast.show(mode === 'edit' ? 'Schedule rebuilt' : 'Study plan created');
  };

  return (
    <div className="container page">
      <PageHeader
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Planner' }]}
        title="Learning planner"
        lede="Choose a rank or badge, the days you can study and how much time you have. ScoutPath lays out study sessions, warns when the plan does not fit, and lets you rearrange everything."
      />
      {targets.length === 0 ? (
        <EmptyState icon={CalendarDays} title="Nothing to plan yet">
          Plans need a requirement outline, and none are available.
        </EmptyState>
      ) : (
        <div className="stack-lg">
          {data.plans.length > 0 && (
            <div className="tabs no-print" role="tablist" aria-label="Your plans">
              {data.plans.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  role="tab"
                  className="tab"
                  aria-selected={mode !== 'new' && p.id === activeId}
                  onClick={() => {
                    setActiveId(p.id);
                    setMode('view');
                  }}
                >
                  {p.title}
                </button>
              ))}
              <button type="button" role="tab" className="tab" aria-selected={mode === 'new'} onClick={() => setMode('new')}>
                <Plus size={15} aria-hidden="true" /> New plan
              </button>
            </div>
          )}
          {mode === 'new' && <PlanBuilder key={`new-${initialTarget ?? ''}`} initialTarget={initialTarget} onDone={finish} />}
          {mode === 'edit' && active && <PlanBuilder key={`edit-${active.id}`} initialTarget={null} existing={active} onDone={finish} />}
          {mode === 'view' && active && <PlanView key={active.id} plan={active} onEdit={() => setMode('edit')} />}
          {mode === 'view' && !active && (
            <EmptyState icon={CalendarDays} title="Choose a plan" actions={<button type="button" className="btn btn--primary" onClick={() => setMode('new')}>Create a plan</button>}>
              Select one of your plans above, or create a new one.
            </EmptyState>
          )}
        </div>
      )}
    </div>
  );
}
