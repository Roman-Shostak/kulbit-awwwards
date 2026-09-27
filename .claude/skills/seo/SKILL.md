---
name: seo
description: Write and validate the SEO of a page to current best practice — <title> (50–60 chars, subject first, brand last), meta description (120–160 chars, unique, human), lang/canonical/Open Graph through BaseLayout, and the Schema.org graph (Person/Organization, WebSite, WebPage, BreadcrumbList, Service, Article, FAQPage, LocalBusiness — only from visible content) — then run the validator. Use when the user asks for SEO, meta tags, title/description, schema, JSON-LD or structured data for a page or the site.
argument-hint: "<page path, e.g. src/pages/index.astro>"
---

# SEO for one page (title, description, structured data)

Input: the page file (`$ARGUMENTS`, default `src/pages/[...locale]/index.astro`). Output: `title`, `description`
(in the default language's dictionary `src/i18n/<lang>.ts` → `pages.<page>`; other languages only from the client's translations), `ogImage`, `schema` on `BaseLayout`; page-scoped nodes in
the page frontmatter; `pnpm build && pnpm seo` with 0 errors; a report of what is still missing.

The layout already renders canonical, Open Graph, Twitter card, favicons, the skip link and the
site-wide graph (`src/data/schema.ts`: Person/Organization, portrait/logo, WebSite, this page's
WebPage + BreadcrumbList). This skill writes the per-page part and checks the whole.

## 1. Read before writing
Read the page and every section it renders, `src/data/site.ts`, `src/data/schema.ts`, and
`astro.config.mjs` (`site` must be set — without it nothing absolute can be built: stop and ask). While the
client has no domain, `site` is the address where the site really opens now (`https://<project>.<account>.workers.dev`,
`*.pages.dev`, `*.vercel.app`, `*.netlify.app`) with a `TODO` — never `example.com`: link previews load `og:image`
from that host and `pnpm seo` fails on a placeholder host. Ask for that address together with the domain.
Collect: the `<h1>`, what the page offers and to whom, the visible name/brand, prices, dates,
addresses, reviews, FAQ, images — **only things that are on the page**.

## 2. `<title>` — rules
- **50–60 characters** including spaces (the validator warns above 60, fails above 70). Shorter is fine; longer is cut in the results.
- **Subject first, brand last**: `<what the page is> — <qualifier> | <Brand>`. Home page: `<Brand> — <what it offers, for whom>`. Inner pages: `Ціни на консультації | <Brand>`.
- Unique per page; the same intent as the `<h1>` (not necessarily the same words); the main phrase people would search for, written naturally.
- Site language; sentence case (no ALL CAPS); one separator style (`|` or `—`) across the site; no emoji, no keyword lists, no "Home", "Головна", "Untitled", no repeated brand.

## 3. Meta description — rules
- **120–160 characters** (the validator warns below 70 and above 160). One or two full sentences, active voice.
- Says what the page offers, for whom, and why it matters (a benefit or a call to action); contains the main phrase naturally; adds something the title does not.
- Unique per page, never a copy of the title or the first paragraph, no double quotes inside (they break the attribute), no "Ласкаво просимо на сайт".
- Search engines may rewrite it — write for the person reading the result, not for the crawler.

## 4. Head data through the layout
- `<BaseLayout title="…" description="…" ogImage="/og/<page>.jpg" schema={{ … }}>`; `lang`, `og:locale` and `hreflang` come from the page's language (`src/i18n`), do not pass `lang`; `noindex` for pages that must not rank (thank-you, dev).
- `ogImage` 1200×630 for every page that can be shared (`src/assets/og/<page>.jpg`); the home page's is mandatory.
- Exactly one `<h1>` on the page; headings in order (`markup.md`).

## 5. Structured data — what goes into the graph
`schema.ts` emits one `@graph` per page with stable `@id`s: `{site}/#person|#organization`,
`{site}/#portrait|#logo`, `{site}/#website`, `{page}#webpage`, `{page}#primaryimage`,
`{page}#breadcrumb`; page-scoped nodes use `{page}#service`, `{page}#article`, `{page}#faq` …
Rules that never bend: **every value is visible on the page or given by the client**; no invented
address, opening hours, prices, ratings, reviews, founding date, awards or social profiles;
absolute URLs only; dates in ISO 8601; `inLanguage` = the page language; one node per real thing.

