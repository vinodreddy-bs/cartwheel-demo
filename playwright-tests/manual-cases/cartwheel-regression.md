# Cartwheel regression: manual test cases

The regression suite for the Cartwheel storefront as it ships today: shop, product page, cart, guest
checkout with cash on delivery, order confirmation, admin, and the phone-sized layout. Every case
below is also an automated Playwright test in `playwright-tests/tests/`, whose title starts with the
case ID. `cartwheel-regression.csv` carries the same cases for import into a test-management tool;
this file is the source of truth.

**Sources:** the running storefront and its API, `README.md`, the seed data in `server/store.js`,
and the existing unit tests in `client/src/lib/*.test.js` and `server/test/`.

**Classification:** a new case file. There were no manual cases in the repo, and this file covers the
existing storefront as one regression suite, grouped by area.

**Cross-feature discovery:** none found. No other case files or feature notes exist in the repo.

## How to run these cases

- **Start from seed data.** Before each case, call `POST /api/test/reset` (enabled by
  `npm run start:demo`, which serves http://localhost:5001) and start with an empty cart (clear the
  site's local storage, or use a fresh browser profile). After a reset the catalogue has 12 products,
  there are 3 users and no orders, and the next order number is **1001**.
- **Test data (the test customer):** Full name `Meera Iyer`, Email `meera@example.com`, Mobile
  number `9876543210`, Address `14 Lake View Road, Indiranagar`, City `Bengaluru`, PIN code `560038`.
- **A second shopper** (GRID-005, CHK-003, ADM-001, ADM-003) is a second browser, or an API call:
  `POST /api/orders` with
  `{ "customer": { "name": "Kabir Mehta", "email": "kabir@example.com", "phone": "9123456780", "address": "22 Hill Road, Bandra", "city": "Mumbai", "pin": "400050" }, "items": [{ "productId": 7, "quantity": 2 }] }`.
  Product IDs follow the seed order: 1 Pulse Wireless Earbuds, 4 Hush ANC Headphones, 7 Arc Desk Lamp,
  8 Testing in the Age of AI, 10 The Pragmatic Checklist, 12 Steel Water Bottle.
- **Prices** are stored in paise and shown in rupees: whole rupees without decimals (₹1,299), paise to
  two decimals (₹1,299.50). Shipping is ₹99 below a ₹999 subtotal and free from ₹999.
- **Case IDs** are `<AREA>-<NNN>` and never renumbered: `GRID` shop, `PDP` product page, `CART`
  cart, `CHK` checkout, `ORD` order confirmation, `ADM` admin, `MOB` phone-sized layout.
- **Priority** P0 Critical (the smoke set), P1 High, P2 Medium, P3 Low.
- **Automation: Automated** means the Playwright suite runs the case as one test titled
  `<ID> <title>`, tagged with the case's feature tag and its priority (`@P0`–`@P3`).

## Summary

24 cases: 5 P0 · 12 P1 · 7 P2 · 0 P3.

| ID | Priority | Case | Risks |
|---|---|---|---|
| GRID-001 | P1 | Verify that user can narrow the shop to one category and see the whole catalogue again with All | R-1 |
| GRID-002 | P1 | Verify that user can find products by searching for a word in their name or description | R-2 |
| GRID-003 | P2 | Verify that user is told when no product matches the search and category, and can clear the filters to see every product again | R-3 |
| GRID-004 | P2 | Verify that user can sort the shop by price in either direction and by name | R-4 |
| GRID-005 | P1 | Verify that the shop warns when a product is running low and stops it being added once it has sold out | R-5 |
| PDP-001 | P0 | Verify that user can open a product from the shop, see its details and add a chosen quantity to the cart | R-6 |
| PDP-002 | P1 | Verify that user cannot choose a quantity below 1 or above the stock that is left on the product page | R-7 |
| PDP-003 | P2 | Verify that user who follows a link to a product that does not exist sees Page not found and can get back to the shop | R-8 |
| CART-001 | P0 | Verify that the cart shows each product once with its quantity and line total, and adds them up to the right total | R-9 |
| CART-002 | P1 | Verify that user is charged ₹99 shipping when the cart subtotal is below ₹999, and no shipping at ₹999 | R-10 |
| CART-003 | P1 | Verify that shipping and the total are recalculated when user changes a quantity in the cart so the subtotal crosses ₹999 | R-11, R-7 |
| CART-004 | P1 | Verify that user can remove products from the cart, and once the last one is removed the cart is empty and checkout is not available | R-12 |
| CART-005 | P0 | Verify that user’s cart still holds its products and quantities after the page is reloaded | R-13 |
| CHK-001 | P0 | Verify that user can place a cash-on-delivery order with valid details, sees it confirmed and finds the cart empty afterwards | R-14 |
| CHK-002 | P0 | Verify that user cannot place an order while any delivery detail is missing or invalid, and is shown which fields to fix | R-15 |
| CHK-003 | P1 | Verify that user cannot order more units than are left after another shopper buys first, and the cart is corrected to what is available | R-16 |
| ORD-001 | P1 | Verify that the order confirmation shows every item, the shipping charge, the amount to pay and the delivery address, and still shows them after a reload | R-17 |
| ADM-001 | P2 | Verify that the admin dashboard figures reflect the orders shoppers have placed | R-18 |
| ADM-002 | P1 | Verify that admin can add a product with a price in rupees and paise, and shoppers see it in the shop at that price | R-19 |
| ADM-003 | P1 | Verify that orders placed by shoppers appear in the admin Orders list, newest first, with the customer, item count and total | R-20 |
| ADM-004 | P2 | Verify that admin can add a user, and cannot add another user with an email that is already registered | R-21 |
| ADM-005 | P2 | Verify that admin can delete a user after confirming, and nothing is deleted when they cancel | R-22 |
| MOB-001 | P2 | Verify that user on a phone-sized screen can open the menu and reach Admin from it | R-23 |
| MOB-002 | P1 | Verify that user on a phone-sized screen can see the cart total and go to checkout from the bar at the bottom of the cart | R-24 |

## 1. Model

| Slot | What it holds for Cartwheel |
|---|---|
| **Actors** | *Guest shopper*: browses, fills a cart and checks out as a guest; there are no shopper accounts. *Admin*: anyone who opens `/admin`; the product has no sign-in. *Second shopper*: another guest buying the same stock (a second browser, or the API). |
| **Entities and lifecycles** | *Cart*: empty → has items → quantities changed or lines removed → emptied by a placed order. It lives in the browser and is checked against stock whenever the catalogue loads. *Product stock*: in stock (more than 5) → running low (1–5, "Only N left") → out of stock (0). Products are added by an admin. *Order*: placed (the only status). *User*: added → deleted. |
| **Inputs** | *Quantity* (digits only): below 1 → 1; 1 up to the stock left (at most 99); above that → the stock left. *Checkout fields*: full name 2+ characters, email with @ and a dot, 10-digit mobile starting 6–9 (spaces and dashes ignored), address 5+ characters, city 2+ characters, 6-digit PIN not starting with 0. *Admin price*: rupees with up to two decimals, above 0. *Admin stock*: a whole number, 0 or more. *Search*: trimmed, any letter case, matched against name, description and category. *User email*: valid and unique, ignoring case. |
| **Rules** | *Shipping*: subtotal below ₹999 → ₹99; ₹999 or more → Free. Total = subtotal + shipping. *Stock label*: 0 → "Out of stock" and no adding; 1–5 → "Only N left"; more → no label on the card, "In stock" on the product page. *Order stock check*: a quantity above the stock left refuses the order with "Only N left of <product>", or "<product> is out of stock" at 0. |
| **Independent variables** | None: no four independent variables, so no pairwise array. |
| **Integrations** | The storefront reads and writes through the API (`/api/products`, `/api/orders`, `/api/users`, `/api/analytics`). Admin screens read the same products, orders and users; a product added in admin appears in the shop. |
| **Timing** | Stock can change between adding to the cart and placing the order (CHK-003). The catalogue loads when the page loads, and again after an order or an admin product add. The Place order button is disabled while the order is being placed. Order times come from the server clock, which can be frozen. |
| **Controllability** | `POST /api/test/reset` for seed data; `POST /api/orders` or a second browser for the second shopper; `POST /api/test/clock` to freeze server time; the browser viewport for phone sizes; the site's local storage for the cart. |

### Seven-dimension walk

| Dimension | What it raised |
|---|---|
| **Structure** | Shop grid, product page, cart, checkout, confirmation, admin dashboard, products, orders and users, and the not-found page. Each has at least one case. |
| **Function** | Secondary effects of an order: the cart empties (CHK-001), stock goes down (GRID-005, CHK-003), and admin sees it (ADM-001, ADM-003). |
| **Data** | Prices at the ₹999 edge (CART-002), paise prices (ADM-002), a paise average (ADM-001), a mobile number with a space (CHK-002), stock at 3 and at 0 (PDP-002, GRID-005). |
| **Interfaces** | Admin → shop for a new product (ADM-002); storefront → admin for orders (ADM-001, ADM-003). |
| **Platform** | Phone-sized layout: the menu (MOB-001) and the checkout bar (MOB-002). The automated suite runs every other case on desktop Chromium, Firefox and WebKit and on two phone profiles. |
| **Operations** | Reloading the cart (CART-005) and the confirmation (ORD-001); opening checkout with an empty cart (CART-004); two shoppers buying the same stock (CHK-003). |
| **Time** | Stock bought by someone else mid-checkout (CHK-003); the Placed time on orders (ADM-003, with a frozen clock). Double submission is in the deferrals. |

## 2. Risk ledger

| ID | Risk | Impact | Likelihood |
|---|---|---|---|
| R-1 | Choosing a category shows the wrong products, or the shopper cannot get back to the full catalogue | High | Low |
| R-2 | Search misses products whose description matches, or depends on letter case | High | Low |
| R-3 | A search with no match leaves a blank page with no way back | Med | Med |
| R-4 | Sorting puts products in the wrong order | Med | Med |
| R-5 | A shopper is not warned that stock is low, or can still add a sold-out product | High | Med |
| R-6 | The product page shows the wrong details or price, or the chosen quantity does not reach the cart | High | High |
| R-7 | A quantity below 1 or above the stock left can be chosen, so more is sold than exists | High | Med |
| R-8 | A link to a missing product dead-ends the shopper | Med | Med |
| R-9 | The cart duplicates lines or adds up line totals, subtotal or total wrongly | High | High |
| R-10 | Shipping is charged at ₹999, or not charged at ₹998 | High | Med |
| R-11 | Shipping and the total are not recalculated after a quantity change | High | Med |
| R-12 | A removed product is still charged, or an empty cart can reach checkout | High | Med |
| R-13 | The cart is lost when the page is reloaded (carts are always abandoned and resumed) | High | High |
| R-14 | A valid order cannot be placed, or the cart still holds the items afterwards, so the shopper orders twice | High | High |
| R-15 | An order is accepted with missing or invalid delivery details, so it cannot be delivered | High | High |
| R-16 | More units are sold than are in stock when another shopper buys first, or the shopper is not told how to recover | High | Med |
| R-17 | The confirmation shows the wrong amount to pay or address, or is lost on reload | High | Med |
| R-18 | The dashboard figures do not reflect the orders placed | Med | Med |
| R-19 | A price entered in rupees is stored or shown wrongly (paise conversion), so the product sells at the wrong price | High | Med |
| R-20 | An order never reaches the admin Orders list, so it is never fulfilled | High | Med |
| R-21 | Admin cannot add a user, or two users share one email | Med | Med |
| R-22 | A user is deleted without confirmation, or the deletion does not stick | Med | Med |
| R-23 | A shopper on a phone cannot reach the site navigation | Med | Med |
| R-24 | A shopper on a phone cannot reach checkout from the cart, or sees the wrong total there | High | Med |
| R-25 | The catalogue fails to load and the shopper has no way to retry | Med | Low |
| R-26 | Placing the order fails on the network or server and the shopper loses the cart or gets no message | High | Low |
| R-27 | Pressing Place order twice creates two orders | High | Low |
| R-28 | A link to a missing order, or to an unknown page, dead-ends the shopper | Low | Low |
| R-29 | A product in a stored cart has sold out or no longer exists when the shopper returns | Med | Low |
| R-30 | The layout scrolls sideways or overlaps on a narrow screen | Med | Med |

## 3. Open questions and deferrals

| Risk | Status | What would reach it, or the case it becomes | Owner |
|---|---|---|---|
| R-25 | deferred: not tester-reachable | The catalogue request must fail. An automated test can fail `/api/products` with `page.route()` and check "Couldn’t load products" and Try again. | Automation |
| R-26 | deferred: not tester-reachable | The order request must fail. An automated test can fail `POST /api/orders` with `page.route()` and check the cart is kept and a message is shown. | Automation |
| R-27 | deferred: outside this suite | Tester-reachable (double-click Place order). Candidate case CHK-004, P1: "Verify that pressing Place order twice in quick succession creates only one order". | QA |
| R-28 | deferred: outside this suite | The same not-found page as PDP-003 serves `/order/<unknown>` and unknown paths. Candidate P3 cases on those surfaces if the page ever differs between them. | QA |
| R-29 | deferred: outside this suite | Tester-reachable (put Arc Desk Lamp in the cart, have a second shopper buy all 3, reload). Expected: "Arc Desk Lamp is out of stock and was removed." Candidate case CART-006, P2. CHK-003 already covers the "fewer left" variant of the same cart check. | QA |
| R-30 | deferred: excluded surface: visual layout | Layout is left to visual snapshots, not functional cases. | Visual testing |

## 4. Cases

### Shop

#### GRID-001 · Verify that user can narrow the shop to one category and see the whole catalogue again with All
**Priority:** P1 · **Risks:** R-1 · **Tags:** shop · **Automation:** Automated

**Preconditions:** Seed data (reset); the shop is open and shows 12 products.

**Steps:**
1. Choose the Electronics category.
2. Choose All.

**Expected:**
- With Electronics chosen, the count reads "4 products" and the grid shows exactly Pulse Wireless Earbuds, Stride Smartwatch, Boom Mini Speaker and Hush ANC Headphones. Electronics is shown as selected and the address includes ?category=Electronics.
- With All chosen, the count reads "12 products" and All is shown as selected.

**Oracle:** Product: seed catalogue in server/store.js and the running shop. Verified automation: filterProducts "filters by category and trimmed, case-insensitive search over name, description and category" (client/src/lib/catalog.test.js).

#### GRID-002 · Verify that user can find products by searching for a word in their name or description
**Priority:** P1 · **Risks:** R-2 · **Tags:** shop · **Automation:** Automated

**Preconditions:** Seed data (reset); the shop is open.

**Steps:**
1. Search for "battery".
2. Change the search to "BOTTLE".

**Expected:**
- "battery" gives "2 products": Pulse Wireless Earbuds and Stride Smartwatch. Neither name contains the word; both descriptions do.
- "BOTTLE" gives "1 product": Steel Water Bottle, so the search ignores letter case.

**Oracle:** Product: product descriptions in server/store.js and the running shop. Verified automation: the filterProducts search test in client/src/lib/catalog.test.js.

#### GRID-003 · Verify that user is told when no product matches the search and category, and can clear the filters to see every product again
**Priority:** P2 · **Risks:** R-3 · **Tags:** shop · **Automation:** Automated

**Preconditions:** Seed data (reset); the shop is open.

**Steps:**
1. Choose the Books category and search for "lamp".
2. Choose Clear filters.

**Expected:**
- The count reads "0 products" and the page says "No products match “lamp” in Books." with a Clear filters button.
- After clearing, the count reads "12 products", the search box is empty, All is selected and the address has no filter in it.

**Oracle:** Product: the running shop (empty state copy in ShopPage).

#### GRID-004 · Verify that user can sort the shop by price in either direction and by name
**Priority:** P2 · **Risks:** R-4 · **Tags:** shop · **Automation:** Automated

**Preconditions:** Seed data (reset); the shop is open.

**Steps:**
1. Sort by "Price: low to high".
2. Sort by "Price: high to low".
3. Sort by "Name".

**Expected:**
- Price: low to high lists Steel Water Bottle ₹449, The Pragmatic Checklist ₹499, Testing in the Age of AI ₹599, Stoneware Mug Set (4) ₹649, Designing Reliable Systems ₹799, Pulse Wireless Earbuds ₹999, Pour-Over Coffee Kit ₹1,299, Arc Desk Lamp ₹1,849, Trail Canvas Backpack ₹1,999, Boom Mini Speaker ₹2,199, Stride Smartwatch ₹4,499, Hush ANC Headphones ₹7,999.
- Price: high to low lists the same 12 products in exactly the reverse order, starting with Hush ANC Headphones and ending with Steel Water Bottle.
- Name lists Arc Desk Lamp, Boom Mini Speaker, Designing Reliable Systems, Hush ANC Headphones, Pour-Over Coffee Kit, Pulse Wireless Earbuds, Steel Water Bottle, Stoneware Mug Set (4), Stride Smartwatch, Testing in the Age of AI, The Pragmatic Checklist, Trail Canvas Backpack.

**Oracle:** Product: seed prices and names in server/store.js. Verified automation: "sorts by price both ways and by name" (client/src/lib/catalog.test.js).

#### GRID-005 · Verify that the shop warns when a product is running low and stops it being added once it has sold out
**Priority:** P1 · **Risks:** R-5 · **Tags:** shop · **Automation:** Automated

**Preconditions:** Seed data (reset): Arc Desk Lamp has 3 in stock, every other product has more than 5. A second shopper can place orders (a second browser, or POST /api/orders).

**Steps:**
1. Open the shop and look at the Arc Desk Lamp card.
2. As the second shopper, buy all 3 Arc Desk Lamps.
3. Reload the shop, then open the Arc Desk Lamp product page.

**Expected:**
- The Arc Desk Lamp card shows "Only 3 left" and its Add to cart button works. It is the only card with a stock message.
- After the reload, the Arc Desk Lamp card shows "Out of stock" and its button reads "Out of stock" and cannot be pressed.
- The product page shows "Out of stock" and offers no quantity or Add to cart.

**Oracle:** Product: stockLabel rules (5 or fewer = "Only N left", 0 = "Out of stock") in client/src/lib/catalog.js, and stock checks in server/routes/orders.js.

### Product

#### PDP-001 · Verify that user can open a product from the shop, see its details and add a chosen quantity to the cart
**Priority:** P0 · **Risks:** R-6 · **Tags:** product · **Automation:** Automated

**Preconditions:** Seed data (reset); an empty cart.

**Steps:**
1. From the shop, open Stoneware Mug Set (4).
2. Raise the quantity to 2 and add it to the cart.
3. Open the cart from the confirmation message.

**Expected:**
- The product page shows the name Stoneware Mug Set (4), the price ₹649, "In stock", the description "Four hand-glazed 350 ml mugs." and the breadcrumb Shop / Home & Kitchen.
- The page confirms "Added 2 × Stoneware Mug Set (4) to your cart." with a View cart link, the quantity goes back to 1, and the header cart shows 2 items.
- The cart has one line, Stoneware Mug Set (4) × 2 at ₹1,298. Subtotal ₹1,298, Shipping Free, Total ₹1,298.

**Oracle:** Product: seed data in server/store.js and the running product page.

#### PDP-002 · Verify that user cannot choose a quantity below 1 or above the stock that is left on the product page
**Priority:** P1 · **Risks:** R-7 · **Tags:** product · **Automation:** Automated

**Preconditions:** Seed data (reset); an empty cart; the Arc Desk Lamp product page is open (3 in stock).

**Steps:**
1. Check the starting quantity.
2. Type 0 as the quantity and confirm it.
3. Type 10 as the quantity and confirm it. Try typing letters as well.
4. Add to cart.

**Expected:**
- The quantity starts at 1 and cannot be decreased.
- A typed 0 becomes 1.
- A typed 10 becomes 3 and the quantity cannot be increased further. Letters are not accepted into the field.
- The page confirms "Added 3 × Arc Desk Lamp to your cart.", the header cart shows 3 items, and the button now reads "All in your cart" and cannot be pressed.

**Oracle:** Product: clampQty in client/src/lib/cart.js. Verified automation: clampQty and "adds, merges and clamps to stock" (client/src/lib/cart.test.js).

#### PDP-003 · Verify that user who follows a link to a product that does not exist sees Page not found and can get back to the shop
**Priority:** P2 · **Risks:** R-8 · **Tags:** product · **Automation:** Automated

**Preconditions:** Seed data (reset). Product 999 does not exist.

**Steps:**
1. Open /product/999.
2. Open /product/abc.
3. Choose Back to the shop.

**Expected:**
- Both addresses show "Page not found" and "We couldn’t find that page. It may have moved."
- Back to the shop opens the shop with "12 products".

**Oracle:** Product: NotFoundPage. Verified automation: "GET /api/products/:id 404s for unknown and non-numeric ids" (server/test/products.test.js).

### Cart

#### CART-001 · Verify that the cart shows each product once with its quantity and line total, and adds them up to the right total
**Priority:** P0 · **Risks:** R-9 · **Tags:** cart · **Automation:** Automated

**Preconditions:** Seed data (reset); an empty cart; the shop is open.

**Steps:**
1. From the shop grid, add Pour-Over Coffee Kit once and Steel Water Bottle twice.
2. Open the cart.

**Expected:**
- The header cart shows 3 items.
- The cart is headed "Your cart (3 items)" and has two lines, not three: Pour-Over Coffee Kit, ₹1,299 each, quantity 1, ₹1,299; Steel Water Bottle, ₹449 each, quantity 2, ₹898.
- Subtotal ₹2,197, Shipping Free, Total ₹2,197.

**Oracle:** Product: seed prices. Verified automation: "adds, merges and clamps to stock" and "prices from the catalogue and applies SH-01" (client/src/lib/cart.test.js).

#### CART-002 · Verify that user is charged ₹99 shipping when the cart subtotal is below ₹999, and no shipping at ₹999
**Priority:** P1 · **Risks:** R-10 · **Tags:** cart · **Automation:** Automated

**Preconditions:** Seed data (reset); an empty cart.

**Steps:**
1. Put 2 × The Pragmatic Checklist (₹499 each) in the cart and open it. The subtotal is ₹998.
2. Remove it, put 1 × Pulse Wireless Earbuds (₹999) in the cart and open it. The subtotal is ₹999.

**Expected:**
- At ₹998: Shipping ₹99, Total ₹1,097, and the note "Add ₹1 more for free delivery."
- At ₹999: Shipping Free, Total ₹999, and no free-delivery note.

**Oracle:** Claims: README, "Shipping is ₹99 on orders under ₹999 and free from ₹999". Verified automation: "SH-01: ₹99 shipping below ₹999, free at exactly ₹999" (server/test/orders.test.js).

#### CART-003 · Verify that shipping and the total are recalculated when user changes a quantity in the cart so the subtotal crosses ₹999
**Priority:** P1 · **Risks:** R-11, R-7 · **Tags:** cart · **Automation:** Automated

**Preconditions:** Seed data (reset); the cart holds 2 × The Pragmatic Checklist (subtotal ₹998, shipping ₹99).

**Steps:**
1. Increase the quantity to 3.
2. Set the quantity to 1.

**Expected:**
- At 3: the line shows ₹1,497, the heading reads "Your cart (3 items)", Subtotal ₹1,497, Shipping Free, Total ₹1,497.
- At 1: the line shows ₹499, the heading reads "Your cart (1 item)", Subtotal ₹499, Shipping ₹99, Total ₹598, the note reads "Add ₹500 more for free delivery.", and the quantity cannot be decreased below 1.

**Oracle:** Claims: README shipping rule. Product: the cart recalculates from the catalogue price (client/src/lib/cart.js cartTotals).

#### CART-004 · Verify that user can remove products from the cart, and once the last one is removed the cart is empty and checkout is not available
**Priority:** P1 · **Risks:** R-12 · **Tags:** cart · **Automation:** Automated

**Preconditions:** Seed data (reset); the cart holds 1 × Pulse Wireless Earbuds and 1 × Steel Water Bottle (Subtotal ₹1,448, Shipping Free).

**Steps:**
1. Remove Pulse Wireless Earbuds.
2. Remove Steel Water Bottle.
3. Open /checkout directly.

**Expected:**
- One line is left (Steel Water Bottle) and the totals update: Subtotal ₹449, Shipping ₹99, Total ₹548.
- The page reads "Your cart is empty" and "Find something you’ll love." with a Continue shopping link, and the header cart shows 0 items.
- The checkout does not open: the empty cart is shown instead.

**Oracle:** Product: CartPage empty state and the CheckoutPage redirect to /cart when the cart has no lines.

#### CART-005 · Verify that user’s cart still holds its products and quantities after the page is reloaded
**Priority:** P0 · **Risks:** R-13 · **Tags:** cart · **Automation:** Automated

**Preconditions:** Seed data (reset); the cart holds 2 × Stoneware Mug Set (4) and 1 × Testing in the Age of AI; the cart page is open.

**Steps:**
1. Reload the page.
2. Open the cart in a new tab of the same browser.

**Expected:**
- After the reload the cart still has Stoneware Mug Set (4) × 2 at ₹1,298 and Testing in the Age of AI × 1 at ₹599, with Subtotal ₹1,897, Shipping Free, Total ₹1,897. The header cart shows 3 items.
- The new tab shows the same two lines and totals.

**Oracle:** Product: the cart is kept in the browser (CartContext, localStorage key cartwheel.cart).

### Checkout

#### CHK-001 · Verify that user can place a cash-on-delivery order with valid details, sees it confirmed and finds the cart empty afterwards
**Priority:** P0 · **Risks:** R-14 · **Tags:** checkout · **Automation:** Automated

**Preconditions:** Seed data (reset), so the next order number is 1001; the cart holds 1 × Steel Water Bottle.

**Steps:**
1. Go to checkout from the cart.
2. Enter the test customer’s delivery details (see Test data) and place the order.
3. Open the cart.

**Expected:**
- The checkout summary shows Steel Water Bottle × 1 ₹449, Subtotal ₹449, Shipping ₹99, Total ₹548, and Cash on delivery is selected.
- The confirmation page for order 1001 opens, headed "Thank you, Meera!", with "Order #1001 is confirmed. Please pay ₹548 in cash when it arrives." The header cart shows 0 items.
- The cart reads "Your cart is empty".

**Oracle:** Product: CheckoutPage and OrderPage; the order counter starts at 1000 after reset (server/store.js). Verified automation: "places a multi-item order with correct paise totals and decrements stock" (server/test/orders.test.js).

#### CHK-002 · Verify that user cannot place an order while any delivery detail is missing or invalid, and is shown which fields to fix
**Priority:** P0 · **Risks:** R-15 · **Tags:** checkout · **Automation:** Automated

**Preconditions:** Seed data (reset); the cart holds 1 × Steel Water Bottle; the checkout is open with every field empty.

**Steps:**
1. Place the order with every field empty.
2. Fill every field validly except Email "meera@example", Mobile number "12345" and PIN code "012345", and place the order again.
3. Correct them to "meera@example.com", "98765 43210" and "560038", and place the order again.

**Expected:**
- The order is refused and the page stays on checkout. Each field shows its own message: "Enter your full name", "Enter a valid email address", "Enter a valid 10-digit mobile number", "Enter your street address", "Enter your city", "Enter a valid 6-digit PIN code". The cursor is placed in Full name.
- The order is refused again. Only Email, Mobile number and PIN code show their messages, the other three are cleared, and the cursor is placed in Email. No order exists yet.
- Order #1001 is placed and confirmed, and the delivery details show the mobile number as 9876543210.

**Oracle:** Product: validateCustomer in client/src/lib/checkout.js and server/routes/orders.js (same wording). Verified automation: "validates customer fields and reports each one" (server/test/orders.test.js).

_(One case: every rejection here has the same remedy, which is to fix the named field. Automation can drive the invalid values as data.)_

#### CHK-003 · Verify that user cannot order more units than are left after another shopper buys first, and the cart is corrected to what is available
**Priority:** P1 · **Risks:** R-16 · **Tags:** checkout · **Automation:** Automated

**Preconditions:** Seed data (reset); the cart holds 2 × Arc Desk Lamp (3 in stock); the checkout is open with valid details entered. A second shopper can place orders (a second browser, or POST /api/orders).

**Steps:**
1. As the second shopper, buy 2 Arc Desk Lamps (this becomes order #1001).
2. Place the order.
3. Go back to the cart.
4. Return to checkout, enter the details again and place the order.

**Expected:**
- The second shopper’s order succeeds and 1 Arc Desk Lamp is left.
- The order is refused with "Only 1 left of Arc Desk Lamp" and the page stays on checkout. The summary updates to Arc Desk Lamp × 1 ₹1,849, Subtotal ₹1,849, Shipping Free, Total ₹1,849. Only the second shopper’s order exists.
- The cart explains "Only 1 of Arc Desk Lamp are available, so we updated your cart." with a Dismiss link, and the line quantity is 1.
- Order #1002 is confirmed for ₹1,849.

**Oracle:** Product: stock check in server/routes/orders.js and reconcileCart in client/src/lib/cart.js. Verified automation: "the last unit can be bought once; the next buyer gets 409 out of stock" (server/test/orders.test.js).

### Confirmation

#### ORD-001 · Verify that the order confirmation shows every item, the shipping charge, the amount to pay and the delivery address, and still shows them after a reload
**Priority:** P1 · **Risks:** R-17 · **Tags:** order · **Automation:** Automated

**Preconditions:** Seed data (reset); order #1001 placed by the test customer for 1 × The Pragmatic Checklist and 1 × Steel Water Bottle (through checkout, or POST /api/orders with the same data); its confirmation page is open.

**Steps:**
1. Read the confirmation.
2. Reload the page.

**Expected:**
- The page is headed "Thank you, Meera!" and says "Order #1001 is confirmed. Please pay ₹1,047 in cash when it arrives."
- Your order lists The Pragmatic Checklist × 1 ₹499 and Steel Water Bottle × 1 ₹449, then Subtotal ₹948, Shipping ₹99, Total ₹1,047.
- Delivering to shows Meera Iyer, 14 Lake View Road, Indiranagar, Bengaluru 560038, 9876543210, and there is a Continue shopping link.
- After the reload the page shows the same order, items and amounts.

**Oracle:** Product: OrderPage reads the order from GET /api/orders/:id. Claims: README shipping rule for the ₹99.

### Admin

#### ADM-001 · Verify that the admin dashboard figures reflect the orders shoppers have placed
**Priority:** P2 · **Risks:** R-18 · **Tags:** admin · **Automation:** Automated

**Preconditions:** Seed data (reset); no orders. Orders can be placed through the storefront or POST /api/orders.

**Steps:**
1. Open Admin (the dashboard).
2. Place two orders: 1 × Steel Water Bottle (₹548 with shipping) and 3 × Hush ANC Headphones (₹23,997).
3. Open the dashboard again.

**Expected:**
- Before any order: Revenue ₹0, Orders 0, Average order ₹0, Products 12, Low stock (< 10) 1, Users 3.
- After the two orders: Revenue ₹24,545, Orders 2, Average order ₹12,272.50, Products 12, Low stock (< 10) 2 (Hush ANC Headphones is down to 9), Users 3.

**Oracle:** Product: GET /api/analytics in server/routes/system.js (revenue is the sum of order totals, low stock is fewer than 10).

#### ADM-002 · Verify that admin can add a product with a price in rupees and paise, and shoppers see it in the shop at that price
**Priority:** P1 · **Risks:** R-19 · **Tags:** admin · **Automation:** Automated

**Preconditions:** Seed data (reset); Admin › Products is open and lists 12 products.

**Steps:**
1. Enter Name "Linen Table Runner", Category Home & Kitchen, Price (₹) "abc", and add the product.
2. Change Price (₹) to "1299.50", Stock to "4", and add the product.
3. Open the shop, then choose Home & Kitchen.

**Expected:**
- The product is not added and the form says "Enter a price in rupees, e.g. 1299 or 1299.50." The list still has 12 products.
- The form says "Added Linen Table Runner." and clears, and the list gains the row Linen Table Runner, Home & Kitchen, ₹1,299.50, 4.
- The shop shows "13 products". The Linen Table Runner card shows ₹1,299.50 and "Only 4 left" and can be added to the cart. Home & Kitchen shows "4 products", including it.

**Oracle:** Product: rupeesToPaise and formatINR in client/src/lib/money.js (₹1 = 100 paise; paise are shown to two decimals). Verified automation: rupeesToPaise tests (client/src/lib/money.test.js).

#### ADM-003 · Verify that orders placed by shoppers appear in the admin Orders list, newest first, with the customer, item count and total
**Priority:** P1 · **Risks:** R-20 · **Tags:** admin · **Automation:** Automated

**Preconditions:** Seed data (reset); no orders. Server time frozen at 2026-09-28T10:30:00Z with POST /api/test/clock (4:00 pm IST), so the Placed time is known.

**Steps:**
1. Open Admin › Orders.
2. Place order #1001 as the test customer (1 × Steel Water Bottle, ₹548), then order #1002 as Kabir Mehta (2 × The Pragmatic Checklist and 1 × Testing in the Age of AI, ₹1,597).
3. Open Admin › Orders again.

**Expected:**
- Before any order the page reads "No orders yet."
- The list shows #1002 first, then #1001: #1002, Kabir Mehta, 3 items, ₹1,597, status placed (shown as "Placed"); #1001, Meera Iyer, 1 item, ₹548, status placed.
- Placed shows 28 Sep 2026, 4:00 pm for both. The exact wording of the date follows the browser (for example "28 Sept 2026, 4:00 pm").

**Oracle:** Product: AdminOrders and GET /api/orders. Verified automation: "GET /api/orders/:id and list newest first" (server/test/orders.test.js).

#### ADM-004 · Verify that admin can add a user, and cannot add another user with an email that is already registered
**Priority:** P2 · **Risks:** R-21 · **Tags:** admin · **Automation:** Automated

**Preconditions:** Seed data (reset); Admin › Users is open and lists Asha Rao, Kabir Mehta and Priya Nair.

**Steps:**
1. Add Name "Rohan Das", Email "rohan@example.com", Role Admin.
2. Add Name "Asha Again", Email "ASHA@example.com".

**Expected:**
- The form says "Added Rohan Das.", clears, and resets Role to User. The list has 4 users, including Rohan Das, rohan@example.com, role admin (shown as "Admin").
- The form says "Email already exists" and the list still has 4 users.

**Oracle:** Product: AdminUsers and POST /api/users. Verified automation: "POST /api/users validates and rejects duplicates case-insensitively" (server/test/users.test.js).

#### ADM-005 · Verify that admin can delete a user after confirming, and nothing is deleted when they cancel
**Priority:** P2 · **Risks:** R-22 · **Tags:** admin · **Automation:** Automated

**Preconditions:** Seed data (reset); Admin › Users is open and lists Asha Rao, Kabir Mehta and Priya Nair.

**Steps:**
1. Delete Kabir Mehta and cancel the confirmation.
2. Delete Kabir Mehta again and accept the confirmation.
3. Reload the page.

**Expected:**
- The confirmation asks "Delete Kabir Mehta?". After cancelling, Kabir Mehta is still listed with the other two users.
- The page says "Deleted Kabir Mehta." and the list shows only Asha Rao and Priya Nair.
- After the reload Kabir Mehta is still gone.

**Oracle:** Product: AdminUsers and DELETE /api/users/:id. Verified automation: "DELETE /api/users/:id removes the user" (server/test/users.test.js).

### Responsive

#### MOB-001 · Verify that user on a phone-sized screen can open the menu and reach Admin from it
**Priority:** P2 · **Risks:** R-23 · **Tags:** responsive · **Automation:** Automated

**Preconditions:** Seed data (reset); a phone-sized viewport narrower than 768 px (for example Pixel 7 or iPhone 14); the shop is open.

**Steps:**
1. Look at the header.
2. Open the Menu.
3. Choose Admin.
4. Open the Menu and close it again.

**Expected:**
- The Shop and Admin links are hidden behind a Menu button, which is reported as collapsed.
- The menu opens, the Menu button is reported as expanded, and Shop and Admin are shown.
- The Admin dashboard opens and the menu closes by itself.
- The Menu button opens and closes the menu each time.

**Oracle:** Product: Layout (Menu button with aria-expanded; the nav shows inline from 768 px up).

#### MOB-002 · Verify that user on a phone-sized screen can see the cart total and go to checkout from the bar at the bottom of the cart
**Priority:** P1 · **Risks:** R-24 · **Tags:** responsive · **Automation:** Automated

**Preconditions:** Seed data (reset); a phone-sized viewport narrower than 768 px; the cart holds 1 × Pour-Over Coffee Kit; the cart page is open.

**Steps:**
1. Look at the bottom of the screen.
2. Increase the quantity to 2.
3. Choose Checkout in the bar.

**Expected:**
- A bar fixed to the bottom of the screen, visible without scrolling, shows Total ₹1,299 and a Checkout link. It is the only Checkout link on the page, because the summary’s own Checkout button is hidden at this size.
- The bar’s total changes to ₹2,598, matching the summary total.
- The checkout opens with Total ₹2,598.

**Oracle:** Product: CartPage sticky bar (shown below 768 px, replacing the summary Checkout button).

## 5. Attacks on the plan

### Sparse: what slips through?

Every behaviour the storefront decides has a guarding case:

| Behaviour | Case |
|---|---|
| Category, search, the no-match state and sort on the shop | GRID-001, GRID-002, GRID-003, GRID-004 |
| Stock labels and the sold-out block | GRID-005 |
| Product details and adding a chosen quantity | PDP-001 |
| Quantity limits (1 to the stock left) | PDP-002, CART-003 |
| Missing product | PDP-003 |
| Cart lines, merging and totals | CART-001 |
| Shipping at ₹998 and ₹999 | CART-002 |
| Recalculation after a quantity change | CART-003 |
| Remove, empty state, no checkout while empty | CART-004 |
| Cart survives a reload | CART-005 |
| Placing a cash-on-delivery order; the cart empties | CHK-001 |
| Delivery-detail validation | CHK-002 |
| Stock conflict at order time | CHK-003 |
| Confirmation contents | ORD-001 |
| Dashboard, product add, orders list, user add, user delete | ADM-001, ADM-002, ADM-003, ADM-004, ADM-005 |
| Phone menu and phone checkout bar | MOB-001, MOB-002 |

Risks without a case are deferred in section 3 with a reason: R-25 and R-26 need a failed request,
R-27 to R-29 are candidates outside this suite, and R-30 is visual.

### Bloat: what is noise?

Each case was asked "if I delete this, which risk is left uncovered?" Every case names at least one risk
that no other case guards (see the coverage table). What was cut or folded, and where it went:

| Cut or folded | Why | Where it went |
|---|---|---|
| Hero text, footer, headings, field labels | Trivial UI; visual checks catch them | Dropped |
| One case per empty checkout field (six cases) | Same remedy: fix the named field | CHK-002 lists every message |
| Separate cases for adding from the grid and adding the same product again | Same cart outcome (lines and totals) | CART-001 |
| A separate empty-cart case | Reached by removing the last line | CART-004 |
| A separate "checkout summary shows shipping" case | Same moment as placing the order | CHK-001 Expected |
| A separate invalid-price case in admin | Same form, same remedy | ADM-002 step 1 |
| A separate duplicate-email case | Same form, same remedy | ADM-004 step 2 |
| Middle-of-the-class subtotals (₹500, ₹700) | Not at the edge | CART-002 tests ₹998 and ₹999 |

## 6. Automation map

- **One case, one test.** Each case becomes one Playwright test titled `<ID> <title>`, in a
  `describe` tagged with the case's feature tag (`@shop`, `@product`, `@cart`, `@checkout`,
  `@order`, `@admin`, `@responsive`), and the test tagged with its priority. No case is folded into
  another test.
- **Setup through the API.** Every test starts with `POST /api/test/reset` and empty local storage.
  The second shopper's orders (GRID-005, CHK-003, ADM-001, ADM-003) and the order behind ORD-001 may be
  placed with `POST /api/orders`; the frozen time in ADM-003 uses `POST /api/test/clock`. Only the step
  under test is driven through the UI.
- **Data-driven inside one test.** CHK-002 drives its invalid values as data; CART-002 asserts ₹998 and
  ₹999 explicitly, one after the other.
- **Platforms.** MOB-001 and MOB-002 run only on the phone profiles. Every other case runs on every
  profile; on phones, navigation that uses the header links goes through the Menu.
- **Deferred to automation.** R-25 and R-26 (failed requests) can be reached with `page.route()`.

## 7. Coverage

| Risk | Cases |
|---|---|
| R-1 | GRID-001 |
| R-2 | GRID-002 |
| R-3 | GRID-003 |
| R-4 | GRID-004 |
| R-5 | GRID-005 |
| R-6 | PDP-001 |
| R-7 | PDP-002, CART-003 |
| R-8 | PDP-003 |
| R-9 | CART-001 |
| R-10 | CART-002 |
| R-11 | CART-003 |
| R-12 | CART-004 |
| R-13 | CART-005 |
| R-14 | CHK-001 |
| R-15 | CHK-002 |
| R-16 | CHK-003 |
| R-17 | ORD-001 |
| R-18 | ADM-001 |
| R-19 | ADM-002 |
| R-20 | ADM-003 |
| R-21 | ADM-004 |
| R-22 | ADM-005 |
| R-23 | MOB-001 |
| R-24 | MOB-002 |
| R-25, R-26 | Deferred: not tester-reachable (section 3) |
| R-27, R-28, R-29 | Deferred: outside this suite (section 3) |
| R-30 | Deferred: excluded surface, visual layout (section 3) |

### Rotation: shared mechanisms

**Quantity stepper** (the same control on the product page and in the cart):

| Surface | Lower bound (1) | Upper bound (stock left) | Typed out-of-range value | Valid change | Case |
|---|---|---|---|---|---|
| Product page | ✓ | ✓ | ✓ | | PDP-002 |
| Cart | ✓ | | | ✓ | CART-003 |
| **Total** | 2 | 1 | 1 | 1 | |

**Order summary** (the same block in the cart, checkout and confirmation):

| Surface | Shipping ₹99 | Shipping Free | Case |
|---|---|---|---|
| Cart | ✓ | ✓ | CART-002 |
| Checkout | ✓ | | CHK-001 |
| Confirmation | ✓ | | ORD-001 |
| **Total** | 3 | 1 | |

**Admin add form** (the same success and rejection pattern on two admin screens):

| Surface | Added | Rejected: bad format | Rejected: duplicate | Case |
|---|---|---|---|---|
| Products | ✓ | ✓ | | ADM-002 |
| Users | ✓ | | ✓ | ADM-004 |
| **Total** | 2 | 1 | 1 | |
