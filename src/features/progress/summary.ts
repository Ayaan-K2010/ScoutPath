/**
 * Progress calculations. Percentages are only produced when the underlying
 * requirement dataset is verified and complete; otherwise the summary is
 * explicitly partial and exposes counts instead.
 */
import { leafIdsUnder, leafRequirementIds, versionOfOwner, type Content } from '../content/model';
import { PROGRESS_STATES, type ProgressState, type UserData } from './schema';

export interface ProgressSummary {
  ownerId: string;
  total: number;
  counts: Record<ProgressState, number>;
  touched: number;
  /** Null unless the dataset is verified and complete. */
  percentComplete: number | null;
  partial: boolean;
  partialReason: string | null;
}

export function stateOf(data: UserData, requirementId: string): ProgressState {
  return data.progress[requirementId]?.state ?? 'not-started';
}

export function summarizeIds(data: UserData, ids: string[]): Record<ProgressState, number> {
  const counts = Object.fromEntries(PROGRESS_STATES.map((s) => [s, 0])) as Record<ProgressState, number>;
  for (const id of ids) counts[stateOf(data, id)] += 1;
  return counts;
}

export function ownerProgress(content: Content, data: UserData, ownerId: string): ProgressSummary {
  const leaves = leafRequirementIds(content, ownerId);
  const counts = summarizeIds(data, leaves);
  const version = versionOfOwner(content, ownerId);
  const verifiedAndComplete = version?.status === 'verified' && version.completeness === 'complete';
  let partialReason: string | null = null;
  if (!version) partialReason = 'No requirement outline is available yet.';
  else if (version.status !== 'verified') partialReason = 'The requirement outline has not been verified against the official source, so totals may be incomplete or numbered differently.';
  else if (version.completeness !== 'complete') partialReason = 'The requirement outline is incomplete.';
  return {
    ownerId,
    total: leaves.length,
    counts,
    touched: leaves.length - counts['not-started'],
    percentComplete: verifiedAndComplete && leaves.length > 0 ? Math.round((counts['completed-personal'] / leaves.length) * 100) : null,
    partial: !verifiedAndComplete,
    partialReason,
  };
}

/** Aggregated state of a parent requirement, derived from its leaves. */
export function groupState(content: Content, data: UserData, requirementId: string): { done: number; total: number } {
  const leaves = leafIdsUnder(content, requirementId);
  return { done: leaves.filter((id) => stateOf(data, id) === 'completed-personal').length, total: leaves.length };
}

export interface SuggestedTask {
  requirementId: string;
  reason: 'continue' | 'ready' | 'next';
}

/**
 * Suggests what to work on next for one owner: requirements already being
 * learned first, then the next untouched requirements that have resources.
 */
export function suggestNext(content: Content, data: UserData, ownerId: string, limit = 3): SuggestedTask[] {
  const leaves = leafRequirementIds(content, ownerId);
  const out: SuggestedTask[] = [];
  for (const id of leaves) if (stateOf(data, id) === 'learning') out.push({ requirementId: id, reason: 'continue' });
  for (const id of leaves) {
    if (out.length >= limit) break;
    if (stateOf(data, id) === 'not-started' && content.resourcesByRequirement.has(id)) out.push({ requirementId: id, reason: 'next' });
  }
  for (const id of leaves) {
    if (out.length >= limit) break;
    if (stateOf(data, id) === 'not-started' && !out.some((o) => o.requirementId === id)) out.push({ requirementId: id, reason: 'next' });
  }
  return out.slice(0, limit);
}

/** Requirements in progress across everything the user has touched, newest first. */
export function inProgress(content: Content, data: UserData): { requirementId: string; state: ProgressState; updatedAt: string }[] {
  return Object.entries(data.progress)
    .filter(([id, p]) => content.requirements.has(id) && (p.state === 'learning' || p.state === 'ready-for-review'))
    .map(([requirementId, p]) => ({ requirementId, state: p.state, updatedAt: p.updatedAt }))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
