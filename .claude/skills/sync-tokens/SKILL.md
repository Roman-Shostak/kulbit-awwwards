---
name: sync-tokens
description: Build or update the project's design system from Figma — first step of every project. Walks EVERY element of the desktop, tablet and mobile frames (variables and styles when they exist, raw values always), counts what repeats, turns it into tokens in src/styles/tokens.css, reusable text-size/colour utilities in utilities.css and a list of ui components to build, and saves the inventory. Use when the user asks to sync/import/collect tokens, styles or variables from Figma, or before the first section of a project.
---

# Sync design tokens from Figma (design inventory)

Input: the Figma URLs of the desktop frame and, when they exist, the tablet and mobile frames.
Output: `src/styles/tokens.css` filled, `text-size-*` / `.theme--dark` utilities in `src/styles/utilities.css`,
the inventory saved to `src/dev/inventory.md`, a list of ui components to build, and a report.

This is the **first step of a new project**, before any section is built, whether or not the Figma
file has a variable system. Most client files do not: values are raw, repeated by hand and slightly
inconsistent. The inventory finds what repeats and gives it ONE token and ONE class, so every
section reuses the same classes instead of inventing arbitrary values (`class-naming.md` → Reuse first).

## Steps

1. **Load the Figma skills.** `figma:figma-design-to-code` before any Figma call; `figma:figma-use` before `use_figma`.
2. **Variables and styles, if any.** `get_variable_defs` for each frame; through `use_figma`:
   `figma.variables.getLocalVariablesAsync()`, `figma.getLocalTextStylesAsync()`, `figma.getLocalPaintStylesAsync()`.
   Whatever exists is mapped **by name**, 1:1 (step 4). Do not stop here: bound values are usually only part of the file.
