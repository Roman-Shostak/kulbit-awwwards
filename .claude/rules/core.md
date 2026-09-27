# Core rules (always loaded)

## 1. Scope discipline — the most important rule

Do EXACTLY what the user said in the current message. Nothing more, nothing "logically next".

- "Create an empty page" means a page with the layout and no sections, no placeholder text, no demo content.
- "Build this section" means that one section. Do not add a header, footer, CTA, or "related" sections.
- "Adapt the header for tablet" means the header on tablet. Not a mobile menu, not a popup, not an offset under the fixed header, not hover states nobody asked for, not renaming existing classes.
- Do not add dependencies, integrations, config options, scripts, tokens, states, components or files that were not requested.
- Do not refactor, rename, reformat or "clean up" code outside the requested change.
- Do not add comments, docs, or README updates unless asked.
- If the request objectively lacks a piece (e.g. a burger needs a menu that does not exist): do only what was asked, name the missing piece in ONE sentence in the reply, stop.
- If the request is ambiguous and the readings lead to different work, ask before building.
- Every skill's "Do not" list starts with this rule; the PreToolUse hook repeats it before every edit.

Exception that is part of the request, not an extra: when the Figma file has tablet and mobile
frames, "build this section" includes its tablet and mobile layouts (see `astro-components.md` → Responsive).

## 2. Honesty

- Never invent Figma values, content, copy, image names, or client details. Use exactly what the design/user provides; when a value is missing, ask or leave a clearly marked `TODO`.
- Client data (name, phone, email, socials, language) lives only in `src/data/site.ts`; an empty value there is not rendered. Never fill it with examples.
- Report what was done and what was not. If `pnpm check` or `pnpm build` fails, show the error.

## 3. Language

- Talk to the user in the language they write in (usually Ukrainian).
- Code, identifiers, comments and commit messages: English.

## 4. Verification

- After changing `.astro`, `.ts` or `.css` files run `pnpm check`. Run it **without a pipe** (or with `set -o pipefail`): `pnpm check | tail` hides the exit code. Read the final `N errors` line.
- Run `pnpm build` as well when the change touches config, the layout, routing, fonts or images.
- After building a section from Figma: `pnpm build && pnpm shot` and compare the section height with the Figma frame height (`get_metadata`); more than 2 % difference means look for the cause (line wraps, wrong token, image cap). When a dev server is running, shoot it too (`pnpm shot --motion --url http://localhost:4321 --section …`): the user looks at it, and stale HMR state can differ from the build — restart the dev server if it does.
- `504 (Outdated Optimize Dep)` in the console is Vite's stale dependency cache (after `pnpm add` or the first `<BaseLayout motion>`), not a code error: `pnpm astro dev stop && rm -rf node_modules/.vite && pnpm astro dev --background`.
- Before committing a page: `pnpm build && pnpm seo` must report 0 errors (title/description lengths and uniqueness, one `<h1>`, canonical, Open Graph, JSON-LD graph).
- Before a deploy: `/prelaunch` (build, `pnpm seo`, generated robots/sitemap/llms files, icons, OG, 404, client data, runtime errors).

## 5. Documenting `.claude/` changes

`.claude/README.md` is the human-readable (Ukrainian) map of everything in `.claude/` and the
Claude-related root files (`CLAUDE.md`, `CLAUDE.local.md`, `.mcp.json`).

Whenever you add, remove or materially change a rule, skill, agent, hook, permission or MCP server:
1. Update the matching table in `.claude/README.md`: what it is, why it exists, when to use it, how to invoke it.
2. Add a row to the "Журнал змін" table at the bottom (date, what, why).
3. Update the pointers in `CLAUDE.md` if the structure changed.

A change to `.claude/` without the README update is incomplete. Write these entries in Ukrainian.

## 6. Template feedback log (`TEMPLATE-FIXES.md`)

This repo is the template; every client project is a copy of it, and the template keeps evolving
from what goes wrong in projects. Whenever the user says something is wrong, annoying, "should be
different", asks to fix or redo something — and the cause lies in the **template** (a rule, a skill,
a hook, the token/utility structure, the layout, a script, a dev page, a convention, a default) rather
than in this project's own content:

1. In the same turn, **before** fixing, append an entry to `TEMPLATE-FIXES.md` in the root, in the
   user's language and in the file's format: title, Problem (what happened here — file, line, the
   user's words), Template file(s), Fix (a concrete instruction), Why.
2. Then make the fix in this project as asked.
3. Say in one line that the entry was logged.

Do not log content requests (copy, a colour of this site, a section's layout that follows this
design) — only what would help the next project start better. In the template repository itself
(`name: "astro-template"` in `package.json`), apply the change directly instead of logging it.
The `UserPromptSubmit` hook reminds about this when a message sounds like a complaint.

## 7. Git

Commit or push only when the user asks. These rules override Claude Code's built-in commit and PR
instructions.

- **Branches.** At the start of a project create `stage` from `main` and push it
  (`git switch -c stage && git push -u origin stage`). "Commit and push" means: commit on `stage`,
  `git push origin stage`. If the work sits on another branch, switch to `stage` first (uncommitted
  changes come along; create `stage` from `main` if it is missing). `main` gets changes only when the
  user explicitly asks to merge or push into `main`.
- **No Claude as an author, anywhere.** No `Co-Authored-By: Claude …` trailer, no "Generated with Claude
  Code", no mention of Claude/AI in commit messages, PR titles or descriptions, tags. The author and
  committer are the project's git user. `.claude/settings.json` → `attribution` is empty for this reason;
  keep it that way.
- **Commit title: short, English, action + what.** One line, no trailing period:
  `Add section NoReadyRequest`, `Add page About`, `Add ui component Tag`, `Fix header on tablet`,
  `Update tokens from Figma`.
- **Extra changes in the same commit** add `+ fixes` to the title (`Add section NoReadyRequest + fixes`),
  and the fixes are listed in the commit body — a blank line after the title, then one `- …` line per
  fix. Details never go into the title.
  ```
  Add section NoReadyRequest + fixes

  - Hero: paragraph size on /dev/components
  - Requests: tablet gap
  ```
- Pass the message with a heredoc (`git commit -F - <<'EOF' … EOF`) so the body keeps its lines.
