import { useRef, useState } from 'react';
import { useCart } from '../context/CartContext.jsx';
import { usePromo } from '../context/PromoContext.jsx';
import { GENERIC_PROMO_ERROR, isPromoError } from '../lib/promo.js';
import { ApiError, api } from '../services/api.js';
import './PromoBox.css';

export default function PromoBox() {
  const { items } = useCart();
  const { code, message, setApplied, setMessage, remove } = usePromo();
  const [open, setOpen] = useState(Boolean(code));
  const [value, setValue] = useState('');
  const [applying, setApplying] = useState(false);
  const boxRef = useRef(null);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!value.trim() || applying) return;
    setApplying(true);
    try {
      const result = await api.promos.apply({ code: value, items });
      if (result.type === 'free_shipping') boxRef.current.scrollIntoView({ block: 'nearest' });
      setApplied(result);
      setValue('');
    } catch (err) {
      let text = GENERIC_PROMO_ERROR;
      if (isPromoError(err)) text = err.body.message;
      else if (err instanceof ApiError && err.status < 500) text = err.message;
      setMessage({ tone: 'error', text });
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="promo-box" ref={boxRef}>
      {code && (
        <div className="promo-applied">
          <span><strong>{code}</strong> applied</span>
          <button type="button" className="btn-link" data-testid="promo-remove" onClick={remove}>Remove</button>
        </div>
      )}
      {!open && !code ? (
        <button type="button" className="btn-link promo-toggle" aria-expanded="false" aria-controls="promo-form" onClick={() => setOpen(true)}>
          Have a promo code?
        </button>
      ) : (
        <form id="promo-form" className="promo-form" onSubmit={onSubmit}>
          <label htmlFor="promo-input">Promo code</label>
          <div className="promo-row">
            <input
              id="promo-input" className="promo-input" data-testid="promo-input" value={value} maxLength={40}
              autoComplete="off" autoCapitalize="characters" spellCheck="false"
              onChange={(e) => setValue(e.target.value)}
            />
            <button type="submit" className="btn btn-secondary" data-testid="promo-apply" disabled={!value.trim() || applying}>
              {applying ? 'Applying…' : 'Apply'}
            </button>
          </div>
        </form>
      )}
      <p data-testid="promo-message" className={`promo-message status status-${message.tone}`} role="status">{message.text}</p>
    </div>
  );
}
