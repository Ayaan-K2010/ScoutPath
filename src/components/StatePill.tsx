import { Check } from 'lucide-react';
import { PROGRESS_SHORT_LABELS, type ProgressState } from '../features/progress/schema';

export function StatePill({ state, hideLabel = false }: { state: ProgressState; hideLabel?: boolean }) {
  return (
    <span className="state-pill" data-state={state}>
      <span className="state-pill__icon" aria-hidden="true">
        {state === 'completed-personal' && <Check strokeWidth={3} />}
      </span>
      <span className={hideLabel ? 'sr-only' : undefined}>{PROGRESS_SHORT_LABELS[state]}</span>
    </span>
  );
}
