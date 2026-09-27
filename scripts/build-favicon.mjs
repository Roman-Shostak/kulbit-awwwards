// Favicon set: public/favicon.svg → public/favicon.ico (16 + 32 px PNG frames) and
// public/apple-touch-icon.png (180 px). BaseLayout links all three.
// A pair for the browser themes instead of one favicon.svg: public/favicon-dark.svg (the dark tile, shown on light
// tabs) → favicon.ico, public/favicon-light.svg (the light tile, shown on dark tabs) → apple-touch-icon.png.
//
//   pnpm favicon [--bg #ffffff]   --bg flattens the apple-touch-icon onto a colour (iOS shows
//                                  transparent areas as black); without it transparency is kept.
//
// The SVG comes from the client (rules: .claude/rules/images.md). ICO with PNG frames is
// understood by every current browser and by Windows since Vista.

import { access, readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const ICO = 'public/favicon.ico';
const APPLE = 'public/apple-touch-icon.png';
const ICO_SIZES = [16, 32];
const APPLE_SIZE = 180;

const bgIndex = process.argv.indexOf('--bg');
const background = bgIndex > -1 ? process.argv[bgIndex + 1] : null;

// The first file that exists
const pick = async (...paths) => {
  for (const path of paths) {
    try {
      await access(path);
      return path;
    } catch {
      // try the next one
    }
  }
  return null;
};
const icoSrc = await pick('public/favicon.svg', 'public/favicon-dark.svg');
const appleSrc = await pick('public/favicon.svg', 'public/favicon-light.svg');
if (!icoSrc || !appleSrc) {
  console.error("[favicon] public/favicon.svg (or favicon-dark.svg + favicon-light.svg) not found — put the client's files into public/ first");
  process.exit(1);
}

const png = async (src, size) =>
  sharp(await readFile(src), { density: 384 })
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png();

// ICO container: 6-byte header, one 16-byte directory entry per image, then the PNG frames.
const frames = await Promise.all(ICO_SIZES.map(async (size) => (await png(icoSrc, size)).toBuffer()));
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type: icon
header.writeUInt16LE(frames.length, 4);
let offset = 6 + 16 * frames.length;
const entries = frames.map((frame, i) => {
  const entry = Buffer.alloc(16);
  entry.writeUInt8(ICO_SIZES[i] === 256 ? 0 : ICO_SIZES[i], 0); // width  (0 = 256)
  entry.writeUInt8(ICO_SIZES[i] === 256 ? 0 : ICO_SIZES[i], 1); // height
  entry.writeUInt8(0, 2); // colour palette
  entry.writeUInt8(0, 3); // reserved
  entry.writeUInt16LE(1, 4); // colour planes
  entry.writeUInt16LE(32, 6); // bits per pixel
  entry.writeUInt32LE(frame.length, 8);
  entry.writeUInt32LE(offset, 12);
  offset += frame.length;
  return entry;
});
await writeFile(ICO, Buffer.concat([header, ...entries, ...frames]));
console.log(`[favicon] ${ICO} (${ICO_SIZES.join(', ')} px, from ${icoSrc})`);

let apple = await png(appleSrc, APPLE_SIZE);
if (background) apple = apple.flatten({ background });
await apple.toFile(APPLE);
console.log(`[favicon] ${APPLE} (${APPLE_SIZE} px${background ? `, background ${background}` : ''}, from ${appleSrc})`);
