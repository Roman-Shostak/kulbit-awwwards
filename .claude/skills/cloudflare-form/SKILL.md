---
name: cloudflare-form
description: Connect the site's forms to Cloudflare — the template's Worker next to the static assets (POST /api/form), D1 storage, Telegram and/or e-mail notification, spam protection, form states in the browser — by asking the questionnaire in one message, wiring worker/ + ui/Form.astro + src/scripts/form.ts, configuring wrangler.jsonc and setting the secrets with wrangler. Use when the user asks to connect / hook up / make the form work, send submissions to Telegram or e-mail, set up Cloudflare for the forms, or a section still carries `TODO: form handler`.
argument-hint: "[form components, e.g. src/components/sections/Cta.astro]"
---

# Connect the forms to Cloudflare

Input: the form components (`$ARGUMENTS`, default: every `<form` in `src/components/sections/`) and the
answers to the questionnaire below. Output: the forms post to the site's Worker, every submission is
stored in D1 and reaches the client in Telegram and/or by e-mail, the visitor sees the sending / sent /
error states, stage submissions are marked, secrets live in Cloudflare, and a report lists what the
user still has to do by hand.

The template ships the whole mechanism; this skill configures it per project and never rebuilds it:

| Piece | File | What it does |
| --- | --- | --- |
| Worker | `worker/index.ts` | `POST /api/form` → check → D1 → Telegram / e-mail → JSON (script) or a plain HTML page (no JS); `POST /api/telegram` = the bot's webhook for the «Обработано» button; everything else → `env.ASSETS` (outside production with `X-Robots-Tag: noindex` and a closed robots.txt — stage has `run_worker_first: true`; the `X-Robots-Tag: noindex` line in `public/_headers` is only the pre-launch lock of production, removed at launch) |
| Check | `worker/validate.ts` | name + consent required, phone or e-mail, formats; compiled into the Worker and the browser |
| Types | `worker/tsconfig.json`, `pnpm worker:types` | workerd types, no DOM; `pnpm check` runs `tsc -p worker` |
| Schema | `migrations/0001_create_submissions.sql`, `0002_add_processed.sql` | `submissions`: form, page, locale, name, phone, email, consent_at, notified, processed_at, processed_by (no IP, no UA) |
| Shell | `src/components/ui/Form.astro` (from this skill's `assets/Form.astro`) | hidden `form` / `locale` / `started`, honeypot, status message, the success block (brand Card + tick, replaces the form after a successful submit), state texts as `data-*`, loads the script |
| Script | `src/scripts/form.ts` (from `assets/form.ts`) | fetch submit, `is--sending` / `is--sent`, `aria-invalid`, messages from the `form` dictionary |
| Texts | `src/i18n/<lang>.ts` → `form` (block in `assets/i18n-form.ts`, ru / uk / en) | sending, successTitle, success, error, errorRequired, errorContact, errorEmail, errorPhone, errorRate |
| Config | `wrangler.jsonc` | `main`, `assets.binding` + `run_worker_first: ["/api/*"]`, `vars`, `d1_databases`, `send_email`, `ratelimits` — repeated in `env.stage` |
| Dev | `pnpm worker` (wrangler dev :8787), Vite proxy `/api` in `astro.config.mjs`, `.dev.vars`, `pnpm worker:migrate` | local run with a local D1 |

The Worker, the migrations and `wrangler.jsonc` ship in the template root. The pieces that depend on the
project's own ui components (`Card`, `Input`, `Checkbox`, `Button`, `src/assets/icons/tick.svg`) and
dictionaries live in this skill's `assets/` and are copied into the project at step 3: `assets/Form.astro` →
`src/components/ui/Form.astro`, `assets/form.ts` → `src/scripts/form.ts`, the `form` block from
`assets/i18n-form.ts` into every dictionary, the states from `assets/ui-states.css` into `Checkbox.astro` /
`Button.astro`, the Form block from `assets/dev-components-form.astro` into `src/dev/components.astro`.
A project that predates the template's Worker (no `worker/` folder) first copies `worker/`, `migrations/`,
`wrangler.jsonc` and the config lines from the template repository: the `worker`, `worker:types`,
`worker:migrate` scripts and the `check` script in `package.json`, `"exclude": ["dist", "worker"]` in
`tsconfig.json`, `.dev.vars*` / `.wrangler/` / `worker/worker-configuration.d.ts` in `.gitignore`,
`Read(.dev.vars*)` in `settings.json` → `permissions.deny`, `vite.server.proxy` in `astro.config.mjs`,
and `pnpm add -D wrangler` (+ `workerd: true` in `pnpm-workspace.yaml` → `allowBuilds`).

## 1. Preconditions

- The site deploys to Cloudflare Workers static assets: `wrangler.jsonc` with `name`, `account_id`, `assets.directory: ./dist`,
  `routes`, and the deploy connected with `/cloudflare-deploy` (GitHub Actions: `main` → production, `stage` → `--env stage`;
  the workflow applies the D1 migrations before every deploy as soon as `d1_databases` is in `wrangler.jsonc`). Its
  `CLOUDFLARE_API_TOKEN` must carry **Account → D1: Edit** (`/cloudflare-deploy` step 4) — a token created without it
  is re-created. Without `account_id` or the Worker name, ask — nothing below works against a guessed account.
- `src/data/site.ts` has the client's e-mail when the e-mail channel is wanted.
- Every form uses the project's `Input` (error state on `aria-invalid`), `Checkbox` (`name="consent" required`) and
  `Button type="submit"`. A form without a consent checkbox gets one first (`astro-components.md` → Forms).

## 2. Ask everything in ONE message

Give the recommendation with every question; the user answers in one message. Defaults in brackets.

1. **Forms and fields** — list what `grep "<form" src` found (component, fields). The notification is short by design:
   bold `Новая заявка [DD.MM.YYYY]`, the site language, a blank line, then only the filled fields as `<b>Label:</b> value`
   (values plain so Telegram links the phone and the e-mail; `texts` in `worker/index.ts`: labels, language names, the
   client's `timeZone`); the form and page are stored in D1, not sent. Under the message an inline button «Обработано»:
   pressed → the title is struck through, a «✅ Обработано <date time> · <who>» line is added, the button disappears,
   D1 gets `processed_at` / `processed_by` (webhook `POST /api/telegram`, step 5.4).
2. **Required fields** [name + consent + at least one of phone / e-mail; both may be filled]. Anything else is a change
   in `worker/validate.ts` and the `form` dictionary.
3. **Channels** [both, chosen per project with `NOTIFY`]: `telegram`, `email`, `telegram,email`.
   - Telegram: **one bot per client** (BotFather, named after the site — never one shared bot for all clients: one token
     in every Worker, the bot cannot be handed over, one revocation breaks every site). A group «Заявки <site>» with the
     bot, the client and the developer — one chat id for production and stage. Or a direct chat: the client presses
     Start in the bot, `getUpdates` shows the private chat id (positive); the developer then sees no submissions, and
     stage can use the developer's own chat id so tests do not reach the client.
   - E-mail: Cloudflare Email Service — sender `forms@<domain>` (the domain is onboarded in the client's account),
     recipient = the client's address (`site.ts`), no third-party mail service. **It needs the Workers Paid plan
     ($5/month, 3 000 e-mails included; sends to verified destination addresses are free)** — say so before the client
     chooses. Default when the client does not pay for it: Telegram only (`NOTIFY: "telegram"`, no `send_email`
     binding, no EMAIL_* vars — the Worker's e-mail path stays dormant). If e-mail is a must without the paid plan: a
     `resend` channel in `worker/index.ts` (Resend free tier 3 000/month, API key as the secret `RESEND_API_KEY`, the
     domain verified in Resend with its DNS records) — ~20 lines next to `sendTelegram`, on request only.
4. **Stage** [the same chat / address, the notification carries `[stage]`] or a separate chat id.
5. **Spam** [honeypot + minimum fill time + 5 submissions per IP per minute — all in the template]. Turnstile only
   when the user asks (external script, CSP entries, a widget in the design).
6. **Success** [a message in place of the form, from the dictionary] or a thank-you page (only if the client counts
   conversions: `/new-page`, a redirect in the Worker — an extra piece, on request).
7. **Access** [`wrangler login` on this machine — the skill then sets secrets, applies migrations and creates databases
   itself] or the user adds the secrets in the dashboard by hand (the skill prints names and values to paste).
8. **Texts** of the states (`form` dictionary) and of the notification (`texts` in `worker/index.ts`) — the template's
   defaults are shown; the client confirms them, the developer authorises the uk/en translations.

Missing answers become `TODO`s in the report, not guesses. Never invent a chat id, a token or an e-mail.

## 3. Configure

1. **`wrangler.jsonc`** — replace `name` (the Worker name; the template ships `client-site` so `pnpm check` runs) and every `<placeholder>` (`account_id`, the domains, the D1 ids); `main: "worker/index.ts"`, `assets.binding: "ASSETS"`, `run_worker_first: ["/api/*"]`;
   `vars`: `ENVIRONMENT` (`production` / `stage`), `NOTIFY`, `SITE_NAME` (the domain), `EMAIL_FROM`, `EMAIL_TO`;
   `d1_databases` (`binding: "DB"`), `send_email: [{ name: "EMAIL" }]`,
   `ratelimits: [{ name: "FORM_RATE_LIMIT", namespace_id: "1001", simple: { limit: 5, period: 60 } }]`.
   **Repeat vars and every binding inside `env.stage`** (nothing but `main`, `routes`, `compatibility_date` is inherited);
   stage gets its own D1 and `namespace_id: "1002"`. Databases that do not exist yet:
   `pnpm wrangler d1 create <name>-forms` and `<name>-forms-stage` → paste `database_id`s.
2. **`worker/index.ts` → `texts`** — subject, `sentFrom`, language names, labels and `timeZone` in the client's language; the
   no-JS page texts for every site language. Nothing else in the Worker changes per project unless the rules changed (step 2.2).
3. **Forms** — copy `assets/Form.astro` → `src/components/ui/Form.astro` and `assets/form.ts` → `src/scripts/form.ts` (the success block is the project's `Card type="brand" size="lg"` with `tick.svg`; adapt the imports to the project's components when their names or variants differ), add the `Checkbox` error state and `.button:disabled` from `assets/ui-states.css`; then replace `<form method="post" class="…">` with `<Form name="<form>" class="…">` (`import Form from
   '@/components/ui/Form.astro'`), close with `</Form>`, drop the `TODO: form handler` comment, put `required` on the
   name `Input` (consent already has it). `keepHeight` on a `Form` inside a section whose layout depends on the form's
   height (a photo as tall as the column): the success block then keeps that height; not in popups.
4. **Dictionary** — the `form` block from `assets/i18n-form.ts` in every language file (ru / uk / en are in the asset; another language gets its texts from the client).
5. **`/dev/components`** — add the block from `assets/dev-components-form.astro` (import `Form`, add `Form` to `showcasedUi`; the block uses the project's `Input` / `Checkbox` / `Button`, the section's field labels from the dictionary and a `modes` list of the light and `theme--dark` stages).

## 4. Verify locally

1. `pnpm check` (no pipe; runs `astro check`, `pnpm worker:types`, `tsc -p worker`) and `pnpm build`.
2. `printf 'ENVIRONMENT=local\n' > .dev.vars` (never read or print an existing `.dev.vars`), `pnpm worker:migrate`,
   then `pnpm worker --port 8787` in the background and the request matrix against `http://localhost:8787`:
   `GET /` 200, `GET /nope/` 404, `GET /api/form` 405; JSON (`Accept: application/json`) posts: empty → `required`,
   name + consent → `contact`, bad e-mail → `email`, bad phone → `phone`, honeypot `website=x` → `{ok:true}` and no row,
   `started=<now>` → the same, a valid one → `{ok:true}` + a row (`pnpm wrangler d1 execute DB --local --command
   "SELECT * FROM submissions"`); a post without `Accept` → the HTML page; `Origin: https://evil.example` → 403;
   the 6th valid post in a minute → 429 `rate`. The log shows `telegram notification failed … secrets are not set`
   — expected locally.
3. The states in a real browser (Playwright from the project, 1540 and 390): empty submit → message + `aria-invalid`;
   name + consent → «phone or email»; valid after 3 s → the form fades out and the success block takes its place; the same
   for the popup form. Mind the local rate limit (5 valid submissions a minute per IP, it survives a restart). No console
   errors. Show the screenshots.
4. Stop `wrangler dev` (`pkill -f "wrangler dev"`).

## 5. Cloudflare (with `wrangler login`)

`pnpm wrangler login` opens the browser; the user signs in with an account that has access to the client's account
(`account_id`). Then `pnpm wrangler whoami` must show it. With that:

1. `pnpm wrangler d1 migrations apply DB --remote` and `… --env stage` (the deploy workflow applies them too, before
   every deploy — do both: the first deploy must not fail on a missing table).
2. Secrets, twice — production is `--env=""` (with `env.stage` in the config wrangler warns without an explicit target),
   stage is `--env stage`: `pnpm wrangler secret put TELEGRAM_BOT_TOKEN --env=""`, `… --env stage`, the same for
   `TELEGRAM_CHAT_ID`. The first argument is the secret NAME; the value is typed at the `Enter a secret value` prompt —
   the user does this in their own terminal, never through the chat, a file or a command line (shell history).
   Chat id of the group: after the bot is in the group and someone wrote there,
   `curl -s "https://api.telegram.org/bot<TOKEN>/getUpdates"` → `chat.id` (negative for groups); the user runs it, or
   runs it through the skill without echoing the token.
3. Webhook for the «Обработано» button — one bot has ONE webhook, so it points at the environment that is live
   (stage until production is deployed, then production; the button works from both, D1 is marked only in the matching
   one). Generate a secret (`openssl rand -hex 16`), store it as `TELEGRAM_WEBHOOK_SECRET` on both Workers (`--env=""`,
   `--env stage`; also in `.dev.vars` for local tests), then the user registers the webhook with the bot token:
   `curl -s "https://api.telegram.org/bot<TOKEN>/setWebhook" -d "url=https://<host>/api/telegram" -d "secret_token=<SECRET>"
   -d 'allowed_updates=["callback_query"]'` and checks it with `getWebhookInfo`. Local test: a forged callback POST with the
   secret header → 200 and the D1 row gets `processed_by`; without the header → 403.
4. After the stage deploy: one real submission on `stage.<domain>` → the `[stage]` message in the group and the e-mail
   arrive, the row is in the stage D1 (`pnpm wrangler d1 execute DB --env stage --remote --command "SELECT id, form,
   notified FROM submissions"`), `notified` lists every channel; press «Обработано» → the message is rewritten and the row
   gets `processed_by`.

Without `wrangler login` (dashboard path): print the secret names and where they go (Workers & Pages → the Worker →
Settings → Variables and Secrets, for both Workers); the migrations run in the deploy workflow.

## 6. What only the user can do — print this checklist

1. **BotFather**: `/newbot`, name after the site, keep the token; create the group «Заявки <site>», add the bot, the
   client and yourself. (A bot can be handed to the client later with `/transfer` in BotFather.)
2. **Email Service**: Cloudflare dashboard → Compute → Email Service → Email Sending → Onboard domain `<domain>`
   (DNS records are added automatically), then add and verify the recipient address (the client confirms the e-mail).
3. Secrets (if the dashboard path was chosen).

## 7. Report

A table: form → name in the notification, required fields, channels, stage marker, spam measures, D1 databases,
secrets set (yes / pending), migrations applied (local / stage / production), the checklist of step 6 with what is
still open, the link to the deploy run (`Deploy` workflow, `/cloudflare-deploy`), screenshots of the states. Then commit on request (`Add form handler on Cloudflare`).

## Do not
- Do not build anything the user did not name: no Turnstile, no thank-you page, no admin page, no CSV export, no
  analytics event, no extra fields, no redesign of the inputs.
- Do not add an Astro adapter or change `output: 'static'` — the Worker sits next to the assets.
- Do not put a token, chat id or password into a file, a commit, the report or the chat; `.dev.vars` is never read.
- Do not share one Telegram bot between clients.
- Do not invent chat ids, e-mail addresses, domains or texts; ask, or leave a `TODO` in the report.
- Do not store more than the visitor typed (no IP, user agent or cookies in D1).
- Do not skip the local matrix or the browser states: a form that "should work" is not connected.
