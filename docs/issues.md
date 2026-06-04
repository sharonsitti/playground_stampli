# Known Issues

Deferred findings from code review and QA bug sweeps. Items not classified Critical or Major are tracked here for future sprints.

---

## PR 6 — Game over + stats

**[Fixed] game-ending shot_fired now sends `next_turn = winner_id`**
- Fixed in PR 6: the game-ending `shot_fired` payload echoes the winner (shooter) as `next_turn` so the defeated player's grid never briefly becomes interactive between `shot_fired` and `game_over`.

**[Minor] `loserId` prop accepted but unused in GameOverScreen**
- File: `app/src/components/GameOverScreen.tsx`
- `loserId` is in the props type but never read internally (`didWin = playerId === winnerId`). If `playerId` matches neither id, screen silently shows "You lost". Not reachable in the 2-player happy path but the unused prop is a smell. Could be hardened with an explicit match check.

**[Minor] `useFireShot` turn-blocked state can wedge if SSE `shot_fired` echo is dropped**
- File: `app/src/components/battle/useFireShot.ts`
- `pending` clears only when `myShots.size` advances via SSE. Per spec, SSE has no auto-reconnect (out of scope), so a dropped event leaves the targeting grid permanently blocked for that turn. Known limitation by design.

**[Minor] SSE outbound payloads are not Zod-validated before broadcast**
- File: `server/src/sse.ts` + all broadcast call sites
- `broadcastGameEvent` takes `unknown` — outbound SSE payloads are not validated against their schemas. Consistent with all events in the codebase (this is not a PR 6 regression). Low risk on localhost with no external clients.

---

## PR 4 — Placement handshake: timer, ready, phase transition

**[Minor] No integration test for placement_expired DB effect**
- File: `server/src/placement.test.ts` / `server/src/timer.test.ts`
- `timer.test.ts` tests that `onExpiry` fires, but no test verifies that the game ends up `status='finished'` / `winner_id=null` in the DB after the join handler's timer wires in. `updateGameStatus` is covered by unit logic; the integration path (timer → DB → no stats) is untested.

**[Minor] useSubmitFleet has no recovery surface if both /place and /ready fail**
- File: `app/src/components/placement/useSubmitFleet.ts`
- If both POSTs fail, the Ready button stays Locked forever with no user feedback. Spec puts retries out of scope and the timer-expiry path (placement_expired → lobby) is the intended escape hatch. Acceptable as-is.

**[Minor] Two EventSource connections briefly coexist at join→placement transition**
- File: `app/src/components/lobby/usePlayerJoined.ts` + `app/src/components/placement/usePlacementSSE.ts`
- The creator's game-events SSE opened in LobbyScreen's usePlayerJoined overlaps briefly with PlacementScreen's usePlacementSSE before the lobby unmounts. Both replay the same state on connect per spec. Harmless on localhost (NF6).

**[Minor] Re-placement after a player has already called /ready is technically allowed**
- File: `server/src/index.ts`
- A player can call `/place` again after their own `/ready` while waiting for the opponent. Status is still `placing`, so the status guard passes. Ships are correctly overwritten. Spec says "/place must be called before /ready" but doesn't forbid re-placing after. Current behavior is harmless — calling it out as a conscious decision.

---

## PR 3 — Ship placement interaction

**[Minor] Unused `gameId`/`playerId` props in PlacementScreen**
- File: `app/src/components/PlacementScreen.tsx`
- Props declared but not consumed in PR 3 (the screen is client-only until PR 4 wires in the API calls). Left in as forward-wiring for PR 4's `POST /place` and `POST /ready` calls.

**[Minor] `occupiedKeySet` recomputed in two places per render**
- File: `app/src/components/placement/FleetGrid.tsx` and `app/src/components/placement/geometry.ts`
- Both build an occupied set from `placedShips` on the same render. Negligible at 5 ships / 100 cells. Do not add manual memo — not worth the complexity.

**[Minor] Apostrophe character consistency in ReadyButton copy**
- File: `app/src/components/placement/ReadyButton.tsx`
- Uses curly apostrophe in "I'm ready!". Tests use `/i.m ready/i` regex so they pass. Ensure future copy assertions use regex or the same character.

---

## PR 2 — Lobby: create, browse, join, cancel

**[Minor] `CreatePlayerRequestSchema` missing `.min(1)` and not `.strict()` — inconsistent with PR 2 request schemas**
- File: `shared/schemas.ts`
- New game schemas use `.strict()`; `CreatePlayerRequestSchema` (PR 1) does not. The empty-name case is caught downstream in index.ts, so behavior is correct, but the validation is split across layers. Align when touching that schema again.

