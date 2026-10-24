/**
 * Export and import of personal data. Imports are validated in full before
 * anything is applied, and the caller chooses whether to merge with or
 * replace existing data. Nothing is overwritten implicitly.
 */
import { exportEnvelope, userData, type UserData } from './schema';

export const MAX_IMPORT_BYTES = 5 * 1024 * 1024;

export function exportUserData(data: UserData, now = new Date().toISOString()): string {
  return JSON.stringify({ format: 'scoutpath-personal-data', formatVersion: 1, exportedAt: now, data }, null, 2);
}

export type ImportResult =
  | { ok: true; data: UserData; summary: ImportSummary }
  | { ok: false; errors: string[] };

export interface ImportSummary {
  progress: number;
  notes: number;
  saved: number;
  goals: number;
  plans: number;
  collections: number;
  quizAttempts: number;
}

export function summarize(data: UserData): ImportSummary {
  return {
    progress: Object.keys(data.progress).length,
    notes: Object.keys(data.notes).length,
    saved: Object.keys(data.saved).length,
    goals: data.goals.length,
    plans: data.plans.length,
    collections: data.collections.length,
    quizAttempts: Object.values(data.quizzes).reduce((n, q) => n + q.attempts.length, 0),
  };
}

export function parseUserDataImport(text: string): ImportResult {
  if (text.length > MAX_IMPORT_BYTES) return { ok: false, errors: ['The file is larger than 5 MB, which is far bigger than any ScoutPath export.'] };
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, errors: ['The file is not valid JSON. Choose a file exported from ScoutPath’s Settings page.'] };
  }
  if (typeof json === 'object' && json !== null && (json as { format?: unknown }).format === 'scoutpath-collection') {
    return { ok: false, errors: ['This is a shared collection file. Import it from the Collections page instead.'] };
  }
  const envelope = exportEnvelope.safeParse(json);
  if (envelope.success) return { ok: true, data: envelope.data.data, summary: summarize(envelope.data.data) };
  // Accept a bare data object too, but only if it is fully valid.
  const bare = userData.safeParse(json);
  if (bare.success) return { ok: true, data: bare.data, summary: summarize(bare.data) };
  return {
    ok: false,
    errors: envelope.error.issues.slice(0, 6).map((i) => `${i.path.join('.') || '(file)'}: ${i.message}`),
  };
}

const newer = <T extends { updatedAt: string }>(a: T | undefined, b: T | undefined): T | undefined => {
  if (!a) return b;
  if (!b) return a;
  return b.updatedAt > a.updatedAt ? b : a;
};

function unionBy<T>(a: T[], b: T[], key: (t: T) => string): T[] {
  const seen = new Set(a.map(key));
  return [...a, ...b.filter((t) => !seen.has(key(t)))];
}

/**
 * Merge imported data into current data. For records edited in both places
 * the most recently updated version wins; lists are combined without
 * duplicates; existing plans and collections are kept when IDs collide.
 */
export function mergeUserData(current: UserData, incoming: UserData): UserData {
  const progress = { ...current.progress };
  for (const [id, p] of Object.entries(incoming.progress)) progress[id] = newer(progress[id], p)!;
  const notes = { ...current.notes };
  for (const [id, n] of Object.entries(incoming.notes)) notes[id] = newer(notes[id], n)!;
  const flashcards = { ...current.flashcards };
  for (const [setId, cards] of Object.entries(incoming.flashcards)) flashcards[setId] = { ...cards, ...(flashcards[setId] ?? {}) };
  const quizzes = { ...current.quizzes };
  for (const [setId, q] of Object.entries(incoming.quizzes)) {
    const attempts = unionBy(quizzes[setId]?.attempts ?? [], q.attempts, (a) => a.at).sort((a, b) => a.at.localeCompare(b.at));
    quizzes[setId] = { attempts };
  }
  const activity = { ...current.activity };
  for (const [day, n] of Object.entries(incoming.activity)) activity[day] = Math.max(activity[day] ?? 0, n);

  return {
    ...current,
    profile: {
      selectedRankId: current.profile.selectedRankId ?? incoming.profile.selectedRankId,
      selectedBadgeIds: [...new Set([...current.profile.selectedBadgeIds, ...incoming.profile.selectedBadgeIds])],
    },
    progress,
    notes,
    saved: { ...incoming.saved, ...current.saved },
    recent: unionBy(current.recent, incoming.recent, (r) => `${r.kind}:${r.id}`)
      .sort((a, b) => b.viewedAt.localeCompare(a.viewedAt))
      .slice(0, 20),
    goals: unionBy(current.goals, incoming.goals, (g) => g.id),
    flashcards,
    quizzes,
    activity,
    plans: unionBy(current.plans, incoming.plans, (p) => p.id),
    collections: unionBy(current.collections, incoming.collections, (c) => c.id),
    linkReports: unionBy(current.linkReports, incoming.linkReports, (r) => `${r.resourceId}:${r.reportedAt}`),
  };
}
