# Cartwheel end-to-end tests

Playwright + TypeScript tests for the Cartwheel storefront. Each test automates one manual case from
[`manual-cases/cartwheel-regression.md`](manual-cases/cartwheel-regression.md). The test title is the
case ID followed by the case title, so a failing test points straight at its case.

## What's covered

24 cases across the shop grid, product page, cart, guest checkout with cash on delivery, order
confirmation, admin, and the phone-sized layout. They run on five projects:

| Project | Device |
|---|---|
| `chromium`, `firefox`, `webkit` | Desktop, 1280 × 800 |
| `mobile-chrome` | Pixel 7 |
| `mobile-safari` | iPhone 14 |

`MOB-001` and `MOB-002` cover the phone layout, so they're skipped on the desktop projects. Every other
case runs on all five.

Tags: each `describe` carries a feature tag (`@shop`, `@product`, `@cart`, `@checkout`, `@order`,
`@admin`, `@responsive`) and each test its case priority (`@P0`–`@P3`). Run the smoke set with
`npx playwright test --grep @P0`.

## Layout

```
playwright.config.ts   projects, base URL, web server
fixtures/test.ts       the `test` to import: data reset, cart seeding, page objects
fixtures/store-api.ts  setup through the API (reset, other shoppers' orders, frozen clock)
pages/                 one thin page object per screen, plus the shared OrderSummary block
data/                  the test customers and the seed product ids
tests/                 one spec per area, plus visual.spec.ts for Percy
```

Every test starts from seed data: an auto fixture calls `POST /api/test/reset`, and each test gets a
fresh browser context, so the cart in local storage starts empty. Carts and other shoppers' orders are
set up through local storage and the API, and only the behaviour under test goes through the UI. The
app runs on one in-memory server, so the suite runs with one worker.

## Run locally

Requires Node 20.19+ and the app's dependencies (`npm run install:all` in the repo root).

```bash
cd playwright-tests
npm install
npx playwright install        # first time only: download the browsers
npm test                      # all five projects
```

Playwright starts the app with `npm run start:demo` (a production build on http://localhost:5001 with
the test hooks on), so every run builds and serves the code that is checked out. To test a server
that's already running, set `BASE_URL`, which also turns off the built-in server:

```bash
BASE_URL=http://localhost:5001 npm test
```

Other scripts:

| Script | Runs |
|---|---|
| `npm run test:chromium` | Desktop Chromium only |
| `npm run test:mobile` | The two phone projects |
| `npm run test:headed` | All projects with visible browsers |
| `npm run report` | Opens the last HTML report |
| `npm run typecheck` | `tsc --noEmit` |

Failed tests keep a trace and a screenshot in `test-results/`. Open a trace with
`npx playwright show-trace <path>/trace.zip`.

## Running reliably

- **Stop any app already on port 5001 first.** The suite starts its own server there and fails to
  start if the port is taken, so a stale build can never be tested by mistake. On macOS or Linux,
  `lsof -ti :5001` shows what is holding it.
- **To test a server that's already running**, point the suite at it with
  `BASE_URL=http://localhost:5001 npm test` instead. The built-in server is then not started.
- **On BrowserStack, run one platform at a time.** Every test resets the app server it talks to, so
  sessions on two platforms at once would reset each other's data mid-test. Each `npm run test:*`
  command runs one platform, and [`browserstack.yml`](browserstack.yml) lists one.
- **Allow more time per test on real devices with `TEST_TIMEOUT`** (milliseconds, default 30000). Real phones
  on BrowserStack take about a second per action, so long form tests need around 120000 there.
- **Run in parallel with `BASE_URLS`**, one app server per worker. Every test resets the data on the
  server it talks to, so parallel workers each need their own server. Start several servers (e.g.
  `PORT=5002 NODE_ENV=production ENABLE_TEST_HOOKS=1 node server/index.js` after `npm run build`), then
  run `BASE_URLS=http://localhost:5001,http://localhost:5002,… npm test`. The suite uses one worker per URL.
- **Run a single project with `PW_PROJECT`**, e.g. `PW_PROJECT=mobile-chrome npm test`. BrowserStack needs
  this: its SDK turns every Playwright project into a separate session on each platform, so
  `npm run test:browserstack` runs just the `chromium` project against the platform in `browserstack.yml`.

## Run on BrowserStack Automate

From the repo root, get everything ready once, then run any browser straight away:

```bash
npm run app:up         # build, start 24 app servers on :5001–5024, open the BrowserStack Local tunnel
npm run test:chrome    # whole suite, desktop Chrome, one session per app server
npm run test:firefox   # whole suite, desktop Firefox
npm run test:android   # MOB-001 and MOB-002 on a real Android phone
npm run app:down       # stop the servers and close the tunnel
```

- **Extra Playwright arguments** go after `--`: `npm run test:firefox -- --grep @checkout`.
- **Fewer or more servers:** `APP_SERVERS=8 npm run app:up`. Each test command opens one BrowserStack
  session per server (Android uses two), so keep it within your plan's parallel limit.
- **Code changes are picked up.** The servers serve the build they started with. If the app code has
  changed since (an edit, a commit, a checkout), the next test command rebuilds and restarts them
  before testing. `npm run app:restart` does the same by hand.
- **The platforms** are in [`browserstack/`](browserstack/): `chrome.yml`, `firefox.yml`, `android.yml`.
  They use the tunnel that `app:up` opened instead of starting one per run.
- **Logs and state** are in `.cartwheel/` at the repo root (git-ignored).
- **A VPN can make cloud runs several times slower**, because every command the SDK sends goes through it.
  Disconnect it if runs are slow.
