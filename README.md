# ScoutPath

**Every requirement. A clearer path forward.**

ScoutPath is a free, independent learning library for Scouts BSA advancement. It organizes trustworthy public educational resources around individual merit badge and rank requirements, and gives each Scout a private, local place to track learning progress, take notes, plan study sessions and practice.

> **Independent project.** ScoutPath is not affiliated with or endorsed by Scouting America. It does not award badges, approve advancement, or replace merit badge counselors, Scoutmasters or boards of review. Official requirements and advancement decisions remain with Scouting America and authorized volunteers.

---

## Current status — read this first

| Area | State |
|---|---|
| Application (all routes, features, tests, build) | Complete and working |
| Merit badge index | 140 listings, **unverified** against the official list |
| Requirement outlines | First Aid, Camping, Emergency Preparedness (partial), all 7 ranks (Scout and Tenderfoot complete; others partial) — **all unverified drafts** |
| Official requirement wording | **Not reproduced.** Every requirement page shows a ScoutPath summary and links to the official text |
| Resources | 61 curated links with original descriptions; URLs came from web-search results; **links not yet checked**, content and safety reviews **pending** |
| Study sets | 4 sets (38 flashcards, 25 quiz questions), every item citing a source; **awaiting expert review** |
| Verified for publication | **0** — shown honestly in the app’s coverage report |

