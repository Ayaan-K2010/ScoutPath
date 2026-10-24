# ScoutPath design system

**Scene.** A printed Scout field guide on a kitchen table: paper, kraft card, dark ink and one red, with stitched patches and handwritten margin notes. It is flat like a printed page. Light theme, because it is read at kitchen tables and printed as checklists.

**Color.** Tokens live in `src/styles/tokens.css`. Token names are kept from the first design so components did not need renaming; the values changed.
- Ground: Paper `#F3ECDA` page, Card `#FDFBF4` raised surfaces, Kraft `#E6D9BA` for bands, tags and selected states, Khaki `#CDBF95` for tape and pressed states, Ochre `#E9D7A6` for warnings.
- Ink: Ink `#29271E` for text and rules, Olive `#3F4B24` (`--forest`) for links and labels, Pine `#2E3820` for the footer, dark panels and selected controls, Blue `#2F5D7C` for the "learning" pencil mark and one patch color.
- Accent: Neckerchief red `#9E2B22` (`--accent`) for primary buttons, requirement numbers, verification stamps, trail blazes and the current-page underline. Brass `#C08A2E` rings Eagle.
- Status has no tinted fills. It is carried by ink color, words and shape (stamp style, pencil mark).
- Secondary text `#5B5546` keeps 4.5:1 on paper, card and kraft.

**Type.** Zilla Slab for headings, nav, buttons and requirement numbers. Atkinson Hyperlegible for body and UI, because it reads clearly at any age. Kalam for handwritten margin notes (sidebar labels, relevance notes, "or" between Eagle options), never for text someone must read to act. Sentence case, except verification stamps. Copy uses commas, colons, parentheses and full stops instead of em dashes.

**Icons.** Drawn for ScoutPath in `src/components/icons.tsx`: a plain ink line on a 24px grid. Arrows have a slight hand wobble. There is no third-party icon set.

**Signature elements.**
- *Ruled outlines.* Requirement trees are an inked card split by thin rules, with large red slab numbers in their own column.
- *Verification stamps.* `VerificationTag` renders a rotated rubber stamp (`.stamp`): solid olive for verified, red for partial or needs review, dashed for unverified.
- *Pencil marks.* Personal progress is a box with pencil marks: empty, one stroke, a cross, a check (`PencilMark` in `StatePill.tsx`). Shape and color both change.
- *Patches.* `BadgeMark` and the brand mark are round cloth patches in solid twill colors, with an edge ring, an ink outline and a dashed stitch ring.
- *Trail.* The rank trail is seven numbered patches on a dashed path. Home steps are painted trail blazes.
- *Tags.* Topics and filter chips are square gear tags with a grommet hole.

**Rules.**
- Flat: no shadows of any kind, no glass, no gradients, no textures or dot patterns.
- Square corners everywhere. Circles are reserved for patches.
- No colored side or top stripes on cards; edges are a single ink or kraft rule.
- No pastel fills. Colors are paper neutrals, deep inks and the one red.
- No hover motion. Hover changes color or fill instantly; nothing lifts, tilts, slides or grows.
- Loading shows flat skeleton blocks in the shape of the page (`PageSkeleton`).
- No emoji, sparkle icons, testimonials, pricing tiers, bento grids, terminal windows or three-up feature cards.
- Nothing is tilted: stamps, cards, tape and trail blazes all sit square to the page.

**Layers.** `--z-sticky` 20 < `--z-header` 40 < `--z-drawer` 60 < `--z-palette` 80 < `--z-toast` 100. Dialogs use the native top layer.

**Motion.** State changes are instant (all `--dur-*` tokens are 0). Only the flashcard flip and the skeleton pulse move, and the pulse stops under `prefers-reduced-motion`.
