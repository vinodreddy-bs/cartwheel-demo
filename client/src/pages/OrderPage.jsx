import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import OrderSummary from '../components/OrderSummary.jsx';
import StatusMessage from '../components/StatusMessage.jsx';
import { formatINR } from '../lib/money.js';
import { api } from '../services/api.js';
import NotFoundPage from './NotFoundPage.jsx';
import './CheckoutPage.css';

export default function OrderPage() {
  const { id } = useParams();
  const [state, setState] = useState({ status: 'loading', order: null, error: '' });

  useEffect(() => {
    let live = true;
    setState({ status: 'loading', order: null, error: '' });
    api.orders.get(id)
      .then((order) => live && setState({ status: 'ready', order, error: '' }))
      .catch((err) => live && setState({ status: err.status === 404 ? 'missing' : 'error', order: null, error: err.message }));
    return () => { live = false; };
  }, [id]);

  if (state.status === 'loading') return <p className="container page">Loading your order…</p>;
  if (state.status === 'missing') return <NotFoundPage />;
  if (state.status === 'error') return <div className="container page"><StatusMessage tone="error" live="assertive">{state.error}</StatusMessage></div>;

  const { order } = state;
  const firstName = order.customer.name.split(' ')[0];
  return (
    <div className="container page page-narrow order-page">
      <h1 className="page-title">Thank you, {firstName}!</h1>
      <p>Order <strong>#{order.id}</strong> is confirmed. Please pay <strong>{formatINR(order.total)}</strong> in cash when it arrives.</p>
      <OrderSummary
        title="Your order" subtotal={order.subtotal} shipping={order.shipping} total={order.total}
        freeShippingHint={false}
        items={order.items.map((i) => ({ key: i.productId, name: i.name, quantity: i.quantity, lineTotal: i.lineTotal }))}
      />
      {order.customer.address && (
        <section className="card order-address">
          <h2>Delivering to</h2>
          <p>{order.customer.name}<br />{order.customer.address}<br />{order.customer.city} {order.customer.pin}<br />{order.customer.phone}</p>
        </section>
      )}
      <Link className="btn btn-secondary" to="/">Continue shopping</Link>
    </div>
  );
}
