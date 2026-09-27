# Authoring checklist, and applying a review

Walk this **before** you report. A box you can't tick is a step that was skipped, and every line here
exists because skipping it produced a defect in a real plan.

## Grounding and delivery

- [ ] **Every source provided was read**: story and acceptance criteria, brief, design, existing
      cases, and the running app where it exists. Disagreements are recorded, not averaged.
- [ ] **Mandated (compliance or legal) assertions are kept as their own cases**, never folded away.
- [ ] **Classified first**: a new feature (new case file) or an addition (appended to the existing file).
      The deciding question is written down.
- [ ] **Cross-feature discovery was run** and its result recorded, including an explicit "none found".
      Any contradiction with an existing case is raised, not silently resolved.
- [ ] **No case is written as though the live behaviour is already known.** Everything that needs the
      app is marked `pending live UI verification` and never guessed into a concrete string.
- [ ] **Corrections are made in place**, not appended under the case they invalidate.
- [ ] **No ticket numbers, build numbers or "verified on" dates in the cases.** Link the brief once, at
      the top of the plan.
- [ ] **Automation status is left as authored**: `Not automated`, or `Cannot be automated` with a
      reason. Never `Automated` at this stage.

## Derivation quality

- [ ] **The model is written.** Every slot is filled, marked "none", or recorded as an open question.
- [ ] **The risk ledger is written.** Every risk is cited by a case or deferred with a reason.
- [ ] **The seven-dimension walk is done.** Time, Interfaces and Platform are addressed or deferred in
      writing.
- [ ] **Reachability gate applied**: every case has a route to its precondition (confirmed, or
      `pending: reachability unconfirmed`). States with no tester route are ledger deferrals, not cases.
- [ ] **Every case has a subject.** Something exists or can be made to exist. No non-goal is asserted
      without naming what enforces it. No case relies on a control the brief never describes.
- [ ] **Undecided behaviour is not a case.** It is an open question, with the case to write once it is
      answered.
- [ ] **Standing exclusions are honoured.** No case is about an excluded surface, and the risk is still
      in the ledger.
- [ ] **Equivalence-class variants live inside one case**, not in near-identical cases.
- [ ] **Edges tested**: the boundary and just outside it, plus just inside when an off-by-one could slip
      through.
- [ ] **Rejections collapsed by user remedy.** Different remedies get different cases.
- [ ] **A pairwise array is produced** at four or more independent variables and attached as data.
- [ ] **Shared mechanisms are rotated, not multiplied.** The rotation table is written and both totals
      are checked.

## Titles, steps and expected results

- [ ] Every title opens with **`Verify that user …`** or **`Verify that <subject> …`**. It states
      intent and is unambiguous about the required outcome. It has no word limit.
- [ ] **Every title was read aloud.** None names machinery, uses a comparative negative, or uses spec
      jargon where a plain verb works.
- [ ] **No moment of execution is named** ("on click", "on submit") unless that timing is the claim.
- [ ] **Steps are at the level of intent**, not chains of clicks.
- [ ] **No case's main check is the existence, text or position of a single UI element.**
- [ ] Every case carries **Risks** and an **Oracle**, and no Expected is unsourced.
- [ ] **Assumption-based expected results** (the *User desires* oracle) are flagged as open questions.
- [ ] **Splits are applied**: two actors, mutually exclusive states and separate operations are separate
      cases. No merge would make a failure ambiguous.

## Priority and budget

- [ ] Each **P0** guards a release-blocking outcome or a recovery path, and **P0s are at most a third of
      the cases**.
- [ ] **Sparse attack done.** The coverage table maps every decided behaviour and every risk to a case
      or a deferral.
- [ ] **Bloat attack done.** Every surviving case fails the "delete it" test, and each one would be run
      on every build.
- [ ] **Within budget**: at most one case per decided behaviour, plus cases that each name the risk only
      they guard.
- [ ] Cases that differ only by data are flagged for **parameterised automation**. Subsumed cases are
      flagged to **fold** into their host (with the `// Also covers:` comment), while staying separate
      cases in the plan.

## Applying a review

When a second reviewer (a person or another agent) reviews the plan, apply each finding yourself:

| Verdict | What you do |
|---|---|
| `KEEP` | Nothing. |
| `DELETE` | Remove the case and retire its ID. |
| `HOLD` | Remove the case and record it as an `open question: undecided`, with the case to write once it is answered. |
| `DEFER` | Remove the case and record the risk as `deferred: not tester-reachable`, naming what would reach it. |
| `SPLIT` | Replace the case with the stated number of cases, along the stated axis, each with its own precondition and Expected. |
| `MERGE` | Combine, but only after confirming that a failure would still be unambiguous. |
| `REWORD` | Apply the replacement title or Expected. |

- Accept a **recommended addition** only if it passes the same three gates as every case: the brief
  decided the behaviour, a tester can reach the state, and it guards a risk that no existing case guards.
  If it fails a gate, decline it and name the gate in the report.
- **Findings about the brief itself** (gaps, contradictions) belong to Product. Report them separately,
  and never put them in the case list.
- **Send the plan back only once**, and only if a finding was genuinely ambiguous. Re-reviewing because
  you made edits loops without ever converging.
- **Show the user the review before finalising.** They decide disputed verdicts, not the reviewer.
