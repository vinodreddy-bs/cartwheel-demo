import { useState } from 'react';
import StatusMessage from '../../components/StatusMessage.jsx';
import { useRemote } from '../../hooks/useRemote.js';
import { api } from '../../services/api.js';

const loadUsers = () => api.users.list();

export default function AdminUsers() {
  const { status, data, error, reload } = useRemote(loadUsers);
  const [form, setForm] = useState({ name: '', email: '', role: 'user' });
  const [message, setMessage] = useState({ tone: 'info', text: '' });

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const { user } = await api.users.create({ name: form.name.trim(), email: form.email.trim(), role: form.role });
      setForm({ name: '', email: '', role: 'user' });
      setMessage({ tone: 'success', text: `Added ${user.name}.` });
      reload();
    } catch (err) {
      setMessage({ tone: 'error', text: err.message });
    }
  };

  const onDelete = async (user) => {
    if (!window.confirm(`Delete ${user.name}?`)) return;
    try {
      await api.users.remove(user.id);
      setMessage({ tone: 'success', text: `Deleted ${user.name}.` });
      reload();
    } catch (err) {
      setMessage({ tone: 'error', text: err.message });
    }
  };

  return (
    <div className="admin-stack">
      <form className="card admin-form" onSubmit={onSubmit} noValidate>
        <h2>Add a user</h2>
        <div className="admin-form-grid">
          <div className="field"><label htmlFor="u-name">Name</label><input id="u-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="field"><label htmlFor="u-email">Email</label><input id="u-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div className="field">
            <label htmlFor="u-role">Role</label>
            <select id="u-role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="user">User</option><option value="admin">Admin</option>
            </select>
          </div>
        </div>
        <StatusMessage tone={message.tone}>{message.text}</StatusMessage>
        <button type="submit" className="btn btn-primary">Add user</button>
      </form>
      {status === 'loading' && <p>Loading…</p>}
      {status === 'error' && <StatusMessage tone="error" live="assertive">{error}</StatusMessage>}
      {data && data.users.length === 0 && <p className="empty-state">No users yet.</p>}
      {data && data.users.length > 0 && (
        <div className="table-wrap card">
          <table className="admin-table">
            <caption className="sr-only">Users</caption>
            <thead><tr><th scope="col">Name</th><th scope="col">Email</th><th scope="col">Role</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>
              {data.users.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td><td>{u.email}</td><td><span className="badge">{u.role}</span></td>
                  <td className="num"><button type="button" className="btn-link" onClick={() => onDelete(u)} aria-label={`Delete ${u.name}`}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
