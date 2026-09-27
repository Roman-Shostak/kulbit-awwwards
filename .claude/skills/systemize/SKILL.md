---
name: systemize
description: End-of-project design system pass — collects every raw value the sections were built with (colours, text styles, spacing, sizes, radii, borders, shadows, motion), groups near-duplicates, proposes ONE token + class per value with a merge table for the user's approval, then rewrites tokens.css, utilities.css and every component to the tokens and utilities, cleans the classes to the methodology, and proves with screenshots that nothing moved except the approved merges. Switches the project from the development phase to the systemized phase (src/dev/inventory.md). Use when the user asks to systemize / tidy / clean up / tokenize / normalise the styles, "put everything into tokens", or finishes development.
---

# Systemize the design (development → systemized)

Input: nothing, or the part of the site to include (default: everything in `src/`).
Output: the approved proposal applied — `tokens.css` and `utilities.css` hold the project's real scale, every
component uses tokens and utilities, `src/dev/inventory.md` records the system with `Phase: systemized`,
screenshots before/after and a report. Nothing is committed unless the user says so.

During development the sections are written with the values exactly as in Figma, in the components' scoped
styles (`styles.md` → Phases). The client's files are messy — 23/24/25 px for one gap, `#1a1a1a` next to
`#1b1b1b` — so the system is built once, from what was actually built, when the design has stopped moving.
This skill is that step. It never changes a pixel the user did not approve.

## 0. Preconditions
1. `src/dev/inventory.md` says `Phase: development`. It says `systemized` → **incremental mode**: collect only
   what was added since (raw values in the report of step 1), map it to the existing tokens first, propose new
   tokens only for what does not fit; the rest of the steps is the same.
2. Clean tree (`git status --porcelain` empty) — the pass must be one reviewable, revertible diff. Uncommitted
   changes → ask the user to commit them first; never commit or stash yourself.
3. `pnpm check` (no pipe) and `pnpm build` pass. They fail → stop and show the error.
4. **Baseline.** For every page of the sitemap (`dist/sitemap.xml`, or every file in `src/pages/`), at 1540, 1920,
   768 and 390: `pnpm shot 1540,1920,768,390 --path <page>` and move the files to `screenshots/before/<page>/`.
   Keep the printed section heights (a table per page) — step 5 compares against them.
   In a step-scroll project (`<BaseLayout steps>`) `pnpm shot` sees every scene after the first at its
   timeline's start: note it and compare those scenes on `/dev/components` too
   (`pnpm shot 1540,768,390 --url http://localhost:4321 --path /dev/components`).

## 1. Collect
```
node .claude/skills/systemize/scripts/collect.mjs --json screenshots/systemize.json
```
It reads the `<style>` blocks of `src/**/*.astro` (without `src/dev/`) and `utilities.css`, resolves sizes to px
on the reference frame (`calc(1.5rem * var(--fluid-scale))`, `var(--size-24)`, `24px` → 24) and prints:
colours (normalised hex, uses, where); text styles per selector as desktop ‖ tablet ‖ mobile; spacing, sizes,
radii, borders, shadows and motion as d/t/m triples per rule; other breakpoints; inline `style=""`; tokens
nothing references; utilities no markup uses. Values in `<script>` (GSAP durations, eases) are not parsed —
grep `src/**/*.astro` and `src/scripts/` for `duration`, `ease`, `stagger` yourself.
Also read the markup for **repeated patterns** that are still styled per section instead of a `ui/` component
(the same element structure + the same values in 2+ sections).

When the Figma file has named text styles or colour variables (`/sync-tokens` base listed them), use those names
in step 2; otherwise names come from the role (below). Figma is not needed for anything else: the code holds the
values the user already approved section by section.

## 2. Propose — the table the user approves
Build the proposal from the collected values and write it into `src/dev/inventory.md` under a heading
`## Proposal (awaiting approval)` (the user may edit rows there), then show it in the reply and **stop**.

