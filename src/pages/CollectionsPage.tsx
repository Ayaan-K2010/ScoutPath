import { FolderOpen, FolderPlus, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Callout } from '../components/Callout';
import { Dialog } from '../components/Dialog';
import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';
import { newCollection } from '../features/collections/create';
import { parseCollectionImport, type CollectionImport } from '../features/collections/share';
import { content } from '../features/content/data';
import { upsertCollection } from '../features/progress/actions';
import type { Collection } from '../features/progress/schema';
import { useDocumentTitle } from '../hooks/usePageMeta';
import { useUpdateUser, useUserData } from '../hooks/useUserData';
import { readFileText } from '../lib/download';
import { formatTimestamp } from '../lib/format';
import { useToast } from '../lib/toastContext';

const knownResources = new Set(content.resources.map((r) => r.id));

export function CollectionsPage() {
  useDocumentTitle('Collections');
  const data = useUserData();
  const update = useUpdateUser();
  const navigate = useNavigate();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [imported, setImported] = useState<{ name: string; result: CollectionImport } | null>(null);

  const create = (c: Collection, message: string) => {
    update((d) => upsertCollection(d, c));
    toast.show(message);
    navigate(`/collections/${c.id}`);
  };

  return (
    <div className="container page">
      <PageHeader
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Collections' }]}
        title="Resource collections"
        lede="Build ordered lists of resources for troop meetings, workshops and group study. Print them, or share them as a file other ScoutPath users can import."
        actions={
          <>
            <button type="button" className="btn btn--primary" onClick={() => create(newCollection({ title: 'Untitled collection' }), 'Collection created')}>
              <FolderPlus size={16} aria-hidden="true" /> New collection
            </button>
            <button type="button" className="btn" onClick={() => fileRef.current?.click()}>
              <Upload size={16} aria-hidden="true" /> Import a shared file
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (!file) return;
                const text = await readFileText(file).catch(() => '');
                setImported({ name: file.name, result: parseCollectionImport(text, knownResources) });
              }}
            />
          </>
        }
      />
      <div className="stack-lg">
        <Callout title="Sharing works by file, not live collaboration">
          Collections live in this browser. To share one, export it as a file and send it; the recipient imports a copy. Private notes are left out of
          shared files unless you choose to include them, and personal progress is never included.
        </Callout>

        <section aria-labelledby="mine-title">
          <div className="section-head section-head--serif">
            <h2 id="mine-title">Your collections</h2>
          </div>
          {data.collections.length ? (
            <div className="collection-grid">
              {data.collections.map((c) => (
                <Link key={c.id} to={`/collections/${c.id}`} className="collection-card">
                  <span className="collection-card__title">{c.title}</span>
                  {c.description && <span className="small muted">{c.description}</span>}
                  <span className="collection-card__meta">
                    {c.resourceIds.length} resources · updated {formatTimestamp(c.updatedAt)}
                    {c.origin === 'import' ? ' · imported' : c.origin === 'template' ? ' · from template' : ''}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState icon={FolderOpen} title="No collections yet">
              Start from a template below, create an empty collection, or import a file someone shared with you.
            </EmptyState>
          )}
        </section>

        <section aria-labelledby="tpl-title">
          <div className="section-head section-head--serif">
            <h2 id="tpl-title">Starter templates</h2>
            <span className="section-head__aside">Copy one, then reorder and edit it</span>
          </div>
          <ul className="catalog-list">
            {content.templates.map((t) => (
              <li key={t.id} className="catalog-row" style={{ gridTemplateColumns: 'minmax(0,1fr) auto' }}>
                <span>
                  <span className="catalog-row__name">{t.title}</span>
                  <span className="catalog-row__meta" style={{ display: 'block' }}>
                    {t.description} · {t.resourceIds.length} resources
                  </span>
                </span>
                <button
                  type="button"
                  className="btn btn--sm"
                  onClick={() =>
                    create(
                      newCollection({ title: t.title, description: t.description, resourceIds: t.resourceIds, badgeIds: t.badgeIds, requirementIds: t.requirementIds, origin: 'template' }),
                      `Created “${t.title}”`,
                    )
                  }
                >
                  Use template
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <Dialog
        open={imported !== null}
        onClose={() => setImported(null)}
        title={imported?.result.ok ? 'Import this collection?' : 'This file can’t be imported'}
        footer={
          imported?.result.ok ? (
            <>
              <button type="button" className="btn btn--ghost" onClick={() => setImported(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => {
                  if (!imported?.result.ok) return;
                  const c = imported.result.collection;
                  setImported(null);
                  create(
                    newCollection({ title: c.title, description: c.description, resourceIds: c.resourceIds, badgeIds: c.badgeIds, requirementIds: c.requirementIds, privateNotes: c.privateNotes ?? '', origin: 'import' }),
                    'Collection imported',
                  );
                }}
              >
                Import as a new collection
              </button>
            </>
          ) : (
            <button type="button" className="btn" onClick={() => setImported(null)}>
              Close
            </button>
          )
        }
      >
        <div className="dialog__body">
          {imported?.result.ok ? (
            <>
              <p>
                <strong>{imported.result.collection.title}</strong>
                <br />
                {imported.result.collection.resourceIds.length} resources from <code>{imported.name}</code>
              </p>
              {imported.result.collection.description && <p className="muted">{imported.result.collection.description}</p>}
              {imported.result.unknownResourceIds.length > 0 && (
                <Callout tone="warn">
                  {imported.result.unknownResourceIds.length} resource{imported.result.unknownResourceIds.length === 1 ? ' is' : 's are'} not in this version of the
                  library and will be skipped.
                </Callout>
              )}
              {imported.result.collection.privateNotes && <p className="small">This file includes notes from its author.</p>}
              <p className="field__hint">It will be added as a new collection. None of your existing collections will change.</p>
            </>
          ) : (
            <>
              <p>The file isn’t a valid ScoutPath collection, so nothing was imported.</p>
              <ul className="small" style={{ paddingLeft: 'var(--s-5)' }}>
                {imported && !imported.result.ok && imported.result.errors.map((e) => <li key={e}>{e}</li>)}
              </ul>
            </>
          )}
        </div>
      </Dialog>
    </div>
  );
}
