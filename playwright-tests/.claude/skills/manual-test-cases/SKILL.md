---
name: manual-test-cases
description: >-
  Writes behaviour-driven, risk-based manual test cases for a web feature from a PRD, user story,
  acceptance criteria, design or plain feature description. Use this first whenever you are asked to
  write, design, plan, extend or review test cases or a test plan for a feature, before any
  automation is written. It models the feature, derives cases from its rules and risks, prioritises
  them by business impact, attacks the plan for gaps and bloat, and produces a small set of
  automation-ready cases, each with an ID, the risks it guards and the source of its expected result.
  Say "quick" for a fast first draft (spec only, at most 8 cases) that fits a live demo.
---

# Writing manual test cases

## The one rule

> Write each case as **"Verify that user …"** against a **user-visible outcome**, not UI mechanics.
> Prioritise by **business impact**. Aim for the **smallest set that still guards every business
> risk**, and write each case so it **collapses cleanly into one automated test**.

### Treat every case as a future script

Assume every case you write will be automated and run on every build for years. So the case list is
the regression suite written as prose, not a list of everything a tester could check. Two things follow:

- **A case must earn a script.** Before keeping a case, ask *would we run this on every build?* If the
  answer is no, fold its check into the Expected of a case that does earn a script, or drop it.
- **Coverage is counted in components, not in surface × variant grids.** Every component the feature
  touches gets a case. A mechanism shared by several components gets **one case per component**, with
  the variant **rotated** across them (see "Shared mechanisms" in the derivation reference).

## Quick mode

Use it when the request says **quick**, **fast**, **demo** or **quick mode**, or sets a time limit
(e.g. `/manual-test-cases quick docs/specs/promo-codes.md`). It is a first draft in a few minutes, not
the regression plan: the full run below is still what a feature ships on. Everything in "The one rule"
still applies. What changes:

1. **Read only what you were given, plus the existing cases' titles.** Read the spec (and any story or
   acceptance criteria named in the request). Do not read the implementation, the git diff or the
   `references/` files. Every expected result comes from the spec, so reading code only adds time. To
   avoid duplicates and pick the next IDs, list the existing case IDs and titles (a `grep` for the
   heading lines is enough) and read one existing case as the format template.
2. **Post a short progress line before each step,** e.g. "Read the spec: 6 codes, 9 rules. Listing
   risks." A long silent turn looks like a hang to whoever is watching.
3. **Plan in a few lines, not a document.** In the reply, list at most 8 business risks in one line
   each, highest impact first, and the spec's open questions. There is no written eight-slot model,
   dimension walk, risk ledger, or sparse and bloat passes.
4. **Write at most 8 cases** (or the number the request asks for): one per risk, P0 for money, order and
   eligibility rules, and the edges of numeric limits (`at`, `just below`) inside the case that owns the
   rule rather than as separate cases. Each case keeps its ID, title, priority, preconditions, steps,
   expected results and an oracle citing the spec section. Where the spec is silent, write an open
   question instead of a case.
5. **Save in one edit per file,** in the repo's existing place and format for manual cases. In this
   repo that is `playwright-tests/manual-cases/cartwheel-regression.md` under "4. Cases", and the `.csv`
   next to it. New cases start as `Not automated`.
6. **Check three things, then report:** every case has a user-visible outcome, a spec citation and no
   invented values. Report the file, the cases by priority, the open questions, and one line saying
   this was a quick pass that the full run should confirm.

## Inputs: read everything you were given

Stories, briefs and designs disagree more often than any one of them is wrong. Read **all** of the
sources you were given, then reconcile them. A plan grounded in one source when three were available is
a defect.

