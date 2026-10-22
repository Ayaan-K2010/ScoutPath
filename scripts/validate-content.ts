/**
 * Validates every content file: schemas, duplicate IDs, dangling references,
 * malformed requirement trees, duplicate mappings, invalid URLs and dates.
 *
 *   npm run content:validate             errors fail the run
 *   npm run content:validate -- --verbose  also list informational gaps
 */
import { validateRaw, summarizeIssues } from '../src/features/content/validate.ts';
import { loadRawContent } from './lib/load.ts';

const verbose = process.argv.includes('--verbose');
const { issues } = validateRaw(loadRawContent());
const summary = summarizeIssues(issues);

for (const issue of issues) {
  if (issue.severity === 'info' && !verbose) continue;
  const where = [issue.file, issue.recordId].filter(Boolean).join(' › ');
  console.log(`${issue.severity.toUpperCase().padEnd(7)} [${issue.code}] ${where ? `${where}: ` : ''}${issue.message}`);
}
console.log(`\nContent validation: ${summary.errors} error(s), ${summary.warnings} warning(s), ${summary.info} informational note(s)${verbose ? '' : ' (use --verbose to list them)'}.`);
if (summary.errors > 0) process.exit(1);
