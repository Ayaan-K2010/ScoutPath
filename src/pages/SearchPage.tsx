import { Search, SearchX, X } from '../components/icons';
import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { EmptyState } from '../components/EmptyState';
import { Highlight } from '../components/Highlight';
import { KIND_ICONS } from '../components/kindIcons';
import { PageHeader } from '../components/PageHeader';
import { getSearch } from '../features/search/instance';
import { KIND_LABELS, STARTER_TOPICS, type SearchKind } from '../features/search/searchIndex';
import { useDocumentTitle } from '../hooks/usePageMeta';

const KINDS: SearchKind[] = ['badge', 'rank', 'requirement', 'resource', 'study', 'vocabulary'];

export function SearchPage() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const kind = (params.get('kind') ?? '') as SearchKind | '';
  const [draft, setDraft] = useState(q);
  const [lastQ, setLastQ] = useState(q);
  if (q !== lastQ) {
    setLastQ(q);
    setDraft(q);
  }
  useDocumentTitle(q ? `Search: ${q}` : 'Search');

  const all = useMemo(() => getSearch().search(q, { limit: 200 }), [q]);
  const results = kind ? all.filter((h) => h.kind === kind) : all;
  const counts = useMemo(() => {
    const m = new Map<SearchKind, number>();
    all.forEach((h) => m.set(h.kind, (m.get(h.kind) ?? 0) + 1));
    return m;
  }, [all]);
  const suggestions = useMemo(() => (q && all.length === 0 ? getSearch().suggest(q) : []), [q, all.length]);

  const submit = (value: string) => {
    const next = new URLSearchParams();
    if (value.trim()) next.set('q', value.trim());
    setParams(next);
  };

  return (
    <div className="container page">
      <PageHeader crumbs={[{ label: 'Home', to: '/' }, { label: 'Search' }]} title="Search" lede="Search badges, ranks, requirements, resources, study sets and vocabulary. Runs entirely in your browser." />
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          submit(draft);
        }}
        style={{ maxWidth: '44rem' }}
      >
        <label htmlFor="search-page-input" className="sr-only">
          Search query
        </label>
        <div className="search-field search-field--lg">
          <Search size={20} aria-hidden="true" />
          <input id="search-page-input" className="input" type="search" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="What are you working on?" autoFocus />
          {draft && (
            <button
              type="button"
              className="icon-button search-field__clear"
              aria-label="Clear search"
              onClick={() => {
                setDraft('');
                submit('');
              }}
            >
              <X size={18} />
            </button>
          )}
        </div>
      </form>

      {q && all.length > 0 && (
        <div className="chip-group" role="group" aria-label="Filter by type" style={{ margin: 'var(--s-6) 0' }}>
          <label className="chip">
            <input
              type="radio"
              name="kind"
              checked={!kind}
              onChange={() => {
                const next = new URLSearchParams(params);
                next.delete('kind');
                setParams(next, { replace: true });
              }}
            />
            <span>All {all.length}</span>
          </label>
          {KINDS.filter((k) => counts.get(k)).map((k) => (
            <label className="chip" key={k}>
              <input
                type="radio"
                name="kind"
                checked={kind === k}
                onChange={() => {
                  const next = new URLSearchParams(params);
                  next.set('kind', k);
                  setParams(next, { replace: true });
                }}
              />
              <span>
                {KIND_LABELS[k]} {counts.get(k)}
              </span>
            </label>
          ))}
        </div>
      )}

      <div style={{ marginTop: 'var(--s-6)' }} aria-live="polite">
        {!q ? (
          <div>
            <p className="mini-heading">Try a topic</p>
            <div className="chip-group">
              {STARTER_TOPICS.map((t) => (
                <button key={t} type="button" className="btn btn--sm" onClick={() => (setDraft(t), submit(t))}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        ) : results.length === 0 ? (
          <EmptyState icon={SearchX} title={`No results for “${q}”`}>
            <p>Check the spelling, try fewer words, or search a broader topic.</p>
            <div className="chip-group" style={{ marginTop: 'var(--s-4)' }}>
              {(suggestions.length ? suggestions : STARTER_TOPICS).slice(0, 6).map((s) => (
                <button key={s} type="button" className="btn btn--sm" onClick={() => (setDraft(s), submit(s))}>
                  {s}
                </button>
              ))}
            </div>
            <p style={{ marginTop: 'var(--s-4)' }}>
              ScoutPath only covers a few badges in depth so far. Every listed badge in the <Link to="/merit-badges">library</Link> still links to its official requirements.
            </p>
          </EmptyState>
        ) : (
          <ol className="plain-list" style={{ borderTop: '1px solid var(--border)' }}>
            {results.map((h) => {
              const Icon = KIND_ICONS[h.kind];
              return (
                <li key={h.id}>
                  <Link to={h.path} className="catalog-row" style={{ gridTemplateColumns: 'auto minmax(0,1fr)', alignItems: 'start', padding: 'var(--s-4) var(--s-2)' }}>
                    <span className="kind-icon" aria-hidden="true">
                      <Icon size={16} />
                    </span>
                    <span>
                      <span className="catalog-row__name" style={{ display: 'block' }}>
                        <Highlight text={h.title} terms={h.terms} />
                      </span>
                      <span className="catalog-row__meta" style={{ display: 'block' }}>
                        {KIND_LABELS[h.kind].replace(/s$/, '')} · {h.subtitle}
                      </span>
                      {h.snippet && (
                        <span className="small" style={{ display: 'block', marginTop: 'var(--s-1)', color: 'var(--charcoal)' }}>
                          <Highlight text={h.snippet} terms={h.terms} />
                        </span>
                      )}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}
