### Battleship — Multiplayer Browser Game

## Goal

A two-player Battleship game playable across two browser tabs on the same machine. Players register with a name, find each other in a lobby, place their fleets under a countdown, then alternate firing shots until one fleet is destroyed. All real-time state is pushed via SSE; no page reloads required after the initial load.


## Assumptions

- Both players are on the same machine using the same localhost server
- The placement timer and per-turn timer use the same preset value

## Target Personas

- **Player A (game creator):** Opens the app, enters their name, creates a game with a difficulty preset, and waits in the lobby for an opponent.
- **Player B (joiner):** Opens the app in a second tab, enters their name, sees Player A's open game in the lobby list, and joins it.

## Out of Scope

If it is not explicitly described in the requirements or UI mockup, it is out of scope. Do not infer intent or add features that seem natural but are unspecified. Common patterns to avoid:

- **Production readiness:** observability, logging, rate limiting, authentication or sessions beyond a name entry, deployment infrastructure
- **UI polish:** animations, mobile / responsive layout, undo beyond the Reset button, loading skeletons
- **Interaction patterns:** drag-and-drop for ship placement (F4 specifies click-only); keyboard shortcuts beyond `R` for rotation
- **SSE behaviour:** auto-reconnects, retries. 

---

## UI Mockup Notes

`docs/battleship-ui-mockup.png` is an annotated reference that stacks multiple states of the same screen for illustration. Do **not** treat stacked states as a simultaneous layout:

- **Section 04 — Placement:** The two grids labeled "Valid placement ✓" and "Overlap — invalid ✗" are a visual legend showing the green/red preview colour, not two grids rendered at once. The actual placement screen has **one** 10×10 grid, one ship palette to the right, and the timer/ready button above.
- **Section 05 — Battle:** The "YOUR TURN" banner and the "WAITING FOR OPPONENT…" banner shown stacked are alternate states; only one renders at a time. The turn-expired toast below them is also an alternate state, not a persistent element.

---

## Requirements

### Functional (ranked by priority)

#### F1 — Welcome screen and player registration
As a new visitor, I want to enter my name before entering the lobby so that my identity and stats are tracked across games.

**Acceptance criteria:**
1. The welcome screen is shown every time the app is opened, even if a prior session id exists in storage — no skip or auto-redirect
2. The welcome screen has a single text input for name and a "Play" button
3. "Play" is disabled until at least 1 non-whitespace character is entered
4. Submitting creates or retrieves the player record on the server; the returned `id` and `name` are stored in `sessionStorage` (not `localStorage` — each tab must hold an independent identity)
5. After submit, the player is taken to the lobby

#### F2 — Lobby: game list
As a player, I want to see available games in the lobby so that I can choose one to join.

**Acceptance criteria:**
1. The lobby lists only games with status `waiting`; in-progress and finished games are not shown
2. Each row shows: creator name, win/loss record, win rate, and difficulty preset (Quick / Casual)

#### F3 — Lobby: game creation and joining
As a player, I want to create a new game or join an existing one so that I can find an opponent.

**Acceptance criteria:**
1. A "Create Game" button opens a modal to choose a preset (Quick 30s / Casual 60s) and confirm; "Quick" is pre-selected when the modal opens
2. Creating a game puts the creator into a "Waiting for opponent..." holding state; the creator's own game does not appear in the lobby list — it is shown only as the holding card
3. A "Join" button on any open game row immediately starts the placement phase for both players
4. The lobby list updates in real time when games are created or joined
5. A "Cancel" button in the holding state deletes the waiting game via `DELETE /api/games/:gameId`, broadcasts `game_removed` to all lobby SSE subscribers, and returns the creator to the lobby

#### F4 — Ship placement: interaction
As a player, I want to arrange my fleet on the grid using click interactions so that I can set up my strategy before battle.

**Fleet:**
| Ship | Size |
|---|---|
| Carrier | 5 cells |
| Battleship | 4 cells |
| Cruiser | 3 cells |
| Submarine | 3 cells |
| Destroyer | 2 cells |

**How to place ships:**
1. **Select** — Click a ship in the palette. It attaches to your cursor as a ghost preview.
2. **Position** — Hover over the grid. The preview snaps cell-by-cell, anchored from the ship's top-left corner. Green = valid placement; red = invalid.
3. **Rotate** — Press `R` at any time to toggle between horizontal and vertical. The preview updates instantly and validity re-evaluates.
4. **Place** — Click a cell to place the ship. Invalid positions are blocked. The ship is removed from the palette.
5. **Reposition** — Click a placed ship on the grid to pick it back up, as if selecting it from the palette again.
6. **Reset** — Click "Reset" to remove all placed ships and refill the palette.

**Acceptance criteria:**
1. The fleet grid is 10×10; columns are labeled `a`–`j`, rows `1`–`10`. Column letters map to integers in the API: `a=0, b=1, …, j=9`; this encoding is used in all ship placement and shot endpoints.
2. Clicking a ship in the palette selects it and shows a hover preview snapped to the grid, anchored from the ship's top-left cell
3. Once a ship is placed, it is removed from the palette (the slot disappears entirely; no disabled placeholder remains)
4. Valid placement = green highlight; invalid = red highlight (rules: H/V only, must fit in bounds, no overlap; ships may touch); clicking an invalid position is a no-op
5. Orientation is toggled via the `R` key; toggling updates the live preview immediately
6. Clicking an already-placed ship on the fleet grid picks it back up into the cursor
7. A "Reset" button clears all placed ships and repopulates the palette

