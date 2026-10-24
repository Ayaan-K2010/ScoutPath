/**
 * Deterministic study scheduler.
 *
 * Tasks are placed in order onto the available study days between the start
 * and target dates. Tasks with a known estimate consume the daily budget and
 * are split into sessions of at least MIN_CHUNK minutes (where the split allows) when they do not fit
 * in one day. Tasks without an estimate are never given an invented duration:
 * they get a single "time unknown" session on a day that does not already
 * hold one, and they are counted separately in the workload.
 */
export interface ScheduleTask {
  requirementId: string;
  minutes: number | null;
}

export interface ScheduleInput {
  tasks: ScheduleTask[];
  startDate: string;
  targetDate: string;
  availableDays: number[];
  dailyMinutes: number;
}

export interface ScheduledSession {
  date: string;
  requirementId: string;
  minutes: number | null;
  part: number;
  parts: number;
}

export interface ScheduleWarning {
  code: 'no-days' | 'date-order' | 'over-capacity' | 'unscheduled' | 'unknown-durations' | 'no-tasks' | 'budget';
  message: string;
}

export interface ScheduleResult {
  sessions: ScheduledSession[];
  unscheduled: { requirementId: string; minutesRemaining: number | null }[];
  warnings: ScheduleWarning[];
  workload: {
    knownMinutes: number;
    unknownTasks: number;
    capacityMinutes: number;
    studyDays: number;
    utilization: number | null;
  };
}

export const MIN_CHUNK = 15;

function parseDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function studyDays(startDate: string, targetDate: string, availableDays: number[]): string[] {
  const out: string[] = [];
  const start = parseDate(startDate);
  const end = parseDate(targetDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return out;
  const allowed = new Set(availableDays);
  for (let d = new Date(start); d <= end && out.length < 3660; d.setUTCDate(d.getUTCDate() + 1)) {
    if (allowed.has(d.getUTCDay())) out.push(formatDate(d));
  }
  return out;
}

export function generateSchedule(input: ScheduleInput): ScheduleResult {
  const warnings: ScheduleWarning[] = [];
  const days = studyDays(input.startDate, input.targetDate, input.availableDays);
  const budget = Math.max(0, Math.floor(input.dailyMinutes));
  const knownMinutes = input.tasks.reduce((n, t) => n + (t.minutes ?? 0), 0);
  const unknownTasks = input.tasks.filter((t) => t.minutes === null).length;
  const capacityMinutes = days.length * budget;

  if (input.tasks.length === 0) warnings.push({ code: 'no-tasks', message: 'Choose at least one requirement to plan.' });
  if (parseDate(input.targetDate) < parseDate(input.startDate)) warnings.push({ code: 'date-order', message: 'The target date is before the start date.' });
  if (input.availableDays.length === 0) warnings.push({ code: 'no-days', message: 'Choose at least one day of the week for studying.' });
  else if (days.length === 0 && !warnings.some((w) => w.code === 'date-order')) warnings.push({ code: 'no-days', message: 'None of your chosen weekdays fall between the start and target dates.' });
  if (budget < MIN_CHUNK) warnings.push({ code: 'budget', message: `A daily budget under ${MIN_CHUNK} minutes is too small to schedule sessions.` });

  const capacity = days.map(() => budget);
  const hasUnknown = days.map(() => false);
  const sessions: ScheduledSession[] = [];
  const unscheduled: ScheduleResult['unscheduled'] = [];
  let cursor = 0;

  for (const task of input.tasks) {
    if (task.minutes === null) {
      let placed = false;
      for (let i = cursor; i < days.length; i++) {
        if (!hasUnknown[i] && capacity[i] > 0) {
          hasUnknown[i] = true;
          sessions.push({ date: days[i], requirementId: task.requirementId, minutes: null, part: 1, parts: 1 });
          cursor = i;
          placed = true;
          break;
        }
      }
      if (!placed) unscheduled.push({ requirementId: task.requirementId, minutesRemaining: null });
      continue;
    }

    let remaining = task.minutes;
    const pieces: { dayIndex: number; minutes: number }[] = [];
    for (let i = cursor; i < days.length && remaining > 0; i++) {
      const free = capacity[i];
      const minimum = Math.min(MIN_CHUNK, remaining);
      if (free < minimum) continue;
      let chunk = Math.min(free, remaining);
      // Avoid leaving a final session shorter than MIN_CHUNK when a split can absorb it.
      const tail = remaining - chunk;
      if (tail > 0 && tail < MIN_CHUNK && remaining - MIN_CHUNK >= MIN_CHUNK) chunk = remaining - MIN_CHUNK;
      capacity[i] -= chunk;
      remaining -= chunk;
      pieces.push({ dayIndex: i, minutes: chunk });
      cursor = i;
    }
    pieces.forEach((p, index) =>
      sessions.push({ date: days[p.dayIndex], requirementId: task.requirementId, minutes: p.minutes, part: index + 1, parts: pieces.length }),
    );
    if (remaining > 0) unscheduled.push({ requirementId: task.requirementId, minutesRemaining: remaining });
  }

  if (knownMinutes > capacityMinutes && capacityMinutes > 0) {
    warnings.push({
      code: 'over-capacity',
      message: `Your estimates add up to ${knownMinutes} minutes, but the days you chose allow ${capacityMinutes}. Add study days, raise the daily budget, or move the target date.`,
    });
  }
  if (unscheduled.length) warnings.push({ code: 'unscheduled', message: `${unscheduled.length} requirement${unscheduled.length === 1 ? '' : 's'} could not be fully scheduled before the target date.` });
  if (unknownTasks) {
    warnings.push({
      code: 'unknown-durations',
      message: `${unknownTasks} requirement${unknownTasks === 1 ? ' has' : 's have'} no time estimate. ${unknownTasks === 1 ? 'Its session is' : 'Their sessions are'} placeholders and ${unknownTasks === 1 ? 'is' : 'are'} not counted against your daily budget. Add your own estimate for a more realistic plan.`,
    });
  }

  sessions.sort((a, b) => a.date.localeCompare(b.date));
  return {
    sessions,
    unscheduled,
    warnings,
    workload: {
      knownMinutes,
      unknownTasks,
      capacityMinutes,
      studyDays: days.length,
      utilization: capacityMinutes > 0 ? Math.round((Math.min(knownMinutes, capacityMinutes) / capacityMinutes) * 100) : null,
    },
  };
}
