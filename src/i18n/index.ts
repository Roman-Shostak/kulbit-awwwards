/**
 * Languages of the site. The visitor chooses the language by hand (a language switcher); nothing
 * detects it from the browser.
 *
 *   <default>  /        the default language, no prefix
 *   <other>    /<lang>/…
 *
 * TODO: the site languages from the start kit — `locales`, `defaultLocale`, `localeMeta` and one
 * dictionary file per language (the default language's dictionary is the reference shape).
 * `locales` and `defaultLocale` repeat `i18n` in astro.config.mjs — keep both identical.
 * Texts: one dictionary per language, one key per component; sections default their props to
 * `useTranslations(Astro.currentLocale).<component>`. A language gets pages (and hreflang links) only
 * when its dictionary is registered below: the translations come from the client, never from a
 * machine translation. The language base is here even for a one-language site, so a second
 * language is a dictionary, not a refactor.
 * Pages live in src/pages/[...locale]/ with `export const getStaticPaths = localeStaticPaths`.
 */
import uk from './uk';

export const locales = ['uk'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'uk';

/** <html lang> (BCP 47), og:locale and the language switcher label of every language */
export const localeMeta: Record<Locale, { lang: string; ogLocale: string; label: string }> = {
  uk: { lang: 'uk', ogLocale: 'uk_UA', label: 'UA' },
};

export type Dictionary = typeof uk;

const dictionaries: Partial<Record<Locale, Dictionary>> = { uk };

/** Languages whose pages are built */
export const builtLocales: Locale[] = locales.filter((locale) => dictionaries[locale]);

/** `Astro.currentLocale` (or any string) → a known language, the default for anything else */
export const toLocale = (value: string | undefined): Locale =>
  locales.find((locale) => locale === value) ?? defaultLocale;

/** Texts of the current page: `const t = useTranslations(Astro.currentLocale)` */
export const useTranslations = (locale: string | undefined): Dictionary => dictionaries[toLocale(locale)] ?? uk;

/** getStaticPaths() of a page in src/pages/[...locale]/: one path per built language, the default without a prefix */
export const localeStaticPaths = () =>
  builtLocales.map((locale) => ({ params: { locale: locale === defaultLocale ? undefined : locale } }));

const prefixedLocales = locales.filter((locale) => locale !== defaultLocale);
const prefixed = new RegExp(`^/(${prefixedLocales.join('|')})(?=/|$)`);

/** A site path in a language: localePath('/', 'uk') → '/uk/', localePath('/about/', '<default>') → '/about/' */
export const localePath = (path: string, locale: string | undefined): string => {
  const target = toLocale(locale);
  return target === defaultLocale ? path : `/${target}${path}`;
};

/** The path without its language prefix: '/uk/about/' → '/about/', '/uk' → '/' */
export const unlocalizedPath = (pathname: string): string =>
  prefixedLocales.length > 0 ? pathname.replace(prefixed, '') || '/' : pathname;

/**
 * A site-data value that may differ per language (`site.ts`: name, location, jobTitle, description):
 * a one-language site writes a plain string, a multilingual one a `{ uk: '…', en: '…' }` record.
 */
export type Localized = string | Partial<Record<Locale, string>>;

/** The value in the page's language, the default language's when that one is missing */
export const localized = (value: Localized | undefined, locale: string | undefined): string =>
  typeof value === 'string' ? value : (value?.[toLocale(locale)] ?? value?.[defaultLocale] ?? '');

/** The same page in every built language (hreflang links, the language switcher) */
export const alternates = (pathname: string) =>
  builtLocales.map((locale) => ({
    locale,
    lang: localeMeta[locale].lang,
    path: localePath(unlocalizedPath(pathname), locale),
  }));
