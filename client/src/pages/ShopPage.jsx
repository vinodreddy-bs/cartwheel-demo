import { useSearchParams } from 'react-router';
import ProductCard from '../components/ProductCard.jsx';
import StatusMessage from '../components/StatusMessage.jsx';
import { useCatalog } from '../context/CatalogContext.jsx';
import { SORT_OPTIONS, filterProducts } from '../lib/catalog.js';
import './ShopPage.css';

export default function ShopPage() {
  const { status, products, categories, error, reload } = useCatalog();
  const [params, setParams] = useSearchParams();
  const category = params.get('category') || '';
  const q = params.get('q') || '';
  const sort = params.get('sort') || 'featured';

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value && !(key === 'sort' && value === 'featured')) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const visible = filterProducts(products, { category, q, sort });

  return (
    <>
      <section className="hero">
        <div className="container hero-inner">
          <h1>Everyday things, thoughtfully made.</h1>
          <p>Free delivery on orders from ₹999. Cash on delivery across India.</p>
          <a className="btn btn-primary" href="#products">Shop the collection</a>
        </div>
      </section>

      <section id="products" className="container page" aria-labelledby="products-heading">
        <h2 id="products-heading" className="sr-only">Products</h2>

        <div className="shop-toolbar">
          <div className="chips" role="group" aria-label="Category">
            {['', ...categories].map((c) => (
              <button
                key={c || 'all'} type="button" className="chip" aria-pressed={category === c}
                onClick={() => setParam('category', c)}
              >
                {c || 'All'}
              </button>
            ))}
          </div>
          <div className="shop-controls">
            <div className="field">
              <label htmlFor="shop-search">Search products</label>
              <input id="shop-search" type="search" value={q} placeholder="Search…" onChange={(e) => setParam('q', e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="shop-sort">Sort by</label>
              <select id="shop-sort" value={sort} onChange={(e) => setParam('sort', e.target.value)}>
                {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        {status === 'loading' && <p className="shop-count">Loading products…</p>}
        {status === 'error' && (
          <div className="shop-error">
            <StatusMessage tone="error" live="assertive">Couldn’t load products: {error}</StatusMessage>
            <button type="button" className="btn btn-secondary" onClick={reload}>Try again</button>
          </div>
        )}
        {status === 'ready' && (
          <>
            <p className="shop-count" role="status">{visible.length} {visible.length === 1 ? 'product' : 'products'}</p>
            {visible.length === 0 ? (
              <div className="empty-state">
                <p>No products match{q ? ` “${q.trim()}”` : ''}{category ? ` in ${category}` : ''}.</p>
                <button type="button" className="btn btn-secondary" onClick={() => setParams({}, { replace: true })}>Clear filters</button>
              </div>
            ) : (
              <div className="grid-auto product-grid">
                {visible.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            )}
          </>
        )}
      </section>
    </>
  );
}
