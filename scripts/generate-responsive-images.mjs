import { mkdirSync, readdirSync, statSync, unlinkSync } from 'node:fs';
import { basename, extname, join } from 'node:path';
import sharp from 'sharp';

const ROOT = join(import.meta.dirname, '..', 'public', 'assets', 'images');

function ensureDir(dir) {
  mkdirSync(dir, { recursive: true });
}

async function photoResize(input, outBase, width, quality = 78) {
  const pipeline = sharp(input).rotate().resize({
    width,
    withoutEnlargement: true,
    kernel: sharp.kernel.lanczos3,
  });
  await pipeline.clone().webp({ quality, effort: 5 }).toFile(`${outBase}.webp`);
  await pipeline.clone().avif({ quality: 48, effort: 4 }).toFile(`${outBase}.avif`);
}

async function losslessResize(input, output, width) {
  const ext = extname(output).toLowerCase();
  const img = sharp(input).resize({
    width,
    withoutEnlargement: true,
    kernel: sharp.kernel.lanczos3,
  });
  if (ext === '.png') {
    await img.png({ compressionLevel: 9, palette: true, quality: 100 }).toFile(output);
  } else {
    await img.webp({ lossless: true, effort: 5 }).toFile(output);
  }
  const outSize = statSync(output).size;
  const inSize = statSync(input).size;
  if (outSize >= inSize) {
    unlinkSync(output);
    console.log('skip larger', output, outSize, '>=', inSize);
    return false;
  }
  return true;
}

async function catalogVariants() {
  const srcDir = join(ROOT, 'catalog-800');
  const dir200 = join(ROOT, 'catalog-200');
  const dir400 = join(ROOT, 'catalog-400');
  const dir800 = join(ROOT, 'catalog-800');
  ensureDir(dir200);
  ensureDir(dir400);
  const files = readdirSync(srcDir).filter((f) => f.endsWith('.webp'));
  for (const file of files) {
    const input = join(srcDir, file);
    const stem = basename(file, '.webp');
    await photoResize(input, join(dir200, stem), 200);
    await photoResize(input, join(dir400, stem), 400);
    await sharp(input).avif({ quality: 48, effort: 4 }).toFile(join(dir800, `${stem}.avif`));
    console.log('catalog', stem);
  }
}

async function namedPhotos() {
  const jobs = [
    { file: 'vette-black-on-river.webp', widths: [400, 800] },
    { file: 'e5-wheel-home-shot-1.webp', widths: [400, 800] },
    { file: 'asset-29.webp', widths: [264, 528] },
    { file: 'wheels-new/195456d72b224f9b92ca6b410ac88f61fad3db24.webp', widths: [800, 1200] },
    { file: 'wheels-new/38f473e1f45f9c800e13c02c7283b158fad81634.webp', widths: [800, 1200] },
  ];
  for (const job of jobs) {
    const input = join(ROOT, job.file);
    const dir = join(ROOT, 'opt');
    ensureDir(dir);
    const stem = basename(job.file, extname(job.file));
    for (const width of job.widths) {
      await photoResize(input, join(dir, `${stem}-${width}`), width);
    }
    console.log('photo', stem);
  }
}

async function logos() {
  const dir = join(ROOT, 'opt');
  ensureDir(dir);
  const jobs = [
    { file: 'logos/form-forged.png', width: 800, out: 'form-forged-800.png' },
    { file: 'logos/gt-forged.png', width: 600, out: 'gt-forged-600.png' },
    { file: 'logos/2p-forged.png', width: 400, out: '2p-forged-400.png' },
    { file: 'e5-wheels-alt-logo-black.png', width: 600, out: 'e5-wheels-alt-logo-black-600.png' },
    { file: 'e5_tiktok.webp', width: 96, out: 'e5_tiktok-96.webp' },
    { file: 'e5_instagram.webp', width: 96, out: 'e5_instagram-96.webp' },
    { file: 'e5_youtube.webp', width: 96, out: 'e5_youtube-96.webp' },
    { file: 'e5_facebook.webp', width: 96, out: 'e5_facebook-96.webp' },
  ];
  for (const job of jobs) {
    await losslessResize(join(ROOT, job.file), join(dir, job.out), job.width);
    console.log('logo', job.out, statSync(join(dir, job.out)).size);
  }
}

await catalogVariants();
await namedPhotos();
await logos();
console.log('done');
