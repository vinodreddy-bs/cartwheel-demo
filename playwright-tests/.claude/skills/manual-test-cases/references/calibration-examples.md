# Calibration examples

Use these to answer "is this plan too thin or too thorough?". The answer is a comparison, not an
opinion. Both examples use the Cartwheel storefront. The briefs are illustrative, so exact labels and
limits may differ from the running app. They calibrate *judgement about how many cases to write*, and
that judgement transfers.

## Example 1: cart and guest checkout

### The brief (illustrative)

A shopper adds products to the cart, choosing a quantity with the stepper on the product page. The cart
shows each line, a subtotal, and shipping: **₹99 when the subtotal is below ₹999, and free at ₹999
or above.** The total is subtotal plus shipping. Quantities can be changed and lines removed in the
cart. **Guest checkout** has six required, validated fields. An order cannot be placed while any of
them is empty or invalid, and each problem field is identified. Placing an order shows a
**confirmation** with an order number, the items and the total charged. The cart is then empty, and
the order appears in the **admin Orders** list.

### Too sparse: 5 cases

| ID | Pri | Case |
|---|---|---|
| A1 | P0 | Verify that user can add a product to the cart |
| A2 | P0 | Verify that user can place a guest order |
| A3 | P1 | Verify that user can remove an item from the cart |
| A4 | P2 | Verify that checkout works across browsers |
| A5 | P3 | Verify that the cart icon shows the item count |

Every case can be defended. The plan is still wrong, because **seven material risks are unguarded,
four of them about money**:

- The **shipping threshold** is never checked at its edge, so ₹99 is charged at exactly ₹999, or not
  charged at ₹998.
- The **total charged** is never compared with subtotal plus shipping.
- Shipping is **not recalculated** when a quantity change moves the subtotal across the threshold.
- **Invalid details** are never shown to block the order, so orders are placed with an unreachable email.
- **Double-submitting** "Place order" creates two orders.
- The order **never reaches admin**, so it is paid for but never fulfilled.
- The **cart is not emptied** after the order, so the shopper orders the same items again.

This is what the **sparse attack** looks for. List what a plausible-looking plan lets through, then
close each gap or defer it in writing.

### Balanced: 11 cases

| ID | Pri | Case | Derived by |
|---|---|---|---|
| CART-001 | P0 | Verify that user can add a product to the cart with a chosen quantity, and the cart shows the line and the correct subtotal | valid class |
| CART-002 | P1 | Verify that user is charged ₹99 shipping when the cart subtotal is below ₹999, and no shipping at ₹999 or above | boundary (₹998 / ₹999 / ₹1,000 in one table) |
| CART-003 | P1 | Verify that shipping is recalculated when user changes a quantity in the cart so that the subtotal crosses ₹999 | lifecycle transition, *Time* |
| CART-004 | P1 | Verify that user can remove a line from the cart, and the subtotal and shipping update | lifecycle transition |
| CART-005 | P2 | Verify that user cannot set a quantity below 1 with the stepper | boundary |
| CHK-001 | P0 | Verify that user can place an order as a guest with valid details, sees a confirmation with the order number, items and total, and finds the cart empty afterwards | happy path and secondary effect |
| CHK-002 | P0 | Verify that user cannot place a guest order while any required field is empty or invalid, and is shown which fields to fix | decision table collapsed by remedy |
| CHK-003 | P1 | Verify that placing the order twice in quick succession creates only one order | *Time* |
| CHK-004 | P1 | Verify that an order placed by a guest appears in the admin Orders list with the same items and total | *Interfaces*, second actor |
| CHK-005 | P2 | Verify that user can check out with an address containing non-Latin characters, and it appears unchanged on the confirmation | *Data* |
| CHK-006 | P3 | Verify that the checkout summary shows shipping as its own line, separate from the subtotal | UI that is the behaviour |

The distribution is **3 P0 · 5 P1 · 2 P2 · 1 P3**. That is an outcome, not a quota. The P0 share is
under a third. Drop any one case and a risk from the sparse list comes back.

