---
paths:
  - "src/styles/**"
  - "astro.config.mjs"
---

# Styling system rules

The system is a port of the user's Webflow "Ambi" framework: fluid scale → size primitives →
semantic tokens → utility classes. Class NAMING (blocks, elements, modifiers, mixes, the `/` breakpoint
syntax, arbitrary-value classes) is defined in `class-naming.md`; this file lists the predefined dictionary.

## Architecture
`global.css` loads, in cascade-layer order: `tokens.css` → `reset.css` → Astro's `astro.images` (the responsive-image defaults: `height: auto`, `max-width: 100%`) → `base.css` → `utilities.css`. The Astro layer is named in the `@layer` statement on purpose: unnamed, it would sort last and its `height: auto` would beat `fill-box`.
Scoped `<style>` blocks in components are unlayered and therefore override utilities — including `display: none` from the visibility utilities (see `class-naming.md`).

## Phases (`Phase:` line in `src/dev/inventory.md`)
Client files are messy (one gap drawn as 23, 24 and 25 px; `#1a1a1a` next to `#1b1b1b`), so the system is built at the end, from what was really built:
- **`development`** (from the start until `/systemize`). Tokens are only the base written by `/sync-tokens`: frames and fluid scale, `--container-padding` and the column grid, font families and `text-weight-*`, 2–4 main colours (`--theme-page-bg`, `--theme-text`, `--theme-text-brand`, `--theme-section-bg-dark`), the four motion tokens. **Every other value is written exactly as in Figma, in the component**, no rounding to a nearby token and no new tokens or utilities:
  - sizes through the fluid scale: `var(--size-N)` when the primitive exists, otherwise `calc(<px / 16>rem * var(--fluid-scale))`; tablet/mobile values in the component's `@media (max-width: 991px)` / `(max-width: 479px)` blocks;
  - spacing, section padding, widths and text styles as arbitrary classes declared in the component (`spacing-40/40/24`, `padding-120/80/60`, `col-6/3/1`, `text-size-64/48/40` = size + line-height + letter-spacing; `class-naming.md`), typography on the parent as usual;
  - colours, radii, borders, shadows as raw values (lowercase hex / rgba from Figma) in the scoped rule of the block or element; a state colour Figma does not give → raw value + `/* TODO: not in Figma */`;
  - the template's semantic utilities with placeholder values (`spacing-md`, `text-size-h2`, `padding-lg`, `border-radius-sm`, `text-color-secondary`) are **not** used: their values are not the design's. Structural utilities are (`section`, `container`, `flex-*`, `grid-*`, `align-*`, `justify-*`, `col-N`, visibility, `fill-box`, `sr-only`, `theme--dark` for the dark background).
  - the same value in two components is expected, not a finding; repeated **elements** still become `ui/` components on their second use.
- **`systemized`** (after `/systemize`). The rest of this file applies in full: tokens first, raw px/hex only for approved one-offs, a value used a second time becomes a token + utility (`class-naming.md` → Reuse first). A late change that brings new raw values → `/systemize` again (incremental).

## Fluid scale (`tokens.css` + inline script in `BaseLayout.astro`)
- `--fluid-scale = --viewport-width / --reference`. `--viewport-width` is written onto `<html>` by the
  inline script (clientWidth, no scrollbar, capped at `--max`). Without JS it equals `--reference` → scale 1.
- `--reference` is the design frame width per breakpoint: **1540** desktop, **768** ≤991px, **390** ≤479px. `--max` = 1540. `sync-tokens` sets `--reference`/`--max` to the client's desktop frame width (e.g. 1536); `--max: none` when the client wants the site to keep scaling at every width (no cap: the inline script and `/dev/tokens` read a non-number as "no cap").
- Every `--size-N` = N/16 rem × `--fluid-scale`. The whole layout scales like a zoomed Figma frame and stops at `--max`.
- Consequence: when a Figma value is 24px on the desktop frame, use `--size-24` — do not convert to a fixed rem/px.
- `--size-1` and `--size-2` are fixed 1px / 2px (hairlines do not scale).

