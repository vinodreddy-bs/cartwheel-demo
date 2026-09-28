const { SEED_PROMOS } = require('./promos/catalog');

const SEED_TIME = '2026-09-01T09:00:00.000Z';

const SEED_USERS = [
  { id: 1, name: 'Asha Rao', email: 'asha@example.com', role: 'admin' },
  { id: 2, name: 'Kabir Mehta', email: 'kabir@example.com', role: 'user' },
  { id: 3, name: 'Priya Nair', email: 'priya@example.com', role: 'user' },
];

// Prices in paise.
const SEED_PRODUCTS = [
  { id: 1, name: 'Pulse Wireless Earbuds', category: 'Electronics', price: 99900, stock: 40, description: 'Pocket-sized earbuds with 24-hour battery and a snug fit.' },
  { id: 2, name: 'Stride Smartwatch', category: 'Electronics', price: 449900, stock: 25, description: 'Heart rate, sleep and step tracking with a week of battery.' },
  { id: 3, name: 'Boom Mini Speaker', category: 'Electronics', price: 219900, stock: 30, description: 'Splash-proof speaker that fills a room from your palm.' },
  { id: 4, name: 'Hush ANC Headphones', category: 'Electronics', price: 799900, stock: 12, description: 'Over-ear headphones with active noise cancelling.' },
  { id: 5, name: 'Pour-Over Coffee Kit', category: 'Home & Kitchen', price: 129900, stock: 20, description: 'Glass dripper, reusable filter and a matching carafe.' },
  { id: 6, name: 'Stoneware Mug Set (4)', category: 'Home & Kitchen', price: 64900, stock: 35, description: 'Four hand-glazed 350 ml mugs.' },
  { id: 7, name: 'Arc Desk Lamp', category: 'Home & Kitchen', price: 184900, stock: 3, description: 'Dimmable LED lamp with a warm-to-cool slider.' },
  { id: 8, name: 'Testing in the Age of AI', category: 'Books', price: 59900, stock: 50, description: 'A practical guide to shipping AI-written code with confidence.' },
  { id: 9, name: 'Designing Reliable Systems', category: 'Books', price: 79900, stock: 45, description: 'Patterns for software that keeps working when things go wrong.' },
  { id: 10, name: 'The Pragmatic Checklist', category: 'Books', price: 49900, stock: 60, description: 'Short checklists for everyday engineering decisions.' },
  { id: 11, name: 'Trail Canvas Backpack', category: 'Accessories', price: 199900, stock: 18, description: '22-litre waxed canvas pack with a padded laptop sleeve.' },
  { id: 12, name: 'Steel Water Bottle', category: 'Accessories', price: 44900, stock: 70, description: 'Double-walled, keeps drinks cold for 24 hours.' },
];

const SEED_TASKS = [
  { id: 1, title: 'Photograph new arrivals', completed: false, priority: 'high', assignedTo: 1 },
  { id: 2, title: 'Update shipping FAQ', completed: true, priority: 'medium', assignedTo: 2 },
  { id: 3, title: 'Restock desk lamps', completed: false, priority: 'high', assignedTo: 3 },
];

function createStore() {
  const users = SEED_USERS.map((u) => ({ ...u, createdAt: SEED_TIME }));
  const products = SEED_PRODUCTS.map((p) => ({ ...p, image: `/products/${p.id}.svg` }));
  const tasks = SEED_TASKS.map((t) => ({ ...t, createdAt: SEED_TIME }));
  return {
    users,
    products,
    orders: [],
    tasks,
    promos: SEED_PROMOS.map((p) => ({ ...p })),
    promoUses: [],
    counters: { user: users.length, product: products.length, order: 1000, task: tasks.length },
  };
}

function nextId(store, kind) {
  store.counters[kind] += 1;
  return store.counters[kind];
}

module.exports = { createStore, nextId };
