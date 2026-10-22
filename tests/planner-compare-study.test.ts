import { describe, expect, it } from 'vitest';
import { compareVersions } from '../src/features/content/compare';
import { generateSchedule, studyDays } from '../src/features/planner/schedule';
import { buildDeck, deckStats, scoreQuiz, shuffle } from '../src/features/study/logic';
import { requirementVersion, type QuizQuestion } from '../src/schemas/content';
import { version } from './fixtures';

// 2026-03-02 is a Monday.
const base = { startDate: '2026-03-02', targetDate: '2026-03-15', availableDays: [1, 3], dailyMinutes: 60 };

describe('planner scheduling', () => {
  it('lists study days within the range', () => {
    expect(studyDays('2026-03-02', '2026-03-15', [1, 3])).toEqual(['2026-03-02', '2026-03-04', '2026-03-09', '2026-03-11']);
    expect(studyDays('2026-03-10', '2026-03-01', [1])).toEqual([]);
  });

  it('packs tasks in order within the daily budget', () => {
    const r = generateSchedule({ ...base, tasks: [{ requirementId: 'a', minutes: 30 }, { requirementId: 'b', minutes: 30 }, { requirementId: 'c', minutes: 45 }] });
    expect(r.sessions.map((s) => [s.date, s.requirementId, s.minutes])).toEqual([
      ['2026-03-02', 'a', 30],
      ['2026-03-02', 'b', 30],
      ['2026-03-04', 'c', 45],
    ]);
    expect(r.warnings).toEqual([]);
  });

  it('splits long tasks into numbered sessions', () => {
    const r = generateSchedule({ ...base, tasks: [{ requirementId: 'long', minutes: 150 }] });
    expect(r.sessions.map((s) => [s.minutes, s.part, s.parts])).toEqual([
      [60, 1, 3],
      [60, 2, 3],
      [30, 3, 3],
    ]);
  });

  it('never invents durations for unknown tasks', () => {
    const r = generateSchedule({ ...base, tasks: [{ requirementId: 'x', minutes: null }, { requirementId: 'y', minutes: null }] });
    expect(r.sessions.every((s) => s.minutes === null)).toBe(true);
    expect(new Set(r.sessions.map((s) => s.date)).size).toBe(2);
    expect(r.workload.knownMinutes).toBe(0);
    expect(r.warnings.map((w) => w.code)).toContain('unknown-durations');
  });

  it('warns when the work does not fit and lists what is unscheduled', () => {
    const r = generateSchedule({ ...base, tasks: [{ requirementId: 'big', minutes: 300 }] });
    expect(r.unscheduled).toEqual([{ requirementId: 'big', minutesRemaining: 60 }]);
    expect(r.warnings.map((w) => w.code)).toEqual(expect.arrayContaining(['over-capacity', 'unscheduled']));
  });

  it('validates inputs', () => {
    expect(generateSchedule({ ...base, tasks: [] }).warnings.map((w) => w.code)).toContain('no-tasks');
    expect(generateSchedule({ ...base, availableDays: [], tasks: [{ requirementId: 'a', minutes: 10 }] }).warnings.map((w) => w.code)).toContain('no-days');
    expect(generateSchedule({ ...base, targetDate: '2026-02-01', tasks: [{ requirementId: 'a', minutes: 10 }] }).warnings.map((w) => w.code)).toContain('date-order');
    expect(generateSchedule({ ...base, dailyMinutes: 5, tasks: [{ requirementId: 'a', minutes: 10 }] }).warnings.map((w) => w.code)).toContain('budget');
  });

  it('is deterministic', () => {
    const input = { ...base, tasks: [{ requirementId: 'a', minutes: 70 }, { requirementId: 'b', minutes: null }, { requirementId: 'c', minutes: 20 }] };
    expect(generateSchedule(input)).toEqual(generateSchedule(input));
  });
});

