import { NavLink, Outlet } from 'react-router';
import './Admin.css';

const LINKS = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/products', label: 'Products' },
  { to: '/admin/orders', label: 'Orders' },
  { to: '/admin/users', label: 'Users' },
];

export default function AdminLayout() {
  return (
    <div className="container page admin">
      <div className="admin-head">
        <h1 className="page-title">Admin</h1>
        <nav className="admin-nav" aria-label="Admin">
          {LINKS.map((l) => <NavLink key={l.to} to={l.to} end={l.end}>{l.label}</NavLink>)}
        </nav>
      </div>
      <Outlet />
    </div>
  );
}
