import { Check, Minus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { Callout } from '../components/Callout';
import { PageHeader } from '../components/PageHeader';
import { VerificationTag } from '../components/StatusTag';
import { coverageReport, CRITERIA_LABELS, type CoverageCriteria, type OwnerCoverage } from '../features/content/coverage';
import { content } from '../features/content/data';
import { useDocumentTitle } from '../hooks/usePageMeta';

const KEYS = Object.keys(CRITERIA_LABELS) as (keyof CoverageCriteria)[];

function CoverageTable({ rows, caption }: { rows: OwnerCoverage[]; caption: string }) {
  return (
    <div className="table-wrap">
      <table className="table">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            <th scope="col">Name</th>
            <th scope="col">Rating</th>
            <th scope="col" className="num">
              Items with resources
            </th>
            {KEYS.map((k) => (
              <th scope="col" key={k} className="criteria-cell" style={{ whiteSpace: 'normal', minWidth: '6.5rem' }}>
                {CRITERIA_LABELS[k]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.ownerId}>
              <th scope="row" style={{ background: 'transparent', fontSize: 'var(--fs-sm)', color: 'var(--charcoal)' }}>
                <Link to={r.ownerType === 'badge' ? `/merit-badges/${r.slug}` : `/ranks/${r.slug}`}>{r.name}</Link>
              </th>
              <td>
                <VerificationTag status={r.rating} />
              </td>
              <td className="num">
                {r.leavesWithResources}/{r.leafCount}
              </td>
              {KEYS.map((k) => (
                <td key={k} className="criteria-cell">
                  {r.criteria[k] ? <Check size={16} className="criteria-yes" aria-label="Yes" /> : <Minus size={16} className="criteria-no" aria-label="No" />}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CoveragePage() {
  useDocumentTitle('Content coverage');
  const report = useMemo(() => coverageReport(content), []);
  const [showAll, setShowAll] = useState(false);
  const t = report.totals;
  const outlined = report.badges.filter((b) => b.hasOutline);
  const completeOutlines = content.badges.filter((b) => b.version?.completeness === 'complete').length;

  return (
    <div className="container page">
      <PageHeader
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Content coverage' }]}
        title="Content coverage"
        lede="Exactly what the library contains and how much of it has been checked. Every number here is computed from the dataset."
      />
      <div className="stack-lg">
        <dl className="ledger">
          {[
            { label: 'Merit badge listings with requirement outlines', value: t.badgesWithOutline, of: t.badgesListed },
            { label: 'Outlines that are complete (the rest are partial)', value: completeOutlines, of: t.badgesWithOutline },
            { label: 'Ranks with requirement outlines', value: t.ranksWithOutline, of: report.ranks.length },
            { label: 'Requirement items with at least one learning resource', value: t.leafRequirementsWithResources, of: t.leafRequirements },
            { label: 'Resources whose links have been checked', value: t.resourcesLinkChecked, of: t.resources },
            { label: 'Badges fully verified for publication', value: t.badgesByRating.verified, of: t.badgesListed },
          ].map((row) => (
            <div className="ledger__row" key={row.label}>
              <dt>{row.label}</dt>
              <dd>
                <span className="ledger__bar" aria-hidden="true">
                  <span style={{ width: `${row.of ? (row.value / row.of) * 100 : 0}%` }} />
                </span>
                <span className="ledger__value tabular">
                  {row.value} <span>of {row.of}</span>
                </span>
              </dd>
            </div>
          ))}
        </dl>

        <Callout tone="info" title="How the content was checked">
          {content.meta?.environmentNote}
        </Callout>

        <section aria-labelledby="standard-title">
          <div className="section-head section-head--serif">
            <h2 id="standard-title">The coverage standard</h2>
          </div>
          <p className="prose small">
            A badge or rank is only rated <strong>Verified</strong> when all of these are true: an official source is recorded; the requirement version
            was checked against it; the outline is complete; every item has at least one resource; every linked resource passed a link check; and
            safety-sensitive content has been reviewed. Anything less is shown as partially verified, unverified, needs review, or missing.
          </p>
        </section>

        <section aria-labelledby="ranks-cov-title">
          <div className="section-head">
            <h2 id="ranks-cov-title">Ranks</h2>
          </div>
          <CoverageTable rows={report.ranks} caption="Rank coverage" />
        </section>

        <section aria-labelledby="badges-cov-title">
          <div className="section-head">
            <h2 id="badges-cov-title">Merit badges</h2>
            <button type="button" className="text-link" onClick={() => setShowAll((s) => !s)}>
              {showAll ? 'Show only outlined badges' : `Show all ${report.badges.length} listings`}
            </button>
          </div>
          <CoverageTable rows={showAll ? report.badges : outlined} caption="Merit badge coverage" />
        </section>

        <section aria-labelledby="gaps-title">
          <div className="section-head">
            <h2 id="gaps-title">Outlined items without resources</h2>
            <span className="section-head__aside">{report.requirementsWithoutResources.length}</span>
          </div>
          <ul className="plain-list small" style={{ columns: '18rem', columnGap: 'var(--s-8)' }}>
            {report.requirementsWithoutResources.map((r) => {
              const node = content.requirements.get(r.id);
              return (
                <li key={r.id} style={{ breakInside: 'avoid', padding: 'var(--s-1) 0' }}>
                  {node ? <Link to={node.path}>{`${r.owner} ${r.number}`}</Link> : `${r.owner} ${r.number}`} — {r.title}
                </li>
              );
            })}
          </ul>
        </section>

        <section aria-labelledby="orphans-title">
          <div className="section-head">
            <h2 id="orphans-title">Resources not yet mapped to a requirement</h2>
            <span className="section-head__aside">{report.resourcesWithoutRequirements.length}</span>
          </div>
          {report.resourcesWithoutRequirements.length ? (
            <ul className="plain-list small">
              {report.resourcesWithoutRequirements.map((r) => (
                <li key={r.id}>
                  <Link to={`/resources/${r.id.replace(/^res\./, '')}`}>{r.title}</Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="small muted">Every resource supports at least one requirement.</p>
          )}
        </section>
        <p className="small muted">
          Maintainers can regenerate this report with <code>npm run content:coverage</code> and work through gaps in the local{' '}
          <Link to="/review">content review tool</Link>.
        </p>
      </div>
    </div>
  );
}
