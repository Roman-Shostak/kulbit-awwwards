#!/usr/bin/env node
// /systemize, step 1 — collects every raw design value written in the project's styles.
//
//   node .claude/skills/systemize/scripts/collect.mjs              markdown report to stdout
//   node .claude/skills/systemize/scripts/collect.mjs --json out.json   + every declaration as JSON
//   node .claude/skills/systemize/scripts/collect.mjs --root <dir>      another project root (tests)
//
// Reads the <style> blocks of src/**/*.astro (src/dev/ excluded: tooling) and src/styles/utilities.css,
// resolves sizes to px on the reference frame (`calc(1.5rem * var(--fluid-scale))` → 24, `var(--size-24)` → 24,
// `24px` → 24), normalises colours to lowercase hex, and groups them:
//   - per category (colour, typography, spacing, size, radius, border, shadow, motion, other) — value → uses, where;
//   - per rule: the same file + selector + property across desktop / tablet (991) / mobile (479) → a d/t/m triple,
//     which is what a token with breakpoint values replaces;
//   - text styles: font-size + line-height + letter-spacing (+ family/weight) of one selector per breakpoint;
//   - tokens of tokens.css that nothing references, utilities of utilities.css that no markup uses.
// A declaration counts as raw when it holds a number with a unit, a colour or a named easing/duration that is not
// a design token (`var(--spacing-md)` is a token; `var(--size-N)` and the fluid-scale calc are raw sizes).
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const args = process.argv.slice(2);
const option = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const root = option('--root') ?? process.cwd();
const jsonOut = option('--json');

const walk = (dir, filter, out = []) => {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, filter, out);
    else if (filter(path)) out.push(path);
  }
  return out;
};
const read = (path) => readFileSync(path, 'utf8');
const lineAt = (text, index) => text.slice(0, index).split('\n').length;

// ---------- CSS parsing: declarations with selector, media context and line ----------
const parseCss = (css, file, lineOffset) => {
  const declarations = [];
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
  const stack = [];
  let buffer = '';
  let bufferStart = 0;
  const flush = (end) => {
    const text = buffer.trim();
    buffer = '';
    const top = stack.at(-1);
    if (!text || !top || top.prelude.startsWith('@')) return;
    const colon = text.indexOf(':');
    if (colon < 0) return;
    const property = text.slice(0, colon).trim().toLowerCase();
    const value = text.slice(colon + 1).trim();
    if (property.startsWith('--')) return; // custom properties are tokens, handled separately
    const media = stack.filter((s) => s.prelude.startsWith('@media')).map((s) => s.prelude);
    declarations.push({ file, line: lineOffset + lineAt(clean, bufferStart) - 1, selector: top.prelude, media: breakpointOf(media), property, value });
  };
  for (let i = 0; i < clean.length; i++) {
    const c = clean[i];
    if (c === '{') {
      stack.push({ prelude: buffer.trim().replace(/\s+/g, ' ') });
      buffer = '';
    } else if (c === '}') {
      flush(i);
      stack.pop();
    } else if (c === ';') {
      flush(i);
    } else {
      if (!buffer.trim()) bufferStart = i;
      buffer += c;
    }
  }
  return declarations;
};

const breakpointOf = (media) => {
  if (!media.length) return 'desktop';
  const query = media.join(' and ');
  const max = query.match(/max-width:\s*(\d+)px/);
  if (max) return { 991: 'tablet', 767: 'landscape', 479: 'mobile' }[max[1]] ?? `other (${query.replace(/@media\s*/, '')})`;
  return `other (${query.replace(/@media\s*/g, '')})`;
};

