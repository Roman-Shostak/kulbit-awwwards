/**
 * Font preloads for BaseLayout: the first file of every listed weight — the `primarySubset` (latin) file,
 * which `variants()` in astro.config.mjs puts first — so the browser fetches one file per weight, not every subset.
 * Lives in a .ts module on purpose: an `as` attribute (or an `as` key) written in an .astro file breaks
 * `astro check`'s typing of that file's Props (the same compiler bug as a prop named `as`, astro-components.md).
 */
import { fontData } from 'astro:assets';

export const preloadAttributes = { rel: 'preload', as: 'font', type: 'font/woff2', crossorigin: 'anonymous' };

export const preloadFonts = (cssVariable: keyof typeof fontData, weights: number[]): string[] => {
  const seen = new Set<string>();
  const urls: string[] = [];
  for (const font of fontData[cssVariable]) {
    const key = `${font.weight}/${font.style}`;
    const url = font.src[0]?.url;
    if (!url || !weights.includes(Number(font.weight)) || seen.has(key)) continue;
    seen.add(key);
    urls.push(url);
  }
  return urls;
};
