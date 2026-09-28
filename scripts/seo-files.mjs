// Astro integration: writes robots.txt, sitemap.xml, llms.txt and llms-full.txt into dist/ at the
// end of every `astro build` — so every deploy carries fresh files and nothing is edited by hand.
//
//   integrations: [seoFiles()]                       // astro.config.mjs
//   integrations: [seoFiles({ blockAiCrawlers: true, disallow: ['/thanks/'], lastmod: 'build' })]
//
// Sources: `site` from the config (required — without it nothing is written), the built pages
// (title, meta description, `noindex`, the text of <main>). Pages with `noindex` and the 404 page
// are left out of the sitemap and the llms files. Options:
//   lastmod         'git' (default: last commit date of the page's source file, omitted when git
//                   is unavailable) | 'build' (build date) | false (no lastmod)
//   disallow        extra `Disallow:` paths for every crawler (e.g. ['/thanks/'])
//   blockAiCrawlers true → Disallow: / for the common AI training crawlers (default false:
//                   client sites usually want to be found, and llms.txt exists for that)
//   llmsFull        false → skip llms-full.txt (default true)
//   indexable       false → the whole site is closed from search for good (X-Robots-Tag: noindex in public/_headers):
//                   only robots.txt is written (crawling allowed, so crawlers still read the noindex; no Sitemap
//                   line), no sitemap.xml and no llms files (default true)

import { execFile } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const run = promisify(execFile);
const AI_CRAWLERS = ['GPTBot', 'ChatGPT-User', 'ClaudeBot', 'anthropic-ai', 'CCBot', 'Google-Extended', 'PerplexityBot', 'Bytespider', 'Applebot-Extended'];

const decode = (text) =>
  text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
const escapeXml = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const attr = (tag, name) => tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1];
const meta = (html, kind, key) => {
  const tag = [...html.matchAll(/<meta\s[^>]*>/g)].map((m) => m[0]).find((t) => attr(t, kind) === key);
  return tag ? decode(attr(tag, 'content') ?? '') : '';
};

