import { describe, expect, it } from 'vitest';
import { content } from '../src/features/content/data';
import { DEFAULT_FILTERS, filterBadges } from '../src/features/merit-badges/filter';
import { createSearch, STARTER_TOPICS } from '../src/features/search/searchIndex';

const search = createSearch(content);

describe('local search', () => {
  it('finds resources and requirements by topic', () => {
    const hits = search.search('hypothermia');
    expect(hits.some((h) => h.kind === 'resource' && h.id === 'res:res.cdc-hypothermia')).toBe(true);
    expect(hits.some((h) => h.kind === 'requirement')).toBe(true);
  });

  it('finds a requirement by owner name and number', () => {
    const hits = search.search('Tenderfoot 4a');
    expect(hits[0].id).toBe('req:rank.tenderfoot.4a');
  });

  it('finds badges by name and resources by publisher', () => {
    expect(search.search('first aid')[0].kind).toBe('badge');
    expect(search.search('National Weather Service').some((h) => h.id === 'res:res.nws-lightning-safety')).toBe(true);
  });

  it('finds study vocabulary', () => {
    expect(search.search('urushiol').some((h) => h.kind === 'vocabulary')).toBe(true);
  });

  it('filters by result kind', () => {
    const hits = search.search('lightning', { kinds: ['resource'] });
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.every((h) => h.kind === 'resource')).toBe(true);
  });

  it('tolerates small typos and returns matched terms for highlighting', () => {
    const hits = search.search('hypothermai');
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0].terms.length).toBeGreaterThan(0);
  });

  it('returns nothing for an empty query and suggestions for partial words', () => {
    expect(search.search('   ')).toEqual([]);
    expect(search.suggest('lightn').length).toBeGreaterThan(0);
  });

  it('every starter topic returns results', () => {
    for (const topic of STARTER_TOPICS) expect(search.search(topic).length, topic).toBeGreaterThan(0);
  });
});

describe('catalog filtering', () => {
  it('returns all badges alphabetically by default', () => {
    const all = filterBadges(content, DEFAULT_FILTERS);
    expect(all.length).toBe(content.badges.length);
    expect(all.map((b) => b.name)).toEqual([...all.map((b) => b.name)].sort((a, b) => a.localeCompare(b)));
  });

  it('filters by category, Eagle status and outline', () => {
    expect(filterBadges(content, { ...DEFAULT_FILTERS, categories: ['aquatics'] }).every((b) => b.category === 'aquatics')).toBe(true);
    const eagle = filterBadges(content, { ...DEFAULT_FILTERS, eagleOnly: true });
    expect(eagle.map((b) => b.slug)).toContain('first-aid');
    expect(eagle.map((b) => b.slug)).not.toContain('chess');
    expect(filterBadges(content, { ...DEFAULT_FILTERS, outlinedOnly: true }).map((b) => b.slug).sort()).toEqual(['camping', 'emergency-preparedness', 'first-aid']);
  });

  it('matches requirement topics and resource types', () => {
    expect(filterBadges(content, { ...DEFAULT_FILTERS, query: 'triage' }).map((b) => b.slug)).toEqual(['first-aid']);
    const pdf = filterBadges(content, { ...DEFAULT_FILTERS, resourceTypes: ['pdf'] });
    expect(pdf.length).toBeGreaterThan(0);
  });

  it('returns an empty list when nothing matches', () => {
    expect(filterBadges(content, { ...DEFAULT_FILTERS, query: 'zzzz-not-a-badge' })).toEqual([]);
  });
});
