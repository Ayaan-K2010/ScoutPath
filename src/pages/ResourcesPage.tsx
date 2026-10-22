import { SearchX } from 'lucide-react';
import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router';
import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';
import { ResourceRow } from '../components/ResourceRow';
import { PUBLISHER_TYPE_LABELS } from '../lib/labels';
import { RESOURCE_TYPE_LABELS } from '../lib/labels';
import { content } from '../features/content/data';
import { useDocumentTitle } from '../hooks/usePageMeta';
import type { PublisherType, ResourceType } from '../schemas/content';

export function ResourcesPage() {
  useDocumentTitle('Resource library');
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const type = (params.get('type') ?? '') as ResourceType | '';
  const publisherType = (params.get('publisher') ?? '') as PublisherType | '';
  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const types = useMemo(() => [...new Set(content.resources.map((r) => r.type))].sort(), []);
  const publisherTypes = useMemo(() => [...new Set(content.resources.map((r) => r.publisherType))].sort(), []);
  const results = useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    return content.resources
      .filter((r) => (!type || r.type === type) && (!publisherType || r.publisherType === publisherType))
      .filter((r) => {
        const hay = [r.title, r.publisher, r.description, ...r.topics].join(' ').toLowerCase();
        return words.every((w) => hay.includes(w));
      })
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [q, type, publisherType]);

  return (
    <div className="container page">
      <PageHeader
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Resource library' }]}
        title="Resource library"
        lede={`${content.resources.length} curated links to public educational material, each with an original description. ScoutPath links to publishers and never re-hosts their content.`}
      />
      <div className="catalog-layout">
        <aside className="filters" style={{ display: 'grid' }} aria-label="Filter resources">
          <div className="field">
            <label htmlFor="res-q">Search resources</label>
            <input id="res-q" className="input" type="search" value={q} placeholder="Title, publisher or topic" onChange={(e) => set('q', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="res-type">Type</label>
            <select id="res-type" className="select" value={type} onChange={(e) => set('type', e.target.value)}>
              <option value="">All types</option>
              {types.map((t) => (
                <option key={t} value={t}>
                  {RESOURCE_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="res-pub">Publisher</label>
            <select id="res-pub" className="select" value={publisherType} onChange={(e) => set('publisher', e.target.value)}>
              <option value="">All publishers</option>
              {publisherTypes.map((t) => (
                <option key={t} value={t}>
                  {PUBLISHER_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>
          {(q || type || publisherType) && (
            <button type="button" className="btn btn--sm" onClick={() => setParams(new URLSearchParams(), { replace: true })}>
              Clear filters
            </button>
          )}
          <p className="field__hint">
            Links were collected on {content.meta?.updatedOn ?? 'an unknown date'} and have not been re-checked since. See <Link to="/coverage">coverage</Link>.
          </p>
        </aside>
        <section aria-labelledby="res-count">
          <h2 id="res-count" className="catalog-toolbar__summary" aria-live="polite" style={{ marginBottom: 'var(--s-4)' }}>
            {results.length} resource{results.length === 1 ? '' : 's'}
          </h2>
          {results.length ? (
            <ul className="resource-list">
              {results.map((r) => (
                <li key={r.id}>
                  <ResourceRow resource={r} highlight={q.split(/\s+/).filter(Boolean)} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={SearchX} title="No resources match" actions={<button type="button" className="btn" onClick={() => setParams(new URLSearchParams(), { replace: true })}>Clear filters</button>}>
              Try a broader topic like “safety”, “weather” or “knots”.
            </EmptyState>
          )}
        </section>
      </div>
    </div>
  );
}
