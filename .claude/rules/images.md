---
paths:
  - "src/assets/**"
  - "src/**/*.astro"
  - "public/**"
  - "scripts/**"
---

# Images, icons, fonts, favicon and OG rules

## Source files (`src/assets/`)
- **All raster sources are exported from Figma at 2x.** Never add a `@2x` suffix — 2x is the convention, the filename stays clean.
- Naming: lowercase latin kebab-case, descriptive, no spaces or underscores: `hero-team-office.jpg`, `logo-client-dark.svg`. Digits allowed. Wrong: `IMG_0231.jpg`, `Hero Image.png`, `photo1.jpg`.
- Folders by purpose:
  ```
  src/assets/<section>/   photos & illustrations of one section (hero/, about/, team/ …)
  src/assets/shared/      rasters reused across sections
  src/assets/icons/       SVG icons, logos and decorative vectors
  src/assets/og/          Open Graph source images (any size ≥ 1200×630)
  src/assets/fonts/       subset woff2 files written by `pnpm fonts` (+ fonts/source/ for the client's TTF/OTF)
  ```
- Prefer JPG for photos, PNG only when transparency is required. Astro converts them at build time; the source format only affects the fallback.
- `public/` is NOT for content images. Only `favicon.svg` (+ the generated `favicon.ico`, `apple-touch-icon.png`), `robots.txt`, and generated `public/og/`.

## Rendering rasters
- Always `astro:assets`. Photos and illustrations → `<Picture>`, tiny rasters that never need AVIF → `<Image>`. Never a raw `<img>` for a `src/assets` file.
- Global config already sets `layout: 'constrained'` and `responsiveStyles: true`, so every image gets `srcset`/`sizes` and HiDPI variants automatically. Do not pass `densities` or `widths` unless the design needs a specific set.
- **`width` = the largest 1x size of the photo across all breakpoints** (Figma frame size in px, not the 2x file size; the tablet frame is often wider than the desktop column: 580 → 652 → 350 means `width={652}`). The constrained layout never renders the image wider than `width`, so a smaller value leaves the box unfilled on tablet.
- **`height` only when the crop is the same on every breakpoint.** When the frame changes per breakpoint (580×480 → 652×652 → 350×350) leave `height` out and let the box crop: an element class on the wrapper with `aspect-ratio` (or a height in rem × `--fluid-scale`) + `border-radius-*` + `overflow-hidden`, and `class="fill-box"` on the `<Picture>` (Astro puts `class` on the `<img>`; `fill-box` = 100 % × 100 %, `object-fit: cover`, `max-width: none` to lift Astro's cap, and it stretches the `<picture>` wrapper to the box too — `global.css` orders Astro's `astro.images` layer below `utilities`, so nothing else is needed: no `:global(picture)` rule, no scoped height on the `<img>`). The `aspect-ratio` box reserves the space before the file exists, so the layout does not jump.
- Remote images (`src="https://…"`) require both `width` and `height` explicitly, and the host must be allowed in `image.domains`.
- `formats={['avif', 'webp']}` on every `<Picture>`. Fallback `<img>` keeps the source format (jpg → jpg, png → png).
- `alt` is mandatory: meaningful text, or `alt=""` for purely decorative images.
- Above-the-fold image (usually one per page, the hero): add `priority`. Everything else stays lazy by default.

```astro
---
import { Picture } from 'astro:assets';
import aboutPhoto from '@/assets/about/about-portrait.jpg';
---
<div class="col-5">
  <div class="about_media border-radius-md overflow-hidden">
    <Picture src={aboutPhoto} formats={['avif', 'webp']} width={652} alt="…" class="fill-box" />
  </div>
</div>
<style>
  .about_media { aspect-ratio: 580 / 480; }
  @media (max-width: 991px) { .about_media { aspect-ratio: 1; } }
</style>
```

## Content photos stay in flow inside the container
- A photo that belongs to a section's content is a normal child of the layout wrapper inside `.container` — never an absolutely positioned `background-slot` image. Above the desktop frame width the composition then stays with the container, as in the design.
- "To the edge" is done with negative margins on the photo element: desktop `margin-right: calc(var(--container-padding) * -1)` (flush with the frame edge on one side); tablet/mobile `margin-inline: calc(var(--container-padding) * -1)` + the box height from the frame (768×710, 390×520 → `height: calc(44.375rem * var(--fluid-scale))`). The gap between text column and full-bleed photo is a custom `spacing-20/0/0`.
- `background-slot` is only for decorative backgrounds.

