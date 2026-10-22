import { LayoutGrid, List, SearchX, SlidersHorizontal } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { BadgeCard, EagleTag } from '../components/BadgeCard';
import { BadgeMark } from '../components/BadgeMark';
import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';
import { RESOURCE_TYPE_LABELS } from '../lib/labels';
import { VerificationTag } from '../components/StatusTag';
import { content } from '../features/content/data';
import type { Badge } from '../features/content/model';
import { badgeResourceTypes, DEFAULT_FILTERS, filterBadges, type CatalogFilters } from '../features/merit-badges/filter';
import { useDocumentTitle } from '../hooks/usePageMeta';
import type { CategoryId, ResourceType } from '../schemas/content';

const categoryName = new Map(content.categories.map((c) => [c.id, c.name]));

function resourceCount(badge: Badge): number {
  const ids = new Set<string>();
  for (const id of content.requirementOrder.get(badge.id) ?? []) for (const m of content.resourcesByRequirement.get(id) ?? []) ids.add(m.resource.id);
  for (const id of badge.detail?.relatedResourceIds ?? []) ids.add(id);
  return ids.size;
}

function readFilters(params: URLSearchParams): CatalogFilters {
  return {
    query: params.get('q') ?? '',
    categories: params.getAll('category').filter((c) => categoryName.has(c as CategoryId)) as CategoryId[],
    eagleOnly: params.get('eagle') === '1',
    outlinedOnly: params.get('outlined') === '1',
    resourceTypes: params.getAll('type') as ResourceType[],
    sort: params.get('sort') === 'reviewed' ? 'reviewed' : 'alpha',
  };
}

function writeFilters(f: CatalogFilters): URLSearchParams {
  const p = new URLSearchParams();
  if (f.query) p.set('q', f.query);
  f.categories.forEach((c) => p.append('category', c));
  if (f.eagleOnly) p.set('eagle', '1');
  if (f.outlinedOnly) p.set('outlined', '1');
  f.resourceTypes.forEach((t) => p.append('type', t));
  if (f.sort !== 'alpha') p.set('sort', f.sort);
  return p;
}

function CatalogRow({ badge }: { badge: Badge }) {
  return (
    <li>
      <Link to={`/merit-badges/${badge.slug}`} className="catalog-row">
        <BadgeMark category={badge.category} size="sm" muted={!badge.version} />
        <span>
          <span className="catalog-row__name">{badge.name}</span>
          <span className="catalog-row__meta" style={{ display: 'block' }}>
            {categoryName.get(badge.category)}
            {badge.version ? ` · ${content.requirementOrder.get(badge.id)?.length ?? 0} outlined items` : ''}
          </span>
        </span>
        <span className="catalog-row__tags">
          {badge.lifecycle === 'discontinued' && <span className="tag tag--alert">Reported discontinued</span>}
          <EagleTag badge={badge} />
          <VerificationTag status={badge.version ? badge.version.status : 'missing'} />
        </span>
      </Link>
    </li>
  );
}

