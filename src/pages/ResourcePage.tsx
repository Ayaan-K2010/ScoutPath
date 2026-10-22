import { FolderPlus, ListChecks } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { BookmarkButton } from '../components/BookmarkButton';
import { Callout } from '../components/Callout';
import { ExternalLink } from '../components/ExternalLink';
import { PageHeader } from '../components/PageHeader';
import { ReportLinkButton } from '../components/ReportLinkButton';
import { PUBLISHER_TYPE_LABELS } from '../lib/labels';
import { RESOURCE_TYPE_LABELS } from '../lib/labels';
import { LinkStatusTag, SafetyReviewTag, VerificationTag } from '../components/StatusTag';
import { StatePill } from '../components/StatePill';
import { content } from '../features/content/data';
import { upsertCollection } from '../features/progress/actions';
import { stateOf } from '../features/progress/summary';
import { useDocumentTitle, useRecordVisit } from '../hooks/usePageMeta';
import { useUpdateUser, useUserData } from '../hooks/useUserData';
import { domainOf, formatIsoDate, minutesLabel } from '../lib/format';
import { uid } from '../lib/ids';
import { useToast } from '../lib/toastContext';
import { NotFoundPage } from './NotFoundPage';

function AddToCollection({ resourceId }: { resourceId: string }) {
  const data = useUserData();
  const update = useUpdateUser();
  const toast = useToast();
  const [target, setTarget] = useState('');
  const options = data.collections.filter((c) => !c.resourceIds.includes(resourceId));
  const add = () => {
    const now = new Date().toISOString();
    if (target === '__new') {
      const id = uid('col');
      update((d) => upsertCollection(d, { id, title: 'New collection', description: '', resourceIds: [resourceId], badgeIds: [], requirementIds: [], privateNotes: '', origin: 'user', createdAt: now, updatedAt: now }));
      toast.show('Created a new collection');
    } else {
      const c = data.collections.find((x) => x.id === target);
      if (!c) return;
      update((d) => upsertCollection(d, { ...c, resourceIds: [...c.resourceIds, resourceId] }));
      toast.show(`Added to “${c.title}”`);
    }
    setTarget('');
  };
  return (
    <section className="panel" aria-labelledby="col-title">
      <h2 className="panel__title" id="col-title">
        <FolderPlus size={16} aria-hidden="true" /> Add to a collection
      </h2>
      <div className="field">
        <label htmlFor="col-target" className="sr-only">
          Collection
        </label>
        <select id="col-target" className="select" value={target} onChange={(e) => setTarget(e.target.value)}>
          <option value="">Choose a collection…</option>
          {options.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
          <option value="__new">+ New collection</option>
        </select>
      </div>
      <button type="button" className="btn btn--sm" style={{ marginTop: 'var(--s-3)' }} disabled={!target} onClick={add}>
        Add
      </button>
      {data.collections.some((c) => c.resourceIds.includes(resourceId)) && (
        <p className="field__hint" style={{ marginTop: 'var(--s-3)' }}>
          Already in:{' '}
          {data.collections
            .filter((c) => c.resourceIds.includes(resourceId))
            .map((c, i, arr) => (
              <span key={c.id}>
                <Link to={`/collections/${c.id}`}>{c.title}</Link>
                {i < arr.length - 1 ? ', ' : ''}
              </span>
            ))}
        </p>
      )}
    </section>
  );
}

export function ResourcePage() {
  const { id = '' } = useParams();
  const resource = content.resourceById.get(`res.${id}`);
  useDocumentTitle(resource ? resource.title : 'Resource not found');
  useRecordVisit(resource ? { kind: 'resource', id: resource.id, title: resource.title, path: `/resources/${id}` } : null);
  const data = useUserData();
  if (!resource) return <NotFoundPage title="We couldn’t find that resource" message="It may have been removed from the library after a review." />;
  const supports = content.requirementsByResource.get(resource.id) ?? [];

  return (
    <div className="container page">
      <PageHeader
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Resources', to: '/resources' }, { label: resource.title }]}
        eyebrow={`${RESOURCE_TYPE_LABELS[resource.type]} · ${resource.publisher}`}
        title={resource.title}
        sans
        lede={resource.description}
        meta={
          <>
            <span className="tag tag--outline">{PUBLISHER_TYPE_LABELS[resource.publisherType]}</span>
            <span className="tag">{resource.sourceClass === 'official' ? 'Official Scouting source' : 'Independent of Scouting America'}</span>
            <VerificationTag status={resource.verification} label={resource.verification === 'verified' ? 'Content reviewed' : 'Content review pending'} />
          </>
        }
        actions={
          <>
            <ExternalLink href={resource.url} className="btn btn--primary">
              Open on {domainOf(resource.url)}
            </ExternalLink>
            <BookmarkButton resourceId={resource.id} title={resource.title} />
            <ReportLinkButton resource={resource} />
          </>
        }
      />
      <div className="with-aside">
        <div className="stack-lg">
          <Callout title="You are about to leave ScoutPath">
            This resource is published by {resource.publisher} at <strong>{domainOf(resource.url)}</strong> and opens in a new tab. ScoutPath does not control
            that site. Reading it is supplementary learning and does not by itself complete any requirement.
          </Callout>
          <section aria-labelledby="supports-title">
            <div className="section-head">
              <h2 id="supports-title">Supports these requirements</h2>
              <span className="section-head__aside">{supports.length} linked</span>
            </div>
            {supports.length ? (
              <ul className="sub-list">
                {supports.map(({ node, mapping }) => (
                  <li key={node.id}>
                    <Link to={node.path} className="req-item" style={{ borderBottom: '1px solid var(--border)', borderRadius: 0 }}>
                      <ListChecks size={16} aria-hidden="true" style={{ color: 'var(--text-muted)' }} />
                      <span>
                        <span className="req-item__title">
                          {node.ownerName} {node.requirement.number} · {node.requirement.title}
                        </span>
                        <span className="req-item__summary" style={{ display: 'block' }}>
                          <span className={`relevance relevance--${mapping.relevance}`}>{mapping.relevance}</span>
                          {mapping.note ? ` · ${mapping.note}` : ''}
                        </span>
                      </span>
                      <span className="req-item__side">
                        <StatePill state={stateOf(data, node.id)} />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">This resource has not been mapped to a specific requirement yet. It is listed as background reading.</p>
            )}
          </section>
          <section aria-labelledby="topics-title">
            <div className="section-head">
              <h2 id="topics-title">Topics</h2>
            </div>
            <div className="tag-list">
              {resource.topics.map((t) => (
                <Link key={t} to={`/search?q=${encodeURIComponent(t)}`} className="tag tag--outline" style={{ textDecoration: 'none' }}>
                  {t}
                </Link>
              ))}
            </div>
          </section>
        </div>
        <aside className="with-aside__aside">
          <AddToCollection resourceId={resource.id} />
          <section className="panel panel--muted" aria-labelledby="record-title">
            <h2 className="panel__title" id="record-title">
              Resource record
            </h2>
            <dl className="meta-list">
              <div>
                <dt>Publisher</dt>
                <dd>{resource.publisher}</dd>
              </div>
              <div>
                <dt>Language</dt>
                <dd>{resource.language === 'en' ? 'English' : resource.language}</dd>
              </div>
              <div>
                <dt>Length</dt>
                <dd>{resource.durationVerified ? minutesLabel(resource.durationMinutes) : 'Not verified'}</dd>
              </div>
              <div>
                <dt>Link</dt>
                <dd>
                  <LinkStatusTag status={resource.linkStatus} />
                  {resource.lastChecked && <span className="field__hint"> {formatIsoDate(resource.lastChecked)}</span>}
                </dd>
              </div>
              <div>
                <dt>Content review</dt>
                <dd>{resource.contentReviewedOn ? formatIsoDate(resource.contentReviewedOn) : 'Pending'}</dd>
              </div>
              <div>
                <dt>Safety review</dt>
                <dd>
                  <SafetyReviewTag status={resource.safetyReview} />
                </dd>
              </div>
              <div>
                <dt>Added</dt>
                <dd>
                  {formatIsoDate(resource.discovery.on)}
                  {resource.discovery.note && <span className="field__hint" style={{ display: 'block' }}>{resource.discovery.note}</span>}
                </dd>
              </div>
              {resource.attribution && (
                <div>
                  <dt>Attribution</dt>
                  <dd>{resource.attribution}</dd>
                </div>
              )}
              <div>
                <dt>ID</dt>
                <dd>
                  <code>{resource.id}</code>
                </dd>
              </div>
            </dl>
            {resource.notes && <p className="field__hint" style={{ marginTop: 'var(--s-3)' }}>{resource.notes}</p>}
          </section>
        </aside>
      </div>
    </div>
  );
}
