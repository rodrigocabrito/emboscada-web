// Content-preserving image optimiser (#8). Walks public/site and re-encodes only
// images that are *egregiously* heavy for their pixel count (bytes-per-pixel above
// a threshold) — i.e. badly-exported files, not already-optimised ones. No resize
// or crop, so the picture is unchanged; JPEGs re-encode at quality 82 (mozjpeg),
// PNGs at max compression. The result is only written if it actually shrinks the
// file. Re-runnable and safe to add to the workflow when new images land.
//
// Run: node scripts/optimize-images.mjs   (or: npm run img:optimize)
import sharp from 'sharp';
import { readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../public/site/', import.meta.url));
const BPP_LIMIT = 0.5; // bytes/pixel above this = bloated (normal web JPEGs ~0.1–0.3)

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });

const files = walk(ROOT).filter((f) => ['.jpg', '.jpeg', '.png'].includes(extname(f).toLowerCase()));
let touched = 0;
let saved = 0;

for (const f of files) {
  const size = statSync(f).size;
  const img = sharp(f);
  const meta = await img.metadata();
  const bpp = size / (meta.width * meta.height);
  if (bpp <= BPP_LIMIT) continue; // already lean — leave it alone

  const isPng = extname(f).toLowerCase() === '.png';
  const buf = await img
    .toFormat(isPng ? 'png' : 'jpeg', isPng ? { compressionLevel: 9, palette: true } : { quality: 82, mozjpeg: true })
    .toBuffer();
  if (buf.length < size) {
    writeFileSync(f, buf);
    touched += 1;
    saved += size - buf.length;
    console.log(`  ${f.replace(ROOT, '')}: ${(size / 1e6).toFixed(2)}MB → ${(buf.length / 1e6).toFixed(2)}MB`);
  }
}

console.log(touched ? `optimize-images: re-encoded ${touched} bloated file(s), saved ${(saved / 1e6).toFixed(2)}MB` : 'optimize-images: nothing to do — all images already lean');
