---
paths:
  - "src/**/*.astro"
  - "src/styles/**"
---

# Class naming methodology

Every class written in markup or CSS follows this system. It is the user's own methodology
(Webflow-derived); the predefined utility dictionary lives in `.claude/rules/styles.md`.

## Syntax
- lowercase only, latin letters and digits. No spaces, no camelCase, no BEM `__`.
- `-`   joins words of ONE entity: `mini-course`, `text-align-center`
- `_`   block → element: `card_media`
- `/`   separates breakpoint values: `flex-h/v/v`, `spacing-40/40/24`
- `--`  modifier (combo class) `type--big`; a LEADING `--` marks a unique mix: `--home--about`
- The word `gap` never appears in a class name. Spacing between children is `spacing-*`.

## Breakpoint values with `/`
Order is always **desktop / tablet / mobile** (≥992 / 991–480 / ≤479).
- **One value** = all breakpoints: `spacing-25`, `flex-h`, `grid-3col`.
- **Three values** = one per breakpoint: `spacing-40/40/24`, `col-6/3/1`, `grid-3/2/1col`, `text-align-right/left/center`.
- **Two values are forbidden.** If only mobile differs, repeat the desktop value: `spacing-25/25/15`.
- In CSS the slash is escaped: `.spacing-25\/25\/15 { … }`. `%` too: `.width--100\% { … }`.

## The kinds of classes

| Kind | Pattern | Examples | Where its CSS lives |
| --- | --- | --- | --- |
| Utility (службовий) | `word-word`, no children, global | `section`, `container`, `flex-v`, `spacing-md`, `grid-3/2/1col`, `col-6`, `text-size-h2`, `mobile-hide`, `theme--dark`, `fill-box` | `src/styles/utilities.css` (predefined) or the component `<style>` (arbitrary values) |
| Block | `name` / `word-word` | `hero`, `card`, `mini-course` | component `<style>`; present in the markup only when the root has a scoped rule |
| Element | `block_element` | `hero_media`, `card_media`, `mini-course_title` | component `<style>` — an element class exists ONLY if it has a selector there |
| Modifier (combo) | `name--value`, only together with its base class | `card type--big`, `grid rows--equal`, `section section--hero` | component `<style>` (or `utilities.css` for `section--hero`, `theme--dark`), selector `.card.type--big` |
| State (set by a script) | `is--value` | `is--visible`, `is--hidden`, `is--open` | `utilities.css` for layout-owned wrappers, otherwise the component |
| Mix (unique combo) | `--name--value`, used in exactly one place | `--home--about`, `--section--about`, `--page--contacts`, `--is--last` | the component/page that owns that one place |
| Breakpoint modifier | `tablet-name--value`, `landscape-name--value`, `mob-name--value` | `tablet-position--relative`, `mob-width--100`, `mob-align--center`, `mob-justify--center`, `mob-text-align--center` | `mob-width--100` in `utilities.css`; others in the component `<style>` inside the matching `@media` — the moment one is declared in a second component it moves to `utilities.css` |

## How many classes and where
- **Maximum three classes per element.** Need more → add a wrapper `<div>` and move part of the classes to it.
  Layout on one level, typography on another. The limit counts the classes written in one place: a ui
  component's root counts its own classes (`button text-size-button type--stroke`), the caller's `class`
  that it spreads on is counted on the caller's side.
  ```html
  <!-- wrong: 5 classes on one element -->
  <a class="site-header_link text-size-body-sm text-weight-500 text-style-uppercase text-color-secondary">
  <!-- right: typography on the parent, children inherit -->
  <ul class="text-size-link text-weight-500 text-color-secondary">
    <li><a class="text-style-uppercase">…</a></li>
  ```
  Centering text inside a flex row: do not add `text-align-center` to the row, wrap it:
  `<div class="text-align-center"><div class="flex-h align-center justify-space-between spacing-sm">…</div></div>`.
