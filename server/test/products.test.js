const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { createApp } = require('../app');

test('catalogue has 12 products with integer paise prices and images', async () => {
  const res = await request(createApp()).get('/api/products');
  assert.equal(res.status, 200);
  assert.equal(res.body.total, 12);
  assert.deepEqual(res.body.categories, ['Electronics', 'Home & Kitchen', 'Books', 'Accessories']);
  for (const p of res.body.products) {
    assert.ok(Number.isInteger(p.price) && p.price > 0, `${p.name} price ${p.price}`);
    assert.equal(p.image, `/products/${p.id}.svg`);
  }
  assert.equal(res.body.products.find((p) => p.id === 1).price, 99900);
});

test('filters by category (case-insensitive) and free-text q', async () => {
  const app = createApp();
  const books = await request(app).get('/api/products?category=books');
  assert.deepEqual(books.body.products.map((p) => p.id), [8, 9, 10]);
  const q = await request(app).get('/api/products').query({ q: '  LAMP ' });
  assert.deepEqual(q.body.products.map((p) => p.id), [7]);
});

test('sorts by price and name; rejects unknown sort', async () => {
  const app = createApp();
  const asc = (await request(app).get('/api/products?sort=price_asc')).body.products.map((p) => p.price);
  assert.deepEqual(asc, [...asc].sort((a, b) => a - b));
  const desc = (await request(app).get('/api/products?sort=price_desc')).body.products;
  assert.equal(desc[0].id, 4);
  const byName = (await request(app).get('/api/products?sort=name')).body.products;
  assert.equal(byName[0].name, 'Arc Desk Lamp');
  assert.equal((await request(app).get('/api/products?sort=cheap')).status, 400);
});

test('GET /api/products/:id 404s for unknown and non-numeric ids', async () => {
  const app = createApp();
  assert.equal((await request(app).get('/api/products/4')).body.name, 'Hush ANC Headphones');
  assert.equal((await request(app).get('/api/products/99')).status, 404);
  assert.equal((await request(app).get('/api/products/1abc')).status, 404);
});

test('POST /api/products requires integer paise price and non-negative integer stock', async () => {
  const app = createApp();
  const base = { name: 'Canvas Tote', category: 'Accessories' };
  for (const price of [undefined, 0, -100, 12.5, '499']) {
    const res = await request(app).post('/api/products').send({ ...base, price });
    assert.equal(res.status, 422, `price ${price}`);
  }
  assert.equal((await request(app).post('/api/products').send({ ...base, price: 49900, stock: -1 })).status, 422);
  assert.equal((await request(app).post('/api/products').send({ price: 49900 })).status, 422);
  const ok = await request(app).post('/api/products').send({ ...base, price: 49900, stock: 5 });
  assert.equal(ok.status, 201);
  assert.deepEqual(ok.body.product, {
    id: 13, name: 'Canvas Tote', category: 'Accessories', price: 49900, stock: 5, description: '', image: '/products/placeholder.svg',
  });
});