| Source | Why it matters |
|---|---|
| **User story and acceptance criteria** | The closest thing to a contract. Anything mandated for compliance or legal reasons becomes its own case and is never folded away. |
| **Product brief or PRD** | What the feature is *for*: the goals and the success measures. |
| **Design** | States and empty states that the prose leaves out. Never a source of exact UI copy. |
| **Existing case files and feature notes in the repo** | What is already covered and what has already broken. If cases exist, **extend them; never duplicate them**. |
| **The running app** | Only for surfaces that already ship. It cannot tell you about a feature that has not been built yet. |

**If you have none of these, stop and ask.** Never infer a feature from its name. Where a source is
silent or contradicts itself, record an **open question**, together with the case you will write once
it is answered, and write **no case** for it yet. An explicit unknown is useful. An invented expected
result is worse than no case at all.

## The run, end to end

```
GROUND     read every source · reconcile · list what is still unknown
CLASSIFY   a new feature, or an addition to an existing one?
DISCOVER   search existing cases and notes for overlap · cross cases · contradictions
STEP 1-2   model the feature · name the risks (risk ledger)
STEP 3     derive cases from the model (classes, edges, decision tables, lifecycles, pairwise, dimension walk)
STEP 4     give every Expected an oracle
STEP 5-6   prioritise · attack the plan twice (sparse, then bloat)
STEP 7     map each case to automation (one case, one test; which cases fold into a host)
DELIVER    write the case file and its notes · self-review with the checklist · report
```

**Nothing here needs the app to exist.** Cases are usually written before the feature is built, so
every expected result is a **specification of what should happen**, not a report of what does. What is
most likely wrong in a pre-build plan is not a stale label. It is a case with no subject, a case that
asserts something the brief left undecided, or a case that relies on a control nobody described.

## Ground the feature

- **Reconcile, don't average.** Where the story, the brief and the design disagree, the disagreement
  is the finding. Name it as an open question instead of quietly picking one side.
- **Mandated assertions are non-negotiable.** A compliance or legal requirement becomes its own case.
  It is never folded away and never loses to a bloat argument.
- **Never invent behaviour to fill a gap.** Silence in the spec is an open question, not permission.
- **Exact UI copy comes from the running app, never from a design file.** If the feature is not
  deployed anywhere you can reach, state what the copy must *convey* and mark the case
  `pending live UI verification`.

## Classify: is this a new feature, or an addition to one?

Decide this before you create a file, and write the decision down. Answer four questions. **Any yes
means it is a feature in its own right**, with its own case file:

1. Does it introduce a **different actor** or decision-maker (an admin rather than a shopper)?
2. Does describing it need **vocabulary** the existing feature's notes do not have?
3. Would it be useful to **run its tests on their own**, selected by their own tag?
4. Can it **break while the existing feature is entirely healthy**, in a way the existing cases would
   never catch?

All four no: it is an addition. Append its cases to the existing feature's case file and update that
feature's notes in place. *Example:* a new filter on the Cartwheel product grid is an addition to the
product grid. An admin screen that decides which products the storefront shows is its own feature. It
has a new actor, and it can break while every filter still works.

## Discover: cross-feature impact

Do this **before deriving cases**, and record the result even when it is "none found".

1. List your feature's domain nouns (cart, order, shipping, product, quantity, filter …).
2. Search the existing case files and feature notes for them.
3. Read the matches. Does your feature change a path they depend on, or alter something they assert?
4. **Write cross cases.** A case that only fails when *both* features are in play belongs to you. Name
   the other feature in its title.
5. **Flag contradictions.** Where an existing case asserts behaviour your feature changes, either their
   case is out of date or your feature is a regression. Don't decide which yourself. Record both claims
   and raise it.

## Steps 1–2: model the feature, then name the risks

**Read [references/modelling-and-derivation.md](references/modelling-and-derivation.md)** and fill in
the eight-slot model, the seven-dimension walk and the risk ledger, all in writing. Every slot is
filled, marked none, or recorded as unknown. Every case cites the risk IDs it guards. A state no tester
can reach is not a manual case: it stays in the ledger as `deferred: not tester-reachable`.

