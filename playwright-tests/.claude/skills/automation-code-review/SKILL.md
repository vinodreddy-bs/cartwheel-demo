---
name: automation-code-review
description: >-
  Reviews Playwright + TypeScript UI test code (specs, page objects, fixtures, helpers, config) and
  returns findings with file:line, severity and a suggested fix, plus a pass/fail verdict. Use it when
  asked to review a pull request, diff, branch or file that adds or changes Playwright tests, before
  merging test automation, or when someone asks whether a test is flaky, brittle or well written. It
  checks locator strategy, web-first assertions, waits, test isolation and data reset, page-object
  design, flake risk, naming, one behaviour per test, and traceability to manual test case IDs.
---

# Automation code review (Playwright + TypeScript)

Review test code the way a senior automation engineer would. Ask whether the test will **catch the
regression it claims to guard**, **stay green when the product is healthy**, and **still be readable
to the next person** in a year's time.

## 1. Establish scope

- **Stay inside `playwright-tests/`.** Read and review only the test suite: specs, page objects,
  fixtures, helpers, data, config and the case files in `manual-cases/`. **Never open or search the
  application's code** (`client/`, `server/`, files at the repo root), even to check a locator or an
  expected value. When a finding depends on how the app behaves, check it against the case's Expected
  or the spec in `docs/`, and if neither settles it, raise it as a question.
- Review **what changed** in the suite, limited to the folder, never the whole repo. For a branch:
  `git diff <base>...HEAD -- playwright-tests/`. For a pull request: `git fetch origin pull/<n>/head`,
  then `git diff origin/<base>...FETCH_HEAD -- playwright-tests/`. Read enough of the surrounding
  suite code (the page objects, fixtures, helpers and `playwright.config.ts` it relies on) to judge the
  change in context. Don't review untouched files
  unless the change depends on them.
- If the user named files rather than a diff, review those files in full.
- Note the repo's existing conventions first: folder layout, fixture style, tag vocabulary, naming.
  **Findings are measured against those conventions and the heuristics below**, not against a
  framework you would prefer.

## 2. Read the cases the tests claim to cover

Every test should trace to a manual case ID (`CART-002`), in its title or in an `// Also covers:`
comment. Open the case file and check three things. Does the test assert the case's **Expected**
(all of it, not just the first line)? Does it use the case's **preconditions**? Does it carry the case's
**priority**? A test that passes while its case's Expected is unasserted is a High finding, because it
reports coverage that doesn't exist.

## 3. Walk the heuristics

**Read [references/playwright-review-heuristics.md](references/playwright-review-heuristics.md)**
and apply every section to the diff. It covers locators, assertions, waiting, isolation and data, page
objects and fixtures, flake risk, naming and structure, traceability, and config and secrets. The
review table below is the summary you fill in.

| Priority | Category | Check |
|---|---|---|
| High | Correctness | The test asserts the case's outcome, not merely that an action ran |
| High | Correctness | Assertions are web-first and awaited. No `expect(await x.isVisible())` |
| High | Stability | No fixed waits (`waitForTimeout`, `setTimeout`), and no timeouts lowered or raised to hide a problem |
| High | Isolation | Each test owns its data, doesn't depend on another test's order or leftovers, and is safe under parallel workers |
| High | Secrets | No credentials, tokens or personal data in code, fixtures or snapshots |
| Medium | Locators | Role, label or test ID first. CSS or XPath only with a reason. Scoped to a container, not `.nth()` guesswork |
| Medium | Structure | One behaviour per test. The title matches the case. The case ID and priority tag are present |
| Medium | Page objects | Thin: locators and interactions only. No assertions of business outcomes, no hidden waits, no business flow |
| Medium | Cleanup | Data the test creates is removed by its exact identifier, through the API. Cleanup cannot fail the test |
| Medium | Flake risk | No races on popups or navigation, no strict-mode ambiguity papered over with `.first()`, no shared mutable state |
| Low | Quality | Matches the existing code's shape and size. No speculative abstraction. Comments explain *why* |
| Low | Quality | Meaningful names, no dead code, no leftover `test.only` or `console.log` |

## 4. Verify before you report

- **Confirm every finding against the code.** Before you claim a helper doesn't wait, read the helper.
  Before you claim a locator is ambiguous, check how the page renders it. Before you anchor a finding to
  a line, make sure that line is in the diff.
- **One finding per root cause.** Ten specs that repeat the same `waitForTimeout` count as one finding
  listing ten locations, not ten findings.
- **Don't demand more framework.** Suggest the smallest change that fixes the problem, in the style the
  repo already uses.
- **Leave alone what the change didn't touch.** A pre-existing tag or pattern outside the diff is not
  this PR's finding. You may mention it once, as a note.
- When you have permission to run commands, cheap checks strengthen a finding. Run `npx tsc --noEmit`
  and `npx playwright test --list` to check that it compiles and to see the titles and tags, and
  `npx playwright test <file> --repeat-each=5` to probe a suspected flake. Say what you ran.

## 5. Rate severity

| Severity | Meaning |
|---|---|
| **Critical** | The test can't run, leaks a secret, or deletes or corrupts data it doesn't own |
| **High** | The test can pass while the behaviour is broken (a false green), or will flake under normal CI conditions |
| **Medium** | Brittle, or hard to diagnose when it fails. Likely to cost someone a debugging session |
| **Low** | Readability, naming, or consistency with the repo |

## 6. Report

```markdown
# Automation review

**Scope:** <PR / branch / files> · **Head:** <short sha if known>

## Summary
<one line: what the change adds or alters>

## Review table
| Priority | Category | Check | Status | Notes |
|---|---|---|---|---|
| High | Correctness | Test asserts the case's outcome | Pass / Fail / N/A | … |
| … one row per check above … |

## Traceability
| Test | Case ID | Expected fully asserted? | Priority matches? |
|---|---|---|---|

## Findings
- **File:** `tests/checkout.spec.ts:42`
- **Severity:** High
- **Issue:** <what is wrong, and why it matters for this test>
- **Suggestion:** <the smallest fix, with a snippet where it helps>

**Verdict: PASS** | **Verdict: FAIL**
```

**Verdict rule:** **FAIL** if any finding is Critical or High, or any High row in the table fails.
Otherwise **PASS**. Medium and Low findings are still listed, but they don't block.

Post the report to the PR (`gh pr comment`) **only when the user asks you to.** Otherwise return it in
the conversation.

## Re-reviewing

- **Same code, same verdict.** If nothing changed since your last review, re-affirm the previous
  verdict. Don't hunt for new findings in identical code, because a second sampling of unchanged code
  is noise, not a better review.
- **Severity doesn't drift.** A finding found again keeps its original severity. Raise it only if the
  code at that spot changed and the impact really got worse. Lower it only with a stated reason.
- **Carry open findings forward.** Mark a finding resolved only on a clear signal: the line changed in a
  way that fixes it, or the reviewer thread was resolved.
- **Comments from human reviewers:** add a concern as your own finding only after you have checked the
  code yourself and agree with it. Otherwise list it under "raised by others (not independently
  confirmed)". Never drop it silently.
