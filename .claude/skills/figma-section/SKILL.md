---
name: figma-section
description: Build a page section (or, in page mode, a whole page section by section) as Astro components from Figma nodes, using the project's tokens, utilities and ui components, for desktop, tablet and mobile at once. Use when the user shares a Figma link and asks to build/implement/code a section or a page.
---

# Build a section (or a page) from Figma

Input: a Figma URL or node id — a section, or a page frame — optionally with the tablet and mobile
frames, the section name and the target page.
Output: one file `src/components/sections/<Name>.astro` per section. Nothing else unless the user asked.

## Before the first section of a project

1. **Ask for the start kit in one message** (skip items the user already gave): desktop, tablet and
   mobile frames; the fonts (TTF/OTF or WOFF2) and which weights; photos at 2x or CDN access;
   OG image 1200×630; `favicon.svg`; the production domain for `site`; the site language;
   contacts and social links; the page map with its nesting (which page is whose child — it decides
   the file paths before the first `/new-page`, `astro-components.md` → Files & naming); where the
   CTAs lead (link or popup) and where the form submits;
   whether animations are wanted (the standard set: Lenis, reveal on scroll, hiding header, hero
   intro). Whatever is missing becomes a `TODO` in the code and a line in the report — never a guess.
2. **Inventory first.** Run `/sync-tokens` with the three frames before building anything: it walks
   every element of the design, turns every repeated value into a token + class and every repeated
   element into a ui component to build, and saves `src/dev/inventory.md`. A hero built on stale or
   missing tokens had to be redone five times on the test project. Build the ui components from that
   list before the first section. Fill `src/data/site.ts` with the client data that was provided and
   set the languages in `src/i18n/index.ts` + `astro.config.mjs` from the language of the design's
   texts (ask when the file mixes languages) — a wrong `lang` is invisible on screen.
3. **Hero first, then approval.** Build the first section, show it at 1536/1540, 1920, 768 and 390
   (`pnpm build && pnpm shot 1540,1920,768,390`) and stop until the user approves its structure —
   it is the template for every other section.
4. **`stage` branch.** Create it from `main` and push it when it does not exist yet (`core.md` §6);
   every later "commit and push" goes there.

## Steps for one section

1. **Load the Figma skill first.** Invoke `figma:figma-design-to-code` before any Figma MCP call.
2. **Read the design.** `get_design_context` for the desktop node, `get_screenshot` to see the intended
   result; `get_metadata` for the tablet and mobile nodes (sizes and positions are enough there —
   `get_design_context` only for instances such as CTA/footer, and for the hero).
3. **Check the tokens — reuse first.** For every value in the node find what already exists:
   `tokens.css` / `utilities.css`, the ui components, and `src/dev/inventory.md` (value → token/class).
   A value the inventory maps to a token uses that token, even when the node shows drawing noise
   (18.5 vs the 18 token — say so in the reply). A value with no token that appears in 2+ places on
   the page → add the token + utility (a mini `/sync-tokens` step) instead of two arbitrary classes.
   A value used once → an arbitrary class in the component. A variable whose value differs from
   `tokens.css` means the tokens are stale: stop and propose `/sync-tokens` — do not build on old values.
4. **Map values to tokens — by variable name first.**
   - A value bound to a Figma variable → the matching utility/token, regardless of the number: `gap/md` → `spacing-md`, `font/h4` → `text-size-h4`, `desktop/body md (sb)` → `text-size-body-md-sb`, `border radius/xs` → `border-radius-xs`, `section padding/lg` → `padding-lg` / `padding-top-lg`.
   - A Figma text style with no `text-size-<name>` utility yet → stop and say so; the user runs `/sync-tokens`. Do not translate it into another name.
   - A raw number without a variable → an arbitrary class from `--size-N` (`spacing-40/40/24`, `col-6/3/1`, `text-size-20/20/18`), declared in the component `<style>`.
   - Nothing else: no raw px/hex. List every deviation from the design in the reply.
5. **Reuse ui components.** A node named `tag`, `card`, `button/*`, `number` (or that looks like one),
   and any pattern the inventory lists as repeated → the component from `src/components/ui/`
   (the template ships none: the project's `Button` comes first, in the shape from
   `astro-components.md`, then the rest of the inventory list); extend a component when a variant is
   missing (`type--`, `size--`) instead of restyling it in the section; a pattern met for the second
   time becomes a ui component now, not later. Contacts, name and socials come
   from `src/data/site.ts`, never as prop defaults. Contacts the design draws as elements (icon
   row, messenger buttons, a "Contacts" label) are rendered even while `site.ts` is empty —
   `href` undefined + `TODO`, name via `sr-only` text — so the section keeps the frame's height;
   only text lines (a phone in the footer) disappear when empty (`astro-components.md` → Site data).