3. **Walk every element** of each frame (desktop, tablet, mobile) with `use_figma` and count usages —
   the reference script below (adapt per the `figma-use` skill; run once per frame with its node id).
   It returns, with counts and the sections where each occurs: text styles (family, weight, size,
   line-height, letter-spacing, Figma style name), colours by role (text / bg / icon / stroke, and
   whether bound to a variable), gaps, paddings, radii, strokes, and component instances.
   If `use_figma` is unavailable, fall back to `get_design_context` section by section and tally by hand.
   ```js
   // use_figma — inventory of one frame. Replace NODE_ID; run for desktop, tablet, mobile.
   const root = await figma.getNodeByIdAsync('NODE_ID');
   const nodes = root.findAll(() => true);
   const bump = (map, key, where) => { const e = map.get(key) ?? { n: 0, where: new Set() }; e.n++; e.where.add(where); map.set(key, e); };
   const sectionOf = (node) => { let n = node; while (n.parent && n.parent.id !== root.id) n = n.parent; return n.name; };
   const hex = (c, o = 1) => { const h = (v) => Math.round(v * 255).toString(16).padStart(2, '0'); return `#${h(c.r)}${h(c.g)}${h(c.b)}${o < 1 ? ` ${Math.round(o * 100)}%` : ''}`; };
   const text = new Map(), colours = new Map(), gaps = new Map(), paddings = new Map(), radii = new Map(), strokes = new Map(), instances = new Map();
   for (const node of nodes) {
     const where = sectionOf(node);
     if (node.type === 'TEXT') {
       for (const s of node.getStyledTextSegments(['fontName', 'fontSize', 'lineHeight', 'letterSpacing', 'textStyleId', 'fills'])) {
         const lh = s.lineHeight.unit === 'AUTO' ? 'auto' : s.lineHeight.unit === 'PERCENT' ? `${s.lineHeight.value}%` : `${s.lineHeight.value}px`;
         const ls = s.letterSpacing.unit === 'PERCENT' ? `${s.letterSpacing.value}%` : `${s.letterSpacing.value}px`;
         const style = s.textStyleId ? (await figma.getStyleByIdAsync(s.textStyleId))?.name : '';
         bump(text, `${s.fontName.family} ${s.fontName.style} ${s.fontSize}/${lh} ${ls}${style ? ` [${style}]` : ''}`, where);
         for (const f of s.fills) if (f.type === 'SOLID' && f.visible !== false) bump(colours, `text ${hex(f.color, f.opacity)}${f.boundVariables?.color ? ' [var]' : ''}`, where);
       }
       continue;
     }
     if ('fills' in node && Array.isArray(node.fills)) for (const f of node.fills) if (f.type === 'SOLID' && f.visible !== false)
       bump(colours, `${node.type === 'VECTOR' || node.type === 'BOOLEAN_OPERATION' ? 'icon' : 'bg'} ${hex(f.color, f.opacity)}${f.boundVariables?.color ? ' [var]' : ''}`, where);
     if ('strokes' in node && Array.isArray(node.strokes)) for (const f of node.strokes) if (f.type === 'SOLID') bump(strokes, `${hex(f.color, f.opacity)} ${node.strokeWeight}px`, where);
     if ('layoutMode' in node && node.layoutMode !== 'NONE') {
       bump(gaps, `${node.itemSpacing}`, where);
       bump(paddings, `${node.paddingTop} ${node.paddingRight} ${node.paddingBottom} ${node.paddingLeft}`, where);
     }
     if ('cornerRadius' in node && typeof node.cornerRadius === 'number' && node.cornerRadius > 0) bump(radii, `${node.cornerRadius}`, where);
     if (node.type === 'INSTANCE') { const main = await node.getMainComponentAsync(); bump(instances, main?.parent?.type === 'COMPONENT_SET' ? main.parent.name : main?.name ?? node.name, where); }
   }
   const dump = (title, map) => `## ${title}\n` + [...map.entries()].sort((a, b) => b[1].n - a[1].n).map(([k, v]) => `${v.n}× ${k} — ${[...v.where].join(', ')}`).join('\n');
   return [dump('Text', text), dump('Colours', colours), dump('Strokes', strokes), dump('Gaps', gaps), dump('Paddings', paddings), dump('Radii', radii), dump('Instances', instances)].join('\n\n');
   ```
4. **Consolidate into the system** — one token + one class per thing that repeats:
   - **Frame width** → `--reference` / `--max` (desktop) and the tablet/mobile `--reference`.
   - **Text styles.** Group by family + weight + size + line-height + letter-spacing. A Figma text style keeps its name in kebab-case (`desktop/body md (sb)` → `body-md-sb`). Unnamed styles get a role name from their place in the size ladder: heading sizes (larger than the body text) → `h1`, `h2`, `h3`… from the largest down; body sizes → `body-lg`, `body-md` (the most used text style), `body-sm`; the smallest → `caption`; the navigation style → `link`; text inside buttons → `button`; text inside inputs → `placeholder`; a second family → `<name>-<family>` (`h2-stix`). Every style used in **2 or more places** (or any heading) becomes `--font-<name>` (+ mobile/tablet values), `--line-height-<name>`, `--letter-spacing-<name>` when not 0, and `.text-size-<name>` = the full style (family/style too for the secondary font). Weight and colour stay separate utilities. A style used once is listed in the report as a one-off (the component will use `text-size-N/N/N`) unless the user promotes it. **Page default:** point `--font-default`, `--line-height-default`, `--letter-spacing-default` (the only typography tokens `base.css` reads) at the most used body style — `--font-default: var(--font-body-18)` — so the style keeps its Figma name and no alias token is needed.
   - **Near-duplicates** (18/1.4 next to 18/1.45, #1a1a1a next to #1b1b1b, gap 24 next to 25) are almost always drawing noise: list them side by side with counts and **ask before merging** — never merge silently. After approval the dominant value wins and the token comment records the merge.
   - **Colours.** Every distinct colour → `--swatch-<name>` (the Figma style/variable name, otherwise a plain colour word: `slate`, `beige`, `grey-light`). Roles from context: the most used text colour → `--theme-text`, the next → `--theme-text-secondary`, the accent used for text/buttons/tags → `--theme-text-brand` / `--theme-button-primary-bg`, text on dark or brand backgrounds → `--theme-text-inverse`; the page frame fill → `--theme-page-bg`; dark section fills → `--theme-section-bg-dark`; card fills → `--theme-card-bg` / `--theme-card-bg-brand`; icon fills → `--theme-icon` / `--theme-icon-secondary`; input fills/strokes → `--theme-input-*`; decorative vectors → `--theme-illustration`. Colours that stay the same on dark sections → `alw` tokens. Values that the same roles take inside dark sections → `.theme--dark, .footer` in `utilities.css`.
   - **Spacing.** Distinct gaps sorted ascending → `--spacing-tiny/xs/sm/md/lg/xl/2xl/3xl/4xl` (as many as exist; a value used once is a one-off); top/bottom paddings of the section frames → `--section-padding-sm/md/lg`; the page frame's side padding → `--container-padding`; header padding and logo height → `--header-padding`, `--header-height`; repeated child widths → the 12-column formula (`12·col + 11·gap = frame − 2·padding`) → `--column-gap`, and the tablet frame's fixed widths → `--t-col-N`.
   - **Shape and rest.** Radii ascending → `--radius-xs/sm/md/lg/xl` (pills → `full`); stroke widths → `--border-width-*`; icon heights → `--icon-height-*`; button paddings → `--button-padding-*`; shadows → `--shadow-*`.
   - **Repeated elements → ui components.** Figma components/instances and any frame pattern that appears in 2+ places (pill tag, card, numbered circle, input, button, social link) → the list of `src/components/ui/` components (+ their variants: `type--`, `size--`) to build **before** the sections. The template ships no ui components: `Button` is always first on the list (skeleton in `astro-components.md`), then `Tag`, `Card`, `Input` … as the design repeats them.
   Sizes always resolve to a `--size-N` primitive (add a missing one, e.g. `--size-15`); colours as hex/rgb in `--swatch-*` only.
5. **Write** `tokens.css`: desktop → `:root`, tablet → `@media (max-width: 991px)`, mobile → `@media (max-width: 479px)` — only what differs. Every token goes **under the `/* ---------- Group ---------- */` header of its group** with a trailing comment `/* Figma name · N uses */` (that is how `/dev/tokens` groups and annotates it). Keep existing token names, change values; rename only after listing every usage. Add the `text-size-*` utilities and the `.theme--dark, .footer` block to `utilities.css` under their headers.
6. **Save the inventory** to `src/dev/inventory.md` (the template with the table headings is already there; replace its empty state): frames, the mapping table "value → token / utility / component", the approved merges, the one-offs, the ui components to build, and the raw counts from step 3 per frame. It is the reference for every later section: before inventing a class, grep it.
7. **Verify and report.** `pnpm build` (no pipe); open `http://localhost:4321/dev/tokens` and check every changed group. Report: the mapping table (value · uses · token · class), the proposed merges awaiting approval, the ui components to build, the one-offs, Figma values with no token that need a decision, and a separate list of emoji found in text nodes (flags become SVG icons, `images.md`).

## Do not
- Do not build anything the user did not name in this request (sections, components — only the list).
- Do not stop at variables: the raw values on the elements are the system when the file has none.
- Do not merge or round values silently; propose, wait, then apply.
- Do not create a token or class for a value used once (it is an arbitrary class in its component), and do not leave a value used twice without one.
- Delete tokens that are in use.
- Touch `base.css` or components as part of a sync; in `utilities.css` change only the `text-size-<name>` utilities and the `.theme--dark, .footer` block.
- Guess values that Figma does not provide — mark them `/* TODO: not in Figma */`.
- Put weight or colour into a `text-size-*` utility.
