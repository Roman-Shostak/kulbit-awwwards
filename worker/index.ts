/**
 * Form handler — the only Worker of the site. `POST /api/form` (ui/Form.astro + src/scripts/form.ts) checks the
 * submission, stores it in D1 (`env.DB`, schema in migrations/) and notifies the client through the channels
 * in `env.NOTIFY` — Telegram (secrets TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID) and/or e-mail (Cloudflare Email
 * Service binding `env.EMAIL`, vars EMAIL_FROM / EMAIL_TO — Workers Paid plan; a free alternative would be a Resend channel). Every other URL goes to the static assets (`env.ASSETS`).
 * Spam: a honeypot field (`website`), a minimum fill time (`started`, set by the script) and a per-IP rate limit
 * (`env.FORM_RATE_LIMIT`); a caught bot gets the success answer and nothing is stored.
 * Answers: JSON for the script (`Accept: application/json`), a plain HTML page without JS.
 * A failed notification never fails the submission: the row stays in D1 with an empty `notified`.
 * Stage submissions carry `[stage]` in the notification (`env.ENVIRONMENT`); outside production the static files are
 * served with `X-Robots-Tag: noindex` and a closed robots.txt (`serveAssets`).
 * The Telegram message ends with an inline button «Обработано»: Telegram posts the press to `POST /api/telegram`
 * (the bot's webhook, secret TELEGRAM_WEBHOOK_SECRET checked in the header), the Worker rewrites the message
 * (title struck through, a «processed by … at …» line, no button) and marks the row in D1. One bot has one webhook,
 * so the callback carries `ENVIRONMENT:id`: the message is edited from any environment, D1 only from the matching one.
 * Per project: the texts of the notification and of the no-JS page (`texts` below), NOTIFY / EMAIL_* in wrangler.jsonc.
 */
import { MAX_LENGTH, validate, type Fields, type Invalid } from './validate';

/** Secrets are not part of the generated Env (set with `wrangler secret put`, locally in .dev.vars); the e-mail binding
 * and vars exist only when the project enables the channel in wrangler.jsonc; D1 and the rate limit only once
 * /cloudflare-form connected the forms (a site without forms deploys with neither, /api/* is then an unknown URL) */
type Bindings = Env & {
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CHAT_ID?: string;
  TELEGRAM_WEBHOOK_SECRET?: string;
  EMAIL?: SendEmail;
  EMAIL_FROM?: string;
  EMAIL_TO?: string;
  DB?: D1Database;
  FORM_RATE_LIMIT?: RateLimit;
};
/** The bindings the form endpoints need; `hasForms` narrows to them */
type FormBindings = Bindings & { DB: D1Database; FORM_RATE_LIMIT: RateLimit };
const hasForms = (env: Bindings): env is FormBindings => !!env.DB && !!env.FORM_RATE_LIMIT;

type Locale = 'ru' | 'uk' | 'en';
const LOCALES: Locale[] = ['ru', 'uk', 'en'];
const DEFAULT_LOCALE: Locale = 'ru';

/** A submission sent faster than this after the page loaded (ms) is a bot */
const MIN_FILL_TIME = 3000;

