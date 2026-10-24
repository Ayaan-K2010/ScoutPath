import { ArrowRight, CalendarDays, Download, HardDrive, Library, Lock, Search } from '../components/icons';
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { BadgeMark } from '../components/BadgeMark';
import { StatePill } from '../components/StatePill';
import { VerificationTag } from '../components/StatusTag';
import { TopoPattern } from '../components/TopoPattern';
import { coverageReport } from '../features/content/coverage';
import { content } from '../features/content/data';
import { versionOfOwner, type Badge } from '../features/content/model';
import { inProgress } from '../features/progress/summary';
import { STARTER_TOPICS } from '../features/search/searchIndex';
import { useDocumentTitle } from '../hooks/usePageMeta';
import { useUserData } from '../hooks/useUserData';
import { relativeTime } from '../lib/format';
import { resourcePath } from '../lib/labels';

const PREVIEW_REQUIREMENT = 'mb.first-aid.7';

function HeroSearch() {
  const [q, setQ] = useState('');
  const navigate = useNavigate();
  return (
    <form
      role="search"
      className="hero-search"
      onSubmit={(e) => {
        e.preventDefault();
        navigate(q.trim() ? `/search?q=${encodeURIComponent(q.trim())}` : '/search');
      }}
    >
      <label htmlFor="hero-search-input" className="sr-only">
        Search requirements, badges and resources
      </label>
      <div className="search-field search-field--lg">
        <Search size={20} aria-hidden="true" />
        <input
          id="hero-search-input"
          className="input"
          type="search"
          placeholder="Try “hypothermia” or “Tenderfoot 4a”"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoComplete="off"
        />
        <button type="submit" className="btn btn--primary btn--sm search-field__clear">
          Search
        </button>
      </div>
      <p className="hero-search__topics">
        <span>Popular topics:</span>
        {STARTER_TOPICS.slice(0, 4).map((t) => (
          <Link key={t} to={`/search?q=${encodeURIComponent(t)}`}>
            {t}
          </Link>
        ))}
      </p>
    </form>
  );
}

function RequirementPreview() {
  const node = content.requirements.get(PREVIEW_REQUIREMENT);
  if (!node) return null;
  const resources = (content.resourcesByRequirement.get(node.id) ?? []).slice(0, 3);
  const version = versionOfOwner(content, node.ownerId);
  return (
    <figure className="hero-figure">
      <TopoPattern className="hero-figure__topo" />
      <div className="field-card">
        <div className="field-card__head">
          <span className="field-card__crumb">{node.ownerName} · Requirement</span>
          <VerificationTag status={version?.status ?? 'missing'} />
        </div>
        <div className="field-card__title">
          <span className="field-card__num">{node.requirement.number}</span>
          <span>{node.requirement.title}</span>
        </div>
        <p className="field-card__summary">{node.requirement.summary}</p>
        <div className="field-card__label">Learning resources</div>
        <ul className="field-card__resources">
          {resources.map(({ resource, mapping }) => (
            <li key={resource.id}>
              <Library size={14} aria-hidden="true" />
              <span>
                <span className="field-card__res-title">{resource.title}</span>
                <span className="field-card__res-pub">{resource.publisher}</span>
              </span>
              <span className={`relevance relevance--${mapping.relevance}`}>{mapping.relevance}</span>
            </li>
          ))}
        </ul>
        <div className="field-card__foot">
          <StatePill state="learning" />
          <span>Personal record · not an official sign-off</span>
        </div>
      </div>
      <figcaption>
        <Link to={node.path} className="text-link text-link--on-dark">
          Open this requirement page <ArrowRight size={14} className="arrow" aria-hidden="true" />
        </Link>
      </figcaption>
    </figure>
  );
}

