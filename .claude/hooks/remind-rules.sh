#!/usr/bin/env bash
# PreToolUse hook (Edit | Write | MultiEdit).
# Injects a short reminder of the project rules into Claude's context right
# before a file is created or modified. It never blocks the tool call.
#
# Input : JSON on stdin ({ tool_name, tool_input: { file_path, ... } })
# Output: JSON with hookSpecificOutput.additionalContext

set -u

input=$(cat)

file_path=$(printf '%s' "$input" | node -e '
  let d = "";
  process.stdin.on("data", c => (d += c));
  process.stdin.on("end", () => {
    try {
      const j = JSON.parse(d);
      process.stdout.write((j.tool_input && j.tool_input.file_path) || "");
    } catch { process.stdout.write(""); }
  });
' 2>/dev/null)

# Always-on reminder
context="RULES REMINDER: Do ONLY what the user named in the current request. Nothing logically next: no extra sections, states, menus, popups, offsets, components, tokens, scripts, files or renames. If a piece is missing, name it in one sentence and stop."

# Components and sections: the dev showcase must be updated too (bash 3.2: no `;;&`, so a separate case)
case "$file_path" in
  *src/components/ui/*|*src/components/sections/*)
    context="$context SHOWCASE: a new ui component, variant or section must also be added to src/dev/components.astro (import + showcasedUi/showcasedSections registry + a dev_variant per prop combination, or a dev_section-frame); /dev/components must show no red notice."
    ;;
esac

case "$file_path" in
  */.claude/*|*/CLAUDE.md|*/.mcp.json)
    context="$context CLAUDE CONFIG: after adding/changing anything in .claude/ (rule, skill, agent, hook, permission, MCP server) update .claude/README.md in Ukrainian: what it is, why, when and how to use it, plus a row in the change log."
    ;;
  *src/styles/*)
    context="$context STYLES: PHASE (Phase: line in src/dev/inventory.md) — development: values exactly as in Figma inside the component (arbitrary classes / raw scoped values, sizes via --size-N or calc(Nrem * var(--fluid-scale))), NO new tokens or utilities beyond the /sync-tokens base, /systemize builds the system at the end; systemized: reuse first — a value used in 2+ places is one token + one class, a value used once stays an arbitrary class in its component; values come from tokens.css (desktop :root, tablet @media 991, mobile @media 479 — only what differs); a new token/utility goes under the /* ---------- Group ---------- */ header of its group with the Figma name as a trailing comment (that is how /dev/tokens groups it); add a utility only for a pattern that repeats 3+ times; names per class-naming.md (spacing-*, text-size-<figma name>, flex-h/v/v, grid-3/2/1col, col-6), escape / and % in selectors, sizes via --size-N * fluid-scale; motion only via the four tokens --transition-duration/-easing/-duration-slow/-stagger; colours only --theme-* (dark sections re-assign them in .theme--dark/.footer, alw tokens never change); no !important; the word gap never in a class name."
    ;;
  *src/data/site.ts)
    context="$context SITE DATA: only values the client gave — name, contacts, socials, languages. Empty string = not rendered. Never invent a phone, address or profile link."
    ;;
  *.astro)
    context="$context HTML FIRST (markup.md): repeated items = ul/ol + li, never div stacks; one h1 per page, h2 per section, levels in order; a[href] navigates, button acts (type=button/submit), never href=# or onclick; every input has a label, icon-only LINKS named by sr-only text (aria-label on <a> without href is prohibited ARIA), icon-only buttons aria-label, decorative svg aria-hidden; contact/social icons from the design render even while site.ts is empty (href undefined + TODO); toggles aria-expanded+aria-controls, accordions <details>, popups <dialog>, contacts <address>, dates <time datetime>, tel: without spaces, rel on target=_blank; no title tooltips, no tabindex>0, no outline removal. PHASE (src/dev/inventory.md): development = every value exactly as in Figma in this component (spacing-d/t/m, padding-d/t/m, text-size-d/t/m arbitrary classes, raw hex/rgba in scoped rules), never the template placeholder utilities (spacing-md, text-size-h2, padding-lg, border-radius-*, text-color-secondary), no new tokens; systemized = tokens first, a value used in 2+ places gets a token+utility. REUSE FIRST (both phases): before any new class, scoped rule or component check utilities.css, src/components/ui/ (and variants) and this component; a repeated element is a ui component. ASTRO: <section class=\\\"section padding-lg\\\"> (or padding-top-*/padding-bottom-*; section--hero for the first section; theme--dark for dark ones; no own class/background unless a unique scoped style) > .container (alone, no other classes/styles) > layout wrapper; max 3 classes per element (else wrap; data-* and is--* do not count); block_element only when it has a unique scoped rule and every non-utility class has a selector in <style>; typography only via text-size-<name>/text-weight-*/text-color-* on the parent, never scoped; justify-space-between always with spacing-* (a token that already changes per breakpoint for rows that stack); visibility only via desktop-only/mobile-only/*-hide on a wrapper that has NO scoped display (scoped styles override display:none); an existing block_element rule may hold display/position/overflow when 3 classes are full, never typography/spacing/colour; adapt tablet + mobile in the same pass when the frames exist (flex-h/v/v, grid-2/2/1col, col-N = 100% on tablet, mob-* modifiers); every a/button/input has :hover,:focus-visible identical + motion tokens; NO INSTANT CHANGES: every state change and every appearance/disappearance (popup, menu, accordion, message) transitions on the motion tokens, popups per the Popup rule; ui components from ui/ (the project's Button first, in the shape from astro-components.md; prop element, never as), never href=\\\"#\\\"; behaviour in data-* (data-reveal, data-menu-toggle), state in is--*; no data-reveal on elements with their own transition. IMAGES: <Picture formats={['avif','webp']} class=\\\"fill-box\\\"> in flow inside .container, width = largest 1x size across breakpoints, box sets aspect-ratio/height + overflow-hidden, full-bleed = negative margin from --container-padding; decor per breakpoint anchored to the container inside background-slot; alt always. Contacts/name from src/data/site.ts. See .claude/rules/astro-components.md and images.md."
    ;;
  *src/assets/*|*public/*)
    context="$context ASSETS: 2x sources, lowercase kebab-case names, folders by section, icons as SVG in src/assets/icons/ (currentColor; two-colour logo: second colour var(--theme-icon-secondary), no width/height), fonts: TTF/OTF into src/assets/fonts/source/ then pnpm fonts, OG sources in src/assets/og/, favicon.svg in public/ then pnpm favicon. public/ only for favicons/robots/fonts. See .claude/rules/images.md."
    ;;
esac

# Emit JSON safely (escape backslashes and double quotes)
esc=$(printf '%s' "$context" | sed 's/\\/\\\\/g; s/"/\\"/g')
printf '{"hookSpecificOutput":{"hookEventName":"PreToolUse","additionalContext":"%s"}}\n' "$esc"
exit 0
