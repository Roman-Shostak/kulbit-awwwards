// SEO check of every built page (dist/**/*.html) — run after `pnpm build`.
//
//   pnpm seo [dist-dir]
//
// Head: <title> present, no placeholder ("TODO", "Home", "Untitled"), 30–60 chars (warning outside,
// error above 70), unique across pages; meta description present, no placeholder, 70–160 chars
// (warning outside, error above 200), unique; exactly one <h1>; <html lang>; canonical absolute;
// og:title/og:description present, og:image absolute (warning when missing); og:locale matches
// <html lang>; canonical / og:url / og:image never on a placeholder host (example.com, localhost,
// .test, .invalid: `site` is a stub and link previews will not work); noindex pages are
// listed and skipped for the content checks; robots.txt / sitemap.xml / llms.txt present in dist/,
// every indexable page in the sitemap and no noindex page in it, robots.txt with a Sitemap line; a site closed from
// search for good (X-Robots-Tag: noindex for /* in dist/_headers) has robots.txt only.
// JSON-LD: exactly one <script type="application/ld+json"> with `@context` schema.org and a
// non-empty `@graph`; every node has `@type` and an absolute `@id`; ids unique per page; every
// `{ "@id": … }` reference resolves in the same graph; no empty strings or "TODO" values;
// WebSite/WebPage/Person/Organization/Service/Article carry `name` + `url`; ImageObject `url`
// absolute; `sameAs` absolute; WebPage `url` matches its `@id`; BreadcrumbList positions 1…n;
// an inner page without a BreadcrumbList (or the home page with one) is a warning.
// Exit code 1 on any error; warnings never fail the run.

import { access, readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const DIST = process.argv[2] ?? 'dist';
const SCRIPT_RE = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g;
const PLACEHOLDER_RE = /\bTODO\b|^(home|untitled|головна|главная|page)$/i;
const TITLE = { min: 30, max: 60, hard: 70 };
const DESCRIPTION = { min: 70, max: 160, hard: 200 };

const isAbsolute = (value) => typeof value === 'string' && /^https?:\/\/\S+$/.test(value);
// Hosts that are never a real site: `site` in astro.config.mjs was left as a stub
const isPlaceholderHost = (value) => {
  try {
    const host = new URL(value).hostname;
    return /^(localhost|example\.(com|org|net))$/.test(host) || /\.(example|test|invalid|localhost)$/.test(host);
  } catch {
    return false;
  }
};
const decode = (text) =>
  text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
const attr = (tag, name) => tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1];
const meta = (html, kind, key) => {
  const tag = [...html.matchAll(/<meta\s[^>]*>/g)].map((m) => m[0]).find((t) => attr(t, kind) === key);
  return tag ? decode(attr(tag, 'content') ?? '') : undefined;
};

async function htmlFiles(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    console.error(`[seo] ${dir} not found — run \`pnpm build\` first`);
    process.exit(1);
  }
  const files = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await htmlFiles(full)));
    else if (entry.name.endsWith('.html')) files.push(full);
  }
  return files.sort();
}

function walk(value, visit, path = '') {
  if (Array.isArray(value)) value.forEach((item, i) => walk(item, visit, `${path}[${i}]`));
  else if (value && typeof value === 'object') {
    visit(value, path);
    for (const [key, child] of Object.entries(value)) walk(child, visit, path ? `${path}.${key}` : key);
  } else visit(value, path);
}

