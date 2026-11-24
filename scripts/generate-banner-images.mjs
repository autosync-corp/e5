/**
 * Crop homepage banner photos to 16:9 and emit 800/1280/1920 WebP+AVIF.
 * Slide sources:
 *  1. gallery/corvette/2025-c8-stingray-blue-sebring-gloss-black/0.webp
 *  2. visualizer frames: scripts/generate-banner-viz-frames.py
 *  3. gallery/corvette/2025-c8-z06-black/1.webp (GT.03 on black C8 Z06)
 *  4. film-car: isolated gallery C7 (scripts/assets/film-car-cutout.png)
 */
import { mkdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const ROOT = join(import.meta.dirname, '..', 'public', 'assets', 'images');
const OUT = join(ROOT, 'banner');
mkdirSync(OUT, { recursive: true });

async function crop16x9(input, position = 'south') {
  const img = sharp(input).rotate();
  const meta = await img.metadata();
  const w = meta.width;
  const h = meta.height;
  const targetRatio = 16 / 9;
  const srcRatio = w / h;
  let extract;
  if (srcRatio > targetRatio) {
    const nw = Math.round(h * targetRatio);
    extract = { left: Math.round((w - nw) / 2), top: 0, width: nw, height: h };
  } else {
    const nh = Math.round(w / targetRatio);
    const top = position === 'north' ? 0 : Math.max(0, h - nh);
    extract = { left: 0, top, width: w, height: nh };
  }
  return img.extract(extract);
}

async function variants(pipeline, stem, widths = [800, 1280, 1920]) {
  const buf = await pipeline.toBuffer();
  for (const width of widths) {
    const resized = sharp(buf).resize({
      width,
      height: Math.round((width * 9) / 16),
      fit: 'cover',
      withoutEnlargement: true,
      kernel: sharp.kernel.lanczos3,
    });
    const webp = join(OUT, `${stem}-${width}.webp`);
    const avif = join(OUT, `${stem}-${width}.avif`);
    await resized.clone().webp({ quality: 78, effort: 5 }).toFile(webp);
    await resized.clone().avif({ quality: 48, effort: 4 }).toFile(avif);
    console.log(stem, width, 'webp', statSync(webp).size, 'avif', statSync(avif).size);
  }
}

async function laydownVariants() {
  const input = join(import.meta.dirname, 'assets', 'gt03-laydown.png');
  const base = sharp(input);
  for (const width of [800, 1200, 1500]) {
    const resized = base.clone().resize({
      width,
      height: width,
      fit: 'inside',
      withoutEnlargement: true,
      kernel: sharp.kernel.lanczos3,
    });
    const webp = join(OUT, `gt03-laydown-${width}.webp`);
    const avif = join(OUT, `gt03-laydown-${width}.avif`);
    await resized.clone().webp({ quality: 84, alphaQuality: 100, effort: 5 }).toFile(webp);
    await resized.clone().avif({ quality: 52, effort: 4 }).toFile(avif);
    console.log('gt03-laydown', width, 'webp', statSync(webp).size, 'avif', statSync(avif).size);
  }
}

async function filmCarVariants() {
  const input = join(import.meta.dirname, 'assets', 'film-car-cutout.png');
  const buf = await sharp(input).png().toBuffer();
  for (const width of [800, 1280, 1600]) {
    const resized = sharp(buf).resize({
      width,
      fit: 'inside',
      withoutEnlargement: true,
      kernel: sharp.kernel.lanczos3,
    });
    const webp = join(OUT, `film-car-${width}.webp`);
    const avif = join(OUT, `film-car-${width}.avif`);
    await resized.clone().webp({ quality: 86, alphaQuality: 100, effort: 5 }).toFile(webp);
    await resized.clone().avif({ quality: 55, effort: 4 }).toFile(avif);
    console.log('film-car', width, 'webp', statSync(webp).size, 'avif', statSync(avif).size);
  }
}

const sebring = join(ROOT, 'gallery/corvette/2025-c8-stingray-blue-sebring-gloss-black/0.webp');
const gt03 = join(ROOT, 'gallery/corvette/2025-c8-z06-black/1.webp');
await variants(await crop16x9(sebring, 'south'), 'bf-sale');
await variants(await crop16x9(gt03, 'south'), 'gt03-black');
await laydownVariants();
await filmCarVariants();

console.log('banner images done');
