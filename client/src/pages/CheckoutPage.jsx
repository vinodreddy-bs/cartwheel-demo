import { useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import OrderSummary from '../components/OrderSummary.jsx';
import StatusMessage from '../components/StatusMessage.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useCatalog } from '../context/CatalogContext.jsx';
import { EMPTY_CUSTOMER, normalizeCustomer, validateCustomer } from '../lib/checkout.js';
import { api } from '../services/api.js';
import './CheckoutPage.css';

const FIELDS = [
  { name: 'name', label: 'Full name', autoComplete: 'name' },
  { name: 'email', label: 'Email', type: 'email', autoComplete: 'email', inputMode: 'email' },
  { name: 'phone', label: 'Mobile number', type: 'tel', autoComplete: 'tel-national', inputMode: 'tel' },
  { name: 'address', label: 'Address', autoComplete: 'street-address', wide: true },
  { name: 'city', label: 'City', autoComplete: 'address-level2' },
  { name: 'pin', label: 'PIN code', autoComplete: 'postal-code', inputMode: 'numeric', maxLength: 6 },
];

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { status, reload } = useCatalog();
  const { items, lines, totals, clear } = useCart();
  const [form, setForm] = useState(EMPTY_CUSTOMER);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const placed = useRef(false);

  if (status === 'loading' && items.length > 0) return <p className="container page">Loading…</p>;
  if (lines.length === 0 && !placed.current) return <Navigate to="/cart" replace />;

  const focusField = (name) => document.getElementById(`checkout-${name}`)?.focus();

  const onSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    const fieldErrors = validateCustomer(form);
    setErrors(fieldErrors);
    setFormError('');
    const firstBad = FIELDS.find((f) => fieldErrors[f.name]);
    if (firstBad) { focusField(firstBad.name); return; }

    setSubmitting(true);
    try {
      const { order } = await api.orders.create({ customer: normalizeCustomer(form), items });
      placed.current = true;
      clear();
      reload();
      navigate(`/order/${order.id}`, { replace: true });
    } catch (err) {
      if (err.body?.fields) {
        setErrors(err.body.fields);
        const bad = FIELDS.find((f) => err.body.fields[f.name]);
        if (bad) focusField(bad.name);
      }
      setFormError(err.message);
      if (err.status === 409) reload();
      setSubmitting(false);
    }
  };

  return (
    <div className="container page checkout-page">
      <h1 className="page-title">Checkout</h1>
      <div className="checkout-layout">
        <form id="checkout-form" className="checkout-form card" noValidate onSubmit={onSubmit}>
          <fieldset>
            <legend>Delivery details</legend>
            <div className="checkout-grid">
              {FIELDS.map((f) => (
                <div key={f.name} className={`field${f.wide ? ' field-wide' : ''}`}>
                  <label htmlFor={`checkout-${f.name}`}>{f.label}</label>
                  <input
                    id={`checkout-${f.name}`} name={f.name} type={f.type || 'text'} autoComplete={f.autoComplete}
                    inputMode={f.inputMode} maxLength={f.maxLength} value={form[f.name]}
                    aria-invalid={Boolean(errors[f.name])} aria-describedby={errors[f.name] ? `checkout-${f.name}-error` : undefined}
                    onChange={(e) => setForm((cur) => ({ ...cur, [f.name]: e.target.value }))}
                  />
                  {errors[f.name] && <p id={`checkout-${f.name}-error`} className="field-error">{errors[f.name]}</p>}
                </div>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>Payment</legend>
            <label className="payment-option">
              <input type="radio" name="payment" value="cod" defaultChecked />
              <span><strong>Cash on delivery</strong><br /><span className="muted">Pay when your order arrives.</span></span>
            </label>
          </fieldset>
        </form>
        <div className="checkout-aside">
          <OrderSummary
            subtotal={totals.subtotal} shipping={totals.shipping} total={totals.total}
            items={lines.map((l) => ({ key: l.product.id, name: l.product.name, quantity: l.quantity, lineTotal: l.lineTotal }))}
            footer={(
              <>
                <StatusMessage tone="error" live="assertive">{formError}</StatusMessage>
                <button type="submit" form="checkout-form" className="btn btn-primary btn-block" data-testid="place-order" disabled={submitting}>
                  {submitting ? 'Placing order…' : 'Place order'}
                </button>
                <Link to="/cart" className="checkout-back">Back to cart</Link>
              </>
            )}
          />
        </div>
      </div>
    </div>
  );
}
