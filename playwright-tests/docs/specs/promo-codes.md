# Promo codes: product spec

**Cartwheel storefront · v1.0 · Approved for development**

Shoppers can apply one promo code on the cart page to get a discount or free shipping, and can check
any code on the Offers page. The server calculates every amount; the web app shows what it returns.

## Codes

All dates are in India Standard Time (IST).

| Code | Gives | Min. order | Max. discount | Valid | Limit | On Offers page |
|---|---|---|---|---|---|---|
| WELCOME10 | 10% off | ₹999 | ₹300 | Always | Once per email | Yes |
| FLAT250 | ₹250 off | ₹1,999 | — | Always | — | Yes |
| FREESHIP | Free shipping | — | — | Always | — | Yes |
| BOOKS20 | 20% off items in Books | — | — | Always | — | Yes |
| DIWALI25 | 25% off | ₹2,999 | ₹1,000 | 15 Oct – 5 Nov 2026 | — | Yes |
| MONSOON15 | 15% off | ₹499 | ₹200 | 1 Jul – 15 Sep 2026 | — | Yes |
| LIMITED5 | ₹100 off | — | — | Always | 5 uses in total | No |

## Rules

*Subtotal* is the price × quantity of every item, before any discount and before shipping. Shipping is
₹99 when the subtotal is below ₹999 and free from ₹999.

1. **Entering a code.** Spaces around it are ignored and letter case doesn't matter. Codes are shown in
   upper case. A code is 3–20 letters and digits.
2. **One code per order.** A new code replaces the applied one. If the new code fails, the old one stays.
3. **Minimum order.** Met when the subtotal is **equal to or above** the minimum: a ₹999 subtotal
   qualifies for WELCOME10.
4. **Percentage.** Subtotal × percentage, **then** capped at the maximum discount: WELCOME10 on ₹7,999
   gives ₹300.
5. **Flat.** The amount off, never more than the subtotal.
6. **Free shipping.** Shipping becomes ₹0. If the order already ships free, the code still applies.
7. **Category.** The percentage applies only to that category's items. With none in the cart, the code
   fails.
8. **Totals.** The discount is rounded **down** to whole rupees. Total = subtotal − discount + shipping,
   and shipping is worked out on the subtotal **before** the discount.
9. **Dates.** A dated code is valid from 00:00:00 on its first day to 23:59:59 on its last day.
10. **Limits.** A use counts only when an order is placed. "Once per email" is checked when the order
    is placed, because the cart doesn't know the email.
11. **Which error.** If several things are wrong, only the first in this order is shown: format, unknown
    code, not started, expired, usage limit, already used with this email, empty cart, minimum order,
    category.
12. **Cart changes.** The code is checked again whenever the cart changes. If it no longer qualifies,
    it is removed and the shopper sees "{CODE} was removed. {reason}".
13. **Refresh and checkout.** An applied code survives a page refresh. The server checks it again when
    the order is placed. If it fails, no order is placed, the code is removed and the reason is shown
    on the checkout page.

## Messages

`{CODE}` is the code in upper case. Dates read like `15 Oct 2026`.

| When | Message |
|---|---|
| Applied | {CODE} applied. You saved ₹{saving}. ({saving} is the discount plus any shipping the code removes.) |
| Applied, order already ships free | {CODE} applied. Your order already ships free. |
| Letters and digits only | Promo codes contain only letters and numbers. |
| Unknown code | We couldn't find the code {CODE}. |
| Not started | {CODE} starts on {first day}. |
| Expired | {CODE} expired on {last day}. |
| Usage limit reached | {CODE} has reached its usage limit. |
| Already used with this email | {CODE} has already been used with this email. |
| Empty cart | Add items to your cart to use a promo code. |
| Below the minimum | Add ₹{shortfall} more to use {CODE}. |
| No items in the category | {CODE} isn't valid for items in your cart. |
| Network error | Couldn't apply code. Please try again. |

## Screens

- **Cart:** "Have a promo code?" opens a box with a Promo code input, an Apply button and a message
  line. Once a code is applied, "{CODE} applied" and a Remove link appear. When the discount is above
  ₹0, the summary shows a Promo row between Subtotal and Shipping, e.g. "Promo (WELCOME10 · 10% off)
  −₹300".
- **Checkout, order confirmation and Admin → Orders** show the code and the discount. Admin → Orders
  has Promo and Discount columns ("—" when none).
- **Offers** (`/offers`, "Offers" in the main navigation): a "Check a code" box that works for any code
  without a cart, and a card for each listed code with its benefit, conditions, status (Active, Not
  started or Expired) and a Copy button that shows "Copied" for two seconds. The code on every card is
  fully readable at every screen width.
- **Phones:** the cart summary, the promo message and the Promo row fit without scrolling sideways and
  are not hidden by the checkout bar.

## Acceptance criteria

| ID | Given | When | Then |
|---|---|---|---|
| AC-01 | Pulse Wireless Earbuds + The Pragmatic Checklist (₹1,498) | apply ` welcome10 ` | −₹149, total ₹1,349, "WELCOME10 applied. You saved ₹149." |
| AC-02 | One Pulse Wireless Earbuds (₹999) | apply WELCOME10 | −₹99, total ₹900 |
| AC-03 | Two Steel Water Bottles (₹898) | apply WELCOME10 | "Add ₹101 more to use WELCOME10." |
| AC-04 | Hush ANC Headphones (₹7,999) | apply WELCOME10 | −₹300 |
| AC-05 | One Stoneware Mug Set (₹649) | apply FREESHIP | shipping ₹0, total ₹649, "FREESHIP applied. You saved ₹99." |
| AC-06 | A book (₹599) + a Stoneware Mug Set (₹649) | apply BOOKS20 | −₹119 |
| AC-07 | Stride Smartwatch (₹4,499), server time 5 Nov 2026 23:59:59 | apply DIWALI25 | −₹1,000 |
| AC-08 | Server time 6 Nov 2026 00:00:00 | apply DIWALI25 | "DIWALI25 expired on 5 Nov 2026." |
| AC-09 | Arc Desk Lamp + Steel Water Bottle, FLAT250 applied | remove the bottle | "FLAT250 was removed. Add ₹150 more to use FLAT250." |
| AC-10 | An order with a@example.com used WELCOME10 | place another order with WELCOME10 and the same email | no order is placed; "WELCOME10 was removed. WELCOME10 has already been used with this email." |
| AC-11 | — | check `limited5` on the Offers page | ₹100 off, Active |

## Out of scope

Using more than one code · codes tied to accounts · admin screens for codes · gift cards · referrals.
