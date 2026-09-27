import { describe, expect, it } from 'vitest';
import { filterProducts, stockLabel } from './catalog.js';

const products = [
  { id: 1, name: 'Pulse Wireless Earbuds', category: 'Electronics', price: 99900, description: 'Pocket-sized earbuds' },
  { id: 7, name: 'Arc Desk Lamp', category: 'Home & Kitchen', price: 184900, description: 'Dimmable LED lamp' },
  { id: 8, name: 'Testing in the Age of AI', category: 'Books', price: 59900, description: 'A practical guide' },
  { id: 12, name: 'Steel Water Bottle', category: 'Accessories', price: 44900, description: 'Keeps drinks cold' },
];

describe('filterProducts', () => {
  it('returns everything in featured (id) order by default', () => {
    expect(filterProducts(products, {}).map((p) => p.id)).toEqual([1, 7, 8, 12]);
  });
  it('filters by category and trimmed, case-insensitive search over name, description and category', () => {
    expect(filterProducts(products, { category: 'Books' }).map((p) => p.id)).toEqual([8]);
    expect(filterProducts(products, { q: '  LAMP ' }).map((p) => p.id)).toEqual([7]);
    expect(filterProducts(products, { q: 'kitchen' }).map((p) => p.id)).toEqual([7]);
    expect(filterProducts(products, { category: 'Books', q: 'lamp' })).toEqual([]);
  });
  it('sorts by price both ways and by name; unknown sort falls back to featured', () => {
    expect(filterProducts(products, { sort: 'price_asc' }).map((p) => p.id)).toEqual([12, 8, 1, 7]);
    expect(filterProducts(products, { sort: 'price_desc' }).map((p) => p.id)).toEqual([7, 1, 8, 12]);
    expect(filterProducts(products, { sort: 'name' }).map((p) => p.id)).toEqual([7, 1, 12, 8]);
    expect(filterProducts(products, { sort: 'bogus' }).map((p) => p.id)).toEqual([1, 7, 8, 12]);
  });
  it('does not mutate the input', () => {
    const copy = [...products];
    filterProducts(products, { sort: 'price_desc' });
    expect(products).toEqual(copy);
  });
});

describe('stockLabel', () => {
  it.each([[0, 'Out of stock', 'out'], [1, 'Only 1 left', 'low'], [5, 'Only 5 left', 'low'], [6, 'In stock', 'ok']])(
    'stockLabel(%i)', (stock, text, tone) => { expect(stockLabel(stock)).toEqual({ text, tone }); },
  );
});
