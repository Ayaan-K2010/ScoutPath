import type { CategoryId } from '../schemas/content';
import { CATEGORY_VISUALS } from './categoryVisuals';

/**
 * ScoutPath's own category emblem. Deliberately abstract so it is never
 * mistaken for official merit badge artwork.
 */
export function BadgeMark({ category, size = 'md', muted = false }: { category: CategoryId; size?: 'sm' | 'md' | 'lg'; muted?: boolean }) {
  const { icon: Icon, tone } = CATEGORY_VISUALS[category];
  return (
    <span className={`badge-mark${size === 'md' ? '' : ` badge-mark--${size}`}`} data-tone={tone} data-muted={muted || undefined} aria-hidden="true">
      <Icon strokeWidth={1.75} />
    </span>
  );
}
