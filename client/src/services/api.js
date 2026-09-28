// Local dev: leave VITE_API_URL unset and Vite proxies /api to :5001.
// Split deploys: set VITE_API_URL to the API origin at build time.
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export class ApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

async function request(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error || `Request failed (${res.status})`, res.status, data);
  return data;
}

function query(params = {}) {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '');
  return entries.length ? `?${new URLSearchParams(entries)}` : '';
}

export const api = {
  products: {
    list: (params) => request(`/api/products${query(params)}`),
    get: (id) => request(`/api/products/${id}`),
    create: (body) => request('/api/products', { method: 'POST', body }),
  },
  orders: {
    list: () => request('/api/orders'),
    get: (id) => request(`/api/orders/${id}`),
    create: (body) => request('/api/orders', { method: 'POST', body }),
  },
  promos: {
    list: () => request('/api/promos'),
    get: (code) => request(`/api/promos/${encodeURIComponent(code)}`),
    apply: (body) => request('/api/promos/apply', { method: 'POST', body }),
  },
  users: {
    list: () => request('/api/users'),
    create: (body) => request('/api/users', { method: 'POST', body }),
    remove: (id) => request(`/api/users/${id}`, { method: 'DELETE' }),
  },
  analytics: () => request('/api/analytics'),
};