#### F5 — Ship placement: phase flow
As a player, I want the placement phase to be time-limited and coordinated with my opponent so that the game starts fairly.

**Acceptance criteria:**
1. Both players enter the placement phase simultaneously when the second player joins
2. A countdown timer (from the game's preset value) is visible and synchronized across both tabs
3. The "I'm ready!" button has three visual states: **(a) Unready** — disabled, muted/gray appearance, helper text "Place all 5 ships to continue" shown below the button; **(b) Ready** — enabled once all 5 ships are placed, green background, label "✓ I'm ready!"; **(c) Locked** — disabled after the player clicks it, primary/indigo background (visually distinct from the muted Unready style), label "I'm ready!" (no text change from the base label), helper text hidden
4. Clicking "I'm ready!" (from the Ready state) transitions to Locked, notifies the server, and disables the Reset button and all grid cells (not hidden)
5. If both players click "I'm ready!" before the timer expires, the battle phase begins immediately
6. If the timer expires before both players have clicked "I'm ready!", the game is terminated: no winner is recorded, both players are returned to the lobby with a dismissible message

#### F6 — Battle phase: turn mechanics
As a player, I want to take turns firing shots at my opponent's grid so that the game progresses fairly.

**Acceptance criteria:**
1. The battle phase shows two grids side by side: fleet grid (left) and targeting grid (right)
2. The game creator takes the first turn
3. A prominent banner shows "Your turn" or "Waiting for opponent..." with a live countdown
4. On each turn, the active player fires exactly one shot by clicking any un-fired cell on the targeting grid
5. The targeting grid is non-interactive when it is not the player's turn

#### F7 — Battle phase: shot results
As a player, I want to see the outcome of every shot immediately so that I can track the state of both fleets.

**Acceptance criteria:**
1. A hit is marked in red; a miss is marked with a neutral indicator (e.g. white dot)
2. When all cells of an opponent's ship are hit, the ship is sunk: its full outline is revealed on the targeting grid
3. When a ship is sunk, a "[Ship name] sunk!" notification is shown to both players
4. Incoming hits and misses from the opponent are shown on the player's fleet grid in real time
5. If a player's turn timer expires, their turn is forfeited: both players see "[Player] ran out of time — turn skipped" and the turn passes to the opponent with no shot fired

#### F8 — Game over
As a player, I want to see a clear result when the game ends so that I know who won and can return to the lobby.

**Acceptance criteria:**
1. The game ends when all 5 ships in one player's fleet are sunk; the opponent who sunk them wins
2. Both players see a game-over banner: winner sees "You won!" with subtitle "All of [loser's name]'s ships are sunk"; loser sees "You lost" with subtitle "[winner's name] sunk your fleet". Both result screens also display the updated win/loss stats for each player, sourced from the `winner` and `loser` objects in the `game_over` SSE payload
3. The game record is marked `finished` with the winner ID
4. Win/loss stats for both players are updated
5. A "Return to lobby" button takes the player back to the lobby
6. The finished game is removed from the lobby list *(satisfied by construction: the game was already removed from `waiting` via `game_removed` when it was joined in Flow 2 — PR6 must not regress this, but has nothing new to implement for this AC)*

#### F9 — Player stats
As a player, I want my win/loss record to persist across server restarts so that my stats are not lost between sessions.

**Acceptance criteria:**
1. Each player record tracks: name, games played, wins, losses, win rate
2. Stats survive server restarts

---

### Non-functional

#### NF1 — Consistency: shared game state
Game and lobby state must be consistent across all open views at any point in time, so that every participant sees the same game and no player acts on information that has already changed.

**Acceptance criteria:**
1. Actions submitted against a game state that has already advanced are rejected with a 409 Conflict response
2. On receiving a 409, the client discards the response and takes no UI action; the correct state will arrive via the real-time stream
3. The SSE stream is authoritative for game state; shot results and phase changes are applied only on SSE events, not on HTTP response bodies. The targeting grid is blocked for further clicks until `shot_fired` arrives

#### NF2 — Latency: real-time updates
State changes must be pushed to all open views as they occur, so that game events feel immediate and no player acts on outdated information.

**Acceptance criteria:**
1. Timer values shown across both tabs never differ by more than 1 second
2. State changes are visible to all connected players before the acting player can take a subsequent action

#### NF3 — Fault tolerance: input safety
The system must not crash or corrupt state from invalid or malformed input, so that one bad action cannot break the game for both players.

**Acceptance criteria:**
1. Out-of-bounds shot coordinates are rejected with a 400 response
2. Firing on an already-fired cell is rejected with a 400 response
3. Acting out of turn is rejected with a 403 response
4. Errors are returned in the envelope defined in NF4 and never crash the handler
5. Handlers check conditions in this order: phase/status (→ 409), authorization/turn (→ 403), input validity (→ 400); the first failing check wins. This ordering governs every action endpoint (`/join`, `/place`, `/ready`, `/shot`) — each PR that adds an endpoint follows it, even though PR 5 owns this AC.

#### NF4 — Contract: uniform error envelope
All endpoints must return errors in a consistent shape so the client can handle any failure without endpoint-specific parsing logic.

**Acceptance criteria:**
1. All 4xx and 5xx responses return `{ "error": string }` as the JSON body

#### NF5 — Consistency: state machine enforcement
The server must reject actions that are invalid for the current game phase so that out-of-order or replayed requests cannot corrupt shared state.

**Acceptance criteria:**
1. Calling `/place` or `/ready` when game status is not `placing` returns 409
2. Calling `/shot` when game status is not `battle` returns 409
3. Calling any action endpoint on a `finished` game returns 409 *(satisfied by construction: a finished game fails the status guard already present on each endpoint — `/place`/`/ready` require `placing` (AC1), `/shot` requires `battle` (AC2), `/join` requires `waiting` (AC4). No additional guard needed; each endpoint's own check covers this.)*
4. Calling `/join` on a game that is not `waiting` returns 409
5. Calling `DELETE /api/games/:gameId` on a game that is not `waiting` returns 409

#### NF6 — Scale: single-machine localhost only
This is a conceptual project intended to run on one machine; no concurrency, horizontal scaling, or production load targets apply, so simplicity always wins over optimization.

**Acceptance criteria:**
1. The server is designed for exactly two concurrent players on a single localhost instance — no connection pooling, caching layers, or scalability patterns are required
2. Where a simpler implementation and a more performant one diverge, always prefer the simpler one

---

## Data Models

### Database Schemas

#### `players`
Stores player identity and lifetime win/loss stats; persists across server restarts.

| `id` | `name` | `games_played` | `wins` | `losses` |
|---|---|---|---|---|
| `text (UUID), PK` | `text, unique, not null` | `integer, not null, default 0` | `integer, not null, default 0` | `integer, not null, default 0` |

**Indices:**
- `name` — equality lookup when retrieving a player by name

---

#### `games`
Represents a single game instance from creation through completion; drives lobby state, placement coordination, and battle turn management.

| `id` | `preset` | `status` | `creator_id` | `joiner_id` | `current_turn` | `winner_id` | `creator_ready` | `joiner_ready` |
|---|---|---|---|---|---|---|---|---|
| `text (UUID), PK` | `text, not null` ('quick'\|'casual') | `text, not null` ('waiting'\|'placing'\|'battle'\|'finished') | `text (UUID), FK → players.id` | `text (UUID), FK → players.id, nullable` | `text (UUID), FK → players.id, nullable` | `text (UUID), FK → players.id, nullable` | `integer, not null, default 0` | `integer, not null, default 0` |

**Indices:**
- `status` — range scan over all games in a given status

**Notes:**
- A game whose placement timer expires before both players are ready is marked `finished` with `winner_id: null`. No new status value is needed.
- Placement-expiry games do not increment `games_played`, `wins`, or `losses` for either player; only games that reach `game_over` count.

---

#### `ships`
Records each ship's placement for a player within a game; used to validate shots, detect sunk ships, and reveal outlines when a ship goes down.

| `id` | `game_id` | `player_id` | `type` | `orientation` | `origin_col` | `origin_row` | `sunk` |
|---|---|---|---|---|---|---|---|
| `text (UUID), PK` | `text (UUID), FK → games.id` | `text (UUID), FK → players.id` | `text, not null` ('carrier'\|'battleship'\|'cruiser'\|'submarine'\|'destroyer') | `text, not null` ('H'\|'V') | `integer, not null` (0–9) | `integer, not null` (1–10) | `integer, not null, default 0` |

**Indices:**
- `(game_id, player_id)` — fetch all ships for one player in one game

---

#### `shots`
Records every shot fired in a game; used to prevent duplicate shots and reconstruct board state.

| `id` | `game_id` | `player_id` | `col` | `row` | `hit` |
|---|---|---|---|---|---|
| `text (UUID), PK` | `text (UUID), FK → games.id` | `text (UUID), FK → players.id` | `integer, not null` (0–9) | `integer, not null` (1–10) | `integer, not null` |

**Indices:**
- `(game_id, player_id, col, row), unique` — point lookup to check if a cell has already been fired at; uniqueness enforces no duplicate shots
- `(game_id, player_id)` — range scan over all shots by one player in one game

---

### API Schemas

One entry per endpoint. These are the interface contracts — the request and response shapes that backend commits to serve and frontend commits to consume.

All schemas are defined as **Zod schemas** in `shared/schemas.ts` and imported by both `server/` and `app/`. The inferred TypeScript types (`z.infer<typeof Schema>`) are the only types used on either side — no separate interface files. The server validates all incoming request bodies and outgoing response payloads against these schemas at runtime; a mismatch throws before the response is sent.

`shared/schemas.ts` also exports `PRESET_SECONDS: Record<'quick'|'casual', number> = { quick: 30, casual: 60 }` — the only place this mapping is defined; no agent hardcodes these values elsewhere.

All 4xx and 5xx responses return `{ "error": string }`.

All POST request bodies that include `player_id` use the `id` field returned by `POST /api/players`, stored client-side.

---

#### `POST /api/players`
Creates or retrieves a player record by name. If a player with the given name already exists, the existing record is returned.

**Request**
```ts
{
  name: string  // trimmed before lookup; must contain 1–50 characters after trimming (inclusive)
}
```

**Response**
```ts
{
  id: string
  name: string
  games_played: number
  wins: number
  losses: number
  win_rate: number  // wins / games_played; 0 if games_played is 0; raw float (e.g. 0.67) — frontend formats for display
}
```

---

#### `GET /api/games`
Returns all games currently in `waiting` status for the lobby list.

**Response**
```ts
{
  games: Array<{
    id: string
    preset: 'quick' | 'casual'
    creator: {
      id: string
      name: string
      games_played: number
      wins: number
      losses: number
      win_rate: number
    }
  }>
}
```

---

#### `GET /api/lobby/events`
SSE stream that pushes lobby-level events to all connected clients. Connect on lobby mount; close on navigation away.

**Response** — `text/event-stream`. Each message:
```
event: <type>
data: <json>
```

`game_created` — a new game entered `waiting` status
```ts
{
  id: string
  preset: 'quick' | 'casual'
  creator: {
    id: string
    name: string
    games_played: number
    wins: number
    losses: number
    win_rate: number
  }
}
```

`game_removed` — a game left `waiting` status because it was joined; remove it from the lobby list
```ts
{
  id: string
}
```

---

#### `POST /api/games`
Creates a new game in `waiting` status.

**Request**
```ts
{
  creator_id: string  // UUID of the creating player
  preset: 'quick' | 'casual'
}
```

**Response**
```ts
{
  id: string
  preset: 'quick' | 'casual'
  status: 'waiting'
  creator_id: string
}
```

---

#### `POST /api/games/:gameId/join`
Joins a `waiting` game, transitioning it to `placing`. Triggers the placement phase for both players via SSE.

**Request**
```ts
{
  player_id: string  // UUID of the joining player
}
```

**Response**
```ts
{
  id: string
  preset: 'quick' | 'casual'
  status: 'placing'
  creator_id: string
  joiner_id: string
}
```

---

#### `DELETE /api/games/:gameId`
Cancels a `waiting` game. Only the creator may cancel. Broadcasts `game_removed` to all lobby SSE subscribers so the row disappears from every connected lobby view.

**Request**
```ts
{
  player_id: string  // must match the game's creator_id; returns 403 otherwise
}
```

**Response**
```ts
{
  ok: true
}
```

---

#### `GET /api/games/:gameId/events`
SSE stream for all game-specific events during placement and battle phases. Both players connect on entering placement; the creator connects immediately after creating the game to receive `player_joined`. When a client connects while the game is already in `placing` status, the server immediately replays the last `player_joined` event followed by the current `timer_tick` value, so the joiner never misses the initial state.

**Response** — `text/event-stream`. Each message:
```
event: <type>
data: <json>
```

`player_joined` — second player joined; placement phase begins
```ts
{
  joiner: {
    id: string
    name: string
  }
  timer_seconds: number  // countdown duration matching the preset (30 or 60)
}
```

`timer_tick` — one-second tick broadcast every second during the placement countdown and between turns in battle. The first tick fires immediately when the countdown begins (at the full `timer_seconds` value), so the client displays `seconds_remaining` from the very first tick rather than special-casing the initial value from `player_joined` or `battle_start`.
```ts
{
  seconds_remaining: number
}
```

Display `seconds_remaining` as `M:SS` format (e.g., `30 → 0:30`, `60 → 1:00`, `7 → 0:07`). Apply this format wherever a countdown is rendered: the placement phase banner and the battle turn banner.

`player_ready` — a player submitted their ships and clicked "I'm ready!"
```ts
{
  player_id: string
}
```

`battle_start` — both players are ready; battle phase begins
```ts
{
  current_turn: string  // player_id who fires first (always the creator)
  timer_seconds: number // turn timer duration matching the preset
}
```

`placement_expired` — timer reached 0 before both players were ready; game is terminated
```ts
{}
```

`shot_fired` — a shot has been resolved and board state updated
```ts
{
  shooter_id: string
  col: number                                                                          // 0–9
  row: number                                                                          // 1–10
  hit: boolean
  sunk: boolean
  ship_type: 'carrier' | 'battleship' | 'cruiser' | 'submarine' | 'destroyer' | null  // null if not sunk
  ship_cells: Array<{ col: number; row: number }> | null                              // full ship outline if sunk, else null
  next_turn: string                                                                    // player_id who fires next
}
```

`turn_expired` — active player's turn timer ran out; turn is forfeited with no shot fired
```ts
{
  player_id: string  // player whose turn expired
  next_turn: string  // player_id who goes next
}
```

`game_over` — all ships of one player are sunk; game is finished. On the game-ending shot, the server emits `shot_fired` first so the client can update the grid, then emits `game_over` immediately after. The payload includes fresh stats for both players (already persisted server-side before the event is emitted) so the client can render the result screen without a separate fetch.
```ts
{
  winner_id: string
  loser_id: string
  winner: { id: string; name: string; games_played: number; wins: number; losses: number; win_rate: number }
  loser:  { id: string; name: string; games_played: number; wins: number; losses: number; win_rate: number }
}
```

---

#### `POST /api/games/:gameId/place`
Submits the player's final ship placements. Must be called before `/ready`. Server validates that all 5 ships are present (one of each type), within bounds, and non-overlapping. A second call before `/ready` overwrites the previous placement.

**Request**
```ts
{
  player_id: string
  ships: Array<{
    type: 'carrier' | 'battleship' | 'cruiser' | 'submarine' | 'destroyer'
    orientation: 'H' | 'V'
    origin_col: number  // 0–9; top-left anchor column
    origin_row: number  // 1–10; top-left anchor row
  }>
}
```

**Response**
```ts
{
  ok: true
}
```

---

#### `POST /api/games/:gameId/ready`
Marks the calling player as ready for battle. Once both players have called this endpoint, the server transitions the game to `battle` and broadcasts `battle_start`.

**Request**
```ts
{
  player_id: string
}
```

**Response**
```ts
{
  ok: true
}
```

---

#### `POST /api/games/:gameId/shot`
Fires a shot at the opponent's grid on the active player's turn. Server resolves the result, updates board state, and broadcasts `shot_fired` to both players.

**Request**
```ts
{
  player_id: string
  col: number  // 0–9
  row: number  // 1–10
}
```

**Response**
```ts
{
  hit: boolean
  sunk: boolean
  ship_type: 'carrier' | 'battleship' | 'cruiser' | 'submarine' | 'destroyer' | null  // null if not sunk
  ship_cells: Array<{ col: number; row: number }> | null                              // full ship outline if sunk, else null
}
```

---

## Key User Flows

### Flow 1 — Player registration
- **Purpose:** Establish a named player identity before entering the lobby so stats can be tracked across games.
- **Trigger:** Player opens the app (Welcome screen is always shown on load).
- **Walkthrough:**
  1. Welcome screen renders with a name input and a disabled "Play" button.
  2. Player types at least one non-whitespace character; "Play" becomes enabled.
  3. Player clicks "Play"; client sends `POST /api/players` with the trimmed name.
  4. Server creates a new player record or returns the existing one for that name.
  5. Client stores the returned `id` and navigates to the lobby.
- **Architectural pattern:** Request/response — a single POST is sufficient; no streaming needed because there is no shared state to coordinate at this point.
- **Supports:** F1, F9

---

### Flow 2 — Lobby: browse, create, and join a game
- **Purpose:** Match two players together so a game can begin.
- **Trigger:** Player lands on the lobby screen after registration.
- **Walkthrough:**
  1. Client fetches `GET /api/games` to populate the initial list of `waiting` games, then opens `GET /api/lobby/events` (SSE) to receive real-time updates.
  2. **Player A — create:** Clicks "Create Game", selects a preset (Quick 30s / Casual 60s), confirms. Client sends `POST /api/games`; server creates the game in `waiting` status and broadcasts a `game_created` event to all lobby SSE subscribers. Player A enters a "Waiting for opponent…" holding state and opens `GET /api/games/:gameId/events` to receive the `player_joined` event when someone joins.
  3. **Player B — join:** Sees Player A's game row (creator name, record, win rate, preset). Clicks "Join". Client sends `POST /api/games/:gameId/join`; server transitions the game to `placing` and broadcasts `game_removed` to all lobby SSE subscribers, removing the row from every connected lobby view.
  4. Both players receive a response (Player A via SSE `player_joined`, Player B via the join response) and both navigate into the placement phase.
- **Architectural pattern:** Hybrid — REST POST for mutations (create, join); SSE (`GET /api/lobby/events`) for real-time lobby list updates pushed to all connected clients without polling.
- **Supports:** F2, F3, F9, NF1, NF2

---

### Flow 3 — Ship placement phase
- **Purpose:** Both players secretly arrange their fleets on private grids before battle begins, within a shared time limit.
- **Trigger:** `POST /api/games/:gameId/join` completes; server transitions game to `placing` and starts the placement countdown.
- **Walkthrough:**
  1. Server starts the placement timer and immediately sends the first `timer_tick` event on the game SSE stream; Player A receives `player_joined` (with `timer_seconds`) and Player B receives the same initial tick. Both tabs display the same countdown from the first tick onward.
  2. Each player arranges ships entirely client-side, one ship at a time:
      - Click a ship in the palette — it attaches to the cursor as a ghost preview.
      - Move the cursor over the grid — the preview snaps cell-by-cell, anchored at the ship's top-left corner. It turns **green** if the position is valid (in-bounds, no overlap) or **red** if not.
      - Press `R` at any point to toggle H/V orientation; the preview re-snaps and re-evaluates validity immediately.
      - Click a **green** cell to place the ship — it is removed from the palette and drawn on the grid.
      - Click a **red** cell — nothing happens; the ship stays on the cursor.
      - Click an already-placed ship on the grid — it is picked back up into the cursor exactly as if freshly selected from the palette, and its slot returns to the palette.
      - Click "Reset" — all placed ships are removed and the palette is fully repopulated.
  3. Once all 5 ships are placed, "I'm ready!" becomes enabled.
  4. Player clicks "I'm ready!": client sends `POST /api/games/:gameId/place` (full ship list), then `POST /api/games/:gameId/ready`. Server broadcasts `player_ready` to both players; the button is visually locked.
  5. **Both ready before timer:** server transitions game to `battle`, broadcasts `battle_start` (with `current_turn` and `timer_seconds`). Both clients navigate to the battle phase.
  6. **Timer expires first:** server broadcasts `placement_expired`; game is marked `finished` with no winner. Both clients display a dismissible message and return to the lobby.
- **Architectural pattern:** Hybrid — placement interaction is fully client-side (no round-trips until submission, keeping UI instant); server drives the timer via `timer_tick` SSE events so both tabs stay synchronized; placement and ready state submitted via REST POST; phase transitions coordinated via SSE events on the game stream.
- **Supports:** F4, F5, NF1, NF2, NF3, NF5

---

### Flow 4 — Battle phase: fire shots and track state
- **Purpose:** Players alternate firing shots at each other's hidden fleets until one fleet is fully destroyed.
- **Trigger:** `battle_start` SSE event received by both players.
- **Walkthrough:**
  1. Both clients render two grids side by side: fleet grid (own ships + incoming hits) on the left, targeting grid (shots fired at opponent) on the right. A banner shows "Your turn" or "Waiting for opponent…" with a live countdown from `timer_tick` events.
  2. The game creator fires first (`current_turn` from `battle_start`). The targeting grid is non-interactive when it is not the player's turn.
  3. Active player clicks an un-fired cell on the targeting grid; client sends `POST /api/games/:gameId/shot`.
  4. Server validates the shot (correct turn, in-bounds, not already fired), resolves hit or miss against the opponent's ships, and broadcasts `shot_fired` to both players via SSE.
  5. Both clients update their grids: hit cells turn red, misses get a neutral indicator. If a ship is fully sunk, its complete outline is revealed on the targeting grid and a "[Ship name] sunk!" notification appears for both players.
  6. `next_turn` in the `shot_fired` payload passes control to the opponent; the server starts a new turn timer.
  7. **Turn timer expires:** server broadcasts `turn_expired`; both clients show "[Player] ran out of time — turn skipped" and control passes to the opponent with no shot fired.
  8. Steps 3–7 repeat until the game ends.
- **Architectural pattern:** Request/response for shots (POST); SSE for broadcasting results to both players in real time; server-authoritative turn timer broadcast via `timer_tick` so both tabs always display the same countdown.
- **Supports:** F6, F7, NF1, NF2, NF3, NF5

---

### Flow 5 — Game over and return to lobby
- **Purpose:** Declare a winner, persist updated stats, and route both players back to the lobby.
- **Trigger:** A `shot_fired` event resolves the final ship — all 5 of one player's ships are sunk.
- **Walkthrough:**
  1. Server detects that the shot sank the last remaining ship. It emits `shot_fired` first so both clients can update the grid and show the final sunk notification, then immediately emits `game_over` (`winner_id`, `loser_id`).
  2. Server marks the game `finished` with the winner's ID and increments `wins` + `games_played` for the winner and `losses` + `games_played` for the loser.
  3. Both clients receive `game_over` and display a banner: winner sees "You won!", loser sees "You lost".
  4. Each player clicks "Return to lobby" and is routed back. The lobby list has no stale entry to clean up — the game was already removed from `waiting` when it was joined in Flow 2.
- **Architectural pattern:** SSE for the `game_over` push (keeps the game-ending sequence — shot then result — as a single ordered stream); stat update handled server-side synchronously before the event is emitted so stats are durable before either client sees the result; lobby navigation is a client-initiated route change requiring no server call.
- **Supports:** F8, F9, NF1

---

## Key Design Decisions

#### 1. SSE over WebSockets for real-time communication
Server-Sent Events are used for all server→client push instead of WebSockets. Clients initiate all actions (shots, placement, ready) via standard HTTP POST requests; the server pushes state updates via SSE.

**Tradeoff:** SSE is unidirectional (server→client only), which maps cleanly to a turn-based game where clients never need to push unsolicited data — actions always go through explicit POST endpoints. This simplifies the server (no socket lifecycle management, no upgrade handshake) and the client (native `EventSource` API, auto-reconnect built in). The cost: if we ever needed true bidirectional streaming (e.g. live cursor positions, voice), SSE would need to be replaced. For a turn-based game on localhost, this cost is zero.

**Authority rule:** The SSE stream is the single source of truth; HTTP response bodies are used only to detect 4xx errors. A client never applies state from an HTTP response body — it waits for the corresponding SSE event, which arrives for both players including the actor.

#### 2. Server-authoritative turn timer
The countdown timer is driven and broadcast by the server, not calculated independently by each client.

**Tradeoff:** Both tabs always show the same countdown value, eliminating drift between tabs even if one tab's JS event loop is throttled. The cost is a `timer_tick` SSE event every second per active game, which is negligible on localhost but would matter at scale. The alternative (each client calculates from a shared start timestamp) risks visible drift and makes forfeiture logic harder to trust.

**Reset semantics:** Each time `current_turn` changes (shot fired or turn expired), the server cancels the existing timer and starts a fresh one at the full preset value. The first tick fires immediately at that full value.

#### 3. Ship placement is client-side until submission
Ship dragging, rotation, and hover preview are computed entirely in the browser. The server is not called until the player submits their final placement.

**Tradeoff:** Placement interaction is instant and requires no network round-trips, keeping the UI snappy during the most interactive phase. The cost is that intermediate placement state cannot be recovered if the tab crashes before submission — the player would need to re-place their ships. Given the short placement window (30–60s) and localhost context, this is acceptable.

**State threading:** The final `ships` array is passed forward as a prop into the battle phase; `App.tsx` holds it as `placedShips` state and passes it down. There is no server endpoint to retrieve placed ships — the fleet grid in battle is rendered from this in-memory array plus incoming `shot_fired` events.

#### 4. Shared Zod schemas as the frontend/backend contract

All API request and response shapes are defined once as Zod schemas in `shared/schemas.ts` and imported by both `server/` and `app/`. TypeScript types are inferred from the schemas (`z.infer<typeof Schema>`) rather than defined separately.

**Tradeoff:** The TypeScript compiler cannot typecheck across an HTTP boundary — each side compiles independently, so a renamed field on the server compiles clean while silently breaking the frontend. Zod closes this gap: the schema is the single source of truth, and any mismatch between what the server produces and what the schema declares throws at runtime before the response is sent. Agents touching either side must update the shared schema, which surfaces the contract change to both. The cost is a `shared/` directory resolved via a `@shared` alias: `resolve.alias` + `tsconfig paths` in `app/`; `tsconfig paths` + `tsconfig-paths` for tsx in `server/`. No workspace packages; no relative `../../shared` imports in source files.

#### 5. Client navigation via view-state enum, not a router
Navigation between screens is a `view` enum in `App.tsx` (`'welcome' | 'lobby' | 'placement' | 'battle' | 'gameover'`). No `react-router` or URL-based routing. Route parameters (`gameId`, `playerId`, `placedShips`) are held as state in `App` and passed as props. **PR1 seeds the complete enum and a placeholder render switch for all five views** (welcome is live; the other four render named placeholders). Every later PR fills in only its own `case` and never adds an enum member, so parallel PRs cannot collide on the switch. PR3's placement screen is reached for standalone testing by setting the initial `view` to `'placement'` in dev — there is no separate route constant to add and later remove.

#### 6. Shared geometry helper for ship cell calculation
A pure `getOccupiedCells(ship)` function in `shared/geometry.ts` is the single implementation of "origin + size + orientation → occupied cells." For `H`, the ship extends toward higher column indices; for `V`, toward higher row indices (downward). Both the client (PR3 placement validation) and server (PR4 place validation, PR5 shot resolution) import this function — no agent re-derives the formula inline.

---

## PR Plan

Each PR is a **vertical slice**: it delivers a complete, working capability a real user can exercise the moment it ships. PRs build on each other incrementally — each one extends what the previous made possible, never retracts it.

> **Rule:** "Foundation" or "boilerplate" PRs are an antipattern. When setup is unavoidable, it ships inside the first PR that needs it. NF6 (single-machine simplicity) is a global posture — not a feature any single PR claims.

### Overview

| PR | User outcome | New DB table | New / extended schemas | Parallel with |
|---|---|---|---|---|
| 1 | Register and reach the lobby | `players` | `POST /api/players` req + resp | — |
| 2 | Create, browse, join, and cancel games | `games` | `POST /api/games`, `GET /api/games`, `/join`, `DELETE`; lobby SSE; game SSE + `player_joined` | PR 3 |
| 3 | Arrange a fleet on the grid | — | none (adds `shared/geometry.ts`) | PR 2 |
| 4 | Timed placement handshake (timer, ready, phase start) | `ships` | `POST /place`, `POST /ready`; game SSE extended with `timer_tick`, `player_ready`, `battle_start`, `placement_expired` | — |
| 5 | Fire shots, see results, turns alternate | `shots` | `POST /shot`; game SSE extended with `shot_fired`, `turn_expired` | — |
| 6 | Win or lose; stats persist; return to lobby | — | `game_over` SSE event (extended with `winner`/`loser` stat objects) | — |

---

#### PR 1 — Welcome screen + player registration

**Depends on:** none

**User outcome:** A visitor types a name, clicks "Play", and lands on the lobby. Returning with the same name retrieves the existing record. Stats persist across server restarts.

**Key changes:**
- Creates the `players` table and `POST /api/players` (upsert by name).
- Bootstraps all shared scaffolding needed by every downstream PR: the `shared/` directory with `@shared` alias, Zod validation layer, `{ error }` error envelope, and `better-sqlite3` + `schema.sql` startup.
- Seeds the complete `view` enum in `App.tsx` (`’welcome’ | ‘lobby’ | ‘placement’ | ‘battle’ | ‘gameover’`) with named placeholders for every view except welcome. Later PRs fill in their own `case` only — no enum member is ever added again, so parallel PRs cannot collide on the switch.

**Satisfies:** F1 AC1–5 · F9 AC1–2 *(shape and persistence; win/loss counters wired in PR 6)* · NF4 AC1

---

#### PR 2 — Lobby: create, browse, join, cancel
*(parallel with PR 3)*

**Depends on:** PR 1 · **Parallel with:** PR 3

**User outcome:** Player A creates a game (Quick 30s or Casual 60s) and waits in a holding card. Player B sees the row, clicks Join, and both players navigate to the placement screen simultaneously — creator via a `player_joined` SSE event, joiner via the HTTP response. Player A can cancel from the holding state; the game disappears from all open lobby views. The lobby list stays in sync across tabs in real time.

**Key changes:**
- Creates the `games` table and all lobby endpoints: `GET /api/games`, `POST /api/games`, `POST /api/games/:gameId/join`, `DELETE /api/games/:gameId`.
- Starts up the lobby SSE stream (`GET /api/lobby/events`) — pushes `game_created` and `game_removed` to all connected lobby tabs.
- Starts up the game SSE stream (`GET /api/games/:gameId/events`) with the `player_joined` event and replay-on-reconnect. *(PR 4 extends this stream with `timer_tick`, `player_ready`, `battle_start`, and `placement_expired`.)*
- Fills the `lobby` case in `App.tsx`; routes the join flow to `view=’placement’` (the placeholder from PR 1). *(PR 4 swaps the placeholder for PR 3’s real component.)*
- Introduces the 409 client handler: on a 409, discard the response and take no UI action — the correct state arrives via the SSE stream. *(PR 4 reuses this for placement endpoints.)*

**Coordinate with PR 3:** Both PRs may touch `shared/schemas.ts` — keep edits on separate lines. The view-switch cases are disjoint (PR 2 owns `lobby`, PR 3 owns `placement`) — no enum members to add.

**Satisfies:** F2 AC1–2 · F3 AC1–5 · F5 AC1 · NF1 AC1–2 *(join case)* · NF2 AC2 · NF5 AC4–5

---

#### PR 3 — Ship placement interaction
*(parallel with PR 2)*

**Depends on:** PR 1 · **Parallel with:** PR 2

**User outcome:** A player arranges their fleet entirely in the browser — click a ship in the palette to select it, hover over the grid for a snapped green/red preview, press `R` to rotate, click to place, click a placed ship to pick it back up, or hit Reset to start over. No server calls until the fleet is submitted.

**Key changes:**
- Fills the `placement` case in `App.tsx` with the interactive placement UI. *(For standalone dev testing, set the initial `view` to `’placement’`; PR 4 removes this shortcut.)*
- Adds `shared/geometry.ts` with `getOccupiedCells(ship)` — the single formula for origin + orientation → occupied cells. Both sides of the stack import this; no agent re-derives it inline. *(PR 4 and PR 5 use it server-side.)*

**Coordinate with PR 2:** see note under PR 2.

**Satisfies:** F4 AC1–7

---

#### PR 4 — Placement handshake: timer, ready, phase transition
*(sequential after PRs 2 and 3)*

**Depends on:** PRs 2 and 3

**User outcome:** Both players see a live synchronized countdown the moment the second player joins. "I’m ready!" becomes enabled once all 5 ships are placed; clicking it submits the fleet and locks the UI. Both tabs enter the battle phase when both players are ready, or return to the lobby with a dismissible message if time expires.

**Key changes:**
- Adds `POST /api/games/:gameId/place` and `POST /api/games/:gameId/ready`.
- Extends the game SSE stream with `timer_tick`, `player_ready`, `battle_start`, and `placement_expired`. Extends on-connect replay: immediately after `player_joined`, the server sends the current `timer_tick` so the joiner’s tab never starts from an unknown value.
- Builds the **server-authoritative resettable countdown timer** (cancel + restart at the full preset on every phase or turn transition, per KDD #2). PR 5 reuses this for the per-turn battle timer — building it placement-only here would force a refactor there.
- Wires PR 3’s placement component into the live join flow and removes the dev initial-view shortcut.

**Satisfies:** F5 AC2–6 · NF1 AC1–2 *(placement actions; join case from PR 2)* · NF2 AC1 · NF3 AC4 · NF5 AC1

---

#### PR 5 — Battle phase: turns + shot results
*(sequential after PR 4)*

**Depends on:** PR 4

**User outcome:** Players alternate firing shots. Hits show red, misses show a neutral dot, sunk ships are outlined with a "[Ship name] sunk!" notification. Both grids update in real time. If a player’s turn timer expires, their turn is skipped with a notification and control passes to the opponent.

**Key changes:**
- Adds `POST /api/games/:gameId/shot` with full validation: correct turn, in-bounds, cell not already fired.
- Extends the game SSE stream with `shot_fired` (includes hit/miss/sunk result and `next_turn`) and `turn_expired`.
- Reuses the resettable timer from PR 4 for the per-turn countdown — no new timer machinery.
- Renders the two-grid battle layout: fleet grid (own ships + incoming hits) on the left, targeting grid (shots at opponent) on the right.

> **Note:** The game does not end in this PR — PR 6 handles that. When the last ship is sunk, freeze the board on the final `shot_fired` event with no turn pass and no new timer. Do not hand control to a defeated player.

**Satisfies:** F6 AC1–5 · F7 AC1–5 · NF1 AC1–3 *(AC1–2 must not regress from PR 4)* · NF2 AC1–2 *(AC1 must not regress)* · NF3 AC1–3, AC5 · NF5 AC2–3

---

#### PR 6 — Game over + stats
*(sequential after PR 5)*

**Depends on:** PR 5

**User outcome:** When a fleet is fully destroyed, both players see a result screen — winner sees "You won!", loser sees "You lost" — each with subtitle copy and updated win/loss stats. A "Return to lobby" button routes each player back.

**Key changes:**
- Server detects the final sunk ship after `shot_fired` and immediately emits `game_over` with `winner_id`, `loser_id`, and fresh stat objects for both players (stats are persisted before the event is emitted, so the client never needs a separate fetch).
- Marks the game `finished`, increments `wins` + `games_played` for the winner and `losses` + `games_played` for the loser.
- Renders the `gameover` view in `App.tsx`, populated from the `game_over` SSE payload.

**Satisfies:** F8 AC1–5 · F8 AC6 *(by construction — must not regress)* · F9 AC1–2 *(counters incremented)*

---
## Decision Records

Numbered log of key decisions made by agents during implementation. Entries are appended in chronological order of discovery.

| # | Agent | Problem Statement | Severity | Decision | Tradeoffs | Approved |
|---|---|---|---|---|---|---|
| 1 | backend-2 | Spec defines status codes for wrong game status (409), wrong player/auth (403), and bad input (400), but is silent on the case where `creator_id` (on `POST /api/games`) or `player_id` (on `POST /api/games/:gameId/join`) references a player that does not exist in the `players` table. | low | Return `400 { error: "Unknown player" }` when the referenced player_id is not found in the `players` table. | The server must read the player's name + stats to populate the `game_created` and `player_joined` SSE payloads, so the lookup is unavoidable; the only question is how to handle a miss. Reuses the existing NF4 `{ error }` envelope — no new machinery. Treated as input validity (400), consistent with NF3 AC5 ordering (the player reference is part of the request body). | Yes |

---

## Known Issues

Numbered log of known bugs and defects discovered during implementation. Entries are appended in chronological order of discovery.

| # | Title | Agent | Severity | Problem Statement | How to Reproduce | Status |
|---|---|---|---|---|---|---|
| 1 | Initial lobby fetch never renders pre-existing waiting games | frontend-2 | critical | `useLobbySSE(initialGames)` seeds its state with `useState<Game[]>(initialGames)`, which React only honors on the first render. `LobbyView` mounts with `initialGames = []`, fetches `GET /api/games`, and calls `setInitialGames(loaded)` after the fetch resolves — but the hook ignores the changed prop, so the fetched list never enters the rendered `games`. Only games arriving via live `game_created` SSE after mount appear. Breaks F2 AC1 (lobby must list all `waiting` games) and the core join flow of Flow 2: a player opening the lobby cannot see or join a game that was created before their tab connected. | 1. Tab A: register, create a game (it enters `waiting`). 2. Tab B: register, open the lobby. 3. Expected: Tab B's lobby lists Tab A's game. Actual: Tab B's lobby is empty — the `game_created` event fired before B's EventSource connected, and the initial `GET /api/games` result is dropped. B can never join A's game. | Resolved |

