import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const footer = readFileSync(join(root, 'src/core/components/Footer.vue'), 'utf8');
const layout = readFileSync(join(root, 'src/layouts/MainLayout.astro'), 'utf8');
const fonts = readFileSync(join(root, 'src/assets/fonts/fonts.css'), 'utf8');

let failed = 0;
function assert(label, ok) {
  if (!ok) {
    failed += 1;
    console.error('fail', label);
  } else {
    console.log('ok  ', label);
  }
}

const requiredTokens = [
  'PROCESS_ROUTE',
  'CONTACT_ROUTE',
  '/events/upcoming',
  'CATALOG_ROUTE',
  'REFUND_ROUTE',
  'WARRANTY_ROUTE',
  'INSTALLATION_ROUTE',
  'REGISTRATION_ROUTE',
  'VENDOR_REGISTRATION_ROUTE',
  'MEDIA_ROUTE',
  'ABOUT_ROUTE',
  "'/blog'",
  'TERMS_ROUTE',
  'PRIVACY_ROUTE',
  'https://maps.app.goo.gl/Xe5EHmAQb11B4Nar8',
  'tel:+13059647429',
  'mailto:SALES@E5WHEELS.COM',
  'https://www.instagram.com/e5wheels/',
  'https://www.facebook.com/e5wheels/',
  'https://www.youtube.com/@E5Wheels',
  'https://www.tiktok.com/@e5wheels',
];

for (const token of requiredTokens) {
  assert(`keeps ${token}`, footer.includes(token));
}

assert('no variant switch', !footer.includes('variant ===') && !layout.includes("searchParams.get('footer')"));
assert('no A/B markup', !footer.includes('ft-a') && !footer.includes('ft-b') && !footer.includes('tesla-links'));
assert('C layout remains', footer.includes('vossen-top') && footer.includes('GET IN TOUCH'));
assert('white background', footer.includes('background: #ffffff'));
assert('no red footer bg', !footer.includes('bg-e5-red w-full'));
assert('44px tap', footer.includes('min-height: 44px'));
assert('Oswald condensed', footer.includes('Oswald') && fonts.includes('oswald-500.woff2'));
assert('logo aspect-ratio preserved', footer.includes('aspect-ratio: 1191 / 101') && footer.includes('max-width: none'));
assert('mobile accordion', footer.includes('<details'));
assert('mobile breakpoint 767', footer.includes('max-width: 767px'));
assert('logo unaltered constant', footer.includes('E5_LOGO_BLACK'));
assert('copyright kept', footer.includes('COPYRIGHT E5 WHEELS, LLC'));

if (failed) {
  console.error(`${failed} footer checks failed`);
  process.exit(1);
}
console.log('all footer variant checks passed');
