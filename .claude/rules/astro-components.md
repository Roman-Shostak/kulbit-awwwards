---
paths:
  - "src/**/*.astro"
  - "src/data/**"
  - "src/scripts/**"
---

# Astro component rules

## Files & naming
- One component per file, `PascalCase.astro`. The component is one **block**; its name in kebab-case (`Hero.astro` → `hero`) prefixes its element classes (`hero_media`). The root element carries the block class only when the root itself needs a unique scoped style — a section root normally has none. Full methodology: `.claude/rules/class-naming.md`.
- Page sections → `src/components/sections/` (e.g. `Hero.astro`, `Pricing.astro`, `SiteHeader.astro`, `SiteFooter.astro`).
- Reusable small parts → `src/components/ui/`. The template ships none: every project builds its own as the design repeats elements (`Button` first, then `Tag`, `Card`, `Input`, `Logo` …), all in the shape defined under "Buttons and links" below.
- Layouts → `src/layouts/`. Pages → `src/pages/[...locale]/` (kebab-case file = URL slug, one file serves every language; `404.astro` stays in `src/pages/`). Texts → `src/i18n/`. Site data → `src/data/site.ts`, Schema.org → `src/data/schema.ts`. Client-side modules → `src/scripts/`. Dev-only pages → `src/dev/` (never built).
- **URL = site hierarchy.** A page reached from a hub page (a program from `/group-programs/`, a service from `/services/`) lives in the hub's folder: `src/pages/[...locale]/<hub>/<child>.astro` → `/<hub>/<child>/`; the hub stays `<hub>.astro` (a file and a folder with the same name coexist). Flat URLs only for pages with no parent in the navigation. Decide the paths from the page map of the start kit before the first `/new-page`: moving a page after launch costs redirects and re-indexing.
- Import with the `@/` alias: `import Hero from '@/components/sections/Hero.astro'`.

## Component shape
```astro
---
import Button from '@/components/ui/Button.astro'; // built for this project

interface Props {
  title: string;
  items?: string[];
  ctaLabel: string;
  ctaHref?: string;
}
const { title, items = [], ctaLabel, ctaHref } = Astro.props;
---

<section class="section padding-top-lg padding-bottom-sm">
  <div class="container">
    <div class="flex-h/v/v justify-space-between spacing-4xl">
      <div class="col-5 flex-v align-start spacing-md" data-reveal="stagger">
        <h2 class="text-size-h2 text-weight-600">{title}</h2>
        <Button href={ctaHref}>{ctaLabel}</Button>
      </div>
      <ul class="col-6 grid-2/2/1col spacing-md text-size-body-md" data-reveal="stagger">
        {items.map((item) => <li>{item}</li>)}
      </ul>
    </div>
  </div>
</section>

<style>
  /* Only what utilities cannot express. Flat element selectors, values from tokens. */
</style>
```

### Section format — every section looks the same
- Root: `<section class="section padding-lg">` or `section padding-top-lg padding-bottom-sm` (`padding-top-sm/md/lg`, `padding-bottom-sm/md/lg`). The values are the two Figma `section padding/*` variables; nothing else sets vertical padding on a section.
- **No background on sections.** The page background is `--theme-page-bg` on `body`. A dark section adds `theme--dark` (background + the dark values of the `--theme-*` colours, see `styles.md`); its content keeps using `text-color-*`, `Card`, `Tag` unchanged.
- **No block class on the root** unless the root has a unique scoped style that utilities cannot give. Element classes (`hero_media`) still use the component name as prefix.
- **The first section of a page** (under the fixed header) is `section section--hero` — `padding-top: var(--header-height)` from `utilities.css`. Its vertical padding lives on the text column (`<div class="padding-lg">` inside the container) so a full-bleed photo can touch the header edge. A section where a column sets the height (CTA with a bottom-aligned photo) is plain `section` and its text column carries `padding-lg`.
- `.container` is always alone: `<div class="container">` with no utilities and no scoped styles. Layout goes on the wrapper inside it: `<div class="container"><div class="flex-h/v/v justify-space-between spacing-4xl">…</div></div>`. The one exception is `background-slot > container` (no styles either) to anchor a decoration to the container (`images.md` → Decorative vectors).
- Header and footer are passed to the layout through `slot="header"` / `slot="footer"`. The layout already renders `<div class="header-fixed"><header class="header">` and `<footer class="footer">` (padding, background and dark colours from `utilities.css`), so both components start directly with `<div class="container">` — no root block div, no `width-100`, no scoped padding/background. Styles for a wrapper the layout owns go into `utilities.css`, not into a component.

