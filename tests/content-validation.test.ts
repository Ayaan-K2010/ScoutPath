import { describe, expect, it } from 'vitest';
import { rawContent } from '../src/features/content/data';
import { validateRaw } from '../src/features/content/validate';
import { badgeFile, fixtureRaw, resource } from './fixtures';

const errorCodes = (raw: ReturnType<typeof fixtureRaw>) =>
  validateRaw(raw)
    .issues.filter((i) => i.severity === 'error')
    .map((i) => i.code);

describe('content validation', () => {
  it('the shipped dataset has no validation errors', () => {
    const { issues } = validateRaw(rawContent);
    expect(issues.filter((i) => i.severity === 'error')).toEqual([]);
  });

  it('accepts the valid fixture', () => {
    expect(errorCodes(fixtureRaw())).toEqual([]);
  });

  it('reports missing required fields', () => {
    const raw = fixtureRaw();
    const list = (raw.resources as { resources: Record<string, unknown>[] }).resources;
    delete list[0].publisher;
    expect(errorCodes(raw)).toContain('schema');
  });

  it('detects duplicate resource IDs', () => {
    const raw = fixtureRaw();
    (raw.resources as { resources: unknown[] }).resources.push(resource('res.a'));
    expect(errorCodes(raw)).toContain('duplicate-id');
  });

  it('rejects invalid and non-http URLs', () => {
    for (const url of ['not a url', 'javascript:alert(1)', '/relative/path']) {
      const raw = fixtureRaw();
      (raw.resources as { resources: Record<string, unknown>[] }).resources[1].url = url;
      const { issues } = validateRaw(raw);
      expect(issues.some((i) => i.code === 'schema' && i.message.includes('http'))).toBe(true);
    }
  });

  it('rejects invalid dates', () => {
    const raw = fixtureRaw();
    (raw.resources as { resources: Record<string, unknown>[] }).resources[0].lastChecked = '2026-02-30';
    (raw.resources as { resources: Record<string, unknown>[] }).resources[0].linkStatus = 'ok';
    expect(validateRaw(raw).issues.some((i) => i.message.includes('calendar'))).toBe(true);
  });

  it('rejects invalid statuses', () => {
    const raw = fixtureRaw();
    (raw.resources as { resources: Record<string, unknown>[] }).resources[0].verification = 'probably-fine';
    expect(errorCodes(raw)).toContain('schema');
  });

  it('reports mappings to missing resources and requirements', () => {
    const raw = fixtureRaw();
    const m = (raw.mappings as { mappings: Record<string, string>[] }).mappings;
    m.push({ resourceId: 'res.ghost', requirementId: 'mb.knots.1', relevance: 'core' });
    m.push({ resourceId: 'res.a', requirementId: 'mb.knots.9', relevance: 'core' });
    const codes = errorCodes(raw);
    expect(codes).toContain('missing-resource');
    expect(codes).toContain('missing-requirement');
  });

  it('detects duplicate mappings', () => {
    const raw = fixtureRaw();
    (raw.mappings as { mappings: unknown[] }).mappings.push({ resourceId: 'res.a', requirementId: 'mb.knots.1', relevance: 'background' });
    expect(errorCodes(raw)).toContain('duplicate-mapping');
  });

  it('detects malformed nested requirements', () => {
    const raw = fixtureRaw();
    const req = badgeFile(raw).versions[0].requirements[1] as { children: { number: string; id: string }[] };
    req.children[1].number = '3b';
    req.children[1].id = 'mb.knots.3b';
    expect(errorCodes(raw)).toContain('malformed-requirement');
  });

  it('rejects a two-digit requirement nested under a one-digit one ("10" under "1")', () => {
    const raw = fixtureRaw();
    const first = badgeFile(raw).versions[0].requirements[0] as { children: unknown[] };
    first.children.push({ id: 'mb.knots.10', number: '10', title: 'Tenth', summary: 'A top-level requirement.', kind: 'knowledge', children: [] });
    expect(errorCodes(raw)).toContain('malformed-requirement');
  });

  it('detects requirement IDs that do not match their number', () => {
    const raw = fixtureRaw();
    (badgeFile(raw).versions[0].requirements[0] as { id: string }).id = 'mb.knots.7';
    expect(errorCodes(raw)).toContain('malformed-requirement');
  });

  it('rejects stored official wording when the version is link-only', () => {
    const raw = fixtureRaw();
    (badgeFile(raw).versions[0].requirements[0] as Record<string, unknown>).officialText = 'Copied official text';
    expect(validateRaw(raw).issues.some((i) => i.message.includes('link-only'))).toBe(true);
  });

  it('requires provenance and version information', () => {
    const raw = fixtureRaw();
    delete (badgeFile(raw).versions[0] as Record<string, unknown>).provenance;
    expect(errorCodes(raw)).toContain('schema');
    const raw2 = fixtureRaw();
    delete (badgeFile(raw2).versions[0] as Record<string, unknown>).versionId;
    expect(errorCodes(raw2)).toContain('schema');
  });

  it('requires a check date before a version can be marked verified', () => {
    const raw = fixtureRaw();
    badgeFile(raw).versions[0].status = 'verified';
    expect(validateRaw(raw).issues.some((i) => i.message.includes('verified version must record'))).toBe(true);
  });

  it('flags a currentVersion that is not stored and a superseded version that was dropped', () => {
    const raw = fixtureRaw();
    badgeFile(raw).currentVersion = 'v9';
    expect(errorCodes(raw)).toContain('missing-version');
    const raw2 = fixtureRaw();
    (badgeFile(raw2).versions[0] as Record<string, unknown>).supersedes = 'v0';
    expect(errorCodes(raw2)).toContain('missing-version');
  });

  it('keeps valid records when one record is invalid', () => {
    const raw = fixtureRaw();
    (raw.resources as { resources: Record<string, unknown>[] }).resources[1].url = 'nope';
    const { content } = validateRaw(raw);
    expect(content.resources.map((r) => r.id)).toEqual(['res.a']);
  });

  it('reports gaps as informational, not errors', () => {
    const { issues } = validateRaw(fixtureRaw());
    expect(issues.some((i) => i.code === 'requirement-without-resources' && i.severity === 'info' && i.recordId === 'mb.knots.2b')).toBe(true);
  });
});
