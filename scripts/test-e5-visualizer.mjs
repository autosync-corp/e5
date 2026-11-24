import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const wrap = readFileSync(join(root, 'public/visualizer-app/e5wheels-visualizer_9.html'), 'utf8');
const page = readFileSync(join(root, 'src/pages/e5-visualizer/index.astro'), 'utf8');

let failed = 0;
function assert(label, ok) {
  if (!ok) {
    failed += 1;
    console.error('fail', label);
  } else {
    console.log('ok  ', label);
  }
}

const tabOrder = [...wrap.matchAll(/data-gen="([^"]+)"/g)].map((m) => m[1]);
assert(
  'generation tabs are newest-first',
  JSON.stringify(tabOrder) ===
    JSON.stringify([
      'C8_Z06',
      'C8_Stingray',
      'C7_Grand_Sport',
      'C7_Z06',
      'C7_Stingray',
      'C6_Grand_Sport',
      'C6_Z06',
      'C5',
    ]),
);
assert('default loadGen is C8 Z06', wrap.includes("loadGen('C8_Z06')"));
assert('iframe initial car is C8_Z06', wrap.includes('index.html?car=C8_Z06'));
assert('C8 Z06 tab starts active', /gtab active" data-gen="C8_Z06"/.test(wrap));
assert('no C5 default load', !wrap.includes("loadGen('C5')") && !wrap.includes('index.html?car=C5'));
assert('white chrome tokens', wrap.includes('--black:#ffffff') && wrap.includes('--panel:#ffffff') && wrap.includes('background:#fff'));
assert('model selector is larger', wrap.includes('font-size:16px') && wrap.includes('font-size:14px') && wrap.includes('font-size:13px'));
assert('page iframe is white', page.includes('background: #ffffff') && page.includes('e5-visualizer-frame'));
assert('hosted in this repo, not an external embed', page.includes('/visualizer-app/e5wheels-visualizer_9.html'));

if (failed) {
  console.error(`${failed} e5 visualizer checks failed`);
  process.exit(1);
}
console.log('all e5 visualizer checks passed');
