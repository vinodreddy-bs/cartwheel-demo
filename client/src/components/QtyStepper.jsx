import { useEffect, useState } from 'react';
import { clampQty } from '../lib/cart.js';
import './QtyStepper.css';

export default function QtyStepper({ id, itemName, value, max, onChange, size = 'md' }) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => { setDraft(String(value)); }, [value]);
  const suffix = itemName ? ` of ${itemName}` : '';

  const commit = (raw) => {
    const next = clampQty(raw, max);
    setDraft(String(next));
    if (next !== value) onChange(next);
  };

  return (
    <div className={`qty qty-${size}`}>
      <label htmlFor={id} className="sr-only">{`Quantity${suffix}`}</label>
      <button type="button" className="qty-btn" aria-label={`Decrease quantity${suffix}`} disabled={value <= 1} onClick={() => commit(value - 1)}>−</button>
      <input
        id={id} className="qty-input" type="text" inputMode="numeric" autoComplete="off" value={draft}
        onChange={(e) => setDraft(e.target.value.replace(/[^\d]/g, ''))}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commit(e.currentTarget.value); } }}
      />
      <button type="button" className="qty-btn" aria-label={`Increase quantity${suffix}`} disabled={value >= max} onClick={() => commit(value + 1)}>+</button>
    </div>
  );
}
