/**
 * Schema.org entity graph, emitted by BaseLayout as one JSON-LD <script> per page.
 *
 *   siteNodes()  the site-wide nodes, defined once: the entity behind the site (Person or
 *                Organization from src/data/site.ts), its portrait/logo, and the WebSite.
 *   pageNodes()  the current page: WebPage (+ its primary image) pointing at the site-wide
 *                nodes by `@id`. A page may pass extra nodes (e.g. a Service) and name one of
 *                them as the WebPage's mainEntity: <BaseLayout schema={{ nodes, mainEntityId }}>.
 *
 * `@id` scheme: `{site}/#person|#organization|#portrait|#logo|#website`,
 *               `{page}#webpage|#primaryimage|#breadcrumb|#service…`.
 * Rules: every value must be visible on the site — no invented addresses, prices, reviews or FAQ;
 * `sameAs` only from real profile links. Validate with `pnpm seo` after `pnpm build`
 * (rules and node shapes per page type: .claude/skills/seo/SKILL.md).
 */
import { getImage } from 'astro:assets';
import { site } from '@/data/site';
import { builtLocales, defaultLocale, localeMeta, localized, type Locale } from '@/i18n';

export type SchemaNode = Record<string, unknown>;

const isPerson = site.schema.type === 'Person';

/** Networks whose link is a profile page and therefore identifies the entity (`sameAs`). A messenger
 *  chat link (wa.me/<number>, viber://…) opens a conversation, identifies no profile and stays out. */
const profileNetworks = ['telegram', 'instagram', 'facebook', 'linkedin', 'youtube'] as const;
/** Every OG image is written 1200×630 by scripts/build-og.mjs (WIDTH/HEIGHT there — keep in sync) */
const ogImageSize = { width: 1200, height: 630 };

/** @id of every site-wide node, built from the production origin (`site` in astro.config.mjs) */
export const siteIds = (origin: URL) => ({
  entity: new URL(isPerson ? '/#person' : '/#organization', origin).href,
  image: new URL(isPerson ? '/#portrait' : '/#logo', origin).href,
  website: new URL('/#website', origin).href,
});

/**
 * Site-wide nodes, defined exactly once per page. Their `@id`s are the same in every language (one
 * entity), but the texts are those of the page's own language — on an English page the graph must say
 * what the page says.
 */
export async function siteNodes(origin: URL, locale: Locale = defaultLocale): Promise<SchemaNode[]> {
  const id = siteIds(origin);
  const name = localized(site.name, locale);
  const location = localized(site.location, locale);
  const jobTitle = localized(site.schema.jobTitle, locale);
  const description = localized(site.schema.description, locale);
  const image = site.schema.image && (await getImage({ src: site.schema.image, width: 768, format: 'jpg' }));
  const sameAs = profileNetworks.map((network) => site.socials[network]).filter((href): href is string => /^https?:\/\//.test(href ?? ''));

  const entity: SchemaNode = {
    '@type': site.schema.type,
    '@id': id.entity,
    name,
    ...(!isPerson && site.legalName && { legalName: site.legalName }),
    url: origin.href,
    ...(description && { description }),
    ...(isPerson && jobTitle && { jobTitle }),
    ...(image && { [isPerson ? 'image' : 'logo']: { '@id': id.image } }),
    ...(site.phone && { telephone: site.phone.replace(/[\s()-]/g, '') }),
    ...(site.email && { email: site.email }),
    ...(site.languages.length > 0 && { knowsLanguage: site.languages }),
    ...(location && { [isPerson ? 'workLocation' : 'location']: { '@type': 'Place', name: location } }),
    ...(sameAs.length > 0 && { sameAs }),
  };

  const nodes: SchemaNode[] = [entity];
  if (image) {
    nodes.push({
      '@type': 'ImageObject',
      '@id': id.image,
      url: new URL(image.src, origin).href,
      width: image.attributes.width,
      height: image.attributes.height,
      caption: name,
    });
  }
  nodes.push({
    '@type': 'WebSite',
    '@id': id.website,
    name,
    url: origin.href,
    publisher: { '@id': id.entity },
    copyrightHolder: { '@id': id.entity },
    copyrightYear: site.copyrightYear,
    inLanguage: builtLocales.length === 1 ? localeMeta[builtLocales[0]].lang : builtLocales.map((locale) => localeMeta[locale].lang),
  });
  return nodes;
}

export interface Breadcrumb {
  name: string;
  /** absolute URL or a site-relative path ("/services/") */
  url: string;
}

export interface PageSchema {
  site: URL;
  url: URL;
  title: string;
  description?: string;
  lang: string;
  /** WebPage subtype when one fits the page: a listing is a CollectionPage, an "about" page an AboutPage … */
  type?: 'WebPage' | 'CollectionPage' | 'AboutPage' | 'ContactPage' | 'FAQPage';
  ogImageUrl?: string;
  /** @id of the page's main entity (a page-scoped node passed alongside), e.g. `${url}#service` */
  mainEntityId?: string;
  /** the page's trail from the home page to itself, inner pages only (the home page passes none) */
  breadcrumbs?: Breadcrumb[];
}

/** The current page: its WebPage (and primary image) pointing at the site-wide nodes */
export function pageNodes({ site: origin, url, title, description, lang, type = 'WebPage', ogImageUrl, mainEntityId, breadcrumbs }: PageSchema): SchemaNode[] {
  const id = siteIds(origin);
  const pageId = `${url.href}#webpage`;
  const imageId = `${url.href}#primaryimage`;
  const breadcrumbId = `${url.href}#breadcrumb`;
  const trail = breadcrumbs?.length ? breadcrumbs : undefined;
  const nodes: SchemaNode[] = [
    {
      '@type': type,
      '@id': pageId,
      url: url.href,
      name: title,
      ...(description && { description }),
      isPartOf: { '@id': id.website },
      about: { '@id': id.entity },
      ...(mainEntityId && { mainEntity: { '@id': mainEntityId } }),
      ...(ogImageUrl && { primaryImageOfPage: { '@id': imageId } }),
      ...(trail && { breadcrumb: { '@id': breadcrumbId } }),
      inLanguage: lang,
    },
  ];
  if (ogImageUrl) {
    const generated = new URL(ogImageUrl, origin).pathname.startsWith('/og/');
    nodes.push({ '@type': 'ImageObject', '@id': imageId, url: ogImageUrl, ...(generated && ogImageSize) });
  }
  if (trail) {
    nodes.push({
      '@type': 'BreadcrumbList',
      '@id': breadcrumbId,
      itemListElement: trail.map((crumb, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: crumb.name,
        item: new URL(crumb.url, origin).href,
      })),
    });
  }
  return nodes;
}
