import StatusMessage from '../../components/StatusMessage.jsx';
import { useRemote } from '../../hooks/useRemote.js';
import { formatINR } from '../../lib/money.js';
import { api } from '../../services/api.js';

const loadAnalytics = () => api.analytics();

export default function Dashboard() {
  const { status, data, error, reload } = useRemote(loadAnalytics);
  if (status === 'loading') return <p>Loading…</p>;
  if (status === 'error') return <><StatusMessage tone="error" live="assertive">{error}</StatusMessage><button type="button" className="btn btn-secondary" onClick={reload}>Try again</button></>;

  const stats = [
    { label: 'Revenue', value: formatINR(data.orders.revenue) },
    { label: 'Orders', value: data.orders.total },
    { label: 'Average order', value: formatINR(data.orders.averageOrderValue) },
    { label: 'Products', value: data.products.total },
    { label: 'Low stock (< 10)', value: data.products.lowStock },
    { label: 'Users', value: data.users.total },
  ];
  return (
    <section aria-label="Store overview" className="stat-grid">
      {stats.map((s) => (
        <div key={s.label} className="stat card">
          <p className="stat-label">{s.label}</p>
          <p className="stat-value">{s.value}</p>
        </div>
      ))}
    </section>
  );
}