### Classes, behaviour and state
- Maximum three classes per element; more → another wrapper. Typography (`text-size-*`, `text-weight-*`, `text-color-*`) on the parent, children inherit.
- `block_element` class ONLY when that element needs a unique scoped style utilities cannot give; check `utilities.css`, `reset.css`, `base.css` first. A class in the markup without a selector in `<style>` is an error, and so is a selector without a class in the markup. Once the element class exists, its rule may hold the structural layout (`display`, `align-items`, `justify-content`, `position`, `overflow`, sizes) when the three classes are used up; typography, `spacing-*` gaps, colours and radii still come from utilities/tokens (`class-naming.md`).
- **Scoped `display` and visibility utilities never meet on one element**: scoped styles are unlayered and override `display: none` from `desktop-hide`/`mobile-only` (a "Menu" button with a scoped `display: flex` showed on desktop). Visibility goes on a wrapper that carries only utilities.
- Everything a script reads or drives lives in `data-*` attributes (`data-reveal`, `data-reveal="stagger"`, `data-reveal-delay`, `data-intro`, `data-menu-toggle`, `data-popup`); state a script sets is an `is--*` modifier (`is--visible`, `is--hidden`, `is--open`). Attributes and `is--*` do not count towards the three-class limit.

### Shared ui components
- `src/components/ui/` is empty in the template. What the design repeats becomes the project's ui components: `Button` (always, before the first section — the skeleton is below), then typically `Tag` — a pill on the `alw` tokens (same look on dark sections), `white-space: nowrap`; `Card` — `type: default | brand`, `size: md | lg | xl`, `element: div | li | article`, inner layout = the caller's slot content on utilities; `Input`, `Logo`, `SocialLink` …
- Every ui component has the same shape: a `Props` interface extending `HTMLAttributes<'…'>`, `class:list={['block', …]}` + `{...rest}` on the root, only design-driven modifiers as props (`type`, `size`, `element`), scoped styles only for what utilities cannot give, hover = focus-visible on motion tokens, and a block on `/dev/components` with every variant.
- When a Figma node is named `tag`, `card`, `button/*` or `number`, use the matching `ui/` component (extend it if a variant is missing) instead of building it again in the section.
- **Reuse first.** Any element pattern you meet for the second time (or that the design clearly repeats, e.g. a card grid) is a ui component with variants, built once in `ui/` — in both phases; in the development phase its values are raw like everywhere else (`styles.md` → Phases). Never restyle the same pattern in two sections; never create a second component for a pattern that differs only by a prop value (that is a variant).
- All three spread `class` + `{...rest}` onto their root: a parent's scoped classes (`mob-width--100`) and `data-*` attributes reach the element. A prop that chooses the tag is always called `element`, never `as` (`as` crashes the Astro compiler in `astro check`).

### Site data (`src/data/site.ts`)
- Name, legal name, phone, email, location, languages of work, socials, copyright year and the Schema.org entity live only there. Header, footer, `BaseLayout` (`og:site_name`) and `schema.ts` read from it — never repeat them as prop defaults. The footer copyright is `site.legalName || site.name` (the legal entity as printed on the site; `schema.ts` emits it as `legalName` of the Organization).
- Never invent a value or leave an example. Two cases for an empty value:
  - **Text contacts** (a phone or e-mail line in the footer, `<address>`, schema): an empty value is simply not rendered (`{site.phone && <a href=…>}`) — an empty line would read as a bug.
  - **Contacts the design draws as elements** (the row of Telegram/phone/mail icons, messenger buttons, a "Contacts" label): rendered always, so the section matches the frame height and can be checked against Figma before the client sends the data. The link gets `href={site.socials.telegram || undefined}` and a `{/* TODO: … in site.ts */}`, like a button without a target; the accessible name is `sr-only` text inside (valid with or without `href`; `aria-label` on an `<a>` without `href` is a prohibited-ARIA finding in Lighthouse).

### Texts and languages (`src/i18n/`)
- The site's languages are chosen by hand (a switcher, no browser detection): the default language at `/` (no prefix), every other language at `/<lang>/…`. `i18n` in `astro.config.mjs` and `locales`/`defaultLocale`/`localeMeta` in `src/i18n/index.ts` are the same list, set from the start kit. The base is there even for a one-language site, so a second language is a dictionary, not a refactor.
- **Every visible string lives in a dictionary, never in the markup or a literal prop default**: copy, image `alt`, `aria-label`, `sr-only` text, field labels and placeholders, page `title`/`description`. The default language's dictionary (`src/i18n/<lang>.ts`, `defaultLocale`) is the reference shape, one key per component (`hero`, `siteHeader`, `pages.home`); a section reads `const t = useTranslations(Astro.currentLocale).hero` and defaults its props to it (`title = t.title`). Brand names (Telegram), numbers and data from `site.ts` stay out of dictionaries.
- Copy from Figma goes into the default dictionary exactly as designed. Other languages (`const en: Dictionary = { … }`) are written only from the client's translations — never translated by Claude; a language is registered in `dictionaries` (and gets pages, hreflang and sitemap entries) only when its dictionary is complete.
- Internal links go through `localePath(path, Astro.currentLocale)` (`/` → `/en/` on an English page); the language switcher uses `alternates(Astro.url.pathname)`.
- A nav item that leads to a section of the home page is `href: '/#<id>'` in the dictionary (no language prefix — `localePath()` makes it `/en/#about`), and the section carries the kebab-case `id` on its `<section>`. With `motion`, Lenis scrolls to same-page anchors smoothly (`anchors: true`). An item the client has not answered for stays without `href` + `TODO`.
- A page is `src/pages/[...locale]/<slug>.astro` with `export const getStaticPaths = localeStaticPaths` and `t.pages.<page>.title/description`; `lang`, `og:locale`, `hreflang` + `x-default` come from the URL through `BaseLayout`.