## Tokens (`tokens.css`)
| Group | Tokens |
| --- | --- |
| Primitives | `--size-4 … --size-160` (4 6 8 10 12 14 16 18 20 24 26 28 30 32 36 40 44 48 52 56 60 64 72 80 100 120 160); `sync-tokens` adds missing values (e.g. `--size-15`, `--size-58`) |
| Spacing | Kulbit (systemized): `--spacing-xs/sm/md/lg/xl/2xl/3xl` = 8 / 12 / 16 / 24 / 32 / 48·48·24 / 64, `--spacing-head` = 48·64·24 (the label ↔ statement row of a section); used for gap, padding and margin |
| Section / header / footer | `--section-padding-md` (the Webflow `.section`: 64 / 48 / 24), `--container-padding`, `--header-padding`, `--header-height` (tallest header item + padding × 2; the `section--hero` offset), `--footer-padding-top/bottom` (`.footer` and SiteFooter's screen-high content) |
| Widths / icons | `--width-statement` (695 / 557 / auto), `--icon-arrow` (56 / 56 / 40) — sizes repeated in 2+ components |
| Grid | `--column-size`, `--column-gap` (derived from Figma `container width/Ncol`: 12·col + 11·gap = frame − 2·padding), `--col-1…12` (desktop, of 12), `--t-col-1…6` (tablet, of 6 — or the tablet frame's own `container width/Ncol` values written by `sync-tokens`), `--m-col-1/2` (mobile, of 2) |
| Text styles | one per shared text style (Kulbit: the Webflow class names `h1`, `h3`, `section-h2`, `section-label`, `hero`): `--font-<name>` (+ tablet/mobile values), `--line-height-<name>`, `--letter-spacing-<name>`; the page default `--font-default` / `--line-height-default` / `--letter-spacing-default` = the Webflow body (Decima Mono X 16 / 1.1). A style used by one element stays a class declared in its component, named after its Webflow class (`text-size-card-title`) |
| Type misc | `--font-primary/secondary`, `--font-weight-regular/bold/extra-bold` (only the weights with a font file) |
| Motion | `--transition-duration` (0.3s), `--transition-easing` (`ease`, the Webflow default), `--transition-duration-slow` (0.6s), `--transition-stagger` (0.1s: delay step). Every transition/animation uses exactly these four |
| Icons | `--icon-arrow` |
| Shape | `--radius-sm` (9: cards, frames, buttons), `--radius-md` (10: the player's lines), `--border-width-sm` (1px) / `--border-width-md` (2px) |
| Colours | `--swatch-*` (raw palette: the Webflow colour variables — `black`, `white`, `white-10`, `black-20`, `black-30`, `blue`, `red` — plus `graphite`, `ink` and the `-aNN` opacity variants) → `--theme-page-bg`, `--theme-fade`, `--theme-vignette`, `--theme-text`, `--theme-text-secondary`, `--theme-text-brand`, `--theme-text-accent`, `--theme-text-inverse`, `--theme-icon`, `--theme-icon-secondary`, `--theme-icon-brand`, `--theme-border`, `--theme-frame`, `--theme-track`, `--theme-illustration`, `--theme-ring-outer/middle/inner`, `--theme-player-seek/volume/shade`. The whole site is dark: no dark-section overrides |

- Semantic tokens are re-mapped per breakpoint at the bottom of `tokens.css` (e.g. `--font-h1` 64 → 44 on mobile). Change values there, not in components. Every text style, gap, section padding and radius that differs on the mobile frame has a value in the `@media (max-width: 479px)` block; tablet-only differences go to `@media (max-width: 991px)`.
- Components use **semantic** tokens (`--theme-text`, `--spacing-md`), never swatches or `--size-N` directly, except when a Figma value has no semantic token (then `--size-N` is acceptable). In the development phase only the base tokens exist; the rest is raw (Phases above).
- **Dark sections.** Figma shows the same variables with other values on dark backgrounds. A project with light and dark sections adds `.theme--dark` (and `.footer`) in `utilities.css` that re-assign `--theme-text`, `--theme-text-secondary`, `--theme-text-brand`, `--theme-icon`, `--theme-icon-secondary`, `--theme-card-bg` with those values and set the background; components inside keep using `text-color-*`, cards, tags and the logo unchanged. Tokens named `alw` (always) are never re-assigned. Kulbit is dark everywhere: `theme--dark` was removed with `/systemize`.
- Fonts: `--font-primary` / `--font-secondary` fall back to system stacks until the Astro Fonts API defines `--font-primary-custom` / `--font-secondary-custom` (see `astro.config.mjs`).
- When syncing from Figma, keep token names and change values. Rename a token only after listing every usage.

## Fonts (Astro Fonts API, `astro.config.mjs`)
- The client's TTF/OTF go to `src/assets/fonts/source/`; `pnpm fonts` (scripts/build-fonts.py, fonttools) writes `<family>-<weight>[-italic]-<subset>.woff2` for latin, latin-ext, cyrillic, cyrillic-ext into `src/assets/fonts/` and prints the `variants('<base>', { weight, style })` lines for the config. The `subsets` ranges in `astro.config.mjs` and in the script are identical — keep them so.
- `fonts[]` in `astro.config.mjs` uses `fontProviders.local()` and the `variants()` helper (JSDoc tuple types satisfy `@ts-check`). The helper lists only the subset files that exist (`pnpm fonts` skips subsets the font has no glyphs for) and puts `primarySubset` (the site language's script) first. `BaseLayout` renders `<Font cssVariable="--font-primary-custom" />` (+ secondary) **without `preload`** and builds one preload link per weight/style from `fontData` — the first file, i.e. the primary subset (snippet in `BaseLayout.astro`).
- Only weights and styles that have a file may be used in CSS (`text-weight-600`, italic via a `text-size-*-stix` style). If Figma uses a weight the client did not deliver, ask for the file — do not let the browser synthesise it.

## Typography model (`base.css` + `text-size-*`)
Tags carry semantics only: `h1–h6`, `p`, `label`, `blockquote` inherit font, size, weight, line-height from their parent.
`body` sets `--font-default` / `--line-height-default` / `--letter-spacing-default` (→ the client's most used body style) and `--font-weight-regular`.
- `text-size-<name>` = the complete Figma text style: `font-size` + `line-height` + `letter-spacing` from the three `--*-<name>` tokens; a style of the secondary font (`desktop/h2 stix`) also sets `font-family: var(--font-secondary)` and `font-style`. The name is the Figma style name in kebab-case (`body md (sb)` → `text-size-body-md-sb`), never translated into another word.
- Put it on the parent; children inherit. Weight (`text-weight-*`) and colour (`text-color-*`) are separate utilities.
- No element class and no scoped style ever sets typography.
```html
<h2 class="text-size-h3 text-weight-600">…</h2>   <!-- semantic h2, looks like h3 -->
<ul class="text-size-link text-color-secondary">…</ul>
```

## Utilities (`utilities.css`) — predefined dictionary
Responsive values use `/` in desktop/tablet/mobile order and are escaped in CSS (`.flex-h\/v\/v`).
| Purpose | Classes |
| --- | --- |
| Page structure | `wrapper`, `header-fixed` (fixed top, z-index 10, slides away with `is--hidden`, hidden without transition with `is--intro`), `header` (padding + background from tokens), `main`, `footer` (background, `--footer-padding-*`), `section`, `section--hero` (first section: `padding-top: var(--header-height)`), `container` (alone, never with other classes or scoped styles), `background-slot` (decor only; `overflow-hidden` goes here, not on the section) |
| Section padding (vertical) | `padding-md`; one side: `padding-top-md`, `padding-bottom-md` |
| Flex direction | `flex-h`, `flex-v`, `wrap`; responsive `flex-h/h/v`, `flex-h/v/v`, `flex-h/v/h`, `flex-v/h/h`, `flex-v/h/v`, `flex-v/v/h` |
| Align / justify | `align-start/center/end/stretch`, `justify-start/center/end/space-between/space-around` (these also set `display:flex`), `align-self-start/center/end/stretch`. `justify-space-between/around` ALWAYS together with a `spacing-*` |
| Spacing | `spacing-xs/sm/md/lg/xl/2xl/3xl`, `spacing-head` = gap between children (flex and grid). One-offs: `spacing-85`, `spacing-40/40/24` declared in the component. The word `gap` is never used in a class name |
| Grid | `grid-2col`, `grid-3col`, `grid-4col`; responsive `grid-{d}/{t}/{m}col`: `grid-2/1/1col`, `grid-2/2/1col`, `grid-3/1/1col`, `grid-3/2/1col`, `grid-3/2/2col`, `grid-3/3/1col`, `grid-3/3/2col`, `grid-4/1/1col`, `grid-4/2/1col`, `grid-4/2/2col`, `grid-4/3/1col`, `grid-4/3/2col` |
| Columns | `col-1…12` = width of N/12 on desktop, 100% on tablet and below. Responsive `col-6/3/1`, `col-5/5/2` are arbitrary-value classes declared in the component (`--col-6` / `--t-col-3` / `--m-col-1`) |
| Sizing / position | `width-100`, `height-100`, `margin-top-auto`, `position-relative`, `overflow-hidden`, `display-none` |
| Text styles | Kulbit: `text-size-h1`, `text-size-h3`, `text-size-section-h2`, `text-size-section-label`, `text-size-hero` (the family of the secondary font included); one-off styles are classes in their component under their Webflow name |
| Type misc | `text-weight-400/700/800`, `text-style-uppercase/lowercase`, `text-align-left/center/right`, `text-color-primary/secondary/brand/accent/inverse/inherit`, `text-style-inherit` |
| Icons / media | `icon-inline` (an inline SVG the size of the text, 1em × 1em — a flag next to a city name), `fill-box` (photo fills its box: `<Picture class="fill-box">` — 100 % width/height, `object-fit: cover`, removes Astro's `max-width` cap, stretches the `<picture>` wrapper; `global.css` orders the `astro.images` layer below `utilities` so the utility always wins) |
| Border | `border-radius-sm/md` (colour and width from the component: `--theme-border`, `--theme-frame`, `--border-width-md`) |
| A11y | `sr-only` |
| Visibility | `desktop-hide` (≥992), `tablet-hide` (768–991), `landscape-hide` (480–767), `mobile-hide` (≤479), `mobile-only`, `desktop-only` |
| Mobile modifiers | `mob-width--100` (≤479: `width: 100%` — a CTA or submit button stretched on mobile); other `mob-*` modifiers live in the component until a second component needs them |
| Motion (attributes, not classes) | `data-reveal`, `data-reveal="stagger"` (children, nth-child delays up to 8), `data-reveal-delay="1…5"`, `data-intro`; the module adds `is--visible`. Keyframe animation `reveal`, gated by `[data-motion]` on `<html>`; static under `prefers-reduced-motion` |
| Step scroll (attributes) | `data-scenes` on `<main>` (`<BaseLayout steps>`); an inline script in `<head>` sets `data-steps` on `<html>` before the first paint → `overflow: clip` (no native scroll, the content stays visible to axe / Lighthouse), `.wrapper` = the fixed viewport (`overflow: clip`), `<main data-scenes>` = the stacking container, `height: 100%` of `.wrapper` (the visible viewport, not 100vh: the mobile browser bars), under `.header-fixed` (the module `src/scripts/kulbit/` stacks the `[data-kulbit-section]`s) |

Typical section skeleton (`.container` alone; layout on the wrapper inside it):
```html
<section class="section padding-md">
  <div class="container">
    <div class="flex-v align-center spacing-xl">
      <h2 class="text-size-h2">…</h2>
      <div class="grid-3/2/1col spacing-md">…</div>
    </div>
  </div>
</section>
```

## Motion
`transition: color var(--transition-duration) var(--transition-easing)`; reveals and the hero intro use `--transition-duration-slow` and `--transition-stagger`. No other durations or easings unless Figma or the user specify them. Reveal animations are keyframes (`animation`), not transitions: a transition from a never-painted hidden state is skipped by Chromium. Hidden elements inside `[data-intro]` wait at `opacity: 0.01`, not `0`: Chrome does not count a paint at 0 for Largest Contentful Paint (PageSpeed reports `NO_LCP` for a hero that fades in); below the fold they stay at `0` so axe does not flag near-invisible text for contrast.

## Dev inventory (`/dev/tokens`, only in `astro dev`)
`src/dev/tokens.astro` parses `tokens.css` and `utilities.css` and renders every token and class with a live sample and its breakpoint values. It groups by the `/* ---------- Group name ---------- */` header comments and shows a token's trailing `/* note */` (the Figma variable name). Therefore:
- a new token goes **under the header of its group** (or under a new `---------- Header ----------` when a new group is needed) and keeps the `/* Figma name */` comment — it then appears on the page in the right place automatically;
- a new utility goes under the matching header in `utilities.css`; the sample kind is chosen from the class prefix (`flex-`/`spacing-`/`grid-`/`align-`/`justify-` → layout demo, `col-` → width bar, `padding-` → padded box, `text-` → text sample, `icon-`, `border-`, `*-hide`/`*-only` → visibility chip, `theme--dark` → light/dark panel); a class with no known prefix shows "structural" — fine for wrappers;
- after a sync or a new token/utility open `http://localhost:4321/dev/tokens` and check the group.

## Adding to the system
- New token: add to `tokens.css` in the matching group and, if it changes per breakpoint, to the media blocks too. A new Figma text style `desktop/<name>` = three tokens (+ mobile value) + one `text-size-<name>` utility, added together.
- New colour variable in Figma: one `--swatch-*` (Figma name in a comment) + one `--theme-*` role; if the variable has another value on a dark section, add that value to `.theme--dark, .footer` in `utilities.css`. Variables prefixed `alw` get their own `--theme-*-alw-*` token and no dark override.
- New utility: when the same declaration is needed in a second place (reuse first, `class-naming.md`); follow `class-naming.md`; one class = one property group; escape `/` and `%`; add it to the table above.
- The base comes from Figma at the start (`/sync-tokens`); the system is built at the end from the code (`/systemize`: every raw value collected, near-duplicates merged with the user's approval, tokens + utilities written, components rewritten, `src/dev/inventory.md` → `Phase: systemized`). After that a value that the inventory maps to a token uses that token; a value used once stays an arbitrary class in its component.
- Do not introduce Tailwind, SCSS, CSS-in-JS or another utility framework. No `!important`.

## Breakpoints (desktop-first, Webflow-compatible)
`@media (max-width: 991px)` tablet · `(max-width: 767px)` mobile landscape · `(max-width: 479px)` mobile portrait.
