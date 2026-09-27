# Astro Template by @Roman-Shostak

Стартовий темплейт для сайтів клієнтів на Astro. Кожен новий проєкт — копія цього репозиторію.

## Як правильно користуватися

Темплейт розрахований на роботу з Claude Code і Figma MCP: ви даєте посилання на макет, ШІ верстає
за правилами з `.claude/`, ви правите руками. Порядок нижче — обов'язковий: кожен пропущений крок
потім коштує переробки всіх секцій.

### 1. Клонувати і запустити

```bash
pnpm dlx degit Roman-Shostak/astro-template <client-name>   # копія без історії git
cd <client-name>
git init && git add -A && git commit -m "Start from astro-template"
pnpm install
pnpm exec playwright install chromium   # один раз, для `pnpm shot`
pnpm dev                                # http://localhost:4321, dev-сторінки /dev/tokens і /dev/components
```

### 2. Налаштувати Claude Code

- Модель `opus`, effort `medium` як база (`/model opus`, `/effort medium` або у власному `.claude/settings.local.json`:
  `{ "model": "opus", "effortLevel": "medium" }`). `high` — на старт проєкту (`/sync-tokens`, hero), `sonnet` — на рутину (`/alt-text`, `/seo`, `/prelaunch`), Fast mode не вмикати.
- У `/mcp` лишити Figma і `astro-docs`; Notion, Webflow, Drive та інші конектори для сайту не потрібні.
- Одна секція — одна розмова: після затвердження секції `/clear`. Задачі ставити через скіли (`/sync-tokens`, `/figma-section`, `/seo`, `/prelaunch`), а не вільним текстом — так ШІ проходить усі перевірки сам.

### 3. Старт проєкту, по порядку

1. Зібрати від клієнта стартовий набір: три фрейми Figma (desktop, tablet, mobile), шрифти й ваги, фото у 2x, OG 1200×630, `favicon.svg`, домен, мову сайту, контакти й соцмережі, куди ведуть кнопки й форма, чи потрібні анімації. Скіл `/figma-section` сам попросить це одним повідомленням, якщо чогось бракує.
2. Вказати `site` в `astro.config.mjs` — продакшн-домен, від якого будуються canonical, OG, схема і згенеровані файли.
3. `/sync-tokens` з трьома фреймами — інвентаризація дизайну: ШІ проходить усі елементи макета, кожне повторюване значення (шрифт/розмір, колір, відступ, радіус) отримує один токен і один клас, повторювані елементи стають списком ui-компонентів; результат у `tokens.css`, `utilities.css`, `src/dev/inventory.md`. Перевірити на `/dev/tokens`. Схожі значення ШІ зливає лише після вашого «так».
4. Заповнити `src/data/site.ts` (назва, мова, контакти, соцмережі — лише те, що дав клієнт, порожнє не рендериться).
5. Шрифти: TTF/OTF клієнта в `src/assets/fonts/source/` → `pnpm fonts` → рядки у `fonts` в `astro.config.mjs`.
6. `public/favicon.svg` → `pnpm favicon`; OG-картинка в `src/assets/og/`.
7. Збудувати ui-компоненти зі списку інвентаризації (Button першим), кожен з усіма варіантами на `/dev/components`.

### 4. Верстка

1. `/figma-section <посилання на hero>` — першою завжди hero. Подивитись її на 1540, 1920, 768 і 390 (`pnpm build && pnpm shot 1540,1920,768,390`) і затвердити структуру, перш ніж рухатись далі: вона задає шаблон решті секцій.
2. Далі по одній секції на розмову: `/figma-section <посилання>` (або весь фрейм сторінки — скіл піде по секціях сам). Планшет і мобілка верстаються в тому ж проході, якщо фрейми є.
3. Після кожної секції: `pnpm check` без пайпів, `pnpm build && pnpm shot`, ревʼю `section-reviewer`, `/dev/components` без червоних попереджень.
4. Не просити «ще й хедер / меню / анімацію заодно» — ШІ робить рівно те, що назване; що бракує, він назве одним рядком, і це стане окремим запитом.

