const express = require('express');
const { createStore } = require('../store');

const router = express.Router();

router.post('/reset', (req, res) => {
  req.app.locals.store = createStore();
  req.app.locals.clock.clear();
  res.json({ ok: true });
});

router.get('/clock', (req, res) => {
  const { clock } = req.app.locals;
  res.json({ now: clock.now().toISOString(), fixed: clock.isFixed() });
});

router.post('/clock', (req, res) => {
  const date = new Date(req.body && req.body.now);
  if (Number.isNaN(date.getTime())) return res.status(422).json({ error: 'now must be an ISO date-time' });
  req.app.locals.clock.set(date);
  res.json({ now: date.toISOString(), fixed: true });
});

router.delete('/clock', (req, res) => {
  const { clock } = req.app.locals;
  clock.clear();
  res.json({ now: clock.now().toISOString(), fixed: false });
});

module.exports = router;