- **Entity** (`site.ts` → `schema.type`): `Person` for a site about one specialist (`jobTitle`, `description`, `image`, `knowsLanguage`, `sameAs` from real profiles, `workLocation` only if the city is on the site); `Organization` for a company (`legalName` from `site.legalName` when the legal entity is printed on the site, e.g. the footer copyright "© 2026 Brand Inc."; `logo`, `sameAs`, `contactPoint` only with a visible phone/e-mail). `LocalBusiness` (or a subtype such as `MedicalBusiness`, `LegalService`, `BeautySalon`) **only** when a physical address is shown on the site — then `address` (PostalAddress), `telephone`, `openingHoursSpecification` and `geo` exactly as displayed; never `aggregateRating`/`review` written by the site owner (self-serving reviews violate Google's policy).
- **WebSite**: `name`, `url`, `publisher`, `inLanguage` (automatic). `potentialAction` SearchAction only if the site has a search.
- **WebPage** (automatic): `name` = title, `description`, `isPartOf`, `about`, `primaryImageOfPage`, `breadcrumb`, `mainEntity` = the page's main node. Subtypes when they fit, passed as `schema={{ type: 'CollectionPage' }}`: `CollectionPage` (a listing of services / programs / posts), `AboutPage`, `ContactPage`, `FAQPage` (see below).
- **BreadcrumbList** (automatic from `schema.breadcrumbs`): every inner page passes its trail `[{ name: 'Головна', url: '/' }, { name: 'Послуги', url: '/services/' }, { name: '<this page>', url: '/services/x/' }]`; the home page passes none. The trail repeats the URL segments: a level in the breadcrumbs that the address does not have is a finding — the page moves into its parent's folder (`astro-components.md` → Files & naming), the mismatch is never left. `pnpm seo` warns about an inner page without breadcrumbs.
- **Service** for an offering (`name`, `serviceType`, `description` from the page copy, `provider` → the entity, `areaServed`/`availableLanguage` if stated, `offers` only with a visible price: `{ '@type': 'Offer', price, priceCurrency, availability }`). One Service per distinct offering on the page; several → `OfferCatalog` only if the page is a catalogue.
- **Product** only for a physical/digital product with a visible price; `Course`/`Event` for a course/event with visible dates (`startDate`, `endDate`, `location` or `VirtualLocation`, `organizer`).
- **Article / BlogPosting** for editorial pages: `headline` (≤ 110 chars), `description`, `image`, `datePublished`, `dateModified`, `author` → the Person id, `publisher` → the entity id, `mainEntityOfPage` → the WebPage id, `inLanguage`, `wordCount` optional.
- **FAQPage** only when the page shows a real FAQ (question + full answer visible, ideally `<details>`): `mainEntity: [{ '@type': 'Question', name, acceptedAnswer: { '@type': 'Answer', text } }]`, text = the visible answer, no marketing extras. Not for a list of services or benefits.
- **Review / AggregateRating** only with real, individually attributed reviews shown on the page and never on the site owner's own entity.
- **ImageObject**: absolute `url`, `width`/`height`, `caption` — the portrait/logo and the page's primary image (automatic).
- Not worth adding: `SiteNavigationElement`, `WPHeader`/`WPFooter`, `Thing` placeholders, duplicated `Organization` + `Person` for the same subject, nodes for every button.

## 6. Write
1. Fill `site.ts` (`schema.type`, `legalName`, `jobTitle`, `description`, `image`) only from visible/provided data.
2. Set `title`, `description`, `ogImage`, `schema={{ nodes, mainEntityId, breadcrumbs }}` on the page. Page nodes are plain objects in the frontmatter with `@id`s from `pageUrl` (see the pattern in `src/data/schema.ts`), `provider`/`author` referencing `siteIds(site).entity`.
3. Keep the visible content untouched (SEO never rewrites sections).

## 7. Validate and report
- `pnpm build && pnpm seo` (no pipe) — 0 errors before committing. The validator checks every built page: title/description presence, length, uniqueness and placeholders, one `<h1>`, `lang`, canonical, Open Graph, `noindex` pages, `robots.txt`, and the JSON-LD graph (types, absolute `@id`s, dangling references, empty/TODO values, names/urls, ImageObject urls, breadcrumb positions).
- Paste the graph into https://validator.schema.org and https://search.google.com/test/rich-results once per page type; fix what they flag.
- Report: title and description with their lengths, node types added, and the data that could not be filled (missing image, socials, address, prices) as questions for the client — never as guesses.

## Do not
- Do not build anything the user did not name in this request.
- Invent facts: no address, ratings, prices, FAQ, founding date, awards or social links that are not on the site or given by the client.
- Duplicate the site-wide nodes in a page (they come from `siteNodes()`); reference them by `@id`.
- Add a second JSON-LD script, third-party SEO integrations or keyword meta tags.
- Change section content while writing SEO data.
- Exceed the lengths "to fit more keywords"; write for people.