### 5. Перед деплоєм

1. `/seo` для кожної сторінки (title 50–60, description 120–160, схема з хлібними крихтами), `pnpm seo` без помилок.
2. `/prelaunch` — домен, збірка, SEO, згенеровані `robots.txt` / `sitemap.xml` / `llms.txt`, іконки, OG, 404, дані клієнта, помилки в консолі.
3. Деплоїти `dist/` (див. «Деплой»).

### 6. Зауваження до темплейту

Коли щось у правилах, скілах чи структурі не подобається, скажіть про це Claude у проєкті: він
запише інструкцію в `TEMPLATE-FIXES.md` і лише потім виправить локально. Файл принесіть у цей
репозиторій і попросіть застосувати записи — так темплейт покращується після кожного сайту.

## Деплой

Збірка статична: `pnpm build` → `dist/` можна хостити будь-де. Усе, що має бути свіжим на деплої, генерується самою збіркою, руками нічого не оновлюється: `public/og/*.jpg` (prebuild), а в `dist/` — `robots.txt`, `sitemap.xml`, `llms.txt`, `llms-full.txt` (`scripts/seo-files.mjs`; сторінки з `noindex` і 404 не потрапляють; опції `disallow`, `blockAiCrawlers`, `lastmod`, `llmsFull` в `astro.config.mjs`). Перед деплоєм: `site` = продакшн-домен, `/prelaunch`.

## Команди

| Команда        | Що робить                                                                                                                                                                                                    |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `pnpm dev`     | dev-сервер                                                                                                                                                                                                   |
| `pnpm build`   | продакшн-збірка в `dist/` (спочатку генерує OG)                                                                                                                                                              |
| `pnpm preview` | локальний перегляд `dist/`                                                                                                                                                                                   |
| `pnpm check`   | перевірка типів і `.astro`-шаблонів (без пайпів — читати рядок «N errors»)                                                                                                                                   |
| `pnpm og`      | `src/assets/og/*` → `public/og/*.jpg` 1200×630                                                                                                                                                               |
| `pnpm fonts`   | `src/assets/fonts/source/*.ttf\|otf` → subset WOFF2 (latin, latin-ext, cyrillic, cyrillic-ext) + рядки для конфігу                                                                                           |
| `pnpm favicon` | `public/favicon.svg` → `favicon.ico` (16+32) і `apple-touch-icon.png` (180)                                                                                                                                  |
| `pnpm shot`    | після збірки: скріншоти сторінки й секцій на 1540/768/390 + висоти секцій (`pnpm shot 1920 --section .hero`); `--check` — усі сторінки з sitemap, помилки консолі й запитів                                  |
| `pnpm seo`     | після збірки: SEO-перевірка кожної сторінки — довжина й унікальність title/description, один `<h1>`, canonical, Open Graph, JSON-LD-граф, наявність і узгодженість `robots.txt` / `sitemap.xml` / `llms.txt` |

## Dev-сторінки (лише в `pnpm dev`)

Існують тільки поки працює dev-сервер, у `dist/` не потрапляють, мають `noindex`:

- `http://localhost:4321/dev/tokens` — усі токени (кольори, розміри, відступи, типографіка, радіуси, motion) і окремо всі утилітарні класи, зчитані з `tokens.css` / `utilities.css`, згруповані за заголовками `/* ---------- Група ---------- */`, з живими зразками і значеннями по брейкпоінтах. Новий токен чи утиліта під заголовком групи з'являється тут автоматично.
- `http://localhost:4321/dev/components` — усі ui-компоненти з усіма варіаціями (на світлому і темному фоні) і всі секції. Ведеться вручну: новий компонент/варіант/секція додається у `src/dev/components.astro`; якщо файл у `ui/` чи `sections/` не показаний, сторінка виводить червоне попередження.

## Стек

