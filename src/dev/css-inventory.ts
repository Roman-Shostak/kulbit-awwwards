/**
 * Reads tokens.css and utilities.css (as raw text) and turns them into the inventory shown on
 * /dev/tokens. Grouping follows the `/* ---------- Group name ---------- *\/` header comments in
 * the CSS files, so a token or utility added under a header appears on the page automatically,
 * in that group. A trailing `/* note *\/` after a token (the Figma variable name) is shown too.
 * Dev-only code: not part of the site build.
 */

export interface Token {
  name: string;
  value: string;
  note?: string;
  /** media query label → value */
  overrides: Record<string, string>;
}

export interface Utility {
  /** full selector as written (unescaped), e.g. `.flex-h/v/v` or `[data-motion] .header-fixed.is--intro` */
  selector: string;
  /** the class name when the selector is one plain class (`flex-h/v/v`), otherwise undefined */
  className?: string;
  declarations: string;
  overrides: Record<string, string>;
}

export interface Group<T> {
  title: string;
  items: T[];
  /** every media label that appears in this group's overrides, in file order */
  medias: string[];
}

const COMMENT_RE = /\/\*([\s\S]*?)\*\//g;
const NOTE_RE = /^[ \t]*(--[\w-]+)\s*:[^;]*;[ \t]*\/\*\s*(.*?)\s*\*\/[ \t]*$/gm;

/** Human label for a media query: (max-width: 991px) → ≤991 */
export function mediaLabel(query: string): string {
  const q = query.replace(/\s+/g, ' ').trim();
  const min = q.match(/min-width:\s*(\d+)px/)?.[1];
  const max = q.match(/max-width:\s*(\d+)px/)?.[1];
  if (min && max) return `${min}–${max}`;
  if (min) return `≥${min}`;
  if (max) return `≤${max}`;
  if (/reduced-motion/.test(q)) return 'reduced motion';
  return q;
}

