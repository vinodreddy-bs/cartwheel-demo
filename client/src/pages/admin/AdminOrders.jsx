import StatusMessage from '../../components/StatusMessage.jsx';
import { useRemote } from '../../hooks/useRemote.js';
import { formatINR } from '../../lib/money.js';
import { api } from '../../services/api.js';

const loadOrders = () => api.orders.list();
const dateFmt = new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' });

const ORDER_COLUMNS = [
  { key: 'id', label: 'Order', render: (o) => `#${o.id}` },
  { key: 'customer', label: 'Customer', render: (o) => o.customer.name },
  { key: 'items', label: 'Items', num: true, render: (o) => o.items.reduce((n, i) => n + i.quantity, 0) },
  { key: 'total', label: 'Total', num: true, render: (o) => formatINR(o.total) },
  { key: 'status', label: 'Status', render: (o) => <span className="badge">{o.status}</span> },
  { key: 'createdAt', label: 'Placed', render: (o) => dateFmt.format(new Date(o.createdAt)) },
];

export default function AdminOrders() {
  const { status, data, error, reload } = useRemote(loadOrders);
  if (status === 'loading') return <p>Loading…</p>;
  if (status === 'error') return <><StatusMessage tone="error" live="assertive">{error}</StatusMessage><button type="button" className="btn btn-secondary" onClick={reload}>Try again</button></>;
  if (data.orders.length === 0) return <p className="empty-state">No orders yet.</p>;
  return (
    <div className="table-wrap card">
      <table className="admin-table">
        <caption className="sr-only">Orders</caption>
        <thead><tr>{ORDER_COLUMNS.map((c) => <th key={c.key} scope="col" className={c.num ? 'num' : undefined}>{c.label}</th>)}</tr></thead>
        <tbody>
          {data.orders.map((o) => (
            <tr key={o.id}>{ORDER_COLUMNS.map((c) => <td key={c.key} className={c.num ? 'num' : undefined}>{c.render(o)}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
