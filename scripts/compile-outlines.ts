/**
 * Compiles maintainer-authored outline files (content-src/*.outline) into the
 * JSON dataset. Each outline becomes a NEW requirement version appended to the
 * owner's file; earlier versions are kept and linked with `supersedes`.
 *
 *   npm run content:compile            compile all outlines (re-compiling a version replaces it in place)
 *   npm run content:compile -- --check report what would change without writing
 *
 * Outline format (one owner per block, blocks separated by a line starting with "@owner"):
 *
 *   @owner mb.first-aid           rank.<slug> or mb.<slug>
 *   @version 2026-official-excerpt
 *   @effective 2026-01-01
 *   @complete complete|partial|outline-only
 *   @url https://www.scouting.org/merit-badges/first-aid/
 *   @source https://… | label      (repeatable; official documents consulted)
 *   @note text                     (added to the provenance notes)
 *   @desc text                     (badge description; used when creating a new detail file)
 *   @safety text                   (marks the badge safety-sensitive, with a note)
 *   @study study.x / @related res.x (repeatable)
 *   1 k Title :: Original ScoutPath summary
 *   1a demo! Title :: Summary       ("!" marks the requirement safety-sensitive)
 *   > orientation paragraph for the previous requirement
 *   ~ note for the previous requirement
 *   = mb.x.1, rank.y.2a             (related requirement IDs for the previous requirement)
 *
 * Kinds: k knowledge, d discussion, demo demonstration, a activity, s service,
 * l leadership, c conference, r review, m mixed.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parentRequirementNumber } from '../src/features/content/model.ts';
import type { Requirement, RequirementKind, RequirementVersion } from '../src/schemas/content.ts';
import { DATA_DIR } from './lib/load.ts';

const SRC = join(import.meta.dirname, '../content-src');
const KINDS: Record<string, RequirementKind> = { k: 'knowledge', d: 'discussion', demo: 'demonstration', a: 'activity', s: 'service', l: 'leadership', c: 'conference', r: 'review', m: 'mixed' };
const RECORDED_ON = '2026-10-24';
const check = process.argv.includes('--check');

interface Block {
  owner: string;
  meta: Record<string, string>;
  sources: { label: string; url: string }[];
  studies: string[];
  related: string[];
  rows: { number: string; kind: RequirementKind; safety: boolean; title: string; summary: string; orientation?: string; note?: string; relatedIds?: string[] }[];
}

function parse(text: string, file: string): Block[] {
  const blocks: Block[] = [];
  let cur: Block | null = null;
  text.split('\n').forEach((raw, i) => {
    const line = raw.trimEnd();
    if (!line.trim() || line.startsWith('#')) return;
    const where = `${file}:${i + 1}`;
    if (line.startsWith('@owner ')) {
      cur = { owner: line.slice(7).trim(), meta: {}, sources: [], studies: [], related: [], rows: [] };
      blocks.push(cur);
      return;
    }
    if (!cur) throw new Error(`${where}: content before @owner`);
    const b: Block = cur;
    if (line.startsWith('@')) {
      const sp = line.indexOf(' ');
      const key = sp < 0 ? line.slice(1) : line.slice(1, sp);
      const value = sp < 0 ? '' : line.slice(sp + 1).trim();
      if (key === 'source') {
        const [url, label] = value.split('|').map((s) => s.trim());
        b.sources.push({ url, label: label || url });
      } else if (key === 'study') b.studies.push(value);
      else if (key === 'related') b.related.push(value);
      else if (key === 'note' && b.meta.note) b.meta.note += ` ${value}`;
      else b.meta[key] = value;
      return;
    }
    const last = b.rows[b.rows.length - 1];
    if (line.startsWith('> ')) {
      if (!last) throw new Error(`${where}: orientation before a requirement`);
      last.orientation = last.orientation ? `${last.orientation} ${line.slice(2)}` : line.slice(2);
      return;
    }
    if (line.startsWith('~ ')) {
      if (!last) throw new Error(`${where}: note before a requirement`);
      last.note = line.slice(2);
      return;
    }
    if (line.startsWith('= ')) {
      if (!last) throw new Error(`${where}: related before a requirement`);
      last.relatedIds = line.slice(2).split(',').map((s) => s.trim()).filter(Boolean);
      return;
    }
    const m = line.match(/^([0-9]+[a-z]?[0-9]*)\s+([a-z]+)(!?)\s+(.+?)\s+::\s+(.+)$/);
    if (!m) throw new Error(`${where}: cannot parse "${line}"`);
    const kind = KINDS[m[2]];
    if (!kind) throw new Error(`${where}: unknown kind "${m[2]}"`);
    b.rows.push({ number: m[1], kind, safety: m[3] === '!', title: m[4], summary: m[5] });
  });
  return blocks;
}

function tree(block: Block): Requirement[] {
  const prefix = block.owner; // e.g. mb.first-aid
  const roots: Requirement[] = [];
  const byNumber = new Map<string, Requirement>();
  for (const r of block.rows) {
    const req: Requirement = {
      id: `${prefix}.${r.number}`,
      number: r.number,
      title: r.title,
      summary: r.summary,
      kind: r.kind,
      ...(r.safety ? { safetySensitive: true } : {}),
      ...(r.orientation ? { orientation: r.orientation } : {}),
      ...(r.note ? { note: r.note } : {}),
      ...(r.relatedIds ? { relatedRequirementIds: r.relatedIds } : {}),
      children: [],
    };
    // Parent is the nearest previously seen structural ancestor (2a -> 2, 9b1 -> 9b); "10" is top level, not a child of "1".
    let parent: Requirement | undefined;
    for (let p = parentRequirementNumber(r.number); p !== null && !parent; p = parentRequirementNumber(p)) parent = byNumber.get(p);
    if (parent) parent.children.push(req);
    else roots.push(req);
    byNumber.set(r.number, req);
  }
  return roots;
}

const files = readdirSync(SRC).filter((f) => f.endsWith('.outline')).sort();
const parsed = files.map((file) => ({ file, blocks: parse(readFileSync(join(SRC, file), 'utf8'), file) }));
let written = 0;
for (const { file, blocks } of parsed) {
  for (const block of blocks) {
    const [kind, slug] = block.owner.split('.');
    const path = join(DATA_DIR, kind === 'rank' ? 'ranks' : 'badges', `${slug}.json`);
    const versionId = block.meta.version ?? (kind === 'rank' ? '2025-official-excerpt' : '2026-official-excerpt');
    let record: Record<string, unknown> & { versions: RequirementVersion[]; currentVersion: string | null };
    if (existsSync(path)) {
      record = JSON.parse(readFileSync(path, 'utf8'));
    } else {
      if (kind === 'rank') throw new Error(`${file}: rank file ${slug}.json must exist`);
      if (!block.meta.desc) throw new Error(`${file}: new badge ${slug} needs @desc`);
      record = {
        schemaVersion: 1,
        id: block.owner,
        slug,
        description: block.meta.desc,
        lastReviewed: null,
        safety: { sensitive: Boolean(block.meta.safety), reviewed: false, ...(block.meta.safety ? { note: block.meta.safety } : {}) },
        currentVersion: null,
        versions: [],
        relatedResourceIds: [],
        studySetIds: [],
      };
    }
    if (block.rows.length === 0) {
      // Description-only block: the badge has no confirmed outline yet.
      if (kind === 'mb') {
        if (block.meta.desc) record.description = block.meta.desc;
        if (block.meta.note) record.outlineNote = block.meta.note;
        if (block.meta.safety) record.safety = { sensitive: true, reviewed: false, note: block.meta.safety };
        record.studySetIds = [...new Set([...(record.studySetIds as string[]), ...block.studies])];
        record.relatedResourceIds = [...new Set([...(record.relatedResourceIds as string[]), ...block.related])];
      }
      if (!check) writeFileSync(path, JSON.stringify(record, null, 2) + '\n');
      written++;
      continue;
    }
    const existing = record.versions.find((v) => v.versionId === versionId);
    // Re-compiling an existing version replaces only that version (outlines are the source of truth for it)
    // and keeps the version it originally superseded, so repeated compiles are stable.
    if (existing) record.versions = record.versions.filter((v) => v !== existing);
    const previous = existing ? existing.supersedes : record.currentVersion;
    // Badges default to their official Merit Badge Hub page as the primary source.
    if (kind === 'mb' && !block.meta.url) {
      block.meta.url = `https://www.scouting.org/merit-badges/${slug}/`;
      block.sources.unshift({ url: block.meta.url, label: 'Official merit badge page (scouting.org Merit Badge Hub)' });
    }
    if (kind === 'mb' && !block.meta.effective) block.meta.effective = '2026-01-01';
    const url = block.meta.url ?? block.sources[0]?.url;
    if (!url) throw new Error(`${file}: ${block.owner} needs @url`);
    const version: RequirementVersion = {
      versionId,
      label: block.meta.label ?? 'Checked against official scouting.org excerpts (partial verification)',
      effectiveDate: block.meta.effective ?? null,
      status: 'partially-verified',
      completeness: (block.meta.complete as RequirementVersion['completeness']) ?? 'partial',
      wordingPolicy: 'link-only',
      sourceUrl: url,
      sourceLinkStatus: 'unchecked',
      sourceCheckedOn: RECORDED_ON,
      supersedes: previous,
      provenance: {
        method: 'official-source-excerpt',
        notes: `Requirement numbering and topics were checked against excerpts of official Scouting America pages (scouting.org) returned by a search index on ${RECORDED_ON}. The pages themselves could not be opened from the build environment, so wording was not compared word for word and some sub-items may be summarized from partial excerpts. Summaries are ScoutPath's own words.${block.meta.note ? ` ${block.meta.note}` : ''}`,
        recordedBy: 'ScoutPath maintainers',
        recordedOn: RECORDED_ON,
        references: block.sources,
      },
      requirements: tree(block),
    };
    record.versions.push(version);
    record.currentVersion = versionId;
    if (kind === 'mb') {
      if (block.meta.desc) record.description = block.meta.desc;
      if (block.meta.safety) record.safety = { sensitive: true, reviewed: false, note: block.meta.safety };
      record.studySetIds = [...new Set([...(record.studySetIds as string[]), ...block.studies])];
      record.relatedResourceIds = [...new Set([...(record.relatedResourceIds as string[]), ...block.related])];
    }
    if (!check) writeFileSync(path, JSON.stringify(record, null, 2) + '\n');
    written++;
  }
}
console.log(`${check ? 'Would compile' : 'Compiled'} ${written} outline block(s) from ${files.length} file(s).`);

// Mappings: content-src/mappings.map is the source of truth for src/data/mappings.json.
const mapFile = join(SRC, 'mappings.map');
if (existsSync(mapFile)) {
  const mappings: { resourceId: string; requirementId: string; relevance: string }[] = [];
  readFileSync(mapFile, 'utf8')
    .split('\n')
    .forEach((raw, i) => {
      const line = raw.trim();
      if (!line || line.startsWith('#')) return;
      const [req, list] = line.split('|').map((x) => x.trim());
      if (!req || !list) throw new Error(`mappings.map:${i + 1}: expected "<requirementId> | <resource relevance>, ..."`);
      for (const item of list.split(',').map((x) => x.trim()).filter(Boolean)) {
        const [slug, relevance] = item.split(/\s+/);
        if (!['core', 'supporting', 'background'].includes(relevance)) throw new Error(`mappings.map:${i + 1}: bad relevance "${relevance}"`);
        mappings.push({ resourceId: `res.${slug}`, requirementId: req, relevance });
      }
    });
  if (!check) writeFileSync(join(DATA_DIR, 'mappings.json'), JSON.stringify({ schemaVersion: 1, mappings }, null, 2) + '\n');
  console.log(`${check ? 'Would write' : 'Wrote'} ${mappings.length} mappings.`);
}

// Catalog: a listing is confirmed when its official Merit Badge Hub page appeared in scouting.org
// results — either listed in confirmed-listings.txt or used as the primary source of an outline.
const confirmedFile = join(SRC, 'confirmed-listings.txt');
const confirmed = new Set<string>();
if (existsSync(confirmedFile)) {
  for (const raw of readFileSync(confirmedFile, 'utf8').split('\n')) {
    const line = raw.trim();
    if (line && !line.startsWith('#')) confirmed.add(line);
  }
}
for (const { blocks } of parsed) {
  for (const block of blocks) {
    const [kind, slug] = block.owner.split('.');
    if (kind === 'mb') confirmed.add(slug);
  }
}
const catalogPath = join(DATA_DIR, 'catalog.json');
const catalog = JSON.parse(readFileSync(catalogPath, 'utf8')) as { badges: { slug: string; catalogStatus: string; eagle: { verified: boolean }; pamphletUrl?: string }[] };
const known = new Set(catalog.badges.map((b) => b.slug));
const unknown = [...confirmed].filter((s) => !known.has(s));
if (unknown.length) throw new Error(`Confirmed or outlined badges missing from catalog.json: ${unknown.join(', ')}`);
// Pamphlets: content-src/pamphlets.map lists official pamphlet PDFs seen in scouting.org results.
const pamphletFile = join(SRC, 'pamphlets.map');
const hasPamphletMap = existsSync(pamphletFile);
const pamphlets = new Map<string, string>();
if (hasPamphletMap) {
  readFileSync(pamphletFile, 'utf8')
    .split('\n')
    .forEach((raw, i) => {
      const line = raw.trim();
      if (!line || line.startsWith('#')) return;
      const [slug, url] = line.split('|').map((x) => x.trim());
      if (!url || !/^https?:\/\//.test(url)) throw new Error(`pamphlets.map:${i + 1}: expected "<badge-slug> | <url>"`);
      if (!known.has(slug)) throw new Error(`pamphlets.map:${i + 1}: ${slug} is not in catalog.json`);
      pamphlets.set(slug, url);
    });
}
let marked = 0;
for (const b of catalog.badges) {
  // pamphlets.map is the source of truth: a badge dropped from it loses its stale pamphlet link.
  const pamphletUrl = pamphlets.get(b.slug);
  if (pamphletUrl) b.pamphletUrl = pamphletUrl;
  else if (hasPamphletMap) delete b.pamphletUrl;
  if (!confirmed.has(b.slug)) continue;
  b.catalogStatus = 'verified';
  b.eagle.verified = true;
  marked++;
}
if (!check) writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + '\n');
console.log(`${check ? 'Would mark' : 'Marked'} ${marked} of ${catalog.badges.length} catalog listings as confirmed.`);
