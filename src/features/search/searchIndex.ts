/**
 * Local full-text search across badges, ranks, requirements, resources,
 * study sets and study vocabulary. Runs entirely in the browser with
 * MiniSearch; no search API is involved.
 */
import MiniSearch, { type SearchResult } from 'minisearch';
import type { Content } from '../content/model';

export type SearchKind = 'badge' | 'rank' | 'requirement' | 'resource' | 'study' | 'vocabulary';

export const KIND_LABELS: Record<SearchKind, string> = {
  badge: 'Merit badges',
  rank: 'Ranks',
  requirement: 'Requirements',
  resource: 'Resources',
  study: 'Study sets',
  vocabulary: 'Vocabulary',
};

const KIND_BOOST: Record<SearchKind, number> = { badge: 2.5, rank: 2.5, study: 1.3, requirement: 1, resource: 1, vocabulary: 1 };

export interface SearchDoc {
  id: string;
  kind: SearchKind;
  title: string;
  subtitle: string;
  text: string;
  keywords: string;
  path: string;
}

export interface SearchHit {
  id: string;
  kind: SearchKind;
  title: string;
  subtitle: string;
  snippet: string;
  path: string;
  terms: string[];
  score: number;
}

export function buildDocuments(content: Content): SearchDoc[] {
  const docs: SearchDoc[] = [];
  const categoryName = new Map(content.categories.map((c) => [c.id, c.name]));
  for (const b of content.badges) {
    docs.push({
      id: `badge:${b.id}`,
      kind: 'badge',
      title: b.name,
      subtitle: `Merit badge · ${categoryName.get(b.category) ?? b.category}`,
      text: b.detail?.description ?? '',
      keywords: [categoryName.get(b.category), b.eagle.status === 'required' || b.eagle.status === 'required-option' ? 'eagle required' : '', b.lifecycle === 'discontinued' ? 'discontinued' : ''].join(' '),
      path: `/merit-badges/${b.slug}`,
    });
  }
  for (const r of content.ranks) {
    docs.push({ id: `rank:${r.id}`, kind: 'rank', title: r.name, subtitle: `Rank ${r.order} of 7`, text: r.description, keywords: 'rank advancement', path: `/ranks/${r.slug}` });
  }
  for (const node of content.requirements.values()) {
    const req = node.requirement;
    docs.push({
      id: `req:${node.id}`,
      kind: 'requirement',
      title: `${node.ownerName} ${req.number} · ${req.title}`,
      subtitle: `${node.ownerType === 'badge' ? 'Merit badge' : 'Rank'} requirement ${req.number}`,
      text: [req.summary, req.orientation ?? ''].join(' '),
      keywords: `${node.ownerName} ${req.number} ${node.ownerName}${req.number} requirement ${req.number}`,
      path: node.path,
    });
  }
  for (const res of content.resources) {
    docs.push({
      id: `res:${res.id}`,
      kind: 'resource',
      title: res.title,
      subtitle: `${res.publisher}`,
      text: res.description,
      keywords: [res.publisher, ...res.topics, res.type].join(' '),
      path: `/resources/${res.id.replace(/^res\./, '')}`,
    });
  }
  for (const s of content.studySets) {
    docs.push({ id: `study:${s.id}`, kind: 'study', title: s.title, subtitle: 'Study set', text: s.description, keywords: s.guide.sections.map((x) => x.heading).join(' '), path: `/study/${s.slug}` });
    for (const v of s.guide.vocabulary) {
      docs.push({ id: `vocab:${s.id}:${v.term}`, kind: 'vocabulary', title: v.term, subtitle: `Vocabulary · ${s.title}`, text: v.definition, keywords: 'definition term', path: `/study/${s.slug}#vocabulary` });
    }
  }
  return docs;
}

export interface LocalSearch {
  search(query: string, options?: { kinds?: SearchKind[]; limit?: number }): SearchHit[];
  suggest(query: string, limit?: number): string[];
  documentCount: number;
}

function snippetFor(text: string, terms: string[], length = 160): string {
  if (!text) return '';
  const lower = text.toLowerCase();
  const at = terms.map((t) => lower.indexOf(t.toLowerCase())).filter((i) => i >= 0).sort((a, b) => a - b)[0] ?? 0;
  const start = Math.max(0, at - 50);
  const slice = text.slice(start, start + length);
  return `${start > 0 ? '…' : ''}${slice.trim()}${start + length < text.length ? '…' : ''}`;
}

export function createSearch(content: Content): LocalSearch {
  const docs = buildDocuments(content);
  const byId = new Map(docs.map((d) => [d.id, d]));
  const mini = new MiniSearch<SearchDoc>({
    fields: ['title', 'keywords', 'text', 'subtitle'],
    storeFields: ['kind'],
    searchOptions: {
      boost: { title: 4, keywords: 2, subtitle: 1, text: 1 },
      // Badges and ranks are the most useful landing pages when their name is searched.
      boostDocument: (_id, _term, stored) => KIND_BOOST[(stored?.kind as SearchKind) ?? 'resource'],
      prefix: (term) => term.length > 2,
      fuzzy: (term) => (term.length > 4 ? 0.2 : false),
    },
  });
  mini.addAll(docs);

  const toHits = (results: SearchResult[], kinds?: SearchKind[]): SearchHit[] =>
    results
      .map((r) => {
        const doc = byId.get(String(r.id))!;
        return {
          id: doc.id,
          kind: doc.kind,
          title: doc.title,
          subtitle: doc.subtitle,
          snippet: snippetFor(doc.text, r.terms),
          path: doc.path,
          terms: r.terms,
          score: r.score,
        };
      })
      .filter((h) => !kinds || kinds.length === 0 || kinds.includes(h.kind));

  return {
    documentCount: docs.length,
    search(query, options = {}) {
      const q = query.trim();
      if (!q) return [];
      let results = mini.search(q, { combineWith: 'AND' });
      if (results.length === 0) results = mini.search(q, { combineWith: 'OR' });
      return toHits(results, options.kinds).slice(0, options.limit ?? 50);
    },
    suggest(query, limit = 6) {
      const q = query.trim();
      if (q.length < 2) return [];
      return mini
        .autoSuggest(q, { fuzzy: 0.3, prefix: true })
        .map((s) => s.suggestion)
        .filter((s) => s.toLowerCase() !== q.toLowerCase())
        .slice(0, limit);
    },
  };
}

/** Topic suggestions shown when a search has no results. Every entry returns results in the current dataset. */
export const STARTER_TOPICS = ['first aid', 'knots', 'lightning', 'Leave No Trace', 'hypothermia', 'water treatment', 'flag', 'emergency kit'];
