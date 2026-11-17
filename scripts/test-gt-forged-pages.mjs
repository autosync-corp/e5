import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import esbuild from 'esbuild';
import { tmpdir } from 'node:os';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function loadBundled(rel) {
  const outfile = join(tmpdir(), `e5-gt-${Date.now()}-${Math.random().toString(16).slice(2)}.mjs`);
  esbuild.buildSync({
    entryPoints: [join(root, rel)],
    outfile,
    bundle: true,
    format: 'esm',
    platform: 'neutral',
    packages: 'external',
  });
  return import(pathToFileURL(outfile).href);
}

let failed = 0;
function assert(label, actual, expected) {
  const ok = actual === expected;
  if (!ok) {
    failed += 1;
    console.error('fail', label, { actual, expected });
  } else {
    console.log('ok  ', label);
  }
}

const { GT_FORGED_MODELS, GT_CATALOG_SIZE_LINES, GT_01_MODEL } = await loadBundled(
  'src/pages/wheels/constants/gtForgedModels.ts'
);
const { modelWordmarkSrc } = await loadBundled('src/core/utils/modelWordmark.ts');
const { WHEELS_GT_01_ROUTE, WHEELS_GT_04_ROUTE } = await loadBundled('src/core/constants/Routes.ts');

assert('four GT models', GT_FORGED_MODELS.length, 4);
assert('canonical gt-01', GT_01_MODEL.canonicalPath, '/wheels/gt-01');
assert('route gt-01', WHEELS_GT_01_ROUTE, '/wheels/gt-01');
assert('route gt-04', WHEELS_GT_04_ROUTE, '/wheels/gt-04');
assert('GT.01 wordmark', modelWordmarkSrc('GT.01'), '/assets/images/logos/gt-01-wordmark.png');
assert('GT.04 wordmark', modelWordmarkSrc('GT.04'), '/assets/images/logos/gt-04-wordmark.png');
assert('catalog size count', GT_CATALOG_SIZE_LINES.length, 6);
assert('hides E5 process copy', GT_01_MODEL.showProcessSections, false);
assert('no explore CTA', GT_01_MODEL.exploreHref, null);
assert('three finishes', GT_01_MODEL.finishes.length, 3);
assert('brushed shop link', GT_01_MODEL.finishes[0].href.includes('/shop/gt01/brushed-aluminum'), true);
assert('exclusive is lead time only', GT_01_MODEL.exclusive.includes('C8'), false);

const navbar = readFileSync(join(root, 'src/core/components/Navbar.vue'), 'utf8');
const wheelsTitleOrder = [...navbar.matchAll(/<(?:div class="(?:wheel-group-title|mobile-wheel-title)")>([^<]+)</g)].map((m) => m[1]);
assert('desktop wheels order', wheelsTitleOrder.slice(0, 4).join('|'), 'FORM FORGED|2P FORGED|E5 FORGED|GT FORGED');
assert('mobile wheels order', wheelsTitleOrder.slice(4, 8).join('|'), 'FORM FORGED|2P FORGED|E5 FORGED|GT FORGED');
assert('2-PIECE relabeled', navbar.includes('2-PIECE'), false);
assert('menu stays text 2P FORGED', navbar.includes('>2P FORGED<'), true);

const sebring2p = readFileSync(join(root, 'src/pages/wheels/sebring-2p.astro'), 'utf8');
assert('sebring-2p uses 2P logo', sebring2p.includes('TWO_P_FORGED_LOGO'), true);
assert('sebring-2p alt 2P Forged', sebring2p.includes('alt="2P Forged"'), true);
assert('sebring-2p no FORM series lockup', sebring2p.includes('FORM_FORGED_WORDMARK'), false);
assert('sebring-2p detail lockup', sebring2p.includes('style-series-lockup'), true);
assert('sebring-2p detail series size', sebring2p.includes('series-logo-detail-2p'), true);
assert('sebring-2p not E5-cap class', /(?<!detail-)series-logo-2p/.test(sebring2p), false);

const daytona = readFileSync(join(root, 'src/pages/wheels/daytona.astro'), 'utf8');
assert('daytona detail lockup', daytona.includes('style-series-lockup'), true);
assert('daytona detail series size', daytona.includes('series-logo-detail-form'), true);
assert('daytona not E5-cap class', /(?<!detail-)series-logo-form/.test(daytona), false);

const sebring = readFileSync(join(root, 'src/pages/wheels/sebring.astro'), 'utf8');
assert('sebring detail lockup', sebring.includes('series-logo-detail-form'), true);
const speedway = readFileSync(join(root, 'src/pages/wheels/speedway.astro'), 'utf8');
assert('speedway detail lockup', speedway.includes('series-logo-detail-form'), true);

const wheelsIndex = readFileSync(join(root, 'src/pages/wheels/index.astro'), 'utf8');
assert('wheels keeps E5-cap form header', wheelsIndex.includes('series-logo-form'), true);
assert('wheels keeps E5-cap e5 header', wheelsIndex.includes('series-logo-e5'), true);
assert('wheels keeps E5-cap gt header', wheelsIndex.includes('series-logo-gt'), true);
assert('wheels headers not detail class', wheelsIndex.includes('series-logo-detail-'), false);

const modelPage = readFileSync(join(root, 'src/core/components/E5ForgedModelPage.astro'), 'utf8');
assert('model page hero lockup', modelPage.includes('style-series-lockup--hero'), true);
assert('GT lockup is below-hero band', modelPage.includes('style-series-lockup--gt-band'), true);
assert('GT lockup not overlaid on hero', modelPage.includes('style-series-lockup--hero-mark'), false);
assert('model page no stacked E5-cap series', /(?<!detail-)series-logo-gt/.test(modelPage), false);

const e5Models = readFileSync(join(root, 'src/pages/wheels/constants/e5ForgedModels.ts'), 'utf8');
assert('laguna has E5 series logo', e5Models.includes("alt: 'E5 Forged'"), true);

const shopPage = readFileSync(join(root, 'src/pages/shop/components/_SingleProductPage.vue'), 'utf8');
assert('shop adjacent lockup', shopPage.includes('style-series-lockup--shop'), true);
assert('shop uses detail series class', shopPage.includes('series-logo-detail-form'), true);
assert('desktop GT.01 link', navbar.includes('WHEELS_GT_01_ROUTE'), true);
assert('mobile GT.04 link', navbar.includes('WHEELS_GT_04_ROUTE'), true);

const designs = readFileSync(join(root, 'src/core/components/E5ForgedDesigns.astro'), 'utf8');
assert('bottom block has no GT entry', /GT\.0|gt-01|GT FORGED/.test(designs), false);

const vercel = JSON.parse(readFileSync(join(root, 'vercel.json'), 'utf8'));
const sources = new Set(vercel.redirects.map((row) => row.source));
assert('301 /wheels/gt.01', sources.has('/wheels/gt.01'), true);
assert('301 /wheels/gt01', sources.has('/wheels/gt01'), true);
assert('301 /wheels/gt.04', sources.has('/wheels/gt.04'), true);

const sitemap = readFileSync(join(root, 'astro.config.mjs'), 'utf8');
assert('sitemap gt-01', sitemap.includes('/wheels/gt-01'), true);
assert('sitemap gt-04', sitemap.includes('/wheels/gt-04'), true);

if (failed) {
  console.error(`${failed} GT forged checks failed`);
  process.exit(1);
}
console.log('all GT forged checks passed');
