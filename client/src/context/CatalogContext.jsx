import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../services/api.js';

const CatalogContext = createContext(null);

export function CatalogProvider({ children }) {
  const [state, setState] = useState({ status: 'loading', products: [], categories: [], error: null });

  const reload = useCallback(async () => {
    setState((s) => ({ ...s, status: s.products.length ? 'ready' : 'loading', error: null }));
    try {
      const data = await api.products.list();
      setState({ status: 'ready', products: data.products, categories: data.categories, error: null });
    } catch (error) {
      setState((s) => ({ ...s, status: 'error', error: error.message }));
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  return <CatalogContext.Provider value={{ ...state, reload }}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error('useCatalog must be used inside <CatalogProvider>');
  return ctx;
}
