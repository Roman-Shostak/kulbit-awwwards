---
name: sync-tokens
description: Set up the base of the project's design system from Figma at the start of a project — the frame widths (fluid scale), the side padding and column grid, the font families and weights, and the 2–4 main brand colours — and record the Figma names of text styles and colour variables for the final /systemize pass. Everything else (text sizes, gaps, radii, secondary colours) stays out of tokens during development. Use when the user asks to sync/import tokens, styles or variables from Figma, or before the first section of a project.
---

# Sync the base tokens from Figma (start of a project)

Input: the Figma URLs of the desktop frame and, when they exist, the tablet and mobile frames.
Output: the base values in `src/styles/tokens.css`, the Figma names noted in `src/dev/inventory.md`
(`Phase: development`), and a short report.

Client files are rarely consistent: the same gap is 23, 24 and 25 px, two near-identical greys sit side by
side. Building the full token system from that at the start meant rebuilding it after every design change.
So the project runs in two phases (`styles.md` → Phases): during **development** only the stable base is a
token and every other value is written exactly as in Figma in the component; at the end **`/systemize`**
collects what was really built and turns it into the system. This skill sets up the base only.

## Steps

1. **Load the Figma skills.** `figma:figma-design-to-code` before any Figma call; `figma:figma-use` before `use_figma`.
2. **Read the frames.** `get_metadata` for desktop, tablet and mobile (frame widths, the page frame's side
   padding and layout grid); `get_variable_defs` for each frame; through `use_figma`
   `figma.getLocalTextStylesAsync()`, `figma.getLocalPaintStylesAsync()` and
   `figma.variables.getLocalVariablesAsync()` — for the names only.
3. **Fonts and colours in use** — one `use_figma` call per frame (adapt per the `figma-use` skill):
   ```js
   // use_figma — font families/weights and fill colours of one frame, with counts. Replace NODE_ID.
   const root = await figma.getNodeByIdAsync('NODE_ID');
   const hex = (c, o = 1) => { const h = (v) => Math.round(v * 255).toString(16).padStart(2, '0'); return `#${h(c.r)}${h(c.g)}${h(c.b)}${o < 1 ? ` ${Math.round(o * 100)}%` : ''}`; };
   const fonts = new Map(), colours = new Map();
   const bump = (map, key) => map.set(key, (map.get(key) ?? 0) + 1);
   for (const node of root.findAll(() => true)) {
     if (node.type === 'TEXT') for (const s of node.getStyledTextSegments(['fontName', 'fills'])) {
       bump(fonts, `${s.fontName.family} ${s.fontName.style}`);
       for (const f of s.fills) if (f.type === 'SOLID' && f.visible !== false) bump(colours, `text ${hex(f.color, f.opacity)}`);
     } else if ('fills' in node && Array.isArray(node.fills)) for (const f of node.fills) if (f.type === 'SOLID' && f.visible !== false) bump(colours, `fill ${hex(f.color, f.opacity)}`);
   }
   const dump = (t, m) => `## ${t}\n` + [...m.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${n}× ${k}`).join('\n');
   return [dump('Fonts', fonts), dump('Colours', colours)].join('\n\n');
   ```
4. **Write the base to `tokens.css`** (keep the token names, change values; each under its group header):
   - **Frames** → `--reference` / `--max` (desktop frame width), the tablet and mobile `--reference`.
   - **Side padding and grid** → `--container-padding` (per breakpoint), `--column-gap` from the layout grid (or
     `12·col + 11·gap = frame − 2·padding` from repeated column widths), the tablet frame's fixed widths → `--t-col-N`.
   - **Fonts** → `--font-primary` / `--font-secondary` families (the Fonts API files come from `pnpm fonts`);
     the weights in use are the `text-weight-*` utilities that may be used — a weight without a font file is
     reported, never synthesised.
   - **Main colours (2–4)** → `--swatch-*` + the roles that are unmistakable: `--theme-page-bg` (the page frame
     fill), `--theme-text` (the most used text colour), `--theme-text-brand` / `--theme-button-primary-bg` (the
     accent), `--theme-section-bg-dark` (when the design has dark sections). Nothing else — secondary greys,
     borders, card fills wait for `/systemize`.
   Text styles, gaps, section paddings, radii, shadows are **not** tokenised now; the template's placeholder
   values for them stay untouched and are not used by sections during development.
5. **Record in `src/dev/inventory.md`** (keep `Phase: development`): the frames (node ids, widths), the base
   tokens written, the fonts and weights, and the **Figma names** — text styles (name → size/line-height) and
   colour variables/styles (name → hex) — for `/systemize` to name the system after. No mapping table.
6. **Verify and report.** `pnpm check` (no pipe), `pnpm build`; `http://localhost:4321/dev/tokens` shows the base
   groups. Report: the base tokens, the fonts and weights (and missing font files), the colours left for
   `/systemize` with their counts, the Figma style names found, emoji found in text nodes (flags become SVG
   icons, `images.md`).

## Do not
- Do not build anything the user did not name in this request (sections, components).
- Do not tokenise text sizes, gaps, paddings, radii or secondary colours now — that is `/systemize` at the end.
- Do not merge or round values; do not guess values Figma does not provide (`/* TODO: not in Figma */`).
- Do not touch `utilities.css`, `base.css` or components as part of a sync.
- Do not delete template tokens: `/systemize` removes the ones the project never used.
