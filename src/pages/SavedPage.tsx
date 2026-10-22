import { Bookmark, FolderPlus, Printer } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';
import { PrintHeader } from '../components/PrintHeader';
import { ResourceRow } from '../components/ResourceRow';
import { content } from '../features/content/data';
import { upsertCollection } from '../features/progress/actions';
import { useDocumentTitle } from '../hooks/usePageMeta';
import { useUpdateUser, useUserData } from '../hooks/useUserData';
import { uid } from '../lib/ids';
import { useToast } from '../lib/toastContext';

export function SavedPage() {
  useDocumentTitle('Saved resources');
  const data = useUserData();
  const update = useUpdateUser();
  const navigate = useNavigate();
  const toast = useToast();
  const entries = Object.entries(data.saved).sort((a, b) => b[1].savedAt.localeCompare(a[1].savedAt));
  const saved = entries.map(([id]) => content.resourceById.get(id)).filter((r) => r !== undefined);
  const missing = entries.length - saved.length;

  return (
    <div className="container page">
      <PrintHeader title="Saved resources" />
      <PageHeader
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Saved resources' }]}
        title="Saved resources"
        lede="Resources you bookmarked, newest first. Saved only in this browser."
        actions={
          saved.length > 0 && (
            <>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  const id = uid('col');
                  const now = new Date().toISOString();
                  update((d) =>
                    upsertCollection(d, {
                      id,
                      title: 'My saved resources',
                      description: 'Created from saved resources.',
                      resourceIds: saved.map((r) => r.id),
                      badgeIds: [],
                      requirementIds: [],
                      privateNotes: '',
                      origin: 'user',
                      createdAt: now,
                      updatedAt: now,
                    }),
                  );
                  toast.show('Collection created');
                  navigate(`/collections/${id}`);
                }}
              >
                <FolderPlus size={16} aria-hidden="true" /> Make a collection from these
              </button>
              <button type="button" className="btn btn--ghost" onClick={() => window.print()}>
                <Printer size={16} aria-hidden="true" /> Print list
              </button>
            </>
          )
        }
      />
      {missing > 0 && (
        <p className="small muted" style={{ marginBottom: 'var(--s-4)' }}>
          {missing} saved item{missing === 1 ? ' is' : 's are'} no longer in the library and {missing === 1 ? 'is' : 'are'} hidden.
        </p>
      )}
      {saved.length ? (
        <ul className="resource-list">
          {saved.map((r) => (
            <li key={r.id}>
              <ResourceRow resource={r} />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={Bookmark}
          title="Nothing saved yet"
          actions={
            <>
              <Link to="/resources" className="btn btn--primary">
                Browse the resource library
              </Link>
              <Link to="/ranks" className="btn">
                Start from a rank
              </Link>
            </>
          }
        >
          Use the Save button on any resource to keep it here for later. Saved resources also appear on your dashboard.
        </EmptyState>
      )}
    </div>
  );
}
