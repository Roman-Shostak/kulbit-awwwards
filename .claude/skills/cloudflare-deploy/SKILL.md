---
name: cloudflare-deploy
description: Connect the site's deployment to the client's Cloudflare account through GitHub Actions — `.github/workflows/deploy.yml` deploys `stage` → Worker `<name>-stage` and `main` → production with the project's own wrangler and one API token (no Workers Builds, no GitHub App) — as a guided dialogue, one step per message, each step verified with a command where possible. Use when the user asks to connect the site to Cloudflare, set up / configure the deploy, or move an old project from Workers Builds to Actions.
argument-hint: "[worker name, e.g. mila-doctor]"
---

# Connect the deployment to Cloudflare

Input: the Worker name (`$ARGUMENTS`, optional) and the answers the user gives one step at a time (account, name,
domains, search lock, forms). Output: `wrangler.jsonc` with the client's account, Worker name and domains; the
repository secret `CLOUDFLARE_API_TOKEN` set by the user; the first run of the `Deploy` workflow on `stage`
verified (HTTP 200, `x-robots-tag: noindex`, the `Published:` stamp); production only on an explicit "yes"; a
report with the launch checklist.

**This skill is a guide, not a questionnaire.** One step = one message: what to do or which value is needed, why,
where to get it — then wait. The next step starts only after the answer or the confirmation; never ask for
everything at once (the difference from `/cloudflare-form`). Whatever can be checked with a command, check it
yourself and show the result before moving on.

The template ships the mechanism; this skill configures it per project:

| Piece | File | What it does |
| --- | --- | --- |
| Workflow | `.github/workflows/deploy.yml` | `on: push` to `main` and `stage` + `workflow_dispatch`; one run per branch at a time (later pushes wait); pnpm from `packageManager`, Node 22 with the pnpm cache, `pnpm install --frozen-lockfile`, `pnpm build`, `wrangler d1 migrations apply DB --remote` (skipped while `wrangler.jsonc` has no `d1_databases`), `wrangler deploy` — `--env stage` on `stage`, `--env=""` on `main`. One secret: `CLOUDFLARE_API_TOKEN`; `account_id` comes from `wrangler.jsonc`; `WRANGLER_SEND_METRICS=false` |
| Config | `wrangler.jsonc` | `name`, `account_id`, `compatibility_date`, `routes` with `custom_domain: true`, `assets`, `env.stage` with its own domain and a repeat of assets / vars (bindings are not inherited) |
| Search lock | `public/_headers` | `X-Robots-Tag: noindex` in the `/*` block with a `TODO: remove at launch` — production stays out of search until the client approves the site; stage is closed by the Worker (`worker/index.ts` → `serveAssets`) |
| Stamp | `src/layouts/BaseLayout.astro` | `<!-- Published: YYYY-MM-DD HH:MM UTC · commit <sha> -->` as the first line of every page: the time of `pnpm build` and `GITHUB_SHA` in Actions (locally `git rev-parse --short HEAD`, else `local`) — shows which version is live |

Modes: a **new project** (no workflow yet) and **reconnection** of an old project that deploys through Workers
Builds — the same steps, plus copying the files of the table from the template repository and disconnecting the
old builds (step 6).

## 0. Project state

Check, show the result, fix what the template rules cover:

- `gh auth status` — logged in; `git remote -v` — the repository is in the studio's organisation (the secret goes there).
- The `stage` branch exists locally and on `origin`; if not, create it from `main` (`core.md` §7:
  `git switch -c stage && git push -u origin stage`).
- `wrangler` in `devDependencies` (`pnpm exec wrangler --version`), `wrangler.jsonc` present, `site` in
  `astro.config.mjs` (the production URL, or still the `TODO` — noted for step 2).
- `d1_databases` in `wrangler.jsonc` → the forms are connected (`/cloudflare-form`), the token needs D1 (step 4).
- `.github/workflows/deploy.yml` present → the project is already on Actions: continue only with what is missing.
  Absent while the Worker exists in the dashboard with a Git connection → **reconnection**: copy
  `.github/workflows/deploy.yml`, the `X-Robots-Tag` line + `TODO` of `public/_headers` and the stamp block of
  `src/layouts/BaseLayout.astro` (the `execSync` import, `publishedAt` / `commit`, the `<Fragment set:html>` after
  `<!doctype html>`) from the template repository (`astro-template`), then continue with step 1.

