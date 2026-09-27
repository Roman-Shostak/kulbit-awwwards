/**
 * Site-wide data — the single place for the client's name, contacts and socials.
 * BaseLayout (og:site_name), the header, the footer and src/data/schema.ts read
 * from here, so one edit updates every page. Fill in only what the client provided and leave the
 * rest empty: nothing here may be invented. An empty TEXT contact (a phone line in the footer) is
 * not rendered; a contact the design draws as an element (icon row, messenger button) is rendered
 * with `href` undefined + a TODO so the section keeps its design height until the data arrives.
 * The site languages (<html lang>, og:locale, the texts) live in src/i18n/. A value that differs per
 * language (name, location, jobTitle, description) is `Localized`: a string for a one-language site,
 * `{ uk: '…', en: '…' }` when the site has several — `localized(value, Astro.currentLocale)` reads it.
 */
import type { ImageMetadata } from 'astro';
import type { Localized } from '@/i18n';

export const site = {
  /** Client or brand name: og:site_name, Schema.org name; a string or one per language. TODO */
  name: 'Kulbit' as Localized,
  /** Legal entity as written on the site (the footer copyright: "Brand Inc."); Schema.org legalName. Empty = `name` */
  legalName: '',
  /** Contacts exactly as they appear on the site. TODO */
  phone: '',
  email: '',
  /** City / "online", as written in the footer; a string or one per language */
  location: '' as Localized,
  /** Languages the client works in, e.g. ['uk', 'en'] (Schema.org knowsLanguage) */
  languages: [] as string[],
  /** Real links only (`https://…`, or an app scheme such as `viber://chat?number=…`); absent links are not rendered.
   * Schema.org `sameAs` takes only the profile networks (telegram, instagram, facebook, linkedin, youtube):
   * a messenger chat link (wa.me, viber://) opens a conversation and identifies no profile. */
  socials: {} as Partial<Record<'telegram' | 'whatsapp' | 'viber' | 'instagram' | 'facebook' | 'linkedin' | 'youtube', string>>,
  /** The build year; set a fixed number if the client wants one */
  copyrightYear: new Date().getFullYear(),
  /** Schema.org entity behind the site (src/data/schema.ts) */
  schema: {
    type: 'Organization' as 'Person' | 'Organization',
    /** Person only, as written on the site (e.g. the hero tagline); a string or one per language */
    jobTitle: '' as Localized,
    /** One paragraph that is visible on the site (e.g. the "about" lead); a string or one per language */
    description: '' as Localized,
    /** Portrait (Person) or logo (Organization): `import portrait from '@/assets/hero/portrait.jpg'` and set it here */
    image: undefined as ImageMetadata | undefined,
  },
};
