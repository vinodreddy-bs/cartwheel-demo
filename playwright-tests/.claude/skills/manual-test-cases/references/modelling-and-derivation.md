# Model, risks and derivation

Read at Step 1 and keep open through Step 3. The model and the risk ledger are written out: both are
part of the deliverable.

## Why derive rather than recall

Cases written from intuition, with a checklist ticked afterwards, give plans that are both **bloated**
(near-duplicates) and **sparse** (whole classes of risk missing) at once. Four forcing functions prevent
that. Apply them in order:

| # | Forcing function | Why it changes the result |
|---|---|---|
| 1 | **Model the feature before writing any case** | The derivation rules operate on model slots. With no model you get recall, not derivation. |
| 2 | **Bind every case to a risk ID** | This makes "removing any case uncovers a risk" something you can check mechanically rather than an aspiration. |
| 3 | **Name the oracle behind every Expected** | An Expected with no source is a guess. Unsourced expected values are the most common defect in generated plans. |
| 4 | **Attack the plan twice** | One pass finds what slips through and the other finds noise. Re-reading a checklist finds neither. |

## Step 1: model the feature

Fill in every slot.

| Slot | Capture | Feeds |
|---|---|---|
| **Actors** | Roles whose behaviour differs: guest shopper, admin, signed-out visitor | classes, splits |
| **Entities and lifecycles** | Entity → states → legal transitions. For example, cart: empty → has items → checked out | lifecycle walk |
| **Inputs** | Field → equivalence classes → boundaries | classes, edges |
| **Rules** | Conditions → outcomes, as a decision table | decision-table collapse |
| **Independent variables** | Only when there are four or more: the variables and their values | pairwise |
| **Integrations** | Upstream and downstream: the API behind the storefront, the admin screens that read the same orders | *Interfaces* |
| **Timing** | Async gaps, expiry, concurrency, retries, double submits | *Time* |
| **Controllability** | For each state a case needs, **how do you actually get there?** Seeded data, an API call, an admin action, a second browser session | preconditions |

Every slot ends in one of **three** states: filled, genuinely none (say so), or **unknown, recorded
as an open question**. A slot left silently empty is a finding.

**Controllability is not optional.** A plan can have perfect procedure and still be impossible to run.
If a P0 case needs a state, say how a tester creates it. Two different questions get two different
answers:

- **A tester route exists** (confirmed or plausible), such as seeding a product through the admin,
  using a second browser session, or setting the cart through the API. Write the case, and mark any
  unconfirmed route `pending: reachability unconfirmed`. **Don't guess a confirmation.**
- **No tester route exists.** The state needs the network cut, a server error forced, a clock moved or
  a database flag flipped. Then it is **not a manual case.** The risk stays in the ledger as
  `deferred: not tester-reachable: <what would reach it>`, for example a mocked route in the automated
  test. The automation work owns it from there.

### The seven-dimension walk

Every risk the walk surfaces goes into the ledger. **A risk becomes a case only when the brief decided
the behaviour and a tester can reach the state.** Otherwise it becomes a written deferral, and
deferral is the default, not the fallback. The walk makes sure no risk goes unnamed. It is not a
licence to write a case per dimension.

| Dimension | Ask, for a storefront feature |
|---|---|
| **Structure** | Which surfaces does it touch: product grid, product page, cart, checkout, confirmation, admin? |
| **Function** | What happens on success, and what *secondary* effect follows? For an order: the cart empties and the order appears in admin Orders. |
| **Data** | Product names and addresses: long, non-Latin, empty, special characters. Prices at the edges of a rule. |
| **Interfaces** | The storefront API, and the admin screens reading the same data. |
| **Platform** | Browsers, and narrow (mobile) versus wide viewports. |
| **Operations** | How shoppers really behave: reloading mid-checkout, pressing back, two tabs open on the cart. |
| **Time** | Session expiry mid-checkout, a price edited in admin while the product sits in a cart, double-clicking "Place order". |

**Security is not one of the seven.** They are product elements, not quality criteria. That a guest
cannot open the admin is an actor rule and can be a case. Anything about credentials, tokens or
injection belongs in a security review, not in this plan.

## Step 2: name the risks

Before writing any case, list what can go wrong *for the user or the business*, and give each risk an
ID.

| ID | Risk | Impact | Likelihood |
|---|---|---|---|
| R-1 | Shipping is charged on a cart that has reached the free-shipping threshold | High | Med |
| R-2 | A guest order is accepted with an invalid email, so the confirmation never reaches the shopper | High | Med |

Priority (Step 5) comes from impact × likelihood. Every case cites the risk IDs it guards. Every risk is
cited by at least one case or explicitly deferred with a reason.

## Write expectations as specifications, not observations

When the feature has not been built yet, several things change:

