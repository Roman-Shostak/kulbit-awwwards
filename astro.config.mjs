// @ts-check
import { existsSync } from 'node:fs';
import { defineConfig, svgoOptimizer } from 'astro/config';
import { seoFiles } from './scripts/seo-files.mjs';

// Unicode ranges of the font subsets written by `pnpm fonts` (scripts/build-fonts.py) into
// src/assets/fonts/ — the same split as Google Fonts. Keep both lists identical.
/** @type {Record<string, [string, ...string[]]>} */
const subsets = {
  latin: [
    'U+0000-00FF', 'U+0131', 'U+0152-0153', 'U+02BB-02BC', 'U+02C6', 'U+02DA', 'U+02DC', 'U+0304',
    'U+0308', 'U+0329', 'U+2000-206F', 'U+20AC', 'U+2122', 'U+2190-2193', 'U+2212', 'U+2215',
    'U+FEFF', 'U+FFFD',
  ],
  'latin-ext': [
    'U+0100-02BA', 'U+02BD-02C5', 'U+02C7-02CC', 'U+02CE-02D7', 'U+02DD-02FF', 'U+0304', 'U+0308',
    'U+0329', 'U+1D00-1DBF', 'U+1E00-1E9F', 'U+1EF2-1EFF', 'U+2020', 'U+20A0-20AB', 'U+20AD-20C0',
    'U+2113', 'U+2C60-2C7F', 'U+A720-A7FF',
  ],
  cyrillic: ['U+0301', 'U+0400-045F', 'U+0490-0491', 'U+04B0-04B1', 'U+2116'],
  'cyrillic-ext': ['U+0460-052F', 'U+1C80-1C8A', 'U+20B4', 'U+2DE0-2DFF', 'U+A640-A69F', 'U+FE2E-FE2F'],
};

// The subset of the site language. `variants()` lists it first, and BaseLayout preloads only the
// FIRST file of every weight/style (see the preload snippet in BaseLayout.astro), so the browser
// fetches one file per weight instead of every subset. Latin-script sites: 'latin'.
const primarySubset = 'cyrillic';

/** @typedef {{ weight: number; style: 'normal' | 'italic'; src: [string]; unicodeRange: [string, ...string[]] }} Variant */

/**
 * One font variant per subset file that exists on disk: `src/assets/fonts/<base>-<subset>.woff2`.
 * `pnpm fonts` skips a subset the font has no glyphs for (most fonts miss `cyrillic-ext`), so the
 * missing files are skipped here as well instead of failing the build inside Astro.
 * `@ts-check` requires tuples for `variants`, `src` and `unicodeRange`, hence the typedef above.
 * @param {string} base  file name without the subset, e.g. 'client-sans-regular' (printed by `pnpm fonts`)
 * @param {{ weight: number; style: 'normal' | 'italic' }} props
 * @returns {[Variant, ...Variant[]]}
 */
export const variants = (base, props) => {
  const ordered = [primarySubset, ...Object.keys(subsets).filter((subset) => subset !== primarySubset)];
  const [first, ...rest] = ordered
    .filter((subset) => existsSync(new URL(`./src/assets/fonts/${base}-${subset}.woff2`, import.meta.url)))
    .map(
      /** @returns {Variant} */ (subset) => ({
        ...props,
        src: [`./src/assets/fonts/${base}-${subset}.woff2`],
        unicodeRange: subsets[subset],
      }),
    );
  if (!first) throw new Error(`[fonts] no src/assets/fonts/${base}-<subset>.woff2 files — run \`pnpm fonts\` first`);
  return [first, ...rest];
};

/**
 * Dev-only pages from src/dev/ — /dev/tokens (every token and utility, read from the CSS files)
 * and /dev/components (every ui component and section with its variants). They are injected only
 * while `astro dev` runs: `astro build` never emits them, so nothing can deploy or index them.
 * @returns {import('astro').AstroIntegration}
 */
const devPages = () => ({
  name: 'dev-pages',
  hooks: {
    'astro:config:setup': ({ command, injectRoute }) => {
      if (command !== 'dev') return;
      injectRoute({ pattern: '/dev/tokens', entrypoint: './src/dev/tokens.astro' });
      injectRoute({ pattern: '/dev/components', entrypoint: './src/dev/components.astro' });
    },
  },
});

