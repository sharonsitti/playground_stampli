# Retrospective

Observations about how the team operates — collaboration, coordination, and process. Not about features or output.

Each entry is one sentence. Append as events happen; never edit or delete an existing entry.

---

## Went well

- PR1 backend and frontend agents ran in parallel and completed without file conflicts — correct parallelization from the start.
- Backend agent found scaffolding already in place (tsconfig paths, better-sqlite3, tsconfig-paths/register) and noted it cleanly rather than duplicating work.
- Frontend agent immediately flagged the schema name ambiguity before writing dependent code; team-lead resolved it in one turn by reading the file directly.
- QA agent proposed a ranked test set and waited for approval before writing code — correct workflow per QA agent instructions.
- Team-lead caught and fixed the DB_PATH isolation bug (one-liner in database.ts) inline at commit time rather than spawning a new agent turn — saved tokens and kept the fix atomic with the PR.
- PR2 backend and PR3 frontend/shared launched in parallel immediately after PR1 committed — no idle time between PRs.
- PR4 backend agent (backend-3) self-reported a non-obvious timer behavior (unref'd setInterval) proactively in its completion message — surfaced before it could become a surprise in test teardown.
- PR4 frontend agent (frontend-4) encountered a transient mid-session conflict where two agents were editing the same file (useLobbySSE.ts) simultaneously and recovered gracefully without team-lead intervention.
- PM caught a critical React stale-closure bug (KI #1) from static code analysis alone without a running browser — sharp spec-against-code trace, no runtime needed.
- backend-3 and frontend-4 both reported completion with explicit coverage of their check-order decisions and open items, reducing the team-lead's review burden to confirmation rather than discovery.
- PR4 frontend agent self-identified and fixed the max-lines-per-function hard error (extracted PlacementPanel) without prompting — good ownership of lint rules.
- PR5 backend agent proactively built finishGame and getShipAtCell for PR6/PR5 even though they weren't strictly needed in PR5 scope — reduced the PR6 agent's surface area.

## Not so well (continued)

- Multiple agents went idle without sending a completion report, requiring team-lead to ping and run make check independently; this pattern adds a round-trip per PR. Agents should always send a completion message before going idle.
- KI #1 (initial lobby fetch bug) was not caught during PR2 development or QA — only surfaced in PM delivery validation. The root cause (derived state from a prop in useState) is a well-known React anti-pattern; a frontend code review step after implementation (not just QA tests) would have caught it earlier.
- Two DR candidates from PR4+PR5 were identified by team-lead at the user's reminder prompt rather than proactively — team-lead should surface DR candidates as they appear in agent completion reports, not in batch after the fact.

## Not so well

- Frontend agent sent several duplicate idle notifications while waiting for a coverage-decision response, adding noise to the conversation; the team-lead had already sent the answer but the agent had not yet received it — a timing artifact of the async message system, not a coordination failure, but worth watching.
- QA agent was spawned before the frontend agent reported its coverage-blocker finding; this was the right proactive call (make client-check independently confirmed the problem), but it created a redundant loop where both agents were describing the same issue; next time, a quick make client-check before spawning QA would surface the blocker in one shot.