## Markup
- HTML first — the full checklist is `.claude/rules/markup.md` (landmarks, headings, lists, links vs buttons, forms, interactive widgets, media, tables, attributes, accessibility, performance, anti-patterns). The essentials: repeated items are `<ul>/<ol>` + `<li>` (never div stacks), one `<h1>` and ordered `<h2>`–`<h4>`, `<a href>` navigates / `<button>` acts, every control labelled, icon-only controls named, decorative SVG `aria-hidden`, toggles with `aria-expanded` + `aria-controls`, `<details>` for accordions and `<dialog>` for popups, `<address>` for contacts, `<time datetime>` for dates.
- Tags have no default size: every heading/paragraph gets a text-style class (`text-size-h2`, `text-size-body-lg`, `text-size-caption`), or inherits one from a parent. Semantic level and visual class are independent (`<h2 class="text-size-h3">`).
- Every image has meaningful `alt` (or `alt=""` if decorative).
- Content comes from the dictionary (`src/i18n/`, see Texts and languages) or props; no invented copy, no self-made translations.
- **The current page's own item** (header, mobile menu, footer): when `localePath(item.href, Astro.currentLocale)` equals `Astro.url.pathname` (both with a trailing `/`), render it as `<a aria-current="page">` **without `href`** — not clickable, out of the Tab order, announced as the current page. Style `.x_link[aria-current='page'] { color: var(--theme-text-brand) }` on an existing token when Figma has no separate state. The header computes the items once (`href` with the language + `current`) and passes them to the mobile menu. A highlighted item in Figma with no real page behind it is still a style demo, not a state; breadcrumbs carry `aria-current="page"` as usual.

## Buttons and links (`src/components/ui/Button.astro`, built per project)
- The project's Button is the first ui component and the reference shape for the others. `href` present → `<a>`; absent → `<button type="button">`. All other attributes (`data-*`, `aria-*`, `id`, `target`, `rel`, `type="submit"`) pass through via rest-spread. Skeleton (values from the Figma `button/*` component: `text-size-button`, `--button-padding-*`, `--theme-button-primary-*`, radius, weight/case):
  ```astro
  ---
  import type { HTMLAttributes } from 'astro/types';
  type Props = (HTMLAttributes<'a'> & { href: string }) | (HTMLAttributes<'button'> & { href?: never });
  const { href, class: className, type, ...rest } = Astro.props;
  const Tag = href ? 'a' : 'button';
  const buttonType = href ? undefined : ((type ?? 'button') as 'button' | 'submit' | 'reset');
  ---
  <Tag href={href} type={buttonType} class:list={['button text-size-button', className]} {...rest}><slot /></Tag>
  <style>
    .button { display: inline-flex; align-items: center; justify-content: center; gap: var(--spacing-xs);
      padding: var(--button-padding-block) var(--button-padding-inline); border-radius: var(--radius-sm);
      background-color: var(--theme-button-primary-bg); color: var(--theme-button-primary-text); white-space: nowrap;
      transition: background-color var(--transition-duration) var(--transition-easing), color var(--transition-duration) var(--transition-easing); }
    .button:hover, .button:focus-visible { background-color: var(--theme-button-primary-bg-hover); }
  </style>
  ```
  Variants from Figma (`button/secondary`, sizes) are `type--`/`size--` modifiers on the same component, never a second file.
- Never `href="#"`. If the design does not say whether a button navigates or performs an action (popup, submit, toggle), ask the user. Actions use a `data-*` attribute (`data-popup="callback"`), not a link. Until the client names the target, `href` stays undefined with a `TODO` comment.