function checkHead(html, report, seen) {
  const { error, warn, info } = report;
  const noindex = /content="[^"]*noindex/i.test(meta(html, 'name', 'robots') ? `content="${meta(html, 'name', 'robots')}"` : '');
  if (noindex) info('noindex page — content checks skipped');

  if (!/<html[^>]*\slang="[^"]+"/.test(html)) error('<html lang> is missing');
  const title = decode(html.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? '');
  const description = meta(html, 'name', 'description') ?? '';
  const h1 = (html.match(/<h1[\s>]/g) ?? []).length;
  const canonical = attr([...html.matchAll(/<link\s[^>]*>/g)].map((m) => m[0]).find((t) => attr(t, 'rel') === 'canonical') ?? '', 'href');

  if (canonical) seen.pages.set(canonical, { file: report.file, noindex });
  if (!title) error('<title> is missing');
  else if (PLACEHOLDER_RE.test(title)) error(`<title> is a placeholder: "${title}"`);
  if (!description) error('meta description is missing');
  else if (PLACEHOLDER_RE.test(description)) error(`meta description is a placeholder: "${description}"`);
  if (h1 !== 1) (noindex ? warn : error)(`${h1} <h1> elements (expected exactly one)`);

  if (noindex) return { noindex };

  if (title) {
    if (title.length > TITLE.hard) error(`<title> is ${title.length} chars (max ${TITLE.hard}): "${title}"`);
    else if (title.length > TITLE.max || title.length < TITLE.min) warn(`<title> is ${title.length} chars (aim ${TITLE.min}–${TITLE.max}): "${title}"`);
    if (seen.titles.has(title)) error(`<title> duplicates ${seen.titles.get(title)}`);
    seen.titles.set(title, report.file);
  }
  if (description) {
    if (description.length > DESCRIPTION.hard) error(`meta description is ${description.length} chars (max ${DESCRIPTION.hard})`);
    else if (description.length > DESCRIPTION.max || description.length < DESCRIPTION.min) warn(`meta description is ${description.length} chars (aim ${DESCRIPTION.min}–${DESCRIPTION.max})`);
    if (description.includes('"')) error('meta description contains a double quote');
    if (title && description === title) error('meta description equals the title');
    if (seen.descriptions.has(description)) error(`meta description duplicates ${seen.descriptions.get(description)}`);
    seen.descriptions.set(description, report.file);
  }
  if (!canonical) error('canonical link is missing (is `site` set in astro.config.mjs?)');
  else if (!isAbsolute(canonical)) error(`canonical is not absolute: ${canonical}`);
  else if (isPlaceholderHost(canonical)) error(`\`site\` is a placeholder (${new URL(canonical).hostname}): canonical, og:url, og:image and the sitemap point nowhere, link previews will not work`);
  const lang = html.match(/<html[^>]*\slang="([^"]+)"/)?.[1];
  const ogLocale = meta(html, 'property', 'og:locale');
  if (lang && ogLocale && ogLocale.split('_')[0].toLowerCase() !== lang.split('-')[0].toLowerCase()) error(`og:locale ${ogLocale} does not match <html lang="${lang}">`);
  if (!meta(html, 'property', 'og:title')) error('og:title is missing');
  if (!meta(html, 'property', 'og:description')) error('og:description is missing');
  const ogImage = meta(html, 'property', 'og:image');
  if (!ogImage) warn('og:image is missing (pass ogImage="/og/<page>.jpg" to BaseLayout)');
  else if (!isAbsolute(ogImage)) error(`og:image is not absolute: ${ogImage}`);
  return { noindex, canonical };
}

function checkGraph(json, report, canonical) {
  const { error, warn } = report;
  if (json['@context'] !== 'https://schema.org') error(`@context must be "https://schema.org" (got ${JSON.stringify(json['@context'])})`);
  const graph = json['@graph'];
  if (!Array.isArray(graph) || graph.length === 0) return error('@graph is missing or empty');

  const ids = new Map();
  for (const node of graph) {
    if (typeof node['@type'] !== 'string') error(`node without @type: ${JSON.stringify(node).slice(0, 80)}`);
    if (!isAbsolute(node['@id'])) error(`node ${node['@type']} without an absolute @id`);
    else if (ids.has(node['@id'])) error(`duplicate @id ${node['@id']}`);
    else ids.set(node['@id'], node);
  }
  for (const node of graph) {
    const label = `${node['@type']} ${node['@id'] ?? ''}`.trim();
    if (['WebSite', 'WebPage', 'Person', 'Organization', 'Service', 'Article', 'BlogPosting', 'Product', 'Course', 'Event'].includes(node['@type'])) {
      if (!node.name && !node.headline) error(`${label}: name is missing`);
      if (!isAbsolute(node.url)) error(`${label}: url is missing or not absolute`);
    }
    if (node['@type'] === 'WebPage' && node['@id'] && node.url && node['@id'].split('#')[0] !== node.url) error(`${label}: url does not match @id`);
    if (node['@type'] === 'ImageObject' && !isAbsolute(node.url)) error(`${label}: url is missing or not absolute`);
    if (node['@type'] === 'BreadcrumbList') {
      const items = Array.isArray(node.itemListElement) ? node.itemListElement : [];
      if (items.length === 0) error(`${label}: itemListElement is empty`);
      items.forEach((item, i) => {
        if (item['@type'] !== 'ListItem' || item.position !== i + 1) error(`${label}: item ${i + 1} must be a ListItem with position ${i + 1}`);
        if (!item.name) error(`${label}: item ${i + 1} has no name`);
        if (item.item && !isAbsolute(item.item)) error(`${label}: item ${i + 1} url is not absolute`);
      });
    }
    if (node['@type'] === 'Article' || node['@type'] === 'BlogPosting') {
      for (const key of ['datePublished', 'author', 'publisher']) if (!node[key]) error(`${label}: ${key} is missing`);
      if (typeof node.headline === 'string' && node.headline.length > 110) error(`${label}: headline over 110 chars`);
    }
    if (node.sameAs) for (const href of [].concat(node.sameAs)) if (!isAbsolute(href)) error(`${label}: sameAs "${href}" is not an absolute URL`);
    for (const key of ['datePublished', 'dateModified', 'startDate', 'endDate']) {
      if (node[key] && !/^\d{4}-\d{2}-\d{2}(T[\d:+.Z-]+)?$/.test(String(node[key]))) error(`${label}: ${key} is not ISO 8601`);
    }
  }
  // Breadcrumbs: every inner page has them (Google shows them in the result instead of the URL), the home page does not
  if (canonical) {
    const inner = new URL(canonical).pathname !== '/';
    const hasBreadcrumbs = graph.some((node) => node['@type'] === 'BreadcrumbList');
    if (inner && !hasBreadcrumbs) warn('inner page without a BreadcrumbList (pass schema.breadcrumbs to BaseLayout)');
    if (!inner && hasBreadcrumbs) warn('the home page carries a BreadcrumbList (only inner pages pass schema.breadcrumbs)');
  }
  walk(graph, (value, path) => {
    if (typeof value === 'string') {
      if (value.trim() === '') error(`empty string at ${path}`);
      if (/\bTODO\b/.test(value)) error(`TODO left at ${path}: "${value}"`);
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      const keys = Object.keys(value);
      if (keys.length === 1 && keys[0] === '@id' && !ids.has(value['@id'])) error(`reference to unknown @id ${value['@id']} at ${path}`);
    }
  });
}

