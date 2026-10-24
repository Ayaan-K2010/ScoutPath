import { ArrowRight, ChevronDown, Library } from './icons';
import { useState } from 'react';
import { Link } from 'react-router';
import { content } from '../features/content/data';
import { leafIdsUnder, type RequirementNode } from '../features/content/model';
import { stateOf } from '../features/progress/summary';
import { useUserData } from '../hooks/useUserData';
import { StatePill } from './StatePill';

function ResourceCount({ id }: { id: string }) {
  const n = content.resourcesByRequirement.get(id)?.length ?? 0;
  return n > 0 ? (
    <span className="res-count">
      <Library size={13} aria-hidden="true" /> {n} {n === 1 ? 'resource' : 'resources'}
    </span>
  ) : (
    <span className="res-count res-count--none">No resources yet</span>
  );
}

function LeafItem({ node }: { node: RequirementNode }) {
  const data = useUserData();
  return (
    <li>
      <Link to={node.path} className="req-item">
        <span className="req-item__number">{node.requirement.number}</span>
        <span>
          <span className="req-item__title">{node.requirement.title}</span>
          <span className="req-item__summary" style={{ display: 'block' }}>
            {node.requirement.summary}
          </span>
        </span>
        <span className="req-item__side">
          <ResourceCount id={node.id} />
          <StatePill state={stateOf(data, node.id)} />
        </span>
      </Link>
    </li>
  );
}

function Group({ node, open, onToggle }: { node: RequirementNode; open: boolean; onToggle: () => void }) {
  const data = useUserData();
  const leaves = leafIdsUnder(content, node.id);
  const done = leaves.filter((id) => stateOf(data, id) === 'completed-personal').length;
  const panelId = `req-children-${node.id.replace(/\./g, '-')}`;

  if (node.isLeaf) {
    return (
      <li className="req-group">
        <Link to={node.path} className="req-group__header" style={{ textDecoration: 'none' }}>
          <span className="req-number">{node.requirement.number}</span>
          <span>
            <span className="req-group__title">{node.requirement.title}</span>
            <span className="req-group__summary">{node.requirement.summary}</span>
          </span>
          <span className="req-group__side">
            <ResourceCount id={node.id} />
            <StatePill state={stateOf(data, node.id)} />
          </span>
        </Link>
      </li>
    );
  }

  return (
    <li className="req-group">
      <button type="button" className="req-group__header" aria-expanded={open} aria-controls={panelId} onClick={onToggle}>
        <span className="req-number">{node.requirement.number}</span>
        <span>
          <span className="req-group__title">{node.requirement.title}</span>
          <span className="req-group__summary">{node.requirement.summary}</span>
        </span>
        <span className="req-group__side">
          <span className="tabular">
            {done}/{leaves.length}
            <span className="sr-only"> sub-requirements marked complete</span>
          </span>
          <ChevronDown size={18} className="chevron" aria-hidden="true" />
        </span>
      </button>
      <ul id={panelId} className={`req-children${open ? '' : ' is-collapsed'}`}>
        <li>
          <Link to={node.path} className="req-open-link" style={{ padding: '0 var(--s-3) var(--s-2)', display: 'inline-flex' }}>
            Open requirement {node.requirement.number} overview <ArrowRight size={13} aria-hidden="true" />
          </Link>
        </li>
        {node.childIds.map((id) => {
          const child = content.requirements.get(id);
          return child ? <LeafItem key={id} node={child} /> : null;
        })}
      </ul>
    </li>
  );
}

export function RequirementTree({ ownerId }: { ownerId: string }) {
  const topLevel = (content.requirementOrder.get(ownerId) ?? [])
    .map((id) => content.requirements.get(id)!)
    .filter((n) => n && n.parentId === null);
  const groupIds = topLevel.filter((n) => !n.isLeaf).map((n) => n.id);
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set(groupIds.slice(0, 2)));
  const allOpen = groupIds.every((id) => openIds.has(id));

  return (
    <div>
      {groupIds.length > 0 && (
        <div className="button-row no-print" style={{ justifyContent: 'flex-end', marginBottom: 'var(--s-2)' }}>
          <button type="button" className="text-link" onClick={() => setOpenIds(allOpen ? new Set() : new Set(groupIds))}>
            {allOpen ? 'Collapse all' : 'Expand all'}
          </button>
        </div>
      )}
      <ol className="req-tree">
        {topLevel.map((node) => (
          <Group
            key={node.id}
            node={node}
            open={openIds.has(node.id)}
            onToggle={() =>
              setOpenIds((prev) => {
                const next = new Set(prev);
                if (next.has(node.id)) next.delete(node.id);
                else next.add(node.id);
                return next;
              })
            }
          />
        ))}
      </ol>
    </div>
  );
}
