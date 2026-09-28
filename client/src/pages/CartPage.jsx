import { Link } from 'react-router';
import OrderSummary from '../components/OrderSummary.jsx';
import PromoBox from '../components/PromoBox.jsx';
import QtyStepper from '../components/QtyStepper.jsx';
import StatusMessage from '../components/StatusMessage.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useCatalog } from '../context/CatalogContext.jsx';
import { usePromo } from '../context/PromoContext.jsx';
import { formatINR } from '../lib/money.js';
import { applyQuote } from '../lib/promo.js';
import './CartPage.css';

export default function CartPage() {
  const { status } = useCatalog();
  const { lines, totals, count, update, remove, notices, dismissNotices } = useCart();
  const { quote } = usePromo();
  const priced = applyQuote(totals, quote);

  const noticeBlock = notices.length > 0 && (
    <div className="cart-notices">
      <StatusMessage tone="info">{notices.join(' ')}</StatusMessage>
      <button type="button" className="btn-link" onClick={dismissNotices}>Dismiss</button>
    </div>
  );

  if (status === 'loading' && count > 0) return <p className="container page">Loading your cart…</p>;

  if (lines.length === 0) {
    return (
      <div className="container page page-narrow">
        {noticeBlock}
        <div className="empty-state">
          <h1 className="page-title">Your cart is empty</h1>
          <p>Find something you’ll love.</p>
          <Link className="btn btn-primary" to="/">Continue shopping</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container page cart-page">
      <h1 className="page-title">Your cart <span className="cart-count">({count} {count === 1 ? 'item' : 'items'})</span></h1>
      {noticeBlock}
      <div className="cart-layout">
        <ul className="cart-lines" aria-label="Items in your cart">
          {lines.map(({ product, quantity, lineTotal }) => (
            <li key={product.id} className="cart-line card" data-testid="cart-line">
              <img className="cart-line-img" src={product.image} alt="" width="72" height="72" />
              <div className="cart-line-info">
                <Link to={`/product/${product.id}`} className="cart-line-name">{product.name}</Link>
                <p className="cart-line-unit">{formatINR(product.price)} each</p>
              </div>
              <div className="cart-line-qty">
                <QtyStepper id={`qty-${product.id}`} itemName={product.name} size="sm" value={quantity} max={product.stock} onChange={(n) => update(product.id, n)} />
              </div>
              <p className="cart-line-total">{formatINR(lineTotal)}</p>
              <button type="button" className="btn-link cart-line-remove" onClick={() => remove(product.id)} aria-label={`Remove ${product.name}`}>
                Remove
              </button>
            </li>
          ))}
        </ul>
        <div className="cart-aside" id="cart-summary">
          <OrderSummary
            subtotal={priced.subtotal} shipping={priced.shipping} total={priced.total}
            discount={priced.discount} promoLabel={priced.promoLabel}
            footer={<Link className="btn btn-primary btn-block cart-summary-checkout" to="/checkout">Checkout</Link>}
          >
            <PromoBox />
          </OrderSummary>
        </div>
      </div>
      <div className="cart-sticky-bar">
        <div>
          <span className="cart-sticky-label">Total</span>
          <strong className="cart-sticky-total">{formatINR(priced.total)}</strong>
        </div>
        <a className="btn btn-secondary cart-sticky-promo" href="#cart-summary">Have a promo code?</a>
        <Link className="btn btn-primary" to="/checkout">Checkout</Link>
      </div>
    </div>
  );
}
