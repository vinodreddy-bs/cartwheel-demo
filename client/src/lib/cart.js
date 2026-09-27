import { shippingFor } from './money.js';

export const MAX_QTY = 99;

export function clampQty(value, stock) {
  const limit = Math.max(1, Math.min(stock, MAX_QTY));
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(n, limit);
}

export function addItem(items, productId, quantity, stock) {
  const existing = items.find((i) => i.productId === productId);
  const wanted = (existing ? existing.quantity : 0) + clampQty(quantity, stock);
  return setQuantity(existing ? items : [...items, { productId, quantity: 1 }], productId, wanted, stock);
}

export function setQuantity(items, productId, quantity, stock) {
  return items.map((i) => (i.productId === productId ? { productId, quantity: clampQty(quantity, stock) } : i));
}

export function removeItem(items, productId) {
  return items.filter((i) => i.productId !== productId);
}

export function cartLines(items, products) {
  return items.flatMap((item) => {
    const product = products.find((p) => p.id === item.productId);
    return product ? [{ product, quantity: item.quantity, lineTotal: product.price * item.quantity }] : [];
  });
}

export function cartTotals(lines) {
  const count = lines.reduce((sum, l) => sum + l.quantity, 0);
  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
  const shipping = lines.length ? shippingFor(subtotal) : 0;
  return { count, subtotal, shipping, total: subtotal + shipping };
}

export function parseStoredCart(raw) {
  try {
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data
      .filter((i) => i && Number.isInteger(i.productId) && Number.isInteger(i.quantity) && i.quantity > 0)
      .map(({ productId, quantity }) => ({ productId, quantity }));
  } catch {
    return [];
  }
}

export function reconcileCart(items, products) {
  const notices = [];
  const kept = [];
  for (const item of items) {
    const product = products.find((p) => p.id === item.productId);
    if (!product) {
      notices.push('An item in your cart is no longer available and was removed.');
    } else if (product.stock === 0) {
      notices.push(`${product.name} is out of stock and was removed.`);
    } else if (item.quantity > product.stock) {
      notices.push(`Only ${product.stock} of ${product.name} are available, so we updated your cart.`);
      kept.push({ productId: item.productId, quantity: product.stock });
    } else {
      kept.push(item);
    }
  }
  return { items: kept, notices };
}
