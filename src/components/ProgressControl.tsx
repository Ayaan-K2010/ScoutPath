import { useId } from 'react';
import { PROGRESS_LABELS, PROGRESS_STATES, type ProgressState } from '../features/progress/schema';
import { PencilMark } from './StatePill';

const HINTS: Record<ProgressState, string> = {
  'not-started': 'Nothing recorded yet',
  learning: 'Studying or practicing',
  'ready-for-review': 'Ready to show your leader or counselor',
  'completed-personal': 'You have recorded it as done',
};

interface Props {
  value: ProgressState;
  onChange: (state: ProgressState) => void;
  legend: string;
  compact?: boolean;
}

/** Radio-group control for personal learning state. These are personal notes, not official sign-offs. */
export function ProgressControl({ value, onChange, legend, compact = false }: Props) {
  const name = useId();
  return (
    <fieldset>
      <legend className="sr-only">{legend}</legend>
      <div className={`segmented${compact ? ' segmented--compact' : ''}`}>
        {PROGRESS_STATES.map((state) => {
          const id = `${name}-${state}`;
          return (
            <div className="segmented__option" key={state}>
              <input type="radio" id={id} name={name} value={state} checked={value === state} onChange={() => onChange(state)} />
              <label htmlFor={id} title={HINTS[state]}>
                <PencilMark state={state} />
                {state === 'completed-personal' ? 'Completed (personal)' : PROGRESS_LABELS[state]}
              </label>
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}
