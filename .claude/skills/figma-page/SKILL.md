---
name: figma-page
description: Build a whole page from a Figma page frame as a chain of agents — one section-builder agent per section, strictly one after another; each section is verified, reviewed by section-reviewer, approved and pushed to stage as its own commit before the next agent starts; header, footer, menu and popups are excluded; any question or error from a builder pauses the chain and goes to the user through the main session. Use when the user shares a page URL and asks for a chain / sequence of agents, one agent per section, or one commit per section. For one section, or for a page built in the main session, use /figma-section instead.
---

# Build a page as a chain of agents

Input: the Figma URL of the page frame (desktop; tablet and mobile frames when they exist) and the
target page (`src/pages/[...locale]/<path>.astro`, existing or to be created).
Output: one commit per section on `stage`, pushed; a final report. The chain is sequential by
design — a builder only starts when the previous section is verified, reviewed, committed and
pushed, so every builder sees what the earlier ones added and nobody edits the shared files
(the dictionary `src/i18n/<lang>.ts`, `src/dev/components.astro`, `tokens.css`, `utilities.css`, the page) at the same time.

This skill runs in the **main session** (it talks to the user); do not fork it. The main session
orchestrates and reviews; it does not build sections itself (see Do not).

## Roles
- **Orchestrator** (you, the main session): maps the page, confirms the plan with the user, spawns
  one `section-builder` at a time, runs `section-reviewer` on every `READY`, relays every `PAUSED`
  question to the user and the answer back to the builder, verifies every `DONE` in git, keeps the
  "shared so far" list, writes the final report.
- **`section-builder`** (`.claude/agents/section-builder.md`): builds one section via the
  `figma-section` steps, verifies it, reports `READY | PAUSED | DONE`, commits and pushes only when told.
- **`section-reviewer`**: read-only comparison with Figma between `READY` and the commit.

## Steps

### 0. Preconditions
1. **Clean tree on `stage`.** `git status --porcelain` must be empty and `git status -sb` must show
   `stage...origin/stage` without `ahead`/`behind`. Uncommitted changes → stop and ask the user what
   to do with them (commit, stash, or wait). Never commit, stash or discard them yourself. No `stage`
   yet → create and push it (`core.md` §6).
2. **Design system exists.** `src/dev/inventory.md`, tokens and the ui components from the
   inventory are in place. Otherwise say that `/sync-tokens` (and the start kit) come first and stop.
3. **Page file.** If it does not exist, create it with `/new-page` (parent folder per the URL
   hierarchy, `title` + `description` from the user — ask for them in the plan message, step 2) and
   commit it alone before the chain: `Add page <Name>`, `git push origin stage`. The first builder
   must start from a clean tree.

### 1. Map the page
1. Load `figma:figma-design-to-code`, then `get_metadata` on the desktop page frame, and on the
   tablet and mobile frames when they exist. Do **not** call `get_design_context` here — the
   builders read their own nodes; the orchestrator's context stays small.
2. List the direct children of the page frame in design order: name, node id, frame height. Match
   the tablet and mobile sections to the desktop ones by name and order.
3. Exclude layout-level nodes: header, footer, navigation, mobile menu, popups/dialogs
   (`SiteHeader`, `SiteFooter`, `SiteMenu`, `ConsultationPopup` …). They come from the layout;
   when one of them does not exist in the project yet, name the gap in one sentence and move on.
4. Mark sections that are **instances of existing sections** (a `Cta` already in
   `src/components/sections/`): they get no builder — the orchestrator places them in the page
   (import + one line) and commits that with the page file or in its own commit `Add section Cta to page <Name>`.
5. Note **shared patterns** visible in the metadata (the same card / tag / number / list item in 2+
   sections, or an existing ui component): the first section that uses a new pattern builds it as a
   ui component; later briefs say "use `ui/<X>`".
6. Component names: PascalCase from the Figma section name in English (`Program`, `HowItWorks`);
   dictionary key camelCase (`howItWorks`).

### 2. Plan → confirmation (one message, then wait)
Show a table — `#`, component, Figma node(s), frame heights 1540/768/390, notes (dark, instance of
an existing section, shared pattern, first section = hero/intro) — plus: the page file and URL,
the excluded nodes, motion on/off (from the start kit), and anything still needed (title +
description for a new page, unclear section boundaries). Build only what the user confirms; a
changed order or a removed section is applied to the plan, not argued.

