// Screenshots and measurements of the built site, for comparing sections with the Figma frames.
//
//   pnpm shot                       1540, 768 and 390 px wide (the reference frames), whole page
//   pnpm shot 1536,1920,768,390     custom widths (px, comma-separated)
//   pnpm shot --section .hero       only the element(s) matching the selector
//   pnpm shot --path /about         another page (default /)
//   pnpm shot --motion              keep animations (default: prefers-reduced-motion so every
//                                   data-reveal element is visible and heights are final)
//   pnpm shot --url http://localhost:4321 --path /dev/tokens
//                                   shoot a running server (e.g. the dev pages) instead of `astro preview`
//   pnpm shot --check               every page from dist/sitemap.xml (or --path) and, per page, the console
//                                   errors, failed requests and 4xx/5xx responses (pre-launch check)
//
// Builds nothing: run `pnpm build` first (unless --url). Starts its own `astro preview` on a free port
// (foreground, `--ignore-lock`: it never reuses or blocks a preview server of this or another project —
// a fixed port once silently shot another project's site), scrolls through the page so lazy
// photos load and reveals fire, waits for every <img> and for the fonts, then prints the height of
// header, every `main > section` and the footer (compare with the Figma frame heights from
// get_metadata; > 2 % difference = look for the cause), saves screenshots/<width>.png (full page)
// and screenshots/<width>-<n>-<name>.png (one per section, element screenshots — the full-page
// capture may show empty boxes for lazy images, a Chromium decode artefact).
//
// Playwright: the devDependency (`pnpm exec playwright install chromium` once) or the global copy
// in the cloud sandbox (/opt/node22/lib/node_modules/playwright, browsers in /opt/pw-browsers).

