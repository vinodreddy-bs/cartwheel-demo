const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { createApp } = require('../app');

test('GET /api/users/paginated is not shadowed by /api/users/:id', async () => {
  const res = await request(createApp()).get('/api/users/paginated?page=1&limit=2');
  assert.equal(res.status, 200);
  assert.equal(res.body.users.length, 2);
  assert.deepEqual(res.body.pagination, { page: 1, limit: 2, total: 3, pages: 2, hasNext: true, hasPrev: false });
});

test('GET /api/users/:id returns 404 for unknown and non-numeric ids', async () => {
  const app = createApp();
  assert.equal((await request(app).get('/api/users/999')).status, 404);
  assert.equal((await request(app).get('/api/users/abc')).status, 404);
});

test('POST /api/users validates and rejects duplicates case-insensitively', async () => {
  const app = createApp();
  assert.equal((await request(app).post('/api/users').send({ name: 'Meera' })).status, 400);
  assert.equal((await request(app).post('/api/users').send({ name: 'Meera', email: 'nope' })).status, 422);
  const created = await request(app).post('/api/users').send({ name: 'Meera Iyer', email: 'meera@example.com' });
  assert.equal(created.status, 201);
  assert.equal(created.body.user.id, 4);
  assert.equal(created.body.user.role, 'user');
  const dup = await request(app).post('/api/users').send({ name: 'M', email: 'MEERA@example.com' });
  assert.equal(dup.status, 409);
});

test('POST /api/users/bulk assigns sequential ids and reports per-row errors', async () => {
  const res = await request(createApp()).post('/api/users/bulk').send({
    users: [{ name: 'A One', email: 'a1@example.com' }, { name: 'Bad' }, { name: 'B Two', email: 'b2@example.com' }],
  });
  assert.equal(res.status, 201);
  assert.deepEqual(res.body.created.map((u) => u.id), [4, 5]);
  assert.deepEqual(res.body.errors, [{ index: 1, error: 'Name and email are required' }]);
});

test('DELETE /api/users/:id removes the user', async () => {
  const app = createApp();
  assert.equal((await request(app).delete('/api/users/2')).status, 200);
  assert.equal((await request(app).get('/api/users')).body.total, 2);
});