6. **Write the component** following `.claude/rules/astro-components.md` and `.claude/rules/class-naming.md`:
   - Root: `<section class="section padding-lg">` or `padding-top-* padding-bottom-*`; the first section of the page is `section section--hero` (its vertical padding on the text column, `data-intro` if animations are on); a dark section adds `theme--dark`. No block class, background or scoped padding on the root. Then `<div class="container">` (alone) → a layout wrapper with utilities. Header and footer start directly with `<div class="container">` (the layout owns `header-fixed > header` and `footer`).
   - **HTML first** (`.claude/rules/markup.md`): repeated items are `<ul>/<ol>` + `<li>`, one `<h1>` on the page and an `<h2>` per section, `<a href>` vs `<button>`, labelled controls, `aria-expanded`/`aria-controls` on toggles, `<details>`/`<dialog>` for accordions/popups, `<address>`, `<time>`, `alt`, `aria-hidden` on decorative SVG. Layout wrappers are `<div>`s; content never is.
   - `Props` interface for text/links/images that are likely to change. Text defaults come from the dictionary: the design copy (plus `alt`, `aria-label`, field labels) goes into the default language's dictionary (`src/i18n/<lang>.ts`, `defaultLocale` in `src/i18n/index.ts`) under the component's key and the section reads `const t = useTranslations(Astro.currentLocale).<component>`; internal links via `localePath()`. Never write other languages' texts yourself (`astro-components.md` → Texts and languages).
   - Utilities first: `flex-h/v/v`, `align-center`, `justify-space-between spacing-4xl` (always together; a token that changes per breakpoint for rows that stack), `grid-2/2/1col`, `col-6`. Max three classes per element; more → another wrapper. Typography (`text-size-*`, `text-weight-*`, `text-color-*`) on the parent, children inherit. Behaviour in `data-*`, state in `is--*`.
   - `block_element` class ONLY for an element that needs a unique scoped style utilities cannot express. Typography never gets an element class or a scoped rule. Do not repeat what `utilities.css`, `reset.css`, `base.css` already set.
   - Every `a`/`button`/input: hover and focus-visible present, identical unless the design has separate states, `transition … var(--transition-duration) var(--transition-easing)`; logo link `opacity: 0.7`, social icons `scale(1.1)`. Buttons via the project's `Button.astro` (build it first if missing); no `href="#"` — if the design does not say link vs action, ask. Forms per the Forms rule (`align-start` on the form, inputs in a wrapper with a width, `cta_input` element class, `action` as `TODO`).
   - Images (rules in `.claude/rules/images.md`): real photos → `download_assets` at **2x** into `src/assets/<section>/` (kebab-case), `<Picture formats={['avif','webp']} class="fill-box">` in flow inside the container, `width` = the largest 1x size across breakpoints, `height` only for a constant crop, the box crops (`aspect-ratio` / height + `overflow-hidden` + `border-radius-*`), full-bleed via negative `--container-padding` margins, `alt`, `priority` only for the hero image. If the download fails (cloud sandbox) or the user exports photos themselves: commented `<Picture>` + `TODO` with path, filename, 2x size and Figma layer name; ask for the file in the report.
   - Icons and logos: SVG (`download_assets` svg, or `use_figma` `exportAsync({ format: 'SVG_STRING' })` when downloads fail) into `src/assets/icons/`, imported as components, `currentColor` (+ `var(--theme-icon-secondary)` for a second logo colour), `aria-hidden="true"` when decorative. Decorative vectors: one export per breakpoint (visible part, position from `absoluteRenderBounds`), anchored to the container inside `background-slot overflow-hidden`, colour `--theme-illustration`.
   - **Responsive in the same pass**: tablet and mobile from their frames — rows `flex-h/v/v` or `flex-h/h/v`, grids `grid-4/2/1col`…, `col-N` = 100 % on tablet (declare `col-5/5/2` with `--t-col-5` when the tablet frame keeps a fixed column, or list the deviation), `mob-*` modifiers and `text-align-right/left/center` declared in the component, stacked gaps from breakpoint-aware tokens, full-bleed photo heights per frame. Show/hide only via wrappers with `desktop-only` / `mobile-only` / `*-hide`. If there are no tablet/mobile frames, do not invent reflow; a desktop header nav gets a `desktop-only` wrapper and the mobile menu waits for its design. Say what was left out.
   - Animations only when the client asked for them — then on every page: `data-reveal` / `data-reveal="stagger"` on wrappers (never on a button or an element with its own transition), `data-reveal-delay` for the hero order, `data-intro` on the first section of every page; the page passes `motion` to `BaseLayout`. A popup follows the Popup rule (animated `<dialog>`, `tabindex="-1"`, `data-lenis-prevent`); nothing appears, disappears or changes state without a transition on the motion tokens.
   - `mob-width--100` for a full-width mobile button comes from `utilities.css`; a mobile modifier that a second component needs moves there too.
   - Emoji in the design's texts (flags first of all) do not go into the dictionary: an inline SVG with `icon-inline` + `aria-hidden` next to the text (`images.md`).
   - A highlighted nav item in Figma is a style demo, not an active state — all items identical unless asked.
