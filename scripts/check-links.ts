/**
 * Checks resource and official-source links over the network.
 *
 *   npm run content:check-links              report only (reports/link-check.json)
 *   npm run content:check-links -- --write   also record linkStatus/lastChecked in resources.json
 *
 * Run this from a machine with normal internet access. A working link does
 * not mean the page is appropriate — content review is a separate human step.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildContent } from '../src/features/content/model.ts';
import { DATA_DIR, loadRawContent, REPORTS_DIR } from './lib/load.ts';

type Result = { url: string; status: 'ok' | 'redirected' | 'broken'; httpStatus: number | null; finalUrl: string | null; error?: string };

async function check(url: string): Promise<Result> {
  const attempt = async (method: 'HEAD' | 'GET') => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      return await fetch(url, { method, redirect: 'follow', signal: controller.signal, headers: { 'user-agent': 'ScoutPath link checker (+https://github.com/)' } });
    } finally {
      clearTimeout(timer);
    }
  };
  try {
    let res = await attempt('HEAD');
    if (res.status === 405 || res.status === 403) res = await attempt('GET');
    const redirected = res.redirected && res.url !== url;
    return { url, status: res.ok ? (redirected ? 'redirected' : 'ok') : 'broken', httpStatus: res.status, finalUrl: res.url };
  } catch (error) {
    return { url, status: 'broken', httpStatus: null, finalUrl: null, error: (error as Error).message };
  }
}

const write = process.argv.includes('--write');
const raw = loadRawContent();
const { content } = buildContent(raw);
const today = new Date().toISOString().slice(0, 10);
const targets = [
  ...content.resources.map((r) => ({ kind: 'resource', id: r.id, url: r.url })),
  ...content.badges.filter((b) => b.detail).map((b) => ({ kind: 'badge-official', id: b.id, url: b.officialUrl })),
  ...content.ranks.map((r) => ({ kind: 'rank-official', id: r.id, url: r.officialUrl })),
];

const results: (Result & { kind: string; id: string })[] = [];
for (const target of targets) {
  const result = await check(target.url);
  results.push({ ...result, kind: target.kind, id: target.id });
  console.log(`${result.status.padEnd(10)} ${String(result.httpStatus ?? '-').padEnd(4)} ${target.id}${result.error ? `  (${result.error})` : ''}`);
}

mkdirSync(REPORTS_DIR, { recursive: true });
writeFileSync(join(REPORTS_DIR, 'link-check.json'), JSON.stringify({ checkedOn: today, results }, null, 2) + '\n');
const broken = results.filter((r) => r.status === 'broken').length;
console.log(`\nChecked ${results.length} links: ${results.length - broken} reachable, ${broken} broken or unreachable. Report: reports/link-check.json`);

if (write) {
  const file = raw.resources as { schemaVersion: 1; resources: { id: string; linkStatus: string; lastChecked: string | null }[] };
  for (const r of file.resources) {
    const result = results.find((x) => x.kind === 'resource' && x.id === r.id);
    if (!result) continue;
    r.linkStatus = result.status;
    r.lastChecked = today;
  }
  writeFileSync(join(DATA_DIR, 'resources.json'), JSON.stringify(file, null, 2) + '\n');
  console.log('Updated linkStatus and lastChecked in src/data/resources.json. Content review is still required separately.');
}
