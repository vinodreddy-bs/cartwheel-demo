const test = require('node:test');
const assert = require('node:assert/strict');
const { createStore } = require('../store');
const { formatINR } = require('../lib/money');
const { daysBetween, formatPromoDate, istDate } = require('../promos/dates');
const { describePromo, promoStatus, promoView } = require('../promos/describe');
const { normalizeCode, validatePromo } = require('../promos/validate');
const { calculateDiscount, quotePromo, appliedMessage } = require('../promos/calculate');

const item = (productId, name, category, price, quantity = 1) => ({ productId, name, category, price, quantity, lineTotal: price * quantity });
const EARBUDS = item(1, 'Pulse Wireless Earbuds', 'Electronics', 99900);
const CHECKLIST = item(10, 'The Pragmatic Checklist', 'Books', 49900);
const BOOK = item(8, 'Testing in the Age of AI', 'Books', 59900);
const MUGS = item(6, 'Stoneware Mug Set (4)', 'Home & Kitchen', 64900);
const BOTTLE = item(12, 'Steel Water Bottle', 'Accessories', 44900);
const promo = (store, code) => store.promos.find((p) => p.code === code);
const NOW = new Date('2026-09-30T06:30:00Z'); // 30 Sep 2026, 12:00 IST

test('formatINR matches the storefront format', () => {
  assert.equal(formatINR(99900), '₹999');
  assert.equal(formatINR(15470000), '₹1,54,700');
  assert.equal(formatINR(99950), '₹999.50');
});

test('IST dates: calendar day, differences and display format', () => {
  assert.equal(istDate(new Date('2026-11-05T18:29:59Z')), '2026-11-05');
  assert.equal(istDate(new Date('2026-11-05T18:30:00Z')), '2026-11-06');
  assert.equal(daysBetween('2026-09-30', '2026-10-15'), 15);
  assert.equal(formatPromoDate('2026-10-15'), '15 Oct 2026');
  assert.equal(formatPromoDate('2026-09-15'), '15 Sep 2026');
});

test('promoStatus uses IST calendar days, end date inclusive', () => {
  const store = createStore();
  const diwali = promo(store, 'DIWALI25');
  assert.equal(promoStatus(diwali, new Date('2026-10-14T18:29:59Z'), 0), 'not_started');
  assert.equal(promoStatus(diwali, new Date('2026-10-14T18:30:00Z'), 0), 'active');
  assert.equal(promoStatus(diwali, new Date('2026-11-05T18:29:59Z'), 0), 'active');
  assert.equal(promoStatus(diwali, new Date('2026-11-05T18:30:00Z'), 0), 'expired');
  assert.equal(promoStatus(promo(store, 'LIMITED5'), NOW, 5), 'limit_reached');
  assert.equal(promoStatus(promo(store, 'LIMITED5'), NOW, 4), 'active');
});

test('describePromo builds benefit, short benefit and conditions', () => {
  const store = createStore();
  assert.deepEqual(describePromo(promo(store, 'WELCOME10')), { benefit: '10% off, up to ₹300', shortBenefit: '10% off', conditions: ['Min. order ₹999', 'Once per customer'] });
  assert.deepEqual(describePromo(promo(store, 'BOOKS20')), { benefit: '20% off Books', shortBenefit: '20% off Books', conditions: ['Books items only'] });
  assert.deepEqual(describePromo(promo(store, 'FREESHIP')), { benefit: 'Free shipping', shortBenefit: 'Free shipping', conditions: ['No minimum order'] });
  assert.deepEqual(describePromo(promo(store, 'DIWALI25')).conditions, ['Min. order ₹2,999', 'Valid 15 Oct 2026 – 5 Nov 2026']);
  assert.deepEqual(describePromo(promo(store, 'LIMITED5')), { benefit: '₹100 off', shortBenefit: '₹100 off', conditions: ['Limited to 5 uses'] });
});

test('promoView reports status and daysLeft', () => {
  const store = createStore();
  const view = promoView(promo(store, 'DIWALI25'), new Date('2026-11-01T06:30:00Z'), 0);
  assert.equal(view.status, 'active');
  assert.equal(view.daysLeft, 4);
  assert.equal(promoView(promo(store, 'WELCOME10'), NOW, 0).daysLeft, null);
  assert.equal('listed' in view || 'usageLimit' in view, false);
});

test('normalizeCode trims and upper-cases', () => {
  assert.equal(normalizeCode('  welcome10 '), 'WELCOME10');
  assert.equal(normalizeCode(undefined), '');
});

