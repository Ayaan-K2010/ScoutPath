import { BookA, FileText, FlaskConical, Globe, Image, Mic, MousePointerClick, Newspaper, PenLine, Shapes, Video, type IconComponent } from './icons';
import type { ResourceType } from '../schemas/content';

const ICONS: Record<ResourceType, IconComponent> = {
  video: Video,
  article: Newspaper,
  'official-page': Globe,
  pdf: FileText,
  diagram: Image,
  interactive: MousePointerClick,
  podcast: Mic,
  simulation: FlaskConical,
  vocabulary: BookA,
  practice: PenLine,
  other: Shapes,
};

export function ResourceTypeIcon({ type }: { type: ResourceType }) {
  const Icon = ICONS[type];
  return (
    <span className="resource-type-icon" aria-hidden="true">
      <Icon size={18} strokeWidth={1.75} />
    </span>
  );
}
