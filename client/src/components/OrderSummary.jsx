import { FREE_SHIPPING_MIN, formatDiscount, formatINR } from '../lib/money.js';
import './OrderSummary.css';
import './PromoSummary.css';

export default function OrderSummary({ subtotal, shipping, total, discount = 0, promoLabel = null, items, title = 'Order summary', footer, children, freeShippingHint = true }) {
  const toFree = FREE_SHIPPING_MIN - subtotal;
  return (
    <section className="summary card" aria-labelledby="summary-heading">
      <h2 id="summary-heading" className="summary-title">{title}</h2>
      {items && (
        <ul className="summary-items">
          {items.map((i) => (
            <li key={i.key}>
              <span>{i.name} <span className="summary-qty">× {i.quantity}</span></span>
              <span>{formatINR(i.lineTotal)}</span>
            </li>
          ))}
        </ul>
      )}
      {children}
      <dl className="summary-rows">
        <div className="summary-row">
          <dt>Subtotal</dt>
          <dd data-testid="summary-subtotal">{formatINR(subtotal)}</dd>
        </div>
        {discount > 0 && (
          <div className="summary-row summary-discount">
            <dt>{promoLabel}</dt>
            <dd data-testid="summary-discount">{formatDiscount(discount)}</dd>
          </div>
        )}
        <div className="summary-row">
          <dt>Shipping</dt>
          <dd data-testid="summary-shipping">{shipping === 0 ? 'Free' : formatINR(shipping)}</dd>
        </div>
        <div className="summary-row summary-total">
          <dt>Total</dt>
          <dd data-testid="summary-total">{formatINR(total)}</dd>
        </div>
      </dl>
      {freeShippingHint && shipping > 0 && toFree > 0 && <p className="summary-note">Add {formatINR(toFree)} more for free delivery.</p>}
      {footer}
    </section>
  );
}
