# ScoutPath — design system

**Scene.** A field guide on a desk: printed-page calm, forest ink, one gold trail marker. Light theme, because it is read at kitchen tables and printed as checklists.

**Color (restrained strategy).** Tokens live in `src/styles/tokens.css`.
- Ink and structure: Forest `#193C32`, Pine `#102B24`, Charcoal `#262D29`.
- Ground: Ivory `#F8F7F1` page, White `#FFFFFF` raised surfaces, Sage pale `#E8EFE5` for selected and quiet bands, Border `#E1E5DC`.
- Accent: Gold `#C99A4A`, used sparingly — Eagle on the rank trail, complete outlines in coverage bars, focus on dark bands.
- Secondary text `#5F6961` (4.5:1 on ivory and sage). Status tones are muted pairs (ok, warn, alert, info).

**Type.** Newsreader (serif, display and requirement numbers, italic for the hero's second line and "or" between Eagle options). Inter (UI and body). Sentence-case labels only — no tracked uppercase kickers. Headings use `text-wrap: balance`; body measure 66ch.

**Signature elements.** Large serif requirement numbers as the spine of every outline; the rank trail; the Eagle path ledger (required list plus "choose one" groups); topo-line texture on dark bands and the footer; sticky serif letters in the A–Z library.

**Rules.** No side-stripe borders, gradient text, glass cards, identical icon-card grids, numbered section kickers, or big-number hero metrics. Callouts are fully bordered tinted boxes with an icon. Data shows as ledgers and proportion bars with real values in the legend.

**Layers.** `--z-sticky` 20 < `--z-header` 40 < `--z-drawer` 60 < `--z-palette` 80 < `--z-toast` 100. Dialogs use the native top layer.

**Motion.** Exponential ease-out (`--ease-out-expo`). A short settle on route change that starts mostly visible, proportion bars that grow in, hover color shifts. All durations collapse to 0 under `prefers-reduced-motion`.