- **Behaviour and state are not classes.** Everything a script reads lives in `data-*` attributes (`data-reveal`, `data-reveal="stagger"`, `data-reveal-delay="2"`, `data-intro`, `data-menu-toggle`, `data-popup="callback"`); state a script sets is an `is--*` modifier (`is--visible`, `is--hidden`, `is--open`). Neither counts towards the three-class limit, so a button or an input never runs out of room for behaviour.
- **`.container` is always alone**: `<div class="container">` with no other classes and no scoped styles. Layout goes on the next wrapper inside it. The only exception: `background-slot > container` (still without styles) to anchor a decoration to the container.
- **`justify-space-between` / `justify-space-around` always come with a `spacing-*`** (utility, or `gap` from a token in scoped CSS). `space-between` is the maximum distance, `spacing` the minimum so items never touch. For rows that stack on tablet use a token that already changes per breakpoint (`spacing-4xl`); a custom `spacing-20/0/0` only when the gap must vanish where the row stacks.
- **Visibility per breakpoint = a wrapper with a utility** (`desktop-only`, `mobile-only`, `desktop-hide`, `tablet-hide`, `landscape-hide`, `mobile-hide`). Never a custom `@media` for showing/hiding.
- **A hidden element must not get `display` from a scoped style.** Scoped `<style>` blocks are unlayered and beat every utility, so `display: flex` on `.site-header_menu` silently overrides `display: none` from `desktop-hide` — the element shows on every breakpoint and nothing reports it. Either the element takes its `display` from utilities only (`flex-h`, `flex-v`, `align-center` …), or the visibility utility goes on a wrapper `<div>` that carries nothing but utilities. (Among utilities the visibility ones win: they stand at the end of `utilities.css`.)

## Blocks and elements in Astro components
- One component = one block. The block name is the component file name in kebab-case: `Hero.astro` → `hero`, `ProductCard.astro` → `product-card`. Element classes use it as prefix (`hero_media`) even when the root carries no `hero` class — the root gets the block class only when it needs a scoped rule of its own (a section root normally is just `section padding-lg`).
- **An element class (`block_element`) is added ONLY when that element needs a unique scoped style that utilities cannot give.** If `flex-h align-center spacing-sm` already produces the result, that is all — no `hero_list`. Before writing a scoped rule check `utilities.css`, `reset.css`, `base.css`: if the property is already set there, do not repeat it. A first hero draft had `hero_body`, `hero_content`, `hero_head`, `hero_title`, `hero_lead`, `hero_photo`; only `hero_tagline` (side padding) and `hero_media` (size + negative margin) survived.
- **Once an element has its `block_element` class, its scoped rule may also carry the structural layout properties** (`display`, `flex-direction`, `align-items`, `justify-content`, `position`, `overflow`, `width`/`height`, `flex`) instead of the equivalent utilities when the three-class limit leaves no room: one rule owns the element's layout, and a `.site-header_menu { display: flex; justify-content: flex-end }` is not a duplicate of `justify-end`. What never goes into a scoped rule when a token utility exists: typography (`text-size-*` on the parent), `gap`/padding/margin from `spacing-*` tokens, colours (`text-color-*`, `--theme-*`), radii (`border-radius-*`). Mind the visibility rule above: an element with scoped `display` cannot carry `*-hide`/`*-only`.
- In a **ui component** the block rule (`.button`, `.tag`) is the component's single definition: it may set weight, case and colour from tokens (`font-weight: var(--font-weight-medium)`) so the root keeps room for `type--`/`size--` modifiers. The typography ban targets sections, where `text-size-*`/`text-weight-*` on the parent is always possible.
- **Typography never gets an element class.** Size/line-height/letter-spacing come from `text-size-<name>`, weight from `text-weight-*`, colour from `text-color-*`. No scoped `font-size`, `line-height`, `letter-spacing` on `block_element` selectors.
- Elements are styled with a flat selector `.hero_title`, never `.hero .hero_title`. No nesting in names (`hero_body_title` → `hero_title`).
- If the layout already renders a unique wrapper (`header`, `main`, `footer`), styles go onto it (in `utilities.css`), not onto a new root div inside the component. The header and footer components start directly with `<div class="container">`.

## Reuse first — an existing class always beats a new one
**Phase** (`styles.md` → Phases): in the `development` phase this section applies to **classes, variants and
ui components** (never restyle a repeated element, never write a second class for what an existing structural
utility gives), but not to **values**: they follow Figma exactly as arbitrary classes / raw scoped values, and
a value repeated across components is left for `/systemize`. Steps 1–2 of the priority order below start to
apply in the `systemized` phase.