/** Texts of the notification (the client's language) and of the page shown without JS (the site languages) */
const texts = {
  /** Notification: `Новая заявка [DD.MM.YYYY]`, the site language, a blank line, then only the fields the visitor filled */
  subject: 'Новая заявка',
  sentFrom: 'Отправлено с языка сайта',
  languages: { ru: 'Русский', uk: 'Украинский', en: 'Английский' } satisfies Record<Locale, string>,
  labels: { name: 'Имя', phone: 'Телефон', email: 'Email' },
  /** The inline button under the Telegram message and the first line after it was pressed */
  processButton: '✅ Обработано',
  processed: '✅ Обработано',
  processedToast: 'Заявка отмечена как обработанная',
  /** The client's time zone for the date in the notification */
  timeZone: 'Europe/Madrid',
  page: {
    ru: { title: 'Заявка', sent: 'Заявка отправлена. Я свяжусь с вами в ближайшее время.', failed: 'Не удалось отправить заявку. Попробуйте ещё раз.', back: 'Вернуться на сайт' },
    uk: { title: 'Заявка', sent: 'Заявку надіслано. Я зв’яжуся з вами найближчим часом.', failed: 'Не вдалося надіслати заявку. Спробуйте ще раз.', back: 'Повернутися на сайт' },
    en: { title: 'Request', sent: 'Your request has been sent. I will get back to you soon.', failed: 'The request could not be sent. Please try again.', back: 'Back to the site' },
  } satisfies Record<Locale, { title: string; sent: string; failed: string; back: string }>,
};

interface Submission extends Fields {
  form: string;
  page: string;
  locale: Locale;
}

/** What the script receives; `code` picks the dictionary message, `fields` get `aria-invalid` */
type Result = { ok: true } | { ok: false; code: Invalid['code'] | 'rate' | 'error'; fields?: Invalid['fields'] };

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== '/api/form' && url.pathname !== '/api/telegram') return serveAssets(request, url, env);
    // Forms not connected yet (no D1 / rate limit binding in wrangler.jsonc): /api/* is an unknown URL → 404 page
    if (!hasForms(env)) return serveAssets(request, url, env);
    if (request.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'POST' } });
    return url.pathname === '/api/form' ? handleForm(request, env) : handleTelegram(request, env);
  },
} satisfies ExportedHandler<Bindings>;

/** Static files. Outside production (stage: `run_worker_first: true` in wrangler.jsonc) the site is kept out of search:
 * `X-Robots-Tag: noindex` on every response and a robots.txt that disallows everything. Production serves them as they are */
