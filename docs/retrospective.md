# Retrospective

Observations about how the team operates — collaboration, coordination, and process. Not about features or output.

Each entry is one sentence. Append as events happen; never edit or delete an existing entry.

---

## Went well

- Backend and frontend worked truly in parallel on PR 1 (server + welcome screen) and coordinated the `shared/schemas.ts` handoff directly via peer messages without routing through team-lead.
- Security identified and reported findings before code was committed, giving backend a clean shot at fixes pre-merge rather than in follow-up PRs.
- QA proposed ranked test sets before writing any code, enabling fast approval without back-and-forth on scope.
- Backend anticipated test-isolation needs (app.listen guard + DB_PATH env) without being prompted, removing a blocker before QA hit it.
- Peer communication worked as intended — backend messaged frontend when schemas were ready, backend messaged QA/security when server was built, all without routing through team-lead.
- The shared/geometry.ts `?? 0` fix was a one-line unblock that the team-lead applied directly rather than bouncing it back to an engineer, keeping frontend unblocked instantly.
- Frontend correctly declined to add the dev-shortcut initial-view change (KDD #5) because it would have broken a committed AC1 test — caught its own scope risk without prompting.

## Not so well

- Backend left scratch test files (`_pr2_scratch.test.ts`, `_sse_scratch.test.ts`) in the working tree, which broke `make server-check` and required an explicit cleanup message from team-lead; scratch work should be deleted before signaling done.
- QA re-asked for approval on `App.registration.test.tsx` that had already been approved in a prior message — either the approval message arrived after QA had already composed their ask, or message ordering caused the confusion; team-lead had to re-confirm, burning an extra round-trip.
- Security logged LOW-1 and LOW-2 as "not actioned per policy" in Known Issues after they had already been fixed by backend — a coordination gap between the policy-change message and the fix-confirmation message arriving out of order; team-lead had to clarify.
- The "critical-only" issue policy came mid-PR-2 after two LOWs had already been fixed; a clearer upfront policy would have saved the fix work and the Known Issues cleanup.