describe('requirement version comparison', () => {
  const v1 = requirementVersion.parse(version());

  it('reports additions, removals, modifications and renumbering', () => {
    const raw = version({ versionId: 'v2' }) as ReturnType<typeof version>;
    const reqs = raw.requirements as Record<string, unknown>[];
    reqs[0] = { ...reqs[0], summary: 'Tying, using and inspecting basic knots.' };
    const lashings = reqs[1] as { children: Record<string, unknown>[] };
    lashings.children = [
      { ...lashings.children[0] },
      { id: 'mb.knots.2c', number: '2c', title: 'Shear lashing', summary: 'Binding parallel poles.', kind: 'demonstration', children: [] },
    ];
    reqs.push({ id: 'mb.knots.3', number: '3', title: 'Teaching knots', summary: 'Teach a knot to another Scout.', kind: 'activity', children: [] });
    const v2 = requirementVersion.parse(raw);
    const diff = compareVersions(v1, v2);
    expect(diff.modified.map((m) => m.after.id)).toEqual(['mb.knots.1']);
    expect(diff.modified[0].changes[0].field).toBe('summary');
    expect(diff.renumbered.map((r) => `${r.before.number}->${r.after.number}`)).toEqual(['2b->2c']);
    expect(diff.added.map((a) => a.id)).toEqual(['mb.knots.3']);
    expect(diff.removed).toEqual([]);
    expect(diff.unchanged).toBe(2);
  });

  it('detects a requirement that moved into a number another one used to have', () => {
    const raw = version({ versionId: 'v2' }) as ReturnType<typeof version>;
    const reqs = raw.requirements as Record<string, unknown>[];
    // Drop requirement 1 and renumber the old 2 tree as 1.
    const lashings = reqs[1] as { id: string; number: string; children: Record<string, unknown>[] };
    raw.requirements = [
      {
        ...lashings,
        id: 'mb.knots.1',
        number: '1',
        children: lashings.children.map((c) => ({ ...c, id: String(c.id).replace('.2', '.1'), number: String(c.number).replace('2', '1') })),
      },
    ] as never;
    const diff = compareVersions(v1, requirementVersion.parse(raw));
    expect(diff.renumbered.map((r) => `${r.before.number}->${r.after.number}`)).toEqual(['2->1', '2a->1a', '2b->1b']);
    expect(diff.removed.map((r) => r.number)).toEqual(['1']);
    expect(diff.modified).toEqual([]);
  });

  it('reports a removal', () => {
    const raw = version({ versionId: 'v2' }) as ReturnType<typeof version>;
    (raw.requirements as unknown[]).splice(0, 1);
    const diff = compareVersions(v1, requirementVersion.parse(raw));
    expect(diff.removed.map((r) => r.id)).toEqual(['mb.knots.1']);
  });
});

describe('study tools', () => {
  const cards = ['a', 'b', 'c', 'd'].map((id) => ({ id, front: `Q ${id}`, back: `A ${id}`, sourceResourceIds: ['res.x'] }));

  it('builds review decks and stats from marks', () => {
    const marks = { a: 'known', b: 'review' } as const;
    expect(buildDeck(cards, marks, 'review').map((c) => c.id)).toEqual(['b']);
    expect(buildDeck(cards, marks, 'unmarked').map((c) => c.id)).toEqual(['c', 'd']);
    expect(deckStats(cards, marks)).toEqual({ total: 4, known: 1, review: 1, unmarked: 2 });
  });

  it('shuffles without losing cards', () => {
    let seed = 1;
    const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const shuffled = shuffle(cards, random);
    expect(shuffled.map((c) => c.id).sort()).toEqual(['a', 'b', 'c', 'd']);
  });

  it('scores quizzes and lists wrong answers', () => {
    const qs = [
      { id: 'q1', prompt: 'One?', choices: ['x', 'y'], answerIndex: 0, explanation: 'Because x.', sourceResourceIds: ['r'] },
      { id: 'q2', prompt: 'Two?', choices: ['x', 'y'], answerIndex: 1, explanation: 'Because y.', sourceResourceIds: ['r'] },
    ] as QuizQuestion[];
    expect(scoreQuiz(qs, { q1: 0, q2: 0 })).toEqual({ score: 1, total: 2, wrongIds: ['q2'] });
    expect(scoreQuiz(qs, {})).toEqual({ score: 0, total: 2, wrongIds: ['q1', 'q2'] });
  });
});