test('calculateDiscount: percentage below cap, flat, category, free shipping', () => {
  const store = createStore();
  assert.deepEqual(calculateDiscount(promo(store, 'WELCOME10'), [EARBUDS, CHECKLIST]), { subtotal: 149800, eligible: 149800, discount: 14900 });
  assert.equal(calculateDiscount(promo(store, 'LIMITED5'), [BOTTLE]).discount, 10000);
  assert.deepEqual(calculateDiscount(promo(store, 'BOOKS20'), [BOOK, MUGS]), { subtotal: 124800, eligible: 59900, discount: 11900 });
  assert.equal(calculateDiscount(promo(store, 'FREESHIP'), [MUGS]).discount, 0);
});

test('quotePromo: totals, shipping and savings', () => {
  const store = createStore();
  const q = quotePromo(promo(store, 'WELCOME10'), [EARBUDS, CHECKLIST]);
  assert.deepEqual(q, { subtotal: 149800, discount: 14900, shipping: 0, baseShipping: 0, total: 134900, savings: 14900 });
  assert.equal(appliedMessage('WELCOME10', promo(store, 'WELCOME10'), q), 'WELCOME10 applied. You saved ₹149.');
  const ship = quotePromo(promo(store, 'FREESHIP'), [MUGS]);
  assert.deepEqual(ship, { subtotal: 64900, discount: 0, shipping: 0, baseShipping: 9900, total: 64900, savings: 9900 });
  assert.equal(appliedMessage('FREESHIP', promo(store, 'FREESHIP'), ship), 'FREESHIP applied. You saved ₹99.');
  const already = quotePromo(promo(store, 'FREESHIP'), [EARBUDS]);
  assert.equal(appliedMessage('FREESHIP', promo(store, 'FREESHIP'), already), 'FREESHIP applied. Your order already ships free.');
});

test('validatePromo: format, not found, dates, limits, empty cart, min order, category', () => {
  const store = createStore();
  const v = (rawCode, items, extra = {}) => validatePromo({ store, now: NOW, rawCode, items, ...extra });
  assert.deepEqual(v('WEL-10', [BOTTLE]), { ok: false, status: 400, errorCode: 'PROMO_INVALID_FORMAT', message: 'Promo codes contain only letters and numbers.' });
  assert.equal(v('AB', [BOTTLE]).errorCode, 'PROMO_INVALID_FORMAT');
  assert.equal(v('A'.repeat(21), [BOTTLE]).errorCode, 'PROMO_INVALID_FORMAT');
  assert.deepEqual(v('nope123', [BOTTLE]), { ok: false, status: 404, errorCode: 'PROMO_NOT_FOUND', message: "We couldn't find the code NOPE123." });
  assert.equal(v('DIWALI25', [BOTTLE]).message, 'DIWALI25 starts on 15 Oct 2026.');
  assert.equal(v('MONSOON15', [BOTTLE]).message, 'MONSOON15 expired on 15 Sep 2026.');
  assert.deepEqual(v('WELCOME10', []), { ok: false, status: 422, errorCode: 'PROMO_EMPTY_CART', message: 'Add items to your cart to use a promo code.' });
  assert.deepEqual(v('WELCOME10', [BOTTLE, BOTTLE]), { ok: false, status: 422, errorCode: 'PROMO_MIN_ORDER', message: 'Add ₹101 more to use WELCOME10.', shortfall: 10100 });
  assert.equal(v('BOOKS20', [EARBUDS]).message, "BOOKS20 isn't valid for items in your cart.");
  const ok = v(' welcome10 ', [EARBUDS, CHECKLIST]);
  assert.equal(ok.ok, true);
  assert.equal(ok.code, 'WELCOME10');
});

test('validatePromo: usage limit and once-per-email', () => {
  const store = createStore();
  for (let i = 0; i < 5; i += 1) store.promoUses.push({ code: 'LIMITED5', email: `u${i}@example.com`, orderId: 1001 + i });
  assert.equal(validatePromo({ store, now: NOW, rawCode: 'limited5', items: [BOTTLE] }).message, 'LIMITED5 has reached its usage limit.');
  store.promoUses.push({ code: 'WELCOME10', email: 'a@example.com', orderId: 1006 });
  const again = validatePromo({ store, now: NOW, rawCode: 'WELCOME10', items: [EARBUDS, CHECKLIST], email: 'a@example.com' });
  assert.equal(again.errorCode, 'PROMO_ALREADY_USED');
  assert.equal(again.message, 'WELCOME10 has already been used with this email.');
  assert.equal(validatePromo({ store, now: NOW, rawCode: 'WELCOME10', items: [EARBUDS, CHECKLIST], email: 'b@example.com' }).ok, true);
});

test('BR-13: an expired code on a cart below its minimum reports expiry first', () => {
  const store = createStore();
  assert.equal(validatePromo({ store, now: NOW, rawCode: 'MONSOON15', items: [BOTTLE] }).errorCode, 'PROMO_EXPIRED');
});
