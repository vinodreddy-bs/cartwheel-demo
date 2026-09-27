import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { isPromoError, removalMessage } from '../lib/promo.js';
import { readJSON, writeJSON } from '../lib/storage.js';
import { api } from '../services/api.js';
import { useCart } from './CartContext.jsx';

const PROMO_KEY = 'cartwheel.promo';
const NO_MESSAGE = { tone: 'info', text: '' };
const PromoContext = createContext(null);

function readStoredCode() {
  try {
    const value = JSON.parse(readJSON(PROMO_KEY, 'null'));
    return typeof value === 'string' && value ? value : null;
  } catch {
    return null;
  }
}

export function PromoProvider({ children }) {
  const { items } = useCart();
  const [code, setCode] = useState(readStoredCode);
  const [quote, setQuote] = useState(null);
  const [message, setMessage] = useState(NO_MESSAGE);
  const latestRequest = useRef(0);
  const checkedKey = useRef('');
  const itemsKey = JSON.stringify(items);

  useEffect(() => { writeJSON(PROMO_KEY, code); }, [code]);

  // BR-14 / BR-15: re-check the applied code on load and whenever the cart changes.
  useEffect(() => {
    if (!code) return;
    const key = `${code}|${itemsKey}`;
    if (checkedKey.current === key) return;
    checkedKey.current = key;
    const requestId = ++latestRequest.current;
    api.promos.apply({ code, items: JSON.parse(itemsKey) })
      .then((result) => {
        if (requestId !== latestRequest.current) return;
        setQuote(result);
        setMessage({ tone: 'success', text: result.message });
      })
      .catch((err) => {
        if (requestId !== latestRequest.current) return;
        setQuote(null);
        if (isPromoError(err)) {
          setCode(null);
          setMessage({ tone: 'error', text: removalMessage(code, err.body.message) });
        }
      });
  }, [code, itemsKey]);

  const setApplied = useCallback((result) => {
    checkedKey.current = `${result.code}|${itemsKey}`;
    latestRequest.current += 1;
    setCode(result.code);
    setQuote(result);
    setMessage({ tone: 'success', text: result.message });
  }, [itemsKey]);

  const remove = useCallback(() => {
    latestRequest.current += 1;
    setCode(null);
    setQuote(null);
    setMessage(NO_MESSAGE);
  }, []);

  const value = useMemo(() => ({
    code,
    quote,
    message,
    setApplied,
    setMessage,
    remove,
    onOrderPlaced: remove,
    onOrderRejected: (body) => {
      const text = removalMessage(code, body.message);
      latestRequest.current += 1;
      setCode(null);
      setQuote(null);
      setMessage({ tone: 'error', text });
      return text;
    },
  }), [code, quote, message, setApplied, remove]);

  return <PromoContext.Provider value={value}>{children}</PromoContext.Provider>;
}

export function usePromo() {
  const ctx = useContext(PromoContext);
  if (!ctx) throw new Error('usePromo must be used inside <PromoProvider>');
  return ctx;
}
