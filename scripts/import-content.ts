/**
 * Imports a reviewed content package into the dataset.
 *
 *   npm run content:import -- <package.json> [--dry-run] [--make-current]
 *
 * Package shapes:
 *   { "kind": "resources", "resources": [ ...resource records ] }
 *   { "kind": "mappings", "mappings": [ ...mapping records ] }
 *   { "kind": "requirement-version", "ownerId": "mb.first-aid", "version": { ...requirement version } }
 *
 * Safety rules:
 *   - Existing records are never overwritten. A resource or version whose ID already exists is rejected.
 *   - A new requirement version is appended next to earlier ones; earlier versions are preserved.
 *     It only becomes the current version with --make-current.
 *   - The whole dataset is re-validated with the change applied before anything is written.
 *   - This script reads local files only. It does not scrape or download anything.
 */
import { readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';
import { compareVersions, comparisonSummary } from '../src/features/content/compare.ts';
import { summarizeIssues, validateRaw } from '../src/features/content/validate.ts';
import { mapping, requirementVersion, resource } from '../src/schemas/content.ts';
import { DATA_DIR, loadRawContent, readJson } from './lib/load.ts';

const pkg = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('resources'), resources: z.array(resource).min(1) }),
  z.object({ kind: z.literal('mappings'), mappings: z.array(mapping).min(1) }),
  z.object({ kind: z.literal('requirement-version'), ownerId: z.string(), version: requirementVersion }),
]);

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith('--'));
const dryRun = args.includes('--dry-run');
const makeCurrent = args.includes('--make-current');
if (!file) {
  console.error('Usage: npm run content:import -- <package.json> [--dry-run] [--make-current]');
  process.exit(1);
}

const parsed = pkg.safeParse(readJson(file));
if (!parsed.success) {
  console.error(`Rejected: ${file} is not a valid content package.`);
  for (const issue of parsed.error.issues.slice(0, 20)) console.error(`  ${issue.path.join('.') || '(root)'}: ${issue.message}`);
  process.exit(1);
}

const raw = loadRawContent();
const writes: { path: string; data: unknown }[] = [];
const input = parsed.data;

if (input.kind === 'resources') {
  const current = raw.resources as { schemaVersion: 1; resources: { id: string }[] };
  const existing = new Set(current.resources.map((r) => r.id));
  const clashes = input.resources.filter((r) => existing.has(r.id)).map((r) => r.id);
  if (clashes.length) {
    console.error(`Rejected: these resource IDs already exist and will not be overwritten: ${clashes.join(', ')}`);
    process.exit(1);
  }
  const next = { ...current, resources: [...current.resources, ...input.resources] };
  raw.resources = next;
  writes.push({ path: join(DATA_DIR, 'resources.json'), data: next });
  console.log(`Adding ${input.resources.length} resource(s).`);
} else if (input.kind === 'mappings') {
  const current = raw.mappings as { schemaVersion: 1; mappings: { resourceId: string; requirementId: string }[] };
  const key = (m: { resourceId: string; requirementId: string }) => `${m.resourceId}|${m.requirementId}`;
  const existing = new Set(current.mappings.map(key));
  const fresh = input.mappings.filter((m) => !existing.has(key(m)));
  console.log(`Adding ${fresh.length} mapping(s); skipping ${input.mappings.length - fresh.length} that already exist.`);
  const next = { ...current, mappings: [...current.mappings, ...fresh] };
  raw.mappings = next;
  writes.push({ path: join(DATA_DIR, 'mappings.json'), data: next });
} else {
  const folder = input.ownerId.startsWith('rank.') ? 'ranks' : 'badges';
  const slug = input.ownerId.split('.')[1];
  const key = `${folder}/${slug}.json`;
  const files = readdirSync(join(DATA_DIR, folder));
  if (!files.includes(`${slug}.json`)) {
    console.error(`Rejected: no ${folder} file for ${input.ownerId}. Create the detail record first.`);
    process.exit(1);
  }
  const record = (folder === 'ranks' ? raw.ranks : raw.badgeDetails)[key] as { currentVersion: string | null; versions: z.infer<typeof requirementVersion>[] };
  if (record.versions.some((v) => v.versionId === input.version.versionId)) {
    console.error(`Rejected: version ${input.version.versionId} already exists for ${input.ownerId}. Versions are never replaced; use a new versionId.`);
    process.exit(1);
  }
  const previous = record.versions.find((v) => v.versionId === record.currentVersion);
  if (previous) console.log(`Compared with current version: ${comparisonSummary(compareVersions(previous, input.version))}`);
  const next = { ...record, versions: [...record.versions, input.version], currentVersion: makeCurrent ? input.version.versionId : record.currentVersion };
  (folder === 'ranks' ? raw.ranks : raw.badgeDetails)[key] = next;
  writes.push({ path: join(DATA_DIR, folder, `${slug}.json`), data: next });
  console.log(`Appending version ${input.version.versionId} to ${input.ownerId}${makeCurrent ? ' and making it current' : ' (current version unchanged; pass --make-current to switch)'}.`);
}

const { issues } = validateRaw(raw);
const summary = summarizeIssues(issues);
if (summary.errors > 0) {
  console.error(`Rejected: the dataset would have ${summary.errors} validation error(s):`);
  for (const issue of issues.filter((i) => i.severity === 'error').slice(0, 20)) console.error(`  [${issue.code}] ${issue.recordId ?? ''} ${issue.message}`);
  process.exit(1);
}
if (dryRun) {
  console.log('Dry run: validation passed; no files were written.');
} else {
  for (const w of writes) writeFileSync(w.path, JSON.stringify(w.data, null, 2) + '\n');
  console.log(`Wrote ${writes.map((w) => w.path.replace(DATA_DIR, 'src/data')).join(', ')}.`);
}
