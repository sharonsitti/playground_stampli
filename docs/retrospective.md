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

## Not so well

- Frontend agent sent several duplicate idle notifications while waiting for a coverage-decision response, adding noise to the conversation; the team-lead had already sent the answer but the agent had not yet received it — a timing artifact of the async message system, not a coordination failure, but worth watching.
- QA agent was spawned before the frontend agent reported its coverage-blocker finding; this was the right proactive call (make client-check independently confirmed the problem), but it created a redundant loop where both agents were describing the same issue; next time, a quick make client-check before spawning QA would surface the blocker in one shot.
