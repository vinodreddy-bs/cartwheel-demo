import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useCart } from '../context/CartContext.jsx';
import { stockLabel } from '../lib/catalog.js';
import { formatINR } from '../lib/money.js';
import './ProductCard.css';

export default function ProductCard({ product }) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);
  const stock = stockLabel(product.stock);

  useEffect(() => {
    if (!added) return undefined;
    const t = setTimeout(() => setAdded(false), 1500);
    return () => clearTimeout(t);
  }, [added]);

  return (
    <article className="product-card card">
      <Link to={`/product/${product.id}`} className="product-card-media">
        <img src={product.image} alt={product.name} width="400" height="400" loading="lazy" />
      </Link>
      <div className="product-card-body">
        <p className="product-card-category">{product.category}</p>
        <h3 className="product-card-name">
          <Link to={`/product/${product.id}`}>{product.name}</Link>
        </h3>
        <p className="product-card-price">{formatINR(product.price)}</p>
        {stock.tone !== 'ok' && <p className={`stock stock-${stock.tone}`}>{stock.text}</p>}
        <button
          type="button" className="btn btn-primary btn-block" disabled={product.stock === 0}
          onClick={() => { add(product.id, 1); setAdded(true); }}
          aria-label={`Add ${product.name} to cart`}
        >
          {product.stock === 0 ? 'Out of stock' : added ? 'Added ✓' : 'Add to cart'}
        </button>
      </div>
    </article>
  );
}
