# ScoutPath — design system

**Scene.** A Scout's field handbook on a kitchen table: kraft paper, index cards, a pencil, a stitched patch and a neckerchief. It should feel like it came out of a pack, not off a screen. Light theme, because it is read at kitchen tables and printed as checklists.

**Color.** Tokens live in `src/styles/tokens.css`. Token names are kept from the first design so components did not need renaming; the values changed.
- Ground: Paper `#F3ECDA` page (with a faint dot grain on `body`), Card `#FDFBF4` raised surfaces, Kraft `#E6D9BA` for bands, tags and selected states, Khaki `#CDBF95` for offset shadows and tape.
- Ink and structure: Ink `#29271E` for text and heavy rules, Olive `#3F4B24` (`--forest`) for links and labels, Pine `#2E3820` for the footer, dark panels and selected controls.
- Accent: Neckerchief red `#9E2B22` (`--accent`) for primary buttons, requirement numbers, verification stamps, trail blazes and the current-page underline. Brass `#C08A2E` marks Eagle.
- Index-card rules: blue `#CFDCE4` lines and red `#D99A93` header lines, decorative only.
- Secondary text `#5B5546` keeps 4.5:1 on paper, card and kraft.

**Type.** Zilla Slab (headings, nav, buttons, requirement numbers) — sturdy like stenciled gear. Atkinson Hyperlegible (body and UI) — built for clear reading at any age. Kalam (handwritten margin notes: section labels in sidebars, relevance notes, "or" between Eagle options) — never for text someone must read to act. Sentence case, except verification stamps.

**Signature elements.**
- *Notebook outlines.* Requirement trees sit on a ruled card with a red margin rule; the large red slab numbers live in the margin.
- *Verification stamps.* `VerificationTag` renders a rotated rubber stamp (`.stamp`): solid olive for verified, red for partial or needs review, dashed for unverified. Honesty labels must never read as decoration.
- *Pencil marks.* Personal progress is a box with pencil marks — empty, one stroke, a cross, a check (`PencilMark` in `StatePill.tsx`). Shape and color both change.
- *Patches.* `BadgeMark` and the brand mark are round cloth patches with a merrowed edge and a dashed stitch ring.
- *Trail.* The rank trail is seven numbered patches on a dashed path; Eagle gets a brass ring. Home steps are painted trail blazes.
- *Index cards and tags.* Resources, study and flashcards are index cards (red header rule). Topics and filter chips are luggage tags with a grommet. Warnings hang like gear tags with a clipped corner.

**Rules.** Hard offset shadows (no blur) on buttons and inputs; pressing a button pushes it flat. Kraft offset shadows under cards. Heavy 2px ink rules under page and section headers; dashed rules between list rows. No gradients, glass, emoji, leaderboards, streaks, or big-number hero metrics. Rotations stay small (≤ 4°) and are removed in print.

**Layers.** `--z-sticky` 20 < `--z-header` 40 < `--z-drawer` 60 < `--z-palette` 80 < `--z-toast` 100. Dialogs use the native top layer.

**Motion.** Exponential ease-out (`--ease-out-expo`). A short settle on route change that starts mostly visible, proportion bars that grow in, cards that lift and tilt slightly on hover. All durations collapse to 0 under `prefers-reduced-motion`.
