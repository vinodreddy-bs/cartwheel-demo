const express = require('express');

const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    message: 'Cartwheel API',
    version: '3.0.0',
    endpoints: ['/api/products', '/api/orders', '/api/users', '/api/analytics', '/api/search', '/api/health'],
  });
});

router.get('/health', (req, res) => {
  res.json({ status: 'OK', uptime: process.uptime(), timestamp: req.app.locals.clock.now().toISOString() });
});

router.get('/analytics', (req, res) => {
  const { users, products, orders } = req.app.locals.store;
  const revenue = orders.reduce((sum, o) => sum + o.total, 0);
  res.json({
    users: { total: users.length, admins: users.filter((u) => u.role === 'admin').length },
    products: {
      total: products.length,
      categories: [...new Set(products.map((p) => p.category))],
      inventoryValue: products.reduce((sum, p) => sum + p.price * p.stock, 0),
      lowStock: products.filter((p) => p.stock < 10).length,
    },
    orders: { total: orders.length, revenue, averageOrderValue: orders.length ? Math.round(revenue / orders.length) : 0 },
  });
});

router.get('/search', (req, res) => {
  const q = String(req.query.q || '').trim().toLowerCase();
  if (!q) return res.status(400).json({ error: 'Search query is required' });
  const { users, products } = req.app.locals.store;
  const results = {
    users: users.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)),
    products: products.filter((p) => [p.name, p.description, p.category].some((s) => s.toLowerCase().includes(q))),
  };
  res.json({ query: q, results, totalResults: results.users.length + results.products.length });
});

module.exports = router;
