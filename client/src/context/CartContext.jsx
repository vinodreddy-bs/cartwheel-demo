import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { addItem, cartLines, cartTotals, parseStoredCart, reconcileCart, removeItem, setQuantity } from '../lib/cart.js';
import { readJSON, writeJSON } from '../lib/storage.js';
import { useCatalog } from './CatalogContext.jsx';

const CART_KEY = 'cartwheel.cart';
const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { products, status } = useCatalog();
  const [items, setItems] = useState(() => parseStoredCart(readJSON(CART_KEY, null)));
  const [notices, setNotices] = useState([]);

  useEffect(() => { writeJSON(CART_KEY, items); }, [items]);

  // When the catalogue (re)loads, drop items that vanished and clamp to stock.
  useEffect(() => {
    if (status !== 'ready') return;
    setItems((current) => {
      const result = reconcileCart(current, products);
      if (result.notices.length) setNotices(result.notices);
      return result.notices.length ? result.items : current;
    });
  }, [status, products]);

  const stockOf = useCallback((id) => products.find((p) => p.id === id)?.stock ?? 0, [products]);

  const value = useMemo(() => {
    const lines = cartLines(items, products);
    return {
      items,
      lines,
      totals: cartTotals(lines),
      count: items.reduce((sum, i) => sum + i.quantity, 0),
      add: (productId, qty) => setItems((cur) => addItem(cur, productId, qty, stockOf(productId))),
      update: (productId, qty) => setItems((cur) => setQuantity(cur, productId, qty, stockOf(productId))),
      remove: (productId) => setItems((cur) => removeItem(cur, productId)),
      clear: () => setItems([]),
      notices,
      dismissNotices: () => setNotices([]),
    };
  }, [items, products, notices, stockOf]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}
