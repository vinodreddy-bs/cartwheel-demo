import { useState } from 'react';
import StatusMessage from '../../components/StatusMessage.jsx';
import { useCatalog } from '../../context/CatalogContext.jsx';
import { formatINR, rupeesToPaise } from '../../lib/money.js';
import { api } from '../../services/api.js';

const EMPTY = { name: '', category: '', price: '', stock: '' };

export default function AdminProducts() {
  const { status, products, categories, error, reload } = useCatalog();
  const [form, setForm] = useState(EMPTY);
  const [message, setMessage] = useState({ tone: 'info', text: '' });
  const [saving, setSaving] = useState(false);
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    const price = rupeesToPaise(form.price);
    const stock = form.stock.trim() === '' ? 0 : Number(form.stock);
    if (form.name.trim().length < 2 || !form.category) return setMessage({ tone: 'error', text: 'Enter a name and choose a category.' });
    if (price === null) return setMessage({ tone: 'error', text: 'Enter a price in rupees, e.g. 1299 or 1299.50.' });
    if (!Number.isInteger(stock) || stock < 0) return setMessage({ tone: 'error', text: 'Stock must be a whole number, 0 or more.' });
    setSaving(true);
    try {
      const { product } = await api.products.create({ name: form.name.trim(), category: form.category, price, stock });
      setForm(EMPTY);
      setMessage({ tone: 'success', text: `Added ${product.name}.` });
      reload();
    } catch (err) {
      setMessage({ tone: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-stack">
      <form className="card admin-form" onSubmit={onSubmit} noValidate>
        <h2>Add a product</h2>
        <div className="admin-form-grid">
          <div className="field"><label htmlFor="p-name">Name</label><input id="p-name" value={form.name} onChange={set('name')} /></div>
          <div className="field">
            <label htmlFor="p-category">Category</label>
            <select id="p-category" value={form.category} onChange={set('category')}>
              <option value="">Choose…</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="field"><label htmlFor="p-price">Price (₹)</label><input id="p-price" inputMode="decimal" value={form.price} onChange={set('price')} /></div>
          <div className="field"><label htmlFor="p-stock">Stock</label><input id="p-stock" inputMode="numeric" value={form.stock} onChange={set('stock')} /></div>
        </div>
        <StatusMessage tone={message.tone}>{message.text}</StatusMessage>
        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Adding…' : 'Add product'}</button>
      </form>

      {status === 'error' && <><StatusMessage tone="error" live="assertive">{error}</StatusMessage><button type="button" className="btn btn-secondary" onClick={reload}>Try again</button></>}
      {status === 'loading' && <p>Loading products…</p>}
      {status === 'ready' && products.length === 0 && <p className="empty-state">No products yet.</p>}
      {status === 'ready' && products.length > 0 && (
        <div className="table-wrap card">
          <table className="admin-table">
            <caption className="sr-only">Products</caption>
            <thead><tr><th scope="col">Product</th><th scope="col">Category</th><th scope="col" className="num">Price</th><th scope="col" className="num">Stock</th></tr></thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td><td>{p.category}</td><td className="num">{formatINR(p.price)}</td>
                  <td className={`num${p.stock < 10 ? ' low' : ''}`}>{p.stock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