const files = await htmlFiles(DIST);
const seen = { titles: new Map(), descriptions: new Map(), pages: new Map() };
let errors = 0;
let warnings = 0;
for (const file of files) {
  const html = await readFile(file, 'utf8');
  const lines = [];
  const report = {
    file,
    error: (m) => (errors++, lines.push(`    ✗ ${m}`)),
    warn: (m) => (warnings++, lines.push(`    ! ${m}`)),
    info: (m) => lines.push(`    · ${m}`),
  };
  const { noindex, canonical } = checkHead(html, report, seen);
  const scripts = [...html.matchAll(SCRIPT_RE)];
  if (scripts.length === 0 && !noindex) report.error('no JSON-LD script (is `site` set in astro.config.mjs?)');
  if (scripts.length > 1) report.error(`${scripts.length} JSON-LD scripts, expected one`);
  for (const [, body] of scripts) {
    try {
      checkGraph(JSON.parse(body), report, noindex ? undefined : canonical);
    } catch (e) {
      report.error(`invalid JSON-LD: ${e.message}`);
    }
  }
  const bad = lines.filter((l) => l.startsWith('    ✗')).length;
  console.log(`${bad === 0 ? '✓' : '✗'} ${file}${bad ? ` — ${bad} error(s)` : ''}`);
  for (const line of lines) console.log(line);
}
// A site closed from search for good: `X-Robots-Tag: noindex` for every path in dist/_headers (public/_headers) and
// seoFiles({ indexable: false }) — then robots.txt only: no sitemap, no Sitemap line, no llms files
const headers = await readFile(join(DIST, '_headers'), 'utf8').catch(() => '');
const closed = /^\/\*\s*$[\s\S]*?^\s+X-Robots-Tag:\s*noindex/im.test(headers.split(/\n(?=\S)/).find((block) => block.startsWith('/*')) ?? '');
if (closed) {
  console.log('\n! the whole site is noindex (dist/_headers): sitemap.xml and the llms files must not exist');
  try {
    await access(join(DIST, 'robots.txt'));
  } catch {
    errors++;
    console.log(`✗ ${join(DIST, 'robots.txt')} is missing`);
  }
  for (const name of ['sitemap.xml', 'llms.txt', 'llms-full.txt']) {
    const exists = await access(join(DIST, name)).then(() => true, () => false);
    if (exists) (errors++, console.log(`✗ ${name} is published for a site closed from search (seoFiles({ indexable: false }))`));
  }
  const robots = await readFile(join(DIST, 'robots.txt'), 'utf8').catch(() => '');
  if (/^Sitemap:/m.test(robots)) (errors++, console.log('✗ robots.txt announces a sitemap for a site closed from search'));
  console.log(`\n[seo] ${files.length} page(s), ${errors} error(s), ${warnings} warning(s)`);
  process.exit(errors === 0 ? 0 : 1);
}
// Generated files (scripts/seo-files.mjs) and the sitemap ↔ pages cross-check
for (const name of ['robots.txt', 'sitemap.xml', 'llms.txt']) {
  try {
    await access(join(DIST, name));
  } catch {
    errors++;
    console.log(`✗ ${join(DIST, name)} is missing (generated at build when \`site\` is set — see scripts/seo-files.mjs)`);
  }
}
try {
  const sitemap = await readFile(join(DIST, 'sitemap.xml'), 'utf8');
  const locs = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => decode(m[1])));
  for (const [canonical, { file, noindex }] of seen.pages) {
    if (!noindex && !locs.has(canonical)) (errors++, console.log(`✗ ${file}: ${canonical} is not in sitemap.xml`));
    if (noindex && locs.has(canonical)) (errors++, console.log(`✗ ${file}: noindex page ${canonical} is listed in sitemap.xml`));
  }
  const robots = await readFile(join(DIST, 'robots.txt'), 'utf8').catch(() => '');
  if (!/^Sitemap:\s*https?:\/\//m.test(robots)) (errors++, console.log('✗ robots.txt has no absolute Sitemap: line'));
} catch {
  /* reported above */
}
console.log(`\n[seo] ${files.length} page(s), ${errors} error(s), ${warnings} warning(s)`);
process.exit(errors === 0 ? 0 : 1);