/** <main> … </main> → readable text with markdown headings and list items */
function mainText(html) {
  const main = html.match(/<main[\s>][\s\S]*?<\/main>/)?.[0] ?? '';
  return decode(
    main
      .replace(/<(script|style|svg|noscript|template)[\s\S]*?<\/\1>/g, '')
      .replace(/<h([1-6])[^>]*>/g, (_, n) => `\n\n${'#'.repeat(Math.min(Number(n) + 2, 6))} `)
      .replace(/<\/h[1-6]>/g, '\n\n')
      .replace(/<li[^>]*>/g, '\n- ')
      .replace(/<(p|div|section|article|ul|ol|header|footer|blockquote|figure|address|form)[^>]*>/g, '\n')
      .replace(/<\/(p|div|section|article|ul|ol|li|header|footer|blockquote|figure|address|form|tr)>/g, '\n')
      .replace(/<br\s*\/?>/g, '\n')
      .replace(/<[^>]+>/g, ' '),
  )
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function gitDate(file) {
  try {
    const { stdout } = await run('git', ['log', '-1', '--format=%cI', '--', file]);
    return stdout.trim().slice(0, 10) || undefined;
  } catch {
    return undefined;
  }
}

/**
 * @param {{ lastmod?: 'git' | 'build' | false; disallow?: string[]; blockAiCrawlers?: boolean; llmsFull?: boolean; indexable?: boolean }} [options]
 * @returns {import('astro').AstroIntegration}
 */
export function seoFiles(options = {}) {
  const { lastmod = 'git', disallow = [], blockAiCrawlers = false, llmsFull = true, indexable = true } = options;
  /** @type {string | undefined} */
  let site;
  /** @type {import('astro').IntegrationResolvedRoute[]} */
  let routes = [];

  return {
    name: 'seo-files',
    hooks: {
      'astro:config:done': ({ config }) => {
        site = config.site;
      },
      'astro:routes:resolved': (params) => {
        routes = params.routes;
      },
      'astro:build:done': async ({ dir, pages, logger }) => {
        if (!site) {
          logger.warn('`site` is not set in astro.config.mjs — robots.txt, sitemap.xml and llms.txt were NOT generated');
          return;
        }
        const origin = new URL(site);
        const out = (name) => fileURLToPath(new URL(name, dir));
        const today = new Date().toISOString().slice(0, 10);

        const entries = [];
        for (const { pathname } of pages) {
          const clean = pathname.replace(/^\/+/, '');
          if (/^404\/?$/.test(clean)) continue;
          let html;
          try {
            html = await readFile(out(clean.endsWith('.html') ? clean : `${clean}${clean && !clean.endsWith('/') ? '/' : ''}index.html`), 'utf8');
          } catch {
            continue;
          }
          const noindex = /name="robots"[^>]*content="[^"]*noindex/i.test(html);
          if (noindex) continue;
          const url = new URL(clean, origin).href;
          const pattern = `/${clean.replace(/\/$/, '')}` || '/';
          const route = routes.find((r) => r.pattern === pattern) ?? routes.find((r) => r.patternRegex?.test(pattern));
          const modified = lastmod === 'git' && route?.entrypoint ? await gitDate(route.entrypoint) : lastmod === 'build' ? today : undefined;
          entries.push({
            url,
            title: decode(html.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? ''),
            description: meta(html, 'name', 'description'),
            siteName: meta(html, 'property', 'og:site_name'),
            modified,
            text: llmsFull ? mainText(html) : '',
            home: pattern === '/',
          });
        }
        entries.sort((a, b) => (a.home ? -1 : b.home ? 1 : a.url.localeCompare(b.url)));
        const home = entries.find((e) => e.home);
        const siteName = home?.siteName || entries.find((e) => e.siteName)?.siteName || home?.title || origin.hostname;

        // robots.txt
        // ASCII only: Cloudflare serves .txt without a charset and browsers read it as windows-1252
        const robots = [
          '# Generated at build by scripts/seo-files.mjs - change the options in astro.config.mjs, not this file',
          ...(indexable ? [] : ['# The site is closed from search (X-Robots-Tag: noindex); crawling stays allowed so crawlers read it']),
          'User-agent: *',
          'Allow: /',
          ...disallow.map((path) => `Disallow: ${path}`),
          '',
          ...(blockAiCrawlers ? AI_CRAWLERS.flatMap((bot) => [`User-agent: ${bot}`, 'Disallow: /', '']) : []),
          ...(indexable ? [`Sitemap: ${new URL('/sitemap.xml', origin).href}`, ''] : []),
        ].join('\n');
        await writeFile(out('robots.txt'), robots);
        if (!indexable) {
          logger.info(`robots.txt written to ${fileURLToPath(dir)} (the site is closed from search: no sitemap, no llms files)`);
          return;
        }

        // sitemap.xml — loc (+ lastmod); changefreq/priority are ignored by search engines
        const urls = entries
          .map((e) => `  <url>\n    <loc>${escapeXml(e.url)}</loc>${e.modified ? `\n    <lastmod>${e.modified}</lastmod>` : ''}\n  </url>`)
          .join('\n');
        await writeFile(out('sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);

        // llms.txt (https://llmstxt.org): name, summary, one line per public page
        const llms = [
          `# ${siteName}`,
          '',
          ...(home?.description ? [`> ${home.description}`, ''] : []),
          '## Pages',
          '',
          ...entries.map((e) => `- [${e.title || e.url}](${e.url})${e.description ? `: ${e.description}` : ''}`),
          '',
        ].join('\n');
        await writeFile(out('llms.txt'), llms);

        // llms-full.txt: the readable text of every public page
        if (llmsFull) {
          const full = [
            `# ${siteName}`,
            '',
            ...(home?.description ? [`> ${home.description}`, ''] : []),
            ...entries.flatMap((e) => [`## ${e.title || e.url}`, '', e.url, '', ...(e.description ? [e.description, ''] : []), e.text, '', '---', '']),
          ].join('\n');
          await writeFile(out('llms-full.txt'), full);
        }

        logger.info(`robots.txt, sitemap.xml (${entries.length} URLs), llms.txt${llmsFull ? ', llms-full.txt' : ''} written to ${fileURLToPath(dir)}`);
      },
    },
  };
}