- Astro 7, статичний вивід (деплой куди завгодно), TypeScript strict
- Vanilla CSS, порт Webflow-фреймворку Ambi: fluid-scale (`--size-N`, фрейми 1540 / 768 / 390) → семантичні токени → утиліти (`section padding-md`, `container`, `flex-v spacing-xl`, `grid-3/2/1col`, `col-6`, `text-size-h2`); темні секції через `theme--dark`
- Методологія іменування класів (блок / `block_element` / модифікатор `name--value` / стан `is--value` / мікс `--name--value` / брейкпоінти через `/`, поведінка в `data-*`) у `.claude/rules/class-naming.md`
- Спільні ui-компоненти: у темплейті їх немає; `Button`, `Tag`, `Card`, `Input` … збираються під кожен проєкт з інвентаризації дизайну за єдиною формою з правил
- Шрифти: Astro Fonts API, subset-woff2 із `pnpm fonts`, приклад у `astro.config.mjs`
- SEO: canonical, Open Graph, Twitter, фавікони, skip-link і JSON-LD-граф із хлібними крихтами (`src/data/schema.ts`) у `BaseLayout`; дані сайту в `src/data/site.ts`; скіл `/seo` за сучасними практиками і валідатор `pnpm seo`
- Анімації (опційно, `<BaseLayout motion>`): Lenis, reveal при скролі, хедер ховається при скролі вниз, вступ hero
- pnpm

## Структура

```
src/
  layouts/BaseLayout.astro   HTML-оболонка: SEO-head, слоти header/main/footer, проп motion
  pages/                     сторінки (назва файлу = URL); title і description обов'язкові
  components/sections/       секції сторінок
  components/ui/             порожня; компоненти проєкту (Button, Tag, Card …) за формою з .claude/rules/astro-components.md
  data/site.ts               назва, мова, контакти, соцмережі, сутність для схеми — єдине джерело
  data/schema.ts             граф Schema.org (Person/Organization, WebSite, WebPage …)
  scripts/motion.ts          модуль анімацій (вмикається пропом motion)
  dev/                       dev-сторінки /dev/tokens і /dev/components (лише в astro dev, не збираються)
  styles/                    tokens.css, reset.css, base.css, utilities.css, global.css
  assets/<section>/          фото (джерела 2x, kebab-case) для astro:assets
  assets/icons/              SVG-іконки, лого, декоративні вектори
  assets/og/                 джерела OG-картинок → public/og/*.jpg при збірці
  assets/fonts/              woff2 (згенеровані); fonts/source/ — TTF/OTF клієнта
scripts/                     build-og, build-fonts, build-favicon, screenshot, validate-seo, seo-files (robots/sitemap/llms при збірці)
TEMPLATE-FIXES.md            журнал зауважень до темплейту з цього проєкту (Claude пише сам, потім переноситься в темплейт)
public/                      файли як є (favicon.svg + згенеровані іконки, robots.txt)
.claude/                     правила, скіли, агенти та хуки для Claude Code
```

## Робота з Claude

Інструкції для ШІ — у `CLAUDE.md` та `.claude/`:

- `rules/` — правила (головне: робити тільки те, що просили; спочатку перевикористати наявний клас/компонент; семантична розмітка і доступність — `markup.md`; формат секцій; адаптив у тому ж проході)
- `skills/` — `/figma-section` (секція або ціла сторінка), `/new-page`, `/sync-tokens` (інвентаризація дизайну і токени), `/seo`, `/prelaunch` (перевірка перед деплоєм), `/alt-text`
- `agents/` — `section-reviewer`: read-only звірка зверстаної секції з Figma на трьох брейкпоінтах
- `hooks/` — нагадування правил перед кожним редагуванням; на старті сесії — встановлення fonttools і визначення середовища (локально / хмара); на повідомленні зі скаргою чи проханням щось виправити — нагадування записати зауваження до темплейту в `TEMPLATE-FIXES.md`
- `settings.json` — дозволені без підтвердження команди pnpm, заборона читати `.env`
- `.mcp.json` (корінь) — MCP-сервер документації Astro, щоб ШІ звірявся з актуальними доками
