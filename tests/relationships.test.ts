import { describe, expect, it } from 'vitest';
import { content } from '../src/features/content/data';
import { badgeCoverage, coverageReport } from '../src/features/content/coverage';
import { buildContent, findRequirement, leafIdsUnder, leafRequirementIds } from '../src/features/content/model';
import { badgeFile, fixtureRaw } from './fixtures';

describe('requirement–resource relationships', () => {
  it('maps many resources to one requirement and one resource to many requirements', () => {
    const { content: c } = buildContent(fixtureRaw());
    expect(c.resourcesByRequirement.get('mb.knots.2a')?.map((m) => m.resource.id)).toEqual(['res.b', 'res.a']);
    expect(c.requirementsByResource.get('res.a')?.map((m) => m.node.id).sort()).toEqual(['mb.knots.1', 'mb.knots.2a']);
  });

  it('orders resources core first', () => {
    const { content: c } = buildContent(fixtureRaw());
    expect(c.resourcesByRequirement.get('mb.knots.2a')?.[0].mapping.relevance).toBe('core');
  });

  it('flattens nested requirements with parent links and leaves', () => {
    const { content: c } = buildContent(fixtureRaw());
    expect(leafRequirementIds(c, 'mb.knots')).toEqual(['mb.knots.1', 'mb.knots.2a', 'mb.knots.2b']);
    expect(leafIdsUnder(c, 'mb.knots.2')).toEqual(['mb.knots.2a', 'mb.knots.2b']);
    expect(c.requirements.get('mb.knots.2b')?.parentId).toBe('mb.knots.2');
    expect(c.requirements.get('mb.knots.2a')?.path).toBe('/merit-badges/knots/requirements/2a');
  });

  it('finds requirements case-insensitively and returns null for unknown records', () => {
    const { content: c } = buildContent(fixtureRaw());
    expect(findRequirement(c, 'badge', 'knots', '2A')?.id).toBe('mb.knots.2a');
    expect(findRequirement(c, 'badge', 'knots', '99')).toBeNull();
    expect(findRequirement(c, 'badge', 'nope', '1')).toBeNull();
    expect(findRequirement(c, 'rank', 'knots', '1')).toBeNull();
  });

  it('every study item in the shipped data cites an existing resource', () => {
    for (const set of content.studySets) {
      const ids = [...set.flashcards, ...set.quiz, ...set.guide.sections, ...set.guide.vocabulary].flatMap((x) => x.sourceResourceIds);
      for (const id of ids) expect(content.resourceById.has(id), `${set.id} cites ${id}`).toBe(true);
    }
  });

  it('every shipped mapping points at real records', () => {
    for (const m of content.mappings) {
      expect(content.resourceById.has(m.resourceId)).toBe(true);
      expect(content.requirements.has(m.requirementId)).toBe(true);
    }
  });
});

describe('coverage', () => {
  it('never rates shipped content as verified while it is unverified', () => {
    const report = coverageReport(content);
    expect(report.totals.badgesByRating.verified).toBe(0);
    expect(report.totals.badgesListed).toBe(content.badges.length);
    expect(report.badges.find((b) => b.slug === 'rowing')?.rating ?? 'missing').toBe('missing');
  });

  it('rates a fully checked badge as verified and an unmapped one as incomplete', () => {
    const raw = fixtureRaw();
    const v = badgeFile(raw).versions[0];
    v.status = 'verified';
    (v as Record<string, unknown>).sourceCheckedOn = '2026-01-02';
    const res = (raw.resources as { resources: Record<string, unknown>[] }).resources;
    res.forEach((r) => Object.assign(r, { linkStatus: 'ok', lastChecked: '2026-01-02' }));
    (raw.mappings as { mappings: unknown[] }).mappings.push({ resourceId: 'res.b', requirementId: 'mb.knots.2b', relevance: 'core' });
    const { content: c } = buildContent(raw);
    expect(badgeCoverage(c, 'mb.knots')?.rating).toBe('verified');

    (raw.mappings as { mappings: unknown[] }).mappings.pop();
    const { content: c2 } = buildContent(raw);
    const cov = badgeCoverage(c2, 'mb.knots')!;
    expect(cov.criteria.resourcesExist).toBe(false);
    expect(cov.rating).toBe('partially-verified');
  });

  it('lists requirements without resources and resources without requirements', () => {
    const raw = fixtureRaw();
    (raw.resources as { resources: unknown[] }).resources.push({ ...(raw.resources as { resources: Record<string, unknown>[] }).resources[0], id: 'res.orphan' });
    const report = coverageReport(buildContent(raw).content);
    expect(report.requirementsWithoutResources.map((r) => r.id)).toEqual(['mb.knots.2b']);
    expect(report.resourcesWithoutRequirements.map((r) => r.id)).toEqual(['res.orphan']);
  });
});
