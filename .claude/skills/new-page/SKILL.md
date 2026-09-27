---
name: new-page
description: Create a new empty Astro page (route) that uses BaseLayout with a real title and description. Use when the user asks to add/create a page; the page stays empty unless they name the sections to include.
---

# Create a page

Input: page name or slug (e.g. "about", "contact", "services/web-design"), the page `title` and
`description` (required — ask for them if missing), optional list of existing sections to render,
optional OG image and `motion`.

## Steps

1. Find the parent first: which page or nav item links to this one in the design, the page map or the dictionary. A page with a parent lives in the parent's folder (`src/pages/[...locale]/<hub>/<slug>.astro` → `/<hub>/<slug>/`; the hub stays `<hub>.astro`); a flat `src/pages/[...locale]/<slug>.astro` only for a page with no parent in the navigation. When the structure does not show it, ask in the same message as the title and description. Kebab-case; `index.astro` for a folder root. One file serves every built language: `/<slug>/`, `/<lang>/<slug>/`.
2. `title` (≤ 65 characters) and `description` (≤ 160) are required by `BaseLayout` and must be real
   text in the site language — no "Home", no placeholders. If the user did not give them, ask before
   creating the file. They go into the default language's dictionary (`src/i18n/<lang>.ts`) → `pages.<page>` (other
   languages only from the client's translations). `lang` comes from the URL; do not pass it.
3. Create the file:
   ```astro
   ---
   import { localeStaticPaths, useTranslations } from '@/i18n';
   import BaseLayout from '@/layouts/BaseLayout.astro';

   export const getStaticPaths = localeStaticPaths;

   const t = useTranslations(Astro.currentLocale).pages.<page>;
   ---

   <BaseLayout title={t.title} description={t.description}>
   </BaseLayout>
   ```
   Add `ogImage="/og/<page>.jpg"` when the user gave an OG source (`src/assets/og/<page>.jpg`),
   `motion` whenever the project is animated (the start kit asked for animations / the home page passes
   `motion`) — every new page, even an empty one, or none of them —, and `schema={{ nodes, mainEntityId }}`
   when the user asked for page-scoped Schema.org nodes (see `/seo`).
4. If — and only if — the user listed sections that already exist in `src/components/sections/`, import and render them in the given order inside `<BaseLayout>` (header/footer through `slot="header"` / `slot="footer"`).
5. Run `pnpm check` (no pipe).

## Do not
- Do not build anything the user did not name in this request.
- Add sections, placeholder text, headings or demo content to an empty page.
- Invent a title or description; ask instead.
- Create sections that do not exist yet (use `figma-section` for that when asked).
- Touch navigation, other pages, or the layout.
