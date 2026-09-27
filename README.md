# Cartwheel

A small demo storefront: shop, product pages, cart, guest checkout with cash on delivery, and a lightweight admin area. Built with React 19 + Vite on the front end and an Express API with in-memory data.

## Run it

Requires Node 20.19+.

```bash
npm run install:all
npm run dev          # API on :5001, web on http://localhost:3000
```

Single-URL production build (the API also serves the web app):

```bash
npm run build
npm start            # http://localhost:5001
```

## Tests

```bash
npm test             # server (node:test + supertest) and client (Vitest)
```

## End-to-end tests

Playwright tests for the storefront live in [`playwright-tests/`](playwright-tests/README.md). They run
on desktop Chromium, Firefox and WebKit and two phone profiles, and each one automates a manual case
from `playwright-tests/manual-cases/`. See [`playwright-tests/README.md`](playwright-tests/README.md) to
run them locally, on BrowserStack Automate, or with Percy visual snapshots.

## Data and test hooks

All data lives in memory and resets when the server restarts. Prices are stored as integer paise (₹1 = 100).

For automated tests, these endpoints are available outside production (or with `ENABLE_TEST_HOOKS=1`; `npm run start:demo` turns them on):

| Endpoint | Purpose |
|---|---|
| `POST /api/test/reset` | Restore the seed catalogue, users and orders |
| `POST /api/test/clock` `{ "now": "<ISO date-time>" }` | Freeze server time |
| `DELETE /api/test/clock` | Return to real time |

## API

| Method | Path | Notes |
|---|---|---|
| GET | `/api/products` | `?category=&q=&sort=featured\|price_asc\|price_desc\|name` |
| GET | `/api/products/:id` | |
| POST | `/api/products` | `{ name, category, price, stock }` (price in paise) |
| GET | `/api/orders` · `/api/orders/:id` | |
| POST | `/api/orders` | `{ customer: { name, email, phone, address, city, pin }, items: [{ productId, quantity }] }` |
| GET/POST/PUT/DELETE | `/api/users` | `/api/users/paginated?page=&limit=` |
| GET | `/api/analytics` · `/api/search?q=` · `/api/health` | |

Shipping is ₹99 on orders under ₹999 and free from ₹999.
