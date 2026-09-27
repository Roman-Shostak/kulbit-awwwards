---
name: alt-text
description: Audit every raster image in src/**/*.astro for alt text; for images with missing alt, LOOK at the image file, write a descriptive alt in the site language (or alt="" for decorative ones), insert it into the code and report a summary. Use when the user asks to check, add, fix or generate alt texts / image descriptions / accessibility of images.
argument-hint: "[path]"
---

# Alt text audit & generation

Input: optional path (`$ARGUMENTS`) to limit the scan (e.g. `src/components/sections/Hero.astro`). Default: all of `src/`.
Output: alt attributes inserted into the code + a summary table. Nothing else is changed.

## 1. Find candidates

Scan every `.astro` file in scope for raster images: `<Image`, `<Picture`, `<img`. Use:

```bash
grep -rnE '<(Image|Picture|img)\b' src --include='*.astro'
```

For each hit read the full tag (it may span several lines) and classify:

| State | Action |
| --- | --- |
| no `alt` attribute | generate |
| `alt=""` | keep — decorative by decision; list under "already decorative" |
| `alt="literal text"` | keep; only flag if it is a filename, "image", "photo", "img", or the same as the `src` basename |
| `alt={expression}` bound to a prop | do not invent text; check the `Props` interface: if the prop is optional without a default, make it required (`alt: string`) so callers must supply it, and report which pages call the component |
| `alt={expression}` from data/collection | leave; report that the data source must provide alt |

SVG components (imported `.svg`) and inline `<svg>` are out of scope here, except: report any without `aria-hidden="true"` or an accessible name.

## 2. Determine the site language

Alt text lives in the dictionaries (`src/i18n/<lang>.ts`, under the component's key: `hero.imageAlt`), like every other text.
1. Write it in the default language's dictionary (`defaultLocale` in `src/i18n/index.ts`) and read it in the component (`alt={t.imageAlt}`).
2. Other registered languages get alt only from the client's translations: list the missing keys in the report, do not translate.

## 3. Look at the image and write the alt

For every image that needs alt:
1. Resolve the file: follow the `import` (e.g. `@/assets/hero/hero-team-office.jpg`) or the `src` path. Read the image file — you can view it. If the file is missing or remote and not viewable, do not guess: report it with `TODO`.
2. Decide **decorative vs meaningful**. Decorative = backgrounds, textures, gradients, abstract shapes, ornaments, duplicate of adjacent text (e.g. a logo next to the company name). Decorative → `alt=""`.
3. For meaningful images write alt text that:
   - describes what is shown and why it matters in this section (use the surrounding heading/text for context),
   - is 5–15 words, a phrase or short sentence, no trailing period needed,
   - does NOT start with "image of", "photo of", "picture of", "зображення", "фото",
   - includes any text visible inside the image,
   - contains no keyword stuffing, no marketing adjectives that are not visible,
   - is in the language from step 2.

## 4. Insert

Edit the tag in place: add `alt="…"` as the last attribute before `/>` (or `alt=""` for decorative). Do not reorder or reformat anything else in the file. Do not touch images that already had a valid alt.

## 5. Verify and report

Run `pnpm check`. Then print:

```
## Alt text — <scope>
| File:line | Image | Alt | Type |
| --- | --- | --- | --- |
| src/components/sections/Hero.astro:24 | hero-team-office.jpg | Our team in the Kyiv office | described |
| src/components/sections/Hero.astro:31 | hero-bg-gradient.png | "" | decorative |

Already fine: N images. Flagged: <list of suspicious existing alts, prop-bound alts, unviewable files, SVGs without aria-hidden>.
```

## Do not
- Do not build anything the user did not name in this request.
- Invent descriptions for images you could not view.
- Rewrite existing alt texts unless they are clearly placeholders (filename, "image", "photo").
- Change anything besides the `alt` attribute (and a `Props` type when alt is prop-bound).
- Add alt to SVG icons; they follow `aria-hidden` / `aria-label` rules from `.claude/rules/images.md`.