const serveAssets = async (request: Request, url: URL, env: Bindings): Promise<Response> => {
  if (env.ENVIRONMENT === 'production') return env.ASSETS.fetch(request);
  if (url.pathname === '/robots.txt') {
    return new Response('User-agent: *\nDisallow: /\n', { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Robots-Tag': 'noindex' } });
  }
  const response = await env.ASSETS.fetch(request);
  const headers = new Headers(response.headers);
  headers.set('X-Robots-Tag', 'noindex');
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
};

const handleForm = async (request: Request, env: FormBindings): Promise<Response> => {
  const url = new URL(request.url);
  const wantsJson = request.headers.get('Accept')?.includes('application/json') ?? false;

  // Only the site's own pages post here
  const origin = request.headers.get('Origin');
  if (origin && new URL(origin).host !== url.host) return new Response('Forbidden', { status: 403 });

  let data: FormData;
  try {
    data = await request.formData();
  } catch {
    return new Response('Bad Request', { status: 400 });
  }

  // Control characters out, trimmed, capped — every text field goes through here
  const field = (name: string) => {
    const value = data.get(name);
    return typeof value === 'string' ? value.replace(/[\p{Cc}]/gu, ' ').trim().slice(0, MAX_LENGTH) : '';
  };
  const localeValue = field('locale');
  const locale = LOCALES.find((known) => known === localeValue) ?? DEFAULT_LOCALE;
  const backUrl = request.headers.get('Referer') ?? url.origin;
  const respond = (result: Result, status = 200) =>
    wantsJson ? Response.json(result, { status }) : htmlPage(result.ok, locale, backUrl, status);

  // Bots: the hidden field is filled, or the form was sent faster than a person can type
  const started = Number(field('started'));
  if (field('website') || (started > 0 && Date.now() - started < MIN_FILL_TIME)) return respond({ ok: true });

  const pageValue = field('page') || new URL(backUrl, url.origin).pathname;
  const submission: Submission = {
    form: field('form').replace(/[^a-z0-9-]/gi, '').slice(0, 40) || 'form',
    page: /^\/[\w\-./]*$/.test(pageValue) ? pageValue : '/',
    locale,
    name: field('name'),
    phone: field('phone'),
    email: field('email'),
    consent: data.get('consent') !== null,
  };
  const invalid = validate(submission);
  if (invalid) return respond({ ok: false, ...invalid }, 400);

  // Counted after the check, so a visitor correcting a typo does not spend the limit
  const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
  const { success } = await env.FORM_RATE_LIMIT.limit({ key: ip });
  if (!success) return respond({ ok: false, code: 'rate' }, 429);

  let id: number;
  try {
    const row = await env.DB.prepare(
      'INSERT INTO submissions (form, page, locale, name, phone, email, consent_at) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id',
    )
      .bind(submission.form, submission.page, submission.locale, submission.name, submission.phone, submission.email, new Date().toISOString())
      .first<{ id: number }>();
    if (!row) throw new Error('INSERT returned no row');
    id = row.id;
  } catch (error) {
    console.error('[form] D1 insert failed', error);
    return respond({ ok: false, code: 'error' }, 500);
  }

  const notified = await notify(submission, id, env);
  try {
    await env.DB.prepare('UPDATE submissions SET notified = ? WHERE id = ?').bind(notified.join(','), id).run();
  } catch (error) {
    console.error('[form] D1 update failed', error);
  }
  return respond({ ok: true });
};

/** Sends the notification through every channel in NOTIFY; returns the channels that succeeded */
const notify = async (submission: Submission, id: number, env: Bindings): Promise<string[]> => {
  const channels = env.NOTIFY.split(',').map((channel) => channel.trim()).filter(Boolean);
  const message = formatMessage(submission, env);
  const done: string[] = [];
  for (const channel of channels) {
    try {
      if (channel === 'telegram') await sendTelegram(message, id, env);
      else if (channel === 'email') await sendEmail(message, env);
      else throw new Error(`unknown NOTIFY channel "${channel}"`);
      done.push(channel);
    } catch (error) {
      console.error(`[form] ${channel} notification failed`, error);
    }
  }
  return done;
};

interface Message {
  title: string;
  meta: string;
  fields: { label: string; value: string }[];
}

const formatMessage = (submission: Submission, env: Bindings): Message => {
  const date = new Intl.DateTimeFormat('ru', { timeZone: texts.timeZone, day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date());
  const stage = env.ENVIRONMENT === 'production' ? '' : ` [${env.ENVIRONMENT}]`;
  return {
    title: `${texts.subject} [${date}]${stage}`,
    meta: `${texts.sentFrom}: ${texts.languages[submission.locale]}`,
    fields: [
      { label: texts.labels.name, value: submission.name },
      { label: texts.labels.phone, value: submission.phone },
      { label: texts.labels.email, value: submission.email },
    ].filter((field) => field.value),
  };
};

const escapeHtml = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Telegram Bot API call; throws with the API's answer when it fails */
const telegram = async (method: string, payload: Record<string, unknown>, env: Bindings) => {
  if (!env.TELEGRAM_BOT_TOKEN) throw new Error('TELEGRAM_BOT_TOKEN secret is not set');
  const response = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(`Telegram ${method} ${response.status}: ${await response.text()}`);
};

/** `<b>Label:</b> value` — the value stays plain so Telegram turns the phone and the e-mail into links */
const fieldLines = (fields: Message['fields']) => fields.map((f) => `<b>${escapeHtml(f.label)}:</b> ${escapeHtml(f.value)}`);

const sendTelegram = async ({ title, meta, fields }: Message, id: number, env: Bindings) => {
  if (!env.TELEGRAM_CHAT_ID) throw new Error('TELEGRAM_CHAT_ID secret is not set');
  await telegram(
    'sendMessage',
    {
      chat_id: env.TELEGRAM_CHAT_ID,
      text: [`<b>${escapeHtml(title)}</b>`, escapeHtml(meta), '', ...fieldLines(fields)].join('\n'),
      parse_mode: 'HTML',
      link_preview_options: { is_disabled: true },
      reply_markup: { inline_keyboard: [[{ text: texts.processButton, callback_data: `done:${env.ENVIRONMENT}:${id}` }]] },
    },
    env,
  );
};

/** Telegram webhook: the «Обработано» button. Always 200, otherwise Telegram keeps retrying the update */
interface CallbackUpdate {
  callback_query?: {
    id: string;
    data?: string;
    from: { first_name: string; last_name?: string };
    message?: { message_id: number; chat: { id: number }; text?: string };
  };
}

const handleTelegram = async (request: Request, env: FormBindings): Promise<Response> => {
  if (!env.TELEGRAM_WEBHOOK_SECRET || request.headers.get('X-Telegram-Bot-Api-Secret-Token') !== env.TELEGRAM_WEBHOOK_SECRET) {
    return new Response('Forbidden', { status: 403 });
  }
  let update: CallbackUpdate;
  try {
    update = (await request.json()) as CallbackUpdate;
  } catch {
    return new Response('Bad Request', { status: 400 });
  }
  const query = update.callback_query;
  const match = query?.data?.match(/^done:(\w+):(\d+)$/);
  if (!query || !match || !query.message?.text) return new Response('ok');

  const [, environment, id] = match;
  const who = [query.from.first_name, query.from.last_name].filter(Boolean).join(' ');
  const when = new Intl.DateTimeFormat('ru', { timeZone: texts.timeZone, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date());
  // The message came as plain text: the title, the language line, a blank line, `Label: value` lines
  const [title, meta, , ...rest] = query.message.text.split('\n');
  const fields = rest.map((line) => {
    const [label, ...value] = line.split(': ');
    return { label, value: value.join(': ') };
  });
  try {
    await telegram(
      'editMessageText',
      {
        chat_id: query.message.chat.id,
        message_id: query.message.message_id,
        text: [`<s>${escapeHtml(title)}</s>`, `<b>${escapeHtml(texts.processed)}</b> ${when} · ${escapeHtml(who)}`, escapeHtml(meta), '', ...fieldLines(fields)].join('\n'),
        parse_mode: 'HTML',
        link_preview_options: { is_disabled: true },
      },
      env,
    );
    await telegram('answerCallbackQuery', { callback_query_id: query.id, text: texts.processedToast }, env);
  } catch (error) {
    console.error('[form] Telegram edit failed', error);
  }
  if (environment === env.ENVIRONMENT) {
    try {
      await env.DB.prepare('UPDATE submissions SET processed_at = ?, processed_by = ? WHERE id = ?').bind(new Date().toISOString(), who, Number(id)).run();
    } catch (error) {
      console.error('[form] D1 processed update failed', error);
    }
  }
  return new Response('ok');
};

const sendEmail = async ({ title, meta, fields }: Message, env: Bindings) => {
  if (!env.EMAIL || !env.EMAIL_FROM || !env.EMAIL_TO) throw new Error('e-mail channel is not configured: send_email binding + EMAIL_FROM / EMAIL_TO vars (wrangler.jsonc)');
  const text = [meta, '', ...fields.map((f) => `${f.label}: ${f.value}`)].join('\n');
  await env.EMAIL.send({ to: env.EMAIL_TO, from: env.EMAIL_FROM, subject: title, text });
};

/** The answer without JS: one sentence and a link back, in the page language */
const htmlPage = (sent: boolean, locale: Locale, backUrl: string, status: number) => {
  const t = texts.page[locale];
  const html = `<!doctype html>
<html lang="${locale}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>${t.title}</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;padding:1rem;font-family:system-ui,sans-serif;text-align:center}p{margin:0 0 1rem}</style></head>
<body><main><p>${sent ? t.sent : t.failed}</p><a href="${escapeHtml(backUrl)}">${t.back}</a></main></body>
</html>`;
  return new Response(html, { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
};