## Decorative vectors (curves, line drawings)
- Export the **visible part** of the vector once per breakpoint with `use_figma`: `node.exportAsync({ format: 'SVG_STRING', svgSimplifyStroke: true })` returns it clipped by the parent frame; `node.absoluteRenderBounds` minus the section's `absoluteBoundingBox` gives the exact `top`, `left`, `width` in frame px → rem × `--fluid-scale`. One SVG per breakpoint (`decor-curve.svg`, `decor-curve-tablet.svg`, `decor-curve-mobile.svg`) shown through visibility utilities: `desktop-only`, `desktop-hide mobile-hide`, `mobile-only`.
- On desktop the decor is anchored to the **container**, never to the section edges (on a 1920 screen it would drift): either `background-slot > container > <svg class="section_decor">` with `position: absolute` relative to the container, or `left: 50%; transform: translateX(-50%); width: calc(96rem * var(--fluid-scale))` (the frame width).
- `overflow-hidden` goes on the `background-slot`, not on the section (the section must not clip its own content).
- Colour: `currentColor` in the file, `color: var(--theme-illustration)` on the element class.

## Icons and logos: SVG first
- If an icon/logo exists as a vector in Figma, export SVG. Raster icons only when no vector exists.
- Import the SVG as a component and render inline. This is Astro's built-in SVG support: zero requests, styled via CSS, colour follows `currentColor`.
  ```astro
  ---
  import IconArrow from '@/assets/icons/arrow-right.svg';
  ---
  <IconArrow width={24} height={24} aria-hidden="true" />
  ```
- The build minifies every imported SVG (`experimental.svgOptimizer` in `astro.config.mjs`, svgo `preset-default`): Figma exports are 30–50 % of the HTML otherwise and delay the first-screen images. Ids are never minified (two inline SVGs would get the same `a`/`b` ids and a clip-path or gradient would borrow another icon's shape), so **every `id` inside an SVG file is prefixed with the file name**: `social-linkedin-clip`, `logo-mark-gradient`.
- Clean exported SVGs: remove `width`/`height` from the file root (keep `viewBox`), drop Figma ids/metadata (keep only the ids a `clip-path`/`fill="url(#…)"` refers to, prefixed), and replace hardcoded colours:
  - monochrome icon → `fill`/`stroke="currentColor"`;
  - two-colour logo (mark + wordmark) → main colour `currentColor`, second colour `fill="var(--theme-icon-secondary)"` (`var()` works in presentation attributes). A `Logo.astro` in `ui/` sets `color: var(--theme-icon)`; `theme--dark` and `.footer` re-assign `--theme-icon` / `--theme-icon-secondary`, so one file serves light and dark backgrounds.
- Decorative icons: `aria-hidden="true"`. Meaningful standalone icons (icon-only button): `aria-label` on the button, not on the SVG.
- **Emoji from the design never stay in the copy**, flags first of all (a regional-indicator pair, U+1F1E6–1F1FF): Chrome/Edge on Windows show letters («ES»), every system draws its own style, and Figma cannot export the glyph (an empty box in SVG, nothing in PNG). A flag is `src/assets/icons/flag-<iso>.svg` (Noto Emoji `third_party/region-flags/waved-svg/`, public domain, closest to the Apple emoji Figma shows; svgo with `floatPrecision: 0` + `mergePaths`, the last path — the dark shadow border — removed), rendered inline next to the text with `class="icon-inline" aria-hidden="true"`; the dictionary keeps the text without the emoji. Inside an `inline-flex` element (a `Tag`) wrap text + icon in one `<span>` so the space between them stays.
- **No sprite build tooling.** When the same icon repeats many times on one page (5+, e.g. a check mark in a long list), define it once in that component with `<svg hidden><symbol id="icon-check" …/></svg>` and reuse via `<svg><use href="#icon-check" /></svg>`. That is an inline sprite with no extra step.

## When Figma downloads fail (cloud sandbox: www.figma.com is blocked)
- Rasters: write the `<Picture>` into the component commented out, with a `TODO` naming the exact path, filename, 2x size and the Figma layer name; in the reply ask the client to commit the file to the working branch. When the file appears, uncomment and check.
- Vectors: `use_figma` → `exportAsync({ format: 'SVG_STRING', svgSimplifyStroke: true })` works without the CDN; save to `src/assets/icons/`, clean as above.
- Screenshots: `get_screenshot` with `enableBase64Response: true`.

## Favicon
- The client delivers `favicon.svg` → `public/favicon.svg` (not `src/assets`). `pnpm favicon` writes `public/favicon.ico` (16 + 32 px) and `public/apple-touch-icon.png` (180 px; `--bg #hex` to flatten). `BaseLayout` always links all three, so run it before the first deploy — otherwise every load logs a 404.

## Open Graph images
- Put the source in `src/assets/og/<page>.jpg|png` (kebab-case, ≥ 1200×630, no transparency needed). The home page's OG image is mandatory; name it after the page (`og-home.jpg` → `/og/og-home.jpg`).
- `pnpm build` runs `scripts/build-og.mjs` first (`prebuild`) and writes `public/og/<page>.jpg` at 1200×630 JPG. Run `pnpm og` to generate them manually. `public/og/` is gitignored.
- JPG on purpose: WebP/AVIF previews are unreliable in messengers and social networks.
- Reference it through the layout: `<BaseLayout title="…" description="…" ogImage="/og/og-home.jpg">`. The layout makes the URL absolute from `site` in `astro.config.mjs`, so `site` must be set for OG to work.
