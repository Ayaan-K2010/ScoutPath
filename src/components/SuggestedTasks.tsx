import { ArrowRight } from './icons';
import { Link } from 'react-router';
import { content } from '../features/content/data';
import { suggestNext } from '../features/progress/summary';
import { useUserData } from '../hooks/useUserData';

export function SuggestedTasks({ ownerId, limit = 3 }: { ownerId: string; limit?: number }) {
  const data = useUserData();
  const tasks = suggestNext(content, data, ownerId, limit);
  if (!tasks.length) return <p className="small muted">Everything outlined here is marked complete in your personal record.</p>;
  return (
    <ul className="plain-list">
      {tasks.map((t) => {
        const node = content.requirements.get(t.requirementId)!;
        const resources = content.resourcesByRequirement.get(node.id)?.length ?? 0;
        return (
          <li key={t.requirementId}>
            <Link to={node.path} className="continue-row">
              <span className="continue-row__num">{node.requirement.number}</span>
              <span>
                <span className="continue-row__title">{node.requirement.title}</span>
                <span className="continue-row__meta">
                  {t.reason === 'continue' ? 'Continue learning' : 'Up next'} · {node.ownerName}
                  {resources ? ` · ${resources} ${resources === 1 ? 'resource' : 'resources'}` : ''}
                </span>
              </span>
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