Grouping rules:
- **Exact repeats** → one token. **Near values** → one proposed row with every source value, the uses of each
  and the visual change in px / colour distance: sizes within ±2 px (or ±5 % above 40 px) on every
  breakpoint; line-heights within 0.05; letter-spacing within 0.01em; colours whose channels differ by ≤ 3
  (or look identical side by side). The dominant value (most uses) wins unless the user picks another.
  Values outside these limits are never merged, however messy they look — list them as "close, kept apart".
- **Breakpoints travel together.** A token is a d/t/m triple: two rules with the same desktop value and
  different mobile values are two tokens (or a merge row that names the mobile change).
- **Colours: every colour becomes a token**, even used once — `--swatch-<name>` (Figma name, else a plain
  colour word: `ink`, `sand`, `grey-200`) + a `--theme-*` role from where it is used (text, secondary text,
  brand, inverse, page/section/card background, border, icon, input, illustration — the roles of `styles.md`).
  A role that takes another value inside dark sections → the `.theme--dark, .footer` block; a colour that
  stays the same on dark sections → an `alw` token.
- **Text styles** (family + weight + size + line-height + letter-spacing per breakpoint): used in 2+ places, or
  any heading → `--font-<name>` / `--line-height-<name>` / `--letter-spacing-<name>` (+ tablet/mobile values)
  and `.text-size-<name>`; weight stays `text-weight-*`, colour `text-color-*`. Names: the Figma style name in
  kebab-case, else the ladder — headings `h1`… from the largest, body `body-lg` / `body-md` (the most used) /
  `body-sm`, `caption`, `link`, `button`, `placeholder`, a second family `<name>-<family>`. The page default
  (`--font-default` / `--line-height-default` / `--letter-spacing-default`) points at `body-md`.
- **Spacing:** gaps → `--spacing-tiny/xs/sm/md/lg/xl/2xl/3xl/4xl` by desktop value ascending (as many as
  exist); section top/bottom paddings → `--section-padding-sm/md/lg`; the side padding → `--container-padding`;
  column widths → `--column-gap` / `--t-col-N`. **Radii** → `--radius-xs…xl` (+ `--radius-full` for pills),
  **borders** → `--border-width-*`, **shadows** → `--shadow-*`, **icon sizes** → `--icon-height-*`,
  **button paddings** → `--button-padding-*`. Used 2+ times → token + utility; used once → stays an arbitrary
  class in its component, rewritten onto `--size-N` (listed as a one-off).
- **Motion:** every duration/easing onto the four motion tokens (the closest one; a value that is clearly
  different — a 1.2 s scene transition — is a question to the user, not a fifth token by default). GSAP values in
  scripts read the tokens (`getComputedStyle(document.documentElement)`); the step scroll engine
  (`src/scripts/kulbit/app.ts` → `config`) keeps the Webflow build's numbers — not rewritten.
- **Template leftovers:** tokens and utilities of the template that nothing uses after the rewrite → proposed
  for removal (one line with the names); the ones in use keep their names and take the project's values.
- **Repeated patterns** not yet a `ui/` component → proposed extractions (component, variants, sections).

The table, one block per category:

| Token / class | Desktop / tablet / mobile | Replaces (value × uses) | Visual change | Where |
| --- | --- | --- | --- | --- |
| `--spacing-md` · `spacing-md` | 24 / 24 / 16 | 24×9, 23×2, 25×1 | 23→24 (+1 px) in Hero, Cases; 25→24 (−1 px) in Footer | Hero, Cases, Footer … |
| `--swatch-ink` → `--theme-text` | `#1a1a1a` | #1a1a1a×14, #1b1b1b×2 | #1b1b1b → #1a1a1a (invisible) | About |

Then: one-offs (stay arbitrary), close-but-kept-apart values, removals, component extractions, and the
questions (motion outliers, a colour whose role is unclear). End with: "Reply «так» to apply, or edit the rows
in `src/dev/inventory.md` / name the rows to change."

