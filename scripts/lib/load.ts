/** Reads the content dataset from disk for the command-line scripts. */
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { RawContent } from '../../src/features/content/model.ts';

export const DATA_DIR = resolve(import.meta.dirname, '../../src/data');
export const REPORTS_DIR = resolve(import.meta.dirname, '../../reports');

export function readJson(path: string): unknown {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    throw new Error(`Could not read ${path}: ${(error as Error).message}`, { cause: error });
  }
}

function readFolder(dir: string, label: string): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const file of readdirSync(join(DATA_DIR, dir)).filter((f) => f.endsWith('.json')).sort()) {
    out[`${label}/${file}`] = readJson(join(DATA_DIR, dir, file));
  }
  return out;
}

export function loadRawContent(): RawContent {
  return {
    meta: readJson(join(DATA_DIR, 'meta.json')),
    categories: readJson(join(DATA_DIR, 'categories.json')),
    catalog: readJson(join(DATA_DIR, 'catalog.json')),
    badgeDetails: readFolder('badges', 'badges'),
    ranks: readFolder('ranks', 'ranks'),
    resources: readJson(join(DATA_DIR, 'resources.json')),
    mappings: readJson(join(DATA_DIR, 'mappings.json')),
    study: readJson(join(DATA_DIR, 'study.json')),
    templates: readJson(join(DATA_DIR, 'collection-templates.json')),
  };
}