import { spawn } from 'node:child_process';
import { mkdir, readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { createServer } from 'node:net';
import { dirname, join } from 'node:path';

const DEFAULT_WIDTHS = [1540, 768, 390];
const OUT = 'screenshots';

const args = process.argv.slice(2);
const option = (name) => {
  const i = args.indexOf(name);
  return i > -1 ? args[i + 1] : undefined;
};
const widths = (args.find((a) => /^\d+(,\d+)*$/.test(a)) ?? DEFAULT_WIDTHS.join(','))
  .split(',')
  .map(Number);
const section = option('--section');
const path = option('--path') ?? '/';
const keepMotion = args.includes('--motion');
const baseUrl = option('--url')?.replace(/\/$/, '');
const check = args.includes('--check');

async function loadPlaywright() {
  const require = createRequire(import.meta.url);
  for (const candidate of ['playwright', '/opt/node22/lib/node_modules/playwright']) {
    try {
      return require(candidate);
    } catch {
      /* try the next one */
    }
  }
  console.error('[shot] playwright not found: pnpm add -D playwright && pnpm exec playwright install chromium');
  process.exit(1);
}

// A port nobody listens on right now (the OS picks it), so two projects or two runs never collide
function freePort() {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.unref();
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

// Waits until OUR server answers on OUR port; a message from another server (Astro prints the URL of an
// already running preview and exits) is never taken for readiness
async function startPreview(port) {
  const url = `http://localhost:${port}`;
  // The astro binary itself, not `pnpm exec astro`: the server must be a direct child so that
  // proc.kill() stops it (a grandchild would survive and keep this script alive through the pipe)
  const astroBin = join(dirname(createRequire(import.meta.url).resolve('astro/package.json')), 'bin', 'astro.mjs');
  const proc = spawn(process.execPath, [astroBin, 'preview', '--port', String(port), '--ignore-lock'], {
    stdio: ['ignore', 'pipe', 'inherit'],
    // Astro runs `preview` as a background daemon when it detects an AI agent; the flag keeps it a
    // child of this script (and stops it with it)
    env: { ...process.env, ASTRO_PREVIEW_BACKGROUND: '1' },
  });
  proc.stdout.on('data', (chunk) => {
    const text = String(chunk);
    if (/already running/i.test(text)) console.error(`[shot] ${text.trim()}`);
  });
  const ready = new Promise((resolve, reject) => {
    let exited = false;
    proc.on('exit', (code) => {
      exited = true;
      reject(new Error(`astro preview exited with ${code} before serving ${url} — run \`pnpm build\` first`));
    });
    const started = Date.now();
    const poll = async () => {
      if (exited) return;
      try {
        const res = await fetch(`${url}/`, { redirect: 'manual' });
        if (res.status < 500) return resolve();
      } catch {
        /* not listening yet */
      }
      if (Date.now() - started > 20000) return reject(new Error(`astro preview did not answer on ${url} within 20 s`));
      setTimeout(poll, 200);
    };
    poll();
  });
  return { proc, ready, url };
}

async function settle(page) {
  // Scroll through the page in viewport steps so lazy images load and reveal observers fire
  await page.evaluate(async () => {
    const step = window.innerHeight;
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
    window.scrollTo(0, 0);
  });
  await page.evaluate(() =>
    Promise.all([
      document.fonts.ready,
      ...[...document.images].map((img) => (img.complete ? null : new Promise((r) => img.addEventListener('load', r, { once: true })))),
    ]),
  );
  await page.waitForTimeout(keepMotion ? 1500 : 300);
}

async function pagePaths() {
  if (option('--path') || !check) return [path];
  try {
    const sitemap = await readFile('dist/sitemap.xml', 'utf8');
    const paths = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
    return paths.length ? paths : [path];
  } catch {
    return [path];
  }
}
const paths = await pagePaths();
const problems = [];

const { chromium } = await loadPlaywright();
const { proc, ready, url } = baseUrl ? { proc: null, ready: Promise.resolve(), url: baseUrl } : await startPreview(await freePort());
try {
  await ready;
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  for (const width of widths) for (const path of paths) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
    if (!keepMotion) await page.emulateMedia({ reducedMotion: 'reduce' });
    if (check) {
      page.on('console', (msg) => msg.type() === 'error' && problems.push(`${width}px ${path} — console: ${msg.text()}`));
      page.on('pageerror', (err) => problems.push(`${width}px ${path} — error: ${err.message}`));
      page.on('requestfailed', (req) => problems.push(`${width}px ${path} — request failed: ${req.url()} (${req.failure()?.errorText})`));
      page.on('response', (res) => res.status() >= 400 && problems.push(`${width}px ${path} — ${res.status()} ${res.url()}`));
    }
    await page.goto(`${url}${path}`, { waitUntil: 'networkidle' });
    await settle(page);

    const selector = section ?? '.header-fixed, main > section, footer';
    const rows = await page.$$eval(selector, (nodes) =>
      nodes.map((node, i) => ({
        index: i + 1,
        name: node.id || node.className.split(' ').find((c) => c && !/^(section|padding|theme|flex|container)/.test(c)) || node.tagName.toLowerCase(),
        height: Math.round(node.getBoundingClientRect().height),
        width: Math.round(node.getBoundingClientRect().width),
      })),
    );
    const total = await page.evaluate(() => document.documentElement.scrollHeight);

    console.log(`\n[shot] ${width}px — ${path} — scrollHeight ${total}px`);
    for (const row of rows) console.log(`  ${String(row.index).padStart(2)}. ${row.name.padEnd(28)} ${String(row.height).padStart(5)} × ${row.width}`);

    const slug = paths.length > 1 ? `${path.replace(/^\/|\/$/g, '').replace(/[^a-z0-9-]+/gi, '-') || 'home'}-` : '';
    await page.screenshot({ path: `${OUT}/${slug}${width}.png`, fullPage: true, animations: 'disabled' });
    const elements = await page.$$(selector);
    for (const [i, el] of elements.entries()) {
      const name = rows[i]?.name.replace(/[^a-z0-9-]+/gi, '-') ?? `el-${i + 1}`;
      await el.screenshot({ path: `${OUT}/${slug}${width}-${i + 1}-${name}.png`, animations: 'disabled' });
    }
    console.log(`  → ${OUT}/${slug}${width}.png + ${elements.length} element screenshots`);
    await page.close();
  }
  await browser.close();
  if (check) {
    console.log(`\n[shot] runtime check: ${problems.length === 0 ? 'no console errors, failed requests or 4xx/5xx responses' : `${problems.length} problem(s)`}`);
    for (const problem of problems) console.log(`  ✗ ${problem}`);
    if (problems.length > 0) process.exitCode = 1;
  }
} finally {
  proc?.kill();
}
