import { useEffect, useState } from 'react';
import StatusMessage from '../components/StatusMessage.jsx';
import { useRemote } from '../hooks/useRemote.js';
import { copyText } from '../lib/clipboard.js';
import { daysLeftText, isPromoError, statusLabel, typeLabel } from '../lib/promo.js';
import { api } from '../services/api.js';
import './OffersPage.css';

const loadPromos = () => api.promos.list();

function StatusBadge({ status }) {
  return <span className={`offer-status offer-status-${status}`}>{statusLabel(status)}</span>;
}

function Conditions({ items }) {
  return <ul className="offer-conditions">{items.map((c) => <li key={c}>{c}</li>)}</ul>;
}

function CheckCode() {
  const [value, setValue] = useState('');
  const [state, setState] = useState({ status: 'idle', promo: null, error: '' });

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!value.trim()) return;
    setState({ status: 'loading', promo: null, error: '' });
    try {
      setState({ status: 'ready', promo: await api.promos.get(value.trim()), error: '' });
    } catch (err) {
      setState({ status: 'error', promo: null, error: isPromoError(err) ? err.body.message : "Couldn't check that code. Please try again." });
    }
  };

  const { promo } = state;
  return (
    <section className="card check-code" aria-labelledby="check-heading">
      <h2 id="check-heading">Check a code</h2>
      <form className="check-code-row" onSubmit={onSubmit}>
        <label htmlFor="check-input" className="sr-only">Promo code to check</label>
        <input id="check-input" value={value} onChange={(e) => setValue(e.target.value)} autoComplete="off" autoCapitalize="characters" spellCheck="false" maxLength={40} placeholder="e.g. WELCOME10" />
        <button type="submit" className="btn btn-primary" disabled={!value.trim() || state.status === 'loading'}>
          {state.status === 'loading' ? 'Checking…' : 'Check'}
        </button>
      </form>
      {state.status === 'error' && <StatusMessage tone="error">{state.error}</StatusMessage>}
      {promo && (
        <div className="check-result" role="status">
          <div className="check-result-head">
            <strong className="offer-code-text">{promo.code}</strong>
            <StatusBadge status={promo.status} />
          </div>
          <p className="check-result-type">{typeLabel(promo.type)} · {promo.benefit}</p>
          <Conditions items={promo.conditions} />
        </div>
      )}
    </section>
  );
}

function OfferCard({ promo }) {
  const [copyState, setCopyState] = useState('idle');
  useEffect(() => {
    if (copyState === 'idle') return undefined;
    const t = setTimeout(() => setCopyState('idle'), 2000);
    return () => clearTimeout(t);
  }, [copyState]);

  const ends = promo.status === 'active' ? daysLeftText(promo.daysLeft) : null;
  const label = { idle: 'Copy', copied: 'Copied', failed: 'Copy failed' }[copyState];

  return (
    <article className={`offer-card card offer-card-${promo.status}`} data-testid="offer-card">
      <div className="offer-card-head">
        <StatusBadge status={promo.status} />
        {ends && <span className="offer-ends">{ends}</span>}
      </div>
      <div className="offer-code">
        <span className="offer-code-text">{promo.code}</span>
        <button type="button" className="btn btn-secondary offer-copy" onClick={async () => setCopyState((await copyText(promo.code)) ? 'copied' : 'failed')}>
          {label}<span className="sr-only"> code {promo.code}</span>
        </button>
      </div>
      <h3 className="offer-benefit">{promo.benefit}</h3>
      <Conditions items={promo.conditions} />
    </article>
  );
}

export default function OffersPage() {
  const { status, data, error, reload } = useRemote(loadPromos);
  return (
    <div className="container page offers-page">
      <h1 className="page-title">Offers</h1>
      <CheckCode />
      <section aria-labelledby="offers-heading">
        <h2 id="offers-heading">Current offers</h2>
        {status === 'loading' && <p>Loading offers…</p>}
        {status === 'error' && (
          <>
            <StatusMessage tone="error" live="assertive">{error}</StatusMessage>
            <button type="button" className="btn btn-secondary" onClick={reload}>Try again</button>
          </>
        )}
        {data && <div className="offers-grid">{data.promos.map((p) => <OfferCard key={p.code} promo={p} />)}</div>}
      </section>
    </div>
  );
}
