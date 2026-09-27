import { useState } from 'react';
import { Link, useParams } from 'react-router';
import '../components/ProductCard.css';
import QtyStepper from '../components/QtyStepper.jsx';
import StatusMessage from '../components/StatusMessage.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useCatalog } from '../context/CatalogContext.jsx';
import { stockLabel } from '../lib/catalog.js';
import { formatINR } from '../lib/money.js';
import NotFoundPage from './NotFoundPage.jsx';
import './ProductPage.css';

export default function ProductPage() {
  const { id } = useParams();
  const { status, products, error, reload } = useCatalog();
  const { add, items } = useCart();
  const [qty, setQty] = useState(1);
  const [message, setMessage] = useState('');

  if (status === 'loading') return <p className="container page">Loading…</p>;
  if (status === 'error') {
    return (
      <div className="container page">
        <StatusMessage tone="error" live="assertive">Couldn’t load this product: {error}</StatusMessage>
        <button type="button" className="btn btn-secondary" onClick={reload}>Try again</button>
      </div>
    );
  }

  const product = products.find((p) => String(p.id) === id);
  if (!product) return <NotFoundPage />;

  const stock = stockLabel(product.stock);
  const inCart = items.find((i) => i.productId === product.id)?.quantity ?? 0;
  const canAdd = product.stock - inCart;

  const onAdd = () => {
    const adding = Math.min(qty, canAdd);
    add(product.id, adding);
    setMessage(`Added ${adding} × ${product.name} to your cart.`);
    setQty(1);
  };

  return (
    <div className="container page product-page">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Shop</Link> <span aria-hidden="true">/</span>{' '}
        <Link to={`/?category=${encodeURIComponent(product.category)}`}>{product.category}</Link>
      </nav>
      <div className="product-layout">
        <div className="product-media card">
          <img src={product.image} alt={product.name} width="400" height="400" />
        </div>
        <div className="product-info">
          <h1 className="page-title">{product.name}</h1>
          <p className="product-price">{formatINR(product.price)}</p>
          <p className={`stock stock-${stock.tone}`}>{stock.text}</p>
          <p className="product-description">{product.description}</p>
          {product.stock > 0 && (
            <div className="product-actions">
              <QtyStepper id="product-qty" value={qty} max={Math.max(1, canAdd)} onChange={setQty} />
              <button type="button" className="btn btn-primary" disabled={canAdd <= 0} onClick={onAdd}>
                {canAdd <= 0 ? 'All in your cart' : 'Add to cart'}
              </button>
            </div>
          )}
          {message && (
            <StatusMessage tone="success">
              {message} <Link to="/cart">View cart</Link>
            </StatusMessage>
          )}
          <ul className="product-perks">
            <li>Free delivery on orders from ₹999</li>
            <li>Cash on delivery</li>
            <li>7-day easy returns</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
