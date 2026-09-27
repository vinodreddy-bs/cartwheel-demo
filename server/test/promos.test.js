const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { createApp } = require('../app');

const CUSTOMER = { name: 'Ravi Kumar', email: 'ravi@example.com', phone: '9876543210', address: '12 MG Road', city: 'Bengaluru', pin: '560038' };
const one = (productId, quantity = 1) => ({ productId, quantity });

async function appAt(now = '2026-09-30T12:00:00+05:30') {
  const app = createApp();
  await request(app).post('/api/test/clock').send({ now });
  return app;
}
const apply = (app, code, items, email) => request(app).post('/api/promos/apply').send({ code, items, email });
const order = (app, items, promoCode, customer = CUSTOMER) => request(app).post('/api/orders').send({ customer, items, promoCode });

test('GET /api/promos lists the six public codes with status for today', async () => {
  const res = await request(await appAt()).get('/api/promos');
  assert.equal(res.status, 200);
  const byCode = Object.fromEntries(res.body.promos.map((p) => [p.code, p.status]));
  assert.deepEqual(byCode, { WELCOME10: 'active', FLAT250: 'active', FREESHIP: 'active', BOOKS20: 'active', DIWALI25: 'not_started', MONSOON15: 'expired' });
});

test('GET /api/promos/:code checks any code, including unlisted ones', async () => {
  const app = await appAt();
  const limited = await request(app).get('/api/promos/limited5');
  assert.equal(limited.status, 200);
  assert.deepEqual([limited.body.code, limited.body.benefit, limited.body.status], ['LIMITED5', '₹100 off', 'active']);
  assert.equal((await request(app).get('/api/promos/NOPE99')).status, 404);
  assert.equal((await request(app).get('/api/promos/a-b')).status, 400);
});

test('POST /api/promos/apply returns the quote and message', async () => {
  const res = await apply(await appAt(), 'welcome10', [one(1), one(10)]);
  assert.equal(res.status, 200);
  assert.deepEqual(res.body, {
    code: 'WELCOME10', type: 'percentage', shortBenefit: '10% off', subtotal: 149800, discount: 14900,
    shipping: 0, total: 134900, savings: 14900, message: 'WELCOME10 applied. You saved ₹149.',
  });
});

test('apply: free shipping and category codes', async () => {
  const app = await appAt();
  const ship = await apply(app, 'FREESHIP', [one(6)]);
  assert.deepEqual([ship.body.shipping, ship.body.total, ship.body.savings], [0, 64900, 9900]);
  const books = await apply(app, 'BOOKS20', [one(8), one(6)]);
  assert.deepEqual([books.body.discount, books.body.shortBenefit], [11900, '20% off Books']);
});

test('apply: promo and item errors', async () => {
  const app = await appAt();
  const short = await apply(app, 'WELCOME10', [one(12, 2)]);
  assert.deepEqual([short.status, short.body.errorCode, short.body.shortfall], [422, 'PROMO_MIN_ORDER', 10100]);
  const empty = await apply(app, 'WELCOME10', []);
  assert.equal(empty.body.errorCode, 'PROMO_EMPTY_CART');
  const unknown = await apply(app, 'WELCOME10', [one(99)]);
  assert.deepEqual([unknown.status, unknown.body.error], [404, 'Product 99 not found']);
});

test('orders store the promo, and the discount changes the total', async () => {
  const app = await appAt();
  const res = await order(app, [one(1), one(10)], ' welcome10 ');
  assert.equal(res.status, 201);
  assert.deepEqual([res.body.order.promoCode, res.body.order.discount, res.body.order.total], ['WELCOME10', 14900, 134900]);
  const ship = await order(app, [one(6)], 'FREESHIP', { ...CUSTOMER, email: 'other@example.com' });
  assert.deepEqual([ship.body.order.shipping, ship.body.order.discount, ship.body.order.total], [0, 0, 64900]);
});

test('WELCOME10 once per email is enforced at order time; nothing is placed', async () => {
  const app = await appAt();
  assert.equal((await order(app, [one(1), one(10)], 'WELCOME10')).status, 201);
  const again = await order(app, [one(2)], 'WELCOME10', { ...CUSTOMER, email: 'RAVI@example.com' });
  assert.deepEqual([again.status, again.body.errorCode], [422, 'PROMO_ALREADY_USED']);
  assert.equal((await request(app).get('/api/orders')).body.total, 1);
  assert.equal((await request(app).get('/api/products/2')).body.stock, 25);
});

test('LIMITED5 stops after five orders', async () => {
  const app = await appAt();
  for (let i = 0; i < 5; i += 1) {
    const res = await order(app, [one(12)], 'LIMITED5', { ...CUSTOMER, email: `buyer${i}@example.com` });
    assert.equal(res.status, 201);
  }
  const sixth = await order(app, [one(12)], 'LIMITED5', { ...CUSTOMER, email: 'buyer6@example.com' });
  assert.equal(sixth.body.message, 'LIMITED5 has reached its usage limit.');
  assert.equal((await request(app).get('/api/promos/LIMITED5')).body.status, 'limit_reached');
});

test('an order without promoCode is unchanged', async () => {
  const res = await order(await appAt(), [one(6)]);
  assert.deepEqual([res.body.order.promoCode, res.body.order.discount, res.body.order.total], [null, 0, 74800]);
});
