const express = require('express');
const { nextId } = require('../store');

const SORTS = {
  featured: (a, b) => a.id - b.id,
  price_asc: (a, b) => a.price - b.price || a.id - b.id,
  price_desc: (a, b) => b.price - a.price || a.id - b.id,
  name: (a, b) => a.name.localeCompare(b.name),
};
const router = express.Router();

router.get('/', (req, res) => {
  const { products } = req.app.locals.store;
  const { category, sort = 'featured' } = req.query;
  if (!SORTS[sort]) return res.status(400).json({ error: `Unknown sort "${sort}"`, allowed: Object.keys(SORTS) });
  const q = String(req.query.q || '').trim().toLowerCase();
  let list = [...products];
  if (category) list = list.filter((p) => p.category.toLowerCase() === String(category).toLowerCase());
  if (q) list = list.filter((p) => [p.name, p.description, p.category].some((s) => s.toLowerCase().includes(q)));
  list.sort(SORTS[sort]);
  res.json({ products: list, total: list.length, categories: [...new Set(products.map((p) => p.category))] });
});

router.get('/:id', (req, res) => {
  const product = /^\d+$/.test(req.params.id)
    ? req.app.locals.store.products.find((p) => p.id === Number(req.params.id))
    : undefined;
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

router.post('/', (req, res) => {
  const { store } = req.app.locals;
  const { name, category, price, stock = 0, description = '' } = req.body || {};
  const cleanName = String(name || '').trim();
  const cleanCategory = String(category || '').trim();
  if (cleanName.length < 2 || !cleanCategory) return res.status(422).json({ error: 'Name and category are required' });
  if (!Number.isInteger(price) || price <= 0) return res.status(422).json({ error: 'Price must be a positive whole number of paise' });
  if (!Number.isInteger(stock) || stock < 0) return res.status(422).json({ error: 'Stock must be a whole number, 0 or more' });
  const product = {
    id: nextId(store, 'product'), name: cleanName, category: cleanCategory, price, stock,
    description: String(description).trim(), image: '/products/placeholder.svg',
  };
  store.products.push(product);
  res.status(201).json({ message: 'Product created', product });
});

module.exports = router;
