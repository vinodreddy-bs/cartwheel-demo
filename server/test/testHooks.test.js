const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { createApp } = require('../app');

test('POST /api/test/reset restores seed data', async () => {
  const app = createApp();
  await request(app).post('/api/users').send({ name: 'Temp User', email: 'temp@example.com' });
  assert.equal((await request(app).get('/api/users')).body.total, 4);
  assert.equal((await request(app).post('/api/test/reset')).status, 200);
  assert.equal((await request(app).get('/api/users')).body.total, 3);
});

test('clock override sets, reports and clears server time', async () => {
  const app = createApp();
  const set = await request(app).post('/api/test/clock').send({ now: '2026-10-15T00:00:00+05:30' });
  assert.equal(set.status, 200);
  assert.equal(set.body.now, '2026-10-14T18:30:00.000Z');
  assert.deepEqual((await request(app).get('/api/test/clock')).body, { now: '2026-10-14T18:30:00.000Z', fixed: true });
  assert.equal((await request(app).post('/api/test/clock').send({ now: 'not a date' })).status, 422);
  const cleared = await request(app).delete('/api/test/clock');
  assert.equal(cleared.body.fixed, false);
});

test('reset also clears the clock override', async () => {
  const app = createApp();
  await request(app).post('/api/test/clock').send({ now: '2026-01-01T00:00:00Z' });
  await request(app).post('/api/test/reset');
  assert.equal((await request(app).get('/api/test/clock')).body.fixed, false);
});

test('test hooks are disabled in production unless ENABLE_TEST_HOOKS=1', async () => {
  const saved = { env: process.env.NODE_ENV, hooks: process.env.ENABLE_TEST_HOOKS };
  try {
    process.env.NODE_ENV = 'production';
    delete process.env.ENABLE_TEST_HOOKS;
    assert.equal((await request(createApp()).post('/api/test/reset')).status, 404);
    process.env.ENABLE_TEST_HOOKS = '1';
    assert.equal((await request(createApp()).post('/api/test/reset')).status, 200);
  } finally {
    process.env.NODE_ENV = saved.env;
    if (saved.hooks === undefined) delete process.env.ENABLE_TEST_HOOKS;
    else process.env.ENABLE_TEST_HOOKS = saved.hooks;
  }
});

test('unknown /api routes return JSON 404 and malformed JSON returns 400', async () => {
  const app = createApp();
  const missing = await request(app).get('/api/nope');
  assert.equal(missing.status, 404);
  assert.deepEqual(missing.body, { error: 'Not found' });
  const bad = await request(app).post('/api/users').set('Content-Type', 'application/json').send('{"name":');
  assert.equal(bad.status, 400);
  assert.deepEqual(bad.body, { error: 'Malformed JSON body' });
});
