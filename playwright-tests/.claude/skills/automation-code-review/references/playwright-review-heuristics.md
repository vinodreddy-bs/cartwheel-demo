# Playwright + TypeScript review heuristics

Each section lists what to look for, why it matters, and what a fix looks like. The examples use the
Cartwheel storefront.

## Contents

1. [Locators](#1-locators)
2. [Assertions](#2-assertions)
3. [Waiting and timing](#3-waiting-and-timing)
4. [Isolation and test data](#4-isolation-and-test-data)
5. [Page objects and fixtures](#5-page-objects-and-fixtures)
6. [Flake risks](#6-flake-risks)
7. [Naming, tags and structure](#7-naming-tags-and-structure)
8. [Traceability to manual cases](#8-traceability-to-manual-cases)
9. [Config, secrets and failure evidence](#9-config-secrets-and-failure-evidence)
10. [Simplicity](#10-simplicity)

---

## 1. Locators

**Priority order:** `getByRole` with an accessible name → `getByLabel` → `getByPlaceholder` /
`getByText` → `getByTestId` → CSS as a last resort, with a comment saying why. **Don't use XPath.** If
the repo has chosen to lead with test IDs, then test IDs count as first-class. Flag inconsistency with
that choice, not the choice itself.

```ts
// Brittle: tied to layout and styling
await page.locator('div.checkout > form > div:nth-child(3) input').fill(email);

// Resilient: what the user perceives
await page.getByLabel('Email').fill(email);
await page.getByRole('button', { name: /place order/i }).click();
```

- **Scope repeated elements to their container** instead of indexing:

  ```ts
  // Which line is .nth(1)? It changes when the sort order does.
  await page.getByRole('button', { name: '+' }).nth(1).click();

  // Scope to the cart line for the product under test
  const line = page.getByRole('row').filter({ hasText: productName });
  await line.getByRole('button', { name: /increase quantity/i }).click();
  ```

- **`.first()` or `.nth()` needs a reason.** If a locator matches several elements, fix the locator
  (scope it, filter it, or use `exact: true`). Don't silence Playwright's strict-mode error. The
  exception is when the page genuinely renders the same element twice (for example, a mobile and a
  desktop copy of the same control). In that case a short comment should say so.
- **Regex-escape runtime strings** before building a pattern from them. A product called
  `Mug (large)` breaks `new RegExp(name)`. Prefer `{ name, exact: true }` when an exact match is what
  you want.
- **Case-insensitive regex names** (`/place order/i`) tolerate small copy changes. Use `exact: true`,
  or an anchored `/^Add to cart$/`, only where a looser match would be ambiguous.
- **Establish the context before the locator.** If the target sits inside an iframe (such as an
  embedded third-party widget), the chain needs `frameLocator()`. Playwright's role and CSS locators
  pierce open shadow roots, but XPath doesn't. A main-document locator for an element that is really
  inside a frame will never match.
- **Menus and dialogs don't share one accessible name.** Check the real name on the page. Don't
  "correct" a locator to a spelling you expect.

## 2. Assertions

- **Use web-first assertions, always awaited.** They retry until the condition holds or the timeout
  passes.

  ```ts
  // Samples once and races the UI. A false red, or a false green
  expect(await page.getByText('Order placed').isVisible()).toBe(true);

  // Retries until visible or timed out
  await expect(page.getByRole('heading', { name: /order placed/i })).toBeVisible();
  ```

  A missing `await` on `expect(locator)…` is a **High** finding: the assertion never runs before the
  test ends.
- **Assert the outcome, not just that the action ran.** A test that clicks "Add to cart" and checks
  only that no error appeared proves nothing. Assert that the cart line exists with the right quantity
  and subtotal.
- **Assert the whole Expected of the case.** If the case says "at ₹998, shipping is ₹99 and the total
  is ₹1,097", the test checks both values, not only the shipping.
- **Prefer exact values for money and counts.** Use `toHaveText('₹1,097')` or a parsed number compared
  with `toBe`. A loose `toContainText('₹')` passes on any price.
- **Use a matcher that fits the question:** `toHaveCount`, `toHaveValue`, `toHaveURL`, `toBeDisabled`,
  `toHaveAttribute`. These are better than reading a property and comparing it by hand.
- **Soft assertions** (`expect.soft`) are for independent checks at one point in the flow. They must not
  be used to keep going after the precondition for later steps has already failed.
- **Assert what the user sees.** Some components render a wrapper element with no size. If a dialog's
  container reports itself as hidden while it is on screen, assert on something meaningful inside it
  (its heading), not on the wrapper.
- **Tighten the addressing, never relax the check.** If a check is flaky because it finds its target by
  ambiguous text, fix how it finds the target. Don't weaken or remove the check.
- **Snapshot and visual assertions** need a stable, masked region and a reason. They are not a
  substitute for asserting behaviour.

## 3. Waiting and timing

- **No fixed waits.** `page.waitForTimeout()`, `setTimeout` and `sleep` are **High** findings in test
  code. Wait for a condition instead: a web-first assertion, `locator.waitFor()`, `page.waitForURL()`,
  or `page.waitForResponse()`.

  ```ts
  await page.getByRole('button', { name: /apply filters/i }).click();
  await page.waitForTimeout(2000); // hope the grid has reloaded

  await page.getByRole('button', { name: /apply filters/i }).click();
  await expect(page.getByTestId('product-card')).toHaveCount(expectedCount);
  ```

- **Have one readiness gate per surface.** Wait on the single, deepest signal that the page can be used.
  A second or third `waitFor` stacked in one method usually means the first was the wrong signal. Find
  the right one and replace the others.
- **Wait for the navigation you caused.** After an action that changes the route, assert the
  destination (`await expect(page).toHaveURL(/\/order\/\w+/)`) before acting on the new page.
- **Don't lower timeouts to make a slow test "fail fast", and don't raise the global timeout to hide a
  slow one.** If one flow is genuinely slow, give that assertion or test its own timeout, with a comment
  saying why.
- **`.catch(() => {})` on a wait** is acceptable only for a genuinely optional element (a cookie banner
  that may or may not appear). Anywhere else it turns a real failure into a later, confusing one.
- **Retries on external steps** (a flaky third-party call during setup) belong in one clearly named
  helper with bounded attempts. They never go around an assertion about the product itself.

## 4. Isolation and test data

- **Each test creates what it needs.** No test may rely on another test having run first, on test
  order, or on data left behind. `test.describe.serial` needs a strong reason. Prefer independent tests
  that each set up their own state.
- **Set up state through the API or seeded data, and drive only the behaviour under test through the
  UI.** A checkout test should arrive with a cart already built, not by clicking through the grid every
  time, unless the grid is what the test is about.
- **Unique, recognisable names:** build them from a prefix plus a unique suffix (for example
  `test-${testInfo.workerIndex}-${Date.now()}`), so that parallel workers never collide.
- **Clean up by exact identifier, not by shared prefix.** An `afterAll` that deletes "every product
  whose name starts with `test-`" deletes a parallel worker's in-flight data. Record the IDs you created
  and delete exactly those.
- **Cleanup is best effort and must not fail a passing test.** Log a warning and continue.
- **Only delete through the UI when deleting is the behaviour under test.** Otherwise use the API.
- **Reset shared state deliberately.** If a spec must change something global (an admin setting),
  restore it in `afterEach`, and make sure no parallel test depends on it.
- **Authenticate once.** Sign in through a setup project and reuse `storageState`. Sign in through the
  UI only in the test that is *about* signing in. Guest and admin tests use separate storage states or
  browser contexts, never one account switched mid-test.
- **Hard-coded IDs** (`/admin/orders/1042`) are only acceptable for data the test seeded itself.

## 5. Page objects and fixtures

- **Keep page objects thin.** They hold locators and user-level interactions (`addToCart(qty)`,
  `fillGuestDetails(details)`). Business flows spanning several pages, and assertions about business
  outcomes, belong in the spec. A readiness wait inside a page-object method is fine. An `expect` on
  the order total is not.
- **Declare static locators once**, as `readonly` fields set in the constructor. Write runtime-dependent
  locators as small methods that *return* a `Locator` and don't click:

  ```ts
  export class CartPage {
    readonly subtotal: Locator;
    readonly shipping: Locator;

    constructor(private readonly page: Page) {
      this.subtotal = page.getByTestId('cart-subtotal');
      this.shipping = page.getByTestId('cart-shipping');
    }

    /** The cart line for one product. */
    line(productName: string): Locator {
      return this.page.getByRole('row').filter({ hasText: productName });
    }
  }
  ```

- **No raw `page.locator()` in specs** when a page object exists for that surface. Add the locator to
  the page object.
- **Don't create a separate locator registry.** Locators live on the page object for their surface.
- **Provide page objects through fixtures** (`test.extend`), so that specs destructure them rather than
  constructing them by hand in every test.
- **A method that can leave the UI half-open on failure** (a modal, a drawer) should clean up in
  `finally`, or every later step in the test fails for the wrong reason.
- **Document the public methods** with short JSDoc comments. Inline comments are only for a
  non-obvious *why*.

## 6. Flake risks

- **Popups and new tabs:** start waiting *before* the action that opens them.

  ```ts
  const popupPromise = page.waitForEvent('popup');
  await page.getByRole('link', { name: /size guide/i }).click();
  const popup = await popupPromise;
  ```

  If you grab "the first open page" afterwards, you may pick up a stale page from an earlier step.
- **Responses:** likewise, register `page.waitForResponse()` before the click that triggers it.
- **Lists that re-render:** asserting on `.nth(i)` while a filter is still applying races the render.
  Assert the final count or the final content.
- **Animations and debounced inputs** (search-as-you-type, a quantity stepper that commits after a
  pause): wait on the resulting state, not on time. Use `pressSequentially` only when the app
  genuinely reacts per keystroke. Otherwise `fill` is correct.
- **Shared mutable state across workers:** a global admin setting, one shared cart, one fixed account
  used by tests that change it. Any of these makes results depend on scheduling.
- **Time and locale:** formatting of dates and currency (`₹1,097` compared with `₹1097`) differs by
  locale. Pin the locale in config, or compare parsed values.
- **`test.skip` or `test.fixme` without a reason and a pointer** hides a regression permanently.
  Require a one-line reason.

## 7. Naming, tags and structure

- **One behaviour per test.** A test called "checkout works" that also edits the cart and checks admin
  is three tests. Several assertions about *one* behaviour, reached in one run, are fine.
- **The title is the case title**, prefixed with the case ID:
  `test('CHK-002 Verify that user cannot place a guest order while any required field is empty or invalid', …)`.
- **Tags:** the feature tag goes on the outer `describe` and the priority tag (`@P0`–`@P3`) on each
  test. Flag a **new**, ad-hoc categorisation tag. Don't ask for existing tags outside the diff to be
  removed, because they may be run selectors someone depends on.
- **Parameterise by data, not by copying tests.** Several near-identical tests that differ only in input
  should become one loop over a typed data table, with one `test()` per row and the row in the title, so
  that a failure names the value. Don't mix positive and negative rows in one looped list.
- **Don't special-case a shared runner or fixture** to make one test pass. Change the test or its data.
- **Leftovers:** `test.only`, `console.log`, commented-out code, and unused imports or fixtures.

## 8. Traceability to manual cases

- Every test names the case ID it automates. A test with no case is either missing a case (raise it) or
  not worth running on every build.
- A test that covers several cases lists the extra ones in an `// Also covers:` comment directly above
  it, with an ID and title per line. The host's priority tag must be the highest among them, and a
  **P0 case is never folded** into another test.
- The test asserts the case's full Expected (see Assertions), uses its preconditions, and carries its
  priority.
- If the change marks a case as automated in the case file, check that the test really exists and
  covers it.

## 9. Config, secrets and failure evidence

- **No credentials in code.** Admin passwords, API tokens and personal data come from environment
  variables or an untracked local file. Flag any literal that looks like a secret, including one in a
  fixture or a recorded storage state that has been committed.
- **Base URL and environment come from config** (`use.baseURL`), never hard-coded in specs.
- **Failure evidence is on:** `trace: 'on-first-retry'` (or `retain-on-failure`), `screenshot: 'only-on-failure'`,
  and video where useful. A test that fails with no evidence costs a re-run to diagnose.
- **Retries in config** are a safety net, not a fix. A test that only passes on retry is a flake to
  investigate, and a review should not approve a retry count added to silence one.

## 10. Simplicity

- **Match the size and shape of the surrounding code.** This is a test suite, not a framework. Runtime
  discovery loops, option bags, generic wrappers around Playwright's own API, and base classes with a
  single subclass are almost always the wrong answer. Plain Playwright wins.
- **Comments explain *why*.** An example is a quirk of the app that a reader would otherwise "fix".
  Don't narrate what the code does, and don't add section banners.