- **Stop the servers before running the suite locally** (`npm run app:down`): the local run starts its
  own server on port 5001.

### Credentials

The scripts read `BROWSERSTACK_USERNAME` and `BROWSERSTACK_ACCESS_KEY` from the environment. On macOS
they fall back to the Keychain, so the keys never need to be typed into a terminal you're sharing. Store
them once, in a private terminal (each command prompts for the value and doesn't echo it):

```bash
security add-generic-password -U -a "$USER" -s cartwheel-browserstack-username -w
security add-generic-password -U -a "$USER" -s cartwheel-browserstack-access-key -w
```

All output from the runs is filtered so the access key is masked if a tool ever prints it.

### One-off runs with the plain SDK

[`browserstack.yml`](browserstack.yml) runs on desktop Chrome and lets the SDK open its own tunnel to a
single app on port 5001. Firefox, Safari and an Android phone are listed as commented-out alternatives:
swap one in and run again, one platform per run.

```bash
export BROWSERSTACK_USERNAME=<your username>
export BROWSERSTACK_ACCESS_KEY=<your access key>
npm run test:browserstack     # npx browserstack-node-sdk playwright test
```

The SDK is fetched by `npx` when it runs, so it isn't a dependency of this package.

## Visual snapshots with Percy

`tests/visual.spec.ts` (tag `@visual`) takes Percy snapshots of the shop, a product page, the cart,
checkout and an order confirmation. Each title starts with the ID of the case whose screen it captures
(GRID-001, PDP-001, CART-001, CHK-001, ORD-001). These tests are left out of normal runs and run only
through:

```bash
export PERCY_TOKEN=<your project token>
npm run test:visual           # percy exec -- playwright test --grep @visual --project=chromium
```

Without a running Percy (for example `VISUAL=1 npx playwright test --grep @visual`), the snapshot calls
log that Percy isn't running and do nothing, so the tests still pass.

## Case ↔ test traceability

| Case | Priority | Spec | Test title (after the case ID) |
|---|---|---|---|
| GRID-001 | P1 | `tests/shop.spec.ts` | Verify that user can narrow the shop to one category and see the whole catalogue again with All |
| GRID-002 | P1 | `tests/shop.spec.ts` | Verify that user can find products by searching for a word in their name or description |
| GRID-003 | P2 | `tests/shop.spec.ts` | Verify that user is told when no product matches the search and category, and can clear the filters to see every product again |
| GRID-004 | P2 | `tests/shop.spec.ts` | Verify that user can sort the shop by price in either direction and by name |
| GRID-005 | P1 | `tests/shop.spec.ts` | Verify that the shop warns when a product is running low and stops it being added once it has sold out |
| PDP-001 | P0 | `tests/product.spec.ts` | Verify that user can open a product from the shop, see its details and add a chosen quantity to the cart |
| PDP-002 | P1 | `tests/product.spec.ts` | Verify that user cannot choose a quantity below 1 or above the stock that is left on the product page |
| PDP-003 | P2 | `tests/product.spec.ts` | Verify that user who follows a link to a product that does not exist sees Page not found and can get back to the shop |
| CART-001 | P0 | `tests/cart.spec.ts` | Verify that the cart shows each product once with its quantity and line total, and adds them up to the right total |
| CART-002 | P1 | `tests/cart.spec.ts` | Verify that user is charged ₹99 shipping when the cart subtotal is below ₹999, and no shipping at ₹999 |
| CART-003 | P1 | `tests/cart.spec.ts` | Verify that shipping and the total are recalculated when user changes a quantity in the cart so the subtotal crosses ₹999 |
| CART-004 | P1 | `tests/cart.spec.ts` | Verify that user can remove products from the cart, and once the last one is removed the cart is empty and checkout is not available |
| CART-005 | P0 | `tests/cart.spec.ts` | Verify that user’s cart still holds its products and quantities after the page is reloaded |
| CHK-001 | P0 | `tests/checkout.spec.ts` | Verify that user can place a cash-on-delivery order with valid details, sees it confirmed and finds the cart empty afterwards |
| CHK-002 | P0 | `tests/checkout.spec.ts` | Verify that user cannot place an order while any delivery detail is missing or invalid, and is shown which fields to fix |
| CHK-003 | P1 | `tests/checkout.spec.ts` | Verify that user cannot order more units than are left after another shopper buys first, and the cart is corrected to what is available |
| ORD-001 | P1 | `tests/order.spec.ts` | Verify that the order confirmation shows every item, the shipping charge, the amount to pay and the delivery address, and still shows them after a reload |
| ADM-001 | P2 | `tests/admin.spec.ts` | Verify that the admin dashboard figures reflect the orders shoppers have placed |
| ADM-002 | P1 | `tests/admin.spec.ts` | Verify that admin can add a product with a price in rupees and paise, and shoppers see it in the shop at that price |
| ADM-003 | P1 | `tests/admin.spec.ts` | Verify that orders placed by shoppers appear in the admin Orders list, newest first, with the customer, item count and total |
| ADM-004 | P2 | `tests/admin.spec.ts` | Verify that admin can add a user, and cannot add another user with an email that is already registered |
| ADM-005 | P2 | `tests/admin.spec.ts` | Verify that admin can delete a user after confirming, and nothing is deleted when they cancel |
| MOB-001 | P2 | `tests/responsive.spec.ts` | Verify that user on a phone-sized screen can open the menu and reach Admin from it |
| MOB-002 | P1 | `tests/responsive.spec.ts` | Verify that user on a phone-sized screen can see the cart total and go to checkout from the bar at the bottom of the cart |
