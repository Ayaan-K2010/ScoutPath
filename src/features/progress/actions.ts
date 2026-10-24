/**
 * Pure state transitions for personal data. Every function returns a new
 * UserData object (or the same object when nothing changed), which keeps
 * them easy to test and safe to use with useSyncExternalStore.
 */
import type { Collection, Goal, Plan, ProgressState, RecentItem, UserData } from './schema';

const nowIso = () => new Date().toISOString();
export const todayKey = (date = new Date()) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

function bumpActivity(data: UserData): UserData['activity'] {
  const key = todayKey();
  return { ...data.activity, [key]: (data.activity[key] ?? 0) + 1 };
}

export function setProgress(data: UserData, requirementId: string, state: ProgressState, versionId?: string): UserData {
  const current = data.progress[requirementId];
  if ((current?.state ?? 'not-started') === state && (state === 'not-started' || current?.versionId === versionId)) return data;
  const progress = { ...data.progress };
  if (state === 'not-started') delete progress[requirementId];
  else progress[requirementId] = { state, updatedAt: nowIso(), ...(versionId ? { versionId } : {}) };
  return { ...data, progress, activity: bumpActivity(data) };
}

export function setNote(data: UserData, requirementId: string, text: string): UserData {
  const notes = { ...data.notes };
  if (text.trim() === '') delete notes[requirementId];
  else notes[requirementId] = { text, updatedAt: nowIso() };
  return { ...data, notes };
}

export function toggleSaved(data: UserData, resourceId: string): UserData {
  const saved = { ...data.saved };
  if (saved[resourceId]) delete saved[resourceId];
  else saved[resourceId] = { savedAt: nowIso() };
  return { ...data, saved };
}

export function recordVisit(data: UserData, item: Omit<RecentItem, 'viewedAt'>): UserData {
  const first = data.recent[0];
  if (first && first.kind === item.kind && first.id === item.id) return data;
  const recent = [{ ...item, viewedAt: nowIso() }, ...data.recent.filter((r) => !(r.kind === item.kind && r.id === item.id))].slice(0, 20);
  return { ...data, recent };
}

export function clearRecent(data: UserData): UserData {
  return { ...data, recent: [] };
}

export function setSelectedRank(data: UserData, rankId: string | null): UserData {
  return { ...data, profile: { ...data.profile, selectedRankId: rankId } };
}

export function toggleSelectedBadge(data: UserData, badgeId: string): UserData {
  const has = data.profile.selectedBadgeIds.includes(badgeId);
  const selectedBadgeIds = has ? data.profile.selectedBadgeIds.filter((id) => id !== badgeId) : [...data.profile.selectedBadgeIds, badgeId];
  return { ...data, profile: { ...data.profile, selectedBadgeIds } };
}

export function addGoal(data: UserData, text: string, targetDate: string | null, id: string): UserData {
  const goal: Goal = { id, text: text.trim(), targetDate, done: false, createdAt: nowIso() };
  return { ...data, goals: [...data.goals, goal] };
}

export function toggleGoal(data: UserData, id: string): UserData {
  return { ...data, goals: data.goals.map((g) => (g.id === id ? { ...g, done: !g.done } : g)) };
}

export function removeGoal(data: UserData, id: string): UserData {
  return { ...data, goals: data.goals.filter((g) => g.id !== id) };
}

export function setFlashcard(data: UserData, setId: string, cardId: string, mark: 'known' | 'review' | null): UserData {
  const current = { ...(data.flashcards[setId] ?? {}) };
  if (mark === null) delete current[cardId];
  else current[cardId] = mark;
  return { ...data, flashcards: { ...data.flashcards, [setId]: current }, activity: bumpActivity(data) };
}

export function resetFlashcards(data: UserData, setId: string): UserData {
  const flashcards = { ...data.flashcards };
  delete flashcards[setId];
  return { ...data, flashcards };
}

export function recordQuiz(data: UserData, setId: string, score: number, total: number, wrongIds: string[]): UserData {
  const attempts = [...(data.quizzes[setId]?.attempts ?? []), { at: nowIso(), score, total, wrongIds }].slice(-50);
  return { ...data, quizzes: { ...data.quizzes, [setId]: { attempts } }, activity: bumpActivity(data) };
}

export function upsertPlan(data: UserData, plan: Plan): UserData {
  const exists = data.plans.some((p) => p.id === plan.id);
  const next = { ...plan, updatedAt: nowIso() };
  return { ...data, plans: exists ? data.plans.map((p) => (p.id === plan.id ? next : p)) : [...data.plans, next] };
}

export function removePlan(data: UserData, id: string): UserData {
  return { ...data, plans: data.plans.filter((p) => p.id !== id) };
}

export function upsertCollection(data: UserData, c: Collection): UserData {
  const exists = data.collections.some((x) => x.id === c.id);
  const next = { ...c, updatedAt: nowIso() };
  return { ...data, collections: exists ? data.collections.map((x) => (x.id === c.id ? next : x)) : [...data.collections, next] };
}

export function removeCollection(data: UserData, id: string): UserData {
  return { ...data, collections: data.collections.filter((c) => c.id !== id) };
}

export function reportLink(data: UserData, resourceId: string, note: string): UserData {
  return { ...data, linkReports: [...data.linkReports, { resourceId, reportedAt: nowIso(), note: note.slice(0, 1000) }] };
}
