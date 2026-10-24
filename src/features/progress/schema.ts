/**
 * Personal data model. Everything here lives only in the browser's
 * localStorage. It is never sent anywhere.
 */
import { z } from 'zod';
import { isoDate } from '../../schemas/content';

export const PROGRESS_STATES = ['not-started', 'learning', 'ready-for-review', 'completed-personal'] as const;
export const progressState = z.enum(PROGRESS_STATES);
export type ProgressState = z.infer<typeof progressState>;

export const PROGRESS_LABELS: Record<ProgressState, string> = {
  'not-started': 'Not started',
  learning: 'Learning',
  'ready-for-review': 'Ready for review',
  'completed-personal': 'Personal record of completion',
};

export const PROGRESS_SHORT_LABELS: Record<ProgressState, string> = {
  'not-started': 'Not started',
  learning: 'Learning',
  'ready-for-review': 'Ready for review',
  'completed-personal': 'Completed (personal)',
};

const timestamp = z.string().refine((v) => !Number.isNaN(Date.parse(v)), 'Expected an ISO timestamp');
const shortText = (max: number) => z.string().max(max);

export const planSession = z.object({
  id: z.string().min(1).max(80),
  date: isoDate,
  requirementId: z.string().min(1).max(120),
  minutes: z.number().int().positive().max(24 * 60).nullable(),
  part: z.number().int().min(1),
  parts: z.number().int().min(1),
  done: z.boolean(),
  manual: z.boolean().optional(),
});
export type PlanSession = z.infer<typeof planSession>;

export const plan = z.object({
  id: z.string().min(1).max(80),
  title: shortText(120),
  target: z.object({ kind: z.enum(['badge', 'rank']), id: z.string().min(1).max(120) }),
  requirementIds: z.array(z.string().max(120)).max(500),
  startDate: isoDate,
  targetDate: isoDate,
  availableDays: z.array(z.number().int().min(0).max(6)).max(7),
  dailyMinutes: z.number().int().min(5).max(600),
  estimates: z.record(z.string(), z.number().int().positive().max(6000).nullable()),
  sessions: z.array(planSession).max(2000),
  createdAt: timestamp,
  updatedAt: timestamp,
});
export type Plan = z.infer<typeof plan>;

export const collection = z.object({
  id: z.string().min(1).max(80),
  title: shortText(120).min(1),
  description: shortText(2000),
  resourceIds: z.array(z.string().max(120)).max(500),
  badgeIds: z.array(z.string().max(120)).max(200),
  requirementIds: z.array(z.string().max(120)).max(500),
  privateNotes: shortText(10000),
  origin: z.enum(['user', 'template', 'import']),
  createdAt: timestamp,
  updatedAt: timestamp,
});
export type Collection = z.infer<typeof collection>;

export const recentItem = z.object({
  kind: z.enum(['badge', 'rank', 'requirement', 'resource', 'study']),
  id: z.string().max(120),
  title: shortText(200),
  path: z.string().startsWith('/').max(300),
  viewedAt: timestamp,
});
export type RecentItem = z.infer<typeof recentItem>;

export const goal = z.object({
  id: z.string().min(1).max(80),
  text: shortText(300).min(1),
  targetDate: isoDate.nullable(),
  done: z.boolean(),
  createdAt: timestamp,
});
export type Goal = z.infer<typeof goal>;

export const quizAttempt = z.object({
  at: timestamp,
  score: z.number().int().min(0),
  total: z.number().int().min(1),
  wrongIds: z.array(z.string().max(80)),
});
export type QuizAttempt = z.infer<typeof quizAttempt>;

export const userData = z.object({
  version: z.literal(1),
  createdAt: timestamp,
  updatedAt: timestamp,
  profile: z.object({
    selectedRankId: z.string().max(120).nullable(),
    selectedBadgeIds: z.array(z.string().max(120)).max(200),
  }),
  progress: z.record(
    z.string().max(120),
    // versionId records which requirement outline the entry was made against, so a later renumbering can be flagged.
    z.object({ state: progressState, updatedAt: timestamp, versionId: z.string().max(80).optional() }),
  ),
  notes: z.record(z.string().max(120), z.object({ text: shortText(20000), updatedAt: timestamp })),
  saved: z.record(z.string().max(120), z.object({ savedAt: timestamp })),
  recent: z.array(recentItem).max(50),
  goals: z.array(goal).max(200),
  flashcards: z.record(z.string().max(120), z.record(z.string().max(80), z.enum(['known', 'review']))),
  quizzes: z.record(z.string().max(120), z.object({ attempts: z.array(quizAttempt).max(200) })),
  activity: z.record(isoDate, z.number().int().min(0)),
  plans: z.array(plan).max(50),
  collections: z.array(collection).max(200),
  linkReports: z
    .array(z.object({ resourceId: z.string().max(120), reportedAt: timestamp, note: shortText(1000) }))
    .max(500),
});
export type UserData = z.infer<typeof userData>;

export function emptyUserData(now = new Date().toISOString()): UserData {
  return {
    version: 1,
    createdAt: now,
    updatedAt: now,
    profile: { selectedRankId: null, selectedBadgeIds: [] },
    progress: {},
    notes: {},
    saved: {},
    recent: [],
    goals: [],
    flashcards: {},
    quizzes: {},
    activity: {},
    plans: [],
    collections: [],
    linkReports: [],
  };
}

/** The file format for a full personal-data export. */
export const exportEnvelope = z.object({
  format: z.literal('scoutpath-personal-data'),
  formatVersion: z.literal(1),
  exportedAt: timestamp,
  data: userData,
});
