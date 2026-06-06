# Retrospective

Observations about how the team operates — collaboration, coordination, and process. Not about features or output.

---

## Went well

- PM blocked PR2 sign-off over a real user-facing bug: Player B's lobby always appeared empty on load and didn't show any availble games. PM caught it from static analysis alone and held sign-off until fixed.
- Peak concurrent agents was 3 — well within the 6-agent cap:

  | PR | Agents running | Parallel / sequential |
  |---|---|---|
  | PR1 | backend + frontend | Parallel — no shared files |
  | PR2 + PR3 | backend-2 + frontend-2 + pm (standby) | Parallel — spec marked these concurrent |
  | PR2 frontend | frontend-3 | Sequential — waited for PR2 backend's SSE contracts |
  | PR4 | backend-3 + frontend-4 | Parallel — both depended on committed PR2+3 |
  | PR5 | backend-4 + frontend-5 | Parallel — same pattern |
  | PR6 | backend-5 + frontend-6 | Parallel — same pattern |
  | QA | qa, qa-2, qa-3, qa-4 | After each PR's code was done |
  | PM | pm | Background standby; activated for delivery validation after each commit |

  What kept peak usage at 3 and well below the 6-agent cap:
  - **Spec constrained parallelism.** PRs 4, 5, and 6 were explicitly sequential — each depended on the previous. Only PR2+3 could genuinely run in parallel by design, so there was never pressure to spin up more agents.
  - **Broad scope per agent.** Each agent owned the full slice for their PR — schemas, DB, routes, and tests — rather than splitting into narrow specialists. Fewer handoffs, fewer agents, less coordination overhead.
- **Effective collaboration:** The PM and team-lead disagreed on a design choice. The server needed to signal "the game is over" inside an event that normally says "here's whose turn it is next." The backend solved it by putting the shooter's own ID in the "next turn" field — technically valid, but the PM felt it was bending the field's meaning to carry a message it wasn't designed for. They proposed a cleaner alternative. The team-lead weighed the cost against the benefit, decided it wasn't worth it given the project's scale, and made the call. The PM didn't push back — they documented the tradeoff and moved on. One exchange, no spiral.
- Scope discipline held across all 6 PRs — no agent added unrequested features; the Out of Scope section was respected throughout.
- No agent tried to modify a committed test file — the test integrity rule worked exactly as designed, with zero hook violations.

---

## Not so well

- **No code review step.** The PR cycle rule requires code review and QA in parallel. QA ran every PR; code review never did. No agent was tasked with independently reading the implementation for correctness. The lobby fetch bug is the direct consequence — a well-known React anti-pattern that a reviewer would have caught immediately instead slipped through to PM delivery validation, requiring a post-commit fix.
- **Coverage failures were reactive, not proactive.** Coverage fell below the 5% floor twice (PR1 branches/functions at 0%; PR5 branch denominator grew faster than numerator), stopping each PR until a QA fix was written. Both were avoidable if agents had run `make client-check` before declaring done. The floor is mechanical — there's no reason to discover it at commit time.
- **ALLOW_TEST_CHANGES=1 was the right call on the test.skip and wasn't made.** When the welcome screen shipped, the `test.skip` in `App.test.tsx` met its un-skip condition. The correct move was to review the diff, confirm it was a legitimate spec-driven change, and commit with `ALLOW_TEST_CHANGES=1` as a conscious sign-off. Instead a new test file was written to work around the decision entirely, leaving a permanently dead test in the suite. The rule exists to make that decision deliberate — avoiding it violated the spirit of the rule.
- **PR2 was committed with the lobby fetch bug in it.** `make check` passed, so the commit went through — but the React anti-pattern in the lobby component wasn't caught by reading the code. The push is supposed to be a sign-off that the PR cycle concluded correctly. It wasn't. The fix had to travel as a patch in the PR4 commit.