## 3. Apply (only after the user's «так» or edited rows)
Work category by category, `pnpm check` after each:
1. **`tokens.css`** — values into the existing groups under their `/* ---------- Group ---------- */` headers:
   desktop in `:root`, tablet in `@media (max-width: 991px)`, mobile in `@media (max-width: 479px)`, only what
   differs; trailing comment `/* Figma name · N uses · merged 23, 25 */`. Missing `--size-N` primitives for the
   one-offs are added to the primitives. Approved removals deleted.
2. **`utilities.css`** — `text-size-<name>` for every text style token, `text-color-*` for new text roles, the
   `.theme--dark, .footer` values, the dictionary table in `styles.md` updated with the new classes. Approved
   removals deleted (and from `styles.md`).
3. **Components** — every raw value replaced:
   - typography: the scoped `font-size` / `line-height` / `letter-spacing` / `font-family` go; the element (or
     its parent, when siblings share it) gets `text-size-<name>` (+ `text-weight-*`, `text-color-*` on the parent);
   - spacing: `spacing-24/24/16` → `spacing-md` (the declared class and its CSS deleted); section padding →
     `padding-*` / `padding-top-*` / `padding-bottom-*`; margins/paddings inside element rules →
     `var(--spacing-*)`;
   - colours → `var(--theme-*)` in the scoped rule or `text-color-*` in the markup; radii →
     `border-radius-*` or `var(--radius-*)`; borders, shadows, icon sizes, motion → their tokens;
   - one-offs → `--size-N` arithmetic, still in the component.
   Then the **methodology pass** on every touched component (`class-naming.md`): a `block_element` class whose
   rule became empty is deleted from the CSS and the markup; max 3 classes per element (a text-size moved to the
   parent rather than a new wrapper; a wrapper only when unavoidable — listed); every class ↔ selector both
   ways; `.container` alone; section format; no scoped typography; no raw hex/px left except the approved one-offs;
   every state on the motion tokens.
4. **Component extractions** that were approved → `src/components/ui/<Name>.astro` in the shape of
   `astro-components.md`, the sections switched to it, `/dev/components` updated (no red notice).
5. **GSAP / scripts** — durations and eases read from the motion tokens.

## 4. Record
`src/dev/inventory.md`: `Phase: systemized`, the date, the frames, the final mapping table
(value → token / class / component), the approved merges, the one-offs, the removals, the ui components.
The `## Proposal` block is replaced by these tables. From now on the rules' systemized phase applies:
tokens first, a second use of a value → token + utility (`class-naming.md`).

## 5. Verify
1. `pnpm check` (no pipe) → 0 errors; `pnpm build`; `pnpm seo` → 0 errors.
2. The same shots as the baseline into `screenshots/after/<page>/`. Section heights: identical to the baseline,
   except where an approved merge explains the difference (name it); anything else → find the cause and fix it
   before reporting.
3. Look at every before/after pair of every section at 1540 and 390 (Read the PNGs). Any change that is not in
   the approved table is a bug of this pass.
4. `node .claude/skills/systemize/scripts/collect.mjs` again: the raw values left must be exactly the approved
   one-offs; unused tokens/utilities = only the ones the user chose to keep.
5. `http://localhost:4321/dev/tokens` (groups show the new scale) and `/dev/components` (no red notice), with the
   dev server running.
6. `section-reviewer` on the hero and on every section with a visual change.

## 6. Report
What changed per category (tokens added / renamed values / removed), the merges with their visual effect, the
one-offs, the component extractions, heights before/after per page, anything left for the user. Suggest the
commit title `Systemize design tokens` — commit and push only when the user says so (`core.md` §6).

## Do not
- Do not do anything the user did not ask for in this request beyond the steps above: no new sections, states,
  animations, content or markup changes that are not required by the token rewrite.
- Never merge, round or recolour without the approved table; never change a value that is not in it.
- Do not rename classes that are not raw-value classes, do not touch copy, dictionaries, images or scripts'
  behaviour; do not change breakpoints or the fluid scale.
- Do not create a token for a size used once (colours excepted) and do not leave a value used twice without one.
- Do not delete a token or utility that something still uses; do not leave one that nothing uses unless the user
  chose to keep it.
- Do not commit, push or stash on your own.
