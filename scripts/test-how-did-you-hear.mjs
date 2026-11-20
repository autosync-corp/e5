import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { applyHowDidYouHear, HOW_DID_YOU_HEAR_OPTIONS } from '../src/core/utils/howDidYouHear.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
let failed = 0;
function assert(label, ok) {
  if (!ok) {
    failed += 1;
    console.error('fail', label);
  } else {
    console.log('ok  ', label);
  }
}

const form = readFileSync(join(root, 'src/pages/checkout/components/_AddressForm.vue'), 'utf8');
const webhook = readFileSync(join(root, 'src/pages/api/send-order-webhook.ts'), 'utf8');
const checkout = readFileSync(join(root, 'src/pages/checkout/components/_CheckoutOrder.vue'), 'utf8');

assert('dropdown sits after order notes', /ORDER NOTES \(OPTIONAL\)[\s\S]*HOW DID YOU HEAR ABOUT US\?/.test(form));
assert('native select uses existing class', form.includes('class="e5CheckoutSelect"') && form.includes('id="howDidYouHear"'));
assert('placeholder is disabled Select one', form.includes('<option disabled value="">Select one</option>'));
assert('select is not required', !/id="howDidYouHear"[^>]*required/.test(form));
assert('exact option order', HOW_DID_YOU_HEAR_OPTIONS.join('|') === 'Facebook|Instagram|TikTok|Google|Youtube|Friends and Family|Corvette Forums|Trade Shows');
assert('form renders options from shared list', form.includes('v-for="option in HOW_DID_YOU_HEAR_OPTIONS"') && form.includes("from '@/core/utils/howDidYouHear'"));

assert('API webhook uses applyHowDidYouHear', webhook.includes('applyHowDidYouHear') && webhook.includes('how_did_you_hear'));
assert('API webhook URL unchanged', webhook.includes("import.meta.env.GHL_WEBHOOK_URL") && webhook.includes('leadconnectorhq.com/hooks/'));
assert('Stripe/Affirm client webhook uses applyHowDidYouHear', checkout.includes('applyHowDidYouHear') && checkout.includes('how_did_you_hear'));

const empty = applyHowDidYouHear({ orderNotes: 'Leave at side door' });
assert('empty source keeps notes', empty.how_did_you_hear === '' && empty.orderNotes === 'Leave at side door');

const sourceOnly = applyHowDidYouHear({ howDidYouHear: 'Instagram' });
assert('source-only notes', sourceOnly.how_did_you_hear === 'Instagram' && sourceOnly.orderNotes === 'How did you hear about us?: Instagram');

const both = applyHowDidYouHear({ orderNotes: 'Gate code 12', howDidYouHear: 'Corvette Forums' });
assert(
  'appends source to notes',
  both.how_did_you_hear === 'Corvette Forums' && both.orderNotes.includes('Gate code 12') && both.orderNotes.includes('How did you hear about us?: Corvette Forums'),
);

const snake = applyHowDidYouHear({ how_did_you_hear: 'TikTok', orderNotes: '' });
assert('accepts snake_case from payload', snake.how_did_you_hear === 'TikTok');

const received = [];
const mock = createServer((req, res) => {
  let body = '';
  req.on('data', (chunk) => { body += chunk; });
  req.on('end', () => {
    received.push({ url: req.url, body: JSON.parse(body) });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
  });
});

await new Promise((resolve) => mock.listen(0, '127.0.0.1', resolve));
const { port } = mock.address();
const customerData = {
  billing: { firstName: 'Test' },
  orderNotes: 'Please call ahead',
  howDidYouHear: 'Google',
};
const { how_did_you_hear, orderNotes } = applyHowDidYouHear(customerData);
const webhookData = { orderNotes, how_did_you_hear, customer: customerData.billing };
const mockRes = await fetch(`http://127.0.0.1:${port}/ghl-mock`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(webhookData),
});
assert('mock GHL accepted intercepted payload', mockRes.ok);
assert('payload field how_did_you_hear is Google', received[0]?.body?.how_did_you_hear === 'Google');
assert('payload orderNotes includes source line', received[0]?.body?.orderNotes.includes('How did you hear about us?: Google'));
assert('did not post to live GHL host', !String(received[0]?.url || '').includes('leadconnectorhq'));
mock.close();

if (failed) {
  console.error(`${failed} how-did-you-hear checks failed`);
  process.exit(1);
}
console.log('all how-did-you-hear checks passed');
console.log(JSON.stringify(received[0].body, null, 2));