/** Splits a stylesheet into [root body, media bodies…] in file order (top-level @media only) */
function splitMedia(css: string): { media: string | null; body: string }[] {
  const parts = css.split(/@media\s*([^{]+?)\s*\{/);
  const out: { media: string | null; body: string }[] = [{ media: null, body: parts[0] ?? '' }];
  for (let i = 1; i < parts.length; i += 2) out.push({ media: mediaLabel(parts[i] ?? ''), body: parts[i + 1] ?? '' });
  return out;
}

/** Marks group headers, strips every other comment */
function prepare(body: string): { text: string; notes: Map<string, string> } {
  const notes = new Map<string, string>();
  for (const match of body.matchAll(NOTE_RE)) notes.set(match[1]!, match[2]!);
  // A comment that starts with ---------- is a group header: its title is the first line without
  // the dashes (the header may continue on more lines); every other comment is dropped.
  const text = body.replace(COMMENT_RE, (_, inner: string) => {
    const header = inner.match(/^\s*-{4,}\s*([^\n]*)/);
    if (!header) return '';
    const title = header[1]!.replace(/\s*-{4,}\s*$/, '').replace(/[.:]\s*$/, '').trim();
    return `\n@@GROUP ${title}@@\n`;
  });
  return { text, notes };
}

function finish<T extends { overrides: Record<string, string> }>(groups: Map<string, T[]>): Group<T>[] {
  return [...groups.entries()]
    .filter(([, items]) => items.length > 0)
    .map(([title, items]) => {
      const medias: string[] = [];
      for (const item of items) for (const m of Object.keys(item.overrides)) if (!medias.includes(m)) medias.push(m);
      // desktop-first order: ≥992, ≤991, 768–991, 480–767, ≤479 … (by the first number, descending)
      medias.sort((a, b) => (parseInt(b.match(/\d+/)?.[0] ?? '0', 10) || 0) - (parseInt(a.match(/\d+/)?.[0] ?? '0', 10) || 0));
      return { title, items, medias };
    });
}

export function parseTokens(css: string): Group<Token>[] {
  const groups = new Map<string, Token[]>();
  const byName = new Map<string, Token>();
  let current = 'Tokens';
  const re = /@@GROUP (.*?)@@|(--[\w-]+)\s*:\s*([^;]+);/g;
  // comments go first (a comment may mention "@media"), then the file is split into media blocks
  const { text: prepared, notes } = prepare(css);

  for (const { media, body: text } of splitMedia(prepared)) {
    for (const match of text.matchAll(re)) {
      if (match[1] !== undefined) {
        current = match[1];
        if (!groups.has(current)) groups.set(current, []);
        continue;
      }
      const name = match[2]!;
      const value = match[3]!.replace(/\s+/g, ' ').trim();
      let token = byName.get(name);
      if (!token) {
        token = { name, value: media ? '' : value, note: notes.get(name), overrides: {} };
        byName.set(name, token);
        if (!groups.has(current)) groups.set(current, []);
        groups.get(current)!.push(token);
      }
      if (media) token.overrides[media] = value;
      else token.value = value;
    }
  }
  return finish(groups);
}

const KEYFRAMES_RE = /@keyframes[^{]*\{(?:[^{}]*\{[^{}]*\})*\s*\}/g;

function unescapeSelector(selector: string): string {
  return selector.replace(/\\\//g, '/').replace(/\\%/g, '%').replace(/\s+/g, ' ').trim();
}

export function parseUtilities(css: string): Group<Utility>[] {
  const groups = new Map<string, Utility[]>();
  const bySelector = new Map<string, Utility>();
  let current = 'Utilities';
  const re = /@@GROUP (.*?)@@|([^{}@]+)\{([^{}]*)\}/g;
  const { text: prepared } = prepare(css);

  for (const { media, body: text } of splitMedia(prepared)) {
    for (const match of text.replace(KEYFRAMES_RE, '').matchAll(re)) {
      if (match[1] !== undefined) {
        current = match[1];
        if (!groups.has(current)) groups.set(current, []);
        continue;
      }
      const declarations = match[3]!
        .split(';')
        .map((d) => d.replace(/\s+/g, ' ').trim())
        .filter(Boolean)
        .join(';\n');
      for (const raw of match[2]!.split(',')) {
        const selector = unescapeSelector(raw);
        if (!selector) continue;
        let utility = bySelector.get(selector);
        if (!utility) {
          const plain = /^\.[\w-]+(\/[\w-]+)*%?$/.test(selector) ? selector.slice(1) : undefined;
          utility = { selector, className: plain, declarations: '', overrides: {} };
          bySelector.set(selector, utility);
          if (!groups.has(current)) groups.set(current, []);
          groups.get(current)!.push(utility);
        }
        if (media) utility.overrides[media] = [utility.overrides[media], declarations].filter(Boolean).join(';\n');
        else utility.declarations = [utility.declarations, declarations].filter(Boolean).join(';\n');
      }
    }
  }
  return finish(groups);
}

export type TokenKind =
  | 'color'
  | 'length'
  | 'font-size'
  | 'font-family'
  | 'font-weight'
  | 'line-height'
  | 'letter-spacing'
  | 'radius'
  | 'border'
  | 'duration'
  | 'easing'
  | 'shadow'
  | 'plain';

/** How a token is previewed, from its name prefix */
export function tokenKind(name: string): TokenKind {
  if (/^--(swatch|theme)-/.test(name)) return 'color';
  if (/^--font-(primary|secondary)(-custom)?$/.test(name)) return 'font-family';
  if (/^--font-weight-/.test(name)) return 'font-weight';
  if (/^--font-/.test(name)) return 'font-size';
  if (/^--line-height-/.test(name)) return 'line-height';
  if (/^--letter-spacing-/.test(name)) return 'letter-spacing';
  if (/^--radius-/.test(name)) return 'radius';
  if (/^--border-width-/.test(name)) return 'border';
  if (/^--transition-(duration|stagger)/.test(name)) return 'duration';
  if (/^--transition-easing/.test(name)) return 'easing';
  if (/^--shadow-/.test(name)) return 'shadow';
  if (/^--(size|spacing|section-padding|container-padding|header-|column-|col-|t-col-|m-col-|icon-height-|button-padding-)/.test(name)) return 'length';
  return 'plain';
}

export type UtilityKind = 'layout' | 'self' | 'col' | 'padding' | 'text' | 'icon' | 'border' | 'visibility' | 'theme' | 'box' | 'none';

/** How a utility class is demonstrated, from its name */
export function utilityKind(className?: string): UtilityKind {
  if (!className) return 'none';
  if (/^align-self-/.test(className)) return 'self';
  if (/^(flex-|wrap$|align-|justify-|spacing-|grid-)/.test(className)) return 'layout';
  if (/^col-\d/.test(className)) return 'col';
  if (/^padding-/.test(className)) return 'padding';
  if (/^text-/.test(className)) return 'text';
  if (/^icon-/.test(className)) return 'icon';
  if (/^border-/.test(className)) return 'border';
  if (/-(hide|only)$/.test(className)) return 'visibility';
  if (className === 'theme--dark') return 'theme';
  if (/^(width-100|height-100|position-relative|overflow-hidden|margin-top-auto|fill-cover|fill-box|u-svg|u-path|sr-only|display-none)$/.test(className)) return 'box';
  return 'none';
}

export function slug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
