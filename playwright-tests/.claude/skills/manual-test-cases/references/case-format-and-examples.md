# Case format and worked examples

Read before writing the first case, and again before you deliver.

## The plan file, in order

1. **Model**: the eight slots (Step 1).
2. **Risk ledger**: ID, risk, impact, likelihood (Step 2).
3. **Open questions and deferrals.** One row per `open question: undecided` (the question, the case it
   becomes once answered, and the priority that case would carry). One row per `deferred: not
   tester-reachable` (the risk, what would reach it, and who owns it). One row per `deferred: excluded
   surface`. This table is what makes a removed case writable again: a case that is not in the plan but
   is in this table is deferred, and one that is in neither was lost.
4. **Cases**, in the stated order: happy paths → single-step mechanics → guard rules → availability →
   combinations.
5. **Both attacks**, written out (sparse, then bloat).
6. **Automation map**: case → test, plus which cases fold into which host (Step 7).
7. **Coverage table**: risk ID → case IDs, which makes the sparse attack auditable. Put the
   **rotation table** for any shared mechanism directly under it.

## Case fields

| Field | Rule |
|---|---|
| **ID** | `<AREA>-<NNN>`, for example `CART-003`. Stable: never renumbered, and a retired ID is never reused. Areas for Cartwheel are `GRID`, `PDP`, `CART`, `CHK`, `ORD` and `ADM`. |
| **Title** | `Verify that user …` or `Verify that <subject> …`. States intent and names no moment of execution. |
| **Priority** | `P0`–`P3`. If the case tool uses words, map them as P0 → Critical, P1 → High, P2 → Medium, P3 → Low. |
| **Risks** | The risk IDs this case guards. Required. |
| **Preconditions** | The state before the test, and how it is created (seeded product, admin session, cart set through the API). |
| **Steps** | Numbered, at the level of intent. Name the data or variant the case uses. No chains of clicks. |
| **Expected** | Observable outcomes, specific enough that pass or fail is unambiguous. Quote exact copy only where it carries meaning, and mark it `pending live UI verification` until someone has seen it. |
| **Oracle** | Claims, History, Comparable product, User desires, Product or Verified automation, plus its source. |
| **Automation** | `Not automated` (the default when authoring) · `Cannot be automated: <reason>` · `Automated` (set only by the change that adds the test). |
| **Tags** | The feature tag, the same one the automated test's `describe` will carry. |

If a case-management tool needs a flat file, export the same fields as tab-separated columns in this
order. The markdown plan stays the source of truth.

## Case shape

```markdown
### CART-002 · Verify that user is charged ₹99 shipping when the cart subtotal is below ₹999, and no shipping at ₹999 or above
**Priority:** P1 · **Risks:** R-1, R-4 · **Tags:** cart · **Automation:** Not automated
**Preconditions:** Products whose prices can make the subtotals below; an empty cart
**Steps:**
1. Build a cart with a subtotal of ₹998.
2. Change the cart so that the subtotal is ₹999.
3. Change it again so that the subtotal is ₹1,000.
**Expected:**
- At ₹998, shipping is ₹99 and the total is ₹1,097.
- At ₹999, shipping is free and the total is ₹999.
- At ₹1,000, shipping is free and the total is ₹1,000.
**Oracle:** Claims: brief, "Shipping" section
```

## Worked examples

These are illustrative. Confirm exact labels and copy against the running app before you mark
anything as verified.

```markdown
### CART-001 · Verify that user can add a product to the cart with a chosen quantity, and the cart shows the line and the correct subtotal
**Priority:** P0 · **Risks:** R-3 (chosen quantity lost), R-5 (wrong subtotal) · **Tags:** cart
**Preconditions:** At least one in-stock product; an empty cart
**Steps:**
1. Open any product and choose a quantity of 2.
2. Add it to the cart and open the cart.
**Expected:**
- The cart has one line for that product with quantity 2.
- The subtotal is twice the unit price shown on the product page.
**Oracle:** Claims: brief, "Cart" section
```

```markdown
### CHK-002 · Verify that user cannot place a guest order while any required field is empty or invalid, and is shown which fields to fix
**Priority:** P0 · **Risks:** R-2 (order with unreachable contact details) · **Tags:** checkout
**Preconditions:** A cart with at least one line; checkout opened as a guest
**Steps:**
1. Try to place the order with every field empty.
2. Fill every field validly except the email, which is malformed, and try again.
3. Correct the email, make the phone number too short, and try again.
**Expected:**
- Each attempt is refused, and no order is created.
- Every field at fault is identified next to the field. The message conveys what is wrong (pending live
  UI verification).
- Once every field is valid, the order can be placed.
**Oracle:** Claims: brief, "Guest checkout" validation rules
_(One case. Every rejection here has the same remedy, which is to fix the named field. Automation
iterates the invalid classes as data.)_
```

```markdown
### CHK-004 · Verify that an order placed by a guest appears in the admin Orders list with the same items and total
**Priority:** P1 · **Risks:** R-7 (order paid but never fulfilled) · **Tags:** checkout, admin
**Preconditions:** A guest session and an admin session (separate browsers or contexts)
**Steps:**
1. As a guest, place an order and note its order number and total.
2. As an admin, open Orders and find that order number.
**Expected:** The order is listed with the same items, quantities and total as the confirmation.
**Oracle:** Claims: brief, "Admin: Orders"
```

```markdown
### GRID-002 · Verify that user can narrow the product grid with a filter and see every product again after clearing it
**Priority:** P1 · **Risks:** R-9 (shopper cannot find products) · **Tags:** product_grid
**Preconditions:** The catalogue has products both inside and outside the chosen filter value
**Steps:**
1. Apply one filter value on the product grid.
2. Clear the filter.
**Expected:**
- While the filter is applied, every product shown matches it, and no matching product is missing.
- After clearing, the full catalogue is shown again.
**Oracle:** Claims: brief, "Filters"
```
