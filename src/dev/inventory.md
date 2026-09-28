# Design inventory

Phase: systemized

The phase decides how values are written (`.claude/rules/styles.md` → Phases):
- `development` — only the base from `/sync-tokens` is a token (frames, side padding and grid, fonts, 2–4 main
  colours); every other value is written exactly as in Figma in the component's scoped styles.
- `systemized` — `/systemize` has built the system from the finished site: tokens and utilities first, a value
  used a second time becomes a token + utility (`class-naming.md` → Reuse first).

Systemized on 2026-09-28 from the finished site. The source of every value is the approved Webflow build
(kulbit-gsap export: 1rem = 16px on each frame) — the names come from its classes and colour variables, and its
two-decimal rem roundings (18px → 1.13rem = 18.08px) are kept exactly, so the site did not move a pixel.

## Frames

| Breakpoint | Frame | Frame width | Container padding |
| --- | --- | --- | --- |
| desktop (≥ 992) | Figma frame 13 / the Webflow build | 1920 × 1080 | 85 |
| tablet (480–991) | Hero 744 × 1133 | 744 | 32 |
| mobile (≤ 479) | 390 × 844 | 390 | 16 |

`--max: none` — the site keeps scaling at every width (the client's choice).

## Fonts and weights

| Family | Weights | Files |
| --- | --- | --- |
| Decima Mono X (`--font-primary`) | 400, 700 | `src/assets/fonts/decima-mono-x-*` |
| PP Monument Wide (`--font-secondary`) | 400, 800 (the Black file, weight class 800) | `src/assets/fonts/pp-monument-wide-*` |

## Colours (Webflow `--colors--*` → swatch → role)

| Webflow | Value | Swatch | Roles |
| --- | --- | --- | --- |
| black | `#000000` | `--swatch-black` (+ `-a0`, `-a65`) | `--theme-page-bg`, `--theme-text-inverse`; `--theme-fade`, `--theme-vignette` |
| white-10 | `#fdfcfc` | `--swatch-white-10` (+ `-a5/-a7/-a10/-a12/-a15`) | `--theme-text`, `--theme-icon`; `--theme-track`, `--theme-ring-*`, `--theme-player-seek/-volume` |
| white | `#ffffff` | `--swatch-white` | `--theme-illustration` (radar and chart strokes) |
| black-20 | `#404040` | `--swatch-black-20` | `--theme-text-secondary` → `text-color-secondary` (the grey half of the statements) |
| black-30 | `#252525` | `--swatch-black-30` | `--theme-border` |
| — (raw in its classes) | `#171717` | `--swatch-graphite` | `--theme-frame` (button and tile frames) |
| — (raw in its classes) | `#0f0f0f` | `--swatch-ink-a0/-a85/-a95` | `--theme-player-shade` |
| blue | `#62b0ff` | `--swatch-blue` | `--theme-text-accent` → `text-color-accent`; `--theme-icon-secondary` (squares, arrows, the logo square) |
| red | `#ff4444` | `--swatch-red` | `--theme-text-brand` → `text-color-brand`; `--theme-icon-brand` (red squares, chart line) |

Note: `#404040` on black is 2.03:1 — below WCAG AA for text. It is the design's value (kept); changing it is one
line: `--theme-text-secondary` in `tokens.css` (≥ `#767676` passes 4.5:1).

## Text styles

Shared (token + utility):

| Utility | Webflow class | Desktop / tablet / mobile | Uses |
| --- | --- | --- | --- |
| `text-size-h1` | `.text-size-h1` | Monument 66.08 / 1.3 / .03em → 60 → 40 / 1.2 | Hero h1, 404 |
| `text-size-h3` | `.text-size-h3` | Monument 28 / 1.3 / .03em → 32 → 20 | WorkingProcess stages |
| `text-size-section-h2` | `.text-size-section-h2` | Monument 32 / 1.3 / .03em → 28 → 23.04 | 4 statements |
| `text-size-section-label` | `.text-size-section-label` | Decima 16 / 1.1 / .03em → 12.96 | 6 section labels, SectionNav, footer row |
| `text-size-hero` | `.text-size-hero` | Decima 16 / 1.37 | Hero, OurClients, WorkingProcess, 404 |
| body (`--font-default`) | `body` | Decima 16 / 1.1 | the page default |

One-offs (one element each) — declared in their component under the Webflow name, raw values:
`text-size-card-title`, `text-size-services-paragraph`, `text-size-services-label` (OurServices);
`text-size-more-soon` (Projects); `text-size-footer-label`, `text-size-footer` (SiteFooter);
`text-size-production-label`, `-production-head`, `-production-card`, `-production-text` (TraditionalProduction);
`text-size-process-label`, `-process-week`, `-process-number`, `-process-category`, `text-size-list` (WorkingProcess);
`text-size-player` (ProjectVideo); `text-size-button`, `-button-hero`, `-button-second` (Button).

## Spacing, sizes, shape, motion

| Token · utility | Desktop / tablet / mobile | Replaced |
| --- | --- | --- |
| `--spacing-xs` · `spacing-xs` | 8 | gap 8 ×5 |
| `--spacing-sm` · `spacing-sm` | 12 | gap 12 ×2 |
| `--spacing-md` · `spacing-md` | 16 | gap 16 ×5 (`spacing-16`) |
| `--spacing-lg` · `spacing-lg` | 24 | gap 24 ×3 |
| `--spacing-xl` · `spacing-xl` | 32 | gap 32 ×4 (`spacing-32`) |
| `--spacing-2xl` · `spacing-2xl` | 48 / 48 / 24 | `spacing-48/48/24` ×4 |
| `--spacing-3xl` · `spacing-3xl` | 64 | gap 64 ×2 |
| `--spacing-head` · `spacing-head` | 48 / 64 / 24 | `spacing-0/64/24` ×3 (48 on desktop is the space-between minimum) |
| `--section-padding-md` · `padding-md`, `padding-top-md`, `padding-bottom-md` | 64 / 48 / 24 | `padding-64/48/24` ×4, `padding-bottom-64/48/24` ×2, the hero |
| `--footer-padding-top/-bottom` | 80·80 / 16·100 / 32·64 | `.footer` + SiteFooter's min-height (one source) |
| `--width-statement` | 695.04 / 556.96 / auto | `.width-695-557-a` ×2 |
| `--icon-arrow` | 56 / 56 / 40 | `.icon-56-56-40` ×2 |
| `--radius-sm` · `border-radius-sm` | 8.96 | 8.96 ×13 + 9 ×4 (merged: −0.04 px) |
| `--radius-md` | 10.08 | 10.08 ×5 |
| `--border-width-sm` / `-md` | 1px / 2px | every border, outline and hairline |
| `--transition-duration` / `-easing` / `-duration-slow` | 0.3s / ease / 0.6s | Square 0.3s ease, OurClients 0.3s / 0.6s ease, every hover |

The step scroll (`src/scripts/kulbit/app.ts` → `config`) keeps the Webflow build's own durations and easing.

## One-offs (raw values left on purpose)

- Layout sizes of single elements (widths, offsets, heights of the charts, the radar, the hero blur …) as
  `calc(Nrem * var(--fluid-scale))` with the Webflow rem, or `var(--size-N)` where exact.
- Paddings that have no token on every breakpoint (Traditional head/card, OurServices card, Button variants).
- `backdrop-filter: blur(36px)` (the hero sound button: a fixed blur), `max(24px, …)` (the minimum touch target).

## Removed with /systemize

- Template placeholders: `text-size-h2/h4/h5/subheading-*/body-*/caption/link/button/placeholder` (and their
  tokens), `spacing-tiny/4xl`, `padding-sm/lg` (+ top/bottom), `icon-xs…xl`, `u-svg`, `u-path`, `fill-cover`,
  `border-radius-xs/lg/xl`, `border-width-*` utilities, `text-color-error`, `text-weight-300/500/600/900` (no font
  files), `--line-height-*` / `--letter-spacing-*` scales, `--button-padding-*`, `--icon-height-*`,
  `--radius-xs/lg/xl/full`, the unused swatches and theme roles (section/card/button/input backgrounds, error).
- `theme--dark` (the whole site is dark; the dev pages show every component on the page background).

## ui components

`Button` (outline · arrow · second · second-footer · showreel), `Logo`, `Square`, `ProjectVideo`, `ProgressLine`
(extracted with /systemize: the section progress line of OurClients, Projects, OurServices, TraditionalProduction,
IntroScreen + `src/scripts/kulbit/progress-line.ts`).
