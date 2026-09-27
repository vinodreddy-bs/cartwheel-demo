# Titles, splitting, and the subject test

Read at Step 3, before writing the first title. It covers how to phrase a title, when one behaviour is
one case or several, and the checks a case must pass before it is written.

## Titles: user intent, readable, unambiguous

**Every case opens with `Verify that …`.** There are two shapes, chosen by who acts:

| The actor is | Opening | Example |
|---|---|---|
| **The user** | `Verify that user …` | `Verify that user can add a product to the cart with a chosen quantity` |
| **The system**: the thing under test acts and the user observes | `Verify that <subject> …` | `Verify that shipping is recalculated when the cart subtotal crosses ₹999` |

Use a more specific actor (`admin`, `guest`) only where the role is part of what is being verified.
**Don't drop the "that"** (`Verify user …`). A plan that mixes the two forms is harder to search and
reads as if two people wrote it. Don't force a system-subject case into the user form either:
"Verify user's shipping is recalculated" puts a possessive where the subject belongs.

Beyond the opening, three rules apply. The title states the **intent** (what is achieved, in the
product's terms), it **reads clearly**, and it is **not ambiguous**: a reader knows from the title
alone which outcome is required.

### Write it the way you would say it out loud

**Read every title aloud. If you wouldn't say it to the person who reported the bug, rewrite it.** A
title usually fails in one of these three ways:

| Shape | Instead of | Write |
|---|---|---|
| **Naming the machinery** the user never sees | `Verify that the shipping-rule engine evaluates the threshold predicate on cart mutation` | `Verify that shipping is recalculated when user changes a quantity in the cart` |
| **Comparative negatives**, which make the reader hold two states at once | `Verify that the confirmation shows no less of the order than the checkout summary already does` | `Verify that the order confirmation lists every item, the shipping charge and the total` |
| **Spec or implementation jargon**, such as `hydrate`, `persist`, `payload`, a prop name | `Verify that the cart state persists after rehydration` | `Verify that user's cart still holds its items after the page is reloaded` |

Use plain verbs for what the user does: **add**, **choose**, **type**, **remove**, **filter**, **place
an order**, **sign in**. A jargon term is acceptable only when it is the product's own UI label.

This doesn't mean shorter. A long title in plain words beats a short one in jargon, and there is no word
limit. The one thing to avoid is **ambiguity about the required outcome**: "lands on the cart or the
confirmation page" leaves the tester guessing which one passes.

### Don't name the moment of execution

"… **on submit**", "… **when the button is clicked**", "… **after the API returns**" narrow the case to
one mechanism and invite the wrong implementation of the test. State the behaviour and its outcome:

| Don't | Do |
|---|---|
| `…shows an error on blur of the email field` | `…is told which field is invalid before the order can be placed` |
| `…updates the total on click of +` | `…sees the subtotal follow the chosen quantity` |

**The exception is when the moment *is* the subject.** If the brief decides that validation happens
as the user types rather than at submit, that timing is what the case checks. The test: would the case
mean the same thing with the phrase deleted? If yes, delete it.

**Steps stay at the level of intent too.** "Add two units of any in-stock product to the cart" is a
step. "Click the + button, then click Add to cart, then click the cart icon" is a script written in
prose. A good title with gesture-level steps is still brittle.

**A UI check that *is* the behaviour** is a legitimate case: a disabled state tied to a business rule, a
status label that changes, copy that directs the user's next action, or an indicator that changes what
they do. Everything else is folded into a business case's Expected.

## One case or several: the split rules

**Several assertions in one case are fine.** There is no one-assertion-per-case rule. The question is
never *how many assertions*, but **can they all be reached in a single run?**

**Split when they can't be reached in one run:**

| Trigger | Why | Result |
|---|---|---|
| **Two actors or accounts** | A guest session and an admin session are separate contexts with separate setup | One case per actor. Cross-actor effects (an order appearing in admin) get their own case. |
| **Mutually exclusive states** | A cart cannot be both below and above the threshold in the same moment | One case per state, unless a boundary table walks them in one explicit sequence |
| **Separate operations** | Removing a line and placing an order each need their own precondition and expected result | One case per operation |
| **Per-context variants, only when the brief decides a context-specific behaviour** | The same stepper on the product page and in the cart is one mechanism | One case, or one case per context the brief singles out, citing it |

**Combine only where combining is correct.** Two assertions about the same operation that can be reached
in one run belong together. **Never merge just to reduce the count.** If you could not tell from a
failure which behaviour broke, the merge cost more than it saved.

## Before you write a case: does it have a subject?

There are four ways a case can look reasonable and still leave a tester nothing to test:

1. **Nothing exists to put under test.** "Verify that there is no option to pay in instalments."
   If nothing actively rejects it and it is simply absent, the case passes trivially and forever. **A
   non-goal is not automatically a case, so ask what enforces it.** If something does reject it, that
   rejection is the real case.
2. **The subject can't be brought into existence.** "Verify that a newly created admin role defaults to
   read-only" is not a case if no one can create a role. Rewrite it against something that can exist,
   or drop it.
3. **The brief hasn't decided it.** Scan the brief's open questions *and* the hedges in its prose ("to
   be confirmed", "intended behaviour is …"). **Write no case.** Record an open question, together with
   the case you will write once it is answered. A draft case that asserts one direction now may be
   asserting the wrong one.
4. **No tester can reach the precondition.** A second browser session or an admin edit is a route.
   Forcing the server to fail is not. With no tester route, record `deferred: not tester-reachable` and
   name what would reach it. *Unconfirmed* reachability is different: that stays a case, marked
   `pending: reachability unconfirmed`.

The fifth is the most expensive: **never invent a control.** Don't write a case around a field, menu,
toggle or setting that the brief doesn't describe. If you need it, raise an open question.

**Being in the brief doesn't give a case a subject, not even as an acceptance criterion.** Three
recurring shapes have none:

| Shape | Why it has no subject |
|---|---|
| **Delivery mechanism**: "via config, not code", "without a redeploy" | It describes how the change *arrives*. The user-visible result is the behaviour case. |
| **Restated problem statement** | The motivation is not testable. The goals are. |
| **A race with no point where the user reads the result**: "settles correctly when toggled repeatedly" | If the user only reads the value at one later moment, the in-between states are never seen. |

For each one, ask: **if this case fails but the feature works, would anyone roll back the release?**
