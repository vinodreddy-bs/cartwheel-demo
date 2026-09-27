const express = require('express');
const { nextId } = require('../store');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ROLES = ['admin', 'user'];
const router = express.Router();

function findUser(store, rawId) {
  if (!/^\d+$/.test(rawId)) return undefined;
  return store.users.find((u) => u.id === Number(rawId));
}

function validateNewUser(store, { name, email, role = 'user' } = {}) {
  if (!name || !email) return { status: 400, error: 'Name and email are required' };
  if (!EMAIL_RE.test(email)) return { status: 422, error: 'Valid email is required' };
  if (!ROLES.includes(role)) return { status: 422, error: 'Role must be admin or user' };
  if (store.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return { status: 409, error: 'Email already exists' };
  }
  return null;
}

function addUser(req, { name, email, role = 'user' }) {
  const { store, clock } = req.app.locals;
  const user = { id: nextId(store, 'user'), name: name.trim(), email: email.trim(), role, createdAt: clock.now().toISOString() };
  store.users.push(user);
  return user;
}

router.get('/', (req, res) => {
  const { users } = req.app.locals.store;
  const limit = Number.parseInt(req.query.limit, 10);
  let list = req.query.role ? users.filter((u) => u.role === req.query.role) : users;
  if (Number.isInteger(limit) && limit > 0) list = list.slice(0, limit);
  res.json({ users: list, total: list.length });
});

router.get('/paginated', (req, res) => {
  const { users } = req.app.locals.store;
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.max(1, Number.parseInt(req.query.limit, 10) || 10);
  const start = (page - 1) * limit;
  res.json({
    users: users.slice(start, start + limit),
    pagination: {
      page, limit, total: users.length, pages: Math.ceil(users.length / limit),
      hasNext: start + limit < users.length, hasPrev: start > 0,
    },
  });
});

router.post('/bulk', (req, res) => {
  const { store } = req.app.locals;
  const rows = req.body && req.body.users;
  if (!Array.isArray(rows)) return res.status(400).json({ error: 'Users must be an array' });
  const created = [];
  const errors = [];
  rows.forEach((row, index) => {
    const problem = validateNewUser(store, row);
    if (problem) errors.push({ index, error: problem.error });
    else created.push(addUser(req, row));
  });
  res.status(created.length > 0 ? 201 : 400).json({ message: `${created.length} users created`, created, errors });
});

router.get('/:id', (req, res) => {
  const user = findUser(req.app.locals.store, req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

router.post('/', (req, res) => {
  const problem = validateNewUser(req.app.locals.store, req.body);
  if (problem) return res.status(problem.status).json({ error: problem.error });
  res.status(201).json({ message: 'User created', user: addUser(req, req.body) });
});

router.put('/:id', (req, res) => {
  const { store } = req.app.locals;
  const user = findUser(store, req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { name, email, role } = req.body || {};
  if (email !== undefined && !EMAIL_RE.test(email)) return res.status(422).json({ error: 'Valid email is required' });
  if (role !== undefined && !ROLES.includes(role)) return res.status(422).json({ error: 'Role must be admin or user' });
  if (name !== undefined) user.name = String(name).trim();
  if (email !== undefined) user.email = email.trim();
  if (role !== undefined) user.role = role;
  res.json({ message: 'User updated', user });
});

router.delete('/:id', (req, res) => {
  const { store } = req.app.locals;
  const user = findUser(store, req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  store.users = store.users.filter((u) => u !== user);
  res.json({ message: 'User deleted', user });
});

module.exports = router;