**[Minor] `joinGame`/`createGame` cast return as `Game` after INSERT**
- File: `server/src/db/games.repository.ts`
- `return getGame(id) as Game` after INSERT/UPDATE. Safe on single-process localhost (synchronous SQLite), but the cast suppresses `| undefined`. Acceptable under NF6 simplicity.

**[Minor] 404 for unknown `gameId` on `/join` and `/delete` is not in spec**
- File: `server/src/index.ts`
- Added defensively and returns `{ error }` envelope correctly. Consistent across both endpoints. Keep it.

---

## PR 1 — Player registration + welcome screen

### Backend / Shared

**[Minor] `SHIP_SIZES` typed as `Record<string, number>` instead of closed `ShipType` union**
- File: `shared/geometry.ts`
- `Record<string, number>` means the `size === undefined` guard looks dead to readers and TypeScript can't catch a typo'd ship type at compile time. Runtime guard is correct and necessary.
- Fix: define `ShipType = 'carrier'|'battleship'|'cruiser'|'submarine'|'destroyer'` in `schemas.ts` and type `SHIP_SIZES: Record<ShipType, number>`. Pair with PR 4/5 when the server starts consuming `getOccupiedCells`.

**[Minor] Extra fields in `POST /api/players` body are silently accepted**
- File: `shared/schemas.ts`
- Plain `z.object` strips unknown keys but doesn't reject them. A body like `{ name: "Bob", wins: 999 }` passes validation. Currently harmless (repository ignores unknown fields), but this pattern will be copied by every endpoint.
- Fix: add `.strict()` to all incoming request schemas, or document that extra keys are intentionally stripped. Decide before PR 2 adds more endpoints.

**[Minor] Misleading error message for wrong-type `name` input**
- File: `server/src/index.ts:29`
- `{ name: 12345 }` or `{ name: null }` returns 400 `{ error: 'name is required' }`. Status and envelope shape are spec-compliant; message is misleading for present-but-wrong-type input.
- Fix: use Zod's `.message()` or format the `safeParse` error for better diagnostics.

**[Minor] No `journal_mode` / `busy_timeout` on the database connection**
- File: `server/src/db/database.ts`
- Single-process localhost (NF6) means rollback journal is fine. Documenting as a conscious choice.
- No action needed unless the project scales beyond single-machine.

**[Minor] SELECT-then-INSERT in `upsertPlayer` is theoretically non-atomic**
- File: `server/src/db/players.repository.ts`
- If two requests for the same brand-new name interleaved, the second INSERT would hit the UNIQUE constraint. In practice, Node.js is single-threaded and `better-sqlite3` is synchronous, so this race cannot occur on this single-machine setup. Safe by construction.

### Frontend

**[Minor] API base URL hardcoded inline in `WelcomeScreen.tsx`**
- File: `app/src/components/WelcomeScreen.tsx:16`
- `'http://localhost:8000'` will be duplicated across every component that makes fetch calls (PR 2+ adds 4+ endpoints). Extract a single `API_BASE` constant (or thin fetch helper) before PR 2 lands more call sites.

**[Minor] Error message not cleared on re-typing after a failed submit**
- File: `app/src/components/WelcomeScreen.tsx`
- After a 4xx, the error message and `aria-invalid` persist until the next submit resolves. Spec doesn't require clearing on input; minor UX nit.

**[Minor] Coverage gaps: error path and lobby placeholder uncovered**
- File: `app/src/components/WelcomeScreen.tsx:30-31,39` / `app/src/App.tsx:25-29`
- The 4xx error body branch and the network-failure catch are untested, and there's no test for the disabled→enabled→submitting button transition. A test mocking a 4xx and asserting `role="alert"` would lock in NF4 client behavior.

**[Minor] `sessionStorage.setItem` throws are uncaught**
- File: `app/src/components/WelcomeScreen.tsx:34-35`
- `setItem` can throw `QuotaExceededError` in Safari private mode or when storage is full. The outer catch returns the generic server-unreachable message, which is misleading. Very unlikely on localhost; cosmetic.

**[Note] SSE name injection — forward-looking for PR 2**
- Player names flow into `game_created` / `player_joined` SSE payloads as JSON. Since they're JSON-encoded in `data:` lines, they're safe IF the encoder escapes newlines. Verify in PR 2 that the SSE serialiser uses `JSON.stringify` (not string concatenation) for all event data.
