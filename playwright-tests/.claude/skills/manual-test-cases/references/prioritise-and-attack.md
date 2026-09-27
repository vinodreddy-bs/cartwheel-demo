# Steps 5–6: prioritise, then attack the plan twice

Read at Step 5, and again at Step 6. Both attacks are written out, not just felt.

## Step 5: prioritise by business impact

Priority is **business impact × likelihood of failure** (from the risk ledger), not technical depth.
There is no fixed ratio: the distribution falls out of the feature. Map the ledger onto the scale:

| | Likelihood High | Likelihood Med | Likelihood Low |
|---|---|---|---|
| **Impact High** | **P0** | **P1** | **P1** |
| **Impact Med** | **P2** | **P2** | **P3** |
| **Impact Low** | **P3** | **P3** | **P3** |

| Priority | Label | Meaning |
|---|---|---|
| P0 | Critical | Release-blocking. It is the smoke set. |
| P1 | High | A core behaviour whose failure hurts revenue or trust |
| P2 | Medium | Important but has a workaround, or needs a rarer combination |
| P3 | Low | Minor, cosmetic, or unlikely |

There are two overrides. A **recovery path for an inevitable failure** (sessions always expire, carts
are always abandoned and resumed) is P0 even when each occurrence looks routine. And a
release-blocking core workflow (placing an order) is P0 however the arithmetic lands.

**P0 is the smoke set**, the tests you run when there is time for only one pass. It must stay small
enough to be that pass: the primary journey of each component and the recovery overrides, nothing
else. **If more than a third of the cases are P0, priority has stopped selecting anything.** Re-grade
before review. Rotated shared-mechanism cases are P1 at most, except on the one surface whose failure
blocks the release.

"Verify that an error message displays" is **not** P0. The real P0 is "Verify that user is **blocked
from proceeding**".

> **In automation**, a test carries two tags: the feature tag on its outer `describe` and its priority
> tag (`@P0`–`@P3`) on the test. Don't add a third, ad-hoc categorisation tag. The title and those two
> tags are enough to select any run.

## Step 6: attack the plan twice

**The target is optimal, not minimal. Both directions are failures.** "Smallest set" is bounded by
"guards every business risk", and that bound is the half that matters. Dropping a case that guards a
real risk is wrong, not lean.

**Sparse attack: what slips through?** Anchor it on the brief. **For every goal and every behaviour the
brief decided, name the case that guards it.** That is where a miss costs a release. Then walk the rest
of the ledger. A risk with no decided behaviour behind it, or with no state a tester can reach, becomes
a written deferral (`open question: undecided` or `deferred: not tester-reachable`), not a missing case.

**Bloat attack: what is noise?** For each case, ask *if I delete this, which risk becomes uncovered?* If
the answer is "none" or "another case already covers it", delete it. Then ask the two prompts:

> **If this case passes but the feature is broken, would the user notice?**
> **If this case fails but the feature works, would I roll back the release?**

If both answers are no, delete the case. Ask a third question of every case: **would we run this on
every build?** A "no" means folding the case into a neighbour's Expected, or dropping it.

**The budget is a hard limit.** After both attacks, count the behaviours the brief decided. Have **at
most that many cases**, plus any case that names, in the report, the risk that only it guards. Every
case is a test that runs on every build, so a case that can't name its risk is maintenance with no
signal. Rotation and composition are the two mechanisms that keep a multi-surface feature within
budget.

Calibrate against [calibration-examples.md](calibration-examples.md).

### Don't write standalone cases for trivial UI

Skip these: page and dialog headings, whether a close (X) button is there, field labels, placeholder
text or button-label spelling, cosmetic layout or ordering, column headers, whether a Cancel button is
there. They pad the suite, and visual checks catch them.

A UI check earns its own case **only when the UI check is the behaviour**: a button disabled by a
business rule (for example, checkout unavailable while the cart is empty), a state that changes its
label, copy that directs the user's next action (such as a note on how far the cart is from free
shipping, if the product shows one), or a state indicator that changes what the user does (such as an
out-of-stock badge). Everything else is folded into a business
case's Expected, quoted inline.