**Why nothing is verified:** the dataset was assembled in a build environment whose network policy blocked `scouting.org` and every resource publisher. Requirement outlines were drafted from maintainer familiarity with the published requirements and cross-checked against secondary sources found through web search. Resource URLs were taken from search results but never fetched. Everything is labeled accordingly in the data and the interface. A maintainer with normal internet access should run `npm run content:check-links` and work through the [content workflow](#content-workflow) before treating anything as verified.

Notable changes found during research (from council notices and news coverage, also unverified against scouting.org): Citizenship in Society was reported discontinued effective February 27, 2026, and Eagle reported as 13 required badges plus 8 electives; Artificial Intelligence and Cybersecurity badges were introduced in October 2025; Indian Lore was renamed American Indian Culture in January 2026. The data reflects these changes, each with a note.

---

## Features

- **Requirement learning pages** for every outlined requirement: ScoutPath summary with a link to the official wording, version and verification metadata, what kind of work the requirement involves (knowledge, demonstration, activity…), an original orientation, ranked learning resources, related sub-requirements, cross-links to overlapping requirements in other badges and ranks, practice materials, personal progress and notes.
- **Merit badge library** with search across names, requirement topics and resource topics, topic filters, Eagle filter, outline filter, resource-type filter, A–Z or recently-reviewed sorting, list and card layouts, and a coverage indicator.
- **Rank advancement** with a rank dashboard (selected rank, progress, remaining items, resource availability, suggested next tasks, printable checklist).
- **Personal progress** in four states — Not started, Learning, Ready for review, Personal record of completion — clearly labeled as personal and unofficial. Percentages are only calculated when a dataset is verified and complete; otherwise ScoutPath shows counts labeled partial.
- **Dashboard** with continue-learning, current rank, my badges, upcoming sessions, goals, saved resources, a 28-day study-activity grid and quiz history.
- **Study tools**: study guides (printable, with vocabulary and review questions), flashcards (flip, previous/next, shuffle, mark known, mark for review, review-only deck, saved progress) and practice quizzes (one question at a time, immediate feedback with explanations and sources, results, review incorrect answers, retry missed, restart, local history).
- **Learning planner**: deterministic scheduler with start/target dates, study weekdays and a daily time budget. It never invents durations — requirements without an estimate get "time unknown" placeholder sessions. Over-capacity and per-day budget warnings, unscheduled list, manual editing (move, mark done, delete, add), rebuild that keeps completed sessions, printable schedule.
- **Collections** for troop meetings and workshops: starter templates, ordered resources, associated badges and requirements, private notes, print, and file-based sharing. Shared exports leave out private notes by default and never include progress. Imports are validated and added as new copies.
- **Search**: local full-text search (MiniSearch) across badges, ranks, requirements and numbers ("Tenderfoot 4a"), resources, publishers, topics and study vocabulary; command palette (`/` or `Ctrl/⌘ K`) with keyboard navigation, grouped results, highlights and alternative-keyword suggestions.
- **Data controls**: export everything to JSON; validated import with an explicit merge-or-replace choice (replace requires typing `REPLACE`); delete-all with typed confirmation; graceful fallback when browser storage is blocked or corrupt (the corrupt copy is preserved as a backup).
- **Content coverage dashboard** and a **local content review tool** (validation, link review, resource metadata and mapping editing, requirement editing, version comparison, export of changed files).
- Safe external links (new tab, `noopener noreferrer`, no referrer, destination domain shown), bookmark and report-broken-link controls.

## Technology

| Purpose | Choice |
|---|---|
| UI | React 19, TypeScript 6 |
| Build | Vite 8 |
| Routing | React Router 8 (data router, lazy routes) |
| Validation | Zod 4 — one schema set shared by the app, scripts and tests |
| Search | MiniSearch (in-browser) |
| Icons | Lucide |
| Fonts | Newsreader and Inter, self-hosted via Fontsource (SIL Open Font License); system-font fallbacks |
| Styling | Hand-written CSS with design tokens (`src/styles/tokens.css`) — no utility framework |
| Persistence | `localStorage` with schema validation |
| Tests | Vitest, Testing Library, jsdom |
| Scripts | tsx |

No backend, database, API key, analytics, AI service or paid service is used.

## Getting started

Requirements: **Node.js 22.12 or newer** and npm.

```bash
npm install
npm run dev          # http://localhost:5173
```

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Development server with hot reload |
| `npm run typecheck` | TypeScript, app and scripts |
| `npm run lint` | ESLint (TypeScript, React Hooks rules) |
| `npm test` | All automated tests once (`npm run test:watch` to watch) |
| `npm run build` | Validates content, typechecks, builds to `dist/` |
| `npm run preview` | Serves the production build at http://localhost:4173 |
| `npm run check` | typecheck + lint + test + build |
| `npm run content:validate` | Validate all content (`-- --verbose` lists informational gaps) |
| `npm run content:coverage` | Write `reports/coverage.json` and `reports/coverage.md` |
| `npm run content:compare` | List stored requirement versions or diff two of them |
| `npm run content:import -- <file> [--dry-run] [--make-current]` | Import a reviewed content package |
| `npm run content:check-links [-- --write]` | Check every resource and official URL over the network |

The build fails if content validation finds an error, so a broken dataset cannot be deployed by accident.

## Deploying for free

The production build is a static site in `dist/`. Two files make it deploy-ready:

- `public/_redirects` — `/* /index.html 200`, so nested routes such as `/merit-badges/first-aid/requirements/4a` work on direct visits and refresh.
- `public/_headers` — security headers, including a strict Content-Security-Policy (no third-party scripts, styles, fonts or connections) and long-lived caching for hashed assets.

Both were tested locally against the production build with a server that applies them; nested routes, fonts and lazy-loaded pages work under the CSP. **ScoutPath has not been deployed by the author of this README** — run one of the following yourself.

### Cloudflare Pages (recommended)

**Git integration:**
1. Push this repository to GitHub or GitLab.
2. Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git → select the repository.
3. Framework preset: *None* (or *Vite*). Build command: `npm run build`. Build output directory: `dist`.
4. Environment variable: `NODE_VERSION` = `22`.
5. Deploy. Every push to the production branch redeploys; pull requests get preview URLs.

**Direct upload with Wrangler:**
```bash
npm run build
npx wrangler pages deploy dist --project-name scoutpath
```

Cloudflare reads `_redirects` and `_headers` from `dist/` automatically.

### Other free hosts

- **Netlify:** build `npm run build`, publish `dist`. Netlify understands the same `_redirects` and `_headers` files.
- **GitHub Pages:** does not support `_redirects`. Copy `dist/index.html` to `dist/404.html` after building so deep links load the app, and serve from a custom domain or set Vite’s `base` to your repository path.

Free-tier limits and terms change; check the host’s current documentation. ScoutPath needs no server functions, databases or paid add-ons.

## Project structure

```
src/
  app/                 Router and route table (lazy-loaded secondary pages)
  layouts/AppShell.tsx Header, mobile drawer, footer, search palette, skip link
  pages/               One file per route
  components/          Reusable UI (requirement tree, resource rows, dialog, toasts, progress control…)
  features/
    content/           Loader, cross-reference validation, coverage scoring, version comparison
    progress/          User-data schema, store (localStorage), actions, summaries, import/export
    search/            MiniSearch index
    planner/           Deterministic scheduler
    collections/       Shareable collection format
    study/             Flashcard and quiz logic
    merit-badges/      Catalog filtering
  schemas/content.ts   Zod schemas for every content file
  data/                The dataset (JSON) — see below
  styles/              tokens, base, layout, components, pages, print
  lib/, hooks/         Small helpers
scripts/               validate-content, generate-coverage-report, compare-requirements, import-content, check-links
tests/                 Unit and route tests
docs/examples/         Example import packages
```

## Data model

All schemas live in [`src/schemas/content.ts`](src/schemas/content.ts).

| File | Contents |
|---|---|
| `data/meta.json` | Dataset version, update date, environment note |
| `data/categories.json` | ScoutPath’s own topic groups (not an official classification) |
| `data/catalog.json` | Every merit badge listing: `id`, `slug`, `name`, `category`, `lifecycle`, Eagle status (with `verified` flag), `catalogStatus`, `officialUrl` and its link status, plus provenance |
| `data/badges/<slug>.json` | Detail for badges beyond a bare listing: description, safety flags, `currentVersion`, **all stored requirement versions**, related resources, study sets |
| `data/ranks/<slug>.json` | The same for each rank |
| `data/resources.json` | Resource records: URL, publisher and type, original description, topics, verified duration, language, official/independent classification, link status and last-checked date, content-review date, verification and safety-review status, attribution, discovery notes |
| `data/mappings.json` | Many-to-many links `{ resourceId, requirementId, relevance: core \| supporting \| background, note? }` |
| `data/study.json` | Study sets: guide sections, vocabulary, flashcards and quiz questions, each with `sourceResourceIds` |
| `data/collection-templates.json` | Starter collections |

**Requirement versions** carry `versionId`, `label`, `effectiveDate`, `status` (verified / partially-verified / unverified / needs-review / missing), `completeness`, `wordingPolicy`, `sourceUrl`, source link status and check date, `supersedes`, `provenance` (method, notes, who, when, references) and a recursive requirement tree. Each requirement has a globally unique ID (`mb.first-aid.4a`, `rank.tenderfoot.7a`), a number, a ScoutPath title and summary, a `kind`, optional orientation, note, safety flag and related requirement IDs, and `officialText` **only** when `wordingPolicy` is `reproduced-with-permission` — the validator rejects official text in link-only versions.

**Personal data** (`src/features/progress/schema.ts`) is a single versioned object in `localStorage` under `scoutpath:user:v1`.

## Content workflow

1. **Draft or update** content in `src/data/` directly, in the local review tool at `/review` (export changed files from its Export tab), or as a package (see `docs/examples/`) imported with `npm run content:import -- package.json --dry-run`, then without `--dry-run`.
2. **Validate:** `npm run content:validate`. It checks required fields, duplicate IDs and slugs, invalid URLs (only absolute http/https), impossible dates, invalid statuses, malformed nested requirements (IDs and numbering must match the tree), mappings to missing resources or requirements, duplicate mappings, missing study-set sources, missing provenance and version information, and versions that `supersede` something no longer stored.
3. **Check links** from a machine with internet access: `npm run content:check-links -- --write`. A working link is not a content review.
4. **Review content and safety** by hand. Record `contentReviewedOn`, `verification` and `safetyReview` per resource.
5. **Verify requirements** against the official source. Only then set the version’s `status` to `verified`, record `sourceCheckedOn` and `effectiveDate`, and set `completeness`.
6. **Report:** `npm run content:coverage`, or open `/coverage` in the app.

ScoutPath does not scrape. Import approved structured official data where it exists; otherwise use this human-reviewed workflow.

### Requirement-version updates

When official requirements change:

1. Write the new version as a **new** `versionId` with `supersedes` pointing to the previous version, and import it: `npm run content:import -- new-version.json --dry-run`. The importer prints a comparison against the current version and refuses to overwrite an existing `versionId`.
2. Inspect the difference: `npm run content:compare -- <ownerId> <oldVersion> <newVersion>`. It reports additions, removals, modifications and renumbered requirements (matched by title or official text).
3. Update mappings for requirements whose IDs changed. The validator lists mappings that point at requirements missing from the current version.
4. Switch with `--make-current` when ready. Earlier versions stay in the file.

Do not assume the newest version applies to every Scout. The interface tells users to confirm applicability with their unit leader.

### Coverage standard

A badge or rank is rated **Verified** only if an official source is recorded, its requirement version was checked against that source, the outline is complete, every leaf requirement has at least one resource, every linked resource passed a link check, and safety-sensitive content and resources were reviewed. Anything less is shown as partially verified, unverified, needs review or missing.

## Testing

```bash
npm test
```

The suite (7 files, 90 tests) covers content validation (each error class), duplicate detection, requirement–resource relationships, coverage scoring, search and catalog filtering, progress calculations, local persistence (including corrupt data, blocked storage and quota errors), personal-data export/import/merge and rejection of invalid files, collection sharing (private-note sanitizing, validation), planner scheduling, version comparison, study logic, and rendering of real routes (navigation, not-found pages for unknown badges, requirements, ranks, resources, study sets and collections, progress and bookmark persistence, planner, flashcards, quizzes, collection templates).

## Privacy and safety

- No accounts, birth dates, location, messaging, public profiles, leaderboards, analytics or advertising. No online meetings.
- Personal data stays in the browser. Nothing is transmitted; there is no server to receive it. Data does not sync between devices.
- Users can export, import and delete everything. Shared collection files exclude private notes by default and never contain progress.
- The `/review` tool only edits a draft in the visitor’s own browser. There are no write endpoints anywhere.
- Safety-sensitive requirements and resources are flagged in the data and in the interface, which repeatedly tells users that online material is background reading, not a substitute for qualified instruction and supervision.
- No Scouting America logos or badge artwork are used. Badge emblems are abstract ScoutPath designs. Resources are linked, never re-hosted.
- If accounts, cloud sync or collaboration are ever added, they need their own review for youth protection, COPPA and other privacy law, parental consent, security and hosting cost **before** any personal information is collected. Having a privacy page is not a claim of legal compliance.

## Accessibility

Designed to WCAG 2.2 AA: semantic landmarks and headings, skip link, visible focus styles, keyboard-operable everything (combobox search, native `<dialog>` modals, radio-group progress control, flashcard keyboard navigation), labeled forms and readable errors, live regions for toasts and results, `prefers-reduced-motion` support, and touch targets of at least 36–44px. An axe-core scan of 27 routes at 375px and 1440px reported no violations, and the layout was checked for horizontal overflow at 375, 768, 1024 and 1440px. Automated checks do not replace testing with assistive technology users.

## Known limitations

- **No content is verified yet** (see the status table). Requirement numbering in particular may not match current official requirements.
- Official requirement wording is not shown; permission to reproduce it has not been established.
- Only three merit badges and seven ranks have outlines; Second Class, First Class, Star, Life, Eagle and Emergency Preparedness outlines are partial. The other 137 badges link to official pages only, and those per-badge `officialUrl` values follow scouting.org’s URL pattern without having been fetched.
- No videos are included, because no video URL could be verified.
- Resource durations are unknown, so the planner relies on user estimates.
- Progress lives in one browser; there is no sync. Clearing site data erases it unless exported.
- Link reports are stored locally and must be copied to maintainers by hand.
- Collections are shared by file; there is no real-time collaboration.
- The review tool is a local convenience, not a multi-user CMS.

## License

No license has been chosen yet. Fonts are under the SIL Open Font License, Lucide icons under the ISC license, and the other dependencies under their own licenses.