Look at the derivation column: **six of the eleven cases come from techniques that an intuition-first
pass routinely misses.** They are the boundary table (CART-002), both timing cases (CART-003, CHK-003),
the second-actor check (CHK-004), the data case (CHK-005) and the remedy-based collapse (CHK-002). That
is the argument for modelling first.

Open questions recorded instead of written as cases: *Is there a maximum quantity per line?* *Does the
cart survive a reload or a new session?* Each has the case it will become once it is answered.

### Bloated: 25 cases (the same risks plus 14 new maintenance burdens)

This plan keeps the 11 above and adds 14 noise cases:

| ID | Noise case | Why it's noise |
|---|---|---|
| N1 | Verify that the checkout page heading is displayed | UI mechanics, implicit in CHK-001 |
| N2 | Verify that the Place order button label is spelled correctly | Copy assertion |
| N3 | Verify that the + and − stepper icons are visible | UI mechanics |
| N4 | Verify that the shipping charge is shown in bold | Cosmetic |
| N5 | Verify that the error text is red | Cosmetic |
| N6 | Verify that quantity 2 gives the correct subtotal | Same class as CART-001 |
| N7 | Verify that quantity 3 gives the correct subtotal | Same class |
| N8 | Verify that a ₹500 cart is charged shipping | Middle of the class, not the edge (CART-002) |
| N9 | Verify that a ₹700 cart is charged shipping | Same |
| N10–N15 | Verify that each of the six fields, left empty, blocks the order (six cases) | Same remedy: CHK-002 names every class in its Expected |

**Cost:** 14 extra tests to maintain through every redesign, copy change and locale change. **Zero new
bugs caught.** And the P0/P1 signal is diluted: a reviewer scanning 25 titles takes longer to work out
what is actually critical.

There are three recurring shapes of noise: **UI mechanics** (N1, N3), **cosmetics and copy** (N2, N4,
N5), and **equivalence-class repetition** (N6–N15). The bloat attack catches all three, because none of
them can answer "which risk is uncovered if I delete this?"

### Verdict

> The right number of cases is the **smallest set such that removing any single case uncovers a
> business risk.**

For this brief, that number is 11.

## Example 2: a small change, 4 cases

Most briefs are small: one surface, three to five decided goals. Calibrated against the example above,
they come out too high. This example shows the same discipline at the right size.

**The brief (illustrative).** On the product page, the quantity stepper starts at 1 and cannot go below
1. "Add to cart" adds the chosen quantity. Adding a product that is already in the cart increases that
line's quantity instead of creating a second line. One product question is still open: **is there a
maximum quantity?** There are four decided behaviours.

**The plan: 4 cases, all of which a tester can perform.**

| ID | Pri | Case | Guards |
|---|---|---|---|
| PDP-001 | P0 | Verify that user can add a product to the cart with the quantity chosen on the product page | chosen quantity reaches the cart |
| PDP-002 | P1 | Verify that the quantity stepper starts at 1 and cannot be lowered below 1 | lower bound |
| PDP-003 | P1 | Verify that adding a product already in the cart increases that line's quantity instead of adding a second line | merge rule |
| PDP-004 | P2 | Verify that the cart subtotal reflects a quantity added from the product page, including across the ₹999 shipping threshold | cross case with the cart |

**What a first pass produced, and what removed each cut case (9 → 4):**

| Cut case | Gate | Where it went |
|---|---|---|
| Stepper minus button is disabled at 1 | UI mechanics with the same risk as PDP-002 | Folded into PDP-002's Expected |
| Quantities 2, 5 and 10 each add correctly | Same equivalence class | One value inside PDP-001 |
| Adding 999 units is rejected | Undecided by the brief | Open question, with the case it becomes |
| Stepper keeps its value when the add request fails | Not tester-reachable (needs a forced server error) | Ledger: `deferred: not tester-reachable: mocked route in the automated test` |
| Adding without touching the stepper adds 1 | Continuity of existing behaviour, already an existing cart case | The report names the existing case for the regression run |

**Verdict.** Four is the number for this brief. Remove any one and a decided behaviour loses its guard.
Add back any of the cut cases and you get one of three things: a case nobody can run, a case that
asserts an answer Product hasn't given, or a duplicate. The deferred risks are still risks. They
belong to the automation work, with the fixture that reaches them named.