## Step 3: derive the cases

**Read [references/modelling-and-derivation.md](references/modelling-and-derivation.md) §Derivation
before writing the first case.** Its rules are: group inputs by equivalence class, test the edges,
collapse decision-table outcomes by *user remedy*, walk a lifecycle once, use pairwise only at four or
more genuinely independent variables, and do the seven-dimension walk. Never cite rule numbers inside
the cases.

**Read [references/titles-splitting-and-subjects.md](references/titles-splitting-and-subjects.md)
before writing the first title.** It covers how to phrase a title the way you would say it out loud,
when one behaviour is one case or several, and the subject test every case must pass. The rules broken
most often are these. A title names the **user's intent**, not the mechanics. It does not name the
**moment of execution** ("on click", "on submit"). And a case with no real **subject** is not a case.

## Step 4: give every Expected an oracle

An oracle is *why you believe the expected result is correct*. **Name one in every case.** This is the
guard against inventing expected values, and having to name it is what makes it work.

| Oracle | It lets you assert |
|---|---|
| **Claims** | What the brief, story, spec or acceptance criteria say. Cite the section. This is the dominant oracle before the feature is built. |
| **History** | What the product did before, when the change was not meant to alter it (an existing case, a past bug). |
| **Comparable product** | What a comparable feature in this product, or a well-known product, does. |
| **User desires** | What a reasonable user would expect. **This is an assumption.** Mark it as one and raise an open question. |
| **Product** | Consistency with the rest of this product: the same pattern elsewhere in it. |
| **Verified automation** | A behaviour already asserted by a passing automated test. Name the test. It is not available for a feature that has not been built. |

## Steps 5–6: prioritise, then attack the plan twice

**Read [references/prioritise-and-attack.md](references/prioritise-and-attack.md).** Priority is
**business impact × likelihood of failure**, not technical depth, and P0 stays at or below a third of
the cases. The target is the **optimal set, not the smallest**. Run both passes in writing: **sparse**
(name the case that guards each decided behaviour and each risk) and **bloat** (if I delete this case,
which risk is left uncovered?). Calibrate against
[references/calibration-examples.md](references/calibration-examples.md), which shows one Cartwheel
feature at 5, 11 and 25 cases and a small change at 4.

## Step 7: map to automation

**Read [references/automation-collapse.md](references/automation-collapse.md).** One case becomes one
test. A case that a bigger case already walks through may be **folded** into that host test when all
five gates hold. **Never fold a P0.** This step never deletes a case from the plan.

## Deliver

**Read [references/case-format-and-examples.md](references/case-format-and-examples.md)** before the
first case and again before delivering. It covers the plan's section order, case IDs, fields and worked
Cartwheel examples.

- **Where it goes.** Use the repo's existing place and format for manual cases if there is one.
  Otherwise write one file per feature, `test-cases/<feature>.md`. Cases for an existing feature are
  **appended in place**, never put in a second file.
- **Case IDs are stable** (`CART-003`). Never renumber them. The automated test carries the same ID.
- **Write the notes as standing fact.** Leave out build numbers, "verified on" dates and "used to"
  narration. When something is wrong, correct it in place. Never append a correction under it.
- **Every case starts as `Not automated`.** Only the change that adds its test marks it `Automated`.

## Review

Walk **[references/authoring-checklist.md](references/authoring-checklist.md)** before you report.
Every line in it is a step that produced a real defect when it was skipped. A box you cannot tick is the
finding, not a formality. If a second reviewer (a person or another agent) reviews the plan, apply
their findings using the verdict table in that file. The user decides disputed verdicts, not the
reviewer.

## Report back

Include the file path, the case count by priority against the number of decided behaviours (naming
the risk each extra case alone guards), the rotation tables, what DISCOVER found, the deferrals, and the
open questions that change what Product or a tester does next. The plan is a **draft until a human
approves it**.
