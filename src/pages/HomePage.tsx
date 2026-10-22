import { ArrowRight, Bookmark, CalendarDays, Download, GraduationCap, HardDrive, Library, ListChecks, Lock, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { BadgeMark } from '../components/BadgeMark';
import { StatePill } from '../components/StatePill';
import { VerificationTag } from '../components/StatusTag';
import { TopoPattern } from '../components/TopoPattern';
import { coverageReport } from '../features/content/coverage';
import { content } from '../features/content/data';
import { inProgress } from '../features/progress/summary';
import { STARTER_TOPICS } from '../features/search/searchIndex';
import { useDocumentTitle } from '../hooks/usePageMeta';
import { useUserData } from '../hooks/useUserData';
import { relativeTime } from '../lib/format';
import { resourcePath } from '../lib/labels';

const PREVIEW_REQUIREMENT = 'mb.first-aid.4a';

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
          placeholder="Try “hypothermia”, “Tenderfoot 4a” or “knots”"
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
  return (
    <figure className="hero-figure">
      <TopoPattern className="hero-figure__topo" />
      <div className="field-card">
        <div className="field-card__head">
          <span className="field-card__crumb">{node.ownerName} · Requirement</span>
          <VerificationTag status="unverified" />
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
            <p className="eyebrow">New here?</p>
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
            <p className="eyebrow">A free, independent learning library for Scouts BSA</p>
            <h1 className="hero__title">
              Every requirement.
              <br />
              <em>A clearer path forward.</em>
            </h1>
            <p className="hero__lede">
              Find trusted learning resources, understand what each requirement asks, and organize your Scouting progress in one place.
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

      <section className="container page-section" aria-labelledby="how-title">
        <div className="how">
          <div className="how__intro">
            <p className="eyebrow">Requirement-level learning</p>
            <h2 id="how-title" className="how__title">
              Resources organized around the exact thing you are working on.
            </h2>
            <p className="muted">
              Instead of searching across videos, articles, PDFs and handbooks, open a single requirement and find what helps with that step. One
              resource can support many requirements, and one requirement can draw on many resources.
            </p>
          </div>
          <ol className="how__steps">
            <li>
              <span className="how__icon">
                <ListChecks size={20} aria-hidden="true" />
              </span>
              <h3>Pick a requirement</h3>
              <p>Every outlined requirement has its own page with its number, parent badge or rank, and source status.</p>
            </li>
            <li>
              <span className="how__icon">
                <Library size={20} aria-hidden="true" />
              </span>
              <h3>Learn from vetted sources</h3>
              <p>Resources from agencies like the CDC, National Weather Service and Red Cross, each with an original description.</p>
            </li>
            <li>
              <span className="how__icon">
                <GraduationCap size={20} aria-hidden="true" />
              </span>
              <h3>Practice and plan</h3>
              <p>Flashcards, practice quizzes, study guides and a planner that never guesses how long things take.</p>
            </li>
            <li>
              <span className="how__icon">
                <Bookmark size={20} aria-hidden="true" />
              </span>
              <h3>Show what you know</h3>
              <p>Demonstrations and discussions still happen with your leaders and counselor. ScoutPath helps you arrive prepared.</p>
            </li>
          </ol>
        </div>
      </section>

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
          Requirement outlines so far:{' '}
          {outlined.map((b, i) => (
            <span key={b.id}>
              <Link to={`/merit-badges/${b.slug}`}>{b.name}</Link>
              {i < outlined.length - 1 ? ', ' : '.'}
            </span>
          ))}{' '}
          Other listings link to the official requirements while ScoutPath’s outlines are written.
        </p>
      </section>

      <RecentResources />

      <section className="container page-section" aria-labelledby="track-title">
        <div className="track">
          <div>
            <p className="eyebrow">Personal progress</p>
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

      <section className="container page-section" aria-labelledby="coverage-title">
        <div className="coverage-band">
          <div>
            <p className="eyebrow">Content coverage, stated plainly</p>
            <h2 id="coverage-title" className="coverage-band__title">
              What is in the library today
            </h2>
            <p className="small" style={{ marginTop: 'var(--s-3)', maxWidth: '52ch' }}>
              ScoutPath is early. Requirement outlines are drafts that have not yet been checked against official sources, and are labeled that
              way on every page.
            </p>
            <Link to="/coverage" className="text-link text-link--on-dark" style={{ marginTop: 'var(--s-4)' }}>
              See the coverage report <ArrowRight size={14} className="arrow" aria-hidden="true" />
            </Link>
          </div>
          <dl className="coverage-band__stats">
            <div>
              <dt>Merit badges listed</dt>
              <dd>{report.totals.badgesListed}</dd>
            </div>
            <div>
              <dt>Badges with outlines</dt>
              <dd>{report.totals.badgesWithOutline}</dd>
            </div>
            <div>
              <dt>Ranks outlined</dt>
              <dd>
                {report.totals.ranksWithOutline}/{report.ranks.length}
              </dd>
            </div>
            <div>
              <dt>Curated resources</dt>
              <dd>{report.totals.resources}</dd>
            </div>
            <div>
              <dt>Verified against official sources</dt>
              <dd>{report.totals.badgesByRating.verified}</dd>
            </div>
          </dl>
        </div>
      </section>

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