## 1. The data — one item per message

Every message: the value needed, why, where to find it, and the check you will run. Wait for the answer.

1. **Cloudflare account** — the client's or the studio's? The client's account is the default (the site, the domain
   and the bill stay with the client). The user must be a member of it: the client invites them in Manage Account →
   Members with the **Workers Admin** role (Super Administrator is not needed). The **Account ID** is in the dashboard →
   Workers & Pages → Overview, right column. Check: `pnpm exec wrangler whoami` lists that account with that id (the
   user is logged in on this machine with `pnpm exec wrangler login`).
2. **Worker name** — `name` in `wrangler.jsonc`, kebab-case, usually the client's name (`$ARGUMENTS` when given);
   the stage Worker becomes `<name>-stage`. Reconnection: it must be the Worker that already owns the domain in the
   dashboard, otherwise the deploy creates a second Worker and the domain stays on the old one.
3. **Domains** — the production domain and the stage domain (`stage.<domain>` by default). The zone must live in the
   same Cloudflare account as the Worker, otherwise `custom_domain` cannot create the DNS record and the certificate —
   ask the user to confirm it (dashboard → Websites lists the zone under this account).
4. **Search lock** — closed from search until the launch? Default yes: `X-Robots-Tag: noindex` stays in
   `public/_headers` and is removed at launch (`/prelaunch` reminds). "No" (a relaunch of a live site) → remove the
   line and its `TODO` comment now.
5. **Forms** — needed now? Yes → after this skill run `/cloudflare-form` (D1, secrets, the Worker texts), and the
   token of step 4 gets D1: Edit right away. No → `wrangler.jsonc` goes without D1 and rate limits (step 2).

## 2. `wrangler.jsonc`

- `name` (1.2), `account_id` (1.1), `compatibility_date` = today, `routes: [{ "pattern": "<domain>", "custom_domain": true }]`,
  `main` and `assets` as shipped.
- `env.stage`: `routes` with `stage.<domain>`, and a repeat of `assets` and `vars` — bindings and vars are not
  inherited from the top level; `SITE_NAME` = the domain at both levels.
- No forms yet: remove `d1_databases` and `ratelimits` at both levels (the Worker deploys without them and treats
  `/api/*` as an unknown URL; `/cloudflare-form` adds them back). Forms connected: keep them, the ids stay.
- `site` in `astro.config.mjs` = `https://<domain>` when it is still the `TODO` (canonical, OG, sitemap depend on it).
- Nothing else: no Pages, no adapter, no extra vars. `pnpm check` (no pipe) must pass — `wrangler types` reads the config.

## 3. Dry run

`pnpm build`, then `pnpm exec wrangler deploy --env="" --dry-run` and `pnpm exec wrangler deploy --env stage --dry-run`.
Show the bindings and the routes of both; a warning about environments means `--env=""` is missing. Stop at any error
and ask — the workflow would fail the same way.

## 4. The API token

Tell the user exactly what to click (their own Cloudflare profile — the member invited in 1.1):

1. My Profile → API Tokens → Create Token → template **Edit Cloudflare Workers** → Use template. It grants Workers
   Scripts: Edit, Workers KV Storage: Edit, Workers R2 Storage: Edit, Workers Tail: Read, Account Settings: Read,
   Memberships: Read, User Details: Read, Zone Workers Routes: Edit.
2. Add **Account → D1: Edit** when the forms exist or are planned (1.5) — the migrations step needs it.
3. Add **Zone → DNS: Edit** — `custom_domain` writes the DNS record.
4. Account Resources → Include → the client's account (1.1); Zone Resources → Include → Specific zone → the client's
   domain (1.3). Nothing else in the lists.
5. Continue to summary → Create Token → copy it with the Copy button. It is shown once.

Check — the user runs it in their own terminal and reports the result; the token never goes into the chat, a file,
the report or a command Claude runs:
```
curl -s https://api.cloudflare.com/client/v4/user/tokens/verify -H "Authorization: Bearer <token>"
```
`"status":"active"` = good. Anything else: the value was copied wrong (see Troubleshooting).

