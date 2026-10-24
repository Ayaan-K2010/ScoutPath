import { PROGRESS_SHORT_LABELS, type ProgressState } from '../features/progress/schema';

/** A pencil mark in a box: empty, one stroke, a cross, or a check. Shape and color both change, so color is never the only cue. */
export function PencilMark({ state }: { state: ProgressState }) {
  return (
    <svg className="state-pill__icon" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
      <rect x="3" y="3" width="18" height="18" rx="2" stroke="var(--charcoal)" strokeWidth="1.8" />
      {(state === 'learning' || state === 'ready-for-review') && <path d="M7 17 17 7" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />}
      {state === 'ready-for-review' && <path d="m7 7 10 10" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />}
      {state === 'completed-personal' && <path d="m6.5 12.5 3.5 3.5L18 7" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
  );
}

export function StatePill({ state, hideLabel = false }: { state: ProgressState; hideLabel?: boolean }) {
  return (
    <span className="state-pill" data-state={state}>
      <PencilMark state={state} />
      <span className={hideLabel ? 'sr-only' : undefined}>{PROGRESS_SHORT_LABELS[state]}</span>
    </span>
  );
}
