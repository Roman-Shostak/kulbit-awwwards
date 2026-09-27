---
paths:
  - "src/**/*.astro"
---

# Semantic HTML, accessibility and front-end best practices

Every section is HTML first: the right element for the content, the attributes the element
needs, then classes. Layout wrappers may be `<div>`s; **content never is**. This file is the
checklist the reviewer applies; `astro-components.md` says how a component is shaped,
`images.md` how media is handled, `class-naming.md` how classes are named.

## Document and landmarks
- One `<html lang>` (the page's language from its URL, `src/i18n`), one `<main id="main">`, one `<header>` and one `<footer>` (the layout renders them); the skip link `.skip-link` in the layout stays.
- `<nav>` for every navigation block; two or more on a page get distinct names: `aria-label="Main"`, `aria-label="Footer"`, `aria-label="Breadcrumb"`. Breadcrumbs are `<nav aria-label="Breadcrumb"><ol>…</ol></nav>` with `aria-current="page"` on the last item.
- `<section>` only for a block that has (or would have) its own heading; `<article>` for a self-contained item that makes sense alone (a card of a service, a post, a testimonial); `<aside>` for tangential content. A wrapper that only positions things is a `<div>`.
- `<address>` wraps contact details (phone, e-mail, physical address) in the footer or a contacts block — not for postal addresses of other people.

## Headings
- One `<h1>` per page, the page subject (usually the hero title). Every section starts with an `<h2>`; sub-blocks use `<h3>`…; never skip a level downwards (`h2` → `h4`). Levels are chosen by structure; the look comes from `text-size-*` (`<h2 class="text-size-h3">` is fine).
- Never use a heading for a bold line or a big number, and never a `<p>` for something that heads a block. Eyebrow text above a title is a `<p>` (or `<span>`), not a heading.

## Lists
- Any repeated set of same-kind items is a list: features, benefits, steps, cards, team members, links, social icons, tags, footer columns, nav items → `<ul>` (or `<ol>` when order matters: steps, a programme, a ranking) with one `<li>` per item. Never a stack of `<div>`s.
- The `<ul>`/`<ol>` carries the layout classes (`grid-3/2/1col spacing-md`, `flex-h wrap spacing-xs`); the `<li>` is the item (a ui component renders as `element="li"` when it is a list item).
- Term/definition pairs (label — value, FAQ inside a list, specs) → `<dl><dt>…</dt><dd>…</dd></dl>`.
- A single item is not a list; text with line breaks is not a list of `<br>`s.

## Text content
- Paragraphs are `<p>`; inline emphasis `<strong>`/`<em>` (meaning), `<b>`/`<i>` only for typographic conventions; a highlighted phrase with no meaning is `<span class="text-color-brand">`.
- Dates and times → `<time datetime="2026-09-11">` / `datetime="2026-09-11T18:00"`; durations, prices and numbers as plain text.
- Quotes and testimonials → `<blockquote>` (+ `<cite>` or a `<figure><blockquote/><figcaption>` with the author); a `<figure>` + `<figcaption>` for an image or diagram with a caption.
- Abbreviations that the reader may not know → `<abbr title>`; foreign-language phrases → `lang="…"` on the element.
- `<br>` only for real line breaks (an address, a poem), never for spacing; spacing is `spacing-*`.
- Typographic characters, not ASCII: `—`, `–`, `«»`/`“”`, `’`, `…`, non-breaking space before short prepositions and in phone numbers where the design keeps them on one line.

## Links and buttons
- `<a href>` navigates (another page, an anchor, `tel:`, `mailto:`, a file); `<button type="button">` does something on this page (menu, popup, slider, submit is `type="submit"`). Never a `<div>`/`<span>` with a click handler, never `<a href="#">`. An `<a>` without `href` only as the placeholder for a link whose target the client has not given yet (`href={site.socials.telegram || undefined}` + `TODO`) — it keeps the design's element in place and is valid HTML — and for the navigation item of the current page (`<a aria-current="page">`, no self-link: `astro-components.md` → Buttons and links).
- Link text says where it leads on its own: "Read the programme", not "here" / "more". **Icon-only links** get their name from `sr-only` text inside (`<a><span class="sr-only">Telegram</span><IconTelegram aria-hidden="true" /></a>`) — never `aria-label` on the `<a>`: without `href` the element has the `generic` role, where `aria-label` is prohibited (Lighthouse "Elements use prohibited ARIA attributes"). **Icon-only buttons** may use `aria-label`; the icon inside is `aria-hidden="true"`.
- `tel:` links strip spaces and brackets (`tel:+380671234567`), `mailto:` links carry the plain address; the visible text keeps the formatting from the design.
- **Every link that leaves the site opens in a new tab**: an `http(s)` URL on another domain (social networks, messengers, maps, partner sites, documents hosted elsewhere) gets `target="_blank" rel="noopener noreferrer"`; a ui component that renders such links (a `SocialLink`) sets both itself from the URL. Never on internal links, anchors, `tel:`, `mailto:` or app schemes (`viber://`). Downloads: `download` attribute.
- The logo link goes home; it has an accessible name (visually hidden text or `aria-label`) — an SVG alone is silent.

## Forms
- Every control has a `<label for>` (visually hidden with `sr-only` when the design shows only a placeholder); placeholder is not a label.
- Correct `type` (`email`, `tel`, `url`, `number`) and `autocomplete` (`name`, `email`, `tel`, `organization`, `street-address` …); `inputmode` when the type is text but the keyboard should be numeric; `required` for required fields; `<form method="post" action>` with a real handler or a `TODO`.
- Errors: the field gets `aria-invalid="true"` and `aria-describedby` pointing at the message element; success/error messages live in an element with `role="status"` (polite) or `role="alert"` (errors) so screen readers announce them.
- Groups of radios/checkboxes → `<fieldset><legend>`; a submit button is `<button type="submit">` (or the project's `Button`), not an `<input type="submit">` styled from scratch.
- Never disable the submit button to "validate"; validate on submit and report.

## Interactive components
- A toggle (burger, accordion trigger, tab) is a `<button>` with `aria-expanded="true|false"` and `aria-controls="<id of the panel>"`; the panel has the `id`, `hidden` (or `inert` + `aria-hidden` for an off-canvas menu) when closed. State is a `is--*` class set by the script, never inline styles.
- Accordions and FAQs → native `<details><summary>` (one open at a time only if the design says so), opened and closed with a transition by the component's small script (`astro-components.md` → Accordion; native toggle under `prefers-reduced-motion`). Popups and modals → native `<dialog>` opened with `showModal()` (focus trap, `Esc`, backdrop for free), animated in and out per `astro-components.md` → Popup (`tabindex="-1"` + `dialog.focus()`, `data-lenis-prevent`); the trigger is a `<button data-popup="…">`. Tabs → `role="tablist"/"tab"/"tabpanel"` with `aria-selected` and arrow-key handling, or a simpler pattern (headings + content) when tabs are not essential.
- Sliders/carousels: the slides are a `<ul>`, prev/next are `<button aria-label>`, the current slide is announced or the region has `aria-roledescription="carousel"`; autoplay pauses on hover/focus and under `prefers-reduced-motion`.
- Keyboard: everything clickable is focusable in DOM order (no `tabindex` > 0), `Esc` closes overlays, focus returns to the trigger after a popup closes. Never remove the focus outline (`base.css` styles `:focus-visible`).

## Media
- Rules in `images.md`: `<Picture>`/`<Image>` with `width`, `alt` (or `alt=""` when decorative), `priority` only for the hero image, `fill-box` when the box crops; SVG icons `aria-hidden="true"`; a meaningful standalone graphic gets `role="img"` + `aria-label`.
- `<video>` has `controls` (or is muted + autoplay + loop + `playsinline` only as a decorative background with `aria-hidden`), a `poster`, and captions (`<track kind="captions">`) when it has speech; `<iframe>` has a `title` and `loading="lazy"`.

## Tables
- Only for tabular data (pricing plans compared, schedules): `<table>` with `<caption>`, `<thead>`, `<th scope="col|row">`; never for layout. Responsive: wrap in `<div class="overflow-x-auto">`-like scoped rule, do not turn the table into divs.

## Attributes hygiene
- `id`s are unique per page and stable (used by `aria-controls`, `for`, anchors); anchors that sections receive for in-page navigation are kebab-case `id`s on the `<section>`, and the nav item that targets one is `href: '/#<id>'` in the dictionary (`astro-components.md` → Texts and languages).
- Boolean attributes without values (`hidden`, `required`, `inert`, `disabled`); no empty attributes (`class=""`, `alt` missing vs `alt=""` is a decision, see `images.md`).
- Behaviour hooks are `data-*` attributes (`data-menu-toggle`, `data-popup`, `data-reveal`), never classes or inline `onclick`.
- No inline `style`, no `title` attributes as tooltips (not accessible on touch), no `role` that repeats the element's own semantics (`<button role="button">`).
- Language: `lang` on the `<html>` from the page's language (`src/i18n`); `lang="en"` (etc.) on an element whose text is in another language.

## Accessibility baseline
- Text contrast ≥ 4.5:1 (large text ≥ 3:1); if the design fails, say so in the report and keep the design value — do not silently change a colour.
- Touch targets ≥ 44×44 px for buttons and icon links (padding on the `<a>`, not just the icon).
- Content hidden visually but needed by screen readers → `sr-only`; content hidden from everyone → `hidden`; decorative → `aria-hidden="true"`.
- Motion respects `prefers-reduced-motion` (the motion module and `reset.css` already do); nothing flashes; no content that only appears on hover.
- Reading order in the DOM = visual order; do not reorder with CSS (`order`, `flex-direction: row-reverse`) except for a purely decorative element.

## Performance and delivery
- The hero image is the only `priority` image; everything else lazy. Boxes with `aspect-ratio` so nothing shifts while images load. Fonts: one preload per weight of the primary family, built from `fontData` in the layout (not `<Font preload>`, which preloads every subset).
- Zero JS unless the design needs it; a script only in the component that needs it; third-party embeds (maps, forms, chats) load lazily and are listed in the report.
- No CSS or HTML for states the design does not have; no empty wrappers "for later".

## Anti-patterns (each one is a finding)
`<div>` soup where a list, heading, nav or address belongs · headings used for size · `<span>`/`<div>` as buttons · `<a href="#">` · `aria-label` on an `<a>` without `href` · `onclick=""` · `tabindex="5"` · `outline: none` · `alt="image"` / `alt="photo"` / a filename in alt · placeholder as the only label · `<br><br>` for spacing · `<b>` for headings · a `<section>` with no heading and no name · `title=""` tooltips · `<table>` for layout · text as an image · icon buttons without a name · repeated `<nav>` without labels · `<h1>` twice · `target="_blank"` without `rel` · an external link without `target="_blank"` · a `<p>` wrapping block elements · `<ul>` with only one `<li>`.