## Accordion (`<details>` + a transition)
- The base is native `<details><summary>` (`markup.md`): works without JS, one item = one `<details>`. The browser toggles the content instantly, which every client reads as broken ("зроби плавну анімацію"), so the component animates it with a small script inside the component — Web Animations API, the four motion tokens, no library:
  - `summary` click → `preventDefault()`; open: set `open`, animate `details` `height` from the summary height to `scrollHeight` (+ `opacity`/`translate` on the content), `overflow: hidden` while `is--animating`; close: animate back, remove `open` in `onfinish`; `is--closing` drives the icon during the close.
  - Duration/easing from `getComputedStyle(document.documentElement)` → `--transition-duration` / `--transition-easing`; ignore a click while `is--animating`.
  - `prefers-reduced-motion: reduce` → no script path, the native toggle.
- Chromium's `::details-content` + `interpolate-size` is not cross-browser yet; when it is, the script goes and the transition moves to CSS.

## Popup (`<dialog>` + a transition)
- The base is native `<dialog>` opened with `showModal()` (`markup.md`). The browser shows and removes it and its `::backdrop` instantly, so the component animates both:
  - Hidden state on the `dialog`: `opacity: 0; transform: translateY(var(--size-24))`; on `::backdrop`: `opacity: 0`. Both have `transition` on `--transition-duration` / `--transition-easing`; `.is--open` (and `.is--open::backdrop`) sets `opacity: 1; transform: none`.
  - Open: `showModal()` → `dialog.focus()` → `getBoundingClientRect()` (commits the hidden state, otherwise no transition runs) → add `is--open`.
  - Close (×, a click on the backdrop, Esc via the `cancel` event with `preventDefault()`): remove `is--open`, `await Promise.allSettled(dialog.getAnimations({ subtree: true }).map((a) => a.finished))`, then `close()` if `is--open` did not come back. The `close` event removes `is--open` (a close the browser forces).
  - `<dialog tabindex="-1">` and the `dialog.focus()` above: `showModal()` would otherwise focus the first control (the × button), and Safari after a touch shows it with the `:focus-visible` ring and hover colour; the panel itself is not interactive, so its `:focus-visible` gets `outline: none`. Tab still leads to ×, Esc works.
  - A `[data-popup]` button inside the mobile menu closes the menu like a link does (`closest('a[href], [data-popup]')` in the menu's click handler); otherwise the popup opens over the menu and the visitor lands back in it.
  - No `display` on the `dialog` itself (a utility or scoped `display` beats the UA `display: none` of the closed dialog — layout goes on a wrapper inside); `margin: auto` in the scoped rule (`reset.css` zeroes the UA centring); the page scroll lock is `html:has(dialog:modal)` in `utilities.css`; the dialog carries `data-lenis-prevent` so its own panel scrolls under `motion` (the module stops Lenis while a modal dialog is open).
  - `prefers-reduced-motion` needs nothing extra: `reset.css` shortens every transition (its selector includes `*::backdrop`), the close waits ~0 ms.

## Interactive states
- **Nothing changes instantly.** Every visible change — hover / focus / active, an `is--*` state, `aria-invalid`, and everything that appears or disappears (popup + backdrop, menu, accordion, tabs, tooltip, toast, form message) — is a `transition` or `animation` on the motion tokens: `--transition-duration` + `--transition-easing` for interface changes, `--transition-duration-slow` + `--transition-stagger` for reveal and intro. Toggling `hidden`/`display` alone is a finding: animate `opacity`/`transform` (or `height` for accordions) and switch visibility at the end. Exceptions: the `:focus-visible` outline (appears at once for keyboard users) and `prefers-reduced-motion`.
- Every `a`, `button` and form control has hover and focus styles.
- Without separate states in Figma or from the user, hover and focus are IDENTICAL, one selector: `.x:hover, .x:focus-visible { … }`.
- Defaults when Figma has none: text links change `color` to `--theme-text-brand`; the logo link fades (`opacity: 0.7`); coloured icons (social links) grow (`transform: scale(1.1)`); inputs change `border-color`. The class goes on the `<a>` (`site-header_logo`, `site-footer_social`, `menu_social`).
- Transitions only from motion tokens: `transition: color var(--transition-duration) var(--transition-easing)`. Other durations/easings only when Figma or the user specify them.
- State colour from an existing token (`--theme-text-brand`, …). If the design has no value: development phase → a raw value marked `/* TODO: not in Figma */`; systemized phase → a `--theme-*` token with that comment, never a raw hex.
- The global `:focus-visible` outline in `base.css` stays.

## Forms
- The parent column has no `align-start` (it would shrink the form to the inputs' natural width); `align-start` goes on the `<form>` itself so the button does not stretch.
- Inputs sit in a wrapper with a width (`col-4`, or an arbitrary `width--460/460/100%` when the tablet frame keeps a fixed width); each input is an element class (`cta_input`) styled with `--theme-input-bg/border/text`, height from the design, `::placeholder` in `--theme-input-text`, hover/focus via `border-color`; every input has a `<label>` (`sr-only` if the design has none).
- The submit button gets `mob-width--100` (utility in `utilities.css`) when the mobile frame stretches it.
- **Browser autofill = the Figma `filled` state**: `.input:autofill` (one selector, never in a list with `:-webkit-autofill` — a selector the browser does not know invalidates the whole rule) with `box-shadow: inset 0 0 0 100vmax var(--theme-input-bg)` (paints over the browser's background, which is `!important`), `-webkit-text-fill-color` and `caret-color` = the filled text colour, `border-color` of the filled state; placed before `:focus` so the focus border wins; an `aria-invalid` variant with the error colours.
- **The phone field is a plain `type="tel" autocomplete="tel"` — no JS mask.** A script that rewrites the value (adds «+», groups digits, guesses a country code) turns the number Safari AutoFill pastes — it strips the country code («+38095…» arrives as «095…») — into a number of another country, and nobody can guess the missing code. When the client asks for a mask, say this first; if a country code is required, add a separate country select before the field, never a mask in one field.
- **Text fields are at least 16 px on touch devices**: `@media (pointer: coarse) { .input { font-size: max(1rem, var(--font-placeholder)) } }` in the field component, otherwise iOS Safari zooms the page on focus (the fluid scale takes the field font below 16 px on phones and narrow tablets). Never `maximum-scale=1` in the viewport: Android then blocks pinch zoom (an accessibility failure).
- Every form with personal data has the `Checkbox` `name="consent" required` before the button (text in the section's dictionary; a link to the privacy policy page when the site has one).
- The handler is the template's Cloudflare Worker (`worker/index.ts`, `POST /api/form` → D1 + Telegram / e-mail), connected with `/cloudflare-form`: the `<form>` becomes the ui component `Form` (copied into `ui/` from the skill's `assets/`: `<Form name="cta" class="flex-v align-start spacing-lg">` — hidden fields, honeypot, status message, `src/scripts/form.ts`; `required` on the name input), state texts in the `form` dictionary. Until the skill has run, `action` stays empty with a `TODO: form handler` comment and `method="post"`.

## Styling
- Layout with utility classes from `src/styles/utilities.css` (`flex-v`, `spacing-md`, `col-6`, `grid-3/2/1col`); arbitrary values (`spacing-40/40/24`, `col-6/3/1`, `text-size-20/20/18`) as classes declared in the component's `<style>` per `class-naming.md`.
- Priority: token utility (value bound to a Figma variable) → arbitrary class from `--size-N` (raw number) → nothing else. Before writing a scoped rule check `utilities.css`, `reset.css`, `base.css` — do not repeat what is already there.
- **Values depend on the phase** (`styles.md` → Phases, the `Phase:` line of `src/dev/inventory.md`): development — exactly as in Figma, sizes via `var(--size-N)` / `calc(<px/16>rem * var(--fluid-scale))`, colours raw, only the base tokens; systemized — the rules below.
- Unique visuals in the scoped `<style>` block on `block_element` selectors, using tokens (`var(--spacing-lg)`, `var(--size-24)`, `var(--theme-text)`), never raw px/hex. Sizes from the desktop Figma frame map 1:1 to `--size-N`.
- No inline `style=""` attributes. No `!important`.
- `justify-space-between` / `justify-space-around` always together with a `spacing-*`. For a row that stacks on tablet (`flex-h/v/v`) pick a spacing token that already changes per breakpoint (e.g. `spacing-4xl`) so the stacked gap matches the tablet/mobile frames; declare a custom `spacing-20/0/0` only when the gap must disappear (text column next to a full-bleed photo).

## Responsive
- Desktop-first, breakpoints `991px`, `767px`, `479px`.
- **Tablet and mobile are part of building a section**, not a second pass: when the Figma file has the tablet and mobile frames, the section is built for all three at once. For tablet/mobile `get_metadata` (sizes and positions of the children) is usually enough; `get_design_context` only for instances (CTA, footer) and the hero.
- Checklist of transitions: a row → `flex-h/v/v` (stacks on tablet) or `flex-h/h/v` (only on mobile); grids `grid-4/2/1col`, `grid-2/2/1col`, `grid-4/1/1col`, `grid-2/1/1col`; `col-N` becomes 100 % on tablet; a full-width mobile button via the `mob-width--100` utility; centring on mobile via component-declared modifiers `mob-align--center`, `mob-justify--center`, `mob-text-align--center` (a second component needing one moves it to `utilities.css`), and `text-align-right/left/center`.
- **Fixed tablet columns.** `col-N` utilities are 100 % on tablet. When the tablet frame keeps a fixed column (`container width/5col` = 580, a 460 px form), declare a responsive class in the component: `.col-5\/5\/2 { width: var(--col-5) }` → tablet `var(--t-col-5)` → mobile `var(--m-col-2)`; `sync-tokens` fills `--t-col-N` from the tablet frame's `container width/Ncol` variables. If you keep 100 % instead, list the deviation in the reply.
- Show/hide per breakpoint = a wrapper `<div>` with a visibility utility (`desktop-only`, `mobile-only`, `desktop-hide`, `tablet-hide`, `landscape-hide`, `mobile-hide`). Never custom `@media` for visibility.
- If Figma has no tablet/mobile frames, do not invent "smart" reflow. Default for a header: desktop navigation wrapped in `desktop-only`; the mobile menu is built separately when its design exists.

## Images & assets
- Rules in `.claude/rules/images.md`. In short: sources 2x in `src/assets/<folder>/kebab-case.ext`; `<Picture formats={['avif','webp']} class="fill-box">` with `width` = the largest 1x size across breakpoints and `alt`; the box (`aspect-ratio` or height, `border-radius-*`, `overflow-hidden`) crops per breakpoint; photos stay in flow inside `.container`, full-bleed via negative `--container-padding` margins; SVG icons imported as components; decorative vectors per breakpoint anchored to the container; OG via `src/assets/og/`, favicon via `public/favicon.svg` + `pnpm favicon`.
- `public/` only for files that must keep their exact URL (favicons, robots.txt, fonts, generated `og/`).

## Motion (`src/scripts/motion.ts`, `<BaseLayout motion>`)
- Off by default (zero JS). When the client asks for animations, the page passes `motion` to `BaseLayout`; the module brings Lenis smooth scrolling (also to same-page anchors: `anchors: true` plus the module cancels the browser's own jump, so there is no one-frame flash at the target; the skip link still focuses `<main tabindex="-1">`), reveal on scroll, the hiding header and the hero intro. Vocabulary: a client's "preloader for the hero" means this intro sequence (elements appearing one after another), not a splash screen.
- **In an animated project every public page passes `motion`** (the 404 page at the client's choice), even an empty one, and the first section of every page carries `data-intro` with its elements in `data-reveal-delay` order — a page opened from another one must appear with the same intro. A section that is ordinary on the home page and first on another page gets a `hero` prop that switches its `stagger` to the ordered intro. Without animations: `motion` on no page.
- The hiding header alone (no Lenis, no reveal): `<BaseLayout hidingHeader>` loads only `src/scripts/header.ts`. It hides after 40 px of scrolling down and returns after 40 px of scrolling up (counted from the last change of direction, so trackpad jitter never toggles it), never near the top, while the menu is open or during the intro; keyboard focus inside a hidden header brings it back (`utilities.css`). `motion` includes it.
- Reveal: `data-reveal` on a wrapper (one element), `data-reveal="stagger"` on a parent (children one by one, up to 8), `data-reveal-delay="1…5"` for the ordered hero intro (tag → title → text → button → photo). The hero section gets `data-intro`; the header stays hidden only until the intro starts and slides in together with its first element — never after the whole sequence or the hero photo.
- Never put `data-reveal` on an element with its own scoped `transition` (the button, inputs): scoped styles are unlayered and override the utility animation — reveal a wrapper `<div>` instead.
- Reveal styles are gated by `[data-motion]` on `<html>`: without the module (or with `prefers-reduced-motion`) everything is visible and static.
- Every `transition` / `animation` uses only the four motion tokens: `--transition-duration`, `--transition-easing`, `--transition-duration-slow` (reveal, intro), `--transition-stagger` (delay step).
- A header that opens a mobile menu dispatches `document.dispatchEvent(new CustomEvent('menu:toggle', { detail: { open } }))` and keeps `aria-expanded` on `[data-menu-toggle]`: the module stops scrolling and never hides the header while the menu is open. A modal `<dialog>` stops Lenis the same way (the module watches the `open` attribute); the menu panel and every dialog carry `data-lenis-prevent` so their own content scrolls.

## Step scroll (`src/scripts/kulbit/`, `<BaseLayout steps>`, GSAP)
- A TypeScript port of the production navigation of the client's Webflow build (`Roman-Shostak/kulbit-webflow`, branch `prod`, `src/01…13-*.js`, `docs/adr.md` — read the ADRs before changing behaviour): no free scroll, the sections **stack** (the next one slides in from below over the current one, going up it slides away), one gesture = one step of the current section or one section. Numbers are the Webflow ones in `config` (`app.ts`: `scrollDuration 0.7`, `stepDuration 0.6`, `power2.inOut`, `accelRatio 1.4`, `minVelocity 60`, `anchorDuration 1`) — never re-tuned to the motion tokens. It replaces `motion` (no Lenis, no `data-reveal`/`data-intro`).
- Modules: `index.ts` entry (init order + the list of what is left to port, per section) · `app.ts` state, config, `SectionController`, `registerSectionBuilder` · `observer.ts` wheel/touch through GSAP Observer (trackpad inertia filtered by velocity, direction by event type, no `pointer`) + keyboard (ArrowDown/PageDown/Space next, ArrowUp/PageUp/Shift+Space back; not in fields or dialogs) · `sections.ts` registration, stacking, reveal steps, desktop attribute timelines, `goToSection`, `advance`, `autoAdvanceTo`, `goToSectionStep`, position persistence (`sessionStorage`) · `hero.ts` tablet/mobile hero · `responsive.ts` `gsap.matchMedia` (≥ 992 desktop, 768–991 and ≤ 479 the tablet hero, 480–767 nothing) + the landscape-phone popup · `video.ts` · `navigation.ts` · `hero-height.ts` · `button-border.ts` · `scramble.ts` (ADR-017: `[data-kulbit-scramble]` — ScrambleText, `[data-kulbit-typewriter]` — letter by letter; written when 60 % in the viewport, erased when it leaves it, coloured spans kept, the height fixed; controllers in `scrambles` for sections that drive them; static under `prefers-reduced-motion`).
- **DOM contract.** `<BaseLayout steps>`: `data-steps` on `<html>` (inline script, before the first paint) → `.wrapper` becomes the fixed viewport and `<main data-scenes>` the 100vh stacking container (`utilities.css`); the module makes every `[data-kulbit-section]` absolute, 100vh, `z-index` = its index, in DOM order (later sections and the footer carry the same attribute; `data-section-name="<name>"` makes it a button target); each one gets the page background, since it covers the previous one. The hero is always section 0 (its height = `visualViewport` height). Without JS the page scrolls as usual.
- **Attribute timelines** (the Webflow API, desktop ≥ 992): on any element inside a section — `data-kulbit-y="<yPercent>"`, `data-kulbit-fade="<autoAlpha>"`, `data-kulbit-scale="<n>"` + `data-kulbit-scale-from="<n>"`, `data-kulbit-order="0|1|…"` (phases one after another; one phase plays together). Step 0 = the markup state, step 1 = the targets; elements outside every section (the header, `[data-kulbit-header]`) belong to the hero. Tablet/mobile read the `-tablet` variants (`data-kulbit-y-tablet` …) in the hero choreography: step 1 the attributes + `[data-kulbit-sound]` to the screen centre; step 2 `[data-hero-video]` shrinks to a 16:9 band and section 2 slides in under it; step 3 section 2 covers = section 1. Steps 2–3 appear by themselves once a second section exists. `[data-kulbit-step]` = reveal steps (one gesture shows the next).
- **Video:** `[data-kulbit-video]` holds a native `<video muted loop playsinline>` (cover in CSS); it plays only while its section is current, the sound button `[data-kulbit-sound]` of the same section toggles `muted` (icons `[data-sound-icon="on|off"]`, `aria-pressed`); `prefers-reduced-motion` → no autoplay, the sound button starts it.
- **Buttons:** `data-target-section="<index|name>"` (+ `data-target-step`) anywhere; a missing target is a no-op. `[data-kulbit-border]` draws the blue hover border from the cursor.
- **A new section with its own steps** (a port of its `build*` from the source): in the section's `<script>`, `registerSectionBuilder((mode) => { … section.controller = { step, prepare, enter, collapse, reset, dispose, state } })` from `@/scripts/kulbit/app`. The builder runs inside the breakpoint's `gsap.matchMedia` context (`mode` = `desktop | tablet | mobile`; GSAP reverts its sets on a breakpoint change, `dispose` removes the rest); `step(dir)` returns `false` at its edge and the engine moves to the neighbouring section; `prepare`/`enter` = slide-in start/end, `collapse` = sliding away, `reset(toEnd)` = instant state. Section 1's controller also gets `enter`/`prepare` from the tablet hero hand-off. The markup renders the section's natural state; never invent steps — they come from the source or the user.
- The landscape popup is `[data-kulbit-landscape-popup] hidden` (its logic is ported, the markup comes with its design). `hidingHeader` has no effect here (nothing scrolls).

## Page shell (`src/layouts/BaseLayout.astro`)
- `title` and `description` are required props — real text in the site language (title ≤ 65 characters, description ≤ 160), never "Home" or a placeholder. `lang` and `og:locale` come from the page's language (`Astro.currentLocale`, `src/i18n`); `hreflang` links for every built language + `x-default` are added once more than one language is built. `noindex` adds `<meta name="robots" content="noindex, nofollow">` (dev pages, thank-you pages).
- `ogImage="/og/<page>.jpg"` for every public page (source in `src/assets/og/<page>.jpg`).
- `schema={{ type: 'CollectionPage' }}` picks the WebPage subtype when one fits (`CollectionPage` for a listing of services/programs, `AboutPage`, `ContactPage`, `FAQPage`); default `WebPage`.
- `schema={{ nodes, mainEntityId }}` adds page-scoped Schema.org nodes (a `Service`, an `Article`) built only from content visible on the page; the site-wide nodes come from `site.ts` automatically. `schema.breadcrumbs` gives inner pages their trail (BreadcrumbList); `@id` scheme and rules in `src/data/schema.ts` and `.claude/skills/seo/SKILL.md`; validate with `pnpm seo` after `pnpm build` (title/description lengths, `<h1>`, canonical, OG, JSON-LD).
- `site` in `astro.config.mjs` is required: canonical, `og:url`, `og:image` and the graph are built from it (in a static build `Astro.url` only carries the pathname).
- The head links three favicons (`/favicon.ico`, `/favicon.svg`, `/apple-touch-icon.png`) — `public/favicon.svg` from the client + `pnpm favicon`; with a light/dark pair the SVG link becomes two, one per `prefers-color-scheme` (`images.md` → Favicon). The body starts with the `.skip-link` to `<main id="main">`; keep both.

## Dev pages (`src/dev/`, only in `astro dev`)
- `/dev/tokens` lists every token and utility straight from `tokens.css` / `utilities.css` (grouped by the `/* ---------- Group ---------- */` headers) — nothing to maintain there; `/dev/components` is the hand-maintained showcase of every component with every variant.
- **Every new ui component, every new variant (a `type--`/`size--` modifier, a new prop value) and every new section is added to `src/dev/components.astro` in the same change**: import it, push its name to the `showcasedUi` / `showcasedSections` registry, add one `dev_variant` figure per prop combination on `dev_stage` (and on `dev_stage theme--dark` when colours differ on dark sections); sections render inside `dev_section-frame` in design order (header in `<div class="header">`, footer in `<footer class="footer">`).
- The page prints a red notice for a file in `ui/` or `sections/` that is not in its registry: that notice is unfinished work, never leave it. Check `http://localhost:4321/dev/components` after adding a component.
- The routes are injected by the `devPages` integration in `astro.config.mjs` only for `astro dev`; `astro build` never emits them (`BaseLayout noindex` on top). Dev files (`src/dev/*`) are tooling: the class rules above do not apply to their own chrome, but the samples must use the real utilities and components.

## Client-side JavaScript
- Default is zero JS. Add a `<script>` only when the design needs interactivity (menu toggle, slider, accordion), and keep it inside the component; page-wide behaviour goes to `src/scripts/` and is enabled from the layout.
- No UI framework (React/Vue/Svelte) unless the user asks for it.

## Astro gotchas (each one cost an iteration)
1. A prop named `as` crashes the compiler in `astro check` (`GetPropsType` panic) — call it `element`. The same bug hits any `as` attribute or object key written in an `.astro` file (a font `<link … as="font">`): the file's `Props` become unused and `Astro.props` turns `any`. Keep such attributes in a `.ts` module and spread them (`src/layouts/font-preloads.ts`).
2. `<Picture>` / `<Image>` put `class` on the `<img>`, and the constrained layout caps the image at its `width` prop. Use the `fill-box` utility (`class="fill-box"`): it lifts the cap, fills the box and stretches the `<picture>` wrapper too (`global.css` places Astro's `astro.images` layer below `utilities`). No `:global(picture)`/`:global(img)` height rules in sections.
3. A `<script>` with attributes (JSON-LD, `type`, `src` to `public/`) needs `is:inline`; a bare `<script>` is bundled TypeScript.
4. Component-scoped styles are unlayered and win over every utility: a scoped `transition`, `background` or `width` on an element overrides `spacing-*`, `data-reveal` animation etc. Plan wrappers instead of fighting the cascade.
5. `astro.config.mjs` runs under `@ts-check`: `fonts[].options.variants`, `src` and `unicodeRange` must be tuples — use the `variants()` helper already in the config.
6. In a static build `Astro.url` only carries the pathname; absolute URLs come from `Astro.site` (so `site` must be set).
7. A parent's scoped styles reach a child component's root only when the child spreads `class` + `{...rest}` onto it (`data-astro-cid-*` travels with them). Do this in every ui component (the Button skeleton above does).
8. Conditionally rendered `<script>` tags are still bundled and are emitted only when the condition is true (`{motion && <script>…</script>}`) — that is how the layout enables the motion module.
9. `504 (Outdated Optimize Dep)` for `/node_modules/.vite/deps/…` in the browser console is Vite's stale pre-bundle cache after a new dependency entered the import graph (the first `<BaseLayout motion>` pulls in `lenis`), not a bug in the module. Restart the dev server: `pnpm astro dev stop && rm -rf node_modules/.vite && pnpm astro dev --background`. Do the same after every `pnpm add`.
10. `<Font preload>` preloads every subset file of the family (4 × weights) with high priority against the hero image; the layout builds one preload per weight from `fontData` instead (snippet in `BaseLayout.astro`).
