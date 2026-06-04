### Battleship — Multiplayer Browser Game

## Goal

A two-player Battleship game playable across two browser tabs on the same machine. Players register with a name, find each other in a lobby, place their fleets under a countdown, then alternate firing shots until one fleet is destroyed. All real-time state is pushed via SSE; no page reloads required after the initial load.


## Out of Scope

- Authentication, passwords, or sessions beyond a name entry
- Spectator mode
- Chat or emotes
- More than two players per game
- AI / single-player mode

## Assumptions

- Both players are on the same machine using the same localhost server
- Desktop only; no mobile or responsive layout required
- The placement timer and per-turn timer use the same preset value

## Target Personas

- **Player A (game creator):** Opens the app, enters their name, creates a game with a difficulty preset, and waits in the lobby for an opponent.
- **Player B (joiner):** Opens the app in a second tab, enters their name, sees Player A's open game in the lobby list, and joins it.

---

## Requirements

### Functional (ranked by priority)

#### F1 — Welcome screen and player registration
As a new visitor, I want to enter my name before entering the lobby so that my identity and stats are tracked across games.

**Acceptance criteria:**
1. The welcome screen is shown every time the app is opened
2. The welcome screen has a single text input for name and a "Play" button
3. "Play" is disabled until at least 1 non-whitespace character is entered
4. Submitting creates or retrieves the player record on the server
5. After submit, the player is taken to the lobby

#### F2 — Lobby: game list
As a player, I want to see available games in the lobby so that I can choose one to join.

**Acceptance criteria:**
1. The lobby lists only games with status `waiting`; in-progress and finished games are not shown
2. Each row shows: creator name, win/loss record, win rate, and difficulty preset (Quick / Casual)

#### F3 — Lobby: game creation and joining
As a player, I want to create a new game or join an existing one so that I can find an opponent.

**Acceptance criteria:**
1. A "Create Game" button opens a modal to choose a preset (Quick 30s / Casual 60s) and confirm
2. Creating a game puts the creator into a "Waiting for opponent..." holding state
3. A "Join" button on any open game row immediately starts the placement phase for both players
4. The lobby list updates in real time when games are created or joined

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

**Acceptance criteria:**
1. The fleet grid is 10×10; columns are labeled `a`–`j`, rows `1`–`10`
2. Clicking a ship in the palette selects it and shows a hover preview snapped to the grid, anchored from the ship's top-left cell
3. Once a ship is placed, it is removed from the palette
4. Valid placement = green highlight; invalid = red highlight (rules: H/V only, must fit in bounds, no overlap; ships may touch)
5. Orientation can be toggled via a "Rotate" button in the palette or the `R` key; toggling updates the live preview immediately
6. Clicking an already-placed ship on the fleet grid picks it back up into the cursor
7. A "Reset" button clears all placed ships and repopulates the palette

#### F5 — Ship placement: phase flow
As a player, I want the placement phase to be time-limited and coordinated with my opponent so that the game starts fairly.

