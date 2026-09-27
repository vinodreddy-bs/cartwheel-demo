const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { createApp } = require('../app');

const CUSTOMER = {
  name: 'Ravi Kumar', email: 'Ravi@Example.com', phone: '98765 43210',
  address: '12 MG Road, Indiranagar', city: 'Bengaluru', pin: '560038',
};
const place = (app, items, customer = CUSTOMER) => request(app).post('/api/orders').send({ customer, items });

test('places a multi-item order with correct paise totals and decrements stock', async () => {
  const app = createApp();
  const res = await place(app, [{ productId: 6, quantity: 1 }, { productId: 12, quantity: 2 }]);
  assert.equal(res.status, 201);
  const { order } = res.body;
  assert.equal(order.id, 1001);
  assert.equal(order.subtotal, 64900 + 2 * 44900);
  assert.equal(order.shipping, 0);
  assert.equal(order.total, 154700);
  assert.equal(order.discount, 0);
  assert.equal(order.promoCode, null);
  assert.equal(order.status, 'placed');
  assert.deepEqual(order.items[1], { productId: 12, name: 'Steel Water Bottle', category: 'Accessories', price: 44900, quantity: 2, lineTotal: 89800 });
  assert.equal(order.customer.email, 'ravi@example.com');
  assert.equal(order.customer.phone, '9876543210');
  assert.equal((await request(app).get('/api/products/12')).body.stock, 68);
});

test('SH-01: ₹99 shipping below ₹999, free at exactly ₹999', async () => {
  const app = createApp();
  const below = (await place(app, [{ productId: 6, quantity: 1 }])).body.order;
  assert.deepEqual([below.subtotal, below.shipping, below.total], [64900, 9900, 74800]);
  const boundary = (await place(app, [{ productId: 1, quantity: 1 }])).body.order;
  assert.deepEqual([boundary.subtotal, boundary.shipping, boundary.total], [99900, 0, 99900]);
});

test('merges duplicate lines before checking stock', async () => {
  const app = createApp();
  const res = await place(app, [{ productId: 7, quantity: 2 }, { productId: 7, quantity: 2 }]);
  assert.equal(res.status, 409);
  assert.deepEqual(res.body, { error: 'Only 3 left of Arc Desk Lamp', productId: 7 });
  assert.equal((await request(app).get('/api/products/7')).body.stock, 3);
});

test('rejects invalid quantities without creating an order', async () => {
  const app = createApp();
  for (const quantity of [0, -1, 2.5, '2', 'abc', null, 100]) {
    const res = await place(app, [{ productId: 1, quantity }]);
    assert.equal(res.status, 422, `quantity ${JSON.stringify(quantity)}`);
  }
  assert.equal((await place(app, [])).status, 422);
  assert.equal((await place(app, [{ productId: 99, quantity: 1 }])).status, 404);
  assert.equal((await request(app).get('/api/orders')).body.total, 0);
});

test('the last unit can be bought once; the next buyer gets 409 out of stock', async () => {
  const app = createApp();
  assert.equal((await place(app, [{ productId: 7, quantity: 3 }])).status, 201);
  const second = await place(app, [{ productId: 7, quantity: 1 }]);
  assert.equal(second.status, 409);
  assert.equal(second.body.error, 'Arc Desk Lamp is out of stock');
});

test('validates customer fields and reports each one', async () => {
  const res = await place(createApp(), [{ productId: 1, quantity: 1 }], {
    name: ' ', email: 'x@', phone: '12345', address: '', city: '', pin: '012345',
  });
  assert.equal(res.status, 422);
  assert.equal(res.body.error, 'Please check your details');
  assert.deepEqual(Object.keys(res.body.fields).sort(), ['address', 'city', 'email', 'name', 'phone', 'pin']);
});

test('GET /api/orders/:id and list newest first', async () => {
  const app = createApp();
  await place(app, [{ productId: 8, quantity: 1 }]);
  await place(app, [{ productId: 9, quantity: 1 }]);
  assert.equal((await request(app).get('/api/orders/1002')).body.items[0].productId, 9);
  assert.equal((await request(app).get('/api/orders/5')).status, 404);
  assert.deepEqual((await request(app).get('/api/orders')).body.orders.map((o) => o.id), [1002, 1001]);
});

test('legacy { userId, productId, quantity } body still works and validates', async () => {
  const app = createApp();
  const ok = await request(app).post('/api/orders').send({ userId: 2, productId: 3, quantity: 2 });
  assert.equal(ok.status, 201);
  assert.equal(ok.body.order.customer.email, 'kabir@example.com');
  assert.equal(ok.body.order.total, 439800);
  assert.equal((await request(app).post('/api/orders').send({ userId: 2, productId: 3, quantity: '' })).status, 422);
  assert.equal((await request(app).post('/api/orders').send({ userId: 99, productId: 3 })).status, 404);
});