function ContinueLearning() {
  const data = useUserData();
  const active = inProgress(content, data).slice(0, 3);
  const recent = data.recent.slice(0, 4);
  const savedCount = Object.keys(data.saved).length;
  const isNew = active.length === 0 && recent.length === 0 && savedCount === 0;

  if (isNew) {
    return (
      <section className="start-band" aria-labelledby="start-title">
        <div className="container start-band__inner">
          <div>
            <h2 id="start-title" className="start-band__title">
              Start with one requirement you are working on right now.
            </h2>
          </div>
          <ol className="start-steps">
            <li>
              <span className="start-steps__n">1</span>
              <div>
                <strong>Find it.</strong> Open a <Link to="/ranks">rank</Link> or a <Link to="/merit-badges">merit badge</Link>, or search for a topic.
              </div>
            </li>
            <li>
              <span className="start-steps__n">2</span>
              <div>
                <strong>Learn it.</strong> Each requirement page gathers background resources and practice material.
              </div>
            </li>
            <li>
              <span className="start-steps__n">3</span>
              <div>
                <strong>Track it.</strong> Mark your own progress and notes. They stay in this browser, and only you can see them.
              </div>
            </li>
          </ol>
        </div>
      </section>
    );
  }

  return (
    <section className="container page-section" aria-labelledby="continue-title" style={{ marginTop: 'var(--s-16)' }}>
      <div className="section-head section-head--serif">
        <h2 id="continue-title">Continue learning</h2>
        <Link to="/dashboard" className="text-link">
          Open your dashboard <ArrowRight size={14} className="arrow" aria-hidden="true" />
        </Link>
      </div>
      <div className="continue-grid">
        <div>
          <h3 className="mini-heading">In progress</h3>
          {active.length ? (
            <ul className="plain-list">
              {active.map((a) => {
                const node = content.requirements.get(a.requirementId)!;
                return (
                  <li key={a.requirementId}>
                    <Link to={node.path} className="continue-row">
                      <span className="continue-row__num">{node.requirement.number}</span>
                      <span>
                        <span className="continue-row__title">{node.requirement.title}</span>
                        <span className="continue-row__meta">{node.ownerName}</span>
                      </span>
                      <StatePill state={a.state} />
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="muted small">Nothing marked as in progress yet. Set a requirement to “Learning” to see it here.</p>
          )}
        </div>
        <div>
          <h3 className="mini-heading">Recently viewed</h3>
          {recent.length ? (
            <ul className="plain-list">
              {recent.map((r) => (
                <li key={`${r.kind}:${r.id}`}>
                  <Link to={r.path} className="continue-row continue-row--simple">
                    <span>
                      <span className="continue-row__title">{r.title}</span>
                      <span className="continue-row__meta">
                        {r.kind === 'requirement' ? 'Requirement' : r.kind === 'resource' ? 'Resource' : r.kind === 'study' ? 'Study set' : r.kind === 'rank' ? 'Rank' : 'Merit badge'} ·{' '}
                        {relativeTime(r.viewedAt)}
                      </span>
                    </span>
                    <ArrowRight size={14} aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted small">Pages you open will appear here.</p>
          )}
        </div>
      </div>
    </section>
  );
}

function RecentResources() {
  const data = useUserData();
  const items = data.recent.filter((r) => r.kind === 'resource').slice(0, 4);
  const saved = Object.entries(data.saved)
    .sort((a, b) => b[1].savedAt.localeCompare(a[1].savedAt))
    .map(([id]) => content.resourceById.get(id))
    .filter(Boolean)
    .slice(0, 4);
  if (!items.length && !saved.length) return null;
  const list = items.length ? items.map((i) => ({ key: i.id, title: i.title, path: i.path })) : saved.map((r) => ({ key: r!.id, title: r!.title, path: resourcePath(r!) }));
  return (
    <section className="container page-section" aria-labelledby="recent-res-title">
      <div className="section-head">
        <h2 id="recent-res-title">{items.length ? 'Recently viewed resources' : 'Your saved resources'}</h2>
        <Link to="/saved" className="text-link">
          All saved resources <ArrowRight size={14} className="arrow" aria-hidden="true" />
        </Link>
      </div>
      <ul className="recent-res">
        {list.map((r) => (
          <li key={r.key}>
            <Link to={r.path}>
              <Library size={16} aria-hidden="true" />
              {r.title}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

const EAGLE_GROUPS = ['Emergency Preparedness or Lifesaving', 'Environmental Science or Sustainability', 'Swimming, Hiking, or Cycling'];

function outlineNote(b: Badge): string {
  if (!b.version) return 'Official links only';
  return b.version.completeness === 'complete' ? `${content.requirementOrder.get(b.id)?.length ?? 0} requirement pages` : 'Partial outline';
}

function EaglePath() {
  const required = content.badges.filter((b) => b.eagle.status === 'required');
  const options = EAGLE_GROUPS.map((g) => ({ group: g, badges: content.badges.filter((b) => b.eagle.status === 'required-option' && b.eagle.group === g) }));
  return (
    <section className="container page-section" aria-labelledby="eagle-title">
      <div className="eagle-path">
        <div className="eagle-path__intro">
          <h2 id="eagle-title" className="how__title">
            The road to Eagle
          </h2>
          <p className="muted">
            Eagle Scout needs 21 merit badges: the 13 below and 8 electives of your choice. Each one has its own learning pages here, checked against
            scouting.org’s 2026 list.
          </p>
          <Link to="/merit-badges?eagle=1" className="text-link">
            Eagle badges in the library <ArrowRight size={14} className="arrow" aria-hidden="true" />
          </Link>
        </div>
        <div className="eagle-path__lists">
          <div>
            <h3 className="eagle-path__head">
              Required <span className="tabular">{required.length}</span>
            </h3>
            <ul className="eagle-list">
              {required.map((b) => (
                <li key={b.id}>
                  <Link to={`/merit-badges/${b.slug}`}>
                    <BadgeMark category={b.category} size="sm" />
                    <span className="eagle-list__name">{b.name}</span>
                    <span className="eagle-list__meta">{outlineNote(b)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="eagle-path__head">Choose one from each</h3>
            {options.map(({ group, badges }) => (
              <ul className="eagle-list eagle-list--choice" key={group} aria-label={group}>
                {badges.map((b, i) => (
                  <li key={b.id}>
                    {i > 0 && (
                      <span className="eagle-list__or" aria-hidden="true">
                        or
                      </span>
                    )}
                    <Link to={`/merit-badges/${b.slug}`}>
                      <BadgeMark category={b.category} size="sm" />
                      <span className="eagle-list__name">{b.name}</span>
                      <span className="eagle-list__meta">{outlineNote(b)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CoverageBand({ report }: { report: ReturnType<typeof coverageReport> }) {
  const listed = content.badges.length;
  const complete = content.badges.filter((b) => b.version?.completeness === 'complete').length;
  const partial = content.badges.filter((b) => b.version && b.version.completeness !== 'complete').length;
  const linksOnly = listed - complete - partial;
  const segments = [
    { key: 'complete', label: 'Complete outline', value: complete },
    { key: 'partial', label: 'Partial outline', value: partial },
    { key: 'links', label: 'Official links only', value: linksOnly },
  ];
  return (
    <section className="container page-section" aria-labelledby="coverage-title">
      <div className="coverage-band">
        <div>
          <h2 id="coverage-title" className="coverage-band__title">
            What is in the library today
          </h2>
          <p className="small" style={{ marginTop: 'var(--s-3)', maxWidth: '56ch' }}>
            All {report.ranks.length} ranks and {complete + partial} of {listed} merit badge listings have requirement pages. Each outline was checked
            against Scouting America’s published requirements, but the wording is ScoutPath’s own, so every page links to the official text.
          </p>
          <Link to="/coverage" className="text-link text-link--on-dark" style={{ marginTop: 'var(--s-4)' }}>
            See the coverage report <ArrowRight size={14} className="arrow" aria-hidden="true" />
          </Link>
        </div>
        <figure className="coverage-bar">
          <div className="coverage-bar__track" role="img" aria-label={segments.map((g) => `${g.value} ${g.label.toLowerCase()}`).join(', ')}>
            {segments.map((g) => (
              <span key={g.key} className={`coverage-bar__seg coverage-bar__seg--${g.key}`} style={{ flexGrow: g.value }} />
            ))}
          </div>
          <figcaption>
            <ul className="coverage-bar__legend">
              {segments.map((g) => (
                <li key={g.key}>
                  <span className={`coverage-bar__swatch coverage-bar__seg--${g.key}`} aria-hidden="true" />
                  <span className="tabular coverage-bar__value">{g.value}</span> {g.label.toLowerCase()}
                </li>
              ))}
            </ul>
            <p className="coverage-bar__note">
              {listed} listings, including {content.badges.filter((b) => b.lifecycle === 'test-lab').length} Test Lab trial badges ·{' '}
              {report.totals.resources} curated resources
            </p>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}

export function HomePage() {
  useDocumentTitle('');
  const report = useMemo(() => coverageReport(content), []);
  const categoryCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const b of content.badges) if (b.lifecycle !== 'discontinued') m.set(b.category, (m.get(b.category) ?? 0) + 1);
    return m;
  }, []);
  const outlined = content.badges.filter((b) => b.version);

  return (
    <div className="home">
      <section className="hero">
        <div className="container hero__grid">
          <div className="hero__copy">
            <h1 className="hero__title">
              Every requirement.
              <br />
              <em>A clearer path forward.</em>
            </h1>
            <p className="hero__lede">
              A free, independent library for Scouts BSA. Open any rank or merit badge requirement to see what it asks, find trusted resources for
              that exact step, and keep a private record of your progress.
            </p>
            <HeroSearch />
            <div className="button-row">
              <Link to="/merit-badges" className="btn btn--primary btn--lg">
                Browse merit badges
              </Link>
              <Link to="/ranks" className="btn btn--lg">
                Explore ranks
              </Link>
            </div>
          </div>
          <RequirementPreview />
        </div>
      </section>

      <ContinueLearning />

      <EaglePath />

      <section className="container page-section" aria-labelledby="ranks-title">
        <div className="section-head section-head--serif">
          <h2 id="ranks-title">The rank trail</h2>
          <Link to="/ranks" className="text-link">
            All ranks <ArrowRight size={14} className="arrow" aria-hidden="true" />
          </Link>
        </div>
        <ol className="trail">
          {content.ranks.map((r) => (
            <li key={r.id}>
              <Link to={`/ranks/${r.slug}`} className="trail__stop">
                <span className="trail__dot" aria-hidden="true" />
                <span className="trail__name">{r.name}</span>
                <span className="trail__meta">{r.version ? `${content.requirementOrder.get(r.id)?.length ?? 0} outlined items` : 'Outline pending'}</span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section className="container page-section" aria-labelledby="cat-title">
        <div className="section-head section-head--serif">
          <h2 id="cat-title">Explore merit badges by topic</h2>
          <span className="section-head__aside">Topic groups are ScoutPath’s own, not an official classification.</span>
        </div>
        <div className="category-index">
          {content.categories.map((c) => (
            <Link key={c.id} to={`/merit-badges?category=${c.id}`} className="category-index__item">
              <BadgeMark category={c.id} size="sm" />
              <span>
                <span className="category-index__name">{c.name}</span>
                <span className="category-index__desc">{c.description}</span>
              </span>
              <span className="category-index__count tabular">{categoryCounts.get(c.id) ?? 0}</span>
            </Link>
          ))}
        </div>
        <p className="small muted" style={{ marginTop: 'var(--s-4)' }}>
          {outlined.length} of {content.badges.length} listings have requirement pages; the rest link to the official requirements and pamphlet.{' '}
          <Link to="/merit-badges">Browse the full A–Z library</Link>.
        </p>
      </section>

      <RecentResources />

      <section className="container page-section" aria-labelledby="track-title">
        <div className="track">
          <div>
            <h2 id="track-title" className="how__title">
              A private record of your learning, not an official sign-off.
            </h2>
            <p className="muted" style={{ marginTop: 'var(--s-4)' }}>
              Mark each requirement with one of four personal states. Only you see them, and they never replace the approval of your
              Scoutmaster, counselor or board of review.
            </p>
            <ul className="track__states">
              <li>
                <StatePill state="not-started" />
              </li>
              <li>
                <StatePill state="learning" />
              </li>
              <li>
                <StatePill state="ready-for-review" />
              </li>
              <li>
                <StatePill state="completed-personal" />
              </li>
            </ul>
          </div>
          <ul className="track__facts">
            <li>
              <HardDrive size={18} aria-hidden="true" />
              <div>
                <strong>Stored in this browser only.</strong> No account, no server copy, no sync between devices.
              </div>
            </li>
            <li>
              <Download size={18} aria-hidden="true" />
              <div>
                <strong>Yours to export or delete.</strong> Download everything as a file, restore it later, or erase it in one step.
              </div>
            </li>
            <li>
              <Lock size={18} aria-hidden="true" />
              <div>
                <strong>No tracking.</strong> No analytics, ads, leaderboards or public profiles.
              </div>
            </li>
            <li>
              <CalendarDays size={18} aria-hidden="true" />
              <div>
                <strong>Plan around real life.</strong> Pick your study days and time budget; the <Link to="/planner">planner</Link> lays out
                sessions.
              </div>
            </li>
          </ul>
        </div>
      </section>

      <CoverageBand report={report} />

      <section className="container page-section" aria-label="Independent project disclaimer">
        <p className="disclaimer-strip">
          <strong>Independent project.</strong> ScoutPath is not an official Scouting America product. It does not award badges, approve
          advancement, or replace merit badge counselors and unit leaders. Watching a video or passing a practice quiz does not complete a
          requirement. <Link to="/disclaimer">Read the full disclaimer</Link>.
        </p>
      </section>
    </div>
  );
}
