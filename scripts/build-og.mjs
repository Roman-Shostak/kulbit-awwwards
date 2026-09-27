// Generates Open Graph images: src/assets/og/*.{png,jpg,jpeg,webp} → public/og/<name>.jpg
// Runs automatically before `pnpm build` (see "prebuild" in package.json).
//
// Output is JPG, 1200×630, cover-cropped. JPG on purpose: social networks and messengers
// render WebP/AVIF previews unreliably, and one OG image per page makes size irrelevant.

import { mkdir, readdir, stat } from 'node:fs/promises';
import { basename, extname, join } from 'node:path';
import sharp from 'sharp';

const SRC = 'src/assets/og';
const OUT = 'public/og';
// Also hardcoded as `ogImageSize` in src/data/schema.ts (the page's #primaryimage node) — keep in sync
const WIDTH = 1200;
const HEIGHT = 630;
const QUALITY = 82;
const INPUT_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp']);

const entries = await readdir(SRC).catch(() => []);
const sources = entries.filter((f) => INPUT_EXT.has(extname(f).toLowerCase()));

if (sources.length === 0) {
  console.log(`[og] no sources in ${SRC}, skipping`);
  process.exit(0);
}

await mkdir(OUT, { recursive: true });

for (const file of sources) {
  const name = basename(file, extname(file));
  if (!/^[a-z0-9-]+$/.test(name)) {
    console.error(`[og] "${file}": name must be lowercase kebab-case (a-z, 0-9, -)`);
    process.exit(1);
  }

  const input = join(SRC, file);
  const output = join(OUT, `${name}.jpg`);

  // Skip when the output is newer than the source
  const [srcStat, outStat] = await Promise.all([stat(input), stat(output).catch(() => null)]);
  if (outStat && outStat.mtimeMs >= srcStat.mtimeMs) {
    console.log(`[og] ${output} up to date`);
    continue;
  }

  await sharp(input)
    .resize(WIDTH, HEIGHT, { fit: 'cover', position: 'centre' })
    .flatten({ background: '#ffffff' }) // OG has no transparency
    .jpeg({ quality: QUALITY, mozjpeg: true })
    .toFile(output);

  console.log(`[og] ${input} → ${output}`);
}
