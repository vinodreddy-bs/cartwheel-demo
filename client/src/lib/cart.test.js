import { describe, expect, it } from 'vitest';
import { addItem, cartLines, cartTotals, clampQty, parseStoredCart, reconcileCart, removeItem, setQuantity } from './cart.js';

const products = [
  { id: 1, name: 'Pulse Wireless Earbuds', price: 99900, stock: 40 },
  { id: 6, name: 'Stoneware Mug Set (4)', price: 64900, stock: 35 },
  { id: 7, name: 'Arc Desk Lamp', price: 184900, stock: 3 },
  { id: 9, name: 'Sold Out Thing', price: 1000, stock: 0 },
];

describe('clampQty', () => {
  it.each([
    ['', 1], ['abc', 1], [0, 1], [-1, 1], ['2.5', 2], [2.9, 2], [5, 3], ['3', 3], [1000, 3],
  ])('clampQty(%j, 3) → %i', (value, expected) => {
    expect(clampQty(value, 3)).toBe(expected);
  });
  it('never exceeds MAX_QTY', () => {
    expect(clampQty(500, 1000)).toBe(99);
  });
});

describe('item operations', () => {
  it('adds, merges and clamps to stock', () => {
    let items = addItem([], 7, 2, 3);
    items = addItem(items, 7, 2, 3);
    expect(items).toEqual([{ productId: 7, quantity: 3 }]);
  });
  it('sets and removes', () => {
    const items = setQuantity([{ productId: 1, quantity: 1 }], 1, '4', 40);
    expect(items).toEqual([{ productId: 1, quantity: 4 }]);
    expect(removeItem(items, 1)).toEqual([]);
  });
});

describe('cartLines and cartTotals', () => {
  it('prices from the catalogue and applies SH-01', () => {
    const lines = cartLines([{ productId: 6, quantity: 1 }], products);
    expect(lines[0].lineTotal).toBe(64900);
    expect(cartTotals(lines)).toEqual({ count: 1, subtotal: 64900, shipping: 9900, total: 74800 });
    const free = cartTotals(cartLines([{ productId: 1, quantity: 1 }], products));
    expect(free).toEqual({ count: 1, subtotal: 99900, shipping: 0, total: 99900 });
  });
  it('an empty cart costs nothing', () => {
    expect(cartTotals([])).toEqual({ count: 0, subtotal: 0, shipping: 0, total: 0 });
  });
});

describe('stored cart safety', () => {
  it.each([null, '', 'not json', '{"a":1}', '[{"productId":"x","quantity":1}]'])('parseStoredCart(%j) → []', (raw) => {
    expect(parseStoredCart(raw)).toEqual([]);
  });
  it('keeps well-formed items', () => {
    expect(parseStoredCart('[{"productId":1,"quantity":2,"price":5}]')).toEqual([{ productId: 1, quantity: 2 }]);
  });
  it('reconcile drops unknown and sold-out items and clamps to stock, with notices', () => {
    const { items, notices } = reconcileCart(
      [{ productId: 1, quantity: 1 }, { productId: 42, quantity: 1 }, { productId: 7, quantity: 5 }, { productId: 9, quantity: 1 }],
      products,
    );
    expect(items).toEqual([{ productId: 1, quantity: 1 }, { productId: 7, quantity: 3 }]);
    expect(notices).toEqual([
      'An item in your cart is no longer available and was removed.',
      'Only 3 of Arc Desk Lamp are available, so we updated your cart.',
      'Sold Out Thing is out of stock and was removed.',
    ]);
  });
});
