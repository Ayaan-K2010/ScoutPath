/**
 * Compares two requirement versions and lists additions, removals,
 * modifications and renumbered requirements.
 *
 *   npm run content:compare -- --list
 *   npm run content:compare -- <ownerId> <fromVersionId> <toVersionId>
 *   npm run content:compare -- --files <from.json> <to.json>   (each file holds one requirement version)
 */
import { compareVersions, comparisonSummary, type VersionComparison } from '../src/features/content/compare.ts';
import { buildContent } from '../src/features/content/model.ts';
import { requirementVersion, type RequirementVersion } from '../src/schemas/content.ts';
import { loadRawContent, readJson } from './lib/load.ts';

function print(c: VersionComparison) {
  console.log(`Comparing ${c.from} → ${c.to}: ${comparisonSummary(c)}\n`);
  for (const r of c.added) console.log(`  + added       ${r.number.padEnd(5)} ${r.title}`);
  for (const r of c.removed) console.log(`  - removed     ${r.number.padEnd(5)} ${r.title}`);
  for (const r of c.renumbered) console.log(`  ~ renumbered  ${r.before.number} → ${r.after.number}  ${r.after.title}`);
  for (const r of c.modified) {
    console.log(`  * modified    ${r.after.number.padEnd(5)} ${r.after.title}`);
    for (const ch of r.changes) console.log(`      ${ch.field}: "${ch.before}" → "${ch.after}"`);
  }
}

const args = process.argv.slice(2);
if (args[0] === '--files' && args.length === 3) {
  const parse = (p: string): RequirementVersion => {
    const result = requirementVersion.safeParse(readJson(p));
    if (!result.success) {
      console.error(`${p} is not a valid requirement version:\n${result.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n')}`);
      process.exit(1);
    }
    return result.data;
  };
  print(compareVersions(parse(args[1]), parse(args[2])));
} else {
  const { content } = buildContent(loadRawContent());
  const owners = [
    ...content.badges.filter((b) => b.detail).map((b) => ({ id: b.id, versions: b.detail!.versions })),
    ...content.ranks.map((r) => ({ id: r.id, versions: r.versions })),
  ];
  if (args[0] === '--list' || args.length === 0) {
    for (const o of owners) console.log(`${o.id.padEnd(34)} ${o.versions.map((v) => `${v.versionId} (${v.status})`).join(', ') || '(no versions)'}`);
    if (args.length === 0) console.log('\nUsage: npm run content:compare -- <ownerId> <fromVersionId> <toVersionId>');
  } else if (args.length === 3) {
    const owner = owners.find((o) => o.id === args[0]);
    const from = owner?.versions.find((v) => v.versionId === args[1]);
    const to = owner?.versions.find((v) => v.versionId === args[2]);
    if (!owner || !from || !to) {
      console.error('Owner or version not found. Run with --list to see stored versions.');
      process.exit(1);
    }
    print(compareVersions(from, to));
  } else {
    console.error('Usage: npm run content:compare -- <ownerId> <fromVersionId> <toVersionId>');
    process.exit(1);
  }
}
