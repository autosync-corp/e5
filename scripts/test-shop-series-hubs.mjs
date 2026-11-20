import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const vercel = JSON.parse(readFileSync(join(root, 'vercel.json'), 'utf8'));
const redirects = new Map(
  vercel.redirects
    .filter((r) => typeof r.source === 'string' && typeof r.destination === 'string')
    .map((r) => [r.source, r.destination]),
);

const hubs = {
  '/shop/daytona': '/wheels/daytona',
  '/shop/sebring': '/wheels/sebring',
  '/shop/sebring-2p': '/wheels/sebring-2p',
  '/shop/sebring2p': '/wheels/sebring-2p',
  '/shop/speedway': '/wheels/speedway',
  '/shop/talladega': '/wheels/talladega',
  '/shop/sonoma': '/wheels/sonoma',
  '/shop/laguna': '/wheels/laguna',
  '/shop/form-forged': '/wheels/form-forged',
  '/shop/formforged': '/wheels/form-forged',
  '/shop/gt01': '/wheels/gt-01',
  '/shop/gt-01': '/wheels/gt-01',
  '/shop/gt.01': '/wheels/gt-01',
  '/shop/gt_01': '/wheels/gt-01',
  '/shop/gt02': '/wheels/gt-02',
  '/shop/gt-02': '/wheels/gt-02',
  '/shop/gt.02': '/wheels/gt-02',
  '/shop/gt_02': '/wheels/gt-02',
  '/shop/gt03': '/wheels/gt-03',
  '/shop/gt-03': '/wheels/gt-03',
  '/shop/gt.03': '/wheels/gt-03',
  '/shop/gt_03': '/wheels/gt-03',
  '/shop/gt04': '/wheels/gt-04',
  '/shop/gt-04': '/wheels/gt-04',
  '/shop/gt.04': '/wheels/gt-04',
  '/shop/gt_04': '/wheels/gt-04',
};

let failed = 0;
function assert(label, ok) {
  if (!ok) {
    failed += 1;
    console.error('fail', label);
  } else {
    console.log('ok  ', label);
  }
}

for (const [source, dest] of Object.entries(hubs)) {
  assert(`${source} -> ${dest}`, redirects.get(source) === dest);
  assert(`${source}/ -> ${dest}`, redirects.get(`${source}/`) === dest);
}

assert(
  'finish URLs are not hub-redirected',
  !redirects.has('/shop/gt01/brushed-aluminum') && !redirects.has('/shop/daytona/gloss-black'),
);
assert('shop index is not redirected', redirects.get('/shop/') === '/shop');

if (failed) {
  console.error(`${failed} shop series hub checks failed`);
  process.exit(1);
}
console.log('all shop series hub checks passed');
