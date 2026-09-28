# Аудит сайту kulbit.site

**Дата:** 28 вересня 2026 · **Проєкт:** Astro 7 (статичний сайт, одна сторінка + 404) з GSAP-рушієм покрокової навігації, портом затвердженої Webflow-збірки · **Гілка:** `stage` → `main`

**Що перевірено:** усі компоненти `src/components/**`, рушій `src/scripts/kulbit/*`, `src/layouts/BaseLayout.astro`, `src/styles/*`, `src/i18n/en.ts`, `src/data/*`, `public/_headers`, `scripts/seo-files.mjs`, `scripts/validate-seo.mjs`, `astro.config.mjs`, `wrangler.jsonc`, зібраний `dist/` і живий продакшен (заголовки, 404).

**Методологія:** 9 вимірів × (агент-пошуковик + незалежний агент-верифікатор, що звіряв кожну знахідку з файлом і відтворював її в браузері). Інструменти: Playwright з фейковим годинником (кожна секція й кожен крок на 1920/1540/1440/768/744/390), axe-core, Lighthouse, W3C Nu, html-validate, CDP accessibility tree, еталонна Webflow-збірка для попіксельного порівняння. Стандарти: WCAG 2.2 AA, WAI-ARIA APG, HTML Living Standard, Google Search Essentials, web.dev Core Web Vitals, правила проєкту (`CLAUDE.md`, `.claude/rules/`).

Після аудиту знахідки виправлено в тій самій нічній сесії; статус кожної — нижче. Номери рядків у знахідках — на момент аудиту (після правок вони змінились; орієнтуйтесь на назву файлу й фрагмент).

## Легенда

Серйозність: 🔴 critical · 🟠 high · 🟡 medium · ⚪ low.  
Статус: ✅ виправлено · 🟢 виправлено частково · ⏸ потребує рішення клієнта / дизайнера · ➖ свідомо залишено (з поясненням).

## Загальний підсумок

| Розділ | 🔴 | 🟠 | 🟡 | ⚪ | Усього | ✅ | 🟢 | ⏸ | ➖ |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A. Семантика та ієрархія заголовків | 0 | 3 | 1 | 7 | 11 | 8 | 1 | 1 | 1 |
| B. Доступність (WCAG 2.2 AA) | 0 | 3 | 7 | 6 | 16 | 13 | 0 | 2 | 1 |
| C. SEO та метадані | 0 | 0 | 2 | 9 | 11 | 10 | 1 | 0 | 0 |
| D. Продуктивність / Core Web Vitals | 0 | 0 | 3 | 2 | 5 | 4 | 0 | 1 | 0 |
| E. Валідність HTML і гігієна коду | 0 | 0 | 4 | 14 | 18 | 16 | 1 | 0 | 1 |
| F. CSS і правила класів проєкту | 0 | 1 | 2 | 15 | 18 | 17 | 0 | 0 | 1 |
| G. Рушій кроків (GSAP) і скрипти | 0 | 1 | 9 | 5 | 15 | 15 | 0 | 0 | 0 |
| H. Адаптивність | 0 | 1 | 6 | 3 | 10 | 6 | 0 | 4 | 0 |
| I. Відповідність еталону Webflow | 0 | 1 | 5 | 4 | 10 | 9 | 0 | 0 | 1 |
| **Разом** | **0** | **10** | **39** | **65** | **114** | **98** | **3** | **8** | **5** |

Одна проблема часто з’являлась у кількох вимірах (наприклад, Tab у невидимі секції — A11Y-01, CSS-01, JS-03, SEM-M1, HV-M1): у деталях вони пов’язані перехресними посиланнями.

### Топ-5, що боліло найбільше (і що з ними зроблено)

1. **Scramble спустошував заголовки для скрінрідерів** (SEM-01 / A11Y-07 / HV-01 / JS-M2): 5 порожніх h2 і випадкові літери під час анімації. → Кожен анімований текст тепер має статичну sr-only копію, анімується aria-hidden копія.
1. **Tab вів фокус у невидимі секції** (A11Y-01 / CSS-01 / JS-03 / SEM-M1 / HV-M1): 6 з 11 зупинок поза екраном, Enter запускав невидиме відео зі звуком. → Фокус з клавіатури тепер перемикає екран (патерн каруселі), після зміни екрана фокус переходить на поточну секцію, закриті картки Projects неактивні.
1. **Hero і хедер не збігались з Webflow** (VP-01…06): «AI / Dimension» рвалось, зайвий роздільник, відступи й кнопка на мобільному. → Виправлено, збіг з еталоном ≤0.5 px.
1. **Телефон в альбомній орієнтації** (R-01 / JS-08 / VP-M01): замість заглушки — зламаний hero. → Портовано попап «Explore better experience» з Webflow, усе під ним неактивне.
1. **Немає OG-зображення і сторінки 404** (SEO-01 / SEO-02): соцпревʼю без картинки, невідомий URL — білий екран. → Кадр hero 1200×630 з alt і розмірами, сторінка 404 у стилі сайту.

## Що вже було зроблено добре (не зламати)