## 5. The secret in GitHub

The user runs, in their own terminal, `gh secret set CLOUDFLARE_API_TOKEN -R <org>/<repo>` and pastes the token
at the prompt (the value never appears in the chat). Check: `gh secret list -R <org>/<repo>` shows
`CLOUDFLARE_API_TOKEN` with today's date. That is the only secret the workflow needs; the account id is in
`wrangler.jsonc`.

## 6. The old deploy (reconnection only)

Workers Builds still connected to the repository would deploy in parallel with Actions — double deploys. The user
disconnects it for **both** Workers: the Worker → Settings → Build → Disconnect. In a new project the Git connection in
the Cloudflare dashboard is never made at all. Confirm before the first push.

## 7. The first deploy on `stage`

1. Commit the configuration on `stage` (`Add Cloudflare deploy`), `git push origin stage`.
2. `gh run list --workflow Deploy --branch stage -L 1` → the run id; `gh run watch <id> --exit-status` to the end.
3. From the log (`gh run view <id> --log`) show the lines `Deployed <name>-stage triggers` and the custom domain
   `stage.<domain>`.
4. `curl -sI https://stage.<domain>/` → `HTTP/2 200` and `x-robots-tag: noindex`; `curl -s https://stage.<domain>/ | head -2`
   → the first line is `<!-- Published: … · commit <sha> -->` with the sha of the pushed commit.
   The certificate can take a minute after the first deploy — retry, change nothing.

## 8. Production — only on an explicit "yes"

Ask in one message whether production should be deployed now. On "yes": merge `stage` into `main` (fast-forward
when possible) and `git push origin main`, then the same control as in step 7 on `https://<domain>/` — `200`, the
stamp, and `x-robots-tag: noindex` present while the site is closed for the launch (1.4). Claude Code may stop the
push to `main` as a "production deploy" — that is the permission classifier, not an error: ask the user to confirm
or to run the push themselves.

## 9. Report

What is configured (account, Workers, domains, secret, workflow), the links to the runs, the checklist for the
launch (remove `X-Robots-Tag: noindex` from `public/_headers`, `/prelaunch`), and what comes next:
`/cloudflare-form` for the forms, `wrangler secret put <NAME> --env=""` / `--env stage` for the Worker secrets
(they are not part of the workflow).

## Troubleshooting

| Symptom | Cause → fix |
| --- | --- |
| `Authentication error [code: 10000]` on `/d1/...` | the token has no **D1: Edit**, or it was created for another account → edit the token (or create a new one), set the secret again, `gh run rerun <id> --failed` |
| `Invalid access token [code: 9109]` on `/accounts` | the secret value is broken (a space, a line break, the Global API Key pasted instead of a token) or the token is not active → `tokens/verify` in the terminal, `gh secret set` again, `gh run rerun <id> --failed` |
| Warning `Multiple environments are defined` | the command has no `--env=""` for production — the workflow passes it; add it to a local command |
| A new Worker appeared, the domain stayed on the old one | `name` in `wrangler.jsonc` differs from the Worker in the dashboard → set the existing name, redeploy, delete the extra Worker by hand |
| The push to `main` is blocked as a "production deploy" | the permission classifier of Claude Code → the user confirms or pushes themselves |
| `custom_domain` fails on deploy | the zone is not in this account, or the token lacks DNS: Edit / the zone in Zone Resources |
| The run passes, `curl -sI` gives 5xx or a certificate error | the domain was just created — wait a minute and retry; nothing to change |

## Do not
- Do not build anything the user did not name in this request: no Pages project, no Astro adapter, no preview
  deploys for pull requests, no Turnstile, no other secrets or workflows.
- Do not ask everything in one message — this is a guide, one step at a time, the next after the answer.
- Never ask for the token in the chat and never put it into a file, a command or the report; the user verifies
  it in their terminal and sets the secret with `gh secret set` themselves.
- Do not push to `main` without a separate "yes" in this session.
- Do not connect Git in the Cloudflare dashboard (Workers Builds) and do not leave it connected in an old project.
- Do not invent an account id, a Worker name or a domain — ask; never deploy against a guessed account.
