import { Library, ListChecks } from './icons';
import { content } from '../features/content/data';
import { leafRequirementIds } from '../features/content/model';
import { ownerProgress } from '../features/progress/summary';
import { useUserData } from '../hooks/useUserData';
import type { RequirementVersion } from '../schemas/content';
import { ProgressMeter } from './ProgressMeter';
import { VerificationPanel } from './VerificationPanel';

export function ProgressPanel({ ownerId, ownerName }: { ownerId: string; ownerName: string }) {
  const data = useUserData();
  const summary = ownerProgress(content, data, ownerId);
  if (summary.total === 0) return null;
  return (
    <section className="panel" aria-labelledby="progress-title">
      <h2 className="panel__title" id="progress-title">
        <ListChecks size={16} aria-hidden="true" /> Your personal progress
      </h2>
      <div className="progress-panel__figure">
        {summary.percentComplete !== null ? (
          <span className="progress-panel__value">{summary.percentComplete}%</span>
        ) : (
          <>
            <span className="progress-panel__value tabular">{summary.counts['completed-personal']}</span>
            <span className="progress-panel__of">of {summary.total} outlined items marked complete</span>
          </>
        )}
      </div>
      <ProgressMeter counts={summary.counts} total={summary.total} label={`${ownerName} progress`} showLegend />
      {summary.partial && (
        <p className="field__hint" style={{ marginTop: 'var(--s-3)' }}>
          Partial figure. {summary.partialReason}
        </p>
      )}
      <p className="field__hint" style={{ marginTop: 'var(--s-2)' }}>
        Personal record only. Official completion is recorded by your unit, not ScoutPath.
      </p>
    </section>
  );
}

export function AvailabilityPanel({ ownerId }: { ownerId: string }) {
  const leaves = leafRequirementIds(content, ownerId);
  if (leaves.length === 0) return null;
  const covered = leaves.filter((id) => content.resourcesByRequirement.has(id)).length;
  const resources = new Set<string>();
  for (const id of content.requirementOrder.get(ownerId) ?? []) for (const m of content.resourcesByRequirement.get(id) ?? []) resources.add(m.resource.id);
  return (
    <section className="panel panel--muted" aria-labelledby="availability-title">
      <h2 className="panel__title" id="availability-title">
        <Library size={16} aria-hidden="true" /> Resource availability
      </h2>
      <p className="small">
        <strong className="tabular">{covered}</strong> of {leaves.length} outlined items have learning resources, drawn from{' '}
        <strong className="tabular">{resources.size}</strong> curated resources.
      </p>
      <div className="meter" style={{ marginTop: 'var(--s-3)', background: 'var(--paper)' }} role="img" aria-label={`${covered} of ${leaves.length} items have resources`}>
        <span className="meter__fill meter__fill--secondary" style={{ width: `${(covered / leaves.length) * 100}%` }} />
      </div>
      <p className="field__hint" style={{ marginTop: 'var(--s-3)' }}>
        Items marked “No resources yet” are still being curated. Resource links have not been re-checked since they were added.
      </p>
    </section>
  );
}

export function OwnerSidebar({ ownerId, ownerName, version, officialUrl }: { ownerId: string; ownerName: string; version: RequirementVersion | null; officialUrl: string }) {
  return (
    <aside className="with-aside__aside">
      <ProgressPanel ownerId={ownerId} ownerName={ownerName} />
      <AvailabilityPanel ownerId={ownerId} />
      <VerificationPanel version={version} officialUrl={officialUrl} ownerName={ownerName} />
    </aside>
  );
}
