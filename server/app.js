const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { createStore } = require('./store');
const { createClock } = require('./clock');

const CLIENT_DIST = path.join(__dirname, '../client/dist');

function testHooksEnabled() {
  return process.env.NODE_ENV !== 'production' || process.env.ENABLE_TEST_HOOKS === '1';
}

function createApp({ log = false } = {}) {
  const app = express();
  app.locals.store = createStore();
  app.locals.clock = createClock();

  app.use(cors());
  app.use(express.json());
  if (log) {
    app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
      next();
    });
  }

  app.get('/health', (req, res) => res.json({ status: 'OK' }));
  app.use('/api/users', require('./routes/users'));
  app.use('/api/products', require('./routes/products'));
  app.use('/api/orders', require('./routes/orders'));
  app.use('/api/tasks', require('./routes/tasks'));
  if (testHooksEnabled()) app.use('/api/test', require('./routes/testHooks'));
  app.use('/api', require('./routes/system'));
  app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

  if (fs.existsSync(CLIENT_DIST)) {
    app.use(express.static(CLIENT_DIST));
    app.get('*', (req, res) => res.sendFile(path.join(CLIENT_DIST, 'index.html')));
  }

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Malformed JSON body' });
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  });

  return app;
}

module.exports = { createApp };