// ---------- values ----------
const COLOUR = /#[0-9a-f]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)/gi;
const HAS_COLOUR = /#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/i;
const toHex = (colour) => {
  const c = colour.toLowerCase();
  if (c.startsWith('#')) {
    const h = c.slice(1);
    const full = h.length <= 4 ? [...h].map((x) => x + x).join('') : h;
    return full.length === 8 && full.endsWith('ff') ? `#${full.slice(0, 6)}` : `#${full}`;
  }
  const parts = c.match(/[\d.]+%?/g) ?? [];
  if (c.startsWith('rgb') && parts.length >= 3) {
    const [r, g, b] = parts.slice(0, 3).map((p) => (p.endsWith('%') ? Math.round(parseFloat(p) * 2.55) : Math.round(parseFloat(p))));
    const a = parts[3] ? (parts[3].endsWith('%') ? parseFloat(parts[3]) / 100 : parseFloat(parts[3])) : 1;
    const hex = (v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0');
    return `#${hex(r)}${hex(g)}${hex(b)}${a < 1 ? hex(Math.round(a * 255)) : ''}`;
  }
  return c;
};
// Every length in a value, in px on the reference frame (the fluid scale is 1 there)
const lengthsPx = (value) => {
  const out = [];
  const v = value
    .replace(/calc\(\s*([\d.]+)rem\s*\*\s*var\(--fluid-scale\)\s*\)/g, (_, n) => {
      out.push(+(parseFloat(n) * 16).toFixed(2));
      return ' ';
    })
    .replace(/var\(--size-(\d+)\)/g, (_, n) => {
      out.push(+n);
      return ' ';
    });
  for (const m of v.matchAll(/(-?[\d.]+)(px|rem|em)\b/g)) out.push(m[2] === 'px' ? +m[1] : m[2] === 'rem' ? +(m[1] * 16).toFixed(2) : `${m[1]}em`);
  return out;
};
const usesDesignToken = (value) => /var\(--(?!size-|fluid-scale|col-|t-col-|m-col-|column-)[\w-]+\)/.test(value);

const categoryOf = (property, value) => {
  if (/^(font-size|line-height|letter-spacing|font-weight|font-family|font-style|text-transform)$/.test(property)) return 'typography';
  if (/shadow$/.test(property)) return 'shadow';
  if (/^(transition|animation)/.test(property)) return 'motion';
  if (/radius/.test(property)) return 'radius';
  if (/^(gap|row-gap|column-gap)$|^(padding|margin)/.test(property)) return 'spacing';
  if (/^(border|outline)(-(top|right|bottom|left))?(-width)?$/.test(property)) return 'border';
  if (/^(width|height|min-|max-|flex-basis|aspect-ratio|inset|top|right|bottom|left)/.test(property)) return 'size';
  if (HAS_COLOUR.test(value) || /color$|^fill$|^stroke$|^background/.test(property)) return 'colour';
  return 'other';
};

const isRaw = (d) => {
  if (d.category === 'typography') {
    if (/^(font-family|font-style|text-transform)$/.test(d.property)) return !usesDesignToken(d.value) && d.property === 'font-family';
    return !usesDesignToken(d.value) && /[\d]/.test(d.value) && d.value !== '0';
  }
  if (d.category === 'motion') return /\d(m?s)\b|cubic-bezier|ease/.test(d.value.replace(/var\([^)]*\)/g, ''));
  if (d.colours.length) return true;
  if (usesDesignToken(d.value) && !d.lengths.length) return false;
  return d.lengths.some((l) => typeof l === 'string' || l !== 0);
};

// ---------- files ----------
const src = join(root, 'src');
const astroFiles = walk(src, (p) => p.endsWith('.astro') && !p.includes(`${join('src', 'dev')}`));
const declarations = [];
for (const path of astroFiles) {
  const text = read(path);
  for (const m of text.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) {
    const offset = lineAt(text, m.index + m[0].indexOf('>') + 1);
    declarations.push(...parseCss(m[1], relative(root, path), offset));
  }
}
const utilitiesPath = join(src, 'styles', 'utilities.css');
declarations.push(...parseCss(read(utilitiesPath), relative(root, utilitiesPath), 1));

for (const d of declarations) {
  d.colours = (d.value.match(COLOUR) ?? []).map(toHex);
  d.lengths = lengthsPx(d.value);
  d.category = categoryOf(d.property, d.value);
  d.raw = isRaw(d);
}
const raw = declarations.filter((d) => d.raw);

// Inline style="" in markup (forbidden by the rules, reported as is)
const inlineStyles = [];
for (const path of astroFiles) {
  const text = read(path);
  for (const m of text.matchAll(/\sstyle="([^"]*)"/g)) inlineStyles.push(`${relative(root, path)}:${lineAt(text, m.index)} — ${m[1]}`);
}

