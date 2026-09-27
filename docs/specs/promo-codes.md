# Promo codes — Product specification

| | |
|---|---|
| **Product** | Cartwheel storefront |
| **Feature** | Promo codes |
| **Version** | 1.0 |
| **Status** | Approved for development |
| **Last updated** | 27 Sep 2026 |

## 1. Overview

Shoppers can apply a promo code to their cart to get a discount or free shipping, and can check any code on an Offers page without having a cart. The server is the source of truth for every calculation; the web app displays what the server returns.

## 2. Goals

1. Let shoppers apply one promo code per order on the cart page and see the saving before checkout.
2. Let shoppers check whether a code is valid, what it gives and its conditions, without a cart.
3. Record the applied code and discount on the order and show it on the confirmation page and in Admin → Orders.

## 3. User stories

| ID | As a… | I want to… | So that… |
|---|---|---|---|
| US-1 | shopper | enter a code on my cart and see the discount | I know what I'll pay |
| US-2 | shopper | be told exactly why a code doesn't work | I can fix it (e.g. add more items) |
| US-3 | shopper | check a code on the Offers page | I know if it's worth using |
| US-4 | shopper | keep my code when I refresh or come back later | I don't have to enter it again |
| US-5 | store admin | see which code was used on each order | I can track promotions |

## 4. Promo types

| Type | Effect |
|---|---|
| `percentage` | A percentage of the subtotal, optionally capped at a maximum discount |
| `flat` | A fixed rupee amount off the subtotal |
| `free_shipping` | Shipping becomes ₹0 |
| `category` | A percentage off only the items in one category |

## 5. Launch codes

All dates are in India Standard Time (IST, UTC+05:30).

| Code | Type | Value | Min. order | Max. discount | Valid | Limits | Shown on Offers |
|---|---|---|---|---|---|---|---|
| WELCOME10 | percentage | 10% | ₹999 | ₹300 | Always | Once per email | Yes |
| FLAT250 | flat | ₹250 | ₹1,999 | — | Always | — | Yes |
| FREESHIP | free_shipping | Shipping ₹0 | — | — | Always | — | Yes |
| BOOKS20 | category (Books) | 20% | — | — | Always | — | Yes |
| DIWALI25 | percentage | 25% | ₹2,999 | ₹1,000 | 15 Oct 2026 – 5 Nov 2026 | — | Yes |
| MONSOON15 | percentage | 15% | ₹499 | ₹200 | 1 Jul 2026 – 15 Sep 2026 | — | Yes |
| LIMITED5 | flat | ₹100 | — | — | Always | 5 uses in total | No |

## 6. Business rules

**Definitions.** *Subtotal* is the sum of item price × quantity, before any discount and before shipping. *Shipping* follows SH-01: ₹99 when the subtotal is below ₹999, free when the subtotal is ₹999 or more. *Eligible subtotal* is the subtotal of the items a code applies to (all items, except for `category` codes).