**Acceptance criteria:**
1. Both players enter the placement phase simultaneously when the second player joins
2. A countdown timer (from the game's preset value) is visible and synchronized across both tabs
3. The "I'm ready!" button is disabled until all 5 ships are placed
4. Clicking "I'm ready!" locks placement, disables and visually highlights the button (no text change), and notifies the server
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
2. Both players see a game-over banner: winner sees "You won!", loser sees "You lost"
3. The game record is marked `finished` with the winner ID
4. Win/loss stats for both players are updated
5. A "Return to lobby" button takes the player back to the lobby
6. The finished game is removed from the lobby list

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

#### NF4 — Contract: uniform error envelope
All endpoints must return errors in a consistent shape so the client can handle any failure without endpoint-specific parsing logic.

**Acceptance criteria:**
1. All 4xx and 5xx responses return `{ "error": string }` as the JSON body

#### NF5 — Consistency: state machine enforcement
The server must reject actions that are invalid for the current game phase so that out-of-order or replayed requests cannot corrupt shared state.

**Acceptance criteria:**
1. Calling `/place` or `/ready` when game status is not `placing` returns 409
2. Calling `/shot` when game status is not `battle` returns 409
3. Calling any action endpoint on a `finished` game returns 409
4. Calling `/join` on a game that is not `waiting` returns 409

#### NF6 — Fault tolerance: connection loss
If the real-time connection drops, the client must surface a visible error rather than silently presenting stale state, so a player is never stuck acting on outdated information.

**Acceptance criteria:**
1. If the real-time connection is lost, the UI shows a non-dismissible banner: "Connection lost — please refresh"
2. The client does not attempt to reconnect automatically

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

One entry per endpoint. These are the interface contracts — the request and response shapes that backend commits to serve and frontend commits to consume. Both sides build against these independently.

All 4xx and 5xx responses return `{ "error": string }`.

---

#### `POST /api/players`
Creates or retrieves a player record by name. If a player with the given name already exists, the existing record is returned.

**Request**
```ts
{
  name: string  // trimmed before lookup; must contain at least 1 non-whitespace character
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
  win_rate: number  // wins / games_played; 0 if games_played is 0
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

`game_removed` — a game left `waiting` status (joined or expired); remove it from the lobby list
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

#### `GET /api/games/:gameId/events`
SSE stream for all game-specific events during placement and battle phases. Both players connect on entering placement; the creator connects immediately after creating the game to receive `player_joined`.

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

`timer_tick` — one-second tick broadcast every second during the placement countdown and between turns in battle
```ts
{
  seconds_remaining: number
}
```

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

`game_over` — all ships of one player are sunk; game is finished
```ts
{
  winner_id: string
  loser_id: string
}
```

---

#### `POST /api/games/:gameId/place`
Submits the player's final ship placements. Must be called before `/ready`. Server validates that all 5 ships are present, within bounds, and non-overlapping.

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
- **Purpose:** Establish player identity before entering the lobby
- **Trigger:** User opens the app
- **Walkthrough:**
  1. Welcome screen renders with name input and disabled "Play" button
  2. User types their name; "Play" enables
  3. User submits → `POST /api/players` → server returns player record
  4. User is routed to the lobby
- **Architectural pattern:** Request/response — one-shot, no streaming needed
- **Supports:** F1, F9

### Flow 2 — Lobby and game creation
- **Purpose:** Two players find each other and start a game
- **Trigger:** Player arrives in the lobby
- **Walkthrough:**
  1. Lobby fetches open games via `GET /api/games` on mount
  2. Player A subscribes to `GET /api/lobby/events` (SSE)
  3. Player A clicks "Create Game", selects Quick or Casual, confirms → `POST /api/games`
  4. Player A sees "Waiting for opponent..." state
  5. Player B arrives in a second tab, sees Player A's game in the list (pushed via `game_created` SSE event)
  6. Player B clicks "Join" → `POST /api/games/:gameId/join`
  7. Both tabs transition to the placement phase
- **Architectural pattern:** SSE for lobby list updates; request/response for create/join actions
- **Supports:** F2, F3

### Flow 3 — Ship placement
- **Purpose:** Both players secretly arrange their fleets before battle
- **Trigger:** Second player joins; both tabs receive `player_joined` SSE event
- **Walkthrough:**
  1. Both tabs render the placement UI: fleet grid + ship palette + timer
  2. Server starts the countdown and broadcasts `timer_tick` events every second via SSE
  3. Each player places their 5 ships via click interactions; the server is not called until submission
  4. When all 5 ships are placed, "I'm ready!" activates
  5. Player clicks "I'm ready!" → `POST /api/games/:gameId/place` (ships) + `POST /api/games/:gameId/ready`
  6. Button becomes disabled and highlighted; both tabs receive `player_ready` event
  7. When both players are ready → server broadcasts `battle_start`; both tabs transition to battle phase
  8. If timer reaches 0 before both are ready → server broadcasts `placement_expired`; both tabs show termination message and return to lobby
- **Architectural pattern:** SSE for timer sync and readiness coordination; request/response for placement submission
- **Supports:** F4, F5

### Flow 4 — Battle phase
- **Purpose:** Players alternate firing shots until one fleet is destroyed
- **Trigger:** `battle_start` SSE event received by both tabs
- **Walkthrough:**
  1. Both tabs render fleet grid (left) + targeting grid (right) + turn banner with countdown
  2. Server starts the turn timer and broadcasts `timer_tick` events
  3. Active player clicks a cell on their targeting grid → `POST /api/games/:gameId/shot`
  4. Server validates the shot, updates board state, broadcasts `shot_fired` to both tabs
  5. Both tabs update: targeting grid reflects hit/miss; fleet grid reflects incoming damage
  6. If the shot sinks a ship, the ship's full outline is revealed on the targeting grid and a "[Ship] sunk!" notification is shown
  7. Turn passes; server resets the timer and broadcasts the next `timer_tick` cycle
  8. If the active player's timer expires → server broadcasts `turn_expired`; both tabs show "[Player] ran out of time — turn skipped"; turn passes
  9. If all ships in one board are sunk → server broadcasts `game_over`; both tabs render the game-over screen
- **Architectural pattern:** SSE for all state pushes; request/response for shot submission
- **Supports:** F6, F7, F8

### Flow 5 — Game over and return to lobby
- **Purpose:** Conclude the game and update player records
- **Trigger:** `game_over` SSE event received by both tabs
- **Walkthrough:**
  1. Both tabs replace the battle UI with a game-over banner (winner / loser message)
  2. Server updates win/loss stats for both players
  3. Game status is set to `finished` and removed from the lobby list
  4. Player clicks "Return to lobby" → routed back to the lobby
- **Architectural pattern:** Request/response for stat updates (triggered server-side at game-over); routing for navigation
- **Supports:** F8, F9

---

## Key Design Decisions

#### 1. SSE over WebSockets for real-time communication
Server-Sent Events are used for all server→client push instead of WebSockets. Clients initiate all actions (shots, placement, ready) via standard HTTP POST requests; the server pushes state updates via SSE.

**Tradeoff:** SSE is unidirectional (server→client only), which maps cleanly to a turn-based game where clients never need to push unsolicited data — actions always go through explicit POST endpoints. This simplifies the server (no socket lifecycle management, no upgrade handshake) and the client (native `EventSource` API, auto-reconnect built in). The cost: if we ever needed true bidirectional streaming (e.g. live cursor positions, voice), SSE would need to be replaced. For a turn-based game on localhost, this cost is zero.

#### 2. Server-authoritative turn timer
The countdown timer is driven and broadcast by the server, not calculated independently by each client.

**Tradeoff:** Both tabs always show the same countdown value, eliminating drift between tabs even if one tab's JS event loop is throttled. The cost is a `timer_tick` SSE event every second per active game, which is negligible on localhost but would matter at scale. The alternative (each client calculates from a shared start timestamp) risks visible drift and makes forfeiture logic harder to trust.

#### 3. Ship placement is client-side until submission
Ship dragging, rotation, and hover preview are computed entirely in the browser. The server is not called until the player submits their final placement.

**Tradeoff:** Placement interaction is instant and requires no network round-trips, keeping the UI snappy during the most interactive phase. The cost is that intermediate placement state cannot be recovered if the tab crashes before submission — the player would need to re-place their ships. Given the short placement window (30–60s) and localhost context, this is acceptable.

#### 4. Two difficulty presets (Quick 30s / Casual 60s) over a free-form timer
The timer is fixed at one of two named presets rather than a slider or arbitrary number input.

**Tradeoff:** Presets communicate intent ("Quick = harder") and prevent pathological values (0s, 3600s). The cost is less flexibility. For a local concept project this is the right call — no need to validate or explain arbitrary timer values.

---

## PR Plan

#### PR 1 — Foundation: player registration + lobby shell
- **User-visible change:** A player can open the app, enter their name, and see a lobby screen (even if empty)
- **Scope:** `POST /api/players`, `GET /api/games`, `GET /api/lobby/events` SSE endpoint; Welcome screen component; Lobby shell with empty state; player and game stores
- **Satisfies:** F1, F2 (lobby renders, SSE connected)
- **Depends on:** none

#### PR 2 — Lobby: game creation and joining _(after PR 1)_
- **User-visible change:** Player A can create a game with a preset; Player B sees it in the lobby list and can join; both transition to a "Game starting…" placeholder
- **Scope:** `POST /api/games`, `POST /api/games/:gameId/join`; Create Game modal; lobby list rows with player stats; join button; real-time lobby updates via SSE
- **Satisfies:** F2, F3, F9 (stats shown in lobby)
- **Depends on:** PR 1

#### PR 3 — Placement phase _(after PR 2)_
- **User-visible change:** Both players can place their ships, rotate them, reset the board, and click "I'm ready!"; the placement timer counts down live; expired timer returns both to the lobby
- **Scope:** `POST /api/games/:gameId/place`, `POST /api/games/:gameId/ready`, `GET /api/games/:gameId/events` (placement events); FleetGrid component; ShipPalette component; hover preview + R key rotation; server-side placement timer; placement expiry logic
- **Satisfies:** F4, F5, NF1 (SSE for timer)
- **Depends on:** PR 2

#### PR 4 — Battle phase _(after PR 3)_
- **User-visible change:** Players alternate firing shots; hits/misses update live on both tabs; sunk ships reveal; forfeited turns are announced; turn timer counts down
- **Scope:** `POST /api/games/:gameId/shot`; TargetingGrid component; battle layout (two grids + banner); shot result rendering (hit/miss/sunk); server-side turn timer; turn expiry logic; SSE shot and timer events
- **Satisfies:** F6, F7, NF1 (shot SSE), NF3 (input validation)
- **Depends on:** PR 3

#### PR 5 — Game over + stats _(parallel with PR 4, depends on PR 3)_
- **User-visible change:** Game-over banner with winner/loser message; stats updated; "Return to lobby" routes back correctly
- **Scope:** `game_over` SSE handling; GameOver component; stat update logic on server; lobby cleanup on game finish
- **Satisfies:** F8, F9 (stats updated at game end)
- **Depends on:** PR 3 _(can be developed in parallel with PR 4 once the SSE event contract is agreed)_

---

## Open Questions

_None — all decisions have been resolved in conversation. The spec is ready for implementation._
