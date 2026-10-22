import type { ProgressState } from '../features/progress/schema';

interface Props {
  counts: Record<ProgressState, number>;
  total: number;
  label: string;
  size?: 'md' | 'lg';
  showLegend?: boolean;
}

/** Two-tone bar: completed (forest) then in-progress (sage). Values are counts, not claims of official completion. */
export function ProgressMeter({ counts, total, label, size = 'md', showLegend = false }: Props) {
  const done = counts['completed-personal'];
  const active = counts.learning + counts['ready-for-review'];
  const pct = (n: number) => (total > 0 ? (n / total) * 100 : 0);
  return (
    <div>
      <div
        className={`meter${size === 'lg' ? ' meter--lg' : ''}`}
        role="img"
        aria-label={`${label}: ${done} of ${total} marked complete in your personal record, ${active} in progress`}
      >
        <span className="meter__fill meter__fill--secondary" style={{ width: `${pct(done + active)}%` }} />
        <span className="meter__fill" style={{ width: `${pct(done)}%` }} />
      </div>
      {showLegend && (
        <div className="meter-legend" aria-hidden="true">
          <span>
            <span className="swatch" style={{ background: 'var(--forest)' }} />
            {done} completed (personal)
          </span>
          <span>
            <span className="swatch" style={{ background: 'var(--sage)' }} />
            {active} in progress
          </span>
          <span>
            <span className="swatch" />
            {Math.max(0, total - done - active)} not started
          </span>
        </div>
      )}
    </div>
  );
}
