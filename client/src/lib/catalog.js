export const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'name', label: 'Name' },
];

const COMPARATORS = {
  featured: (a, b) => a.id - b.id,
  price_asc: (a, b) => a.price - b.price || a.id - b.id,
  price_desc: (a, b) => b.price - a.price || a.id - b.id,
  name: (a, b) => a.name.localeCompare(b.name),
};

export function filterProducts(products, { category, q, sort } = {}) {
  const needle = (q || '').trim().toLowerCase();
  return products
    .filter((p) => !category || p.category === category)
    .filter((p) => !needle || [p.name, p.description, p.category].some((s) => s.toLowerCase().includes(needle)))
    .sort(COMPARATORS[sort] || COMPARATORS.featured);
}

export function stockLabel(stock) {
  if (stock <= 0) return { text: 'Out of stock', tone: 'out' };
  if (stock <= 5) return { text: `Only ${stock} left`, tone: 'low' };
  return { text: 'In stock', tone: 'ok' };
}