7. **Showcase it.** Add the section to `src/dev/components.astro` (import, `showcasedSections`, a `dev_section-frame` in the Sections block in design order). A ui component or variant created or extended in step 5 goes into the same file with every variant (`showcasedUi`, one `dev_variant` per prop combination, light + `theme--dark` stage). `http://localhost:4321/dev/components` must show no red notice.
8. **Place it** only if the user named a page: import and render it in that page, in the position they specified. A section that becomes the first one of a page is that page's hero: `section--hero` and, in an animated project, `data-intro` with its elements in `data-reveal-delay` order (tag → title → text → button/illustration → cards, five steps at most); a section that is ordinary on one page and first on another gets a `hero` prop for that. Otherwise just create the file and show how to import it.
9. **Verify.** Every class in the markup is either in `utilities.css` or has a selector in this component's `<style>`, and vice versa (grep). `pnpm check` without a pipe — read the `N errors` line. Then `pnpm build && pnpm shot [--section <selector>]`: compare the section height at 1540/768/390 with the frame heights from `get_metadata`; more than 2 % difference → find the cause (line wraps, wrong token, image cap) before reporting. Use the element screenshots in the report, not the full-page one.
   The user looks at the dev server, not at `dist/`: when one is running (`pnpm astro dev status`),
   also shoot it — `pnpm shot --motion --url http://localhost:4321 --section <selector>` — and compare
   with the build screenshots. A difference means stale HMR state (new HTML with old scoped CSS after
   quick successive writes): `pnpm astro dev stop && pnpm astro dev --background`, shoot again.
10. **Review.** Delegate a comparison to the `section-reviewer` agent and relay its findings.

## Page mode (the user asks for a whole page)

When the user asks for a chain of agents (one agent and one commit per section), use `/figma-page`
instead: it spawns a `section-builder` per section, one after another, with review and push between them.

Input: the page frame (+ tablet and mobile frames). Order of work:
1. `get_metadata` on the page frame → the list of sections in design order. The page's file path follows the site hierarchy from the page map (a child of a hub page lives in the hub's folder); ask for the map when the start kit has none.
2. `/sync-tokens` with the three frames; `src/data/site.ts`; fonts (`pnpm fonts`), favicon (`pnpm favicon`), OG source — whatever the start kit contains.
3. Shared ui components first (the inventory's list: button, tag, card, input …, with the variants seen in the metadata), each added to `src/dev/components.astro` with all variants.
4. Sections one by one in design order; the hero first with the approval stop (above). `get_design_context` only for instances and complex sections, the rest from metadata.
5. `src/pages/[...locale]/index.astro` (`export const getStaticPaths = localeStaticPaths`) with `title`, `description` from `t.pages.<page>` in the default dictionary (`src/i18n/<lang>.ts`; per `/seo`: 50–60 and 120–160 chars, subject first, brand last; `lang` comes from the URL), `ogImage`, `schema`, `motion` when animations were requested; header and footer through the layout slots.
6. Verify per section (step 9) and the whole page (`pnpm shot`, `pnpm seo`); `/dev/components` shows every section and no red notice.
7. Report: a table of deviations from the design; the list of files needed from the client (photos with layer name, 2x size and target path; fonts; OG; favicon); open questions (social links, form handler, button targets).

## Do not
- Do not build anything the user did not name in this request — no neighbouring sections, mobile menus, popups, states, tokens or scripts "while at it". Name the gap in one sentence instead. (Tablet and mobile of the named section are part of the request when their frames exist.)
- Do not add headers, footers, CTAs, animations or content that are not in the referenced node or were not asked for.
- Do not build on stale tokens; propose `/sync-tokens` instead. Do not write a new class, scoped rule or component for a result an existing utility, variant or component already gives.
- Do not add client-side JS unless the design has interactive behaviour (slider, accordion, menu) or animations were requested.
- Do not rewrite existing tokens, utilities, the layout or other components while building a section. Adding is a different thing and is required by step 3: a value that repeats for the second time (the same `spacing-24/24/20` already declared in `Hero.astro`) gets its token in `tokens.css` + utility in `utilities.css` now, a colour that takes a new role (a swatch used as a section background) gets its `--theme-*` token, a ui component gets the variant the node needs — a mini `/sync-tokens`, listed in the reply. Leaving the duplicate for a "second pass" costs a review round.
- Do not rewrite the user's existing sections "to match".
- Do not put classes or scoped styles on `.container`; do not give the section a block class or background; do not create element classes for typography; do not use `gap--*` (it is `spacing-*`); do not use two `/` values; do not name a tag-choosing prop `as`.
- Do not invent photos, copy, links or client data: `TODO` + a line in the report.