export function BadgeLibraryPage() {
  useDocumentTitle('Merit badges');
  const [params, setParams] = useSearchParams();
  const filters = readFilters(params);
  const [view, setView] = useState<'list' | 'cards'>('list');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const update = (patch: Partial<CatalogFilters>) => setParams(writeFilters({ ...filters, ...patch }), { replace: true });

  const results = useMemo(() => filterBadges(content, filters), [params]); // eslint-disable-line react-hooks/exhaustive-deps
  const active = filters.query !== '' || filters.categories.length > 0 || filters.eagleOnly || filters.outlinedOnly || filters.resourceTypes.length > 0;
  const outlined = content.badges.filter((b) => b.version);
  const withDetail = content.badges.filter((b) => b.detail);

  const categoryCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const b of filterBadges(content, { ...filters, categories: [] })) m.set(b.category, (m.get(b.category) ?? 0) + 1);
    return m;
  }, [params]); // eslint-disable-line react-hooks/exhaustive-deps

  const availableTypes = useMemo(() => {
    const s = new Set<ResourceType>();
    content.badges.forEach((b) => badgeResourceTypes(content, b).forEach((t) => s.add(t)));
    return [...s].sort();
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, Badge[]>();
    for (const b of results) {
      const letter = b.name[0].toUpperCase();
      map.set(letter, [...(map.get(letter) ?? []), b]);
    }
    return [...map.entries()];
  }, [results]);

  return (
    <div className="container page">
      <PageHeader
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Merit badges' }]}
        title="Merit badge library"
        lede="Every listed badge links to its official requirements. Badges with a ScoutPath outline add requirement-by-requirement learning pages, resources and study tools."
        aside={
          <div className="coverage-meter" style={{ minWidth: '15rem' }}>
            <span>
              <strong>{outlined.length}</strong> of <strong>{content.badges.length}</strong> listed badges have a requirement outline
            </span>
            <div className="meter" role="img" aria-label={`${outlined.length} of ${content.badges.length} badges outlined`}>
              <span className="meter__fill" style={{ width: `${(outlined.length / content.badges.length) * 100}%` }} />
            </div>
            <span>
              0 verified against official sources. <Link to="/coverage">Coverage details</Link>
            </span>
          </div>
        }
      />

      <div className="catalog-layout">
        <div>
          <button
            type="button"
            className="btn filters-mobile-toggle"
            aria-expanded={filtersOpen}
            aria-controls="catalog-filters"
            onClick={() => setFiltersOpen((o) => !o)}
            style={{ marginBottom: 'var(--s-4)' }}
          >
            <SlidersHorizontal size={16} aria-hidden="true" /> Filters{active ? ' (active)' : ''}
          </button>
          <aside id="catalog-filters" className={`filters${filtersOpen ? '' : ' is-collapsed'}`} aria-label="Filter merit badges">
            <div className="field">
              <label htmlFor="badge-query">Search badges</label>
              <input
                id="badge-query"
                className="input"
                type="search"
                placeholder="Name, topic or requirement"
                value={filters.query}
                onChange={(e) => update({ query: e.target.value })}
              />
              <span className="field__hint">Matches names, descriptions, requirement topics and resource topics.</span>
            </div>
            <fieldset>
              <legend className="filters__group-title">Status</legend>
              <div className="filters__list">
                <label className="check">
                  <input type="checkbox" checked={filters.eagleOnly} onChange={(e) => update({ eagleOnly: e.target.checked })} />
                  Eagle-required or Eagle option*
                </label>
                <label className="check">
                  <input type="checkbox" checked={filters.outlinedOnly} onChange={(e) => update({ outlinedOnly: e.target.checked })} />
                  Has a ScoutPath outline
                </label>
              </div>
            </fieldset>
            <fieldset>
              <legend className="filters__group-title">Topic</legend>
              <div className="filters__list">
                {content.categories.map((c) => (
                  <label className="check" key={c.id}>
                    <input
                      type="checkbox"
                      checked={filters.categories.includes(c.id)}
                      onChange={(e) =>
                        update({ categories: e.target.checked ? [...filters.categories, c.id] : filters.categories.filter((x) => x !== c.id) })
                      }
                    />
                    {c.name}
                    <span className="filters__count">{categoryCounts.get(c.id) ?? 0}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="filters__group-title">Resource types available</legend>
              <div className="filters__list">
                {availableTypes.map((t) => (
                  <label className="check" key={t}>
                    <input
                      type="checkbox"
                      checked={filters.resourceTypes.includes(t)}
                      onChange={(e) =>
                        update({ resourceTypes: e.target.checked ? [...filters.resourceTypes, t] : filters.resourceTypes.filter((x) => x !== t) })
                      }
                    />
                    {RESOURCE_TYPE_LABELS[t]}
                  </label>
                ))}
              </div>
            </fieldset>
            {active && (
              <button type="button" className="btn btn--sm" onClick={() => setParams(writeFilters(DEFAULT_FILTERS), { replace: true })}>
                Clear all filters
              </button>
            )}
            <p className="field__hint">*Eagle status reflects 2026 council communications and has not been checked against scouting.org.</p>
          </aside>
        </div>

        <section aria-labelledby="results-heading">
          <div className="catalog-toolbar">
            <h2 id="results-heading" className="catalog-toolbar__summary" aria-live="polite">
              {active ? `${results.length} of ${content.badges.length} badges match` : `${content.badges.length} listed badges`}
            </h2>
            <div className="button-row">
              <label className="sr-only" htmlFor="badge-sort">
                Sort
              </label>
              <select id="badge-sort" className="select" style={{ minHeight: '2.25rem', width: 'auto' }} value={filters.sort} onChange={(e) => update({ sort: e.target.value as CatalogFilters['sort'] })}>
                <option value="alpha">A–Z</option>
                <option value="reviewed">Recently reviewed first</option>
              </select>
              <div className="view-toggle" role="group" aria-label="Layout">
                <button type="button" aria-pressed={view === 'list'} onClick={() => setView('list')}>
                  <List size={14} aria-hidden="true" /> List
                </button>
                <button type="button" aria-pressed={view === 'cards'} onClick={() => setView('cards')}>
                  <LayoutGrid size={14} aria-hidden="true" /> Cards
                </button>
              </div>
            </div>
          </div>

          {!active && view === 'list' && (
            <div style={{ marginBottom: 'var(--s-12)' }}>
              <h3 className="mini-heading">With learning pages</h3>
              <div className="featured-grid">
                {withDetail.map((b) => (
                  <BadgeCard key={b.id} badge={b} categoryName={categoryName.get(b.category) ?? ''} resourceCount={resourceCount(b)} />
                ))}
              </div>
            </div>
          )}

          {results.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="No badges match those filters"
              actions={
                <button type="button" className="btn" onClick={() => setParams(writeFilters(DEFAULT_FILTERS), { replace: true })}>
                  Clear filters
                </button>
              }
            >
              Try a broader word such as “outdoor”, “safety” or “science”, or remove a filter. Only {outlined.length} badges have requirement outlines so
              far, so the outline and resource-type filters narrow results quickly.
            </EmptyState>
          ) : view === 'cards' ? (
            <div className="featured-grid">
              {results.map((b) => (
                <BadgeCard key={b.id} badge={b} categoryName={categoryName.get(b.category) ?? ''} resourceCount={resourceCount(b)} />
              ))}
            </div>
          ) : filters.sort === 'alpha' && !active ? (
            <div>
              <h3 className="mini-heading">All listed badges, A–Z</h3>
              {grouped.map(([letter, badges]) => (
                <section key={letter} className="letter-group" aria-label={`Badges starting with ${letter}`}>
                  <p className="letter-group__letter" aria-hidden="true">
                    {letter}
                  </p>
                  <ul className="catalog-list">
                    {badges.map((b) => (
                      <CatalogRow key={b.id} badge={b} />
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          ) : (
            <ul className="catalog-list">
              {results.map((b) => (
                <CatalogRow key={b.id} badge={b} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