// https://astro.build/config
export default defineConfig({
  // Static output by default: the built `dist/` folder can be hosted anywhere
  // (Netlify, Vercel, Cloudflare, GitHub Pages, any nginx/Apache server).
  // Add an adapter only when a specific client project needs SSR.
  output: 'static',

  // Content Security Policy — off by default. Enable when the client wants the "Trust and Safety"
  // warnings out of PageSpeed / Lighthouse (Best Practices). Astro hashes its own inline scripts and
  // styles (the fluid-scale script and the <Font> styles included) into a
  // <meta http-equiv="content-security-policy">; every EXTERNAL resource must be listed by hand or
  // CSP blocks it: a YouTube/map iframe (frame-src), analytics (script-src, connect-src), a form
  // handler (form-action, connect-src), a font/image CDN (font-src, img-src). Not applied in `astro dev`:
  // verify with `pnpm build && pnpm shot --check` (violations show up as console errors).
  // X-Frame-Options and Cross-Origin-Opener-Policy cannot be set from a <meta>: they are response
  // headers on the host (vercel.json / netlify.toml / _headers) — see the /prelaunch skill.
  // security: {
  //   csp: {
  //     directives: ["default-src 'self'", "img-src 'self' data:", "object-src 'none'", "base-uri 'self'"],
  //   },
  // },

  // The form handler is a Worker (worker/index.ts, `pnpm worker` = wrangler dev on :8787): in `astro dev`
  // the forms post to it through this proxy. Ignored by `astro build`.
  vite: { server: { proxy: { '/api': 'http://localhost:8787' } } },

  // dev-only pages (/dev/tokens, /dev/components) + robots.txt, sitemap.xml, llms.txt, llms-full.txt
  // generated into dist/ on every build (options: scripts/seo-files.mjs)
  integrations: [devPages(), seoFiles()],

  // Languages: the default language at /, every other at /<lang>/, chosen by hand (no browser detection).
  // Keep `locales` / `defaultLocale` identical to src/i18n/index.ts; a language gets pages only when its
  // dictionary is registered there. TODO: the site languages from the start kit.
  i18n: {
    locales: ['uk'],
    defaultLocale: 'uk',
    routing: { prefixDefaultLocale: false },
  },

  // Production URL per client project — REQUIRED: canonical, og:url, og:image and the Schema.org
  // graph are built from it (in a static build Astro.url only carries the pathname).
  // While the client has no domain yet, use the address where the site really opens now
  // (https://<project>.<account>.workers.dev, *.pages.dev, *.vercel.app, *.netlify.app) with a TODO
  // to swap it for the production domain — never example.com: link previews (og:image) would 404
  // and `pnpm seo` reports a placeholder host as an error.
  // site: 'https://client-site.example.workers.dev', // TODO: the production domain

  image: {
    // Every <Image>/<Picture> gets srcset + sizes automatically, scaled to its container
    // and never wider than the `width` prop (use the `fill-box` utility when the box decides).
    // Sources are exported from Figma at 2x, so the generated srcset covers HiDPI screens.
    layout: 'constrained',
    // Global CSS that makes responsive images fill their box (max-width: 100%, height: auto).
    responsiveStyles: true,
  },

  experimental: {
    // Inline SVG components (src/assets/icons/*.svg) are minified at build time: Figma exports carry
    // metadata and over-precise paths that can be half of the HTML. `cleanupIds` must not minify:
    // svgo renames ids per FILE (a, b, …) and two inline SVGs on one page would share an id — a
    // clip-path or gradient then takes another icon's shape. Rule: ids in SVG files are prefixed
    // with the file name (`social-linkedin-clip`), see .claude/rules/images.md.
    svgOptimizer: svgoOptimizer({
      plugins: [{ name: 'preset-default', params: { overrides: { cleanupIds: { minify: false } } } }],
    }),
  },

  // Client fonts — Astro Fonts API (https://docs.astro.build/en/guides/fonts/).
  // 1. Put the client's TTF/OTF files in src/assets/fonts/source/ and run `pnpm fonts`: it writes
  //    one subset WOFF2 per weight and script (latin, latin-ext, cyrillic, cyrillic-ext) into
  //    src/assets/fonts/ and prints the `variants(...)` lines to paste here.
  // 2. Describe them below. Astro generates @font-face (with unicode-range) and a fallback font with
  //    matched metrics. `fallbacks` must end with a generic family. Set `primarySubset` above to the
  //    site language's script ('cyrillic' / 'latin').
  // 3. In BaseLayout.astro <head>: <Font cssVariable="--font-primary-custom" /> (+ secondary) WITHOUT
  //    `preload` — it would preload every subset file (4 × weights); the layout builds the preload
  //    links itself from `fontData` (first file per weight/style = the primary subset), see the
  //    snippet in BaseLayout.astro.
  // tokens.css already reads --font-primary-custom / --font-secondary-custom.
  // Only weights/styles with a file here may be used in CSS (text-weight-*, italic): the browser
  // would synthesise the rest. Ask the client for the missing file instead.
  //
  // import { fontProviders } from 'astro/config';   ← add to the import at the top
  // fonts: [
  //   {
  //     provider: fontProviders.local(),
  //     name: 'ClientSans',
  //     cssVariable: '--font-primary-custom',
  //     fallbacks: ['Arial', 'sans-serif'],
  //     options: {
  //       variants: [
  //         ...variants('client-sans-regular', { weight: 400, style: 'normal' }),
  //         ...variants('client-sans-semibold', { weight: 600, style: 'normal' }),
  //       ],
  //     },
  //   },
  //   {
  //     provider: fontProviders.local(),
  //     name: 'ClientSerif',
  //     cssVariable: '--font-secondary-custom',
  //     fallbacks: ['Georgia', 'serif'],
  //     options: {
  //       variants: [...variants('client-serif-italic', { weight: 400, style: 'italic' })],
  //     },
  //   },
  // ],
});
