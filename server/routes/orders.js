const express = require('express');
const { nextId } = require('../store');
const { priceItems } = require('../lib/money');
const { quotePromo } = require('../promos/calculate');
const { promoErrorBody, validatePromo } = require('../promos/validate');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_QTY = 99;
const router = express.Router();

function parseItems(rawItems, products) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) return { status: 422, error: 'Your cart is empty' };
  const qtyById = new Map();
  for (const raw of rawItems) {
    const productId = raw && raw.productId;
    const quantity = raw && raw.quantity;
    if (!Number.isInteger(productId)) return { status: 422, error: 'Each item needs a productId' };
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QTY) {
      return { status: 422, error: `Quantity must be a whole number from 1 to ${MAX_QTY}` };
    }
    qtyById.set(productId, (qtyById.get(productId) || 0) + quantity);
  }
  const items = [];
  for (const [productId, quantity] of qtyById) {
    const product = products.find((p) => p.id === productId);
    if (!product) return { status: 404, error: `Product ${productId} not found` };
    if (quantity > product.stock) {
      const error = product.stock === 0 ? `${product.name} is out of stock` : `Only ${product.stock} left of ${product.name}`;
      return { status: 409, error, productId };
    }
    items.push({ productId, name: product.name, category: product.category, price: product.price, quantity, lineTotal: product.price * quantity });
  }
  return { items };
}

function validateCustomer(raw = {}) {
  const str = (v) => (typeof v === 'string' ? v.trim() : '');
  const customer = {
    name: str(raw.name), email: str(raw.email).toLowerCase(), phone: str(raw.phone).replace(/[\s-]/g, ''),
    address: str(raw.address), city: str(raw.city), pin: str(raw.pin),
  };
  const fields = {};
  if (customer.name.length < 2) fields.name = 'Enter your full name';
  if (!EMAIL_RE.test(customer.email)) fields.email = 'Enter a valid email address';
  if (!/^[6-9]\d{9}$/.test(customer.phone)) fields.phone = 'Enter a valid 10-digit mobile number';
  if (customer.address.length < 5) fields.address = 'Enter your street address';
  if (customer.city.length < 2) fields.city = 'Enter your city';
  if (!/^[1-9]\d{5}$/.test(customer.pin)) fields.pin = 'Enter a valid 6-digit PIN code';
  return Object.keys(fields).length ? { fields } : { customer };
}

function fromLegacyBody(store, { userId, productId, quantity = 1 }) {
  const user = store.users.find((u) => u.id === Number(userId));
  if (!user) return { status: 404, error: 'User not found' };
  const qty = typeof quantity === 'string' && /^\d+$/.test(quantity) ? Number(quantity) : quantity;
  return { customer: { name: user.name, email: user.email.toLowerCase(), phone: '', address: '', city: '', pin: '' }, rawItems: [{ productId: Number(productId), quantity: qty }] };
}

function commitOrder(req, { customer, items, discount = 0, promoCode = null, shipping }) {
  const { store, clock } = req.app.locals;
  const priced = priceItems(items);
  const finalShipping = shipping === undefined ? priced.shipping : shipping;
  for (const item of items) store.products.find((p) => p.id === item.productId).stock -= item.quantity;
  const order = {
    id: nextId(store, 'order'), customer, items, subtotal: priced.subtotal, shipping: finalShipping, discount, promoCode,
    total: priced.subtotal - discount + finalShipping, status: 'placed', createdAt: clock.now().toISOString(),
  };
  store.orders.push(order);
  return order;
}

router.get('/', (req, res) => {
  const orders = [...req.app.locals.store.orders].reverse();
  res.json({ orders, total: orders.length });
});

router.get('/:id', (req, res) => {
  const order = req.app.locals.store.orders.find((o) => String(o.id) === req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
});

router.post('/', (req, res) => {
  const { store } = req.app.locals;
  const body = req.body || {};
  let customer;
  let rawItems;
  if (body.userId !== undefined) {
    const legacy = fromLegacyBody(store, body);
    if (legacy.error) return res.status(legacy.status).json({ error: legacy.error });
    ({ customer, rawItems } = legacy);
  } else {
    const checked = validateCustomer(body.customer);
    if (checked.fields) return res.status(422).json({ error: 'Please check your details', fields: checked.fields });
    customer = checked.customer;
    rawItems = body.items;
  }
  const parsed = parseItems(rawItems, store.products);
  if (parsed.error) {
    const { status, error, productId } = parsed;
    return res.status(status).json(productId ? { error, productId } : { error });
  }
  let promo = null;
  if (typeof body.promoCode === 'string' && body.promoCode.trim() !== '') {
    const result = validatePromo({ store, now: req.app.locals.clock.now(), rawCode: body.promoCode, items: parsed.items, email: customer.email });
    if (!result.ok) return res.status(result.status).json(promoErrorBody(result));
    promo = { code: result.code, quote: quotePromo(result.promo, parsed.items) };
  }
  const order = commitOrder(req, {
    customer,
    items: parsed.items,
    discount: promo ? promo.quote.discount : 0,
    promoCode: promo ? promo.code : null,
    shipping: promo ? promo.quote.shipping : undefined,
  });
  if (promo) store.promoUses.push({ code: promo.code, email: customer.email, orderId: order.id });
  res.status(201).json({ order });
});

module.exports = router;
module.exports.parseItems = parseItems;
module.exports.validateCustomer = validateCustomer;
module.exports.commitOrder = commitOrder;
