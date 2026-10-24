import { ArrowDown, ArrowUp, Download, Lock, Plus, Printer, Trash2, X } from '../components/icons';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { Dialog } from '../components/Dialog';
import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';
import { PrintHeader } from '../components/PrintHeader';
import { ResourceRow } from '../components/ResourceRow';
import { exportCollection } from '../features/collections/share';
import { content } from '../features/content/data';
import { removeCollection, upsertCollection } from '../features/progress/actions';
import type { Collection } from '../features/progress/schema';
import { useDocumentTitle } from '../hooks/usePageMeta';
import { useUpdateUser, useUserData } from '../hooks/useUserData';
import { downloadText, slugForFile } from '../lib/download';
import { useToast } from '../lib/toastContext';
import { NotFoundPage } from './NotFoundPage';
import { FolderOpen } from '../components/icons';

function move<T>(list: T[], from: number, to: number): T[] {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function CollectionPage() {
  const { id = '' } = useParams();
  const data = useUserData();
  const update = useUpdateUser();
  const navigate = useNavigate();
  const toast = useToast();
  const collection = data.collections.find((c) => c.id === id);
  useDocumentTitle(collection ? collection.title : 'Collection not found');
  const [exportOpen, setExportOpen] = useState(false);
  const [includeNotes, setIncludeNotes] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [addResource, setAddResource] = useState('');
  const [addBadge, setAddBadge] = useState('');
  const [addRequirement, setAddRequirement] = useState('');

  if (!collection) {
    return <NotFoundPage title="We couldn’t find that collection" message="Collections are stored in the browser where they were created. It may have been deleted, or created on another device." />;
  }

  const save = (patch: Partial<Collection>) => update((d) => upsertCollection(d, { ...collection, ...patch }));
  const resources = collection.resourceIds.map((rid) => content.resourceById.get(rid)).filter((r) => r !== undefined);
  const missing = collection.resourceIds.length - resources.length;
  const availableResources = content.resources.filter((r) => !collection.resourceIds.includes(r.id)).sort((a, b) => a.title.localeCompare(b.title));

  return (
    <div className="container page">
      <PrintHeader title={`Collection: ${collection.title}`} />
      <PageHeader
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Collections', to: '/collections' }, { label: collection.title }]}
        eyebrow="Collection"
        title={collection.title}
        lede={collection.description || undefined}
        actions={
          <>
            <button type="button" className="btn btn--primary" onClick={() => setExportOpen(true)}>
              <Download size={16} aria-hidden="true" /> Export to share
            </button>
            <button type="button" className="btn" onClick={() => window.print()}>
              <Printer size={16} aria-hidden="true" /> Print resource list
            </button>
            <button type="button" className="btn btn--danger" onClick={() => setDeleteOpen(true)}>
              <Trash2 size={16} aria-hidden="true" /> Delete
            </button>
          </>
        }
      />

      <div className="with-aside">
        <div className="stack-lg">
          <section aria-labelledby="ordered-title">
            <div className="section-head">
              <h2 id="ordered-title">Resources in order</h2>
              <span className="section-head__aside">{resources.length} items</span>
            </div>
            {missing > 0 && <p className="small muted">{missing} resource{missing === 1 ? ' is' : 's are'} no longer in the library and hidden.</p>}
            {resources.length ? (
              <ol className="ordered-resources">
                {resources.map((r, i) => (
                  <li key={r.id}>
                    <ResourceRow resource={r} compact />
                    <div className="reorder no-print">
                      <button type="button" className="icon-button" aria-label={`Move “${r.title}” up`} disabled={i === 0} onClick={() => save({ resourceIds: move(collection.resourceIds, collection.resourceIds.indexOf(r.id), collection.resourceIds.indexOf(r.id) - 1) })}>
                        <ArrowUp size={16} />
                      </button>
                      <button
                        type="button"
                        className="icon-button"
                        aria-label={`Move “${r.title}” down`}
                        disabled={i === resources.length - 1}
                        onClick={() => save({ resourceIds: move(collection.resourceIds, collection.resourceIds.indexOf(r.id), collection.resourceIds.indexOf(r.id) + 1) })}
                      >
                        <ArrowDown size={16} />
                      </button>
                      <button type="button" className="icon-button" aria-label={`Remove “${r.title}”`} onClick={() => save({ resourceIds: collection.resourceIds.filter((x) => x !== r.id) })}>
                        <X size={16} />
                      </button>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <EmptyState icon={FolderOpen} title="No resources yet">
                Add resources below, or use “Add to a collection” on any resource page.
              </EmptyState>
            )}
            <form
              className="button-row no-print"
              style={{ marginTop: 'var(--s-5)' }}
              onSubmit={(e) => {
                e.preventDefault();
                if (!addResource) return;
                save({ resourceIds: [...collection.resourceIds, addResource] });
                setAddResource('');
                toast.show('Resource added');
              }}
            >
              <label htmlFor="add-resource" className="sr-only">
                Add a resource
              </label>
              <select id="add-resource" className="select" style={{ maxWidth: '28rem' }} value={addResource} onChange={(e) => setAddResource(e.target.value)}>
                <option value="">Add a resource from the library…</option>
                {availableResources.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title}, {r.publisher}
                  </option>
                ))}
              </select>
              <button type="submit" className="btn" disabled={!addResource}>
                <Plus size={16} aria-hidden="true" /> Add
              </button>
            </form>
          </section>
        </div>

        <aside className="with-aside__aside no-print">
          <section className="panel" aria-labelledby="details-title">
            <h2 className="panel__title" id="details-title">
              Details
            </h2>
            <div className="stack">
              <div className="field">
                <label htmlFor="col-title">Title</label>
                <input id="col-title" className="input" maxLength={120} value={collection.title} onChange={(e) => save({ title: e.target.value || 'Untitled collection' })} />
              </div>
              <div className="field">
                <label htmlFor="col-desc">Description</label>
                <textarea id="col-desc" className="textarea" maxLength={2000} value={collection.description} onChange={(e) => save({ description: e.target.value })} />
              </div>
              <div className="field">
                <label htmlFor="col-notes">
                  <Lock size={13} aria-hidden="true" style={{ display: 'inline', verticalAlign: '-1px' }} /> Private notes
                </label>
                <textarea id="col-notes" className="textarea" maxLength={10000} value={collection.privateNotes} onChange={(e) => save({ privateNotes: e.target.value })} />
                <span className="field__hint">Left out of shared exports unless you choose to include them.</span>
              </div>
            </div>
          </section>
          <section className="panel" aria-labelledby="assoc-title">
            <h2 className="panel__title" id="assoc-title">
              Associated badges and requirements
            </h2>
            <div className="tag-list">
              {collection.badgeIds.map((bid) => {
                const b = content.badgeById.get(bid);
                return b ? (
                  <span key={bid} className="tag tag--outline">
                    <Link to={`/merit-badges/${b.slug}`}>{b.name}</Link>
                    <button type="button" aria-label={`Remove ${b.name}`} style={{ border: 0, background: 'none', padding: 0, display: 'inline-flex' }} onClick={() => save({ badgeIds: collection.badgeIds.filter((x) => x !== bid) })}>
                      <X size={12} />
                    </button>
                  </span>
                ) : null;
              })}
              {collection.requirementIds.map((rid) => {
                const n = content.requirements.get(rid);
                return n ? (
                  <span key={rid} className="tag tag--outline">
                    <Link to={n.path}>
                      {n.ownerName} {n.requirement.number}
                    </Link>
                    <button type="button" aria-label={`Remove ${n.ownerName} ${n.requirement.number}`} style={{ border: 0, background: 'none', padding: 0, display: 'inline-flex' }} onClick={() => save({ requirementIds: collection.requirementIds.filter((x) => x !== rid) })}>
                      <X size={12} />
                    </button>
                  </span>
                ) : null;
              })}
              {collection.badgeIds.length + collection.requirementIds.length === 0 && <span className="small muted">None yet.</span>}
            </div>
            <div className="stack" style={{ marginTop: 'var(--s-4)' }}>
              <div className="field">
                <label htmlFor="add-badge">Add a badge</label>
                <select
                  id="add-badge"
                  className="select"
                  value={addBadge}
                  onChange={(e) => {
                    setAddBadge('');
                    if (e.target.value) save({ badgeIds: [...collection.badgeIds, e.target.value] });
                  }}
                >
                  <option value="">Choose…</option>
                  {content.badges
                    .filter((b) => !collection.badgeIds.includes(b.id))
                    .map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="add-requirement">Add a requirement</label>
                <select
                  id="add-requirement"
                  className="select"
                  value={addRequirement}
                  onChange={(e) => {
                    setAddRequirement('');
                    if (e.target.value) save({ requirementIds: [...collection.requirementIds, e.target.value] });
                  }}
                >
                  <option value="">Choose…</option>
                  {[...content.requirements.values()]
                    .filter((n) => !collection.requirementIds.includes(n.id))
                    .map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.ownerName} {n.requirement.number} · {n.requirement.title}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </section>
        </aside>
      </div>

      <Dialog
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        title="Export a shareable copy"
        footer={
          <>
            <button type="button" className="btn btn--ghost" onClick={() => setExportOpen(false)}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => {
                downloadText(`scoutpath-collection-${slugForFile(collection.title)}.json`, exportCollection(collection, { includePrivateNotes: includeNotes }));
                setExportOpen(false);
                toast.show('Collection file downloaded');
              }}
            >
              <Download size={16} aria-hidden="true" /> Download file
            </button>
          </>
        }
      >
        <div className="dialog__body">
          <p>The file contains the title, description, ordered resource list and associated badges and requirements. Recipients import it as their own copy.</p>
          <p>It never contains your progress, notes on requirements, or anything else from this browser.</p>
          <label className="check">
            <input type="checkbox" checked={includeNotes} onChange={(e) => setIncludeNotes(e.target.checked)} />
            <span>
              Include this collection’s private notes
              <span className="field__hint" style={{ display: 'block' }}>
                Off by default. Only turn this on if the notes are meant for the people you are sharing with.
              </span>
            </span>
          </label>
        </div>
      </Dialog>

      <Dialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete this collection?"
        footer={
          <>
            <button type="button" className="btn btn--ghost" onClick={() => setDeleteOpen(false)}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn--danger-solid"
              onClick={() => {
                update((d) => removeCollection(d, collection.id));
                toast.show('Collection deleted');
                navigate('/collections');
              }}
            >
              Delete collection
            </button>
          </>
        }
      >
        <div className="dialog__body">
          <p>“{collection.title}” will be removed from this browser. Copies you have already shared are not affected.</p>
        </div>
      </Dialog>
    </div>
  );
}