| | Before the build exists |
|---|---|
| **Exact UI copy** | You can't have it. State what the copy must **convey** and mark it `pending live UI verification`. |
| **Enable and disable rules** | Take them from the brief's intent, marked pending. |
| **Reachability** | Say what state the case needs. Whether the route works is confirmed at automation. |
| **Oracles** | *Claims* (the brief) dominates. *Verified automation* is not available, so don't claim it. |

**Never write a case as though you already know what the app does.** A plausible guess is the most
expensive thing you can produce, because it reads as settled and survives review.

---

## Derivation: six rules

Apply each rule to its model slot. Don't cite rule numbers inside the cases.

- **Group inputs, and test one value per class.** Values that share a code path get one case per
  equivalence class, not one per value. Quantities 2, 3 and 7 are one class.
- **Test the edges, not the middle.** Test the boundary and just outside it. Shipping is ₹99 below
  ₹999, so check subtotals of **₹998** and **₹999**. Add ₹1,000 when a `<` written as `<=` could slip
  through. A boundary table asserting each value explicitly is one case, not three.
- **Collapse decision-table outcomes.** Write one case per surviving *outcome*, not per condition.
  **Granularity rule for rejections:** two rejection reasons are *different outcomes* only when they
  lead to a **different user remedy**. An empty email, a malformed email and a phone number with too
  few digits all have the same remedy (fix the highlighted field), so they are one case with the
  classes listed in its Expected. "This product is out of stock" has a different remedy (remove it or
  wait), so it is a separate case.
- **Walk a lifecycle once.** Write one case per valid transition, plus one negative case per *class* of
  illegal transition. Don't write one per (from × to) cell.
- **Use pairwise only at four or more variables.** Cover every *pair* of values with a generated
  covering array. The manual plan carries **one** outcome case, and automation iterates the array as
  data. **"Independent" matters.** Variables that constrain each other (one only means something when
  another has a particular value) do not count towards the four. If the spec doesn't list the values,
  that is an open question. Mark any placeholder values as assumed.
- **Do the seven-dimension walk** (above). Name every risk in the ledger, but write a case only where
  the brief decided the behaviour and a tester can reach the state.

## Extending a feature that already ships

**Write cases for the change, not for the whole field.** What the extended control already did is
covered by the case that already covers it, and that case re-running on every build is the backward
compatibility check. Don't write "the old way still works". In the report, **name the existing cases
that cover it**, so that re-running them is a decision rather than an assumption.

**A new kind of input value is data, not behaviour.** Suppose the product grid's price filter already has
cases, and it starts accepting a new range. That value belongs in the existing case's inputs, and the
deliverable is an automation change, not a new case. A new kind of value earns its own case **only when
it brings a behaviour**:

| It earns a case when it introduces | Because |
|---|---|
| a **new control** | a widget with its own behaviour can fail where a plain input cannot |
| a **new guard**: the value can be rejected in a way no existing case reaches | the rejection is a user-visible outcome |
| a **new user remedy** | the remedy is the behaviour |

Ask it plainly: *does this change what the user can do, or only what they can type?* Only the first is a
case.

## Shared mechanisms on sibling surfaces: rotate, never multiply

The biggest source of bloat is one mechanism (a validation rule, a disabled-state guard, a "clear"
control) landing on several sibling surfaces, with the plan writing a **surface × variant** grid. The
rule that replaces the grid:

- **One case per surface, per shared mechanism.** Each surface is exercised once, in its own case
  titled after that surface.
- **Rotate the variant across the surfaces**, so that **every variant appears at least once and every
  surface exactly once.** *Example:* the six guest-checkout fields share "reject an invalid value".
  If the brief decides that each field shows its own message, one rotated case could exercise email with
  a malformed value, phone with too few digits and PIN code with letters, while the remaining fields are
  covered by the "required field left empty" variant. The Steps name the variant used.
- **Never iterate.** Don't write one case "for each of email, phone …" that a script loops over. A
  failure should name one component and one variant.
- **Never build the full product.** Importance changes the *priority* of a surface's one case, not the
  number of cases.

Write the **rotation table** into the notes, with surfaces down the side and variants across the top.
Check both totals: every variant column ≥ 1 and every surface row = 1. When a new surface arrives, it
gets one case using the least-covered variant. When a new variant arrives, it gets one case on the
surface it fits best.

Some behaviours stay outside the rotation and keep their own single case on one surface. Examples are a
genuinely distinct failure class, or an interaction that only exists across two surfaces (a cart change
that must show up on the checkout summary).

## Standing exclusions

A project may declare some surfaces out of scope for manual cases, for example a third-party page the
team does not own. Check that list before deriving. **An exclusion removes the case, never the risk.**
Keep the risk in the ledger as `deferred: excluded surface: <surface>`, and say in the report which
cases the exclusion removed, so that coverage can be written again if the exclusion is lifted.
