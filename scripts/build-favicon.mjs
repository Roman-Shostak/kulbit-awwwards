// Favicon set: public/favicon.svg → public/favicon.ico (16 + 32 px PNG frames) and
// public/apple-touch-icon.png (180 px). BaseLayout links all three.
//
//   pnpm favicon [--bg #ffffff]   --bg flattens the apple-touch-icon onto a colour (iOS shows
//                                  transparent areas as black); without it transparency is kept.
//
// The SVG comes from the client (rules: .claude/rules/images.md). ICO with PNG frames is
// understood by every current browser and by Windows since Vista.

import { access, readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const SRC = 'public/favicon.svg';
const ICO = 'public/favicon.ico';
const APPLE = 'public/apple-touch-icon.png';
const ICO_SIZES = [16, 32];
const APPLE_SIZE = 180;

const bgIndex = process.argv.indexOf('--bg');
const background = bgIndex > -1 ? process.argv[bgIndex + 1] : null;

try {
  await access(SRC);
} catch {
  console.error(`[favicon] ${SRC} not found — put the client's favicon.svg into public/ first`);
  process.exit(1);
}

const svg = await readFile(SRC);
const png = (size) => sharp(svg, { density: 384 }).resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png();

// ICO container: 6-byte header, one 16-byte directory entry per image, then the PNG frames.
const frames = await Promise.all(ICO_SIZES.map((size) => png(size).toBuffer()));
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
console.log(`[favicon] ${ICO} (${ICO_SIZES.join(', ')} px)`);

let apple = png(APPLE_SIZE);
if (background) apple = apple.flatten({ background });
await apple.toFile(APPLE);
console.log(`[favicon] ${APPLE} (${APPLE_SIZE} px${background ? `, background ${background}` : ''})`);