- **A.** Статичний outline бездоганний (ariaSnapshot з javaScriptEnabled:false): h1 → h2 (Our Clients, Motion Cut, our Services) → h3 ×5 → h2 Working process → h3 ×3 → h2 Traditional → h3 → h2 ×3 у футері, без пропущених рівнів; у 9 <h2> лише 3 копії Explore, з яких для AT відкрита одна.
- **A.** html-validate на dist/index.html — 0 помилок; дублікатів id немає (градієнти SVG мають суфікси -d/-t/-m, id попапа гучності генерується на кожен плеєр).
- **A.** Landmarks: <header> (banner) з одним <nav aria-label="Sections">, <main id="main" tabindex="-1"> зі skip link, <footer> лишається поза <main>, хоча він останній у стеку секцій; <address> обгортає контакти.
- **A.** Копії під брейкпоінти коректні: Explore ×3 і «Let’s discuss» ×2 доступні рівно по одній на 1540/768/390 (display:none на прихованих); декоративні копії (SVG діаграми ×3, фон радара ×3, знак футера ×2, стрілки послуг ×2, blur/divider hero) мають aria-hidden або alt="".
- **B.** Бічна панель SectionNav працює як правильний disclosure. Перевірено в браузері: Enter → aria-expanded=true, у панелі знято inert і aria-hidden. Tab проходить 9 пунктів. Esc і вибір пункту повертають фокус на кнопку. aria-current оновлюється подією kulbit:section. axe на відкритій панелі: 0 порушень.
- **B.** У кожної іконкової кнопки є доступна назва через sr-only текст: «Video sound» з aria-pressed, «Menu», «Play video», «Pause»/«Play» (прихований варіант прибраний через visibility), «Volume», «Fullscreen». Приховані через CSS підписи кнопок лишаються їхніми назвами (2.5.3 виконано).
- **B.** Слайдери плеєра мають role=slider, aria-valuenow/valuemax/valuetext і працюють стрілками, Home та End (ArrowRight: 0:00 → 0:06, крок секції не спрацьовує).
- **B.** Двигун кроків керується з клавіатури: ArrowUp/Down, PageUp/Down, Space/Shift+Space. У полях вводу, діалогах і з модифікаторами не спрацьовує.
- **C.** One JSON-LD @graph with stable @ids (#organization, #website, #webpage); all references resolve, there are no empty or TODO values, only visible data (validator: 0 errors)
- **C.** Canonical and og:url are absolute and point to the production host https://kulbit.site/ (it matches routes in wrangler.jsonc); sitemap loc, canonical and og:url are consistent
- **C.** hreflang is correctly absent for a one-language site; og:locale en_US matches <html lang="en">
- **C.** Exactly one <h1> (the hero heading), and the section headings are h2 → h3 with no jumps inside <main>
- **D.** LCP-елемент — текст h1 героя. Він є в HTML від самого початку, шрифт Monument 800 попередньо завантажується, стоїть font-display: swap і fallback з підібраними метриками (size-adjust / ascent-override). Спостережений LCP = FCP, CLS = 0 на всіх брейкпоінтах.
- **D.** Preload шрифтів точний: рівно 2 файли — ваги, які реально видно на першому екрані (Decima 700, Monument 800; перевірено обходом видимих текстових вузлів на 1920/768/390). Сабсети latin-ext ніколи не завантажуються, подвійних завантажень немає.
- **D.** Відео-пайплайн продуманий. Усі 16 MP4 мають faststart (ftyp → moov → mdat). Сервісні та проєктні відео мають preload="none" і прогріваються, коли поточною стає попередня секція; наступна картка сервісів вантажиться після canplaythrough. Worker віддає /video/* з Range-слайсингом через Cache API і max-age=86400.
- **D.** Растрові зображення в AVIF/WebP з коректними srcset/sizes: кандидати, обрані на 1920@1, 1440@2, 768@2 і 390@3, відповідають відрендереному розміру (0.7–1.6×). SVG-логотипи клієнтів уже svgo-чисті (svgo з точністю 2 не знаходить що стиснути).
- **E.** html-validate 11.16 (recommended + document + a11y, без правил стилю лапок і булевих атрибутів) на dist/index.html: 0 помилок. Невалідної вкладеності, порожніх атрибутів (`=""`) і текстів `undefined`/`false` у виводі немає
- **E.** Дублікатів id немає ні статично, ні в живому DOM: перевірено на 1540/768/390 після 60 кроків і після серії змін брейкпоінтів. Усі `url(#…)` і `aria-controls` резолвляться. Id у SVG-файлах мають префікс імені файлу (site-footer-label-paint*, working-process-grad-*), три копії колонки Explore id не містять
- **E.** SVG-атрибути в 52 вбудованих SVG мають правильний camelCase (viewBox, gradientUnits, gradientTransform). JSX-подібних fillRule/strokeWidth немає. Декоративні SVG мають aria-hidden або лежать в aria-hidden-обгортці
- **E.** console.log у продакшн-коді немає. Є лише console.error/warn як запобіжники неправильної розмітки (hero.ts:31, video.ts:47, sections.ts:37, project-video.ts:128/235, index.ts:64)
- **F.** Кожен клас у DOM має селектор, який на цьому елементі справді спрацьовує (перевірено автоматично скриптом effective.mjs: 0 класів без CSS); мертві scoped-селектори — лише state-класи, які додають скрипти (is--open, is--kulbit, accent--blue у <template>), і [href]-стани посилань футера, що чекають контактів (прийнятий TODO)
- **F.** Ліміт у 3 класи дотримано скрізь. Єдиний елемент із 4 класами — корінь Button (`button type--arrow text-size-32` + `hero_pilot` від батька), і правило для ui-компонентів це дозволяє
- **F.** `.container` скрізь без інших класів і без scoped-правил; layout завжди на обгортці всередині
- **F.** Visibility-утиліти ніде не перебиває scoped display: computed display=none перевірено на 1540/900/600/390 для всіх desktop-/tablet-/landscape-/mobile-hide/-only
- **G.** Після 30 перебудов брейкпойнтів (1540→900→390 ×10) слухачі й DOM не ростуть. CDP DOMDebugger до і після: window resize 5, visualViewport resize 1, document click 4; вузлів DOM 1134, mask 10, clipPath 4, overlay 3, wpW 3, SVG рамок кнопок 13. Тобто dispose() у SiteFooter, hero.ts, WorkingProcess і TraditionalProduction прибирають за собою коректно
- **G.** Повноекранне відео проєкту (desktop) вимикає і wheel, і клавіатуру (стан Projects не змінився після wheel + ArrowDown), а після exitFullscreen навігація повертається. Перевірено в testQ2.mjs
- **G.** Відновлення з sessionStorage стійке до значень '99', '-1', 'abc', '2.9', ' 5', '8' і до tablet '1': поза діапазоном нічого не відбувається, інші значення коректно ставлять секцію
- **G.** Бекдроп стрибка з меню правильно перекриває проміжні секції і на цілі 7, і на футері 8, хоча футер лежить поза <main>. <main data-scenes> має z-index 0 (stacking context), футер має z-index 8 поверх нього, бекдроп отримує z-index цілі. Кадри M2-0-8-600.png і M2-0-8-800.png
- **H.** Горизонтального переповнення немає на жодному з 26 в’юпортів і в жодному стані: documentElement/body scrollWidth == clientWidth. Частково обрізаного праворуч чи ліворуч видимого контенту теж немає. Єдиний sw>0 дає горизонтальний свайп OurServices, і його свідомо обрізає `overflow: clip`.
- **H.** Текст ніде не вилазить за свою коробку. Детектор знайшов тільки візуально приховані `.button_label` (clip-path: inset(50%)), а це не дефект.
- **H.** Усі `fill-box`/`object-fit: cover` зображення та відео повністю покривають свої коробки на 320x568, 390x844, 768x1024, 991x1300, 992x700, 1366x625, 1920x1080 і 2560x1440 (cover.mjs: ok). Спотворених (fill з іншим співвідношенням сторін) немає.
- **H.** На 16:9 і 4:3 вміщаються всі 9 секцій у всіх кроках. Найменший запас унизу: hero 32–83 px, футер 41–107 px.
- **I.** Секції 1–8 на 1920/768/390 у кожному стані й кроці збігаються з Webflow в межах 1 px: тексти, картинки, SVG, картки, лінії, прогрес-бари. Кількість кроків у кожній секції однакова (1920: 34, 768: 35, 390: 36 станів).
- **I.** Типографіка скрізь ідентична: font-size, колір, letter-spacing і text-transform усіх зіставлених текстів збігаються. Шрифт PP Monument Wide у нас той самий файл Black (usWeightClass 800, ідентичні метрики й advance-ширини), тому computed weight 800 проти 900 візуально нічого не змінює.
- **I.** Десктопний хедер (1920) і hero на 1920 за геометрією збігаються до 1 px. Hover-рамка кнопки Projects (data-kulbit-border) і hover-кольори Start Pilot ідентичні.
- **I.** Під час завантаження жодна збірка не має intro. Стан hero і хедера на t=0…4000 мс однаковий. Перший кадр до запуску рушія за композицією збігається з еталоном, а в нас ще й одразу видно постер замість чорного екрана.

## План дій (roadmap)

### Етап 1 — блокери і high

- [x] Scramble / morph-тексти доступні скрінрідерам (SEM-01, A11Y-07, HV-01, JS-M2)
- [x] Фокус з клавіатури слідує за екранами (A11Y-01, CSS-01, JS-03, SEM-M1, HV-M1, A11Y-02, JS-M1)
- [x] Відповідність hero/хедера Webflow (VP-01…06, R-09)
- [x] Попап для телефона в альбомній орієнтації (R-01, JS-08, VP-M01)
- [ ] Контраст сірого тексту #404040 (A11Y-03) — рішення дизайнера, токен готовий
- [ ] Контент при 200 % zoom (A11Y-04) — рішення клієнта

### Етап 2 — medium

- [x] Порівняння Traditional доступне повністю і згруповане (SEM-03, A11Y-05, HV-09)
- [x] Reduced motion у рушії і секціях (JS-07, A11Y-14)
- [x] Пауза фонових відео (A11Y-06) — перемикач у меню
- [x] Плеєр: фокус, Esc, PageUp/Down, семантика гучності (A11Y-09, A11Y-10, A11Y-12, A11Y-13, JS-04)
- [x] Стійкість рушія: анімації при зміні брейкпоінта, resize, помилки білдерів (JS-01, JS-02, JS-05, JS-06, JS-09, JS-10, JS-12)
- [x] Продуктивність: ліниві зображення з прогрівом, один радар на пристрій, sizes, reduced-motion без буферизації, inline CSS (PERF-01, PERF-02, PERF-04, PERF-06, HV-02, HV-03, HV-06)
- [x] OG, 404, systemize токенів і класів (SEO-01, SEO-02, CSS-05, HV-04, HV-15, CSS-10)
- [x] Висота секцій = видима область на мобільному (R-02)
- [ ] Обрізання на коротких вікнах і планшетах (R-03, R-04, R-05) — успадковано від Webflow
- [ ] Кроки для тих, хто не може свайпати (A11Y-16) — потрібен макет

### Етап 3 — low

- [x] SEO-гігієна: title/description, robots без sitemap для закритого сайту, HSTS, theme-color, Organization (SEO-03…11)
- [x] Код: id без Math.random, булеві атрибути, мертвий код, застарілі описи, tsconfig (HV-07, HV-08, HV-10…13, HV-17, JS-11, JS-M3)
- [x] CSS: залишки шаблону, мотion-токени, мінімальні gap, смуга хедера (CSS-06…16, CSS-M01)
- [ ] AV1 для hero-відео (PERF-05) — потрібен майстер-файл
- [ ] Always Use HTTPS у Cloudflare (SEO-04, частина в дашборді)

## Детальні знахідки

### A. Семантика та ієрархія заголовків

Статична розмітка (dist/index.html без JS) майже взірцева: html-validate — 0 помилок, дублікатів id немає, рівно один <h1>, по <h2> на кожну секцію, <h3> для карток і етапів без пропущених рівнів, один banner/main/contentinfo, один підписаний <nav>, списки, dl і address стоять там, де треба. Копії під брейкпоінти (Explore ×3, «Let’s discuss» ×2) відкриті для AT рівно по одній на 1540, 768 і 390. Проблема в тому, що бачить скрінрідер під час роботи рушія. Stage-engine і scramble під час виконання ламають дерево доступності. (1) Scramble/typewriter при завантаженні стирає текст: усі 5 <h2> у <main> і 5 абзаців-заяв порожні (axe: empty-heading ×5), а під час анімації в них випадкові літери. (2) Кроки ховають вміст через autoAlpha/display:none. Після першого жесту на hero <h1> отримує visibility:hidden на всіх брейкпоінтах. Картки послуг, етапи Working process і таблиця порівняння доступні лише поки їхня секція поточна, а в Traditional — по одній парі з 12. Переходити між кроками можна тільки колесом, тачем або клавішами, які перехоплює віртуальний курсор. (3) Порівняння Traditional/KULBIT — один <dl> під одним <h3>, текст якого підміняє скрипт, тож групи семантично не розділені. Решта — дрібні зауваження: навігаційні кнопки замість якірних посилань, порядок читання в hero, підписи діаграми без контексту, пари «мітка — значення» як <p>, однакові назви кнопок «Play video», текстові огріхи.

#### SEM-01 · 🟠 high · ✅ виправлено

**Scramble і typewriter спустошують <h2> і заяви: скрінрідер отримує 5 порожніх заголовків, а під час анімації — випадкові літери**

`src/scripts/kulbit/scramble.ts:74-83, 136-140 (розмітка: OurClients.astro:86,91; Projects.astro:39-40; OurServices.astro:51,53; IntroScreen.astro:33,38; перезаписи тексту: OurClients.astro:470-484, TraditionalProduction.astro:709-724)` · стандарт: WCAG 1.3.1 Info and Relationships, 2.4.6 Headings and Labels; axe empty-heading; markup.md → Headings («Every section starts with an <h2>»)

**Проблема.** build() одразу стирає текст усіх [data-kulbit-scramble] / [data-kulbit-typewriter] (setOut) і повертає його, лише коли елемент видно на 60 %. Ці атрибути стоять прямо на <h2> секцій і на абзацах-заявах. Тому при завантаженні в дереві доступності всі 5 <h2> у <main> порожні: Our Clients, Motion Cut, our Services і обидва IntroScreen. Так само порожні 5 абзаців (заяви й «/ by kulbit»). При навігації по заголовках (клавіша H, ротор) чути п'ять безіменних «heading level 2»; єдині названі h2 — три у футері. Секції, які ще не відвідано, лишаються порожніми й далі: коли поточна s3 — 2 порожні h2, коли s5 — 1. Під час анімації (~1 с) textContent складається з випадкових літер. Та сама механіка стирання до '' і перезапису є у фактів Our Clients (morphText) і в шапки Traditional (morphHead). Повний текст лишається тільки з prefers-reduced-motion.

**Рекомендація.** Скрінрідеру віддати одну статичну копію тексту, а анімувати декоративну. У makeReveal обгорнути оригінальний вміст у <span aria-hidden="true"> і зробити його ціллю buildSegments, а поруч додати <span class="sr-only"> з повним текстом. Фіксовані height/overflow лишаються на самому el; утиліта .sr-only вже є в utilities.css; scrambles і далі ключується самим el, тож OurServices.astro:562-571 не ламається. Для перезаписів (факти Our Clients, шапка Traditional) — той самий шаблон у розмітці: sr-only-копія + aria-hidden-ціль, а текст sr-only-копії оновлювати в момент заміни. Увага: коли data-clients-text переїде на внутрішній span, скрипт Our Clients (рядки 466 і 498) більше не зможе брати шаблон і «коробку» факту через text.parentElement. Потрібен окремий хук data-clients-fact на обгортці. Шапку Traditional простіше розв'язати через SEM-03.

**Статус.** ✅ виправлено. scramble.ts: кожен анімований текст має <span class="sr-only"> з повним текстом і <span aria-hidden> з анімованою копією; оригінал у WeakMap (без data-scr-orig). Перевірено CDP accessibility tree: усі h2 мають справжні назви з першого кадру і під час анімації.

#### SEM-02 · 🟠 high · 🟢 виправлено частково

**Стан анімації визначає дерево доступності: після першого жесту зникає <h1>, а картки послуг, етапів і порівняння доступні скрінрідеру лише поки їхня секція поточна**

`src/scripts/kulbit/sections.ts:174, 199 (desktop, buildSectionTimeline); hero.ts:54, 86 (tablet/mobile); також sections.ts:79, 87, 102, 481-482; OurServices.astro:629-631; WorkingProcess.astro:830-832, 917, 920, 976-977, 993; TraditionalProduction.astro:831-838, 902-904` · стандарт: WCAG 1.3.1 Info and Relationships, 1.3.2 Meaningful Sequence, 2.4.6 Headings and Labels; markup.md → Headings («One <h1> per page»), Accessibility baseline

**Проблема.** Кроки ховають вміст через autoAlpha (visibility:hidden) і display:none, а обидва способи прибирають його з дерева доступності. (1) Після першого жесту на hero (ще секція 0) h1 «Filmmaker Vision x AI Dimension» отримує visibility:hidden: на desktop через .hero_heading, на tablet/mobile через .hero_content. Поза стартовим станом на сторінці немає жодного доступного h1; разом із ним зникають заява hero і вміст шапки. (2) На старті (s0) у дереві немає жодного з 9 <h3>: картки послуг, легенда, тижні й 3 етапи Working process (лишаються два порожні list), увесь блок порівняння. (3) Коли поточна s7, доступна 1 пара з 12 («Timeline: 3–12 Months»); решта з'являється по одній на жест, сторінками по 4, а інші сторінки мають display:none. (4) Після виходу з секції її вміст знову ховається: при s5 немає карток послуг, при s7 — етапів. Кроки перемикаються колесом, тачем або ArrowDown/PageDown/Space, а ці клавіші в режимі читання перехоплює скрінрідер. Тож цей вміст для нього практично недосяжний. Без JS структура повна — ламає її саме рушій.

**Рекомендація.** Відокремити візуальний стан від семантичного. (а) Текст фейдити через opacity, а autoAlpha лишити тільки для блоків з елементами керування без заголовків, щоб вони виходили з Tab-порядку. Для цього — helper fadeProp(el) в app.ts, який викликають обидва будівники: desktop — sections.ts:174/199 (саме там ховається h1 на ≥992), tablet/mobile — hero.ts:54/86. Шапка (є кнопка Projects, немає заголовка) і сам CTA лишаються на autoAlpha. .hero_heading/.hero_text фейдяться через opacity. .hero_content на tablet містить h1, тож теж отримує opacity, а CTA hero для tablet отримує власний data-kulbit-fade-tablet="0", щоб і далі виходити з Tab-порядку. Групу карток послуг, cardsWrapper, мітки й тижні Working process, картки Traditional (контролів у них немає) перевести з autoAlpha на opacity. Вміст за межами екрана лишається в дереві, як на звичайній сторінці зі скролом. (б) Таблицю Traditional, де сторінки ховаються через display:none, позначити aria-hidden="true" і додати одну статичну sr-only копію порівняння з текстами зі словника (структура — у SEM-03); радар уже aria-hidden.

До:
```
// sections.ts:174 / :199 (desktop)
    if (el.hasAttribute('data-kulbit-fade')) start.autoAlpha = 1;
        if (el.hasAttribute('data-kulbit-fade')) to.autoAlpha = num(el, 'data-kulbit-fade', 0);
// hero.ts:54 / :86 (tablet / mobile)
    if (has(el, 'fade')) start.autoAlpha = 1;
    if (has(el, 'fade')) to.autoAlpha = value(el, 'fade', 0);
// OurServices.astro:631
    const hideCards = () => gsap.set(group, { autoAlpha: 0, y: RISE });
// WorkingProcess.astro:832
    gsap.set(cardsWrapper, { autoAlpha: 0, y: 40 });
// TraditionalProduction.astro:833, 904
        card.style.display = 'none';
      gsap.set(allCards, { autoAlpha: 0, y: 40 });
```
Після (приклад):
```
// src/scripts/kulbit/app.ts
const FOCUSABLE = 'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])';
/** visibility (autoAlpha) only for a control or a block of controls without headings — it leaves the Tab order;
 *  text only fades (opacity) and stays in the accessibility tree */
export const fadeProp = (el: Element) =>
  el.matches(FOCUSABLE) || (el.querySelector(FOCUSABLE) && !el.querySelector('h1, h2, h3')) ? 'autoAlpha' : 'opacity';

// src/scripts/kulbit/sections.ts:174 / :199 (desktop)
if (el.hasAttribute('data-kulbit-fade')) start[fadeProp(el)] = 1;
if (el.hasAttribute('data-kulbit-fade')) to[fadeProp(el)] = num(el, 'data-kulbit-fade', 0);
// src/scripts/kulbit/hero.ts:54 / :86 (tablet / mobile)
if (has(el, 'fade')) start[fadeProp(el)] = 1;
if (has(el, 'fade')) to[fadeProp(el)] = value(el, 'fade', 0);

<!-- Hero.astro:35 — the CTA fades on its own on tablet (the parent .hero_content only fades its text now) -->
<Button variant="arrow" class="hero_pilot" data-kulbit-y="300" data-kulbit-fade="0" data-kulbit-fade-tablet="0">{t.pilot}</Button>

// OurServices.astro:629-631
const showCards = () => gsap.fromTo(group, { y: RISE, opacity: 0 }, { y: 0, opacity: 1, duration: STEP, ease: EASE });
const hideCards = () => gsap.set(group, { opacity: 0, y: RISE });
// WorkingProcess.astro:831-832 (and the matching tweens at 917, 920, 976-977, 993)
if (htmlEls.length) gsap.set(htmlEls, { opacity: 0, y: 40 });
gsap.set(cardsWrapper, { opacity: 0, y: 40 });

<!-- TraditionalProduction.astro:138 -->
<div class="traditional-production_table" aria-hidden="true" data-traditional-right> … </div>
<!-- + the static sr-only comparison from SEM-03 -->
```

**Статус.** 🟢 виправлено частково. Кроки й далі ховають візуальні стани (як у затвердженому дизайні), але: заголовки й тексти секцій доступні завжди (SEM-01), порівняння Traditional має повну статичну sr-only копію (SEM-03), факти Our Clients — sr-only копію поточних, фокус з клавіатури показує свій екран. h1 hero після першого кроку ховається анімацією (autoAlpha) — як у дизайні.

#### SEM-M1 · 🟠 high · ✅ виправлено

**Tab веде фокус на кнопки невидимих секцій: рушій не показує секцію, де опинився фокус**

`src/scripts/kulbit/navigation.ts:37-50` · стандарт: WCAG 2.4.3 Focus Order, 2.4.7 Focus Visible, 2.4.11 Focus Not Obscured (Minimum); markup.md → Interactive components («Keyboard: everything clickable is focusable in DOM order»), Accessibility baseline («Reading order in the DOM = visual order»)

**Проблема.** Секції стоять стопкою: наступні зсунуті за нижній край екрана, попередні накриті поточною. Проте їхні кнопки лишаються в DOM і в Tab-порядку, а рушій ніяк не реагує на фокус: немає ні focusin, ні inert. На s0 шість із одинадцяти Tab-зупинок лежать за межами в'юпорта: «Play video» ×2, «Start Your Pilot» ×2, «Showreel», «Let’s discuss». Поточна секція при цьому не змінюється, тож користувач клавіатури не бачить ні фокуса, ні того, що активує Enter. На s3 невидимі сім із дев'яти зупинок: «Video sound» і «Play video» ×2 накриті поточною секцією, решта — за екраном. Це прямий наслідок того, що DOM-порядок і видимий стан розходяться. Фікс SEM-02 (лишити текст у дереві) цього не розв'язує, бо стосується лише прихованого через autoAlpha, а тут контроли просто зсунуті.

**Рекомендація.** У navigation.ts слухати focusin. Коли клавіатурний фокус (:focus-visible) потрапляє в [data-kulbit-section], що не є поточною, переходити до неї тим самим autoAdvanceTo через whenIdle — як карусель, що показує слайд із фокусом. Tab тоді стає ще одним способом навігації, а дерево доступності лишається повним. Перевірка :focus-visible не дає клікам мишею запускати перехід. Варіант з inert на непоточних секціях простіший, але прибрав би їх і з дерева доступності та загострив би SEM-02.

**Статус.** ✅ виправлено. Див. A11Y-01.

#### SEM-03 · 🟡 medium · ✅ виправлено

**Traditional: дві групи порівняння в одному <dl> під одним <h3>, текст якого підміняє скрипт**

`src/components/sections/TraditionalProduction.astro:139-189` · стандарт: WCAG 1.3.1 Info and Relationships, 2.4.6 Headings and Labels; markup.md → Lists (dl for label — value pairs), Headings (levels by structure)

**Проблема.** Пари «Timeline:», «Cost Structure:», «Flexibility:», «Scalability:» ідуть у списку двічі поспіль — спершу Traditional, потім KULBIT — без жодної семантичної межі. Яка група до чого належить, видно лише з кольору і з того, що скрипт переписує h3 з «Traditional Production House» на «KULBIT AI-Elevated Production». У природному стані розмітки (без JS або після виправлення SEM-02, коли всі картки лишаться в дереві) усі 12 пар стоять під «Traditional Production House». Тому значення KULBIT («6–12 Weeks», «Up to 60% more value per dollar…», «Exponential 1 Asset = 50+ Variations») озвучуються як характеристики традиційного продакшену. До того ж заголовок, що змінює зміст під час взаємодії, заважає навігації по заголовках.

**Рекомендація.** Розділити групи двома заголовками і двома списками з текстів, які вже є в словнику: <h3>{head.traditional}</h3><dl>картки 1–4</dl>, <h3>{head.kulbit}</h3><dl>картки 5–12</dl>; третя група належить KULBIT, як сказано в коментарі словника (en.ts:264). Разом із SEM-02(б) це робиться однією статичною sr-only копією, а видима анімована таблиця стає aria-hidden. Її шапку-перемикач тоді можна зробити <p>: scramble лишається як є, а скрінрідер її вже не читає. Скрипт шукає картки через [data-traditional-card] по всьому root, тож поділ на кілька <dl> його не ламає.

**Статус.** ✅ виправлено. Статична sr-only копія: h3 Traditional Production House + dl (4 пари), h3 KULBIT AI-Elevated Production + dl (4 пари + 4 переваги); візуальна таблиця aria-hidden, її шапка — <p>.

#### SEM-04 · ⚪ low · ✅ виправлено

**Переходи до секцій зроблено через <button>, а не посилання на якір; у секцій немає id**

`src/components/sections/SiteHeader.astro:17 (також SiteFooter.astro:72, SectionNav.astro:39, Projects.astro:33, Hero.astro:26)` · стандарт: markup.md → Links and buttons («<a href> navigates (… an anchor …)»), Attributes hygiene («anchors that sections receive for in-page navigation are kebab-case ids on the <section>»); WCAG 4.1.2 Name, Role, Value

**Проблема.** «Projects» у шапці, «Showreel» у футері й 9 пунктів SectionNav переносять користувача в інше місце сторінки, тобто це навігація, але розмічені вони як <button type="button">. markup.md: <a href> — для переходу, зокрема на якір; секція, куди ведуть, має kebab-case id, а пункт — href '/#<id>'. Наслідки: у <nav aria-label="Sections"> скрінрідер оголошує дев'ять «button», а не перелік посилань. Без JS (data-steps ставить лише інлайн-скрипт, тож сторінка звичайно скролиться) «Projects» і «Showreel» нічого не роблять, хоча якір спрацював би нативно. У dist жодна секція не має id.

**Рекомендація.** Дати секціям id: Projects — id="projects", Hero — id="hero", IntroScreen — через проп, решта — за порядком. У Button передати href: він уже рендерить <a>, коли href задано. navigation.ts:41 уже викликає event.preventDefault() для [data-target-section], тож рушій працює як і раніше, а без JS спрацьовує нативний якір. У SectionNav пункти зробити <a href="#…" data-target-section>, а поточний позначати aria-current="location" (markCurrent у скрипті). Словник sectionNav.items перевести з рядків на { id, label }. Для <a class="section-nav_item"> додати color: inherit і text-decoration: none, якщо base.css стилізує посилання.

**Статус.** ✅ виправлено. Секції мають id (hero, clients, projects, services, working-process-intro, working-process, traditional-production-intro, traditional-production, footer); пункти меню — <a href="#…" data-target-section> з aria-current="location"; кнопка Projects у хедері — посилання #projects. Рушій, як і раніше, робить плавний перехід.

#### SEM-05 · ⚪ low · ✅ виправлено

**Hero: одне речення заяви розбите на три <p> і в DOM стоїть після CTA**

`src/components/sections/Hero.astro:35-41` · стандарт: WCAG 1.3.2 Meaningful Sequence; markup.md → Accessibility baseline («Reading order in the DOM = visual order»), Text content («Paragraphs are <p>»)

**Проблема.** «We blend human creative direction / with advanced AI / to deliver high-end, brand-aligned videos.» — одне речення (у словнику: «One sentence in three blocks»), але розмічене трьома абзацами. Скрінрідер читає три окремі фрагменти, а навігація по абзацах розриває речення. Крім того, порядок читання — h1 → «Start Pilot» → заява. Візуально ж на tablet/mobile CTA стоїть унизу праворуч після заяви (.hero_pilot position:absolute; bottom:0), а на desktop заява вгорі екрана. markup.md: порядок у DOM має збігатися з візуальним.

**Рекомендація.** Зробити один <p class="hero_text …"> з трьома <span>: у flex-колонці спани стають блоками, тож ширини й вирівнювання з hero_blend/hero_ai/hero_deliver працюють як і зараз; Square рендерить <span>, тому лишається всередині <p> валідно. Кнопку перенести після тексту. На desktop .hero_text має position:absolute і не займає місця у flex-ряду, а на ≤991 абсолютна вже .hero_pilot. Абсолютні діти не є flex-елементами і не отримують gap, а z-index задано явно, тож візуально нічого не зміниться.

**Статус.** ✅ виправлено. Hero: заява — один <p> з трьома <span>, CTA після тексту в DOM; візуально без змін.

#### SEM-06 · ⚪ low · ⏸ потребує рішення клієнта / дизайнера

**Working process: легенда і тижні діаграми читаються без самої діаграми**

`src/components/sections/WorkingProcess.astro:144-158 (обгортка діаграми — рядок 31)` · стандарт: WCAG 1.1.1 Non-text Content, 1.3.1 Info and Relationships; markup.md → Media («a meaningful standalone graphic gets role="img" + aria-label»), Text content («a <figure> + <figcaption> for an image or diagram with a caption»)

**Проблема.** Діаграма (три SVG) правильно має aria-hidden, але її підписи лишаються в дереві як два окремі списки без зв'язку з тим, що вони підписують: «Kulbit, Traditional» і «(Week 1), (Week 2-3), (Week 4-8), (16 Weeks)». Зміст діаграми (етапи Kulbit за тижні 1 / 2–3 / 4–8 проти 16 тижнів традиційного продакшену) не передається. На mobile перші два тижні мають display:none (mobile-hide для i < 2), і лишається лише «(Week 4-8), (16 Weeks)». markup.md: змістовна графіка отримує текстову альтернативу.

**Рекомендація.** Обгорнути блок діаграми (рядок 31) у <figure> з <figcaption class="sr-only">. Текст підпису — новий ключ workingProcess.diagram в en.ts; за core.md §2 його дає клієнт, до того часу там TODO. Коли підпис з'явиться, позначити обидва <ul> aria-hidden="true" разом із SVG. .position-relative лишається на figure, тож абсолютні підписи не зсунуться; margin у figure обнуляє reset.css.

До:
```
<ul class="text-size-16/16/14 text-weight-700">
          <li class="working-process_label" data-process-label="kulbit"><Square size="12" />{t.legend.kulbit}</li>
          <li class="working-process_label label--second" data-process-label="traditional">
            <Square size="12" color="red" />{t.legend.traditional}
          </li>
        </ul>
        <ul class="text-size-16/14/11 text-weight-800">
          { t.weeks.map((week, i) => ( <li …>{week}</li> )) }
        </ul>
```
Після (приклад):
```
<figure class="position-relative text-style-uppercase">
  <figcaption class="sr-only">{t.diagram}</figcaption> {/* TODO: the caption text from the client */}
  <div class="desktop-only">…svg…</div>
  <div class="desktop-hide mobile-hide">…svg…</div>
  <div class="mobile-only">…svg…</div>
  <ul class="text-size-16/16/14 text-weight-700" aria-hidden="true">…legend…</ul>
  <ul class="text-size-16/14/11 text-weight-800" aria-hidden="true">…weeks…</ul>
</figure>
```

**Статус.** ⏸ потребує рішення клієнта / дизайнера. Потрібен текстовий опис діаграми від клієнта (figcaption); до того підписи лишаються як є.

#### SEM-07 · ⚪ low · ➖ свідомо залишено

**Our Services: пари «Timeline: …» і «Specs: …» розмічено абзацами замість <dl>**

`src/components/sections/OurServices.astro:81-85 (дані: src/i18n/en.ts:104, 116, 129, 143, 155; CSS .our-services_meta: 288-292)` · стандарт: markup.md → Lists («Term/definition pairs (label — value, FAQ inside a list, specs) → <dl>»)

**Проблема.** markup.md вимагає для пар «мітка — значення» (зокрема specs) розмітку <dl><dt><dd>. Мета-рядки карток — саме такі пари («Timeline: 1–2 Weeks», «Timeline: 4–8 Weeks», «Specs: 60–120 Seconds.», «Timeline: 3–4 Weeks»), але в словнику це цілі рядки, а в розмітці — <p>. Скрінрідер читає їх як звичайні абзаци, без зв'язку «термін — значення». Виняток — «Product Showcase / 360° Videos» (картка 5): це не пара.

**Рекомендація.** У словнику розділити пари на { term, value }, а рядок картки 5 лишити як текст. Рендерити <dl class="our-services_meta …"> з <div><dt>…</dt> <dd>…</dd></div> на кожну пару. На парі потрібен display:flex з gap 0.5ch: пробіл між dt і dd у flex-контейнері не рендериться. Існуючі display:flex + gap 64 на .our-services_meta тримають пари в ряд, як зараз. Порожній контейнер картки 4 (min-height тримає висоту) лишити як спейсер.

До:
```
<div class="our-services_meta text-size-16/16/13 text-color-brand">
                      {card.meta.map((line) => (
                        <p>{line}</p>
                      ))}
                    </div>
```
Після (приклад):
```
// en.ts:104
meta: [{ term: 'Timeline:', value: '1–2 Weeks' }],
// en.ts:116
meta: [{ term: 'Timeline:', value: '4–8 Weeks' }, { term: 'Specs:', value: '60–120 Seconds.' }],

<dl class="our-services_meta text-size-16/16/13 text-color-brand">
  {card.meta.map((pair) => (
    <div class="our-services_pair"><dt>{pair.term}</dt> <dd>{pair.value}</dd></div>
  ))}
</dl>

.our-services_pair {
  display: flex;
  gap: 0.5ch;
}
```

**Статус.** ➖ свідомо залишено. Пари «Timeline: …» лишились абзацами: переведення в <dl> вимагає зміни форми словника, користь мала (low).

#### SEM-08 · ⚪ low · ✅ виправлено

**Дві кнопки «Play video» мають однакову назву**

`src/components/ui/ProjectVideo.astro:44-50` · стандарт: WCAG 2.4.6 Headings and Labels; markup.md → Links and buttons («text says where it leads on its own»)

**Проблема.** У списку Motion Cut дві однакові кнопки «Play video». У переліку елементів (ротор VoiceOver, Elements List у NVDA, навігація клавішею B) їх не розрізнити, бо назва не каже, яке відео запуститься. Назв проєктів у словнику немає, але постер кожного має змістовний alt. Те саме стосується решти контролів плеєра (Pause, Seek, Volume, Fullscreen ×2).

**Рекомендація.** Прив'язати постер як опис кнопки: задати id на <Picture> (Astro передає зайві атрибути на <img>) на основі popupId і додати aria-describedby на кнопку старту. Коли клієнт дасть назви проєктів, винести їх у словник і додати в sr-only назву кнопки. Зважте, що popupId зараз випадковий (див. SEM-M2) — краще спершу зробити його детермінованим.

**Статус.** ✅ виправлено. Кнопка старту має aria-describedby на постер (його alt називає проєкт).

#### SEM-09 · ⚪ low · ✅ виправлено

**Текст: «Costs.Crew» без пробілу, речення без крапки перед <br>, ASCII-дефіс у діапазонах тижнів**

`src/i18n/en.ts:183, 248, 257` · стандарт: markup.md → Text content («Typographic characters, not ASCII: —, –»); core.md §2 (copy only from the design / client)

**Проблема.** «High Fixed Costs.Crew, travel…» показується на екрані саме так і озвучується як одне слово «Costs.Crew». Найімовірніше, загубився розрив рядка: у двійника KULBIT два рядки — text: [a, b]. «Up to 60% more value per dollar — without compromising quality», далі <br> і «Your budget fuels…»: перший рядок без кінцевої крапки, тож скрінрідер читає «…quality Your budget…» як одне речення. У «(Week 2-3)» і «(Week 4-8)» стоїть ASCII-дефіс, хоча решта діапазонів на сторінці («1–2 Weeks», «3–12 Months», «6–12 Weeks») використовує en dash; markup.md вимагає типографських символів.

**Рекомендація.** «Costs.Crew»: помилка є в самому Figma (вузол 4033:2296), тож звірка з Figma її не розв'яже. Вирішує клієнт; найімовірніше — два рядки, як у двійника KULBIT: text: ['High Fixed Costs.', 'Crew, travel, insurance, rentals.']. Крапку в кінці «…without compromising quality» теж підтвердити в клієнта: так у копії Webflow, а копію не вигадувати (core.md §2). Тижні записати через en dash ('(Week 2–3)', '(Week 4–8)'): це типографіка за markup.md, а не зміна копії, як уже зроблено з лапками в «The “Why”».

**Статус.** ✅ виправлено. Тижні з en dash: (Week 2–3), (Week 4–8). «Costs.Crew» — див. SEO-09. Крапку після «…quality» не додано: це копія Webflow.

#### SEM-M2 · ⚪ low · ✅ виправлено

**id попапу гучності генерується Math.random: нестабільні id при кожній збірці**

`src/components/ui/ProjectVideo.astro:35-36 (використання: 82, 87)` · стандарт: markup.md → Attributes hygiene («ids are unique per page and stable (used by aria-controls, for, anchors)»)

**Проблема.** markup.md вимагає, щоб id були унікальні на сторінці й стабільні, бо на них посилаються aria-controls, for і якорі. Тут id попапу гучності (ціль aria-controls кнопки гучності) випадковий і змінюється з кожною збіркою. У dist зараз volume-ushu3r6e і volume-zetpcnx0, після наступного pnpm build будуть інші. У межах сторінки зв'язок працює, але вихід збірки недетермінований. index.html змінюється навіть без змін у коді, а на цей id не можна спертися (наприклад, aria-describedby з SEM-08 чи тести).

**Рекомендація.** Передавати детермінований id від виклику. Projects рендерить плеєри в map і знає індекс, /dev/components передає свій. Проп обов'язковий, щоб дубль на /dev/components не з'являвся випадково.

**Статус.** ✅ виправлено. Див. HV-08.

### B. Доступність (WCAG 2.2 AA)

Перевірено в браузері (Playwright + axe-core 4.x) на http://localhost:4399/: кожна з 9 секцій (відновлення через sessionStorage) на 1920x1080, 768x1133 і 390x812, чотири проміжні стани анімації на призупиненому годиннику, відкрита бічна панель SectionNav, трасування Tab/Shift+Tab/Esc/Enter, плеєр відео, prefers-reduced-motion, 200 % / 400 % zoom (640x360, 320x256), телефон в альбомній орієнтації 844x390, стиль text-spacing, розміри цілей на 390/360/320. Скрипти лежать у scratchpad/audit/a11y/.

Головне:
1) Lighthouse показує accessibility 100, а axe — лише empty-heading. Обидва «сліпі»: `html[data-steps]{overflow:hidden}` приховує від axe весь контент, тому color-contrast повертає 0 passes і 0 violations, а в Lighthouse він notApplicable. Коли axe «прозрів», знайшов 14 унікальних вузлів із контрастом 2.02:1 (#404040 на #000) у 7 компонентах.
2) Двигун кроків не робить непоточні секції inert. Із секції 0 шість з одинадцяти зупинок Tab припадають на кнопки поза екраном або під верхньою секцією. Фокус на прихованих картках прокручує контейнери з overflow: hidden (ul.projects_cards scrollTop 108, footer scrollTop 432) і ламає макет до перезавантаження.
3) Немає нативного скролу, а секції мають висоту 100vh. Тому на 200 % zoom і на телефоні в альбомній орієнтації контент назавжди обрізаний: з таблиці Traditional Production 22 блоки з 22 ніколи не з'являються на екрані. Попап «поверніть телефон» не портовано: responsive.ts:42-44 виходить, бо розмітки немає, тож і захисту немає.
4) Контент, що з'являється кроками всередині секції, прибирається з дерева доступності (display:none, autoAlpha, <template>). Скрінрідер на телефоні не може зробити крок: жести забирає сам скрінрідер. Scramble на старті очищує 5 h2 і 5 абзаців у ще не відвіданих секціях.
5) Відео hero (цикл 54.6 с) і відео карток послуг (цикл 4.5 с) запускаються самі й не мають кнопки паузи. Порушення 2.2.2 пом'якшене: при reduced motion відео не стартують.
6) Scramble ставить висоту в пікселях і overflow: hidden, тож text-spacing обрізає текст (166 → 240 px). Після старту відео фокус губиться в BODY. Кнопка гучності на ≤991 px оголошує неправильний стан.

Що в порядку: панель SectionNav (aria-expanded/controls, inert, Esc і пункт меню повертають фокус, aria-current синхронізується), назви всіх іконкових кнопок, lang="en", skip link, розміри цілей за 2.5.8 (виняток на відступи), reduced motion для відео, scramble і магніту.

Для /systemize: сірий #404040 має стати одним токеном «muted» не темнішим за #767676 (4.62:1), або використати наявний --theme-text-secondary #858585 (5.69:1). Це рішення дизайну, його треба погодити з клієнтом.

#### A11Y-01 · 🟠 high · ✅ виправлено

**Tab веде фокус у невидимі секції: під поточною або за межами екрана**

`src/scripts/kulbit/sections.ts:42-55 (також app.ts:98-105, navigation.ts:37-49, sections.ts:452-485)` · стандарт: WCAG 2.2: 2.4.3 Focus Order (A), 2.4.7 Focus Visible (AA), 2.4.11 Focus Not Obscured (Minimum) (AA)

**Проблема.** Двигун лише зсуває секції трансформом. Непоточні секції (перекриті зверху або ще нижче екрана) лишаються в порядку Tab без inert і без aria-hidden, а фокус не перемикає секцію. На 1920 з hero шість з одинадцяти зупинок Tab невидимі. Після стрибка кнопкою фокус губиться: після хедерної «Projects» activeElement = BODY, після футерної «Showreel» фокус лишається на кнопці футера, що виїхав за екран. Після переходу з SectionNav наступні Tab знову йдуть у приховані секції.

**Рекомендація.** Синхронізувати inert в одному місці: у persistSection() (app.ts), через яку проходить кожна зміна поточної секції (goToSection, jumpDown/jumpUp, hero.ts). Викликати її також у setupStacking() після applyStackingPositions() і в goToSectionStep(), де persistSection зараз не викликається. Хедер і SectionNav — не секції, тож лишаються доступними. Якщо фокус був у секції, що стає inert, перенести його на заголовок нової поточної секції (tabindex=-1, focus({ preventScroll: true })). Те саме зробити після стрибка кнопкою [data-target-section]. Компроміс: inert прибирає інші екрани з дерева доступності (патерн каруселі в APG), тож скрінрідер читатиме поточний екран, а між екранами переходитиме через SectionNav. Заголовок, на який переноситься фокус, не має бути порожнім, тож потрібен і фікс A11Y-07.

**Статус.** ✅ виправлено. Патерн каруселі без inert на секціях: фокус з клавіатури (:focus-visible) у невидимій секції перемикає на неї екран; після кожної зміни екрана фокус, що лишився в іншій секції, переходить на поточну (tabindex=-1, без кільця); Tab із хедера/меню потрапляє на поточний екран. Закриті картки Projects — inert. Перевірено Tab-обходом на 1540/768/390.

#### A11Y-03 · 🟠 high · ⏸ потребує рішення клієнта / дизайнера

**Сірий текст #404040 на #000: контраст 2.03:1 у 6 компонентах**

`src/components/sections/OurClients.astro:220-225 (також Hero.astro:111-113, IntroScreen.astro:110-112, OurServices.astro:229-231, SiteFooter.astro:259-261, TraditionalProduction.astro:383-385)` · стандарт: WCAG 2.2: 1.4.3 Contrast (Minimum) (AA)

**Проблема.** Частини речень («by Forward-Thinking Brands across», «A Comprehensive», «We blend», «to deliver», «Why», «scale.» …) і терміни таблиці Traditional (dt «Timeline:», «Cost Structure:» …) мають колір #404040 на чорному: 2.03:1. Норма — 4.5:1 для 16 px bold і 13 px і 3:1 для великого тексту (32 px regular). Сірі частини несуть зміст речення. Автоматичні перевірки цього не бачать (див. A11Y-15).

**Рекомендація.** Мінімум для тексту на #000: #767676 (4.62:1) для будь-якого тексту або #5a5a5a (3.04:1) лише для великого. Найпростіше взяти наявний --theme-text-secondary (#858585, 5.69:1). У /systemize звести 7 текстових оголошень #404040 в один токен «muted text» не темніший за #767676. Підписи осей радара (TraditionalProduction.astro:321, частина aria-hidden діаграми) і декоративні іконки (:401) підпадають під виняток для графіки; їх можна не чіпати. Колір береться з Figma, тож зміну треба погодити з дизайнером або клієнтом.

До:
```
.our-clients_grey {
    color: #404040;
  }
  .our-clients_amp {
    color: #404040;
  }
```
Після (приклад):
```
.our-clients_grey,
.our-clients_amp {
  color: var(--theme-text-secondary); /* #858585: 5.69:1 on #000 (was #404040: 2.03:1) */
}
/* the same in Hero .hero_grey, IntroScreen .intro-screen_grey, OurServices .our-services_grey,
   SiteFooter .site-footer_grey, TraditionalProduction .traditional-production_term */
```

**Статус.** ⏸ потребує рішення клієнта / дизайнера. Сірий #404040 — колір дизайну (Webflow black-20), тому не змінено мовчки (markup.md). Тепер це один токен --theme-text-secondary: для AA досить змінити його на ≥ #767676 (4.62:1) — одна правка після погодження з дизайнером/клієнтом.

#### A11Y-04 · 🟠 high · ➖ свідомо залишено

**При 200 % zoom, збільшеному шрифті і в альбомній орієнтації контент назавжди обрізаний**

`src/styles/utilities.css:589-602 (також BaseLayout.astro:149, scripts/kulbit/index.ts:46-53, sections.ts:44, responsive.ts:41-43)` · стандарт: WCAG 2.2: 1.4.4 Resize Text (AA), 1.4.10 Reflow (AA); 1.3.4 Orientation (AA) — для попапу, який планувалось портувати

**Проблема.** Кожна секція має висоту 100vh без прокрутки, а кроки не зсувають контент, що не вміщається. На низькому в'юпорті частина контенту ніколи не потрапляє на екран: 1280x720 при 200 % zoom (640x360 CSS px), телефон в альбомній орієнтації (844x390), 400 % zoom (320x256). Те саме відбувається зі збільшеним шрифтом браузера, бо всі розміри в rem × fluid-scale. На 640x360 з таблиці Traditional жоден із 22 блоків не з'являється повністю. Попап «поверніть телефон» не портовано: setupLandscape виходить, бо немає [data-kulbit-landscape-popup]. Портувати його як блокатор теж не можна, бо це порушить 1.3.4 Orientation.

**Рекомендація.** Вмикати двигун кроків лише там, де екрани вміщаються, а інакше лишати нативну прокрутку. Цей шлях уже працює: без JS сторінка прокручується (8908 px, 81 з 82 текстових блоків видимі). Потрібна одна умова в двох місцях: інлайн-скрипт у BaseLayout (перед першим рендером) і init() у kulbit/index.ts, бо init сам ставить data-steps. Умова: мінімальна висота в'юпорту і кореневий шрифт ≤ 16 px. Коли умова змінюється (zoom або поворот), перезавантажувати сторінку. Поріг перевірити скріншотами на 960x540 і 683x384: 600 px може вимкнути кроки на малих телефонах у портреті, тож, можливо, 500 px. Блокуючий попап не портувати, а гілку setupLandscape прибрати або замінити цим fallback.

До:
```
html[data-steps] {
  overflow: hidden;
}
html[data-steps] .wrapper {
  position: fixed;
  inset: 0;
  min-height: 0;
  overflow: clip;
}
html[data-steps] [data-scenes] {
  position: relative;
  z-index: 0;
  height: 100vh;
}
```
Після (приклад):
```
<!-- BaseLayout.astro -->
{steps && <script is:inline>
  if (matchMedia('(min-height: 500px)').matches && parseFloat(getComputedStyle(document.documentElement).fontSize) <= 16)
    document.documentElement.dataset.steps = '';
</script>}

// scripts/kulbit/index.ts
const STEP_QUERY = '(min-height: 500px)';
const init = () => {
  // Too low for 100vh screens (zoom 200 %, a landscape phone) or a larger default font: native scroll
  if (!document.documentElement.hasAttribute('data-steps')) return;
  // … (and drop `document.documentElement.dataset.steps = ''` from init)
};
matchMedia(STEP_QUERY).addEventListener('change', () => location.reload());
```

**Статус.** ➖ свідомо залишено. Секції висотою в екран — суть затвердженого дизайну; при 200 % zoom / збільшеному шрифті частина контенту обрізана (успадковано). Альтернатива з аудиту — вимикати рушій на низьких екранах і лишати нативний скрол — змінює досвід для всіх коротких вікон; потребує рішення клієнта.

#### A11Y-02 · 🟡 medium · ✅ виправлено

**Фокус прокручує обрізані контейнери з overflow: hidden і ламає макет Projects і футера**

`src/components/sections/Projects.astro:133-139 (також SiteFooter.astro:402)` · стандарт: WCAG 2.2: 2.4.3 Focus Order (A), 2.4.11 Focus Not Obscured (Minimum) (AA); побічно 2.1.1 — верх футера стає недосяжним

**Проблема.** overflow: hidden лишає контейнер програмно прокручуваним. Коли Tab ставить фокус на «Play video» другої картки, що чекає під першою, браузер прокручує ul.projects_cards на 108 px. Скрипт секції про це не знає, тож на Projects перша картка зсунута вгору й обрізана. На 390 фокус на «Let’s discuss» прокручує footer (інлайн overflow: hidden у SiteFooter.astro:402) до scrollTop=432. Разом із кроками через transform верх футера (лого, About) стає недосяжним. Зламаний стан тримається до перезавантаження. OurServices.astro:135 уже захищений через overflow: clip, а тут цього немає.

**Рекомендація.** Для списку проєктів поставити overflow: clip: скрипт Projects не вимірює прокрутку списку, а з clip фокус на другій кнопці лишає scrollTop 0 (перевірено). У футері clip змінює scrollHeight (1244 → 1180), тож для виміру лишити hidden, але скидати програмну прокрутку в builder і знімати слухач у dispose. Краще, коли фокус у футері потрапляє нижче видимої частини, зсувати його кроком (pos) до сфокусованого елемента: інакше скидання scrollTop лишить фокус поза кадром. Фікс A11Y-01 (inert) прибирає більшість тригерів, але друга картка поточної секції Projects лишається, тож clip потрібен і після нього.

**Статус.** ✅ виправлено. Projects: overflow: clip у колонки карток (фокус не прокручує), закриті картки inert; футер: reveal(el) зсуває контент до сфокусованого елемента на планшеті/мобільному.

#### A11Y-05 · 🟡 medium · ✅ виправлено

**Контент кроків усередині секції прихований від AT, а скрінрідер на телефоні не може зробити крок**

`src/components/sections/TraditionalProduction.astro:827-837, 900-905 (також OurClients.astro:100-106)` · стандарт: WCAG 2.2: 1.3.2 Meaningful Sequence (A), 4.1.2 Name, Role, Value (A); практичний бар'єр для мобільних скрінрідерів

**Проблема.** Картки таблиці Traditional з'являються по одній за крок. Непоказані сторінки мають display:none, нерозкриті картки — autoAlpha 0 (visibility:hidden), тож їх немає в дереві доступності. Навіть коли секція поточна, скрінрідер отримує 1 картку з 12. Друга пара фактів Our Clients лежить у <template> і до кроку не існує для AT. Крок робиться лише колесом, свайпом або стрілками. VoiceOver/TalkBack забирають свайпи собі, а нативного скролу немає, тож на телефоні зі скрінрідером порівняння Traditional vs KULBIT недосяжне. На десктопі NVDA/JAWS у режимі перегляду теж перехоплюють стрілки (обхід — режим фокусу).

**Рекомендація.** Відокремити анімовану копію від тексту для AT. Картки непоказаних сторінок ховати візуально (стилі sr-only), а не через display:none. Нерозкриті картки анімувати через opacity замість autoAlpha: фокусованих елементів у них немає. Щоб групи не змішувались для скрінрідера, додати перед кожною групою карток sr-only заголовок (Traditional / KULBIT) з тих самих рядків словника. Для Our Clients продублювати наступні факти в sr-only тексті, а анімований абзац позначити aria-hidden.

**Статус.** ✅ виправлено. Див. SEM-03 (Traditional) і SEM-01 (факти Our Clients: sr-only копія оновлюється в момент заміни).

#### A11Y-06 · 🟡 medium · ✅ виправлено

**Відео hero і послуг запускаються самі й крутяться по колу без кнопки паузи**

`src/scripts/kulbit/video.ts:70-75 (також Hero.astro:64-74, OurServices.astro:119, 504-507)` · стандарт: WCAG 2.2: 2.2.2 Pause, Stop, Hide (A)

**Проблема.** Фонове відео hero (54.6 с, loop) і відео активної картки послуг (4.5 с, loop) стартують автоматично й безкінечно рухаються поряд з іншим контентом. У hero є лише перемикач звуку «Video sound», у секції послуг кнопок немає зовсім. Зупинити рух можна тільки через prefers-reduced-motion. Це пом'якшує проблему, але не замінює механізм паузи, якого вимагає 2.2.2.

**Рекомендація.** Додати кнопку паузи з aria-pressed: у hero поряд зі звуком, для послуг одну на секцію. У video.ts запам'ятовувати вибір користувача, щоб show() не запускав відео, поставлене на паузу. Підпис кнопки — новий рядок словника (TODO до тексту від клієнта), вигляд — TODO до макета.

**Статус.** ✅ виправлено. У меню — перемикач «Pause background video» (aria-pressed): зупиняє відео hero і карток послуг, вибір зберігається на сесію (sessionStorage). Вигляд — тимчасовий, як і вся панель (TODO дизайнера).

#### A11Y-07 · 🟡 medium · ✅ виправлено

**Scramble очищує заголовки й абзаци секцій, до яких ще не дійшли**

`src/scripts/kulbit/scramble.ts:136-139` · стандарт: WCAG 2.2: 1.3.1 Info and Relationships (A), 2.4.6 Headings and Labels (AA); axe empty-heading

**Проблема.** На старті всі [data-kulbit-scramble] і [data-kulbit-typewriter] у секціях нижче поточної порожні, доки секція не з'явиться на екрані. Скрінрідер (список заголовків, навігація по H) знаходить порожні h2 («Our Clients», «Motion Cut», «our Services», «Working process», «Traditional Production») і порожні абзаци. Під час запису скрінрідер читає випадкові символи.

**Рекомендація.** Не прибирати текст із дерева доступності. Оригінальний текст покласти в sr-only span, а анімовані сегменти писати в сусідній span з aria-hidden. aria-label на <p> заборонений, тому потрібна окрема копія. Те саме зробити у власних scramble секцій OurClients і TraditionalProduction (buildSegments).

**Статус.** ✅ виправлено. Див. SEM-01.

#### A11Y-08 · 🟡 medium · ✅ виправлено

**Фіксована піксельна висота scramble-текстів обрізає текст при text-spacing**

`src/scripts/kulbit/scramble.ts:80-83` · стандарт: WCAG 2.2: 1.4.12 Text Spacing (AA)

**Проблема.** Висота в пікселях з overflow: hidden лишається на елементі назавжди, а не лише на час запису. Коли користувач застосовує стиль інтервалів (line-height 1.5, letter-spacing 0.12em, word-spacing 0.16em), текст не вміщається й обрізається. Заява IntroScreen «Working process» втрачає близько третини висоти (166 з 240 px), інші заяви — 166 з 192, заголовки секцій — 18 з 24.

**Рекомендація.** Запам'ятати висоту при побудові, ставити її лише на час анімації й знімати, щойно текст повністю з'явився. Для порожнього стану висоту лишити, щоб не було стрибка макета. Зміна та сама, що в A11Y-07.

**Статус.** ✅ виправлено. Фіксована висота + overflow лише під час запису/стирання; після запису — min-height, тож стиль інтервалів WCAG 1.4.12 розширює блок, а не обрізає текст.

#### A11Y-09 · 🟡 medium · ✅ виправлено

**Після старту відео проєкту фокус губиться в BODY**

`src/scripts/kulbit/project-video.ts:221-226 (також 207-216)` · стандарт: WCAG 2.2: 2.4.3 Focus Order (A)

**Проблема.** Велика кнопка «Play video» зникає через autoAlpha (visibility:hidden), і фокус з неї скидається на <body>. Скрінрідер нічого не оголошує, і його курсор може повернутися на початок документа. Наступний Tab у Chrome все ж іде на Pause, бо точка старту послідовної навігації лишається. Те саме стається, коли крок секції згортає картку, що відтворюється: reset() ховає панель керування разом із фокусом.

**Рекомендація.** Якщо фокус був у плеєрі, одразу зробити панель видимою й перенести фокус на кнопку Play/Pause. У reset() повертати фокус на велику кнопку, щойно вона знову видима.

**Статус.** ✅ виправлено. Після старту відео фокус переходить на кнопку Play/Pause; коли картка згортається з фокусом усередині — повертається на велику кнопку старту.

#### A11Y-16 · 🟡 medium · ⏸ потребує рішення клієнта / дизайнера

**На сенсорних екранах кроки всередині секції доступні лише свайпом: немає альтернативи одним дотиком**

`src/scripts/kulbit/observer.ts:35-49` · стандарт: WCAG 2.2: 2.5.1 Pointer Gestures (A)

**Проблема.** Нативний скрол заблоковано, і на тачі крок робить лише авторський жест — вертикальний свайп, перехоплений Observer. SectionNav дає альтернативу одним дотиком тільки для переходу на початок секції. Кроки всередині секції не мають жодного контролу для тапу: 11 карток Traditional, наступні факти Our Clients, картки послуг і нижня частина футера на 390 з «Let’s discuss». Користувачі, які можуть тапнути, але не свайпнути (тремор, стилус на голові, switch/pointer control), не дістаються цього контенту.

**Рекомендація.** Додати одноточковий контрол «попередній / наступний крок». Найменша зміна — делегований обробник [data-kulbit-advance] у navigation.ts, що викликає наявний advance(dir) через whenIdle, і дві кнопки в панелі SectionNav (або біля її вкладки). Підписи — нові рядки словника (TODO до тексту від клієнта), вигляд — TODO до макета. Ті самі кнопки дадуть шлях мобільним скрінрідерам (A11Y-05) і мишам без колеса.

До:
```
export const setupObserver = () => {
  app.observer?.kill();
  app.observer = Observer.create({
    target: window,
    type: 'wheel,touch',
    tolerance: 10,
    preventDefault: true, // the native scroll is blocked: the page moves only by sections
```
Після (приклад):
```
// navigation.ts → setupNavigation, in the same delegated click listener
const stepTrigger = event.target instanceof Element ? event.target.closest('[data-kulbit-advance]') : null;
if (stepTrigger) {
  event.preventDefault();
  const dir = stepTrigger.getAttribute('data-kulbit-advance') === '-1' ? -1 : 1;
  whenIdle(() => advance(dir));
  return;
}

<!-- SectionNav.astro, in the panel (labels: TODO from the client) -->
<button type="button" class="section-nav_step" data-kulbit-advance="-1">{t.prev}</button>
<button type="button" class="section-nav_step" data-kulbit-advance="1">{t.next}</button>
```

**Статус.** ⏸ потребує рішення клієнта / дизайнера. Кнопки «попередній/наступний крок» для тих, хто не може свайпати, потребують макета (у бічній панелі на телефоні вони закриті самою панеллю).

#### A11Y-10 · ⚪ low · ✅ виправлено

**Кнопка гучності на ≤ 991 px вимикає звук, але оголошує себе як згорнутий попап**

`src/components/ui/ProjectVideo.astro:82-86 (також project-video.ts:314-318)` · стандарт: WCAG 2.2: 4.1.2 Name, Role, Value (A)

**Проблема.** На планшеті й мобільному кнопка працює як перемикач звуку, але в дереві доступності це «Volume, button, collapsed» з aria-controls на попап, який ніколи не відкривається. Стан (звук вимкнено чи ні) не оголошується: aria-pressed немає.

**Рекомендація.** Синхронізувати семантику кнопки з режимом. На ≤ 991 px: aria-pressed = video.muted, без aria-expanded і aria-controls; назва «Mute» — новий рядок словника (TODO до тексту від клієнта). На desktop лишити disclosure. Оновлювати на volumechange і resize.

**Статус.** ✅ виправлено. ≤991: кнопка гучності — перемикач «Mute» з aria-pressed, без aria-expanded/controls; desktop — disclosure; оновлюється на resize і volumechange.

#### A11Y-11 · ⚪ low · ✅ виправлено

**Фокус на вкладці меню видно лише як зміну кольору 12-піксельного трикутника**

`src/components/sections/SectionNav.astro:82-92` · стандарт: WCAG 2.2: 2.4.7 Focus Visible (AA) — формально виконано, індикатор слабкий; 2.4.13 Focus Appearance (AAA)

**Проблема.** Scoped `.section-nav_tab` зі своїм outline #171717 має вищу специфічність, ніж глобальний `:focus-visible { outline: 2px solid var(--theme-text) }` з base.css, тож перекриває його. При фокусі змінюється лише колір трикутника 12x12 з білого на синій, а рамка лишається #171717, майже непомітною на чорному. Кнопки з data-kulbit-border на фокус малюють повну обвідку, а ця вкладка — ні, хоча це вхід у єдине меню навігації.

**Рекомендація.** На :focus-visible змінювати колір наявного outline на білий (рамка стає кільцем фокусу) або додати вкладці data-kulbit-border, як іншим кнопкам з рамкою.

**Статус.** ✅ виправлено. Див. CSS-02.

#### A11Y-12 · ⚪ low · ✅ виправлено

**PageDown/PageUp/Space на слайдерах плеєра гортають секцію з-під фокусу**

`src/scripts/kulbit/project-video.ts:269-281 (також observer.ts:61-63)` · стандарт: WAI-ARIA APG Slider pattern; WCAG 2.2: 2.4.3 Focus Order (A)

**Проблема.** Слайдер перехоплює лише стрілки, Home і End. PageDown і PageUp (за патерном ARIA slider — великий крок) доходять до глобального обробника й гортають секцію. Space на role=slider теж, бо observer.ts:63 виключає тільки button, summary і [role=button]. На 390 фокус лишився в перемотці секції 2, яку вже перекрила секція 3. На 1920 картка згорнулась, і фокус упав у BODY.

**Рекомендація.** У keyValue додати PageUp і PageDown як великий крок (10 с для перемотки, 20 % для гучності), а в observer.ts не гортати по Space, коли фокус на [role="slider"].

**Статус.** ✅ виправлено. PageUp/PageDown на слайдерах — великий крок (10 с / 20 %); рушій не гортає секції зі слайдера, video, audio.

#### A11Y-13 · ⚪ low · ✅ виправлено

**Попап гучності не закривається по Esc і лишається відкритим після виходу фокусу**

`src/scripts/kulbit/project-video.ts:314-324` · стандарт: WAI-ARIA APG Disclosure; WCAG 2.2: 2.1.1 Keyboard (A) — зручність, 1.4.13 за духом

**Проблема.** Попап закривається лише кліком поза ним. Esc у слайдері гучності нічого не робить. Після Tab на «Fullscreen» попап лишається видимим (visibility visible, opacity 1) і перекриває відео над кнопками, а кнопка досі має aria-expanded=true.

**Рекомендація.** Закривати попап по Esc (з поверненням фокусу на кнопку гучності) і коли фокус покидає [data-kulbit-volume].

**Статус.** ✅ виправлено. Esc закриває попап гучності й повертає фокус на кнопку; попап закривається, коли фокус виходить з нього; aria-expanded синхронний.

#### A11Y-14 · ⚪ low · ✅ виправлено

**prefers-reduced-motion не впливає на GSAP-переходи секцій і кроків**

`src/scripts/kulbit/app.ts:51-56` · стандарт: WCAG 2.2: 2.3.3 Animation from Interactions (AAA) — не AA, але рекомендовано

**Проблема.** reset.css гасить лише CSS-анімації й transition. Перехід між секціями (зсув на весь екран), кроки hero і картки секцій при reduce анімуються з повною тривалістю й амплітудою. Відео, scramble і магніт при цьому вимкнені коректно. Великий рух на кожен жест провокує вестибулярні симптоми.

**Рекомендація.** Скоротити тривалості в config, коли reduce: майже миттєва зміна або коротке згасання без зсуву. Контролери секцій (STEP = config.stepDuration / scrollDuration) підхоплять це автоматично.

**Статус.** ✅ виправлено. Під prefers-reduced-motion усі тривалості рушія і секцій × 0: переходи й кроки миттєві, reveal WorkingProcess не блокує жести.

#### A11Y-15 · ⚪ low · ✅ виправлено

**axe і Lighthouse через overflow: hidden на html не перевіряють контраст і дають хибні 100**

`src/styles/utilities.css:589-591` · стандарт: Процес QA; дозволяє автоматично виявляти порушення WCAG 1.4.3 / 2.5.8

**Проблема.** Коли на html є overflow: hidden, axe вважає весь контент невидимим, тож color-contrast повертає 0 passes і 0 violations. Lighthouse показує Accessibility 100, а color-contrast — notApplicable. Регресії контрасту проходять будь-яку автоматичну перевірку, і так пропущено 14 вузлів із 2.02:1 (A11Y-03).

**Рекомендація.** Замінити hidden на clip. clip на кореневому елементі для viewport трактується як hidden, тож нативний скрол і далі заблоковано (.wrapper фіксований, жести блокує Observer). З overflow: clip axe знову бачить контент. Після фіксу повторити Lighthouse.

**Статус.** ✅ виправлено. html[data-steps] { overflow: clip } — axe/Lighthouse знову бачать контент і перевіряють контраст.

### C. SEO та метадані

`pnpm seo` на момент аудиту: 0 помилок, 1 попередження (немає og:image). Голова сторінки в цілому коректна: title, description, canonical https://kulbit.site/, Open Graph, один JSON-LD граф (Organization → WebSite → WebPage), hreflang правильно відсутній, штамп Published відповідає комітам. Реальні проблеми звірено з живим kulbit.site: немає og:image; немає сторінки 404 (продакшен віддавав порожню відповідь 404); сайт, закритий заголовком X-Robots-Tag назавжди, публікував sitemap.xml і llms-файли; http:// не перенаправлявся на https і не було HSTS; .txt без charset. Дрібніше: title і description не за правилами /seo, Organization без description/logo, немає theme-color, друкарська помилка «Costs.Crew», CLAUDE.md і /prelaunch радили прибрати постійний noindex.

#### SEO-01 · 🟡 medium · ✅ виправлено

**На головній немає og:image: соцпревʼю без картинки, twitter:card падає до «summary»**

`src/pages/[...locale]/index.astro:20` · стандарт: .claude/rules/images.md → Open Graph images (рядок 89); .claude/skills/seo/SKILL.md §4 (рядок 40); Open Graph protocol (og:image:width/height/alt)

**Проблема.** Сторінка не передає `ogImage`, у src/assets/og/ лише .gitkeep, public/og/ не існує. Через це в dist/index.html немає `og:image`, layout пише `<meta name="twitter:card" content="summary">` (BaseLayout.astro:146), а в графі немає `primaryImageOfPage`/#primaryimage. Посилання на портфоліо в Telegram/Slack/X/LinkedIn/Facebook показуються текстовою карткою без зображення. Це порушує .claude/rules/images.md:89 («The home page's OG image is mandatory») і /seo §4 (SKILL.md:40). Додатково BaseLayout (рядок 145) пише лише `og:image` без `og:image:width/height/alt` — без розмірів Facebook/LinkedIn часто не малюють картинку при першому шерингу, і немає альтернативного тексту.

**Рекомендація.** 1) Зробити кадр hero 1200×630 (перевірено: Playwright, viewport 1200×630, deviceScaleFactor 2, відео на паузі t=2 с, приховані `.hero_sound`, `.section-nav`, `.hero_pilot` → чистий кадр 2400×1260 з вертольотом і заголовком) і зберегти як src/assets/og/og-home.jpg. prebuild (scripts/build-og.mjs) сам запише public/og/og-home.jpg 1200×630 (пропорція точна — без кропу; деплой-воркфлоу виконує `pnpm build`, тож prebuild спрацює). 2) Передати `ogImage="/og/og-home.jpg"` в index.astro. 3) У BaseLayout.astro біля рядка 145 додати `og:image:width/height` для зображень з /og/ (завжди 1200×630, як `ogImageSize` у schema.ts) та `og:image:alt`/`twitter:image:alt` з нового опційного пропа `ogImageAlt` (текст — ключ у src/i18n/en.ts → pages.home). 4) `pnpm build && pnpm seo`: попередження зникає, twitter:card стає summary_large_image, у графі зʼявляється #primaryimage.

**Статус.** ✅ виправлено. src/assets/og/og-home.jpg (кадр hero 1200×630: «Filmmaker Vision x AI Dimension» над вертольотом) → /og/og-home.jpg; index.astro передає ogImage + ogImageAlt; BaseLayout додає og:image:width/height (1200×630) і og:image:alt / twitter:image:alt; twitter:card став summary_large_image, у графі з’явився #primaryimage.

#### SEO-02 · 🟡 medium · ✅ виправлено

**Немає сторінки 404: на продакшені невідомий URL віддає порожню 404 (білий екран)**

`wrangler.jsonc:23-25` · стандарт: CLAUDE.md → Structure (404.astro in pages/); .claude/skills/prelaunch/SKILL.md §5 (рядок 37); Cloudflare Workers static assets not_found_handling

**Проблема.** wrangler.jsonc розраховує на dist/404.html (`not_found_handling: "404-page"`), але src/pages/404.astro не існує (CLAUDE.md → Structure: «404.astro in pages/»; prelaunch §5). Cloudflare відповідає на будь-який помилковий/старий URL `HTTP/2 404` з `content-length: 0` — відвідувач бачить повністю білу сторінку без логотипа, тексту і шляху на головну. Локальний `astro preview` це маскує власною заглушкою Astro.

**Рекомендація.** Створити src/pages/404.astro на BaseLayout з `noindex`, БЕЗ `steps` (звичайний скрол), з одним <h1> і кнопкою на «/». У шапку ставити лише `<Logo slot="header" />`, а не SiteHeader: кнопка «Projects» у SiteHeader — це `<button data-target-section="projects">`, що працює тільки з рушієм kulbit, тож на 404 вона була б мертвою. Тексти — у словник як `pages.notFound` у src/i18n/en.ts. seo-files.mjs вже виключає /404 з sitemap/llms, `pnpm seo` пропускає контент-перевірки для noindex. Після деплою: `curl -si https://kulbit.site/does-not-exist` → 404 з непорожнім HTML.

**Статус.** ✅ виправлено. src/pages/404.astro: логотип (посилання на головну) у хедері, «404», h1 «Page not found», пояснення і кнопка second «Back to home»; noindex, без рушія кроків; тексти — pages.notFound у en.ts (стандартні тексти, у дизайні сторінки немає).

#### SEO-03 · ⚪ low · ✅ виправлено

**Сайт, закритий noindex назавжди, публікує sitemap.xml, рядок Sitemap і llms.txt/llms-full.txt, а валідатор цього не бачить**

`scripts/seo-files.mjs:109-110, 129-158` · стандарт: Google Search Central: sitemap має містити лише канонічні індексовані URL; robots meta / X-Robots-Tag; llmstxt.org; рішення проєкту «noindex for good» (public/_headers:4-5)

**Проблема.** noindex на kulbit.site задається лише заголовком `X-Robots-Tag: noindex` (public/_headers:9). seo-files.mjs (рядок 109) і validate-seo.mjs (рядок 75, перевірка на 218-220) розпізнають noindex тільки через `<meta name="robots">`, тому вважають головну індексованою. Результат: robots.txt оголошує `Sitemap: https://kulbit.site/sitemap.xml`, sitemap містить URL, закритий заголовком (змішаний сигнал; у Search Console — «Submitted URL marked noindex»), а перевірка валідатора «noindex page … is listed in sitemap.xml» тут сліпа. llms.txt/llms-full.txt віддають увесь текст сайту для AI-краулерів — це суперечить наміру «не конкурувати з kulbit.com». Сам llms-full.txt ще й шумний: «Play video / Pause Play / 0:00 / Volume / Fullscreen» двічі, «Video sound», «Scroll to see more», «Start Pilot» і 16 порожніх пунктів «-» замість логотипів клієнтів (екстрактор відкидає alt).

**Рекомендація.** Додати в seoFiles режим закритого сайту: `seoFiles({ indexable: false })` в astro.config.mjs:100 → пише лише robots.txt (`User-agent: *` + `Allow: /`, щоб Google і далі читав noindex-заголовок) без рядка `Sitemap:` і не пише sitemap.xml, llms.txt, llms-full.txt. У validate-seo.mjs розпізнавати сайт-вайд noindex з dist/_headers (`X-Robots-Tag: noindex` у блоці `/*`): тоді не вимагати sitemap/llms/Sitemap:, видавати помилку, якщо вони все ж є, а head-перевірки (title/description/OG) лишити — вони потрібні для соцпревʼю.

**Статус.** ✅ виправлено. seoFiles({ indexable: false }) в astro.config.mjs: пишеться лише robots.txt (Allow: /, без рядка Sitemap, ASCII); sitemap.xml і llms-файли більше не публікуються. validate-seo.mjs розпізнає закритий сайт за X-Robots-Tag у dist/_headers і перевіряє, що цих файлів немає.

#### SEO-04 · ⚪ low · 🟢 виправлено частково

**http://kulbit.site/ віддає сайт по HTTP: немає редиректу на HTTPS і немає HSTS**

`public/_headers:6-9` · стандарт: .claude/skills/prelaunch/SKILL.md §10 (рядок 63, HTTPS redirect); OWASP Secure Headers (HSTS)

**Проблема.** Запит на http://kulbit.site/ отримує `HTTP/1.1 200 OK` з повною сторінкою без редиректу (у Cloudflare вимкнено «Always Use HTTPS»), а HTTPS-відповіді не мають `Strict-Transport-Security`. Посилання у вигляді http:// (або клієнт без HTTPS-first) відкриває сайт без шифрування. Канонічний URL — https, тож та сама сторінка існує на двох схемах. Це також порушує /prelaunch §10 («HTTPS with a redirect from http://», SKILL.md:63).

**Рекомендація.** У дашборді Cloudflare для зони kulbit.site: SSL/TLS → Edge Certificates → увімкнути «Always Use HTTPS» (301 на https на edge — покриває і Worker, і статику; через код цього не зробити, бо Worker запускається першим лише для /api/* і /video/*). Потім додати HSTS у блок `/*` у public/_headers (без preload, поки клієнт не вирішить; max-age=31536000). Після деплою: `curl -sI http://kulbit.site/` → 301 Location: https://kulbit.site/; `curl -sI https://kulbit.site/ | grep -i strict` → заголовок є.

До:
```
/*
  X-Frame-Options: SAMEORIGIN
  Cross-Origin-Opener-Policy: same-origin
  X-Robots-Tag: noindex
```
Після (приклад):
```
/*
  X-Frame-Options: SAMEORIGIN
  Cross-Origin-Opener-Policy: same-origin
  Strict-Transport-Security: max-age=31536000
  X-Robots-Tag: noindex
```

**Статус.** 🟢 виправлено частково. У public/_headers додано Strict-Transport-Security: max-age=31536000 (без preload). Редирект http → https вмикається лише в дашборді Cloudflare: SSL/TLS → Edge Certificates → «Always Use HTTPS» — це треба зробити власнику акаунта.

#### SEO-05 · ⚪ low · ✅ виправлено

**Title і description не відповідають правилам /seo: 40 і 93 символи, description копіює абзац hero**

`src/i18n/en.ts:11-12` · стандарт: .claude/skills/seo/SKILL.md §2–§3 (рядки 27-35)

**Проблема.** /seo §2 для головної вимагає `<Brand> — <що пропонує, для кого>` на 50–60 символів; поточний title (40 символів) — слоган, що не каже, чим займається Kulbit. /seo §3: description 120–160 символів і «never a copy of … the first paragraph»; поточний (93 символи) дослівно повторює абзац hero (Hero.astro:37-39) і текст «about» у футері (en.ts:300-306). `pnpm seo` мовчить, бо його пороги мʼякші (30–60 / 70–160). Сайт noindex, але ці ж рядки йдуть в og:title/og:description (соцкартка) і назву вкладки, тож description-копія нічого не додає до картки.

**Рекомендація.** Переписати з видимого контенту (послуги «Brand Videos», «Product Videos (KPI-Driven)», «50+ Languages Global Localization», «6–12 Weeks», «AI-Elevated Production»). Слоган лишається в h1 і на OG-зображенні (SEO-01).

**Статус.** ✅ виправлено. title «AI-Elevated Brand & Product Video Production | Kulbit» (53), description 154 символи з видимого контенту (послуги, локалізація 50+ мов), не копія абзацу hero.

#### SEO-06 · ⚪ low · ✅ виправлено

**.txt файли віддаються без charset, llms-full.txt показує «кракозябри» у браузері**

`public/_headers:11-13` · стандарт: HTML Encoding: text/plain без charset → кодування браузера за замовчуванням; RFC 9110 §8.3.1

**Проблема.** Cloudflare віддає robots.txt, llms.txt і llms-full.txt як `content-type: text/plain` без `charset`. Файли в UTF-8 з “ ” – — ’. Chromium відкриває https://kulbit.site/llms-full.txt як windows-1252: «The â€œWhyâ€:». Тире в коментарі robots.txt теж ламається. Краулери зазвичай припускають UTF-8, але людина, що відкриває файл, бачить сміття. (Якщо SEO-03 прибере llms-файли, лишиться тільки robots.txt.)

**Рекомендація.** Додати в public/_headers окремі правила для .txt з `Content-Type: text/plain; charset=utf-8` (правила Cloudflare зливаються — продакшен це показує на /_astro/*). Після деплою перевірити `curl -sI https://kulbit.site/llms-full.txt | grep -i content-type`. Надійний запасний варіант, якщо Cloudflare не дозволить перевизначити Content-Type: писати коментар robots.txt в ASCII (`-` замість `—`, seo-files.mjs:131) і прибрати llms-файли за SEO-03.

**Статус.** ✅ виправлено. llms-файли більше не публікуються (SEO-03), коментар robots.txt тепер лише ASCII — кодування більше не має значення.

#### SEO-07 · ⚪ low · ✅ виправлено

**Вузол Organization у JSON-LD мінімальний: немає description і logo, хоча обидва видимі**

`src/data/site.ts:36-44` · стандарт: .claude/skills/seo/SKILL.md §5 (рядок 51: Organization — logo; description лише з видимого контенту); schema.org Organization

**Проблема.** У графі `{"@type":"Organization","@id":"https://kulbit.site/#organization","name":"Kulbit","url":"https://kulbit.site/"}` — без `description` і `logo`. Футер показує блок «about» з реченням «We blend human creative direction with advanced AI to deliver high-end, brand-aligned videos.», логотип є на кожному екрані. Сутність описана біднішим, ніж дозволяє сторінка. Пріоритет низький: сайт noindex, rich results не застосовуються.

**Рекомендація.** `description` — видиме речення «about». Для `image` — растровий експорт логотипа ≥112×112 на суцільному фоні (темний знак на білому, як favicon-light.svg), напр. новий файл src/assets/site-footer/logo-kulbit.png; schema.ts сам зробить ImageObject #logo. Не брати logo.svg: schema.ts:48 конвертує в jpg, і прозорий білий знак стане чорним квадратом.

**Статус.** ✅ виправлено. site.ts → schema.description = видиме речення «about», schema.image = вебкліп Webflow-збірки (src/assets/shared/logo-kulbit.png, знак на білому): у графі Organization має description і logo (#logo ImageObject).

#### SEO-08 · ⚪ low · ✅ виправлено

**Немає <meta name="theme-color"> для повністю чорного сайту**

`src/layouts/BaseLayout.astro:124-126` · стандарт: HTML Living Standard: meta name=theme-color

**Проблема.** Фон сторінки `--theme-page-bg: var(--swatch-black)` = #000000 (tokens.css:248, 265), усі екрани темні. Без theme-color Chrome на Android малює панель браузера кольором за замовчуванням — світла смуга над чорним повноекранним сайтом ламає занурення.

**Рекомендація.** Додати один meta з кольором фону сторінки в BaseLayout (для шаблону — опційний проп або значення з site.ts; для Kulbit — #000000).

**Статус.** ✅ виправлено. <meta name="theme-color" content="#000000"> з site.themeColor.

#### SEO-09 · ⚪ low · ✅ виправлено

**Видима помилка «High Fixed Costs.Crew» (злиплі слова), яка потрапляє і в текстові файли**

`src/i18n/en.ts:248` · стандарт: Якість контенту / видимий текст

**Проблема.** На картці Traditional Production (секція 7) рядок читається «High Fixed Costs.Crew, travel, insurance, rentals.» — розрив рядка з Figma загубився, слова злиплися. Сусідня група KULBIT показує задуманий формат: `text` із двох елементів = два рядки (en.ts:254-259). Помилка видима на екрані й копіюється в llms-full.txt.

**Рекомендація.** Розбити на два елементи, як Cost Structure групи KULBIT; звірити з Figma-вузлом 4033:2296 (пробіл чи розрив рядка).

**Статус.** ✅ виправлено. «High Fixed Costs. Crew, travel, insurance, rentals.» — у Figma (вузол 4033:2296) теж без пробілу, тож виправлено як очевидну друкарську помилку; у коді TODO підтвердити з клієнтом.

#### SEO-10 · ⚪ low · ✅ виправлено

**CLAUDE.md і /prelaunch досі кажуть прибрати X-Robots-Tag при запуску — суперечить постійному noindex**

`CLAUDE.md:243-244` · стандарт: .claude/rules/core.md §2 (узгодженість інструкцій), §5; рішення проєкту в public/_headers:4-5

**Проблема.** Рішення «noindex назавжди» зафіксоване лише коментарем у public/_headers:4-5 і в особистій памʼяті. Спільні інструкції кажуть протилежне: CLAUDE.md:244 і .claude/skills/prelaunch/SKILL.md:58-60 (плюс рядок звіту «noindex in _headers | ✗ still set — remove at launch», рядок 80). /prelaunch, що запускається «before every release», позначить заголовок як блокер, і агент за скілом може його прибрати — відкривши kulbit.site для пошуку в конкуренції з kulbit.com.

**Рекомендація.** Додати в CLAUDE.md (розділ Deployment) виняток проєкту одним реченням: заголовок на kulbit.site лишається назавжди, /prelaunch звітує його як ✓. Шаблонний скіл у .claude/ не змінювати. Оскільки .claude/README.md описує й кореневий CLAUDE.md, варто додати рядок у «Журнал змін» (core.md §5).

**Статус.** ✅ виправлено. CLAUDE.md → Deployment: виняток Kulbit (noindex назавжди, robots.txt лише, /prelaunch звітує заголовок як ✓); рядок у журналі змін .claude/README.md.

#### SEO-11 · ⚪ low · ✅ виправлено

**Хибний коментар у public/_headers: «Only one rule per path is applied» — насправді Cloudflare зливає всі правила, що збіглися**

`public/_headers:2` · стандарт: Cloudflare Workers static assets / Pages `_headers` (headers from all matching rules are applied)

**Проблема.** Коментар стверджує, що до шляху застосовується лише одне правило. Продакшен показує протилежне: /_astro/*.css отримує і `cache-control` з блоку `/_astro/*`, і `x-frame-options` + `x-robots-tag` з блоку `/*`. Хибний коментар підштовхує дублювати заголовки в кожен блок (або не додавати окремі блоки, як для charset у SEO-06), і наступна правка _headers може піти за ним.

**Рекомендація.** Виправити коментар на фактичну поведінку: заголовки всіх правил, що збіглися, додаються разом; спільні — у `/*`, специфічні — в окремих блоках.

**Статус.** ✅ виправлено. Коментар у public/_headers виправлено: заголовки всіх правил, що збіглися, застосовуються разом.

### D. Продуктивність / Core Web Vitals

Продуктивність у цілому хороша. LCP-елемент — текст h1 героя («FILMMAKER VISION X AI DIMENSION»): він є в HTML від самого початку, його шрифт (Monument 800) попередньо завантажується, а реальний LCP збігається з FCP. JS невеликий, основний потік майже вільний, CLS = 0. Lighthouse mobile 3.1–3.3 s — це артефакт симуляції lantern: у песимістичний граф потрапляють 10 module-скриптів High, 4 шрифти, hero-poster і логотипи з пріоритетом Medium. З реальним тротлінгом CDP (150 ms RTT, 1.6 Mbps, CPU×4, 390×844@3) LCP = FCP = 0.66 s.

Головні реальні втрати:
(1) Зображення всіх прихованих stacked-секцій і постери сервісних відео вантажаться eager одразу при старті: 834 KB на мобільному, 971 KB на десктопі. Вони забирають канал у hero-відео: на slow 4G відео 3 рази зупиняється на дозавантаження (3.2 s простою за перші 12 s).
(2) Три радарні SVG по 368 KB (113 KB gz) вантажаються всі, хоча видимий лише один. Це до того ж сирі Figma-експорти, які svgo стискає на 80 %.
(3) CSS блокує рендер: 85 KB, 12 KB gz, окремий RTT.
(4) При prefers-reduced-motion hero-відео все одно буферизує 5–7 MB, хоча ніколи не програється.

Всі цифри виміряно на копії dist у scratchpad: окремий сервер з brotli та Range, варіанти змінено вручну, проєкт не чіпав.

Сумарний варіант (inline CSS + один радар + відкладені офскрінні зображення + modulepreload):
- реальний тротлінг: FCP/LCP 664 → 384 ms; перший кадр hero 2.75 → 2.45 s; зупинки відео 3 → 0; load 6.7 → 2.6 s;
- Lighthouse mobile (5 прогонів): LCP 3.23 → 3.00 s, вага 3887 → 3318 KiB, запити 63 → 50. Lantern на ці зміни майже не реагує.

Інші виміри, що не дають окремих дефектів:
- HTML: 133 KB raw / 16.7 KB br / 21 KB gz. Inline SVG займають 44 KB raw = 6.2 KB br (37 % стиснутого HTML), але це анімовані діаграми по брейкпоінтах і іконки — виносити немає сенсу. data-astro-cid: 22 KB raw, але лише 0.7 KB br. Парсинг HTML ≈ 75 ms при CPU×4.
- JS: 16 файлів, 61 KB gz; gsap core 27 KB gz + Observer + ScrambleText, усі використовуються. motion.ts/header.ts збираються в dist, але не підключаються. Ланцюжок entry → chunk (gsap/app/responsive) додає RTT. Тест modulepreload: DCL 1.37 → 1.18 s на slow 4G (до цього моменту крокова навігація не приймає жестів), на LCP не впливає. Опційно; для Astro потрібна мала build-інтеграція, тому окремою знахідкою не виношу.
- Шрифти: 2 preload точно для ваг першого екрана (Decima 700, Monument 800). Decima 400 і Monument 400 (23.5 KB) теж вантажаться при старті з пріоритетом VeryHigh: ними набраний текст прихованих (visibility:hidden) секцій. Це неминучий побічний ефект stacked-розмітки, копійчаний. latin-ext не завантажується.
- Основний потік: ≈370 ms задач за 3 s при CPU×4, з них init kulbit 91 ms (у т. ч. 36 ms примусового перерахунку стилів). TBT 3–20 ms. Під час 22 крокових жестів на десктопі при CPU×4 — жодного long-animation-frame > 50 ms; на мобільному 1 кадр 57 ms. У простої 5–12 ms за 5 s.
- Відео: усі 16 MP4 мають faststart (moov перед mdat). На старті вантажиться лише hero; сервісні та проєктні відео мають preload="none" і прогріваються, коли поточною стає попередня секція. Worker уже віддає /video/* з Range і Cache-Control 86400, тож окремої знахідки про кеш немає.
- Відкинуті варіанти: портретний кроп мобільного hero зламав би tablet-крок 2 (там видно повний кадр 16:9). Перекодування сервісних 1080 з CRF 22 дає лише −4…7 %.

Для /systemize та інших агентів:
- Правило images.md «The build minifies every imported SVG» насправді діє лише для SVG-компонентів. SVG, які йдуть через `<Image>`, не мініфікуються, і `<Image>` генерує srcset з ідентичних копій.
- Шаблон images.md «одне зображення на брейкпоінт через desktop-only / desktop-hide mobile-hide / mobile-only» для файлових `<img>` завантажує всі три файли. Для inline SVG він безкоштовний, для `<img>` потрібен `<picture><source media>`.
- Проєкт лежить у ~/Desktop під синхронізацією iCloud. Через це в dist є 162 конфліктні копії «* 3.*». У .git є «index 3» і «index 4» — ризик для кроку commit/push. На користувачів це не впливає, бо CI збирає з чистого checkout.

#### PERF-01 · 🟡 medium · ✅ виправлено

**Зображення прихованих stacked-секцій і постери сервісних відео вантажаться eager при старті й відбирають канал у hero-відео**

`src/components/ui/ProjectVideo.astro:45 (також src/components/sections/Projects.astro:46, src/components/sections/OurServices.astro:119 `poster={card.poster}`, src/components/sections/TraditionalProduction.astro:63/66/69, src/components/sections/SiteFooter.astro:73-82; місце для «прогріву» — src/scripts/kulbit/video.ts:96-102)` · стандарт: Core Web Vitals / resource prioritisation (offscreen images, bandwidth contention); project rule .claude/rules/images.md:33 «Everything else stays lazy by default»

**Проблема.** Усі `<Picture>`/`<Image>` у секціях 2–8 мають loading="eager". Причина задокументована в коментарях: у клипнутому stacked-wrapper lazy-зображення починає вантажитися лише тоді, коли воно вже на екрані, тобто запізно. Постери 5 сервісних відео (атрибут `poster`, ≈246 KB WebP 1280w) вантажаться при старті за будь-яких налаштувань.

У результаті при старті тягнеться ≈740–880 KB зображень секцій ≥ 2, яких на першому екрані немає. Вони йдуть паралельно з hero-відео (preload=auto), а воно і є головним контентом першого екрана. На повільному каналі hero-відео через це кілька разів зупиняється на дозавантаження.

Це також розходиться з images.md:33 «Everything else stays lazy by default». Секція 1 (Our Clients: логотипи й нагороди, ≈136 KB) має лишатися eager, бо вона прогрівається одразу.

**Рекомендація.** 1) У секціях ≥ 2 перевести зображення на loading="lazy": постер ProjectVideo, moreSoon у Projects, радар (разом з PERF-02), showreel у SiteFooter. Без JS, коли секції стоять у потоці, lazy працює нативно.
2) У src/scripts/kulbit/video.ts додати warmImages(index). Для `img[loading="lazy"]` секції вона виставляє `img.loading = 'eager'` (перевірено: це одразу запускає завантаження в клипнутому стеку). Викликати на початку showCurrentVideo() для поточної й наступної секції, до early-return. showCurrentVideo уже викликається при старті, restore, goToSection і передачі героя (sections.ts:256/377/420, hero.ts, responsive.ts через updateVideoVisibility).
3) Для стрибків через SectionNav на дальні секції прогрівати решту у фоні після `canplaythrough` hero-відео.
4) Постери сервісів: замість атрибута `poster` рендерити `<Picture loading="lazy" class="fill-box">` під `<video>`, як у ProjectVideo. Це дає AVIF + srcset. `width` — ширина cover-кадру, а не ширина картки: 16:9-кадр у боксі 752×654 рендериться 1182 px завширшки. Оновити коментарі в ProjectVideo.astro:9-11 і TraditionalProduction.astro:19-20.

**Статус.** ✅ виправлено. Зображення секцій ≥ 2 — loading="lazy"; рушій «прогріває» (eager) зображення поточної й наступної секції, а після canplaythrough hero (або 4 с) — усі; постери сервісних відео — data-poster, ставляться при прогріві.

#### PERF-02 · 🟡 medium · ✅ виправлено

**Три радарні SVG по 368–373 KB вантажаються на кожному пристрої (два приховані display:none); файли — сирі Figma-експорти, а `<Image>` дублює їх у srcset**

`src/components/sections/TraditionalProduction.astro:62-70 (імпорти 22-25; коментар 19-20)` · стандарт: Lighthouse total-byte-weight / image delivery; .claude/rules/images.md:72 «Clean exported SVGs»

**Проблема.** Утиліти desktop-only / desktop-hide mobile-hide / mobile-only ховають обгортку через display:none, але `<img loading=eager>` усередині все одно завантажується. Кожен відвідувач тягне всі три фони (≈113 KB gz кожен), хоча бачить один.

Файли — сирі Figma-експорти: корінь з width/height, непрефіксований id clip0_4010_729, clipPath на весь viewBox, координати з 4–6 знаками. Правило images.md:72 «Clean exported SVGs» не виконано. experimental.svgOptimizer діє лише на SVG-компоненти: файл у dist байт-у-байт збігається з джерелом.

`<Image>` (layout constrained) для SVG генерує srcset з ідентичних копій під різними URL: desktop 640w/750w/828w/1031w, tablet 640w/680w. У dist 10 файлів радара.

**Рекомендація.** 1) Замінити три слоти одним `<picture>` з `<source media>`: браузер завантажує лише файл свого брейкпоінта. Брати `.src`/`.width`/`.height` імпорту (SVG-імпорт в Astro 7 — AstroComponentFactory & ImageMetadata), а не `<Image>`, — тоді зникнуть і дублікати srcset.
2) Один раз прогнати вихідні файли через svgo `--multipass --precision 2` і прибрати clipPath на весь viewBox (images.md).
3) Разом з PERF-01 — loading="lazy" + прогрів секції. Оновити коментар 19-20.

**Статус.** ✅ виправлено. Радарні SVG стиснуто svgo (precision 4: ~113 → ~70 KB gzip кожен, візуально ідентично)

#### PERF-04 · 🟡 medium · ✅ виправлено

**При prefers-reduced-motion (і без JS) hero-відео буферизує ≈5 MB, хоча ніколи не запускається**

`src/scripts/kulbit/video.ts:44-53 (розмітка: src/components/sections/Hero.astro:56)` · стандарт: prefers-reduced-motion / data efficiency (Lighthouse total-byte-weight)

**Проблема.** Hero.astro:56 ставить `preload="auto"`, тож браузер починає тягнути hero-1080 / hero-720 ще при парсингу HTML.

При reduced motion video.ts свідомо не викликає play(): відео стартує лише кнопкою звуку. Проте фонове завантаження ніхто не зупиняє, і Chrome буферизує ≈16 s відео (≈5 MB на 10 Mbps). Без JS картина та сама: немає ні autoplay, ні controls, а ≈5 MB вантажаться.

**Рекомендація.** У initVideo при reduceMotion перевести елемент у `preload = 'none'` і викликати `video.load()`: це скидає ресурс і перериває fetch, розпочатий парсером. Постер лишається. Кнопка звуку, як і зараз, викликає play(), і він сам завантажить файл.

Розмітку `preload="auto"` для решти користувачів не чіпати. No-JS випадок лишається як прийнятна межа.

**Статус.** ✅ виправлено. Під reduced motion hero-відео: preload=none + load() — фонове завантаження ~5 MB зупинено; кнопка звуку, як і раніше, запускає відео.

#### PERF-05 · ⚪ low · ⏸ потребує рішення клієнта / дизайнера

**Hero-відео (75–82 % ваги сторінки) віддається лише в H.264; AV1-джерело економить ≈26–33 % байтів**

`src/components/sections/Hero.astro:56-59` · стандарт: Media efficiency (Lighthouse total-byte-weight)

**Проблема.** hero-1080.mp4 — 17.7 MB (H.264 2.46 Mbps + AAC 128k, 54.6 s), hero-720.mp4 — 9.3 MB (H.264 1.23 Mbps). У Lighthouse це 2944 з 3917 KiB (mobile) і 5120 з 6244 KiB (desktop).

На повільних мережах бітрейт відео визначає зупинки. Сучасні браузери відтворюють AV1 з тією самою якістю при меншому бітрейті.

**Рекомендація.** Попросити в клієнта майстер-файл, закодувати AV1 (SVT-AV1) у тих самих двох роздільностях з тим самим аудіо. Додати `<source>` з codecs перед H.264; браузер без AV1 візьме наступне джерело. Файли лишаються < 25 MiB.

Зважити: Chrome на Android без апаратного AV1 декодує програмно (dav1d), а це CPU і батарея. Для 720p на слабких телефонах варто перевірити плавність.

До:
```
<video class="hero_video-el" muted loop playsinline preload="auto" poster={poster.src}>
          <source src="/video/hero-720.mp4" type="video/mp4" media="(max-width: 991px)" />
          <source src="/video/hero-1080.mp4" type="video/mp4" />
        </video>
```
Після (приклад):
```
<video class="hero_video-el" muted loop playsinline preload="auto" poster={poster.src}>
  <source src="/video/hero-720.av1.mp4" type='video/mp4; codecs="av01.0.05M.08, mp4a.40.2"' media="(max-width: 991px)" />
  <source src="/video/hero-720.mp4" type="video/mp4" media="(max-width: 991px)" />
  <source src="/video/hero-1080.av1.mp4" type='video/mp4; codecs="av01.0.08M.08, mp4a.40.2"' />
  <source src="/video/hero-1080.mp4" type="video/mp4" />
</video>
```

**Статус.** ⏸ потребує рішення клієнта / дизайнера. Потрібен майстер-файл від клієнта, щоб закодувати AV1 (−26–33 % байтів) і додати <source type="video/mp4; codecs=av01…"> перед H.264.

#### PERF-06 · ⚪ low · ✅ виправлено

**Сервісні відео: на десктопах з DPR 1 обирається 1080-файл, хоча картка рендериться меншою за 720p-кадр**

`src/components/sections/OurServices.astro:119-122 (розмір боксу: 328-332)` · стандарт: Media efficiency (responsive video source selection)

**Проблема.** Вибір файлу залежить лише від ширини в'юпорту: при ≥ 992 px береться 1080-файл (1920×1062, до 6.2 Mbps, 2.4–4.3 MB на 4.5-секундний луп).

На 1920×1080@1 медіабокс має 752×654 CSS px (OurServices.astro:328-332). Cover-кадр рендериться 1182×654 device px — це менше за вже наявний 720-файл (1280×708). Найпоширеніші десктопи 1920@1 тягнуть у 2.5–3 рази більше байтів без видимого виграшу.

**Рекомендація.** Розширити media першого джерела на DPR-1-десктопи до ширини, де висота боксу ще ≤ 708 px: 654 × W / 1920 ≤ 708, тобто W ≤ 2078 px. Для DPR ≥ 2 і ширших екранів лишається 1080.

**Статус.** ✅ виправлено. 1080-файл сервісних відео лише для (min-width: 992px) and (min-resolution: 2dppx) або ширини ≥ 2079px; інакше 720.

### E. Валідність HTML і гігієна коду

Статичний dist/index.html чистий за html-validate (recommended + document + a11y, без стилістичних правил): 0 помилок. Дублікатів id немає ні в статиці (31 id), ні в живому DOM (44–48 id на 1540/768/390 після 60 кроків і після зміни брейкпоінтів 1540→800→1540→400→1540→800; маски tp-*-mask-* dispose прибирає). Усі посилання url(#…) та aria-controls знаходять свої id. Регістр атрибутів у 52 вбудованих SVG правильний. console.log у продакшн-коді немає. Закоментованого коду немає. astro check: 0/0/0. tsc з noUnusedLocals/noUnusedParameters чистий і для .ts, і для витягнутих скриптів компонентів. Невикористаних файлів у src/assets, ключів у en.ts і полів у site.ts немає (порожні поля site.ts читає schema.ts).

Реальні проблеми є, але не в розмітці як такій, а в згенерованому виводі та гігієні коду:
- W3C Nu знаходить 24 помилки `<source srcset …w>` без `sizes`: їх генерує Astro `<Picture>`, коли `sizes` не передано. Через це браузер завантажує завеликі варіанти зображень.
- `<Image>` для SVG-радарів дає srcset з байт-ідентичних копій, і всі три брейкпоінтні SVG вантажаться на кожному пристрої.
- scramble стирає `<h2>` у DOM: на старті в дереві доступності 5 порожніх заголовків.
- Однакові імена класів мають різні визначення в різних компонентах. Прогрес-лінія повторена 5 разів замість ui-компонента.
- `getImage` генерує невикористані srcset-файли.
- Атрибути мають значення `="true"`, id будується з Math.random, тег `<dl>` містить дублікати `<dt>`.
- Інше: застарілі коментарі та правила, конфліктні копії iCloud у dist, незаповнений inventory.md.

Інвентар TODO/FIXME (FIXME/XXX/HACK немає):
- Hero.astro:34 — куди веде «Start Pilot».
- IntroScreen.astro:49 — куди веде «Start Your Pilot» (обидва інтро-екрани).
- SiteFooter.astro:107, 148 — куди веде «Let’s discuss».
- SiteFooter.astro:19, 34 і site.ts:20, 31 — контакти порожні: email, contactLinks.support/partnership, socials.linkedin.
- site.ts:16 — «TODO» стоїть біля вже заповненого name: 'Kulbit', тобто застарілий.
- SectionNav.astro:11, 51 і en.ts:274 — тимчасовий дизайн і пункти меню.
- Hero.astro:240, ProjectVideo.astro:155, 267, SiteFooter.astro:268 — hover/focus-стани «not in the design».
- tokens.css:282 — `--theme-button-primary-bg-hover` «not in Figma»; це шаблонний токен, і жоден `--theme-button-primary-*` не використовується.
- scripts/kulbit/index.ts:18-21 — не портовано: popup form (у джерелі порожній) і розмітку landscape-popup, тому setupLandscape() одразу виходить.

Для перевірки проти Figma: en.ts:248 «High Fixed Costs.Crew, travel…» — схоже, бракує пробілу після крапки.

Дрібне, окремо не оформлено:
- Експорти, які використовуються лише всередині модуля: sections.ts applyStackingPositions/passHero, video.ts VideoRecord, scramble.ts ScrambleController, schema.ts siteIds, i18n unlocalizedPath.
- Невикористаний ре-експорт у kulbit/index.ts:42.
- `.gitkeep` у вже непорожніх папках.
- Engine-API без розмітки: data-kulbit-step, data-target-step, data-kulbit-order.

Для /systemize (крім знахідок): однаково визначені довільні класи повторюються в кількох компонентах — padding-64/48/24 ×4, spacing-48/48/24 ×4, text-size-32/28/23 ×4, spacing-0/64/24 ×3, spacing-32 ×3, spacing-16 ×2, padding-bottom-64/48/24 ×2. Сірий #404040 як елемент-клас є в 7 компонентах. 113 шаблонних утиліт не використовуються зовсім: text-size-h1…caption, col-*, grid-*, spacing-xs…4xl, border-radius-*, icon-* тощо.

Скрипти: /private/tmp/claude-501/-Users-ju1ceee-Desktop-awwwards-kulbit-awwwards/58836cec-0138-43b3-ba0e-f868479f4768/scratchpad/audit/html-validity/ (runtime.mjs, dump.mjs, headings.mjs, ax.mjs, sizes.mjs, vis.mjs, vnu.json).

#### HV-01 · 🟡 medium · ✅ виправлено

**Scramble стирає h2 і тексти секцій у DOM: одразу після завантаження в дереві доступності 5 порожніх заголовків**

`src/scripts/kulbit/scramble.ts:74-83, 136-139` · стандарт: WCAG 2.2 SC 1.3.1 Info and Relationships, 2.4.6 Headings and Labels; axe empty-heading; html-validate empty-heading; markup.md → Headings

**Проблема.** Логіка ADR-017 очищає текст, поки секція поза екраном. Під очищення потрапляють видимі `<h2>` секцій (IntroScreen.astro:33, OurClients.astro:86, Projects.astro:39, OurServices.astro:51) і їхні statement-`<p>` (IntroScreen.astro:38, OurClients.astro:91, Projects.astro:40, OurServices.astro:53). Одразу після завантаження 5 заголовків h2 (Our Clients, Motion Cut, our Services, Working process, Traditional Production / vs kulbit) — порожні елементи з `<span></span>` усередині. Секції не мають ні inert, ні aria-hidden, тож скринрідер у списку заголовків бачить h1, три заголовки футера і п’ять порожніх h2. Текст з’являється лише тоді, коли секція відкрита на екрані. Під час анімації AT читає випадкові символи. Крім того, в DOM потрапляє атрибут `data-scr-orig` з повним екранованим HTML кожного тексту, включно з data-astro-cid-*.

**Рекомендація.** Анімувати візуальну копію тексту, а для технологій доступності тримати повний текст. У makeReveal вміст переносити в `<span aria-hidden="true">` (його scramble і анімує), а поруч додавати `<span class="sr-only">` з повним текстом. Утиліта `.sr-only` вже є в utilities.css:570. Оригінальну розмітку зберігати у WeakMap, а не в `data-scr-orig`. API контролерів (in/out/setOut, мапа `scrambles`) і фіксована висота не змінюються, бо sr-only позиціонований абсолютно і на висоту не впливає.

**Статус.** ✅ виправлено. Див. SEM-01.

#### HV-02 · 🟡 medium · ✅ виправлено

**24 елементи <source> з width-дескрипторами без sizes: невалідний HTML і завеликі завантаження**

`src/components/sections/OurClients.astro:140 (також Projects.astro:46, ui/ProjectVideo.astro:45, SiteFooter.astro:73-82)` · стандарт: HTML Living Standard — source element (sizes для width-дескрипторів); W3C Nu error; images.md → Rendering rasters

**Проблема.** Astro `<Picture>` передає `sizes` у `<source>`, лише коли проп `sizes` задано явно (node_modules/astro/components/Picture.astro:120-123). Автоматичний `sizes` від `layout: 'constrained'` отримує тільки `<img>`. Усі 12 `<picture>` на сторінці (6 нагород, 2 постери проєктів, «more soon», 3 копії Showreel у футері) мають `<source srcset="… 159w, … 318w">` без `sizes`, і W3C Nu вважає це помилкою. Браузер тоді бере для source `sizes` = 100vw і обирає завеликий кандидат: на 1540 px при DPR 1 нагорода в боксі 128 px вантажить 318w-AVIF, постери в боксі 1404 px — варіант під 1540, а Showreel у боксі 323 px — найбільший варіант.

**Рекомендація.** Передати `sizes` явно в кожен `<Picture>`. Флюїдна шкала пропорційна ширині вьюпорту, тож точні значення записуються у vw (виміряно): нагорода — 8.3vw на десктопі, 15.5vw на планшеті, 23.3vw на мобільному; постери й «more soon» — ~91–92vw; Showreel — 21vw на десктопі і ~92vw нижче 992 px.

**Статус.** ✅ виправлено. Явні sizes у всіх <Picture> (нагороди 8.3/15.5/23.3vw, постери й «more soon» ~92vw, Showreel 26vw / 92vw) — W3C Nu більше не скаржиться, браузер бере правильний кандидат.

#### HV-03 · 🟡 medium · ✅ виправлено

**Фони радара: <Image> для SVG дає srcset з однакових копій, і всі три брейкпоінтні файли вантажаться на кожному пристрої**

`src/components/sections/TraditionalProduction.astro:62-70` · стандарт: images.md → Decorative vectors (один файл на брейкпоінт); markup.md → Performance and delivery

**Проблема.** Проблема 1. Для SVG image service Astro нічого не масштабує, але з глобальним `layout: 'constrained'` все одно будує srcset. Desktop-радар отримує 4 URL (640w/750w/828w/1031w) з побайтно ідентичним вмістом, tablet — 2, mobile — 1. Разом з оригіналами в dist лежить 10 копій по ~380 KB. Проблема 2. Обгортка з `display: none` не зупиняє завантаження `loading="eager"`, тож кожен пристрій тягне всі три файли (~113–115 KB кожен на дроті), хоча показує один. Для 20 SVG-логотипів в OurClients.astro:125/128 теж виникають копія плюс невикористаний оригінал, але там кандидат один, тож користувачі зайвого не вантажать.

**Рекомендація.** Замінити три обгортки і три `<Image>` одним `<picture>` з `<source media>` і сирими `.src`. Для SVG srcset не потрібен, а art direction через `media` означає одне завантаження на пристрій і одну обгортку замість трьох. Для логотипів достатньо `<img src={logo.white.src} width={logo.white.width} height={logo.white.height} …>` або `<Image layout="none">`.

**Статус.** ✅ виправлено. Радар — один <picture> з <source media> і .src імпортів: один файл на пристрій (було три), без фальшивого srcset. Виняток задокументовано в images.md.

#### HV-M1 · 🟡 medium · ✅ виправлено

**Tab переводить фокус у невидимі секції: 6 з 10 зупинок фокуса поза екраном, а рушій не підтягує секцію**

`src/scripts/kulbit/navigation.ts:37-50` · стандарт: WCAG 2.2 SC 2.4.7 Focus Visible (AA), 2.4.11 Focus Not Obscured (Minimum) (AA), 2.4.3 Focus Order

**Проблема.** Усі 9 складених секцій лишаються в порядку табуляції: жодна не має inert, а рушій не обробляє focusin. Із hero користувач Tab-ом потрапляє на «Play video» секції Projects (y=1333 при вьюпорті 870), «Start Your Pilot» секцій 4 і 6 (y=1191) та кнопки футера (y=1458, 1604). Секція при цьому не змінюється (kulbit-section лишається 0), нативного скролу немає, тож кільце фокуса невидиме. Enter на такій кнопці запускає відео чи дію, яких користувач не бачить. Причина та сама, що в HV-01: неактивні секції повністю доступні, але не видимі.

**Рекомендація.** У setupNavigation додати делегований `focusin`. Коли фокус потрапляє в секцію, що не є поточною, рушій через той самий `whenIdle` веде до неї: `autoAdvanceTo(index)`, а для кроку всередині секції, якщо ціль на ньому, — `goToSectionStep`. Так весь вміст лишається доступним і клавіатурі, і скринрідеру (на відміну від inert на неактивних секціях, який відрізав би від SR усе, крім поточного екрана), а фокус завжди видимий.

**Статус.** ✅ виправлено. Див. A11Y-01.

#### HV-04 · ⚪ low · ✅ виправлено

**Одне ім’я класу — різні стилі в різних компонентах (text-size-16, text-size-16/16/13, text-size-16/16/14); у SectionNav ім’я не відповідає CSS**

`src/components/sections/SectionNav.astro:35, 67-71 (також TraditionalProduction.astro:231-240, WorkingProcess.astro:230-234, 262-271, 551-555, SiteFooter.astro:172-176, Hero.astro:131-134, OurClients.astro:187-190)` · стандарт: class-naming.md:110 (text-size-<figma name> / text-size-d/t/m), Reuse first; styles.md → Phases (інформація для /systemize)

**Проблема.** Scoped-класи з однаковим ім’ям визначені по-різному:
- `.text-size-16/16/13`: line-height 1.1 в IntroScreen, OurClients, OurServices, Projects, SiteFooter і SectionNav; 1.3 у TraditionalProduction і WorkingProcess; у WorkingProcess на мобільному ще line-height 1 і letter-spacing 0.01em.
- `.text-size-16`: 16/1.37 у Hero, OurClients і WorkingProcess, але 16/1.1 з tracking 0.03em у SiteFooter.
- `.text-size-16/16/14`: tracking 0.03em у WorkingProcess і без нього в TraditionalProduction.

У SectionNav немає мобільного правила для цього класу (блок @media 136-147), тож «…/13» на ≤479 px дає 16 px. Ім’я, яке має описувати стиль, бреше, і /systemize має знати, що злиття за іменем змінить інтерліньяж частини текстів.

**Рекомендація.** У межах /systemize назвати стилі за Webflow/Figma-іменами, які вже записані в коментарях над правилами (`.text-size-section-h2`, `.text-size-hero`, `.traditional-production-label.is-card` тощо): одне ім’я — один набір розмір/інтерліньяж/трекінг. Для SectionNav або додати мобільне правило (13 px, як у решти section-label), або дати клас, який справді однаковий на всіх брейкпоінтах.

**Статус.** ✅ виправлено. /systemize: спільні стилі стали утилітами з назвами Webflow (text-size-section-label, -section-h2, -hero, -h1, -h3), одноразові — класами компонентів з унікальними Webflow-назвами (text-size-production-head, -process-label …): одне ім’я = один стиль.

#### HV-05 · ⚪ low · ✅ виправлено

**Прогрес-лінія секції зібрана вручну в 5 компонентах, а JS-хелпери до неї скопійовані 3 рази — порушення «reuse first»**

`src/components/sections/OurClients.astro:83, 193-206, 514-536 (також Projects.astro:36, 107-120, 252-273; OurServices.astro:49, 198-211, 603-622; TraditionalProduction.astro:55-57, 258-271, 709-724; IntroScreen.astro:31, 88-92)` · стандарт: astro-components.md:69 → Reuse first («Any element pattern you meet for the second time … is a ui component … in both phases»); class-naming.md → Reuse first

**Проблема.** Той самий елемент (2 px трек на 15 % білого і біла заливка, яку веде скрипт) описано окремими класами й однаковим CSS в OurClients, Projects, OurServices і TraditionalProduction. IntroScreen має варіант «повна лінія». Функції prepareLine, enterLine і collapseLine у скриптах OurClients, Projects та OurServices дослівно однакові; setFill відрізняється лише формулою частки. morphText (OurClients.astro:470-484) і morphHead (TraditionalProduction.astro:709-724) — та сама функція. astro-components.md:69 вимагає робити повторюваний патерн ui-компонентом «in both phases», інакше /systemize отримає 5 наборів класів для однієї речі.

**Рекомендація.** Створити `ui/ProgressLine.astro` з варіантом `type--full` для IntroScreen і `data-progress-fill` на заливці. Через rest-атрибути компонент має пропускати `data-traditional-line`, бо TraditionalProduction шукає заливку лінії через нього. Хелпери prepare/enter/collapse/set винести в `src/scripts/kulbit/progress-line.ts`, а morphText/morphHead — у scramble.ts як `morphSegments(el, segments)`. Компонент додати в /dev/components.

**Статус.** ✅ виправлено. ui/ProgressLine + progress-line.ts (CSS-05); morphText/morphHead → спільний morphSegments у scramble.ts.

#### HV-06 · ⚪ low · ✅ виправлено

**getImage() для постерів генерує невикористані srcset-файли (~730 KB мертвого виводу)**

`src/components/sections/Hero.astro:23 (також OurServices.astro:40)` · стандарт: Гігієна збірки; images.md (Astro assets)

**Проблема.** `getImage` бере глобальний `image.layout: 'constrained'` (node_modules/astro/dist/assets/internal.js:105: `options.layout ?? imageConfig.layout`) і будує srcset. Для `<video poster>` потрібен лише `poster.src`. У результаті в dist 6 зайвих варіантів hero-poster (166 172 B) і 20 зайвих варіантів постерів послуг (562 732 B). На них ніщо не посилається, а збірка витрачає на них час.

**Рекомендація.** Для зображень, від яких потрібен лише `.src` (постери відео), передавати `layout: 'none'`. Тип `ImageLayout` це значення допускає (types.d.ts:199).

**Статус.** ✅ виправлено. Постери hero і послуг — getImage з layout: 'none': невикористаних srcset-файлів більше немає.

#### HV-07 · ⚪ low · ✅ виправлено

**Булеві data-атрибути, передані через компоненти, рендеряться як ="true"**

`src/components/sections/SiteHeader.astro:17 (також IntroScreen.astro:50, SiteFooter.astro:72, 108, 149, TraditionalProduction.astro:146, ui/ProjectVideo.astro:39, 83, 84)` · стандарт: markup.md → Attributes hygiene

**Проблема.** Порожній атрибут, переданий як проп компонента або проставлений на динамічному `<Tag>`, Astro виводить як `="true"`: `data-kulbit-border="true"` ×8, `data-kulbit-project-video="true"` ×2, `data-kulbit-icon-volume="true"` ×2, `data-kulbit-icon-mute="true"` ×2, `data-traditional-square="true"` ×1. Водночас `data-kulbit-section` та інші атрибути на нативних тегах виводяться без значення. Скрипти перевіряють лише наявність атрибута, тож функціонально нічого не ламається, але вивід неоднорідний, а `="true"` виглядає як значення, якого в контракті немає.

**Рекомендація.** Передавати такі атрибути з порожнім рядком. Astro addAttribute для `value === ""` виводить голий атрибут (node_modules/astro/dist/runtime/server/render/util.js:82-83), тобто так само, як на нативних тегах.

**Статус.** ✅ виправлено. Булеві data-атрибути передаються як "" — у HTML без ="true".

#### HV-08 · ⚪ low · ✅ виправлено

**Id попапа гучності будується з Math.random(), тож HTML недетермінований між збірками**

`src/components/ui/ProjectVideo.astro:35-36` · стандарт: markup.md → Attributes hygiene (стабільні унікальні id)

**Проблема.** Кожна збірка дає нові id (`volume-zetpcnx0`, `volume-ushu3r6e`) і відповідні `aria-controls`, тож HTML змінюється навіть без змін коду. Це заважає порівнювати збірки (diff dist, кеш на CDN) і відтворювати баги за id.

**Рекомендація.** Будувати id зі стабільного пропа, який передає викликач (у Projects.astro вже є масив videos). Виклик у src/dev/components.astro:183 теж має отримати свій `name`.

**Статус.** ✅ виправлено. ProjectVideo приймає обов’язковий id (Projects передає свої, /dev/components — свій); Math.random прибрано — збірка детермінована.

#### HV-09 · ⚪ low · ✅ виправлено

**Один <dl> з повторюваними <dt> для двох різних груп порівняння**

`src/components/sections/TraditionalProduction.astro:148-189` · стандарт: HTML Living Standard — dl element (name-value groups); W3C Nu warning «Duplicate dt name in dl»; markup.md → Lists

**Проблема.** Червона група (Traditional) і група KULBIT мають ті самі терміни («Timeline:», «Cost Structure:», «Flexibility:», «Scalability:») і лежать в одному `<dl>`. Nu-валідатор попереджає про дублікати `dt`. Семантично це один список «термін → значення», де кожен термін має два різні значення. Без JS усі 12 карток стоять у потоці, і скринрідер не розрізняє, до якої групи належить значення.

**Рекомендація.** Розбити на три `<dl>`: червона група, KULBIT і advantages. Скрипт шукає `[data-traditional-card]` у межах root у порядку документа (рядок 602), а CSS карток не залежить від батька, тож обидва не зміняться. Коментар у шапці компонента (рядок 16, «one <dl>») оновити.

**Статус.** ✅ виправлено. Візуальна таблиця — div-и (aria-hidden), семантичні групи — у sr-only копії з двома dl: дублікатів dt більше немає.

#### HV-10 · ⚪ low · ✅ виправлено

**Документаційний HTML-коментар шаблону потрапляє в <head> кожної сторінки**

`src/layouts/BaseLayout.astro:151-155` · стандарт: Гігієна виводу; W3C Nu info «The document is not mappable to XML 1.0 due to two consecutive hyphens in a comment»

**Проблема.** Це розробницький коментар, а не штамп Published. Через HTML-синтаксис він іде в продакшн-HTML кожної сторінки. Nu-валідатор повідомляє, що документ не мапиться на XML 1.0 через `--` усередині коментаря. Коментар ще й містить рядок `<html>`, тож простий grep по виводу бачить два `<html>`.

**Рекомендація.** Замінити на JSX-коментар шаблону, як уже зроблено на рядку 149: він не потрапляє у вивід. Штамп `<!-- Published … -->` лишити як є, він навмисний.

**Статус.** ✅ виправлено. Документаційний коментар шаблону в <head> став JSX-коментарем — у вихідний HTML не потрапляє; штамп Published лишився.

#### HV-11 · ⚪ low · ✅ виправлено

**tsconfig: baseUrl застарілий у TypeScript 6, і звичайний tsc падає з TS5101**

`tsconfig.json:5-9` · стандарт: TypeScript 6 deprecation (https://aka.ms/ts6)

**Проблема.** `tsc --noEmit -p tsconfig.json` (TypeScript 6.0.3) завершується помилкою «TS5101: Option 'baseUrl' is deprecated and will stop functioning in TypeScript 7.0». `pnpm check` цього не показує, бо запускає `astro check` і `tsc -p worker`. Але будь-який зовнішній tsc, IDE чи майбутній апгрейд на TS 7 натрапить на помилку. `paths` працює без `baseUrl`.

**Рекомендація.** Прибрати `baseUrl` і зробити шлях у `paths` відносним до tsconfig. Alias-плагін Astro без baseUrl бере базою '.' (node_modules/astro/dist/vite-plugin-config-alias/index.js: `baseUrl ?? (paths ? "." : void 0)`), тож `@/` у збірці не зламається. Зникне лише alias голих специфікаторів від кореня, а в коді таких імпортів немає. Після зміни запустити `pnpm check` і `pnpm build`.

**Статус.** ✅ виправлено. tsconfig.json без baseUrl, paths відносні (./src/*); pnpm check і build проходять.

#### HV-12 · ⚪ low · ✅ виправлено

**Мертві гілки й оманлива назва константи в скрипті TraditionalProduction**

`src/components/sections/TraditionalProduction.astro:604, 618, 699-702, 969-973` · стандарт: Гігієна коду (dead code)

**Проблема.** Кожен бар червоної та KULBIT-груп рендериться з `data-kulbit-progress` (масив `progress`, рядки 36-39), тож фолбек DEMO_PCT ніколи не спрацьовує. `plain.progFills` завжди містить null (рядок 691), тож гілка заповнення барів третьої групи в showEnd мертва. Константа `WHITE10` читає `--theme-text` (повний колір тексту), а назва тягнеться з Webflow-змінної і вводить в оману. Та сама назва є в WorkingProcess.astro:673.

**Рекомендація.** Прибрати DEMO_PCT і мертву гілку, а константу перейменувати на `TEXT` в обох секціях.

**Статус.** ✅ виправлено. DEMO_PCT і мертву гілку showEnd прибрано; константи названо за роллю (TEXT, BORDER, BRAND, ILLUSTRATION).

#### HV-13 · ⚪ low · ✅ виправлено

**Атрибут data-kulbit-project-end ніхто не читає**

`src/components/sections/Projects.astro:44` · стандарт: astro-components.md → Classes, behaviour and state (data-* = те, що читає скрипт)

**Проблема.** Це залишок Webflow-розмітки. Скрипт Projects бере картки через `:scope > :not(script, template)`, і жоден JS/CSS-файл не звертається до `data-kulbit-project-end`. Атрибут обіцяє контракт, якого немає.

**Рекомендація.** Прибрати атрибут. Якщо «more soon» колись знадобиться як ціль, додати атрибут разом з кодом, який його читає.

**Статус.** ✅ виправлено. data-kulbit-project-end прибрано.

#### HV-14 · ⚪ low · 🟢 виправлено частково

**У dist 154 конфліктні копії iCloud («… 2.js», «… 3.avif»), вони є й у .git: проєкт лежить на синхронізованому Desktop**

`dist/_astro:n/a (тільки вивід і робоче середовище)` · стандарт: Гігієна робочого середовища

**Проблема.** ~/Desktop синхронізується з iCloud: `~/Library/Mobile Documents/com~apple~CloudDocs/Desktop` існує. Коли збірка перезаписує файли, iCloud створює копії «name 2/3.ext» з правами -rw-------: 154 з 402 файлів у dist/_astro. CI (GitHub Actions) збирає начисто, тож продакшн це не зачіпає. Але `pnpm preview`, `pnpm shot`, локальні аудити й будь-який локальний деплой працюють з копіями. Та сама механіка вже зачепила репозиторій: у .git лежать `index 3` і `index 4`. Синхронізація .git через iCloud — відомий ризик пошкодити репозиторій, а сьогодні вночі заплановано push у stage і merge у main.

**Рекомендація.** Перенести робочу копію поза iCloud-синхронізований Desktop (наприклад, у ~/Projects) і видалити конфліктні копії з .git. Якщо переносити не можна, виключити хоча б dist із синхронізації через суфікс .nosync і доповнити .gitignore, бо шаблон `dist/` не збігається із симлінком. Перед локальними перевірками видаляти dist.

До:
```
dist/_astro/responsive.DjlpuyIf 2.js
dist/_astro/video.CEwvh-Sv 2.js
dist/_astro/radar-bg.F-3DMdfa_ZdtAY6 3.svg
.git/index 3
.git/index 4
```
Після (приклад):
```
mv ~/Desktop/awwwards/kulbit-awwwards ~/Projects/kulbit-awwwards   # outside iCloud Drive
rm ".git/index 3" ".git/index 4"
# or keep it and exclude the build output from sync:
rm -rf dist && mkdir dist.nosync && ln -s dist.nosync dist
printf 'dist\ndist.nosync/\n' >> .gitignore
```

**Статус.** 🟢 виправлено частково. Копії «… 2/3/4» видалено з робочої копії, dist і .git (index 3/4) перед кожною збіркою й комітом. Корінь проблеми — проєкт у синхронізованій iCloud-папці Desktop: рекомендую перенести його, напр., у ~/Projects (CI збирає начисто, продакшен не зачеплено).

#### HV-15 · ⚪ low · ✅ виправлено

**src/dev/inventory.md — незаповнений шаблон, тож /systemize не має бази; шаблонна типографіка й button-токени ніде не використовуються**

`src/dev/inventory.md:11-34` · стандарт: styles.md → Phases; /systemize (крок 1 читає inventory.md)

**Проблема.** /systemize читає з inventory.md фазу, кадри, базові токени, шрифти й Figma-імена. Таблиці порожні, хоча база фактично існує: `--reference` 1920/744/390 у tokens.css:25/292/314, шрифти Decima Mono X 400/700 і PP Monument Wide 400/800 в astro.config.mjs, основні кольори в компонентах. Водночас шаблонні токени `--font-h1…--font-caption` (tokens.css:141-151), утиліти `.text-size-h1…caption` (utilities.css:354-404) і `--theme-button-primary-*` не використовуються ніде. `body` бере `--font-default` = body-md (18 px) із шаблону.

**Рекомендація.** Перед /systemize заповнити inventory.md фактичною базою: кадри, шрифти, 2–4 основні кольори, Figma/Webflow-імена стилів з коментарів компонентів. Шаблонні text-size- і button-токени позначити як «to remove/replace», щоб злиття їх не зачепило.

**Статус.** ✅ виправлено. src/dev/inventory.md: Phase: systemized, кадри, шрифти, кольори Webflow → токени, текстові стилі, відступи, one-offs, видалене, ui-компоненти.

#### HV-16 · ⚪ low · ➖ свідомо залишено

**Шаблонні motion/Lenis і hiding header не використовуються (сторінка на steps), але збираються й лежать у залежностях**

`src/layouts/BaseLayout.astro:210-223` · стандарт: astro-components.md → Client-side JavaScript (скрипт лише там, де потрібен); гігієна залежностей

**Проблема.** Єдина сторінка використовує `steps`, який за контрактом замінює `motion` (`loadMotion = motion && !steps`, рядок 86). Проте Astro збирає обидва умовні скрипти: у dist лежать BaseLayout.astro_astro_type_script_index_1_lang.DmKG5BpK.js (20 KB, Lenis) та index_2 (29 B), на які HTML не посилається. `lenis` лишається в dependencies (package.json:29), а `src/scripts/motion.ts`, `header.ts` і блок reveal/hiding header в utilities.css (рядки 36, 608+) для цього проєкту — мертвий код. Сюди ж шаблонні залишки: `"name": "astro-template"` (package.json:2) і `.gitkeep` у вже непорожніх папках (src/assets, components/ui, components/sections, assets/icons, assets/fonts).

**Рекомендація.** Для Kulbit (лише step scroll) прибрати гілки `motion`/`hidingHeader` з BaseLayout, файли `src/scripts/motion.ts` і `header.ts`, відповідні CSS-блоки й залежність `lenis`. Пакет перейменувати на `kulbit`, зайві `.gitkeep` видалити, опис у CLAUDE.md оновити в тому ж коміті. Якщо шаблонну сумісність вирішено зберегти, записати це рішення в CLAUDE.local.md.

До:
```
{
      loadMotion && (
        <script>
          import '@/scripts/motion';
        </script>
      )
    }
    {
      hidingHeader && !loadMotion && (
        <script>
          import '@/scripts/header';
        </script>
      )
    }
```
Після (приклад):
```
// package.json
"name": "kulbit",
"dependencies": { "astro": "^7.3.2", "gsap": "^3.15.0" }
// BaseLayout.astro — only the steps branch stays
{steps && (<script>import '@/scripts/kulbit';</script>)}
```

**Статус.** ➖ свідомо залишено. Модулі шаблону motion.ts / header.ts і їхній CSS лишаються (це частина шаблону, на сторінку не підключаються, JS у бандл не йде). Виправлено реальний витік — CSS Lenis, що вбудовувався в сторінку (CSS-07); пакет перейменовано на kulbit.

#### HV-17 · ⚪ low · ✅ виправлено

**Застарілі описи: брейкпоінти tablet-hero у правилах і hero.ts, «eight screens» у SectionNav, TODO біля заповненого name**

`.claude/rules/astro-components.md:183 (також src/scripts/kulbit/hero.ts:2, src/components/sections/SectionNav.astro:4, src/data/site.ts:16)` · стандарт: core.md §5 (документування змін .claude/); гігієна коментарів

**Проблема.** Код (responsive.ts:35) будує tablet-hero на 480–991, а правило, яке читає кожна сесія, і шапка hero.ts:2 («Tablet (768–991)») описують стару поведінку Webflow, де на 480–767 нічого немає. Наступна правка за правилом може «виправити» робочий код. SectionNav.astro:4 пише «lists the eight screens», а пунктів 9 (en.ts:279-289, включно з Footer). site.ts:16 має «TODO» біля вже заданого `name: 'Kulbit'`.

**Рекомендація.** Оновити текст правила і шапку hero.ts до 480–991. За core.md §5 зміна в .claude/ потребує рядка в журналі змін .claude/README.md (українською). Виправити «eight» на «nine» і прибрати TODO з site.ts:16.

**Статус.** ✅ виправлено. Правило Step scroll і hero.ts: планшетний hero 480–991; data-target-step прибрано; SectionNav — «nine screens»; TODO біля name у site.ts прибрано.

### F. CSS і правила класів проєкту

Я перевірив усі 14 компонентів, global/tokens/reset/base/utilities.css і зібраний dist/_astro/index.C6gT5wgQ.css. Скриптами Playwright пройшов 765 стильових правил і всі класи в DOM, дивився computed-стилі на 1540/900/768/600/390 і проходив сторінку Tab-ом. Структурно класи в порядку: кожен клас у розмітці має робочий селектор, ніде немає більше 3 власних класів на елементі, `.container` скрізь без інших класів і стилів, visibility-утиліти не конфліктують зі scoped display, типографіка задається тільки через text-size-*/text-weight-*, синтезованих ваг шрифту немає. Реальні дефекти такі. (1) Tab веде фокус у складені секції, які зараз поза екраном, а `overflow: clip` обгортки ховає ці контроли повністю — high. (2) Scoped `outline` на вкладці SectionNav перебиває глобальне кільце фокусу — medium. (3) Та сама довільна назва класу має різні визначення в різних компонентах (text-size-16, text-size-16/16/13, text-size-16/16/14) — medium, це прямий ризик для /systemize. (4) SectionNav не має мобільного правила для text-size-16/16/13 — medium. (5) Лінію прогресу секції реалізовано 5 разів замість одного ui-компонента — medium. Решта — low: мертвий CSS (hover логотипа не працює, бо svgo перетворює rect на path; стилі Lenis вбудовано на сторінку без Lenis; невикористаний .theme--dark; залишки шаблону ≈14 KB raw / 2.3 KB gzip з 12.4 KB gzip), transition не на motion-токенах, зайві element-класи, space-between без мінімального gap, z-index без ізоляції плюс прозора смуга хедера, яка перехоплює кліки, та списки дублікатів і округлень як вхід для /systemize.

#### CSS-01 · 🟠 high · ✅ виправлено

**Tab переводить фокус у секції поза екраном — `overflow: clip` обгортки ховає сфокусований контрол**

`src/styles/utilities.css:592-597` · стандарт: WCAG 2.2 SC 2.4.7 Focus Visible, SC 2.4.11 Focus Not Obscured (Minimum); markup.md → Keyboard

**Проблема.** Секції складені в стек, а обгортка обрізає все поза в'юпортом через `overflow: clip` (clip обрано свідомо, щоб фокус не прокручував). Рушій (src/scripts/kulbit/*.ts) не реагує на focusin: єдиний обробник focusin є в button-border.ts. Тому Tab із hero переводить фокус на кнопки секцій, яких на екрані немає: два Play video у Projects (секція 2), Start Your Pilot (секції 4 і 6), Showreel і Let’s discuss у футері (секція 8). Користувач клавіатури не бачить, де фокус, а Enter запускає невидимий контрол.

**Рекомендація.** Коли фокус потрапляє в неактивну [data-kulbit-section], рушій має показати цю секцію. Додати в sections.ts обробник focusin, який викликає goToSection (sections.ts:219), і підключити його в index.ts після registerSections() (:55). Для секцій із внутрішніми кроками (Projects, Traditional) перевірити, що сфокусований елемент видно на кроці 0; якщо ні, перейти на потрібний крок через goToSectionStep. `inert` на неактивних секціях — гірший варіант: до них тоді не дістатися з клавіатури взагалі.

**Статус.** ✅ виправлено. Див. A11Y-01.

#### CSS-02 · 🟡 medium · ✅ виправлено

**Scoped `outline` на `.section-nav_tab` прибирає глобальне кільце :focus-visible**

`src/components/sections/SectionNav.astro:73-92` · стандарт: WCAG 2.2 SC 2.4.7 Focus Visible; astro-components.md → Interactive states («The global :focus-visible outline in base.css stays»); markup.md → «Never remove the focus outline»

**Проблема.** Рамку вкладки намальовано через `outline`. Scoped-стиль не в шарі, тому перемагає `:focus-visible { outline: 2px solid var(--theme-text) }` з base.css (шар base). При фокусі з клавіатури лишається рамка #171717 на чорному, а змінюється лише колір трикутника 12 px. Правило «The global :focus-visible outline in base.css stays» порушено. Кнопки type--outline, showreel, second і second-footer роблять той самий прийом, але всі вони мають data-kulbit-border, і з JS button-border.ts малює на focusin синю рамку. Без JS кільця фокусу в них немає.

**Рекомендація.** Для вкладки в стані :focus-visible перефарбувати ту саму внутрішню рамку в колір тексту: кільце видно, розмір не змінюється. Для Button додати таке саме правило для type--outline/showreel/second/second-footer як запасний варіант без JS. З JS синій штрих SVG ляже поверх нього.

**Статус.** ✅ виправлено. SectionNav: на :focus-visible рамка вкладки стає кольором тексту — видиме кільце фокуса.

#### CSS-05 · 🟡 medium · ✅ виправлено

**Лінію прогресу секції (.section-progresbar) реалізовано 5 разів замість одного ui-компонента**

`src/components/sections/OurClients.astro:83, 192-206` · стандарт: astro-components.md → Shared ui components («Any element pattern you meet for the second time … is a ui component … in both phases»); styles.md → Phases («repeated elements still become ui/ components on their second use»)

**Проблема.** Той самий елемент (трек 2 px із прозорістю 15 % і заливка, яку веде скрипт) скопійовано з однаковими значеннями в п'ять місць: OurClients:83 + 193-206, Projects:36 + 107-120 (+ 180-182 на планшеті), OurServices:49 + 198-211, TraditionalProduction:55-57 + 258-271 та IntroScreen:31 + 88-92 (повна лінія без заливки). Правило «Reuse first» діє в обох фазах: елемент, що повторюється, стає ui-компонентом уже при другому використанні. /systemize зливає значення, а не компоненти, тож сам цього не виправить.

**Рекомендація.** Створити src/components/ui/ProgressLine.astro з варіантами full / empty / third / sixth і хуком data-progress-fill. Скрипти секцій шукатимуть `[data-progress-fill]` у своєму корені замість data-clients-fill, data-projects-fill тощо. Для Projects на планшеті (`.projects_fill { width: 100% }` при ≤991) потрібен ще один модифікатор або ширина в prepare. У TraditionalProduction клас `_fill` спільний із заливкою карткових барів (:169-170), тому бари лишаються на своєму element-класі. Додати компонент на /dev/components.

**Статус.** ✅ виправлено. ui/ProgressLine.astro (start: 0 | third | sixth | full, --progress-start для своїх значень) + src/scripts/kulbit/progress-line.ts; п’ять ручних ліній замінено; компонент на /dev/components.

#### CSS-03 · ⚪ low · ✅ виправлено

**Одна довільна назва класу — різні визначення в різних компонентах (text-size-16, text-size-16/16/13, text-size-16/16/14)**

`src/components/sections/WorkingProcess.astro:229-234, 261-271, 551-555` · стандарт: class-naming.md → Reuse first / «a value used in 2+ places is one token + one class»; styles.md → Phases (systemized)

**Проблема.** Scoped-класи не заважають один одному в браузері, але однакова назва означає різні стилі. /systemize групує за значеннями, а розробник — за назвою, тож механічне злиття непомітно змінить line-height. Конфлікти (вхід для /systemize):
• text-size-16 — Hero:131-134, OurClients:187-190, WorkingProcess:268-271 = 16/1.37 (Webflow .text-size-hero); SiteFooter:172-176 = 16/1.1/0.03em (.text-size-footer).
• text-size-16/16/13 — OurClients:174-178, Projects:93-97, OurServices:164-168, IntroScreen:74-78, SiteFooter:159-163, SectionNav:67-71 = 16/1.1/0.03em → 13; TraditionalProduction:236-240 = 16/1.3/0.03em → 13; WorkingProcess:262-266 + 551-555 = 16/1.3/0.03em → 13/1/0.01em.
• text-size-16/16/14 — WorkingProcess:230-234 = 16/1.3/0.03em → 14; TraditionalProduction:231-234 = 16/1.3 без трекінгу → 14.

**Рекомендація.** У таблиці /systemize зробити з них окремі текстові стилі з назвами Webflow із коментарів, а не зливати за назвою класу: section-label (16/1.1/0.03em → 13), card-label (16/1.3/0.03em → 13), category (16/1.3/0.03em → 13/1/0.01em), hero (16/1.37), footer (16/1.1/0.03em), production-head (16/1.3 → 14), process-label (16/1.3/0.03em → 14). Якщо до /systemize ще будуть правки, не вводити нових однойменних класів із різними значеннями.

**Статус.** ✅ виправлено. Див. HV-04: однойменних класів з різними значеннями більше немає.

#### CSS-04 · ⚪ low · ✅ виправлено

**SectionNav: text-size-16/16/13 без мобільного правила — на телефоні 16 px замість 13**

`src/components/sections/SectionNav.astro:66-71, 136-147` · стандарт: class-naming.md → «Three values = one per breakpoint»

**Проблема.** Назва класу і коментар обіцяють 13 px на мобільному, але в блоці @media (max-width: 479px) правила для цього класу немає. Пункти меню на 390 мають 16 px, а лейбли секцій з тією самою назвою класу — 12.96 px. Через це три пункти в панелі шириною 260 переносяться на два рядки.

**Рекомендація.** Додати мобільне значення в наявний блок 479px, як в інших секціях.

**Статус.** ✅ виправлено. Пункти меню на ≤479 — 12.96 px (text-size-section-label), як у лейблів секцій.

#### CSS-06 · ⚪ low · ✅ виправлено

**Мертвий :global-селектор логотипа: svgo перетворює <rect> на <path>, тож hover квадрата не спрацьовує**

`src/components/ui/Logo.astro:46-52` · стандарт: class-naming.md → Every class must have CSS («each selector in <style> must match»); astro-components.md → Interactive states

**Проблема.** У src/assets/icons/logo.svg квадрат — це `<rect … fill="var(--theme-icon-secondary)"/>`, але в збірці (experimental.svgOptimizer, preset-default) він стає `<path fill="var(--theme-icon-secondary)" d="M143.598 0H150v6.402h-6.402z"/>`. Три правила ні з чим не збігаються. Задокументована поведінка («the square turns red on hover / focus») не працює. Зараз логотип скрізь aria-current без href, тож наслідків немає, але вони з'являться разом із першою іншою сторінкою (наприклад, 404).

**Рекомендація.** Не прив'язуватися до тегу. Змінна CSS у presentation-атрибуті переживає svgo, а transition на fill спрацює від зміни успадкованої змінної.

**Статус.** ✅ виправлено. Logo: ховер через змінну --theme-icon-secondary (svgo перетворює rect на path, але fill=var() лишається) — квадрат червоніє на справжньому посиланні (404).

#### CSS-07 · ⚪ low · ✅ виправлено

**CSS Lenis вбудовується в сторінку, хоча motion.ts не завантажується (сторінка працює на steps)**

`src/scripts/motion.ts:27-28` · стандарт: markup.md → Performance and delivery

**Проблема.** BaseLayout підключає motion.ts умовним <script> лише при motion && !steps (loadMotion, :86). JS на сторінку не потрапляє, але CSS, імпортований у модулі, Astro все одно вставляє в HTML як третій inline <style> на 457 байт. Усі його селектори (.lenis …) мертві.

**Рекомендація.** Підключати стилі Lenis там, де Lenis запускається: імпорт `?inline` і вставка <style> під час виконання motion.ts.

**Статус.** ✅ виправлено. motion.ts імпортує CSS Lenis як рядок (?inline) і додає його лише коли модуль працює: на сторінці Kulbit його більше немає.

#### CSS-08 · ⚪ low · ✅ виправлено

**.theme--dark: на сайті не використовується, розбитий на два правила, значення не з дизайну Kulbit**

`src/styles/utilities.css:116-132` · стандарт: styles.md → Tokens (Dark sections); class-naming.md → Every class must have CSS / reuse

**Проблема.** У розмітці сайту класу немає: сайт увесь темний, --theme-page-bg чорний. Один селектор без причини розбито на два правила (залишок `.theme--dark, .footer` після того, як футер прибрали зі списку). Значення взято з шаблону: бренд-червоний на «темній» секції стає сірим #ccc, що суперечить дизайну Kulbit. Клас використовують лише dev-сторінки (src/dev/components.astro:95-103, UtilitySample.astro:56/86). Через нього на /dev/components кнопка `arrow` у сцені theme--dark показує сірий колір замість червоного, тобто шоукейс спотворює компонент.

**Рекомендація.** Під час /systemize: або прибрати .theme--dark разом зі сценами theme--dark у src/dev/components.astro (сайт і так темний), або об'єднати в одне правило й перевизначати лише змінні, які справді відрізняються в дизайні (зараз таких немає, тобто лишити тільки фон і колір).

**Статус.** ✅ виправлено. theme--dark прибрано (сайт увесь темний), dev-сторінки показують компоненти на фоні сторінки.

#### CSS-09 · ⚪ low · ✅ виправлено

**Залишки шаблону в utilities.css, які цей проєкт не використовує (≈14 KB мертвого CSS до мініфікації)**

`src/styles/utilities.css:17-18, 36-54, 79-85, 134-162, 233-260, 351-446, 488-567, 608-685` · стандарт: styles.md → Phases («the template's semantic utilities with placeholder values … are not used»), Fonts («Only weights … that have a file may be used»); class-naming.md → Reuse first («two or more places»)

**Проблема.** На сторінці з `steps` не діють: стани хедера, що ховається, і стан інтро (header.ts і motion.ts не завантажуються); блокування скролу для dialog і [data-menu-toggle] (діалогів немає, SectionNav використовує data-section-nav-toggle); увесь блок reveal під [data-motion] (≈80 рядків); padding-sm/md/lg/top/bottom, spacing-tiny…4xl і text-size-h1…placeholder із плейсхолдерними значеннями, які фаза development прямо забороняє використовувати; icon-*, u-svg, u-path, fill-cover, border-*. Окремо: text-weight-300/500/600/900 посилаються на ваги без файлів (є лише Decima 400/700 і Monument 400/800), тож їх використання дало б синтезований шрифт. Коментар у рядках 17-18 («3+ places») суперечить class-naming.md («2+ places»).

**Рекомендація.** Передати цей список у /systemize. Прибрати text-weight без файлів шрифту (лишити 400/700/800), блоки motion/reveal/dialog/menu для steps-проєкту та placeholder-типографіку й spacing. Виправити коментар про поріг на «2+». Структурні утиліти словника (flex-*, grid-*, col-*, align-*, justify-*, visibility, width-100 тощо) не чіпати, навіть якщо зараз вони не використовуються: це словник шаблону, і /dev/tokens та rules на нього спираються.

**Статус.** ✅ виправлено. Прибрано плейсхолдерні text-size-*, spacing-tiny/4xl, padding-sm/lg, icon-*, u-svg/u-path, fill-cover, border-* утиліти, ваги без файлів шрифтів; коментар про поріг — «2+». Структурний словник (flex/grid/col/align/visibility) лишився.

#### CSS-10 · ⚪ low · ✅ виправлено

**tokens.css містить невикористані токени шаблону й застарілий коментар, а inventory.md не описує реальну базу**

`src/styles/tokens.css:11-12, 138-212, 223-243, 253-257, 269-286` · стандарт: styles.md → Phases (база з /sync-tokens), Tokens

**Проблема.** Ніде не використовуються: --button-padding-*, --icon-height-tiny/2xl/3xl, --line-height-tiny/xs/sm/lg/xl, --letter-spacing-wide/tight-*, --t-col-*, --m-col-*, --radius-full, --size-22, --swatch-orange / deep-moss-green / transparent, --theme-button-primary-*, --theme-input-*, --theme-illustration, --theme-section-bg-light/brand, --theme-card-bg-alw-white/brand, --theme-text-alw-brand. Останній дорівнює #62b0ff, а компоненти пишуть #62b0ff напряму 17 разів. Текстові токени --font-h1…placeholder — плейсхолдери, і на них тримається лише body (--font-default → --font-body-md), тобто skip-link: 14.44 px на 1540. Сам skip-link бере ще й плейсхолдерні --spacing-xs/sm і --radius-sm. Коментар у рядках 11-12 застарів: --reference 1920/744/390, шрифти й свотчі вже з Kulbit. Водночас src/dev/inventory.md пише «Base not synced yet», а таблиці Frames / Base tokens / Fonts порожні, тож /systemize не отримає ні бази, ні назв.

**Рекомендація.** Перед /systemize заповнити inventory.md фактичною базою: кадри 1920 / 744 / 390, --max: none, container padding 85/32/16; шрифти Decima Mono X 400/700 і PP Monument Wide 400/800; свотчі black / white #fdfcfc / blue #62b0ff / red #ff4444; назви стилів — із Webflow-коментарів компонентів. Під час /systemize видалити невикористані токени, прив'язати --font-default до реального основного стилю (Decima 16/1.1) і оновити коментар у рядках 11-12.

**Статус.** ✅ виправлено. tokens.css переписано з реальної бази Kulbit (кадри 1920/744/390, кольори Webflow, текстові стилі, відступи); невикористані токени шаблону прибрано; inventory.md заповнено.

#### CSS-11 · ⚪ low · ✅ виправлено

**Transition поза motion-токенами (Square, картки OurClients)**

`src/components/ui/Square.astro:30` · стандарт: styles.md → Motion; astro-components.md → Interactive states («Transitions only from motion tokens»)

**Проблема.** Square.astro:30 використовує `0.3s ease`, OurClients.astro:290 — `opacity 0.6s ease`, OurClients.astro:296 — `opacity 0.3s ease`. Ці значення взято з custom code Webflow (так і зазначено в коментарі Square), але правило проєкту — «Every transition/animation uses exactly these four». /systemize не повинен мапити їх мовчки: це або токени, або задокументований виняток.

**Рекомендація.** Для Square перейти на токени (різниця між ease і ease-out cubic на повороті на 90° ледь помітна). Для crossfade логотипів 0.6s/0.3s або взяти --transition-duration-slow / --transition-duration, або затвердити в /systemize окремий токен (наприклад --transition-duration-medium: 0.6s) з коментарем «Webflow custom code» і записати виняток в inventory.md.

**Статус.** ✅ виправлено. Токени руху = значення Webflow (0.3s ease, повільний 0.6s): Square і перехресне зникнення логотипів OurClients тепер на токенах.

#### CSS-12 · ⚪ low · ✅ виправлено

**Element-класи, що дають лише те, що вже є в утиліті (site-header_row, projects_head)**

`src/components/sections/SiteHeader.astro:15, 22-24` · стандарт: class-naming.md → Blocks and elements in Astro components

**Проблема.** Клас елемента існує лише заради `align-items: center`, а це вже дає утиліта align-center, і для третього класу є місце. Те саме в Projects.astro:38 + 125-127: `.projects_head { align-items: flex-start }` — це утиліта align-start. Порушено правило «An element class is added ONLY when that element needs a unique scoped style that utilities cannot give».

**Рекомендація.** Замінити element-клас на утиліту і прибрати scoped-правило.

**Статус.** ✅ виправлено. site-header_row → align-center (SiteHeader без власного <style>), projects_head → align-start.

#### CSS-13 · ⚪ low · ✅ виправлено

**space-between без мінімального gap (spacing-0/… і scoped justify-content)**

`src/components/sections/TraditionalProduction.astro:60, 209-212` · стандарт: class-naming.md → «justify-space-between / justify-space-around always come with a spacing-*»

**Проблема.** Правило вимагає, щоб justify-space-between завжди йшов разом із мінімальним spacing (0 допустимий лише там, де ряд складається). Тут навпаки: на desktop, де діє space-between, gap = 0. Те саме з `spacing-0/64/24` у шапках OurClients:85 + 166-168 (+ .our-clients_head :209-213), OurServices:50 + 145-147 (+ :214-218), IntroScreen:32 + 66-68 (+ :94-98), а також зі scoped space-between без gap на desktop: Hero.astro:89-93 (.hero_content), TraditionalProduction.astro:342-350 (_head) і 369-377 (_card), OurServices.astro:238-247 (_card) і 293-298 (_description), SiteFooter.astro:263-267 (_contacts). Зараз фіксовані ширини не дають елементам торкнутися, але довший текст склеїть колонки.

**Рекомендація.** Додати мінімальний gap, який не змінює поточну розкладку (space-between усе одно розсуває далі). У /systemize зробити його спільним токеном.

**Статус.** ✅ виправлено. Рядки з space-between отримали мінімальний gap (spacing-head 48 у шапках секцій, spacing-xs/md/xl де вільного місця достатньо) — розкладка не змінилась (перевірено попіксельно). Виняток: картка Our Services (колонка контенту з flex: 1 займає весь вільний простір — gap зменшив би її).

#### CSS-14 · ⚪ low · ✅ виправлено

**Прозора смуга хедера перехоплює вказівник над верхом кожної секції; z-index плеєра без ізоляції**

`src/styles/utilities.css:27-35, 55-59` · стандарт: astro-components.md → Interactive states (hover працює); styles.md → Page structure

**Проблема.** `.header-fixed` (z-index 10) разом із `.header` лишає прозорий блок на всю ширину заввишки 90 px на 1540 (80 px на 390). Після hero контейнер хедера відлітає (-600 %), але блок і далі перехоплює hover, кліки й виділення тексту над верхом секцій 1–8. Конкретний наслідок: синій квадрат легенди Kulbit у WorkingProcess (секція 5, y≈34) не повертається при наведенні, бо під курсором `HEADER.header`, а червоний квадрат нижче повертається. На 390 під смугою лежать заголовки секцій 1–3, і їх не можна виділити. Друга, гігієнічна частина: у ProjectVideo z-index 75/100/25/50 (рядки 137, 148, 165, 234, 242) — це значення Webflow, а корінь плеєра не створює stacking context. Вийти за межі секції вони не можуть, бо .container уже має position: relative + z-index: 1.

**Рекомендація.** Смузі хедера вимкнути pointer-events і повернути їх інтерактивним дітям. У /systemize нормалізувати шкалу z-index плеєра до 1–4 і додати `isolation: isolate` на .project-video.

**Статус.** ✅ виправлено. Прозора смуга хедера пропускає вказівник (pointer-events: none), посилання/кнопки/меню/діалог — auto: квадрат легенди WorkingProcess під смугою знову обертається на ховер.

#### CSS-15 · ⚪ low · ✅ виправлено

**Вхід для /systemize: сирі значення, що дорівнюють наявним примітивам або базовим кольорам, і округлення Webflow**

`src/components/ui/Square.astro:27-42` · стандарт: styles.md → Phases (development: «var(--size-N) when the primitive exists»; базові кольори — токени); class-naming.md → Reuse first

**Проблема.** Правило фази development: розміри через var(--size-N), якщо примітив існує, а базові кольори — токенами. Порушення:
• розміри, що точно дорівнюють примітиву, але записані через calc (19 випадків): Hero.astro:231, 265, 310, 319, 331 (×3), 344, 347, 350; OurClients.astro:266, 435; SiteFooter.astro:351; TraditionalProduction.astro:432, 466 (×2); ProjectVideo.astro:182, 290, 291;
• двознакові округлення Webflow (22 випадки): 1.13rem = 18.08 (Button:72, OurServices:186, SiteFooter:167, Traditional:244, WorkingProcess:486), 0.88rem = 14.08, 0.81rem = 12.96, 1.44rem = 23.04, 1.88rem = 30.08 (Square:27, SiteFooter:363), 0.63rem = 10.08 і 0.38rem = 6.08 (ProjectVideo ×11);
• радіус 9 записано двома способами: calc(0.56rem …) = 8.96 — 13 разів, calc(0.5625rem …) = 9 — 4 рази (Button, SectionNav);
• бренд-червоний: є токен --theme-text-brand, але сирий #ff4444 стоїть у Square:42, WorkingProcess:298, TraditionalProduction:308 і :355, а також у скрипті TraditionalProduction:617 (collect.mjs скрипти не читає);
• #62b0ff — 17 разів при --swatch-blue (button-border.ts уже читає --swatch-blue); #404040 — 9 разів у 8 element-класах.

**Рекомендація.** У таблиці /systemize: прив'язати 1.13→--size-18, 0.88→14, 0.81→13, 1.44→23, 1.88→30, 0.63→10, 0.38→6; один радіус 9 (--radius-sm = 0.5625rem); червоний — лише --theme-text-brand; синій — роль --theme-text-accent + утиліта text-color-accent; сірий #404040 — --theme-text-muted + text-color-muted замість 8 element-класів. Кольори в скрипті TraditionalProduction (WHITE/BLACK30/RED) читати з токенів через getComputedStyle, як уже зроблено для WHITE10.

**Статус.** ✅ виправлено. Точні рівні примітивам calc → var(--size-N); кольори — лише --theme-*; радіус 9 один (--radius-sm: 8.96 і 9 злиті, −0.04 px); округлення Webflow (1.13rem тощо) збережено навмисно, щоб сайт не зсунувся.

#### CSS-16 · ⚪ low · ✅ виправлено

**Вхід для /systemize: однакові довільні класи, скопійовані між компонентами**

`src/components/sections/OurClients.astro:155-168` · стандарт: class-naming.md → Reuse first; styles.md → Phases (systemized)

**Проблема.** Точні повтори (у фазі development дозволені, але це готові кандидати на токен + утиліту): padding-64/48/24 ×4 (OurClients, Projects, OurServices, IntroScreen), padding-bottom-64/48/24 ×2 (WorkingProcess, Traditional), spacing-48/48/24 ×4 (IntroScreen, Traditional, OurClients, OurServices), spacing-0/64/24 ×3, spacing-32 ×3 (Projects, Traditional, SiteFooter), spacing-16 ×2 (SiteHeader, Projects), text-size-32/28/23 ×4 (Webflow .text-size-section-h2). Близькі стилі Monument 18/1.3/0.03em з різним мобільним розміром — text-size-18/18/14 (OurServices), -18/18/15 (Traditional), -18/16/16 (SiteFooter) — це три різні трійки, зливати їх не можна. text-size-18/18/16 у Button (1.15, без трекінгу) — окремий стиль кнопки.

**Рекомендація.** У /systemize створити: --section-padding-md (64/48/24) → padding-md; --spacing для 48/48/24; текстовий стиль section-h2 (32/1.3/0.03em → 28 → 23); spacing-32 / spacing-16 як утиліти на --size-*. Решта одноразових класів лишається в компонентах.

**Статус.** ✅ виправлено. padding-64/48/24 → padding-md, spacing-48/48/24 → spacing-2xl, spacing-0/64/24 → spacing-head, spacing-32/16 → spacing-xl/md, text-size-32/28/23 → text-size-section-h2.

#### CSS-17 · ⚪ low · ➖ свідомо залишено

**Hero: вертикальний padding задано scoped-правилом на корені секції**

`src/components/sections/Hero.astro:78-86, 135-144` · стандарт: astro-components.md → Section format («nothing else sets vertical padding on a section»; «The first section … its vertical padding lives on the text column»)

**Проблема.** Формат секції: «nothing else sets vertical padding on a section» і «the first section … its vertical padding lives on the text column». Тут нижній відступ 64 задано на корені секції через блоковий клас, і від нього залежить calc у .hero_text:139 («9.25rem + the 4rem bottom padding»), тобто одне значення записано у двох місцях.

**Рекомендація.** Перенести відступ на колонку контенту і спростити calc. Контейнер — flex-елемент .hero, тож він створює незалежний контекст форматування, і margin .hero_content усередині нього не колапсує. `overflow: hidden` на секції поки лишити: кроки hero виносять контент на ±300 % (відео вже обрізає .hero_video). Перевірити скриншотами 1920/1540/768/390 (pnpm shot).

До:
```
.hero {
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    height: 100dvh;
    padding-bottom: var(--size-64);
    overflow: hidden;
  }
```
Після (приклад):
```
.hero {
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    height: 100dvh;
    overflow: hidden;
  }
  .hero_content {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    margin-bottom: var(--size-64);
  }
  .hero_text {
    position: absolute;
    top: calc(100% - 100dvh + 9.25rem * var(--fluid-scale));
    …
  }
```

**Статус.** ➖ свідомо залишено. Нижній відступ hero лишився на корені секції (тепер з токена --section-padding-md): корінь уже має 3 класи, а .hero_text рахує позицію від висоти hero; перенесення на колонку змінило б containing block абсолютного тексту.

#### CSS-M01 · ⚪ low · ✅ виправлено

**Висота футера захардкоджена під padding .footer з utilities.css — три копії значень у двох файлах**

`src/components/sections/SiteFooter.astro:196-199, 299-301, 344-346` · стандарт: class-naming.md → Reuse first («a value used in 2+ places … gets a token»); styles.md → Adding to the system

**Проблема.** Мінімальна висота контенту футера обчислюється як 100vh мінус padding `.footer`, але самі значення padding (80/80, 16/100, 32/64) переписано вручну з utilities.css:88-91, :721-724 і :769-772. Це прихований зв'язок між двома файлами. Якщо /systemize замінить padding футера на токен або змінить його значення, calc у SiteFooter не зміниться: футер стане вищим за екран і з'явиться прокрутка всередині, або контент не дотягнеться до низу.

**Рекомендація.** У /systemize винести padding футера в токени (--footer-padding-top / --footer-padding-bottom із медіаблоками 991/479) і використати їх і в .footer, і в calc SiteFooter. Тоді медіаправила .site-footer_layout для min-height стануть непотрібні.

**Статус.** ✅ виправлено. --footer-padding-top/-bottom у tokens.css: .footer і min-height контенту SiteFooter читають одні токени, медіа-перевизначення calc прибрано.

### G. Рушій кроків (GSAP) і скрипти

Я перевірив рушій і всі скрипти секцій у Playwright на localhost:4399. Сценарії лежать у /private/tmp/claude-501/-Users-ju1ceee-Desktop-awwwards-kulbit-awwwards/58836cec-0138-43b3-ba0e-f868479f4768/scratchpad/audit/js/, скриншоти там само. Підтверджено дванадцять проблем. Найважча з них: зміна брейкпойнта під час переходу чи стрибка до WorkingProcess (секція 5) повністю вбиває навігацію до перезавантаження. Wheel, клавіатура і меню перестають працювати, бо app.isAnimating назавжди лишається true. Досить повернути iPad, поки секція ще в'їжджає: будь-який iPad при повороті перетинає 992. Той самий корінь у tablet hero. Відкладений onComplete передачі на секцію 1 ставить currentSectionIndex=1 уже після перебудови на desktop, і Our Clients випадає з послідовності. Друга група проблем стосується клавіатури. Tab веде фокус у секції, яких не видно (2, 4, 6, 8), і на 6-му Tab Enter запускає невидиме відео зі звуком. Space або PageDown на слайдері Seek перемикають картку Projects і скидають відео, яке саме грає. Третя група: resize в межах того самого брейкпойнта. Після повороту iPad Pro Our Services показує рядок карток, зсунутий на 342 px, і знову виводить заголовок, який уже був стертий. Картки Projects на планшеті й мобільному обрізаються. Смуга tablet hero на кроці 2 зникає. Далі: prefers-reduced-motion рушій не враховує (слайди йдуть, reveal блокує жести на 3,3 с). Розмітки landscape-попапа немає, тож телефон у горизонтальній орієнтації бачить обрізані секції. Решта дрібніша: jumpUp із секції 1 на планшеті обходиться без анімації, goToSectionStep ніде не викликається і працює непослідовно, білдери після init не обгорнуті в try/catch. Бекдроп стрибка на футер (z-index поза <main>) працює правильно: main створює stacking context з z-index 0, футер лежить над ним, кадри 600/800 мс перевірено.

#### JS-03 · 🟠 high · ✅ виправлено

**Tab веде фокус у невидимі секції (2, 4, 6, 8), а Enter запускає там відео зі звуком**

`src/scripts/kulbit/sections.ts:51-55 (applyStackingPositions); також src/components/sections/Projects.astro:281-289 (setHeights)` · стандарт: WCAG 2.2 — 2.4.3 Focus Order, 2.4.7 Focus Visible, 2.4.11 Focus Not Obscured (AA); markup.md → accessibility baseline

**Проблема.** Секції під екраном (yPercent 100) і закриті картки Projects (height 0) лишаються у порядку фокусу, а рушій не реагує на рух фокусу. З hero Tab проходить Projects → Menu → Start Pilot → Video sound → «Play video» (секція 2, y=1334 при висоті вікна 870) → «Play video» (закрита картка) → «Start Your Pilot» (секції 4 і 6) → «Showreel» / «Let’s discuss» (футер), idx увесь час 0. Фокус не видно, elementFromPoint показує, що елемент перекритий. Enter на невидимому «Play video» запускає відео проєкту без mute, поки на екрані hero: звук іде нізвідки, а hideOtherVideos не викличеться до наступного переходу.

**Рекомендація.** Варіант А (як у знахідці): inert на всіх секціях, крім поточної, в одному місці, яке проходять старт, перебудова й кожна зміна секції (applyStackingPositions + persistSection), і inert на закритих картках Projects; хедер і меню SectionNav лишаються доступними. Мінус: неактивні секції зникають з дерева доступності, і користувач скрінрідера в режимі перегляду (стрілки перехоплює скрінрідер) дістанеться до них лише через меню. Варіант Б без цього мінуса: слухач focusin на main, який при фокусі в іншій секції переводить рушій на неї (whenIdle → autoAdvanceTo(index) або goToSection(index, true, 1)), як це робить fullPage.js. Закриті картки Projects у будь-якому разі робити inert.

**Статус.** ✅ виправлено. Див. A11Y-01 (+ закриті картки Projects inert: невидиме відео зі звуком більше не запустити з клавіатури).

#### JS-01 · 🟡 medium · ✅ виправлено

**Анімації, що вже летять, переживають зміну брейкпойнта: застарілі onComplete вбивають навігацію (WorkingProcess) і ламають tablet hero**

`src/scripts/kulbit/sections.ts:123-133 (teardownHero); 226 + 265-273 (goToSection); 388-409 (jumpDown); також src/scripts/kulbit/hero.ts:140-151` · стандарт: Коректність стану (state machine consistency); astro-components.md → Step scroll; core.md §4 (брейкпойнти)

**Проблема.** Твіни переходу (goToSection), стрибка з бекдропом (jumpDown/jumpUp) і tweenTo планшетного hero створюються в обробниках подій, поза контекстом gsap.matchMedia, тому при зміні брейкпойнта не ревертяться і доживають до свого onComplete вже після перебудови. (1) goToSection захоплює старий controller: через 0,7 с викликається enter() знищеного контролера WorkingProcess (`app.isAnimating = true; revealTL.play()` на вбитому таймлайні), onComplete не настає, і вся навігація (wheel, клавіші, меню) мертва до перезавантаження. jumpDown бере вже новий, скинутий restoreSection контролер, результат той самий (JS-02). (2) Відкладений onComplete передачі tablet hero ставить currentSectionIndex = 1 і persist після того, як desktop-гілка відновила секцію 0: рушій вважає поточною секцію 1, на екрані hero, два жести йдуть на невидимі кроки Our Clients, третій насуває Projects на hero. Тригер — перетин 992 px (поворот майже будь-якого iPad, крім 12,9/13") протягом 0,7–1 с після жесту або кліку в меню.

**Рекомендація.** Відстежувати кожну анімацію рушія з колбеком, створену поза matchMedia (gsap.to у goToSection/jumpDown/jumpUp, tweenTo у jumpDown/jumpUp/tabletHeroStep, delayedCall із finishStep/step у OurClients, Projects, OurServices), і вбивати їх у teardownHero: вбитий твін не викликає onComplete, а resetHeroState уже знімає isAnimating. Трекер тримати в app.ts (без циклічного імпорту з hero.ts), завершені анімації з набору прибирати, стан бекдропа скидати.

**Статус.** ✅ виправлено. track()/killTracked(): усі твіни рушія поза matchMedia (goToSection, jumpDown/Up, tweenTo hero, бекдроп) вбиваються при зміні брейкпоінта, бекдроп скидається. Перевірено 9 сценаріїв 1540↔900 посеред руху: навігація завжди жива.

#### JS-02 · 🟡 medium · ✅ виправлено

**WorkingProcess enter() безумовно ставить isAnimating = true, а знімає його тільки onComplete reveal, який може вже не настати**

`src/components/sections/WorkingProcess.astro:1054-1057 (onComplete reveal: 889-894)` · стандарт: Коректність стану (глобальний замок app.isAnimating)

**Проблема.** Якщо enter() викликано, коли revealTL уже на progress 1 (reset() ставить його туди), play() нічого не програє і onComplete (рядки 889-894) не спрацює: isAnimating лишається true назавжди, whenIdle у меню чекає вічно, жести й клавіші ігноруються. Саме так стається, коли jumpDown завершується після перебудови брейкпойнта: target.controller там уже новий і скинутий restoreSection. Це єдиний контролер, що бере глобальний замок і віддає його лише через свій таймлайн.

**Рекомендація.** Брати замок, лише коли reveal справді програватиметься. Це страховка, незалежна від фіксу JS-01 (для старого, вже вбитого контролера з goToSection вона не допоможе, там потрібен JS-01).

**Статус.** ✅ виправлено. WorkingProcess.enter() бере замок лише коли reveal справді програється; під reduced motion одразу кінцевий стан.

#### JS-04 · 🟡 medium · ✅ виправлено

**Space і PageDown на слайдері Seek гортають Projects і скидають відео, яке саме грає**

`src/scripts/kulbit/observer.ts:58-63; також src/scripts/kulbit/project-video.ts:269-281` · стандарт: WAI-ARIA APG Slider pattern (PageUp/PageDown); WCAG 2.1.1 Keyboard; markup.md → interactive widgets

**Проблема.** Seek і гучність — це <div role="slider" tabindex="0">, а keyValue() у project-video.ts обробляє лише стрілки, Home і End. PageUp/PageDown (стандартні клавіші слайдера за APG) і Space доходять до window-обробника, який слайдери не виключає: картка, що грає, закривається, resetProjectVideo ставить відео на паузу й повертає на 0:00, фокус губиться. Shift+Space зі слайдера ще й переводить на секцію 1.

**Рекомендація.** Не віддавати навігації клавіші зсередини віджетів: додати [role="slider"], video і audio до виключень у observer.ts. У keyValue обробляти PageUp/PageDown як великий крок, як радить APG для slider.

**Статус.** ✅ виправлено. Див. A11Y-12.

#### JS-05 · 🟡 medium · ✅ виправлено

**Resize у межах того самого брейкпойнта не переприкладає px-стан контролерів: рядок Our Services зсунутий, картки Projects обрізані**

`src/scripts/kulbit/sections.ts:57-64 (handleResize); також src/components/sections/OurServices.astro:555-557, 624-628 і src/components/sections/Projects.astro:245-250, 281-289` · стандарт: astro-components.md → Responsive; коректність стану

**Проблема.** Контролери рахують зсуви в px у момент кроку: OurServices x = −(ширина картки + gap), Projects на tablet/mobile висоту картки = slotHeight(). gsap.matchMedia перебудовує все лише при перетині 992/480, тож зміна розміру всередині брейкпойнта (вікно браузера, Split View, поворот iPad Pro 1024↔1366) лишає старі px до наступного кроку. Our Services: активна картка стоїть на −172 px при рамці 58 px, поруч видно сусідню. Projects: нижня картка виходить за край екрана. Якщо resize припав на анімацію, handleResize пропускає навіть applyStackingPositions, а в SectionController немає хука resize.

**Рекомендація.** Додати в SectionController хук resize(): миттєво переприкласти поточний стан із новими вимірами; handleResize викликає його для всіх секцій, а під час анімації повторює спробу після неї, а не пропускає.

**Статус.** ✅ виправлено. SectionController.resize(): Projects і Our Services переприкладають поточний стан з новими вимірами; handleResize чекає кінця руху замість пропуску.

#### JS-06 · 🟡 medium · ✅ виправлено

**Після resize scramble заново будує тексти і повертає вже згорнутий заголовок Our Services**

`src/scripts/kulbit/scramble.ts:76-83 (makeReveal); 155-164 (setupScramble); також src/components/sections/OurServices.astro:593-599` · стандарт: Коректність стану; astro-components.md → Motion (стан не змінюється сам по собі)

**Проблема.** На кроці ≥ 1 (desktop/tablet) Our Services стирає заголовок через scramble.out() і згортає його до height 0. Кожен resize (debounce 200 мс) викликає scramble.build(): makeReveal скидає inline height, ставить природну висоту, а IntersectionObserver викликає in() і пише текст заново. Заголовок повертається на всю висоту, рядок карток з'їжджає вниз, хоча контролер досі на state 2. Наступні кроки заголовок не згортають, бо collapsed уже true: він висить до повернення на state 0. Таймери теж у неправильному порядку: handleResize спрацьовує через 150 мс, scramble через 200 мс.

**Рекомендація.** Прибрати власний resize-слухач scramble і перебудовувати тексти з handleResize рушія перед хуками resize() контролерів (JS-05). Our Services у resize() знову стирає і згортає заголовок, коли state ≥ 1. Врахувати, що observe() після перебудови асинхронно дає першу подію IntersectionObserver із ratio 1 (навіть для блока висотою 0), і та знову викличе in(). Тому контролер має позначити елемент як утримуваний (наприклад, прапорцем held у ScrambleController, який in() поважає), а не лише викликати setOut().

**Статус.** ✅ виправлено. Scramble без власного resize-слухача: rebuildScrambles() з рушія зберігає стан кожного тексту (написаний / стертий / утримуваний); Our Services тримає згорнутий заголовок через hold().

#### JS-07 · 🟡 medium · ✅ виправлено

**Рушій ігнорує prefers-reduced-motion: слайди на весь екран лишаються, reveal WorkingProcess блокує жести на ~3 с**

`src/scripts/kulbit/app.ts:51-60` · стандарт: markup.md:75 (Motion respects prefers-reduced-motion); WCAG 2.3.3 Animation from Interactions (AAA)

**Проблема.** Reduced motion враховують лише scramble, фонове відео і магніт hero. Переходи між секціями (0,7 с на весь екран), стрибки з бекдропом, кроки контролерів і reveal WorkingProcess (×1,7) програються повністю, бо reset.css глушить лише CSS-transition, а не GSAP. Це порушує правило проєкту markup.md:75 («Motion respects prefers-reduced-motion»). На вході в секцію 5 людина ще й ~3 с нічого не може зробити, бо enter() тримає isAnimating.

**Рекомендація.** Прочитати reduce один раз в app.ts і звести тривалості рушія майже до нуля: секційні скрипти, що беруть config.*, отримають це автоматично. Власні DUR_* у WorkingProcess і TraditionalProduction множити на той самий коефіцієнт. У WorkingProcess enter() при reduce одразу ставити кінцевий стан reveal без замка.

**Статус.** ✅ виправлено. Див. A11Y-14.

#### JS-08 · 🟡 medium · ✅ виправлено

**Немає розмітки [data-kulbit-landscape-popup]: логіка телефону в landscape мовчки вимкнена, секції обрізані, меню переповнене**

`src/scripts/kulbit/responsive.ts:42-44; також src/components/sections/SectionNav.astro:103-112` · стандарт: astro-components.md:189 + index.ts «LEFT TO PORT»; WCAG 1.3.4 Orientation (досить попапа, як у Webflow ADR-004)

**Проблема.** На сторінці немає елемента [data-kulbit-landscape-popup] (index.ts:21 «LEFT TO PORT», astro-components.md:189 «the markup comes with its design»), тож setupLandscape повертається на першому рядку, а reapplyResponsive лишається порожньою функцією. Телефон у landscape (844×390, coarse pointer, медіазапит true) потрапляє в tablet-гілку з висотою 390 px, контент секцій обрізаний (картка WorkingProcess зрізана посередині), а прокрутити не можна, бо Observer робить preventDefault. Панель SectionNav переповнена (scrollHeight 444 > 390): justify-content: center зсуває перший пункт «Hero» вище верхнього краю (top −17), «Footer» виходить за нижній, а wheel/свайп по панелі її не прокручують, натомість гортають секції під нею.

**Рекомендація.** Додати розмітку попапа з тимчасовим дизайном (текст у en.ts, TODO до макета), як SectionNav: через слот header, щоб fixed-блок перекривав увесь екран. Логіку responsive.ts уже має. У .section-nav_panel замінити justify-content: center на safe center, щоб переповнений список не обрізався зверху.

**Статус.** ✅ виправлено. Див. R-01.

#### JS-M1 · 🟡 medium · ✅ виправлено

**Фокус на закритій картці Projects прокручує колонку (overflow: hidden): перша картка назавжди обрізана на 87 px**

`src/components/sections/Projects.astro:133-139` · стандарт: WCAG 2.4.11 Focus Not Obscured / коректність верстки; узгодженість з OurServices.astro:133-135

**Проблема.** overflow: hidden лишає .projects_cards контейнером прокрутки, а браузер програмно прокручує такий контейнер, щоб показати сфокусований елемент. Коли Tab доходить до кнопки «Play video» закритої картки (height 0), ul.projects_cards отримує scrollTop 87 і вже ніколи його не скидає: на секції Projects перша картка обрізана зверху на 87 px, знизу 87 px порожнечі, і так до перезавантаження. Сусідній Our Services уже розв'язує це через overflow: clip (OurServices.astro:133-135, коментар «clip: no scroll container»).

**Рекомендація.** Замінити overflow: hidden на overflow: clip у .projects_cards (і перевірити інші контейнери з overflow: hidden, у яких є фокусовані елементи). clip обрізає так само, але не є контейнером прокрутки, тож фокус не може його зсунути. Це незалежно від inert із JS-03 і займає один рядок.

**Статус.** ✅ виправлено. Див. A11Y-02.

#### JS-M2 · 🟡 medium · ✅ виправлено

**Scramble стирає тексти заголовків у DOM: для скрінрідерів h2 секцій 1–4 і 6 порожні, доки секція не на екрані**

`src/scripts/kulbit/scramble.ts:116-122 (setOut); 136-140 (build)` · стандарт: WCAG 1.3.1 Info and Relationships, 2.4.6 Headings and Labels; axe empty-heading

**Проблема.** setOut() фізично очищає textContent усіх [data-kulbit-scramble]/[data-kulbit-typewriter], а in() пише їх лише коли елемент на 60 % у в'юпорті. Секції під екраном (yPercent 100) не перетинаються з ним, тож їхні h2 і абзаци-заяви в дереві доступності порожні. Користувач скрінрідера, що навігує за заголовками, чує п'ять безіменних «heading level 2», а текст заяв недоступний. Корінь у рушії (scramble.ts), не в розмітці.

**Рекомендація.** Анімувати лише візуальну копію тексту: у makeReveal позначити згенеровані спани aria-hidden="true" і додати в елемент span.sr-only (утиліта вже є в utilities.css:570) з повним текстом, який setOut/out не чіпають. Фіксована висота не зміниться, бо .sr-only позиціонований абсолютно.

**Статус.** ✅ виправлено. Див. SEM-01.

#### JS-09 · ⚪ low · ✅ виправлено

**Resize на кроці 2 tablet hero прибирає прев'ю секції 1 під смугою 16:9**

`src/scripts/kulbit/sections.ts:51-55 (applyStackingPositions); 59-64 (handleResize)` · стандарт: Коректність стану; astro-components.md → Step scroll

**Проблема.** Поки поточна секція 0 на tablet/mobile, позицією секції 1 керує tabletTL: на кроці 2 вона стоїть на yPercent = partial. Після будь-якого resize (навіть лише висоти) handleResize викликає applyStackingPositions і ставить секції 1 yPercent 100. Під смугою відео лишається порожній чорний екран до наступного жесту. Смуга ще й зберігає стару висоту в px: video16h рахується один раз у buildTabletHero.

**Рекомендація.** Не чіпати секцію 1 в applyStackingPositions, поки поточний tablet hero. Для зміни ширини перебудовувати tabletTL через хук resize() (JS-05) або бодай поновлювати поточний time таймлайна.

**Статус.** ✅ виправлено. Поки поточний планшетний hero, позиція секції 1 належить його таймлайну; зміна ширини перебудовує брейкпоінт на тому самому кроці hero; зміна лише висоти — ні (залишок: при зміні висоти на кроці 1–2 геометрія смуги не перераховується до наступної зміни ширини).

#### JS-10 · ⚪ low · ✅ виправлено

**Стрибок із меню з секції 1 на Hero на tablet/mobile: секція зникає миттєво, без слайду**

`src/scripts/kulbit/sections.ts:426-433` · стандарт: CLAUDE.md / astro-components.md:133: «Nothing appears or changes state instantly»

**Проблема.** На tablet-гілці секція 1 сама є ціллю tabletTL (section2 у hero.ts). Коли prev === 1, progress(0).time(s1) одразу ставить їй yPercent 100 (стартове значення її твіну), тож твін leaving.el до 100 нічого не анімує, і Our Clients зникає в першому кадрі, а hero з'являється на весь екран миттєво. Задумане «під секцією, що йде» працює лише для prev ≥ 2.

**Рекомендація.** Для prev === 1 програвати хореографію tabletTL від кінця до 0 (таймлайн сам відсуне секцію 1, розгорне смугу й поверне хедер) замість окремого твіну leaving.el, а onComplete, що знімає isAnimating, повісити на цю анімацію.

**Статус.** ✅ виправлено. Стрибок із секції 1 на hero на планшеті/мобільному програє хореографію hero від кінця до 0 (секція 1 від’їжджає, смуга розгортається, хедер повертається).

#### JS-11 · ⚪ low · ✅ виправлено

**goToSectionStep і гілка data-target-step нічим не використовуються і обходять контракт рушія**

`src/scripts/kulbit/sections.ts:452-485; також src/scripts/kulbit/navigation.ts:44-47, app.ts:54` · стандарт: Коректність стану; мертвий код (перед /systemize)

**Проблема.** У розмітці немає жодного data-target-step (і жодного [data-kulbit-step], тож гілка reveal steps теж мертва). Сама функція змінює currentSectionIndex без persistSection: меню не отримає kulbit:section, reload поверне стару секцію. Також не викликаються passHero, prepare/enter/reset контролера, showCurrentVideo/hideOtherVideos. Кнопка, яка колись отримає data-target-step, відкриє секцію з контролером у випадковому стані, з неправильним пунктом меню і відео, що грає далі.

**Рекомендація.** Видалити goToSectionStep, гілку data-target-step у navigation.ts і config.autoPlayStepDuration, а заразом згадку «(+ data-target-step)» в astro-components.md:187 (з рядком у .claude/README.md за core.md §5). Якщо фіча потрібна, реалізувати її через autoAdvanceTo + controller.reset + step, щоб зберегти контракт.

**Статус.** ✅ виправлено. goToSectionStep, data-target-step і autoPlayStepDuration прибрано; правило оновлено.

#### JS-12 · ⚪ low · ✅ виправлено

**Помилка в одному секційному білдері зупиняє всю перебудову: try/catch є лише навколо першого виклику**

`src/scripts/kulbit/responsive.ts:22-29 (також src/scripts/kulbit/index.ts:61-65)` · стандарт: Стійкість: «A broken section build must never kill the navigation» (index.ts:60)

**Проблема.** index.ts:61-65 обгортає в try/catch лише registerAnimations() при init, і навіть тоді виняток в одному білдері перериває forEach: наступні білдери не виконуються, restoreSection не викликається. При пізніших змінах брейкпойнта гілку викликає слухач gsap.matchMedia без жодного захисту, і teardownHero не повертається, тож наступна зміна брейкпойнта не прибере посилання й контролери.

**Рекомендація.** Ізолювати кожен білдер і гарантувати restoreSection та повернення cleanup.

**Статус.** ✅ виправлено. Кожен білдер у власному try/catch, restoreSection і teardownHero — завжди.

#### JS-M3 · ⚪ low · ✅ виправлено

**Документація брейкпойнтів рушія застаріла: правило і hero.ts кажуть 768–991 / «480–767 nothing», а код будує tablet hero на 480–991**

`.claude/rules/astro-components.md:183 (також src/scripts/kulbit/hero.ts:2)` · стандарт: core.md §5 (документування .claude/); узгодженість коду й правил

**Проблема.** responsive.ts:35 реєструє '(min-width: 480px) and (max-width: 991px)' (свідома зміна проти Webflow, описана в коментарі responsive.ts:7-8), а правило, яке Claude завантажує в кожній сесії, і шапка hero.ts досі описують старий діапазон. Наступна правка за правилом (наприклад, /systemize або нова секція) матиме неправильне уявлення, що 480–767 не має кроків hero.

**Рекомендація.** Оновити фрагмент в astro-components.md:183 і коментар hero.ts:2 під фактичні 480–991. Оскільки змінюється .claude/, додати рядок у «Журнал змін» .claude/README.md (core.md §5).

**Статус.** ✅ виправлено. Див. HV-17.

### H. Адаптивність

Прогнав Playwright із фейковим годинником (restore через sessionStorage, runFor 3500, далі крок за кроком коліщатком) на нашій збірці :4399 і на Webflow-референсі :8777. Покриття: 20 заданих в’юпортів плюс 6 реальних вікон браузера на ноутбуках (1920x900, 1680x850, 1536x730, 1440x760, 1366x625, 1280x600). Разом близько 36 станів на кожен в’юпорт. Окремо перевірив: телефон у ландшафті з hasTouch/isMobile (844x390, 932x430, 667x375); нижню панель iOS Safari через емуляцію (390x745 = lvh, а `.wrapper` обрізана до 664 = svh; CSS вставлено у відповідь HTML ще до старту движка); покриття медіа (fill-box/cover) на 8 розмірах; відкриту бічну панель на 6 розмірах; метрики заголовка hero.

Скрипти, сирі кадри та JSON лежать у /private/tmp/claude-501/-Users-ju1ceee-Desktop-awwwards-kulbit-awwwards/58836cec-0138-43b3-ba0e-f868479f4768/scratchpad/audit/responsive/: measure.mjs, measure-ios.mjs, landscape.mjs, trad.mjs, boxes.mjs, panel.mjs, cover.mjs, herotitle.mjs, font.mjs; raw/ours, raw/ref, raw/ios-*, data/*.json. Парні кадри «наш | Webflow» — у problems/*.png.

Головне:
(1) Не портовано розмітку ландшафтного попапа. `setupLandscape` виходить одразу, тож телефон в альбомній орієнтації показує поламаний планшетний hero. Webflow у цьому випадку показує заглушку. Це регресія, high.
(2) Секції 1–7 мають висоту 100vh, а видима область на мобільному менша. На iPhone Safari (емуляція) обрізано таблицю Traditional (33 px) і картку OurServices (8–90 px). Успадковано.
(3) На десктопі все масштабується лише за шириною. Тому у вікнах, ширших за 16:9 (1366x625, 1536x730, 1920x900), обрізано першу картку OurServices (до +86 px), картку WorkingProcess (+13) і таблицю Traditional (+68). Успадковано: цифри з Webflow збігаються до пікселя.
(4) На коротких телефонах (≤ 375x667) обрізано таблицю Traditional (+58…65 px) і відео картки OurServices (−51…−58 px; у Webflow −36…−40). Успадковано.
(5) На планшетах 768–991 картка OurServices виходить за екран на 77–412 px. Успадковано.
(6) Вкладка бічної панелі на телефонах перекриває текст: «AI» у hero на 320–375, абзац футера на 390/414. Це лише наш сайт; побічний ефект прийнятої тимчасової панелі.
(7) Дрібниці: перший пункт панелі недосяжний на низьких екранах; мертве правило 100svh у Projects; «AI Dimension» рветься на два рядки, бо немає &nbsp;.

Горизонтального переповнення та тексту, що вилазить за свою коробку, немає на жодному розмірі. На 16:9 і 4:3 (992x700, 1024x768, 1280x720, 1366x768, 1440x800, 1536x864, 1920x1080, 2560x1440) усі секції вміщаються, запас унизу 20–129 px. Для /systemize: від пунктів 2 і 3 залежать токени висоти (`--viewport-height`, «fit»-масштаб) і контракт 100vh у .claude/rules/astro-components.md:184 та styles.md:93.

#### R-01 · 🟠 high · ✅ виправлено

**Немає ландшафтного попапа: телефон в альбомній орієнтації показує поламаний hero (у Webflow — заглушка «Explore better experience»)**

`src/scripts/kulbit/responsive.ts:42-44 (також src/scripts/kulbit/index.ts:21 — «LEFT TO PORT … landscape popup only its markup»)` · стандарт: Паритет з Webflow (ADR-004, landscape popup); .claude/rules/astro-components.md:189; візуальна QA (контент за межами екрана, накладання)

**Проблема.** Елемента `[data-kulbit-landscape-popup]` немає ні на сторінці, ні в layout, тому `setupLandscape` одразу виходить. На телефоні в ландшафті (pointer: coarse, висота ≤ 500) заглушка не з’являється, навігація не вимикається, відео не ставляться на паузу. Користувач бачить планшетну верстку hero, розраховану на портрет: заголовок «FILMMAKER VISION X AI DIMENSION» виїжджає за верх екрана і лягає під логотип KULBIT та кнопку PROJECTS, текст іде поверх відео. Нижче секції обрізані. Webflow у тих самих умовах закриває все попапом на весь екран. Це регресія порту, а не успадкована поведінка. Дизайн попапа є у Webflow-експорті (wf/index.html:1616-1645, CSS kulbit-gsap.webflow.css:524-527, 808-837), а правило astro-components.md:189 прямо очікує цю розмітку.

**Рекомендація.** Портувати розмітку з Webflow окремим компонентом `src/components/sections/LandscapePopup.astro` і рендерити його в слоті header (`<LandscapePopup slot="header" />` в index.astro): там він fixed поверх усього, як SectionNav. Тексти винести в `src/i18n/en.ts` → `landscapePopup`, іконку повороту (icon-48 з Webflow) покласти в `src/assets/icons/rotate-phone.svg`. Атрибутом `hidden` керує responsive.ts. Глобального правила `[hidden]` у reset.css немає, тому потрібне явне `.landscape-popup[hidden] { display: none; }`. Не ставити `role="alertdialog"` без керування фокусом: краще `role="dialog" aria-modal="true"`, а поки попап показано, ставити `inert` на `main` і `footer` (у apply() в responsive.ts). Після цього прибрати пункт із «LEFT TO PORT» в index.ts.

**Статус.** ✅ виправлено. LandscapePopup.astro — порт .landscape-popup з Webflow (лого, іконка повороту, «Explore better experience»); показується на телефоні в альбомній орієнтації, решта сторінки inert, фокус на діалозі, навігація й відео зупинені.

#### R-02 · 🟡 medium · ✅ виправлено

**Секції 1–7 мають висоту 100vh, а видима область на мобільному менша: низ секцій ховається під панелями браузера (успадковано з Webflow)**

`src/scripts/kulbit/sections.ts:44 (також 353 — фон кнопкового стрибка; src/styles/utilities.css:598-602; src/components/sections/Projects.astro:63; src/components/sections/SiteFooter.astro:198, 300, 345)` · стандарт: Візуальна QA (мобільні панелі браузера, lvh vs svh); власна передумова движка app.ts:90-91; CSS Values 4 (dvh/svh/lvh)

**Проблема.** Видима область — це `.wrapper` (`position: fixed; inset: 0; overflow: clip`). Сам движок вважає саме її справжньою висотою (app.ts:90-91: «not 100vh: on mobile the address bar makes them differ»). Але секції та `[data-scenes]` мають висоту 100vh. В iOS Safari і Chrome Android `100vh` — це висота зі схованими панелями. Нативного скролу немає (`html[data-steps] { overflow: hidden }`), тому панелі ніколи не ховаються, і нижні ~81 px (iPhone Safari) чи ~56 px (Chrome Android) кожної секції обрізає `.wrapper`. Hero виправлено окремо (hero-height.ts), Projects і мобільний футер рахують від visibleHeight(). OurServices, WorkingProcess, TraditionalProduction і OurClients цього не роблять. Успадковано: у Webflow той самий inline `height: 100vh`.

**Рекомендація.** Прив’язати стек до видимої області, а не до 100vh: у setupStacking і у фоні стрибка поставити `height: '100%'`, а в utilities.css — `html[data-steps] [data-scenes] { height: 100% }`. `.wrapper` у режимі steps — fixed з inset 0 (визначена висота), `main` — єдиний in-flow елемент, а footer позиціонується абсолютно відносно `.wrapper`, тож 100% дорівнює видимій висоті. Позиції на yPercent від цього не змінюються. Після цього hero-height.ts стає зайвим. У SiteFooter `min-height: calc(100vh - …)` замінити на `calc(100dvh - …)`. Контракт «100vh stacking container» оновити в .claude/rules/astro-components.md:184 і styles.md:93, а також у .claude/README.md (core.md §5). Перевірити емуляцією 390x745 з обрізаним до 664 `.wrapper`.

**Статус.** ✅ виправлено. Стек секцій і бекдроп — height: 100% видимої області (.wrapper), а не 100vh; футер — 100dvh. На десктопі й у стандартних кадрах без змін; на мобільному з панелями браузера низ секцій більше не ховається.

#### R-03 · 🟡 medium · ⏸ потребує рішення клієнта / дизайнера

**Десктоп у вікнах, ширших за 16:9 (1366x625, 1536x730, 1920x900–940): обрізано картку OurServices, картку WorkingProcess і таблицю Traditional (успадковано)**

`src/styles/tokens.css:28 (фіксовані висоти, що від цього залежать: OurServices.astro:328-332, WorkingProcess.astro:343-356, TraditionalProduction.astro:274-278)` · стандарт: Візуальна QA (контент обрізано в секції 100vh); паритет із кадром Figma 1920×1080

**Проблема.** Увесь десктоп масштабується тільки за шириною (1920 → 1). Висоти, розраховані на кадр 1920×1080 (медіа OurServices 40.88rem, картка WorkingProcess 38.13rem, радар Traditional 49rem, рядки таблиці), не реагують на висоту вікна. Реальні вікна браузера ширші за 16:9: Chrome на Windows із екраном 1920×1080 — ~1920×940, ноутбук 1366×768 — ~1366×625, 1920 @125% — ~1536×730. У результаті перший стан OurServices (до першого жесту) ховає теги й низ картки, у WorkingProcess на 1366x625 зникає нижня рамка картки, а в Traditional на кроці зі «Scalability» обрізано рядок таблиці. Успадковано: цифри Webflow збігаються до пікселя.

**Рекомендація.** Основний варіант — точково обмежити три фіксовані висоти видимою висотою: `min(<figma>, 100dvh - <відступ над і під блоком>)` для `.our-services_media`, `.working-process_card` і `.traditional-production_chart` у десктопному блоці. На 1920×1080 вони не змінюються, а на коротких вікнах стискаються. Глобальний «fit»-масштаб (min із відношень ширини й висоти) — лише як опція і з обережністю: він додатково зменшує весь текст на коротких вікнах (1366x625 → scale 0.58, основний текст ~9 px, див. R-M1) і залишає порожні поля по боках, бо `.container` лишається на 100% ширини. Для /systemize: від цього залежить токен висоти. Перевірити на 1920x940, 1536x730 і 1366x625.

До:
```
--fluid-scale: calc(var(--viewport-width) / var(--reference));
```
Після (приклад):
```
/* OurServices.astro, desktop: the media never pushes the card past the section's bottom padding */
.our-services_media {
  width: calc(47.13rem * var(--fluid-scale)); /* 754 */
  /* 654 in the 1920×1080 frame; the card starts ~328 below the top, 64 bottom padding */
  height: min(calc(40.88rem * var(--fluid-scale)), calc(100dvh - 24.5rem * var(--fluid-scale)));
  border-left: var(--size-2) solid #252525;
}
/* WorkingProcess.astro */
.working-process_card {
  height: min(calc(38.13rem * var(--fluid-scale)), calc(100dvh - <top offset + bottom padding>));
}
/* the offsets are measured in the 1920×1080 frame; verify with pnpm shot at 1920x940 and 1366x625 */
```

**Статус.** ⏸ потребує рішення клієнта / дизайнера. Успадковано від Webflow: десктоп масштабується лише за шириною, тож у вікнах, ширших за 16:9 (1920×940, 1536×730, 1366×625), низ картки Our Services (+46…78 px), WorkingProcess і таблиці Traditional обрізаний. Рішення — обмежити висоти через min(…, 100dvh − …) або «fit»-масштаб; змінює вигляд затвердженого дизайну на цих вікнах, тож потребує погодження.

#### R-04 · 🟡 medium · ⏸ потребує рішення клієнта / дизайнера

**Короткі телефони (320x568, 360x640, 375x667): обрізано розкритий рядок таблиці Traditional і низ картки OurServices (успадковано; OurServices у нас на 18 px гірше через довший реальний текст картки 3)**

`src/components/sections/TraditionalProduction.astro:498-500 (mobile); src/components/sections/OurServices.astro:234-237, 472-474` · стандарт: Візуальна QA (контент обрізано в секції 100vh); паритет із Webflow

**Проблема.** Мобільна верстка розрахована на кадр 390×844 (співвідношення 0.46) і масштабується лише за шириною. На телефонах зі співвідношенням 0.56 (iPhone SE/8, малі Android) на кроці 5 Traditional (розкрито «Cost structure») низ таблиці на 58–65 px нижче екрана: текст «…overhead.», смужка прогресу і нижня рамка не видно. На кроці 7 — ще +9–10 px. В OurServices після кроку 1 низ картки (відео і кутова стрілка) обрізаний на 60 px (у Webflow — 42). Наші картки на 18 px вищі, бо `.our-services_cards` (flex, stretch) вирівнює всі картки під найвищу — картку 3 (704 px). У нас у ній реальний текст «The KPIs: Optimized for CVR…», а у Webflow-експорті — плейсхолдер, копія тексту картки 1 (686 px). У Safari з панелями (R-02) втрати ще більші. Успадковано.

**Рекомендація.** Traditional: у мобільному контролері секції, коли розкритий рядок виходить за visibleHeight(), зсувати контент секції вгору на різницю, а під час згортання повертати — так само, як SiteFooter зсуває [data-footer-content]. Альтернатива — менший радар на екранах, коротших за кадр: `@media (max-width: 479px) and (min-aspect-ratio: 1/2)`. OurServices: зменшувати `.our-services_media` на коротких екранах, наприклад `height: min(15rem * scale, 100dvh - <висота тексту картки>)` або через `min-aspect-ratio`. `align-items: flex-start` на `.our-services_cards` вкорочує лише картки 1, 2, 4, 5, а картку 3 (704 px) не рятує. Висоту звіряти з запасом R-02 (−81 px).

До:
```
.traditional-production_chart {
      height: calc(16.25rem * var(--fluid-scale)); /* 260 */
    }
…
  .our-services_cards {
    display: flex;
    gap: calc(5.31rem * var(--fluid-scale)); /* 85 */
  }
```
Після (приклад):
```
// TraditionalProduction.astro, mobile/tablet controller — after a step opens a row (sketch)
const content = root.querySelector<HTMLElement>('.container');
const fit = () => {
  const table = root.querySelector<HTMLElement>('[data-traditional-right]');
  const padding = parseFloat(getComputedStyle(root).paddingBottom);
  const overflow = table.getBoundingClientRect().bottom - Number(gsap.getProperty(content, 'y')) + padding - visibleHeight();
  gsap.to(content, { y: overflow > 0 ? -overflow : 0, duration: config.stepDuration, ease: config.ease });
};

/* OurServices.astro — mobile: the media gives way on screens shorter than the 390 × 844 frame */
@media (max-width: 479px) and (min-aspect-ratio: 1/2) {
  .our-services_media {
    height: calc(10rem * var(--fluid-scale));
  }
}
```

**Статус.** ⏸ потребує рішення клієнта / дизайнера. Успадковано: на коротких телефонах (≤ 375×667) обрізано розкритий рядок Traditional і низ картки Our Services; потрібне рішення дизайнера (менший радар/медіа на коротких екранах).

#### R-05 · 🟡 medium · ⏸ потребує рішення клієнта / дизайнера

**Планшети 768–991 (портрет): картка OurServices виходить за екран на кожному кроці (11–218 px, до першого жесту — до 412 px; успадковано)**

`src/components/sections/OurServices.astro:387-393` · стандарт: Візуальна QA (контент обрізано в секції 100vh)

**Проблема.** На планшеті картка — колонка з текстів і відео фіксованої висоти (20.31rem × масштаб). Масштаб рахується за шириною від кадру 744, тож висота росте з шириною, і картка вища за екран на кожному кроці свайпу. На 768x1024 після кроку 1 з відео видно лише ~180 px, нижньої рамки й скруглень немає (−156 px). На 820x1180 — −77, на 991x1300 — −218, до першого жесту — до −412. Навіть на кадрі Figma 744x1133 низ картки обрізаний на 11 px. Webflow поводиться так само, це успадковано.

**Рекомендація.** На ≤ 991 дати колонці секції заповнити її висоту, а відео — забрати залишок. Картка тоді закінчується на нижньому відступі секції, а відео тягнеться чи стискається до мінімуму. На планшеті крок 1 згортає висоту заголовка (layout, а не transform), тож картка з `flex: 1` просто виросте, і розрахунок лишається коректним. Потрібен власний клас на обгортці `.flex-v` (наприклад `our-services_layout`) і на `.container` цієї секції, без нащадкових селекторів. Альтернатива — у контролері hswipe виставляти висоту медіа від visibleHeight(). Перевірити на 744x1133, 768x1024, 820x1180 і 991x1300.

До:
```
.our-services_media {
      align-self: stretch;
      width: auto;
      height: calc(20.31rem * var(--fluid-scale)); /* 325 */
      border-top: var(--size-2) solid #252525;
      border-left: none;
    }
```
Після (приклад):
```
<div class="container our-services_container">
  <div class="our-services_layout flex-v spacing-48/48/24"> … </div>
</div>

@media (max-width: 991px) {
  .our-services_container,
  .our-services_layout {
    height: 100%;
  }
  .our-services_cards {
    flex: 1;
    min-height: 0;
  }
  .our-services_media {
    flex: 1;
    min-height: calc(10rem * var(--fluid-scale));
    height: auto;
  }
}
```

**Статус.** ⏸ потребує рішення клієнта / дизайнера. Успадковано: на планшетах 768–991 картка Our Services вища за екран; потрібне рішення дизайнера (гнучка висота медіа).

#### R-06 · 🟡 medium · ✅ виправлено

**Вкладка бічної панелі перекриває текст на телефонах: «AI» в hero (320–375), кінці рядків абзацу About у футері (390/414)**

`src/components/sections/SectionNav.astro:73-81, 136-143` · стандарт: Візуальна QA (фіксований шар над контентом); WCAG 2.5.8 Target Size (Minimum) — для запропонованого розміру

**Проблема.** Вкладка шириною 24×scale стоїть на правому краї екрана посередині висоти, а бічний відступ контейнера на мобільному — 16×scale. Тож вона заходить у колонку контенту на ~8 px, а вирівняний по ширині текст (заголовок hero, абзаци футера) доходить саме до краю колонки. На 320–375 вкладка закриває «I» у синьому «AI» заголовка hero — це перший екран. На 390/414 вона закриває кінці рядків «DIRECTION» і «HIGH-» в абзаці About футера. Лише в нашій збірці: побічний ефект прийнятої тимчасової панелі (Webflow її не має).

**Рекомендація.** На ≤ 479 зробити видиму частину вкладки не ширшою за бічний відступ (`--container-padding`), щоб вона не заходила в контент. Зону натискання до 24 CSS px добрати прозорим ::before, який виходить ліворуч. Брати саме `max(24px, var(--size-24))`: на 320 `--size-24` = 19.7 px, а WCAG 2.5.8 рахує CSS-пікселі. Іконка 12×scale вміщається. Коли з’явиться макет дизайнера, звірити з ним.

**Статус.** ✅ виправлено. На ≤479 видима вкладка вужча за бічне поле (--container-padding), зона дотику лишається 24 px через ::before — текст більше не перекривається.

#### R-M1 · 🟡 medium · ⏸ потребує рішення клієнта / дизайнера

**Стрибок масштабу на брейкпоінтах 991/992 і 479/480: десктопна верстка на 992–1280 (iPad у ландшафті, малі ноутбуки) має текст 8–11 px, планшетна на 480–600 — 7.7–10 px (успадковано)**

`src/styles/tokens.css:25, 28, 292, 314 (брейкпоінти движка: src/scripts/kulbit/responsive.ts:34-36)` · стандарт: Читабельність / візуальна QA на проміжних ширинах; styles.md:124 (брейкпоінти 991/767/479); WCAG 1.4.4 формально не порушено (zoom працює), але текст 8–10 px нечитабельний

**Проблема.** Кожен діапазон масштабується від свого кадру за шириною, тож на межах масштаб стрибає. На 991 px планшетна верстка має scale 1.33 (медіана тексту 24 px), а на 992 px десктопна вже 0.52: медіана 9.3 px, 10-й перцентиль 8.3 px, теги й підписи ~7–8 px. iPad у ландшафті (1024×768) отримує десктоп зі scale 0.53: медіана 9.6 px, а WorkingProcess займає верхні 60% екрана, решта порожня. 1280×800 — медіана 12.1, p10 10.7 px. Так само на 479 → 480: scale 1.23 → 0.65, текст 7.7–11.7 px у діапазоні 480–600 (iPad Split View, розкладні телефони, вузькі вікна). У Webflow числа ідентичні — це успадковано. Горизонтального переповнення немає, але читабельність на цих ширинах погана.

**Рекомендація.** Це рішення для дизайнера та /systemize, а не механічна правка. Наївна заміна `--reference` для 992–1439 на 1440 не підходить: перевірено, вона ламає верстку (тижні WorkingProcess виходять до 1233 px при ширині 1024, OurClients — 950 px при висоті 768). Реалістичні варіанти: (1) на /systemize задати нижню межу розміру лише для текстових токенів найменших стилів (підписи, теги, основний текст), без зміни розкладки: `--font-*: max(<fluid>, <floor>)`, перевірити на 1024x768 і 1366x625 (запас по висоті там є: 1024x768 s3/s5 закінчуються на 529/478 з 768); (2) попросити в дизайнера кадр 1280×800 (iPad landscape / малі ноутбуки); (3) обмежити планшетний масштаб зверху (на 991 текст 24 px завеликий) через `--fluid-scale: min(…, 1.15)` у блоці ≤ 991: зменшення масштабу переповнення не створює.

До:
```
--reference: 1920; /* desktop frame 13 (1920 × 1080) */
…
  --fluid-scale: calc(var(--viewport-width) / var(--reference));
…
@media (max-width: 991px) {
  :root {
    --reference: 744;
…
@media (max-width: 479px) {
  :root {
    --reference: 390;
```
Після (приклад):
```
/* tokens.css (at /systemize): the smallest text styles keep a readable floor; the layout keeps scaling */
:root {
  --font-label: max(var(--size-16), 0.6875rem); /* 16 at 1920 → never below 11px */
  --font-body: max(var(--size-18), 0.75rem); /* 18 at 1920 → never below 12px */
}
@media (max-width: 991px) {
  :root {
    --reference: 744;
    /* the portrait tablet frame stops growing at 1.15 (991px wide = 1.33 now) */
    --fluid-scale: min(calc(var(--viewport-width) / var(--reference)), 1.15);
  }
}
```

**Статус.** ⏸ потребує рішення клієнта / дизайнера. Стрибок масштабу на 991/992 і 479/480 успадковано від Webflow: потрібне рішення дизайнера (кадр 1280×800 або мінімальні розміри тексту).

#### R-07 · ⚪ low · ✅ виправлено

**Бічна панель на низьких екранах: перший пункт («HERO») обрізаний зверху, і до нього не доскролити**

`src/components/sections/SectionNav.astro:103-109` · стандарт: CSS Box Alignment 3 (overflow alignment `safe`); візуальна QA

**Проблема.** Коли 8 пунктів разом із відступами вищі за екран, `justify-content: center` у контейнері з прокруткою виносить частину вмісту за його верхній край. Туди прокрутка не дістає, тож перший пункт обрізаний і недосяжний. Трапляється на планшетній ширині з малою висотою: на 844 px ширини — нижче ~444 px висоти, на 991 — нижче ~520. Це низьке вікно десктопного браузера, а поки немає R-01 — і телефон у ландшафті.

**Рекомендація.** Замінити на `justify-content: safe center`: центрує, поки вміщається, а при переповненні прилипає до верху. Альтернатива — прибрати justify-content і дати списку `margin-block: auto`.

**Статус.** ✅ виправлено. justify-content: safe center — переповнений список прилипає до верху.

#### R-09 · ⚪ low · ✅ виправлено

**Заголовок hero: «AI Dimension» рветься на «…X AI / DIMENSION» на телефонах і планшетах (у Webflow — нерозривний пробіл)**

`src/i18n/en.ts:25` · стандарт: Типографіка / паритет із Webflow

**Проблема.** У Webflow синя частина заголовка — `AI Dimension` з U+00A0 (wf/index.html:325), тож на мобільному й планшеті рядки йдуть «FILMMAKER / VISION X / AI DIMENSION». У нас звичайний пробіл (0x20), і «AI» лишається в кінці другого рядка («VISION X AI / DIMENSION»), розриваючи брендову фразу. Окремо: на планшеті блок заголовка в нас `width: auto` (Hero.astro:261-263, 702 px на 768), а у Webflow `.width-590-a-a` стає auto лише на ≤ 479 (на планшеті 36.88rem, 609 px). Треба вирішити за кадром Figma 744.

**Рекомендація.** Поставити нерозривний пробіл явним escape, щоб його було видно в коді (en.ts уже використовує `\u{2014}`). Ширину заголовка на планшеті звірити з кадром Figma 744 і, якщо має бути як у Webflow, перенести `width: auto` з блоку ≤ 991 у блок ≤ 479. Перекриття «AI» вкладкою (R-06) цей фікс не прибирає: вирівняний по ширині «VISION X» теж доходить до правого краю.

**Статус.** ✅ виправлено. Див. VP-01.

#### R-M2 · ⚪ low · ✅ виправлено

**Документація движка суперечить коду: правило й коментар hero.ts кажуть «планшетний hero 768–991, 480–767 нічого», а код реєструє 480–991**

`.claude/rules/astro-components.md:183 (також src/scripts/kulbit/hero.ts:2; код: src/scripts/kulbit/responsive.ts:35)` · стандарт: Узгодженість правил проєкту з кодом (core.md §5)

**Проблема.** responsive.ts:35 реєструє планшетну гілку для `(min-width: 480px) and (max-width: 991px)` (свідоме розширення відносно Webflow, описане в шапці responsive.ts). Правило astro-components.md:183, яке читає кожен наступний білдер і /systemize, та коментар у hero.ts:2 («Tablet (768–991) and mobile portrait (≤479) hero») досі описують старий діапазон, де на 480–767 нічого не будується. Наступна правка брейкпоінтів чи секційного контролера може спиратися на хибний контракт.

**Рекомендація.** Оновити рядок правила і коментар hero.ts під фактичні 480–991 та додати запис у «Журнал змін» .claude/README.md (core.md §5).

**Статус.** ✅ виправлено. Див. HV-17.

### I. Відповідність еталону Webflow

Я порівняв нашу збірку (localhost:4399) з еталонним Webflow-білдом (localhost:8777) на 1920×1080, 768×1133 і 390×812. Кожну секцію 0..8 відкривав через restore sessionStorage, з фейковим годинником і прихованими video/iframe, і проходив усі кроки. Кількість станів у двох збірках однакова: 34, 35 і 36 кадрів. Для кожного стану зібрав геометрію та computed-стилі всіх видимих текстових блоків, img, svg, кнопок/посилань, боксів і ліній, зіставив їх між двома DOM за текстом або роллю і додатково зробив попіксельний diff із side-by-side скріншотами. Секції 1–8 (Our Clients, Projects, Our Services, обидва інтро, Working Process, Traditional, футер) збігаються в межах 1 px у всіх станах. Інші розбіжності там дають лише прийняті рішення або шум ресемплінгу. Реальні дефекти зосереджені в hero та хедері. У заголовку hero немає нерозривного пробілу AI&nbsp;Dimension, тому рядки переносяться інакше на всіх ширинах. На планшеті заголовок ширший, ніж у Webflow. Роздільник hero видно на ≤991, хоча в Webflow він прихований. Нижній padding hero на планшеті й мобільному не портовано, тож контент стоїть на 16,5 та 40 px вище. Лід про лого підтверджено за величиною, але напрям протилежний: на 768 хедер (лого й кнопка Projects) на 7,7–8,3 px ВИЩЕ за еталон, бо --header-padding на планшеті 16 замість 24. На 390 лого на 4,5 px НИЖЧЕ, бо кнопка Projects має висоту 48 з іконкою 24 замість 40/16. Я підставив виправлення в сторінку через інжектований CSS, і hero разом із хедером на 768 та 390 зійшлися з еталоном до 0,5 px; залишилася тільки різниця пропорцій прийнятого logo.svg, до 1,2 px. На старті сторінки intro немає в жодній збірці: стан на t=0…4000 мс однаковий. Перший кадр до запуску рушія за композицією теж збігається. Дрібні відмінності: у hover лого на головній, у hover кнопки звуку та в бічних ефектах прийнятих рішень (картки Services на мобільному стали вищими через копі картки 3 із Figma, таб SectionNav перекриває 8 px контенту на 390). Скрипти, скріншоти та дифи лежать у /private/tmp/claude-501/-Users-ju1ceee-Desktop-awwwards-kulbit-awwwards/58836cec-0138-43b3-ba0e-f868479f4768/scratchpad/audit/visual-parity/ (collect.mjs, compare.mjs, probe.mjs, intro.mjs, prejs.mjs, hover.mjs, raw/, diff/, sbs/).

#### VP-01 · 🟠 high · ✅ виправлено

**У заголовку hero немає нерозривного пробілу «AI Dimension», тому рядки переносяться не так, як у Webflow**

`src/i18n/en.ts:25` · стандарт: Візуальний паритет із затвердженим Webflow-білдом (index.html, h1.text-size-h1)

**Проблема.** У Webflow h1 має вигляд `Filmmaker Vision x <span class="text-color-blue">AI Dimension</span>`, де між AI і Dimension стоїть U+00A0. Це єдиний нерозривний пробіл у контенті еталона, і він тримає блакитний акцент «AI DIMENSION» в одному рядку. У нас там звичайний пробіл, тому «AI» лишається в рядку з «X». При text-align: justify композиція заголовка першого екрана інша на всіх ширинах. Еталон: «FILMMAKER / VISION ⟷ X / AI DIMENSION». У нас: «FILMMAKER / VISION X AI / DIMENSION».

**Рекомендація.** У словнику замінити пробіл в accent на U+00A0 через явний escape ` `, щоб редактор чи форматер не перетворив його на звичайний пробіл. Hero.astro:30 не змінюється. Скрипти текст h1 не переписують (у нього немає data-kulbit-scramble).

**Статус.** ✅ виправлено. accent: 'AI\u{a0}Dimension' — рядки заголовка як у Webflow (перевірено геометрією на 1920/768/600/390/375).

#### VP-02 · 🟡 medium · ✅ виправлено

**На планшеті заголовок hero займає всю ширину контейнера (702 px) замість 36.88rem (609 px)**

`src/components/sections/Hero.astro:261-263` · стандарт: Візуальний паритет із Webflow (kulbit-gsap.webflow.css: .width-590-a-a { width: 36.88rem }, ≤479 { width: auto })

**Проблема.** У Webflow обгортка h1 має клас `.width-590-a-a`: 36.88rem на всіх ширинах і `auto` лише на ≤479. Правила для ≤991 немає. У нас `width: auto` стоїть уже на ≤991, тому блок розтягується на весь контейнер. Через justify рядок «VISION … X» доходить до правого краю: на 768 «X» стоїть на x=676 замість 583, на 600 блок 548 px замість 476.

**Рекомендація.** У блоці @media (max-width: 991px) залишити `.hero_heading` ширину calc(36.88rem * var(--fluid-scale)), тобто прибрати там width: auto. `width: auto` перенести в блок @media (max-width: 479px). Правити разом із VP-01.

**Статус.** ✅ виправлено. width 36.88rem на планшеті, auto лише ≤479.

#### VP-03 · 🟡 medium · ✅ виправлено

**Роздільник hero видно на планшеті й мобільному, хоча у Webflow його не видно на жодній ширині**

`src/components/sections/Hero.astro:33, 124-128` · стандарт: Візуальний паритет із Webflow (kulbit-gsap.webflow.css: .divider.is-hero.desktop-hide ≤991 display:none; inline .desktop-hide ≥992 display:none!important)

**Проблема.** У Webflow `div.divider.is-hero.desktop-hide` ховають два правила: на ≥992 inline `.desktop-hide {display:none!important}`, на ≤991 `.divider.is-hero.desktop-hide {display:none}`. Скрипти його не показують. У нас на ≤991 лінія видима (2 px, 15 % білого на всю ширину) і як окремий елемент флексу додає ще один gap. Тому на першому екрані з'являється зайва горизонтальна лінія, а заголовок піднімається вище, ніж в еталоні.

**Рекомендація.** Видалити елемент (рядок 33) і правило `.hero_divider` (124–128): затверджений білд цю лінію ніколи не показує. Утиліта `desktop-hide` використовується і в інших секціях, тож її лишити.

**Статус.** ✅ виправлено. Роздільник hero видалено (у Webflow він прихований на всіх ширинах).

#### VP-04 · 🟡 medium · ✅ виправлено

**Нижній відступ hero на планшеті й мобільному 4rem замість 3rem / 1.5rem, тому контент першого екрана вище на 16,5 і 40 px**

`src/components/sections/Hero.astro:84` · стандарт: Візуальний паритет із Webflow (kulbit-gsap.webflow.css: .section padding 4rem / ≤991 3rem / ≤479 1.5rem)

**Проблема.** У Webflow hero отримує padding від `.section`: 4rem, на ≤991 3rem, на ≤479 1.5rem. У нас var(--size-64) без медіа-переозначень. На 768 текстовий блок і кнопка Start Pilot стоять вище на 16,5 px (текст 931.2 проти 947.7, кнопка 1009.1 проти 1025.7), на 390 — на 40 px (576.6 проти 616.6, 692 проти 732). Разом із VP-03 заголовок на коротких телефонах піднімається на 56 px. На 375×667 наш h1 (top 269.3) заходить на кнопку звуку (bottom 282.1), а в еталоні h1 починається на 325.2 і нічого не перекриває.

**Рекомендація.** Додати переозначення padding-bottom у наявні медіаблоки Hero.astro: на ≤991 var(--size-48), на ≤479 var(--size-24).

**Статус.** ✅ виправлено. Нижній відступ hero 64/48/24 (--section-padding-md).

#### VP-06 · 🟡 medium · ✅ виправлено

**На мобільному кнопка Projects у хедері 48 px заввишки з іконкою 24 замість 40 px з іконкою 16, тому лого на 4,5 px нижче**

`src/components/ui/Button.astro:225-228 (+ 87-91; tokens.css:318)` · стандарт: Візуальний паритет із Webflow (kulbit-gsap.webflow.css: .button ≤479 padding .75rem; .icon-24-24-16 ≤479 width 1rem)

**Проблема.** У Webflow на ≤479 `.button { padding: .75rem }`, а іконка кнопки хедера `.icon-24-24-16` має 1rem. Разом це кнопка 40 px з іконкою 16. У нас висота var(--size-48), а `.button_icon` 24 px на всіх ширинах. Кнопка на 8 px вища, play-іконка на 8 px більша. Лого вирівняне по центру ряду, тому опускається на 4,5 px (top 25.9 проти 21.4).

**Рекомендація.** На ≤479 задати type--outline висоту var(--size-40) і зменшити іконку лише для outline. Showreel у футері в Webflow має `.icon-24` (24 px скрізь), тому загальне правило .button_icon не чіпати. У tokens.css:318 --header-height перевести на size-40.

**Статус.** ✅ виправлено. Кнопка Projects на мобільному 40 px з іконкою 16; --header-height мобільний = 40 + 2×16. Hero і хедер збігаються з Webflow до ≤0.5 px (крім прийнятих пропорцій logo.svg).

#### VP-M01 · 🟡 medium · ✅ виправлено

**Попап «rotate phone» для телефона в альбомній орієнтації не портовано: у landscape сайт розвалюється, а у Webflow показується заглушка**

`src/scripts/kulbit/responsive.ts:42-44 (+ src/scripts/kulbit/index.ts:21, src/pages/[...locale]/index.astro:20-32)` · стандарт: Функціональний і візуальний паритет із Webflow (ref.html div.landscape-popup[data-kulbit-landscape-popup]; kulbit-gsap.webflow.css .landscape-popup { position: fixed; inset: 0; z-index: 100; display: none })

**Проблема.** У Webflow є `div.landscape-popup[data-kulbit-landscape-popup]` на весь екран (z-index 100, чорне тло): лого, іконка повороту, «Explore better experience» і «please rotate phone to portrait mode or open the site on a desktop.». Його показує рушій за `(orientation: landscape) and (max-height: 500px) and (pointer: coarse)`. Логіку в нас портовано (responsive.ts), але розмітки на сторінці немає: у dist/index.html 0 входжень data-kulbit-landscape-popup. У index.ts:21 це прямо записано як «LEFT TO PORT». Тому setupLandscape мовчки завершується. На телефоні в альбомній орієнтації (844×390) замість заглушки видно зламаний hero: заголовок обрізаний згори і лежить поверх лого, текст налазить на відео. Навігація і відео при цьому працюють далі, хоча еталон їх вимикає. Цього немає ні в списку прийнятих відмінностей, ні серед TODO.

**Рекомендація.** Створити секцію LandscapePopup.astro з розміткою Webflow і атрибутом `hidden`, який перемикає responsive.ts. Тексти додати в en.ts (ключ landscapePopup), іконку експортувати в src/assets/icons/rotate-phone.svg. Вставити `<LandscapePopup />` у default slot сторінки (у main, не в header-fixed, бо в того є transform). У CSS показувати попап лише через :not([hidden]), бо глобального правила [hidden] у проєкті немає. z-index має бути вищим за .header-fixed (10). Додати секцію на /dev/components.

**Статус.** ✅ виправлено. Див. R-01.

#### VP-05 · ⚪ low · ✅ виправлено

**На планшеті хедер (лого і кнопка Projects) на 8 px вище, ніж у Webflow: --header-padding 16 замість 24**

`src/styles/tokens.css:294` · стандарт: Візуальний паритет із Webflow (kulbit-gsap.webflow.css: .header inset 1.5rem 0 auto, ≤479 top 1rem)

**Проблема.** У Webflow `.header { inset: 1.5rem 0 auto }`, а top 1rem діє лише на ≤479. На планшеті відступ лишається 1.5rem (24,8 px на 768). У нас --header-padding: var(--size-16) стоїть уже в планшетному блоці. Тому на 768 кнопка Projects має top 16.5 замість 24.8, а лого 27.9 замість 35.6: хедер вищий за еталон на 7,7–8,3 px.

**Рекомендація.** Прибрати --header-padding з планшетного блоку, щоб успадкувався десктопний var(--size-24), і додати --header-padding: var(--size-16) у мобільний блок (≤479). --header-height перерахується сам. Він впливає лише на padding-top у .section--hero (utilities.css:98), а контент hero прив'язаний до низу, тож більше нічого не зсунеться.

**Статус.** ✅ виправлено. --header-padding 24 на планшеті, 16 лише ≤479.

#### VP-07 · ⚪ low · ➖ свідомо залишено

**Лого на головній не червоніє при наведенні, а у Webflow червоніє**

`src/components/ui/Logo.astro:49-52` · стандарт: Візуальний паритет із Webflow (.logo:hover, .logo:focus { color: red })

**Проблема.** У Webflow лого — посилання (href="index.html", w--current, cursor pointer), і на hover квадрат стає червоним. У нас на головній лого не має href (свідоме рішення, описане в коментарі Logo.astro:3-5), тому селектор [href] не спрацьовує: квадрат лишається блакитним, курсор звичайний. Сайт односторінковий, тож ефект з еталона втрачено і в хедері, і у футері. У списку прийнятих відмінностей цього немає.

**Рекомендація.** Можна просто внести відмінність до прийнятих рішень. Або на головній зробити лого справжнім елементом керування: наприклад, стрибок до hero через data-target-section="0", як у кнопки Showreel у футері. Тоді hover і focus працюватимуть. Варіант `.logo:hover` без href дає hover-реакцію елементу, на який не можна клікнути, тому він гірший.

До:
```
.logo[href]:hover :global(rect:first-of-type),
  .logo[href]:focus-visible :global(rect:first-of-type) {
    fill: var(--theme-text-brand);
  }
```
Після (приклад):
```
/* option: accept the difference — keep the [href] selectors and add it to the list of deliberate differences;
     or make the home-page logo a control (e.g. data-target-section="0") and extend the selector to it */
  .logo:is([href], [data-target-section]):hover :global(rect:first-of-type),
  .logo:is([href], [data-target-section]):focus-visible :global(rect:first-of-type) {
    fill: var(--theme-text-brand);
  }
```

**Статус.** ➖ свідомо залишено. Лого на головній — поточна сторінка: <a aria-current="page"> без href за правилом проєкту (без self-link), тому без ховера. На 404 лого — справжнє посилання і червоніє (CSS-06).

#### VP-08 · ⚪ low · ✅ виправлено

**На hover кнопки звуку в hero світлішає рамка внутрішнього кола, якої немає в затвердженому білді**

`src/components/sections/Hero.astro:238-241` · стандарт: Візуальний паритет із Webflow (.hero-button-circle.is-second border #fdfcfc1a, без hover-правила)

**Проблема.** У Webflow рамка `.hero-button-circle.is-second` на hover лишається #fdfcfc1a (10 %). У нас вона стає 30 %. У коді цей hover позначено TODO як відсутній у дизайні. Помітно, бо кнопка стоїть у центрі першого екрана, де часто лежить курсор.

**Рекомендація.** Прибрати :hover. Індикатор фокуса вже дає глобальний :focus-visible outline (base.css:66-69), тож правило для фокуса можна лишити або теж прибрати. Інший варіант — погодити hover з клієнтом і зняти TODO.

**Статус.** ✅ виправлено. Ховер кнопки звуку (світліша рамка) прибрано — як у затвердженій збірці; фокус показує глобальне кільце.

#### VP-10 · ⚪ low · ✅ виправлено

**Побічний ефект тимчасового SectionNav: на 390 таб ширший за бічне поле і перекриває 8 px контенту**

`src/components/sections/SectionNav.astro:140-143` · стандарт: Бічний ефект прийнятого рішення (SectionNav) на мобільний макет

**Проблема.** На ≤479 бічне поле контейнера 16 px, а непрозорий таб 24 px, тож він закриває 8 px правого краю контенту у своїй смузі (y 378–434 на 390×812). Там опиняються кінці рядків, правий край карток і кома «TECH,» в Our Clients. На 768 (таб 33.03 = поле 33.03) і на 1920 (32 проти 85) перекриття немає. SectionNav — прийнятий тимчасовий дизайн, але перекриття — реальний побічний ефект.

**Рекомендація.** До макета дизайнера звузити таб на ≤479 до ширини поля (16 px). Висота 56 px лишається, а біля краю екрана немає сусідніх цілей, тож WCAG 2.5.8 проходить за винятком spacing, хоча таб стає вузьким для пальця. Інший варіант — залишити 24 px і записати перекриття в TODO тимчасового дизайну, щоб дизайнер врахував його в макеті.

**Статус.** ✅ виправлено. Див. R-06.

## Зведений чекліст

### 🟠 high

- [x] **SEM-01** Scramble і typewriter спустошують <h2> і заяви: скрінрідер отримує 5 порожніх заголовків, а під час анімації — випадкові літери — ✅ виправлено
- [ ] **SEM-02** Стан анімації визначає дерево доступності: після першого жесту зникає <h1>, а картки послуг, етапів і порівняння доступні скрінрідеру лише поки їхня секція поточна — 🟢 виправлено частково
- [x] **SEM-M1** Tab веде фокус на кнопки невидимих секцій: рушій не показує секцію, де опинився фокус — ✅ виправлено
- [x] **A11Y-01** Tab веде фокус у невидимі секції: під поточною або за межами екрана — ✅ виправлено
- [ ] **A11Y-03** Сірий текст #404040 на #000: контраст 2.03:1 у 6 компонентах — ⏸ потребує рішення клієнта / дизайнера
- [ ] **A11Y-04** При 200 % zoom, збільшеному шрифті і в альбомній орієнтації контент назавжди обрізаний — ➖ свідомо залишено
- [x] **CSS-01** Tab переводить фокус у секції поза екраном — `overflow: clip` обгортки ховає сфокусований контрол — ✅ виправлено
- [x] **JS-03** Tab веде фокус у невидимі секції (2, 4, 6, 8), а Enter запускає там відео зі звуком — ✅ виправлено
- [x] **R-01** Немає ландшафтного попапа: телефон в альбомній орієнтації показує поламаний hero (у Webflow — заглушка «Explore better experience») — ✅ виправлено
- [x] **VP-01** У заголовку hero немає нерозривного пробілу «AI Dimension», тому рядки переносяться не так, як у Webflow — ✅ виправлено

### 🟡 medium

- [x] **SEM-03** Traditional: дві групи порівняння в одному <dl> під одним <h3>, текст якого підміняє скрипт — ✅ виправлено
- [x] **A11Y-02** Фокус прокручує обрізані контейнери з overflow: hidden і ламає макет Projects і футера — ✅ виправлено
- [x] **A11Y-05** Контент кроків усередині секції прихований від AT, а скрінрідер на телефоні не може зробити крок — ✅ виправлено
- [x] **A11Y-06** Відео hero і послуг запускаються самі й крутяться по колу без кнопки паузи — ✅ виправлено
- [x] **A11Y-07** Scramble очищує заголовки й абзаци секцій, до яких ще не дійшли — ✅ виправлено
- [x] **A11Y-08** Фіксована піксельна висота scramble-текстів обрізає текст при text-spacing — ✅ виправлено
- [x] **A11Y-09** Після старту відео проєкту фокус губиться в BODY — ✅ виправлено
- [ ] **A11Y-16** На сенсорних екранах кроки всередині секції доступні лише свайпом: немає альтернативи одним дотиком — ⏸ потребує рішення клієнта / дизайнера
- [x] **SEO-01** На головній немає og:image: соцпревʼю без картинки, twitter:card падає до «summary» — ✅ виправлено
- [x] **SEO-02** Немає сторінки 404: на продакшені невідомий URL віддає порожню 404 (білий екран) — ✅ виправлено
- [x] **PERF-01** Зображення прихованих stacked-секцій і постери сервісних відео вантажаться eager при старті й відбирають канал у hero-відео — ✅ виправлено
- [x] **PERF-02** Три радарні SVG по 368–373 KB вантажаються на кожному пристрої (два приховані display:none); файли — сирі Figma-експорти, а `<Image>` дублює їх у srcset — ✅ виправлено
- [x] **PERF-04** При prefers-reduced-motion (і без JS) hero-відео буферизує ≈5 MB, хоча ніколи не запускається — ✅ виправлено
- [x] **HV-01** Scramble стирає h2 і тексти секцій у DOM: одразу після завантаження в дереві доступності 5 порожніх заголовків — ✅ виправлено
- [x] **HV-02** 24 елементи <source> з width-дескрипторами без sizes: невалідний HTML і завеликі завантаження — ✅ виправлено
- [x] **HV-03** Фони радара: <Image> для SVG дає srcset з однакових копій, і всі три брейкпоінтні файли вантажаться на кожному пристрої — ✅ виправлено
- [x] **HV-M1** Tab переводить фокус у невидимі секції: 6 з 10 зупинок фокуса поза екраном, а рушій не підтягує секцію — ✅ виправлено
- [x] **CSS-02** Scoped `outline` на `.section-nav_tab` прибирає глобальне кільце :focus-visible — ✅ виправлено
- [x] **CSS-05** Лінію прогресу секції (.section-progresbar) реалізовано 5 разів замість одного ui-компонента — ✅ виправлено
- [x] **JS-01** Анімації, що вже летять, переживають зміну брейкпойнта: застарілі onComplete вбивають навігацію (WorkingProcess) і ламають tablet hero — ✅ виправлено
- [x] **JS-02** WorkingProcess enter() безумовно ставить isAnimating = true, а знімає його тільки onComplete reveal, який може вже не настати — ✅ виправлено
- [x] **JS-04** Space і PageDown на слайдері Seek гортають Projects і скидають відео, яке саме грає — ✅ виправлено
- [x] **JS-05** Resize у межах того самого брейкпойнта не переприкладає px-стан контролерів: рядок Our Services зсунутий, картки Projects обрізані — ✅ виправлено
- [x] **JS-06** Після resize scramble заново будує тексти і повертає вже згорнутий заголовок Our Services — ✅ виправлено
- [x] **JS-07** Рушій ігнорує prefers-reduced-motion: слайди на весь екран лишаються, reveal WorkingProcess блокує жести на ~3 с — ✅ виправлено
- [x] **JS-08** Немає розмітки [data-kulbit-landscape-popup]: логіка телефону в landscape мовчки вимкнена, секції обрізані, меню переповнене — ✅ виправлено
- [x] **JS-M1** Фокус на закритій картці Projects прокручує колонку (overflow: hidden): перша картка назавжди обрізана на 87 px — ✅ виправлено
- [x] **JS-M2** Scramble стирає тексти заголовків у DOM: для скрінрідерів h2 секцій 1–4 і 6 порожні, доки секція не на екрані — ✅ виправлено
- [x] **R-02** Секції 1–7 мають висоту 100vh, а видима область на мобільному менша: низ секцій ховається під панелями браузера (успадковано з Webflow) — ✅ виправлено
- [ ] **R-03** Десктоп у вікнах, ширших за 16:9 (1366x625, 1536x730, 1920x900–940): обрізано картку OurServices, картку WorkingProcess і таблицю Traditional (успадковано) — ⏸ потребує рішення клієнта / дизайнера
- [ ] **R-04** Короткі телефони (320x568, 360x640, 375x667): обрізано розкритий рядок таблиці Traditional і низ картки OurServices (успадковано; OurServices у нас на 18 px гірше через довший реальний текст картки 3) — ⏸ потребує рішення клієнта / дизайнера
- [ ] **R-05** Планшети 768–991 (портрет): картка OurServices виходить за екран на кожному кроці (11–218 px, до першого жесту — до 412 px; успадковано) — ⏸ потребує рішення клієнта / дизайнера
- [x] **R-06** Вкладка бічної панелі перекриває текст на телефонах: «AI» в hero (320–375), кінці рядків абзацу About у футері (390/414) — ✅ виправлено
- [ ] **R-M1** Стрибок масштабу на брейкпоінтах 991/992 і 479/480: десктопна верстка на 992–1280 (iPad у ландшафті, малі ноутбуки) має текст 8–11 px, планшетна на 480–600 — 7.7–10 px (успадковано) — ⏸ потребує рішення клієнта / дизайнера
- [x] **VP-02** На планшеті заголовок hero займає всю ширину контейнера (702 px) замість 36.88rem (609 px) — ✅ виправлено
- [x] **VP-03** Роздільник hero видно на планшеті й мобільному, хоча у Webflow його не видно на жодній ширині — ✅ виправлено
- [x] **VP-04** Нижній відступ hero на планшеті й мобільному 4rem замість 3rem / 1.5rem, тому контент першого екрана вище на 16,5 і 40 px — ✅ виправлено
- [x] **VP-06** На мобільному кнопка Projects у хедері 48 px заввишки з іконкою 24 замість 40 px з іконкою 16, тому лого на 4,5 px нижче — ✅ виправлено
- [x] **VP-M01** Попап «rotate phone» для телефона в альбомній орієнтації не портовано: у landscape сайт розвалюється, а у Webflow показується заглушка — ✅ виправлено

### ⚪ low

- [x] **SEM-04** Переходи до секцій зроблено через <button>, а не посилання на якір; у секцій немає id — ✅ виправлено
- [x] **SEM-05** Hero: одне речення заяви розбите на три <p> і в DOM стоїть після CTA — ✅ виправлено
- [ ] **SEM-06** Working process: легенда і тижні діаграми читаються без самої діаграми — ⏸ потребує рішення клієнта / дизайнера
- [ ] **SEM-07** Our Services: пари «Timeline: …» і «Specs: …» розмічено абзацами замість <dl> — ➖ свідомо залишено
- [x] **SEM-08** Дві кнопки «Play video» мають однакову назву — ✅ виправлено
- [x] **SEM-09** Текст: «Costs.Crew» без пробілу, речення без крапки перед <br>, ASCII-дефіс у діапазонах тижнів — ✅ виправлено
- [x] **SEM-M2** id попапу гучності генерується Math.random: нестабільні id при кожній збірці — ✅ виправлено
- [x] **A11Y-10** Кнопка гучності на ≤ 991 px вимикає звук, але оголошує себе як згорнутий попап — ✅ виправлено
- [x] **A11Y-11** Фокус на вкладці меню видно лише як зміну кольору 12-піксельного трикутника — ✅ виправлено
- [x] **A11Y-12** PageDown/PageUp/Space на слайдерах плеєра гортають секцію з-під фокусу — ✅ виправлено
- [x] **A11Y-13** Попап гучності не закривається по Esc і лишається відкритим після виходу фокусу — ✅ виправлено
- [x] **A11Y-14** prefers-reduced-motion не впливає на GSAP-переходи секцій і кроків — ✅ виправлено
- [x] **A11Y-15** axe і Lighthouse через overflow: hidden на html не перевіряють контраст і дають хибні 100 — ✅ виправлено
- [x] **SEO-03** Сайт, закритий noindex назавжди, публікує sitemap.xml, рядок Sitemap і llms.txt/llms-full.txt, а валідатор цього не бачить — ✅ виправлено
- [ ] **SEO-04** http://kulbit.site/ віддає сайт по HTTP: немає редиректу на HTTPS і немає HSTS — 🟢 виправлено частково
- [x] **SEO-05** Title і description не відповідають правилам /seo: 40 і 93 символи, description копіює абзац hero — ✅ виправлено
- [x] **SEO-06** .txt файли віддаються без charset, llms-full.txt показує «кракозябри» у браузері — ✅ виправлено
- [x] **SEO-07** Вузол Organization у JSON-LD мінімальний: немає description і logo, хоча обидва видимі — ✅ виправлено
- [x] **SEO-08** Немає <meta name="theme-color"> для повністю чорного сайту — ✅ виправлено
- [x] **SEO-09** Видима помилка «High Fixed Costs.Crew» (злиплі слова), яка потрапляє і в текстові файли — ✅ виправлено
- [x] **SEO-10** CLAUDE.md і /prelaunch досі кажуть прибрати X-Robots-Tag при запуску — суперечить постійному noindex — ✅ виправлено
- [x] **SEO-11** Хибний коментар у public/_headers: «Only one rule per path is applied» — насправді Cloudflare зливає всі правила, що збіглися — ✅ виправлено
- [ ] **PERF-05** Hero-відео (75–82 % ваги сторінки) віддається лише в H.264; AV1-джерело економить ≈26–33 % байтів — ⏸ потребує рішення клієнта / дизайнера
- [x] **PERF-06** Сервісні відео: на десктопах з DPR 1 обирається 1080-файл, хоча картка рендериться меншою за 720p-кадр — ✅ виправлено
- [x] **HV-04** Одне ім’я класу — різні стилі в різних компонентах (text-size-16, text-size-16/16/13, text-size-16/16/14); у SectionNav ім’я не відповідає CSS — ✅ виправлено
- [x] **HV-05** Прогрес-лінія секції зібрана вручну в 5 компонентах, а JS-хелпери до неї скопійовані 3 рази — порушення «reuse first» — ✅ виправлено
- [x] **HV-06** getImage() для постерів генерує невикористані srcset-файли (~730 KB мертвого виводу) — ✅ виправлено
- [x] **HV-07** Булеві data-атрибути, передані через компоненти, рендеряться як ="true" — ✅ виправлено
- [x] **HV-08** Id попапа гучності будується з Math.random(), тож HTML недетермінований між збірками — ✅ виправлено
- [x] **HV-09** Один <dl> з повторюваними <dt> для двох різних груп порівняння — ✅ виправлено
- [x] **HV-10** Документаційний HTML-коментар шаблону потрапляє в <head> кожної сторінки — ✅ виправлено
- [x] **HV-11** tsconfig: baseUrl застарілий у TypeScript 6, і звичайний tsc падає з TS5101 — ✅ виправлено
- [x] **HV-12** Мертві гілки й оманлива назва константи в скрипті TraditionalProduction — ✅ виправлено
- [x] **HV-13** Атрибут data-kulbit-project-end ніхто не читає — ✅ виправлено
- [ ] **HV-14** У dist 154 конфліктні копії iCloud («… 2.js», «… 3.avif»), вони є й у .git: проєкт лежить на синхронізованому Desktop — 🟢 виправлено частково
- [x] **HV-15** src/dev/inventory.md — незаповнений шаблон, тож /systemize не має бази; шаблонна типографіка й button-токени ніде не використовуються — ✅ виправлено
- [ ] **HV-16** Шаблонні motion/Lenis і hiding header не використовуються (сторінка на steps), але збираються й лежать у залежностях — ➖ свідомо залишено
- [x] **HV-17** Застарілі описи: брейкпоінти tablet-hero у правилах і hero.ts, «eight screens» у SectionNav, TODO біля заповненого name — ✅ виправлено
- [x] **CSS-03** Одна довільна назва класу — різні визначення в різних компонентах (text-size-16, text-size-16/16/13, text-size-16/16/14) — ✅ виправлено
- [x] **CSS-04** SectionNav: text-size-16/16/13 без мобільного правила — на телефоні 16 px замість 13 — ✅ виправлено
- [x] **CSS-06** Мертвий :global-селектор логотипа: svgo перетворює <rect> на <path>, тож hover квадрата не спрацьовує — ✅ виправлено
- [x] **CSS-07** CSS Lenis вбудовується в сторінку, хоча motion.ts не завантажується (сторінка працює на steps) — ✅ виправлено
- [x] **CSS-08** .theme--dark: на сайті не використовується, розбитий на два правила, значення не з дизайну Kulbit — ✅ виправлено
- [x] **CSS-09** Залишки шаблону в utilities.css, які цей проєкт не використовує (≈14 KB мертвого CSS до мініфікації) — ✅ виправлено
- [x] **CSS-10** tokens.css містить невикористані токени шаблону й застарілий коментар, а inventory.md не описує реальну базу — ✅ виправлено
- [x] **CSS-11** Transition поза motion-токенами (Square, картки OurClients) — ✅ виправлено
- [x] **CSS-12** Element-класи, що дають лише те, що вже є в утиліті (site-header_row, projects_head) — ✅ виправлено
- [x] **CSS-13** space-between без мінімального gap (spacing-0/… і scoped justify-content) — ✅ виправлено
- [x] **CSS-14** Прозора смуга хедера перехоплює вказівник над верхом кожної секції; z-index плеєра без ізоляції — ✅ виправлено
- [x] **CSS-15** Вхід для /systemize: сирі значення, що дорівнюють наявним примітивам або базовим кольорам, і округлення Webflow — ✅ виправлено
- [x] **CSS-16** Вхід для /systemize: однакові довільні класи, скопійовані між компонентами — ✅ виправлено
- [ ] **CSS-17** Hero: вертикальний padding задано scoped-правилом на корені секції — ➖ свідомо залишено
- [x] **CSS-M01** Висота футера захардкоджена під padding .footer з utilities.css — три копії значень у двох файлах — ✅ виправлено
- [x] **JS-09** Resize на кроці 2 tablet hero прибирає прев'ю секції 1 під смугою 16:9 — ✅ виправлено
- [x] **JS-10** Стрибок із меню з секції 1 на Hero на tablet/mobile: секція зникає миттєво, без слайду — ✅ виправлено
- [x] **JS-11** goToSectionStep і гілка data-target-step нічим не використовуються і обходять контракт рушія — ✅ виправлено
- [x] **JS-12** Помилка в одному секційному білдері зупиняє всю перебудову: try/catch є лише навколо першого виклику — ✅ виправлено
- [x] **JS-M3** Документація брейкпойнтів рушія застаріла: правило і hero.ts кажуть 768–991 / «480–767 nothing», а код будує tablet hero на 480–991 — ✅ виправлено
- [x] **R-07** Бічна панель на низьких екранах: перший пункт («HERO») обрізаний зверху, і до нього не доскролити — ✅ виправлено
- [x] **R-09** Заголовок hero: «AI Dimension» рветься на «…X AI / DIMENSION» на телефонах і планшетах (у Webflow — нерозривний пробіл) — ✅ виправлено
- [x] **R-M2** Документація движка суперечить коду: правило й коментар hero.ts кажуть «планшетний hero 768–991, 480–767 нічого», а код реєструє 480–991 — ✅ виправлено
- [x] **VP-05** На планшеті хедер (лого і кнопка Projects) на 8 px вище, ніж у Webflow: --header-padding 16 замість 24 — ✅ виправлено
- [ ] **VP-07** Лого на головній не червоніє при наведенні, а у Webflow червоніє — ➖ свідомо залишено
- [x] **VP-08** На hover кнопки звуку в hero світлішає рамка внутрішнього кола, якої немає в затвердженому білді — ✅ виправлено
- [x] **VP-10** Побічний ефект тимчасового SectionNav: на 390 таб ширший за бічне поле і перекриває 8 px контенту — ✅ виправлено

## Примітка про номери рядків

Номери рядків і фрагменти коду в знахідках — зі стану на момент аудиту (коміт `f81ed5f`). Після систематизації та виправлень файли змінились: шукайте за назвою класу, атрибута чи функції з фрагмента.
