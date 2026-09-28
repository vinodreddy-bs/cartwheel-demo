---
name: tc-design
description: "Generate an optimal, minimal set of manual test cases that cover every business risk in a feature spec, organized by risk and priority."
keywords: [design test cases, write test cases, test case design, generate test cases, test coverage plan, create test scenarios]
---
# Manual test case rules

## Goal
Write the **smallest set of manual test cases that still guards every business risk** of the feature.
Every case will become an automated regression test that runs on every build, so each one must earn
its place. Optimal, not minimal: dropping a case that guards a real risk is wrong.

## Sources
- Use every source given: spec/PRD, user stories, acceptance criteria, designs, existing cases. Where
  they disagree, record an open question; don't pick a side.
- Expected results come from the spec (what *should* happen), never from the implementation or a guess.
- If the spec is silent or undecided, write an **open question** (with the case you'd write once it's
  answered), not a case. Never invent a field, control, message or value the spec doesn't describe.
- If cases already exist for the feature, extend them; never duplicate them.

## Deriving cases
First list the business risks: what can go wrong for the user or the business. A risk becomes a case
only when the spec decides the behaviour **and** a tester can reach the state. Otherwise record it as an
open question, or as "deferred: not tester-reachable" with what would reach it (e.g. a mocked error in
automation).
- **Equivalence classes:** one value per class, not one case per value.
- **Boundaries:** the edge and just outside it (₹998 and ₹999 for a ₹999 threshold), asserted as an
  explicit table inside one case.
- **Rules:** one case per distinct outcome. Two rejections are separate cases only if the user's fix
  differs (empty, malformed and too-short fields = one case; "out of stock" = another).
- **Lifecycles:** each valid transition once, plus one case per class of illegal transition.
- **Same mechanism on several screens:** one case per screen, rotating the variant so every variant
  appears at least once. Never a screen × variant grid.
- **Split** only what can't happen in one run: different actors (shopper vs admin), mutually exclusive
  states, separate operations. Several checks reachable in one run belong in one case.

## Not a case
  A UI check is its own case only when it *is* the behaviour: a button disabled by a business rule, a
  status that changes, a message that tells the user what to do next.
- **No subject:** asserting that an absent feature is absent, a precondition nobody can create, "done
  via config", or the problem statement restated.
- **Security, performance and accessibility audits,** unless the spec mandates them. A mandated
  (compliance or legal) requirement is always its own case.

## Priority = business impact × likelihood of failure
- **P0 Critical:** release-blocking; the smoke set. Each component's main journey, money and order
  correctness, and recovery from failures that always happen (session expiry, a resumed cart).
  **At most a third of the cases.**
- **P1 High:** core behaviour whose failure hurts revenue or trust.
- **P2 Medium:** has a workaround, or needs a rarer combination.
- **P3 Low:** minor or cosmetic.
"An error message is shown" is not P0; "user is blocked from proceeding" is.

## Check the set twice
- **Gaps:** for every goal and every decided behaviour in the spec, name the case that guards it.
- **Bloat:** for each case ask "if I delete it, which risk is left uncovered?" None means delete it.
  Also delete a case that would pass while the feature is broken, or fail while it works.
- **Budget:** at most one case per decided behaviour, plus any case that alone guards a named risk.

## Case format
- **ID:** `<AREA>-<NNN>` (e.g. `CART-003`), stable, never renumbered.
- **Title:** "Verify that user …" (the user acts) or "Verify that <subject> …" (the system acts). Plain
  words, the user's intent, an unambiguous outcome. No jargon or machinery, and no "on click" or
  "on submit".
- **Priority:** P0–P3.
- **Preconditions:** the starting state and how a tester creates it (seeded data, an API call, a second
  browser, an admin action).
- **Steps:** numbered, at the level of intent ("Add two units of any in-stock product"), naming the data
  used. Not click-by-click.
- **Expected:** observable and unambiguous, with exact values. Quote UI copy only where it matters.
- **Oracle:** the spec section or acceptance criterion that says so. If it's only an assumption about
  what users want, say so and raise an open question.
- **Automation:** Not automated.

Example:
**CART-002 · Verify that user is charged ₹99 shipping when the cart subtotal is below ₹999, and no
shipping at ₹999 or above**
Priority: P1 · Automation: Not automated
Preconditions: an empty cart; products whose prices can make the subtotals below
Steps: 1. Build a cart with a subtotal of ₹998. 2. Change it to ₹999. 3. Change it to ₹1,000.
Expected: ₹998 → shipping ₹99, total ₹1,097 · ₹999 → shipping free, total ₹999 · ₹1,000 → shipping
free, total ₹1,000
Oracle: spec, "Shipping" rule

## Output
The cases (P0 first), then the open questions, then the deferred risks, then one line with the count
by priority.