# Step 7: map to automation

Read at Step 7. This step records how each case becomes a test. It never deletes a case from the plan.

## One case, one test

Every case becomes exactly one automated test. The test's title is the case's title, prefixed with the
case ID. Rotated shared-mechanism cases stay **one test per surface**. Don't merge them into one test
that loops over surfaces, even though they share fixtures: the point of rotating is that a failure
names one component.

## What may be merged *inside* one test

Merge variants within one case when they share fixtures, setup and teardown, and differ **only by input
data**:

- a parameterised happy path (several products, one test body)
- boundary values asserted in one explicit table (₹998 / ₹999 / ₹1,000)
- a lifecycle: one test that walks the transitions, plus one that covers illegal transitions from a
  table
- a pairwise array, used as a data fixture
- workflow composition: set up the earlier steps through the API or seeded data, and drive only the new
  step through the UI
- a subsumed case folded into its host test (below)

**Never merge:**

- a **P0 with anything else**. A P0 must fail loudly on its own, and two P0s never merge. A
  lower-priority case *may* fold into a P0 host.
- across different entities or actors (guest and admin), or across services.
- positive and negative inputs in one **looped parameter list**, because it hides which kind failed.
  A boundary table that asserts each value explicitly is fine, because nothing in it is hidden.

## Fold subsumed cases into their host test

A case whose path a bigger case already walks gets **no separate test**. Assert it where the host test
passes it. The plan still lists both cases: folding is an automation decision only. *Example:* "the
checkout summary shows shipping as its own line" can be asserted inside the guest-checkout happy path,
at the point where that test reaches the summary. That gives one test and two cases.

Fold only when **all five gates** hold:

- **No detours.** The host already walks the path. If you have to add steps to reach the folded case,
  it doesn't qualify.
- **Positive into positive.** Never fold a negative or error case into a happy path.
- **Same moment, same surface.** The outcome can be observed *at the point the host already reaches*.
- **Never fold a P0 into anything**, whatever the host's priority.
- **Lower or equal priority into the host, never higher.** That way the host's tag is always the
  highest priority among the cases it covers.

Assert **in place and in order**, so that a failure points at the step that broke rather than at the
end of the test.

**Record what the test covers** in a comment directly above the test: the case ID and title, one per
line, and nothing else.

```ts
test.describe('Checkout', { tag: '@checkout' }, () => {
  // Also covers:
  // CHK-006 Verify that the checkout summary shows shipping as its own line, separate from the subtotal
  test('CHK-001 Verify that user can place an order as a guest with valid details', { tag: '@P0' }, async ({ page }) => {
    // ...
  });
});
```

The folded test keeps the **host's** priority tag. In the plan, every folded case is also marked
`Automated` once the host test lands. The comment is the link back to the test that covers it.

## Deferred risks belong to automation

A risk the plan deferred as `not tester-reachable` (a failed network request, a server error, a slow
response) is often easy to reach in automation, for example with `page.route()` to mock or fail a
request. Name the case in the automation map so that the automation work picks it up deliberately.
