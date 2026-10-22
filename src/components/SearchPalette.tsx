import { ArrowRight, CornerDownLeft, Search } from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { getSearch } from '../features/search/instance';
import { KIND_LABELS, STARTER_TOPICS, type SearchHit, type SearchKind } from '../features/search/searchIndex';
import { useUserData } from '../hooks/useUserData';
import { Dialog } from './Dialog';
import { Highlight } from './Highlight';
import { KIND_ICONS } from './kindIcons';

const KIND_ORDER: SearchKind[] = ['badge', 'rank', 'requirement', 'resource', 'study', 'vocabulary'];

interface Option {
  key: string;
  title: string;
  subtitle: string;
  path: string;
  kind: SearchKind | 'recent' | 'all';
  terms: string[];
}

export function SearchPalette({ open, initialQuery, onClose }: { open: boolean; initialQuery: string; onClose: () => void }) {
  const [query, setQuery] = useState(initialQuery);
  const [active, setActive] = useState(0);
  const navigate = useNavigate();
  const data = useUserData();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  // The shell remounts this component each time it opens, so state starts fresh; only focus needs an effect.
  useEffect(() => {
    if (open) requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  const { groups, options, suggestions } = useMemo(() => {
    const q = query.trim();
    if (!q) {
      const recent: Option[] = data.recent.slice(0, 5).map((r) => ({ key: `recent:${r.kind}:${r.id}`, title: r.title, subtitle: 'Recently viewed', path: r.path, kind: 'recent', terms: [] }));
      return { groups: recent.length ? [{ label: 'Recently viewed', items: recent }] : [], options: recent, suggestions: [] as string[] };
    }
    const search = getSearch();
    const hits = search.search(q, { limit: 40 });
    const grouped: { label: string; items: Option[] }[] = [];
    for (const kind of KIND_ORDER) {
      const items = hits
        .filter((h: SearchHit) => h.kind === kind)
        .slice(0, kind === 'requirement' || kind === 'resource' ? 5 : 3)
        .map((h) => ({ key: h.id, title: h.title, subtitle: h.subtitle, path: h.path, kind: h.kind, terms: h.terms }));
      if (items.length) grouped.push({ label: KIND_LABELS[kind], items });
    }
    const flat = grouped.flatMap((g) => g.items);
    if (hits.length) flat.push({ key: 'all', title: `See all ${hits.length} results for “${q}”`, subtitle: '', path: `/search?q=${encodeURIComponent(q)}`, kind: 'all', terms: [] });
    return { groups: grouped, options: flat, suggestions: hits.length ? [] : search.suggest(q) };
  }, [query, data.recent]);

  const go = (option: Option | undefined) => {
    if (!option) return;
    onClose();
    navigate(option.path);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => (options.length ? (i + 1) % options.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (options.length ? (i - 1 + options.length) % options.length : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (options[active]) go(options[active]);
      else if (query.trim()) {
        onClose();
        navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      }
    }
  };

  const optionId = (i: number) => `${listId}-opt-${i}`;
  const offsets = groups.map((_, g) => groups.slice(0, g).reduce((n, x) => n + x.items.length, 0));

  return (
    <Dialog open={open} onClose={onClose} title="Search ScoutPath" className="palette" hideTitle>
      <div className="palette__input-wrap">
        <Search size={20} aria-hidden="true" />
        <input
          ref={inputRef}
          className="palette__input"
          type="search"
          role="combobox"
          aria-expanded={options.length > 0}
          aria-controls={listId}
          aria-activedescendant={options.length ? optionId(active) : undefined}
          aria-autocomplete="list"
          aria-label="Search badges, ranks, requirements and resources"
          placeholder="Search badges, requirements, resources…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
        />
        <kbd>Esc</kbd>
      </div>
      <div className="palette__results" id={listId} role="listbox" aria-label="Search results">
        {groups.map((group, g) => (
          <div role="group" aria-label={group.label} key={group.label}>
            <div className="palette__group-label" aria-hidden="true">
              {group.label}
            </div>
            {group.items.map((option, j) => {
              const i = offsets[g] + j;
              const Icon = option.kind === 'recent' || option.kind === 'all' ? ArrowRight : KIND_ICONS[option.kind];
              return (
                <div
                  key={option.key}
                  id={optionId(i)}
                  role="option"
                  aria-selected={i === active}
                  className="palette__option"
                  onMouseMove={() => setActive(i)}
                  onClick={() => go(option)}
                >
                  <span className="kind-icon" aria-hidden="true">
                    <Icon size={16} />
                  </span>
                  <span style={{ minWidth: 0 }}>
                    <span className="palette__option-title" style={{ display: 'block' }}>
                      <Highlight text={option.title} terms={option.terms} />
                    </span>
                    <span className="palette__option-sub" style={{ display: 'block' }}>
                      {option.subtitle}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        ))}
        {query.trim() && options.length > 0 && (
          <div
            id={optionId(options.length - 1)}
            role="option"
            aria-selected={active === options.length - 1}
            className="palette__option"
            onMouseMove={() => setActive(options.length - 1)}
            onClick={() => go(options[options.length - 1])}
          >
            <span className="kind-icon" aria-hidden="true">
              <ArrowRight size={16} />
            </span>
            <span className="palette__option-title">{options[options.length - 1].title}</span>
          </div>
        )}
        {query.trim() && options.length === 0 && (
          <div className="palette__empty">
            <p>No matches for “{query.trim()}”.</p>
            <p style={{ marginTop: 'var(--s-3)' }}>Try {suggestions.length ? 'one of these:' : 'a broader topic:'}</p>
            <div className="chip-group" style={{ justifyContent: 'center', marginTop: 'var(--s-3)' }}>
              {(suggestions.length ? suggestions : STARTER_TOPICS.slice(0, 5)).map((s) => (
                <button key={s} type="button" className="btn btn--sm" onClick={() => setQuery(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {!query.trim() && options.length === 0 && (
          <div className="palette__empty">
            <p>Search every badge, rank, requirement, resource and study term.</p>
            <div className="chip-group" style={{ justifyContent: 'center', marginTop: 'var(--s-4)' }}>
              {STARTER_TOPICS.slice(0, 6).map((s) => (
                <button key={s} type="button" className="btn btn--sm" onClick={() => setQuery(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="palette__foot" aria-hidden="true">
        <span>
          <kbd>↑</kbd> <kbd>↓</kbd> to move · <kbd>
            <CornerDownLeft size={10} style={{ display: 'inline' }} />
          </kbd>{' '}
          to open
        </span>
        <span>Search runs on your device</span>
      </div>
    </Dialog>
  );
}
