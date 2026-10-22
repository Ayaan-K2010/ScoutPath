/**
 * Browser-side content loading. JSON is bundled at build time, so the app
 * works offline and needs no API or database.
 */
import meta from '../../data/meta.json';
import categories from '../../data/categories.json';
import catalog from '../../data/catalog.json';
import resources from '../../data/resources.json';
import mappings from '../../data/mappings.json';
import study from '../../data/study.json';
import templates from '../../data/collection-templates.json';
import { buildContent, type RawContent } from './model';

const badgeFiles = import.meta.glob('../../data/badges/*.json', { eager: true, import: 'default' });
const rankFiles = import.meta.glob('../../data/ranks/*.json', { eager: true, import: 'default' });

const strip = (files: Record<string, unknown>, folder: string) =>
  Object.fromEntries(Object.entries(files).map(([path, value]) => [`${folder}/${path.split('/').pop()}`, value]));

export const rawContent: RawContent = {
  meta,
  categories,
  catalog,
  badgeDetails: strip(badgeFiles, 'badges'),
  ranks: strip(rankFiles, 'ranks'),
  resources,
  mappings,
  study,
  templates,
};

const built = buildContent(rawContent);

export const content = built.content;
export const loadIssues = built.issues;