### 3. The chain — one builder at a time
For each confirmed section in order (never two builders at once; `run_in_background: false`):

1. **Spawn** `section-builder` with this brief (fill every line; node ids, not Figma dumps):
   ```
   You are section-builder <n>/<total> in the /figma-page chain.
   Page: src/pages/[...locale]/<path>.astro (URL /<path>/), dictionary key pages.<key>
   Section: <Name> → src/components/sections/<Name>.astro, dictionary key <key>
   Figma: desktop <node id or url> (frame height <h>), tablet <id> (<h>), mobile <id> (<h>)
   Position: first section (section--hero, data-intro if motion) | after <PrevName>
   Motion: on | off
   Shared so far (reuse, never re-create): <accumulated list from earlier DONE reports, or "nothing new beyond inventory.md">
   Shared patterns: <"the card here also appears in section 5 → build ui/Card.astro now" | "use ui/Tag" | none>
   Do not commit until told. Report in the section-builder format.
   ```
2. **Read the report** and act on its status:
   - **`PAUSED`** → show the user the builder's question verbatim with its options and
     recommendation (add your own recommendation when the repo or the rules give the answer), wait
     for the user, then `SendMessage` the decision to the **same** builder (its context stays
     intact). Never decide for the user, never re-spawn a builder to dodge the question.
   - **`READY`** →
     a. First section of the page only: show the user its screenshots at 1540/1920/768/390 and wait
        for approval before the review — it is the template for the rest of the chain.
     b. Delegate to `section-reviewer` (component path, node ids, the heights from the report).
        "Must fix" (and any "Minor") findings → `SendMessage` them to the builder → it fixes,
        re-verifies, reports `READY` again → review again. After two rounds with findings left →
        `PAUSED` to the user with the remaining findings.
     c. No findings → `SendMessage` "commit" to the builder.
   - **`DONE`** → verify in git: `git status --porcelain` empty, `git log -1 --format='%h %s'`
     matches the report, `git status -sb` without `ahead`. Leftover files or an unpushed commit →
     treat as `PAUSED` (ask the builder what is left; unclear → the user). Then append the report's
     "Shared added" to the "Shared so far" list, tell the user one line
     (`✓ 3/7 Program — a1b2c3d pushed`) and start the next builder.
3. **A builder that ends without a report** (crash, timeout, empty answer) → tell the user, show
   `git status --porcelain`, and ask whether to re-spawn. A re-spawned builder gets the same brief
   plus "continue from the existing files on disk". Never restart silently.

### 4. After the last section (main session)
1. `pnpm check` (no pipe), `pnpm build && pnpm seo` → 0 errors; `pnpm shot` of the whole page at
   1540/768/390; `/dev/components` shows every section and no red notice (with a running dev server:
   `pnpm shot 1540 --url http://localhost:4321 --path /dev/components`).
2. Page-level fixes found here (a `seo` error, a wrong section order) are made in the main session
   and committed as one commit `Fix page <Name>` with a `- …` body line per fix, pushed to `stage`.
   Nothing to fix → no commit.

### 5. Final report (to the user, in their language)
- Table: `#`, section, commit hash, heights build/Figma at 1540/768/390, deviations.
- Shared additions made during the chain (tokens, utilities, ui components, variants).
- `TODO`s and files needed from the client (photos with layer name, 2x size and target path; links; form handler).
- Open questions and the nodes that were excluded (header, footer …) or reused as existing sections.

## Do not
- Do not build anything the user did not confirm in step 2: no header, footer, menu, popup, no
  sections from other pages, no "related" sections. A missing layout piece is one sentence in the report.
- Do not run two builders at once and do not start the next one before `DONE` is verified in git.
- Do not build sections in the main session "to save time" — the only exception is placing an
  instance of an existing section (step 1.4).
- Do not answer a builder's `PAUSED` question yourself when it is a decision (link vs action,
  content, tokens); the user decides. Do not let a builder guess or bury a decision in a `TODO`.
- Do not commit, stash or discard the user's uncommitted changes; never `git add -A`; never push to
  `main`; never force-push.
- Do not pass `get_design_context` output in a brief — node ids and heights only.
- Do not rewrite earlier sections "to match" a later one; a real conflict goes to the user.
