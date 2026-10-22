/**
 * Local content review tool.
 *
 * This is a maintainer convenience, not an administration system: it has no
 * server, no authentication and no write endpoint. It edits a draft copy of
 * the bundled dataset in this browser and exports changed JSON files, which a
 * maintainer reviews and commits to the repository.
 */
import { Download, ExternalLink as ExternalIcon, RotateCcw, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { Callout } from '../components/Callout';
import { PageHeader } from '../components/PageHeader';
import { RESOURCE_TYPE_LABELS } from '../lib/labels';
import { compareVersions, comparisonSummary } from '../features/content/compare';
import { coverageReport } from '../features/content/coverage';
import { rawContent } from '../features/content/data';
import { buildContent, type RawContent } from '../features/content/model';
import { summarizeIssues, validateRaw } from '../features/content/validate';
import { useDocumentTitle } from '../hooks/usePageMeta';
import { downloadText } from '../lib/download';
import { todayKey } from '../features/progress/actions';
import type { Mapping, Requirement, RequirementVersion, Resource } from '../schemas/content';
import { linkStatus, requirementKind, resourceType, reviewStatus, verificationStatus } from '../schemas/content';

const DRAFT_KEY = 'scoutpath:review-draft:v1';
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

function loadDraft(): RawContent {
  try {
    const stored = localStorage.getItem(DRAFT_KEY);
    if (stored) return JSON.parse(stored) as RawContent;
  } catch {
    /* fall through to the published dataset */
  }
  return clone(rawContent);
}

type FileKey = { label: string; get: (r: RawContent) => unknown };

function changedFiles(draft: RawContent): FileKey[] {
  const files: FileKey[] = [
    { label: 'src/data/resources.json', get: (r) => r.resources },
    { label: 'src/data/mappings.json', get: (r) => r.mappings },
    { label: 'src/data/catalog.json', get: (r) => r.catalog },
    { label: 'src/data/study.json', get: (r) => r.study },
    ...Object.keys(rawContent.badgeDetails).map((k) => ({ label: `src/data/${k}`, get: (r: RawContent) => r.badgeDetails[k] })),
    ...Object.keys(rawContent.ranks).map((k) => ({ label: `src/data/${k}`, get: (r: RawContent) => r.ranks[k] })),
  ];
  return files.filter((f) => JSON.stringify(f.get(draft)) !== JSON.stringify(f.get(rawContent)));
}

function updateRequirement(items: Requirement[], id: string, patch: Partial<Requirement>): Requirement[] {
  return items.map((r) => (r.id === id ? { ...r, ...patch } : { ...r, children: updateRequirement(r.children, id, patch) }));
}

function flatten(items: Requirement[]): Requirement[] {
  return items.flatMap((r) => [r, ...flatten(r.children)]);
}

const TABS = ['Validation', 'Resources & links', 'Requirements', 'Versions', 'Export'] as const;
type Tab = (typeof TABS)[number];

function ResourceEditor({ draft, setDraft }: { draft: RawContent; setDraft: (d: RawContent) => void }) {
  const resources = (draft.resources as { resources: Resource[] }).resources;
  const mappings = (draft.mappings as { mappings: Mapping[] }).mappings;
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(resources[0]?.id ?? '');
  const [newReq, setNewReq] = useState('');
  const [newRelevance, setNewRelevance] = useState<Mapping['relevance']>('supporting');
  const { content } = useMemo(() => buildContent(draft), [draft]);
  const selected = resources.find((r) => r.id === selectedId);
  const filtered = resources.filter((r) => `${r.title} ${r.publisher} ${r.id}`.toLowerCase().includes(query.toLowerCase()));

  const patch = (p: Partial<Resource>) => {
    const next = clone(draft);
    const list = (next.resources as { resources: Resource[] }).resources;
    const i = list.findIndex((r) => r.id === selectedId);
    list[i] = { ...list[i], ...p };
    setDraft(next);
  };
  const setMappings = (m: Mapping[]) => {
    const next = clone(draft);
    (next.mappings as { mappings: Mapping[] }).mappings = m;
    setDraft(next);
  };

  return (
    <div className="with-sidebar">
      <div className="stack">
        <label htmlFor="rv-q" className="sr-only">
          Search resources
        </label>
        <input id="rv-q" className="input" placeholder="Search resources" value={query} onChange={(e) => setQuery(e.target.value)} />
        <ul className="plain-list" style={{ maxHeight: '32rem', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', background: 'var(--paper)' }}>
          {filtered.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => setSelectedId(r.id)}
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: 'var(--s-2) var(--s-3)', border: 0, borderBottom: '1px solid var(--border)', background: r.id === selectedId ? 'var(--sage-pale)' : 'transparent', fontSize: 'var(--fs-xs)' }}
              >
                <strong style={{ display: 'block' }}>{r.title}</strong>
                <span className="muted">
                  {r.linkStatus} · {r.verification}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      {selected ? (
        <div className="review-editor">
          <div className="button-row">
            <a href={selected.url} target="_blank" rel="noopener noreferrer" className="btn btn--sm">
              <ExternalIcon size={14} aria-hidden="true" /> Open link to review
            </a>
            <button type="button" className="btn btn--sm" onClick={() => patch({ linkStatus: 'ok', lastChecked: todayKey() })}>
              Mark link working today
            </button>
            <button type="button" className="btn btn--sm btn--danger" onClick={() => patch({ linkStatus: 'broken', lastChecked: todayKey() })}>
              Mark link broken
            </button>
            <button type="button" className="btn btn--sm" onClick={() => patch({ verification: 'verified', contentReviewedOn: todayKey() })}>
              Mark content reviewed today
            </button>
          </div>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="rv-title">Title</label>
              <input id="rv-title" className="input" value={selected.title} onChange={(e) => patch({ title: e.target.value })} />
            </div>
            <div className="field">
              <label htmlFor="rv-url">URL</label>
              <input id="rv-url" className="input" value={selected.url} onChange={(e) => patch({ url: e.target.value })} />
            </div>
            <div className="field">
              <label htmlFor="rv-pub">Publisher</label>
              <input id="rv-pub" className="input" value={selected.publisher} onChange={(e) => patch({ publisher: e.target.value })} />
            </div>
            <div className="field">
              <label htmlFor="rv-type">Type</label>
              <select id="rv-type" className="select" value={selected.type} onChange={(e) => patch({ type: e.target.value as Resource['type'] })}>
                {resourceType.options.map((t) => (
                  <option key={t} value={t}>
                    {RESOURCE_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="rv-link">Link status</label>
              <select id="rv-link" className="select" value={selected.linkStatus} onChange={(e) => patch({ linkStatus: e.target.value as Resource['linkStatus'] })}>
                {linkStatus.options.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="rv-checked">Last checked</label>
              <input id="rv-checked" type="date" className="input" value={selected.lastChecked ?? ''} onChange={(e) => patch({ lastChecked: e.target.value || null })} />
            </div>
            <div className="field">
              <label htmlFor="rv-ver">Content verification</label>
              <select id="rv-ver" className="select" value={selected.verification} onChange={(e) => patch({ verification: e.target.value as Resource['verification'] })}>
                {verificationStatus.options.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="rv-safety">Safety review</label>
              <select id="rv-safety" className="select" value={selected.safetyReview} onChange={(e) => patch({ safetyReview: e.target.value as Resource['safetyReview'] })}>
                {reviewStatus.options.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="rv-dur">Duration (minutes, verified only)</label>
              <input
                id="rv-dur"
                type="number"
                className="input"
                value={selected.durationMinutes ?? ''}
                onChange={(e) => patch({ durationMinutes: e.target.value ? Number(e.target.value) : null, durationVerified: Boolean(e.target.value) })}
              />
            </div>
          </div>
          <div className="field">
            <label htmlFor="rv-desc">Original description</label>
            <textarea id="rv-desc" className="textarea" value={selected.description} onChange={(e) => patch({ description: e.target.value })} />
          </div>
          <div className="field">
            <label htmlFor="rv-topics">Topics (comma separated)</label>
            <input id="rv-topics" className="input" value={selected.topics.join(', ')} onChange={(e) => patch({ topics: e.target.value.split(',').map((t) => t.trim()).filter(Boolean) })} />
          </div>
          <div className="field">
            <label htmlFor="rv-notes">Reviewer notes</label>
            <textarea id="rv-notes" className="textarea" value={selected.notes ?? ''} onChange={(e) => patch({ notes: e.target.value || undefined })} />
          </div>
          <section aria-labelledby="map-title">
            <h3 id="map-title" className="mini-heading">
              Requirement mapping
            </h3>
            <ul className="plain-list small">
              {mappings
                .filter((m) => m.resourceId === selected.id)
                .map((m) => (
                  <li key={m.requirementId} style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--s-3)', padding: 'var(--s-2) 0', borderBottom: '1px solid var(--border)' }}>
                    <span>
                      <code>{m.requirementId}</code> · {m.relevance}
                    </span>
                    <button type="button" className="icon-button" aria-label={`Remove mapping to ${m.requirementId}`} onClick={() => setMappings(mappings.filter((x) => !(x.resourceId === m.resourceId && x.requirementId === m.requirementId)))}>
                      <Trash2 size={15} />
                    </button>
                  </li>
                ))}
            </ul>
            <div className="button-row" style={{ marginTop: 'var(--s-3)' }}>
              <label htmlFor="rv-newreq" className="sr-only">
                Requirement to map
              </label>
              <select id="rv-newreq" className="select" style={{ maxWidth: '22rem' }} value={newReq} onChange={(e) => setNewReq(e.target.value)}>
                <option value="">Map to a requirement…</option>
                {[...content.requirements.values()].map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.ownerName} {n.requirement.number} · {n.requirement.title}
                  </option>
                ))}
              </select>
              <label htmlFor="rv-rel" className="sr-only">
                Relevance
              </label>
              <select id="rv-rel" className="select" style={{ width: 'auto' }} value={newRelevance} onChange={(e) => setNewRelevance(e.target.value as Mapping['relevance'])}>
                <option value="core">core</option>
                <option value="supporting">supporting</option>
                <option value="background">background</option>
              </select>
              <button
                type="button"
                className="btn btn--sm"
                disabled={!newReq || mappings.some((m) => m.resourceId === selected.id && m.requirementId === newReq)}
                onClick={() => {
                  setMappings([...mappings, { resourceId: selected.id, requirementId: newReq, relevance: newRelevance }]);
                  setNewReq('');
                }}
              >
                Add mapping
              </button>
            </div>
          </section>
        </div>
      ) : (
        <p className="muted">Select a resource.</p>
      )}
    </div>
  );
}

function RequirementEditor({ draft, setDraft }: { draft: RawContent; setDraft: (d: RawContent) => void }) {
  const owners = [...Object.keys(draft.badgeDetails), ...Object.keys(draft.ranks)];
  const [ownerKey, setOwnerKey] = useState(owners[0] ?? '');
  const isRank = ownerKey.startsWith('ranks/');
  const record = (isRank ? draft.ranks[ownerKey] : draft.badgeDetails[ownerKey]) as { currentVersion: string | null; versions: RequirementVersion[] } | undefined;
  const version = record?.versions.find((v) => v.versionId === record.currentVersion);
  const reqs = version ? flatten(version.requirements) : [];
  const [reqId, setReqId] = useState('');
  const req = reqs.find((r) => r.id === reqId) ?? reqs[0];

  const write = (fn: (v: RequirementVersion) => RequirementVersion) => {
    const next = clone(draft);
    const rec = (isRank ? next.ranks[ownerKey] : next.badgeDetails[ownerKey]) as { currentVersion: string; versions: RequirementVersion[] };
    rec.versions = rec.versions.map((v) => (v.versionId === rec.currentVersion ? fn(v) : v));
    setDraft(next);
  };

  return (
    <div className="stack-lg">
      <div className="form-grid">
        <div className="field">
          <label htmlFor="rq-owner">Badge or rank file</label>
          <select
            id="rq-owner"
            className="select"
            value={ownerKey}
            onChange={(e) => {
              setOwnerKey(e.target.value);
              setReqId('');
            }}
          >
            {owners.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </div>
        {version && (
          <div className="field">
            <label htmlFor="rq-req">Requirement</label>
            <select id="rq-req" className="select" value={req?.id ?? ''} onChange={(e) => setReqId(e.target.value)}>
              {reqs.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.number} · {r.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      {!version ? (
        <p className="muted">This file has no current requirement version. Add one with <code>npm run content:import</code>.</p>
      ) : (
        <>
          <section className="panel">
            <h3 className="panel__title">Version metadata — {version.versionId}</h3>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="rq-status">Verification status</label>
                <select id="rq-status" className="select" value={version.status} onChange={(e) => write((v) => ({ ...v, status: e.target.value as RequirementVersion['status'] }))}>
                  {verificationStatus.options.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="rq-complete">Completeness</label>
                <select id="rq-complete" className="select" value={version.completeness} onChange={(e) => write((v) => ({ ...v, completeness: e.target.value as RequirementVersion['completeness'] }))}>
                  <option>complete</option>
                  <option>partial</option>
                  <option>outline-only</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="rq-checked">Source checked on</label>
                <input id="rq-checked" type="date" className="input" value={version.sourceCheckedOn ?? ''} onChange={(e) => write((v) => ({ ...v, sourceCheckedOn: e.target.value || null }))} />
              </div>
              <div className="field">
                <label htmlFor="rq-effective">Effective date</label>
                <input id="rq-effective" type="date" className="input" value={version.effectiveDate ?? ''} onChange={(e) => write((v) => ({ ...v, effectiveDate: e.target.value || null }))} />
              </div>
            </div>
          </section>
          {req && (
            <section className="panel review-editor">
              <h3 className="panel__title">
                Requirement <code>{req.id}</code>
              </h3>
              <div className="form-grid">
                <div className="field">
                  <label htmlFor="rq-title">Title</label>
                  <input id="rq-title" className="input" value={req.title} onChange={(e) => write((v) => ({ ...v, requirements: updateRequirement(v.requirements, req.id, { title: e.target.value }) }))} />
                </div>
                <div className="field">
                  <label htmlFor="rq-kind">Kind</label>
                  <select id="rq-kind" className="select" value={req.kind} onChange={(e) => write((v) => ({ ...v, requirements: updateRequirement(v.requirements, req.id, { kind: e.target.value as Requirement['kind'] }) }))}>
                    {requirementKind.options.map((k) => (
                      <option key={k}>{k}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="field">
                <label htmlFor="rq-summary">Summary (original wording, not official text)</label>
                <textarea id="rq-summary" className="textarea" value={req.summary} onChange={(e) => write((v) => ({ ...v, requirements: updateRequirement(v.requirements, req.id, { summary: e.target.value }) }))} />
              </div>
              <div className="field">
                <label htmlFor="rq-orientation">Orientation</label>
                <textarea
                  id="rq-orientation"
                  className="textarea"
                  value={req.orientation ?? ''}
                  onChange={(e) => write((v) => ({ ...v, requirements: updateRequirement(v.requirements, req.id, { orientation: e.target.value || undefined }) }))}
                />
              </div>
              <div className="field">
                <label htmlFor="rq-note">Note</label>
                <input id="rq-note" className="input" value={req.note ?? ''} onChange={(e) => write((v) => ({ ...v, requirements: updateRequirement(v.requirements, req.id, { note: e.target.value || undefined }) }))} />
              </div>
              <p className="field__hint">
                Official wording may only be added when the version’s wording policy is “reproduced-with-permission”; the validator rejects it otherwise.
              </p>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function VersionCompare({ draft }: { draft: RawContent }) {
  const owners = [...Object.keys(draft.badgeDetails), ...Object.keys(draft.ranks)];
  const [ownerKey, setOwnerKey] = useState(owners[0] ?? '');
  const pick = (r: RawContent) => ((ownerKey.startsWith('ranks/') ? r.ranks[ownerKey] : r.badgeDetails[ownerKey]) as { versions: RequirementVersion[] } | undefined)?.versions ?? [];
  const published = pick(rawContent);
  const drafted = pick(draft);
  const options = [...published.map((v) => ({ key: `published:${v.versionId}`, v, label: `${v.versionId} (published)` })), ...drafted.map((v) => ({ key: `draft:${v.versionId}`, v, label: `${v.versionId} (draft)` }))];
  const [fromKey, setFromKey] = useState('');
  const [toKey, setToKey] = useState('');
  const from = options.find((o) => o.key === fromKey) ?? options[0];
  const to = options.find((o) => o.key === toKey) ?? options[options.length - 1];
  const result = from && to ? compareVersions(from.v, to.v) : null;

  return (
    <div className="stack-lg">
      <p className="small muted">
        Compare stored requirement versions, or the published version with your draft edits. New official versions are added beside old ones with{' '}
        <code>npm run content:import</code>; earlier versions are never replaced.
      </p>
      <div className="form-grid">
        <div className="field">
          <label htmlFor="vc-owner">File</label>
          <select
            id="vc-owner"
            className="select"
            value={ownerKey}
            onChange={(e) => {
              setOwnerKey(e.target.value);
              setFromKey('');
              setToKey('');
            }}
          >
            {owners.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="vc-from">From</label>
          <select id="vc-from" className="select" value={from?.key ?? ''} onChange={(e) => setFromKey(e.target.value)}>
            {options.map((o) => (
              <option key={o.key} value={o.key}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="vc-to">To</label>
          <select id="vc-to" className="select" value={to?.key ?? ''} onChange={(e) => setToKey(e.target.value)}>
            {options.map((o) => (
              <option key={o.key} value={o.key}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      {!result ? (
        <p className="muted">This file has no stored versions.</p>
      ) : (
        <>
          <p>
            <strong>{comparisonSummary(result)}</strong>
          </p>
          <ul className="diff-list">
            {result.added.map((r) => (
              <li key={`a-${r.id}`}>
                <span className="diff-kind diff-kind--added">Added</span>
                <span>
                  {r.number} · {r.title}
                </span>
              </li>
            ))}
            {result.removed.map((r) => (
              <li key={`r-${r.id}`}>
                <span className="diff-kind diff-kind--removed">Removed</span>
                <span>
                  {r.number} · {r.title}
                </span>
              </li>
            ))}
            {result.renumbered.map((r) => (
              <li key={`n-${r.before.id}`}>
                <span className="diff-kind diff-kind--renumbered">Renumbered</span>
                <span>
                  {r.before.number} → {r.after.number} · {r.after.title}
                </span>
              </li>
            ))}
            {result.modified.map((r) => (
              <li key={`m-${r.after.id}`}>
                <span className="diff-kind diff-kind--modified">Modified</span>
                <span>
                  {r.after.number} · {r.changes.map((c) => c.field).join(', ')} changed
                  {r.changes.map((c) => (
                    <span key={c.field} className="field__hint" style={{ display: 'block' }}>
                      {c.field}: “{c.before.slice(0, 80)}” → “{c.after.slice(0, 80)}”
                    </span>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export function ReviewPage() {
  useDocumentTitle('Content review tool');
  const [draft, setDraftState] = useState<RawContent>(loadDraft);
  const [tab, setTab] = useState<Tab>('Validation');
  const [severity, setSeverity] = useState<'error' | 'warning' | 'info'>('error');
  const setDraft = (d: RawContent) => setDraftState(d);

  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      /* the draft still works in memory */
    }
  }, [draft]);

  const { content, issues } = useMemo(() => validateRaw(draft), [draft]);
  const summary = summarizeIssues(issues);
  const report = useMemo(() => coverageReport(content), [content]);
  const changes = changedFiles(draft);

  return (
    <div className="container page">
      <PageHeader
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Content review' }]}
        title="Content review tool"
        lede="For maintainers: validate the dataset, review links, edit resource metadata and requirement mappings, compare versions, and export changed files."
      />
      <div className="stack-lg">
        <Callout tone="warn" title="Local-only tool — not a secure admin system">
          Edits here change a draft stored in this browser only. Nothing is published, and there is no server or login. To publish, export the changed files,
          review them, run <code>npm run content:validate</code> and commit them to the repository. Anyone can open this page, which is why it can only edit
          their own browser’s draft.
        </Callout>
        <div className="tabs" role="tablist" aria-label="Review sections">
          {TABS.map((t) => (
            <button key={t} type="button" role="tab" className="tab" aria-selected={tab === t} onClick={() => setTab(t)}>
              {t}
              {t === 'Export' && changes.length > 0 ? ` (${changes.length})` : ''}
              {t === 'Validation' && summary.errors > 0 ? ` (${summary.errors})` : ''}
            </button>
          ))}
        </div>

        {tab === 'Validation' && (
          <div className="stack-lg">
            <div className="stat-strip">
              <div className="stat">
                <div className="stat__value">{summary.errors}</div>
                <div className="stat__label">Errors</div>
              </div>
              <div className="stat">
                <div className="stat__value">{summary.warnings}</div>
                <div className="stat__label">Warnings</div>
              </div>
              <div className="stat">
                <div className="stat__value">{report.requirementsWithoutResources.length}</div>
                <div className="stat__label">Items missing resources</div>
              </div>
              <div className="stat">
                <div className="stat__value">{report.needsReview.length}</div>
                <div className="stat__label">Records needing review</div>
              </div>
            </div>
            <div className="view-toggle" role="group" aria-label="Severity">
              {(['error', 'warning', 'info'] as const).map((s) => (
                <button key={s} type="button" aria-pressed={severity === s} onClick={() => setSeverity(s)}>
                  {s === 'error' ? `Errors ${summary.errors}` : s === 'warning' ? `Warnings ${summary.warnings}` : `Info ${summary.info}`}
                </button>
              ))}
            </div>
            <ul className="issue-list">
              {issues
                .filter((i) => i.severity === severity)
                .map((i, n) => (
                  <li key={n}>
                    <span className={`tag ${i.severity === 'error' ? 'tag--alert' : i.severity === 'warning' ? 'tag--warn' : ''}`}>{i.code}</span>
                    <span>
                      {i.file && <code>{i.file} </code>}
                      {i.recordId && <code>{i.recordId} </code>}— {i.message}
                    </span>
                  </li>
                ))}
              {issues.filter((i) => i.severity === severity).length === 0 && <li className="muted">None.</li>}
            </ul>
            <section aria-labelledby="needs-title">
              <div className="section-head">
                <h2 id="needs-title">Records needing review</h2>
              </div>
              <ul className="plain-list small" style={{ columns: '22rem' }}>
                {report.needsReview.map((r, i) => (
                  <li key={i} style={{ breakInside: 'avoid', padding: '2px 0' }}>
                    <code>{r.id}</code> — {r.kind}: {r.reason}
                  </li>
                ))}
              </ul>
            </section>
          </div>
        )}
        {tab === 'Resources & links' && <ResourceEditor draft={draft} setDraft={setDraft} />}
        {tab === 'Requirements' && <RequirementEditor draft={draft} setDraft={setDraft} />}
        {tab === 'Versions' && <VersionCompare draft={draft} />}
        {tab === 'Export' && (
          <div className="stack-lg">
            {summary.errors > 0 && (
              <Callout tone="alert" title={`${summary.errors} validation error${summary.errors === 1 ? '' : 's'}`}>
                Fix these before publishing. The build runs the same validator and will fail.
              </Callout>
            )}
            <section aria-labelledby="preview-title">
              <div className="section-head">
                <h2 id="preview-title">Preview of changes</h2>
              </div>
              {changes.length === 0 ? (
                <p className="muted">Your draft matches the published dataset.</p>
              ) : (
                <ul className="plain-list" style={{ display: 'grid', gap: 'var(--s-2)' }}>
                  {changes.map((f) => (
                    <li key={f.label} className="button-row" style={{ justifyContent: 'space-between', padding: 'var(--s-3)', background: 'var(--paper)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)' }}>
                      <code>{f.label}</code>
                      <button type="button" className="btn btn--sm" onClick={() => downloadText(f.label.split('/').pop()!, JSON.stringify(f.get(draft), null, 2) + '\n')}>
                        <Download size={14} aria-hidden="true" /> Download
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <div className="button-row">
              <button
                type="button"
                className="btn btn--danger"
                disabled={changes.length === 0}
                onClick={() => {
                  setDraft(clone(rawContent));
                }}
              >
                <RotateCcw size={16} aria-hidden="true" /> Discard draft and reset to published
              </button>
              <Link to="/coverage" className="btn btn--ghost">
                View published coverage
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
