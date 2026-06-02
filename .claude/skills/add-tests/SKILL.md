---
name: add-tests
description: Write unit and integration tests for the current stack (FastAPI/pytest backend, React/TS frontend) that enforce the product contract. Derives test criteria from product docs in `docs/` (PRDs, feature specs, user stories, acceptance criteria, KPIs) — NOT from the implementation. Use when the user says "add tests", "write tests for X", "/add-tests", or similar.
---

# add-tests

Write tests that defend the **product contract**, not the current implementation. Tests must have teeth: a meaningful bug should turn them red.

## The cardinal rule

**Do not read the implementation of the code under test to decide what the test should assert.**

If you read `create_order()` and then write `assert result.status == "pending"` because that's what the function returns today, the test is worthless — it locks in whatever the code does, bugs included. Instead, decide what the function *should* do from the product docs, then assert that. If the implementation disagrees, the test fails and that's the point.

You **may** read the implementation for mechanical wiring only: import paths, function signatures, fixture setup, route URLs. Never for expected values, branches, or behavior.

## Step 1 — Gather the contract from `docs/`

Read every relevant file in `docs/` — `prd.md`, `feature-*.md`, user stories, anything that describes intent. Extract:

- **User stories** ("As a … I want … so that …") — these define the happy path.
- **Acceptance criteria** ("Given/When/Then", numbered lists, "must/should") — these become assertions.
- **KPIs and measurable thresholds** ("response under 200ms", "rejects payloads over 1MB", "rate-limit at 10 req/min") — these become exact-value assertions.
- **Edge cases and error states** explicitly called out ("if the user is unauthenticated, return 401", "duplicate emails are rejected") — these become unhappy-path tests.

If `docs/` is empty or silent on the feature, **stop and ask the user** for the spec or acceptance criteria. Do not infer the contract from the code.

## Step 2 — Propose a ranked test set, then STOP

Draft **6 happy-path checks + 6 unhappy-path checks** drawn from the doc contract. Rank each list from highest to lowest by how much production damage the test would prevent — a test that catches a silent data-loss regression ranks above one that catches a cosmetic error message.

Present to the developer like this:

```
### Happy path (ranked by protection value)
1. <one-line check> — defends: <doc line>. Why it has teeth: <what real bug it would catch>
2. ...
6. ...

### Unhappy path (ranked by protection value)
1. <one-line check> — defends: <doc line>. Why it has teeth: <what real bug it would catch>
2. ...
6. ...
```

**Then stop and wait.** Do not write any test code. Ask the developer which checks to implement (they may pick all, a subset, or ask to swap some). Only proceed once they answer.

If `docs/` is empty or silent on the feature, do not propose anything — ask for the spec first.

## Step 3 — Make sure tests have teeth

Before declaring done, check each test:

1. **Doc-traceable**: can you point to the doc line it enforces? If not, delete it.
2. **Falsifiable**: would it fail if the requirement were violated? Mentally mutate the code (return wrong status, skip the check, off-by-one the limit) — the test should catch it.
3. **No tautologies**: `assert result == result`, `assert function_was_called`, mocking the thing you're testing — all worthless.
4. **No overfitting to current output**: don't assert on incidental details (exact error message wording, field ordering, timestamps) unless the docs specify them.
5. **Run them**: They must pass against correct code and fail against broken code. If a test you expect to pass is failing, the bug is likely real — surface it to the user, don't weaken the test to make it green.

## Rules

- Never read the implementation to derive expected values.
- Never weaken an assertion to make a test pass; if the test is right and the code is wrong, report the discrepancy.
- Never write tests that mock the system under test.
- Never add tests without a corresponding doc requirement — ask for the spec instead.
- Prefer fewer sharp tests over many shallow ones. 6–8 teeth-bearing tests beat 30 trivial ones.