Before writing any class or scoped rule, look for what already produces the result, in this order:
`utilities.css` → the ui components in `src/components/ui/` (and their `type--`/`size--` variants) →
element classes already in this component → the design inventory `src/dev/inventory.md` (which
value maps to which token/class). If one of them fits, use it — even when the Figma number differs
by drawing noise (a token of 18 and a text of 18.5 are the same style; say so in the reply).
Only when nothing fits, go down the list below. A value or pattern that appears in **two or more
places** in the design is shared by definition: it gets a token + utility (or a ui component), not two
arbitrary classes — `/systemize` creates these from the finished site; in the systemized phase a new
repeat is promoted the moment it repeats.

## Utilities vs arbitrary values — priority order
0. **An existing class or component** that already gives the result (see Reuse first).
1. **A token utility** when the Figma value is bound to a variable OR is in the inventory: `gap/md` → `spacing-md`, `font/h4` → `text-size-h4`, `border radius/xs` → `border-radius-xs`, `section padding/lg` → `padding-lg`. Look at the variable name in `get_design_context` (or the inventory), not only at the number.
2. **A shared token + utility for a value used in 2+ places** that has none yet: add the token under its group header in `tokens.css` (+ the `text-size-*` utility when it is a text style) instead of repeating an arbitrary class.
3. **An arbitrary-value class from `--size-N`** only for a raw number used once: `spacing-40/40/24`, `width--200/150/100`, `col-6/3/1`, `text-size-20/20/18`, `box-20/30/10`, `circle-40`, `rect-20x40/30x60/10x15`.
4. Nothing else. No raw px/rem in scoped styles when a token exists.

Arbitrary-value classes are declared in the `<style>` of the component that uses them:
```astro
<div class="col-6/3/1 spacing-25/25/15">…</div>

<style>
  .col-6\/3\/1 { width: var(--col-6); }
  .spacing-25\/25\/15 { gap: calc(1.5625rem * var(--fluid-scale)); }
  @media (max-width: 991px) {
    .col-6\/3\/1 { width: var(--t-col-3); }
  }
  @media (max-width: 479px) {
    .col-6\/3\/1 { width: var(--m-col-1); }
    .spacing-25\/25\/15 { gap: calc(0.9375rem * var(--fluid-scale)); }
  }
</style>
```
Numbers in the class are px on the reference frame (1540 / 768 / 390). Prefer values that exist as `--size-N`; if the exact value is missing, write `calc(N/16 rem * var(--fluid-scale))` inline as above rather than adding a token silently.

- **Text size:** the class is `text-size-` + the Figma text style name in kebab-case (`desktop/h2 stix` → `text-size-h2-stix`, `body md (sb)` → `text-size-body-md-sb`, `font/link` → `text-size-link`). It carries size, line-height and letter-spacing (and family/style for the secondary font) from `--font-<name>`, `--line-height-<name>`, `--letter-spacing-<name>`. If the style has no Figma variable, use raw px: `text-size-20/20/18`.
- **Spacing:** custom spacing is `spacing-<px>` or `spacing-<d>/<t>/<m>`, never `gap--…`.
- `col-N` always means width in the 12-column system (6 of 12 desktop, of 6 tablet, of 2 mobile) and is 100 % on tablet. When the tablet frame keeps a fixed column width, declare `col-5/5/2` in the component with `--col-5` / `--t-col-5` / `--m-col-2` (`sync-tokens` fills `--t-col-N` from the tablet `container width/Ncol` variables). Grid column COUNT is `grid-3/2/1col`.
- Systemized phase: promote an arbitrary class to a token + utility the moment it repeats in a second component (see `styles.md`). Development phase: leave the repeat, `/systemize` merges it.

## Every class must have CSS
After every edit: each class in the markup that is not in `utilities.css` must have a selector in this component's `<style>`, and each selector in `<style>` must match a class in the markup. A class without CSS is an error (grep the component for its class names). Renaming a class means renaming its selector in the same edit.

## Do not
- Do not invent a second name for something that has a utility (`w-full` → `width-100`, `gap-md` → `spacing-md`), and do not write a new class or scoped rule for a result an existing class, variant or component already gives.
- Do not put a modifier without its base class (`type--big` alone is meaningless).
- Do not reuse a mix (`--home--about`) anywhere else; if it is needed twice it becomes a modifier.
- Do not use two `/` values.
- Do not encode state in element names; state is a modifier: `card is--active`, `--is--last`.
- Do not add classes or scoped styles to `.container`.
- Do not give a section a block class, a background colour or scoped padding when `section padding-*` (+ `theme--dark`) covers it.