| Rule | Statement |
|---|---|
| **BR-01 Normalisation** | Leading and trailing spaces are removed. Codes are case-insensitive (`welcome10` = `WELCOME10`). Codes are always displayed in upper case. |
| **BR-02 Format** | After normalisation a code is 3–20 characters, letters A–Z and digits 0–9 only. Anything else fails with `PROMO_INVALID_FORMAT`. |
| **BR-03 Input behaviour** | The Apply button is disabled while the input is empty or only spaces. Pressing Enter in the input applies the code. While the code is being checked the button shows "Applying…" and is disabled. |
| **BR-04 One code per order** | Only one code can be applied. Applying a different code replaces the current one (if the new code fails, the current one stays applied). |
| **BR-05 Minimum order** | A code with a minimum order applies when the subtotal is **greater than or equal to** the minimum. Example: a ₹999 subtotal qualifies for WELCOME10. Otherwise it fails with `PROMO_MIN_ORDER`, and the message states the shortfall. |
| **BR-06 Percentage** | Discount = subtotal × percentage, **then** capped at the code's maximum discount if it has one. Example: WELCOME10 on ₹7,999 → 10% = ₹799.90 → capped to ₹300. |
| **BR-07 Flat** | Discount = the flat value, but never more than the subtotal. |
| **BR-08 Free shipping** | Shipping becomes ₹0 and the discount is ₹0. If the order already ships free, the code still applies and the message says so. |
| **BR-09 Category** | The percentage applies only to the eligible subtotal (items in the code's category). If the cart has no eligible items, the code fails with `PROMO_NOT_APPLICABLE`. |
| **BR-10 Rounding and totals** | The discount is rounded **down** to a whole rupee and never exceeds the eligible subtotal. Total = subtotal − discount + shipping. Shipping (SH-01) is always based on the subtotal **before** the discount. |
| **BR-11 Validity window** | A dated code is valid from 00:00:00 IST on its start date through 23:59:59 IST on its end date, **inclusive**. Before the start: `PROMO_NOT_STARTED`. After the end: `PROMO_EXPIRED`. |
| **BR-12 Usage limits** | A total-use limit fails with `PROMO_LIMIT_REACHED` once reached. A once-per-email code fails with `PROMO_ALREADY_USED` if an order with that email already used it; this is checked when the order is placed (the email is not known on the cart). A use is counted only when an order is placed. |
| **BR-13 Order of checks** | Checks run in this order and the **first** failure is reported: format → exists → started → not expired → usage limit → once per email (only when an email is supplied) → cart not empty → minimum order → category eligibility. |
| **BR-14 Cart changes** | Whenever the cart changes, the applied code is re-checked and the discount recalculated. If the code no longer qualifies it is removed and the shopper sees "{CODE} was removed. {reason}", where {reason} is the failure message. |
| **BR-15 Persistence and server check** | The applied code is saved with the cart and survives a page refresh. The server checks the code again when the order is placed; if it fails, the order is **not** placed, the code is removed, and the reason is shown on the checkout page. |
| **BR-16 Offers page** | `/offers` lists every code marked "Shown on Offers" as a card: code, benefit, conditions, status badge (Active / Not started / Expired), "Ends in N days" when an active dated code ends within 7 days ("Ends today" on the last day), and a Copy button. A "Check a code" box accepts any code, including ones not listed, and shows its type, benefit, conditions and status — no cart needed. |

## 7. Messages

`{CODE}` is the normalised code. Amounts use the store format (`₹1,299`, or `₹1,299.50` when there are paise). Dates use `d MMM yyyy` (e.g. `15 Oct 2026`).

| Error code | HTTP | Message |
|---|---|---|
| `PROMO_INVALID_FORMAT` | 400 | Promo codes contain only letters and numbers. |
| `PROMO_NOT_FOUND` | 404 | We couldn't find the code {CODE}. |
| `PROMO_NOT_STARTED` | 422 | {CODE} starts on {start date}. |
| `PROMO_EXPIRED` | 422 | {CODE} expired on {end date}. |
| `PROMO_LIMIT_REACHED` | 422 | {CODE} has reached its usage limit. |
| `PROMO_ALREADY_USED` | 422 | {CODE} has already been used with this email. |
| `PROMO_EMPTY_CART` | 422 | Add items to your cart to use a promo code. |
| `PROMO_MIN_ORDER` | 422 | Add ₹{shortfall} more to use {CODE}. |
| `PROMO_NOT_APPLICABLE` | 422 | {CODE} isn't valid for items in your cart. |

| Situation | Message |
|---|---|
| Applied (discount) | {CODE} applied. You saved ₹{saving}. |
| Applied (free shipping, shipping was ₹99) | {CODE} applied. You saved ₹99. |
| Applied (free shipping, already free) | {CODE} applied. Your order already ships free. |
| Removed after a cart change or at checkout | {CODE} was removed. {reason} |
| Network or unexpected error | Couldn't apply code. Please try again. |

## 8. Screens

### 8.1 Cart (`/cart`)
- The order summary has a "Have a promo code?" button that reveals the promo box (it starts open when a code is applied).
- Promo box: text input labelled "Promo code", an **Apply** button, and a message line below them.
- When a code is applied, "{CODE} applied" and a **Remove** link appear above the input. The input stays available so another code can replace it (BR-04). Removing restores the prices without a code.
- The summary rows are: Subtotal · Promo · Shipping · Total. The Promo row appears only when the discount is more than ₹0. Its label is "Promo ({CODE} · {short benefit})" and its value is the discount with a minus sign, e.g. "Promo (WELCOME10 · 10% off)  −₹300". Short benefits: `10% off`, `₹250 off`, `20% off Books`, `Free shipping`.
- On phones the whole summary, including the promo message and the Promo row, must be readable without horizontal scrolling and must not be covered by the sticky checkout bar.

### 8.2 Checkout (`/checkout`)
- The summary repeats the Promo row (read-only, no input).
- Place Order sends the code; see BR-15 for failures.

### 8.3 Order confirmation (`/order/:id`) and Admin → Orders
- Confirmation shows the Promo row when the order has a discount.
- Admin → Orders has **Promo** and **Discount** columns ("—" when none).

### 8.4 Offers (`/offers`)
- Linked from the main navigation as "Offers".
- "Check a code" box at the top; offer cards below (one column on phones, two from 768 px, three from 1024 px).
- The code on each card must be fully readable at every screen width.
- Copy puts the code on the clipboard and the button says "Copied" for two seconds.

## 9. API

All amounts are integer **paise** (₹1 = 100).

### `GET /api/promos`
`200 { promos: PromoView[] }` — only codes shown on Offers.

### `GET /api/promos/:code`
`200 PromoView` for any existing code, `400` for bad format, `404` for unknown.

```
PromoView {
  code, type, value,            // value: percent for percentage/category, paise for flat, 0 for free_shipping
  minOrder, maxDiscount,        // paise or null
  category,                     // "Books" or null
  startsOn, endsOn,             // "YYYY-MM-DD" (IST) or null
  status,                       // "active" | "not_started" | "expired" | "limit_reached"
  daysLeft,                     // whole days until endsOn (0 on the last day) or null
  benefit, shortBenefit,        // e.g. "10% off, up to ₹300", "10% off"
  conditions                    // e.g. ["Min. order ₹999", "Once per customer"]
}
```

### `POST /api/promos/apply`
Body `{ code, items: [{ productId, quantity }], email? }`.
`200 { code, type, shortBenefit, subtotal, discount, shipping, total, savings, message }` where `savings = discount + (shipping before code − shipping after code)`.
Errors: `{ errorCode, message }` plus `shortfall` (paise) for `PROMO_MIN_ORDER`. Item errors (unknown product, bad quantity, not enough stock) use the order API's error format.

### `POST /api/orders`
Accepts an optional `promoCode`. The order stores `promoCode` (or `null`) and `discount` (paise). If the code fails, responds with the promo error (`{ errorCode, message }`) and places no order.

## 10. Acceptance criteria

| ID | Given | When | Then |
|---|---|---|---|
| AC-01 | Cart with Pulse Wireless Earbuds and The Pragmatic Checklist (subtotal ₹1,498) | apply ` welcome10 ` | discount ₹149 (₹149.80 rounded down), total ₹1,349, message "WELCOME10 applied. You saved ₹149." |
| AC-02 | Cart subtotal ₹999 (one Pulse Wireless Earbuds) | apply WELCOME10 | discount ₹99, total ₹900 |
| AC-03 | Cart with two Steel Water Bottles (subtotal ₹898) | apply WELCOME10 | error "Add ₹101 more to use WELCOME10." |
| AC-04 | Cart with Hush ANC Headphones (₹7,999) | apply WELCOME10 | discount ₹300 |
| AC-05 | Cart with one Stoneware Mug Set (₹649) | apply FREESHIP | shipping ₹0, total ₹649, message "FREESHIP applied. You saved ₹99." |
| AC-06 | Cart with a book (₹599) and a mug set (₹649) | apply BOOKS20 | discount ₹119 (20% of ₹599 = ₹119.80, rounded down) |
| AC-07 | Cart with only electronics | apply BOOKS20 | error "BOOKS20 isn't valid for items in your cart." |
| AC-08 | Today is before 15 Oct 2026 | apply DIWALI25 | error "DIWALI25 starts on 15 Oct 2026." |
| AC-09 | Server time 5 Nov 2026 23:59:59 IST, cart with Stride Smartwatch (₹4,499) | apply DIWALI25 | applies: discount ₹1,000 (25% = ₹1,124.75, capped) |
| AC-10 | Server time 6 Nov 2026 00:00:00 IST | apply DIWALI25 | error "DIWALI25 expired on 5 Nov 2026." |
| AC-11 | Cart with one Steel Water Bottle (₹449, below MONSOON15's ₹499 minimum) | apply MONSOON15 | error "MONSOON15 expired on 15 Sep 2026.", not the minimum-order message (BR-13) |
| AC-12 | Cart with Arc Desk Lamp (₹1,849) and Steel Water Bottle (₹449), FLAT250 applied | remove the bottle | "FLAT250 was removed. Add ₹150 more to use FLAT250." |
| AC-13 | WELCOME10 applied, page refreshed | — | WELCOME10 still applied |
| AC-14 | An order with email a@example.com used WELCOME10 | place another order with WELCOME10 and the same email | order not placed; "WELCOME10 was removed. WELCOME10 has already been used with this email." |
| AC-15 | LIMITED5 used by 5 orders | apply LIMITED5 | error "LIMITED5 has reached its usage limit." |
| AC-16 | — | check `limited5` on /offers | shows ₹100 off, Active |
| AC-17 | — | apply `WEL-10` | error "Promo codes contain only letters and numbers." |

## 11. Out of scope

Stacking multiple codes · codes tied to user accounts · admin screens to create or edit codes · gift cards · referral codes.