// ---------- tokens and utilities usage ----------
const tokensPath = join(src, 'styles', 'tokens.css');
const tokensCss = read(tokensPath);
const tokenNames = [...new Set([...tokensCss.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]))];
const allStyles = walk(src, (p) => /\.(astro|css|ts)$/.test(p) && !p.includes(`${join('src', 'dev')}`)).map(read).join('\n');
const unusedTokens = tokenNames.filter((name) => {
  const references = allStyles.split(`var(${name})`).length - 1 + (allStyles.split(`var(${name},`).length - 1);
  return references === 0;
});
const markup = astroFiles.map(read).join('\n');
const classesUsed = new Set();
for (const m of markup.matchAll(/class(?::list)?=\{?["'`[]([^"'`\]}]*)/g)) for (const c of m[1].split(/[\s,'"]+/)) if (c) classesUsed.add(c);
const utilitySelectors = declarations.filter((d) => d.file.endsWith('utilities.css')).map((d) => d.selector);
const utilityClasses = [...new Set(utilitySelectors.flatMap((s) => [...s.matchAll(/\.((?:[a-z][\w-]*|\\.)(?:[\w-]|\\.)*)/gi)].map((m) => m[1].replace(/\\/g, ''))))];
const unusedUtilities = utilityClasses.filter((c) => !classesUsed.has(c) && !/^(is--|wrapper$|main$|footer$|header$|header-fixed$|skip-link$|section--hero$)/.test(c));

// ---------- aggregation ----------
const where = (d) => d.where ?? `${d.file}:${d.line}`;
const group = (items, key) => {
  const map = new Map();
  for (const item of items) {
    const k = key(item);
    if (k === undefined) continue;
    const e = map.get(k) ?? { uses: 0, where: [] };
    e.uses++;
    e.where.push(where(item));
    map.set(k, e);
  }
  return [...map.entries()].sort((a, b) => b[1].uses - a[1].uses);
};
const px = (l) => (typeof l === 'number' ? `${l}px` : l);

// d/t/m triples: one rule (file + selector + property) across breakpoints
const rules = new Map();
for (const d of raw) {
  if (d.file.endsWith('utilities.css')) continue;
  const key = `${d.file}|${d.selector.replace(/\s+/g, ' ')}|${d.property}`;
  const e = rules.get(key) ?? { file: d.file, selector: d.selector, property: d.property, category: d.category, line: d.line, values: {} };
  e.values[d.media] = d.lengths.length || d.colours.length ? [...d.lengths.map(px), ...d.colours].join(' ') : d.value;
  rules.set(key, e);
}
const triple = (r) => ['desktop', 'tablet', 'mobile'].map((bp, i) => r.values[bp] ?? (i === 0 ? '—' : '=')).join(' / ');

// Text styles: size + line-height + letter-spacing (+ family, weight) of one selector per breakpoint
const textStyles = new Map();
for (const d of raw.filter((x) => x.category === 'typography' && !x.file.endsWith('utilities.css'))) {
  const key = `${d.file}|${d.selector}`;
  const e = textStyles.get(key) ?? { where: `${d.file}:${d.line}`, selector: d.selector, bp: {} };
  (e.bp[d.media] ??= {})[d.property] = d.lengths.length ? d.lengths.map(px).join(' ') : d.value;
  textStyles.set(key, e);
}
const textSignature = (s) =>
  ['desktop', 'tablet', 'mobile']
    .map((bp) => {
      const t = s.bp[bp];
      if (!t) return bp === 'desktop' ? '—' : '=';
      return [t['font-size'], t['line-height'] && `/${t['line-height']}`, t['letter-spacing'] && ` ${t['letter-spacing']}`, t['font-weight'] && ` w${t['font-weight']}`, t['font-family'] && ` ${t['font-family']}`]
        .filter(Boolean)
        .join('');
    })
    .join(' ‖ ');

// ---------- report ----------
const lines = [];
const out = (s = '') => lines.push(s);
const table = (head, rows) => {
  if (!rows.length) return out('_none_\n');
  out(`| ${head.join(' | ')} |`);
  out(`| ${head.map(() => '---').join(' | ')} |`);
  for (const r of rows) out(`| ${r.join(' | ')} |`);
  out();
};
const short = (list, n = 4) => (list.length > n ? `${list.slice(0, n).join(', ')} +${list.length - n}` : list.join(', '));

out('# Raw values in the project (/systemize, collect)');
out();
out(`Files: ${astroFiles.length} .astro (src/dev excluded) + utilities.css · declarations: ${declarations.length} · raw: ${raw.length}`);
out();
out('## Colours (normalised hex, every property)');
table(['Colour', 'Uses', 'Where'], group(raw.flatMap((d) => d.colours.map((c) => ({ ...d, c }))), (d) => d.c).map(([k, v]) => [`\`${k}\``, v.uses, short(v.where)]));
out('## Text styles (per selector: desktop ‖ tablet ‖ mobile — size/line-height letter-spacing weight family)');
table(['Style', 'Uses', 'Where'], group([...textStyles.values()], textSignature).map(([k, v]) => [k, v.uses, short(v.where)]));
for (const category of ['spacing', 'size', 'radius', 'border', 'shadow', 'motion', 'other']) {
  const rows = [...rules.values()].filter((r) => r.category === category);
  out(`## ${category[0].toUpperCase() + category.slice(1)} — d/t/m triples per rule`);
  table(['Property', 'Desktop / tablet / mobile', 'Uses', 'Where'], group(rows, (r) => `${r.property.replace(/-(top|right|bottom|left|block|inline)(-start|-end)?$/, '-*')} · ${triple(r)}`).map(([k, v]) => {
    const [property, values] = k.split(' · ');
    return [property, values, v.uses, short(v.where)];
  }));
}
out('## Other breakpoints (not 991 / 479 — check against the rules)');
table(['Media', 'Where'], group(raw.filter((d) => !['desktop', 'tablet', 'mobile'].includes(d.media)), (d) => d.media).map(([k, v]) => [k, short(v.where)]));
out('## Inline style="" (forbidden)');
table(['Where'], inlineStyles.map((s) => [s]));
out('## Tokens nothing references (tokens.css)');
out(unusedTokens.length ? unusedTokens.map((t) => `\`${t}\``).join(', ') : '_none_');
out();
out('## Utilities no markup uses (utilities.css; layout-owned wrappers and is--* excluded)');
out(unusedUtilities.length ? unusedUtilities.map((t) => `\`${t}\``).join(', ') : '_none_');
out();
out('Values inside <script> (GSAP durations, eases) are not collected: grep src/**/*.astro and src/scripts for them.');
process.stdout.write(lines.join('\n') + '\n');

if (jsonOut) writeFileSync(jsonOut, JSON.stringify({ declarations: raw, textStyles: [...textStyles.values()], unusedTokens, unusedUtilities, inlineStyles }, null, 2));
