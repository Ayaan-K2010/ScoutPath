import { Atom, BookMarked, Hammer, HeartPulse, Landmark, Leaf, Palette, Tent, Trophy, Waves, type LucideIcon } from 'lucide-react';
import type { CategoryId } from '../schemas/content';

export type MarkTone = 'sage' | 'forest' | 'amber' | 'pine' | 'ivory';

export const CATEGORY_VISUALS: Record<CategoryId, { icon: LucideIcon; tone: MarkTone }> = {
  outdoor: { icon: Tent, tone: 'forest' },
  nature: { icon: Leaf, tone: 'sage' },
  aquatics: { icon: Waves, tone: 'ivory' },
  'health-safety': { icon: HeartPulse, tone: 'amber' },
  citizenship: { icon: Landmark, tone: 'pine' },
  'science-tech': { icon: Atom, tone: 'sage' },
  'arts-communication': { icon: Palette, tone: 'amber' },
  'trades-crafts': { icon: Hammer, tone: 'ivory' },
  sports: { icon: Trophy, tone: 'forest' },
  'hobbies-heritage': { icon: BookMarked, tone: 'pine' },
};
