### Battleship — Multiplayer Browser Game

## Goal

A two-player Battleship game playable across two browser tabs on the same machine. Players register with a name, find each other in a lobby, place their fleets under a countdown, then alternate firing shots until one fleet is destroyed. All real-time state is pushed via SSE; no page reloads required after the initial load.


## Out of Scope

- Authentication, passwords, or sessions beyond a name entry
- Spectator mode
- Chat or emotes
- Persistent database (in-memory storage is sufficient)
- More than two players per game
- AI / single-player mode

## Assumptions

- Both players are on the same machine using the same localhost server
- In-memory storage on the server is acceptable — data resets on server restart
- Desktop-first but mobile-responsive layout required
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
- [ ] On first visit (or when no player name is stored in localStorage), the welcome screen is shown
- [ ] The welcome screen has a single text input for name and a "Play" button
- [ ] "Play" is disabled until at least 1 non-whitespace character is entered
- [ ] Submitting creates or retrieves the player record on the server and stores the player ID in localStorage
- [ ] After submit, the player is taken to the lobby
- [ ] If a player ID already exists in localStorage, the welcome screen is skipped and the player goes directly to the lobby

#### F2 — Lobby: game list and creation
As a player in the lobby, I want to see open games and create my own so that I can find an opponent.

**Acceptance criteria:**
- [ ] The lobby lists all games with status `waiting` (open for a second player to join)
- [ ] Each row in the list shows: creator name, win/loss record, win rate, and difficulty preset (Quick / Casual)
- [ ] A "Create Game" button opens a modal to choose a preset (Quick 30s / Casual 60s) and confirm
- [ ] Creating a game adds it to the list for other players and puts the creator into a "Waiting for opponent..." holding state
- [ ] A "Join" button on any open game row immediately starts the placement phase for both players
- [ ] Games that are in-progress or finished are not shown in the lobby list
- [ ] The lobby list updates in real time via SSE when games are created or joined

#### F3 — Ship placement phase
As a player, I want to place my 5 ships on my fleet grid before the game begins so that the battle can start.

**Fleet:**
| Ship | Size |
|---|---|
| Carrier | 5 cells |
| Battleship | 4 cells |
| Cruiser | 3 cells |
| Submarine | 3 cells |
| Destroyer | 2 cells |

**Acceptance criteria:**
- [ ] The fleet grid is 10×10; columns are labeled `a`–`j`, rows `1`–`10`
- [ ] Both players enter the placement phase simultaneously when the second player joins
- [ ] A countdown timer (from the game's preset value) is visible and synchronized via SSE across both tabs
- [ ] The ship palette lists all 5 ships; placed ships are removed from the palette
- [ ] Clicking a ship in the palette selects it; the selected ship follows the cursor as a hover preview snapped to grid cells
- [ ] The preview anchors from the ship's top-left cell; valid placement = green highlight, invalid = red highlight
- [ ] Ships may be placed horizontally or vertically only — no diagonal
- [ ] Ships must fit entirely within the grid boundaries; out-of-bounds preview shows red
- [ ] Ships may not overlap each other; overlapping preview shows red
- [ ] Ships may touch each other (no buffer zone required)
- [ ] Orientation can be toggled via a "Rotate" button in the palette or the `R` key; toggling updates the live preview immediately
- [ ] Clicking a valid cell places the ship; clicking an invalid cell does nothing
- [ ] Clicking an already-placed ship on the fleet grid picks it back up into the cursor (returns it to selected state)
- [ ] A "Reset" button clears all placed ships and repopulates the palette
- [ ] The "I'm ready!" button is disabled until all 5 ships are placed
- [ ] Clicking "I'm ready!" locks placement, disables and visually highlights the button (no text change), and notifies the server
- [ ] If both players click "I'm ready!" before the timer expires, the battle phase begins immediately
- [ ] If the timer expires before both players have clicked "I'm ready!", the game is terminated: no winner is recorded, both players are returned to the lobby with a dismissible message explaining what happened

#### F4 — Battle phase: firing shots
As a player, I want to fire shots at the opponent's grid on my turn so that I can sink their fleet.

**Acceptance criteria:**
- [ ] The battle phase shows two grids side by side: fleet grid (left) and targeting grid (right)
- [ ] The game creator takes the first turn
- [ ] A prominent banner shows "Your turn" or "Waiting for opponent..." with a live countdown
- [ ] On each turn, the active player fires exactly one shot by clicking a cell on the targeting grid
- [ ] The active player can click any un-fired cell on the targeting grid to fire a shot
- [ ] Fired cells on the targeting grid are non-interactive for the rest of the game
- [ ] A hit is marked in red; a miss is marked with a neutral indicator (e.g. white dot)
- [ ] When all cells of an opponent's ship are hit, the ship is sunk: its full outline is revealed on the targeting grid and a "[Ship name] sunk!" notification is shown
- [ ] Incoming hits and misses from the opponent are shown on the player's fleet grid in real time via SSE
- [ ] If a player's turn timer expires, their turn is forfeited: both players see "[Player] ran out of time — turn skipped" and the turn passes to the opponent with no shot fired
- [ ] The targeting grid is non-interactive when it is not the player's turn

#### F5 — Game over
As a player, I want to see a clear result when the game ends so that I know who won and can return to the lobby.

**Acceptance criteria:**
- [ ] The game ends when all 5 ships in one player's fleet are sunk; the opponent who sunk them wins
- [ ] Both players see a game-over banner: winner sees "You won!", loser sees "You lost"
- [ ] Win/loss stats for both players are updated on the server immediately
- [ ] A "Return to lobby" button takes the player back to the lobby
- [ ] The finished game is removed from the lobby list

#### F6 — Player stats
As a player, I want my win/loss record to persist across games in the same session so that the lobby shows accurate stats.

**Acceptance criteria:**
- [ ] Each player record tracks: name, games played, wins, losses, win rate
- [ ] Stats are updated at game-over (win/loss increment)
- [ ] Stats are shown in the lobby game list (opponent's stats) and on the welcome screen return (player's own stats if they revisit)
- [ ] Stats reset on server restart (in-memory storage is acceptable)

---

### Non-functional

#### NF1 — Real-time: SSE for all live state
All multi-tab coordination (lobby updates, placement timer, turn changes, shot results, game-over) must be pushed via SSE, not polling.

**Acceptance criteria:**
- [ ] Each active tab holds one SSE connection to `/api/events/:gameId` (or `/api/lobby/events` for lobby)
- [ ] Turn timer countdown is driven by the server and broadcast via SSE so both tabs show the same value
- [ ] Latency from a shot POST to both tabs reflecting the result is imperceptible under normal localhost conditions

#### NF2 — Responsive layout
The game must be usable on mobile screen sizes without horizontal scrolling.

**Acceptance criteria:**
- [ ] Grids, palette, and controls reflow for screens as narrow as 375px
- [ ] Touch targets (cells, buttons) are at minimum 44×44px on mobile
- [ ] The two-grid battle layout stacks vertically on narrow screens

#### NF3 — Input safety
The server must not crash or corrupt state from malformed client input.

**Acceptance criteria:**
- [ ] Out-of-bounds shot coordinates are rejected with a 400 response
- [ ] Firing on an already-fired cell is rejected with a 400 response
- [ ] Acting out of turn is rejected with a 403 response
- [ ] Server errors surface a user-readable message and never crash the handler

---

## Data Models

### Database Schemas

#### `players`
Tracks registered players and their lifetime stats.
**Referenced by:** F1, F2, F5, F6

| `id` | `name` | `gamesPlayed` | `wins` | `losses` |
|---|---|---|---|---|
| `string, uuid` | `string, required` | `number, default 0` | `number, default 0` | `number, default 0` |

**Indices:**
- `id` — primary key, looked up on every request
- `name` — uniqueness check on registration

---

#### `games`
Represents a single game instance from creation through completion.
**Referenced by:** F2, F3, F4, F5

| `id` | `status` | `preset` | `creatorId` | `joinerId` | `currentTurn` | `createdAt` |
|---|---|---|---|---|---|---|
| `string, uuid` | `'waiting' \| 'placing' \| 'battle' \| 'finished'` | `'quick' \| 'casual'` | `string, playerId` | `string \| null, playerId` | `string \| null, playerId` | `number, timestamp` |

---

#### `boards`
One board per player per game — tracks ship placement and received shots.
**Referenced by:** F3, F4, F5

| `gameId` | `playerId` | `ships` | `shots` |
|---|---|---|---|
| `string` | `string` | `Ship[]` | `Shot[]` |

**`Ship`**
| `type` | `size` | `orientation` | `origin` | `hits` |
|---|---|---|---|---|
| `'carrier' \| 'battleship' \| 'cruiser' \| 'submarine' \| 'destroyer'` | `number` | `'H' \| 'V'` | `{ col: number, row: number }` | `number` |

**`Shot`** (shots fired BY the opponent AT this board)
| `col` | `row` | `hit` |
|---|---|---|
| `number` | `number` | `boolean` |

---

### API Schemas

#### `POST /api/players`
Register a new player or retrieve an existing one by name.

**Request**
```ts
{ name: string }
```

**Response**
```ts
{
  id: string
  name: string
  gamesPlayed: number
  wins: number
  losses: number
}
```

---

#### `GET /api/games`
Return all games with status `waiting`.

**Response**
```ts
{
  games: {
    id: string
    preset: 'quick' | 'casual'
    creator: { id: string, name: string, gamesPlayed: number, wins: number, losses: number }
  }[]
}
```

---

#### `POST /api/games`
Create a new game.

**Request**
```ts
{ creatorId: string, preset: 'quick' | 'casual' }
```

**Response**
```ts
{ gameId: string }
```

---

#### `POST /api/games/:gameId/join`
Join an open game as the second player.

**Request**
```ts
{ playerId: string }
```

**Response**
```ts
{ gameId: string }
```

---

#### `POST /api/games/:gameId/place`
Submit ship placement for a player. Locked once `ready` is submitted.

**Request**
```ts
{
  playerId: string
  ships: {
    type: 'carrier' | 'battleship' | 'cruiser' | 'submarine' | 'destroyer'
    orientation: 'H' | 'V'
    origin: { col: number, row: number }
  }[]
}
```

**Response**
```ts
{ ok: boolean }
```

---

#### `POST /api/games/:gameId/ready`
Mark a player as ready to start the battle phase.

**Request**
```ts
{ playerId: string }
```

**Response**
```ts
{ ok: boolean }
```

---

#### `POST /api/games/:gameId/shot`
Fire a shot at the opponent's board.

**Request**
```ts
{ playerId: string, col: number, row: number }
```

**Response**
```ts
{
  hit: boolean
  sunk: boolean
  shipType?: 'carrier' | 'battleship' | 'cruiser' | 'submarine' | 'destroyer'
  gameOver: boolean
  winner?: string  // playerId
}
```

---

#### `GET /api/games/:gameId/events`
SSE stream for a game. Pushes events to both players for the lifetime of the game.

**Event types pushed:**
```ts
// A player joined the game
{ type: 'player_joined', playerId: string }

// Placement timer tick (server-authoritative)
{ type: 'timer_tick', secondsRemaining: number }

// A player clicked "I'm ready!"
{ type: 'player_ready', playerId: string }

// Both players ready — battle begins
{ type: 'battle_start', currentTurn: string }  // playerId whose turn it is

// Placement timer expired — game terminated
{ type: 'placement_expired' }

// A shot was fired
{
  type: 'shot_fired'
  shooterId: string
  col: number
  row: number
  hit: boolean
  sunk: boolean
  shipType?: string
  nextTurn: string  // playerId
}

// A turn timer expired — turn forfeited
{ type: 'turn_expired', playerId: string, nextTurn: string }

// Game over
{ type: 'game_over', winnerId: string }
```

---

#### `GET /api/lobby/events`
SSE stream for the lobby. Pushes updates when open games change.

**Event types pushed:**
```ts
// A new game was created
{ type: 'game_created', game: { id, preset, creator } }

// A game was joined (no longer available)
{ type: 'game_removed', gameId: string }
```

---

## Key User Flows

### Flow 1 — Player registration
- **Purpose:** Establish player identity before entering the lobby
- **Trigger:** User opens the app with no player ID in localStorage
- **Walkthrough:**
  1. Welcome screen renders with name input and disabled "Play" button
  2. User types their name; "Play" enables
  3. User submits → `POST /api/players` → server returns player record
  4. Player ID saved to localStorage
  5. User is routed to the lobby
- **Architectural pattern:** Request/response — one-shot, no streaming needed
- **Supports:** F1, F6

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
- **Supports:** F2

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
- **Supports:** F3

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
- **Supports:** F4, F5

### Flow 5 — Game over and return to lobby
- **Purpose:** Conclude the game and update player records
- **Trigger:** `game_over` SSE event received by both tabs
- **Walkthrough:**
  1. Both tabs replace the battle UI with a game-over banner (winner / loser message)
  2. Server updates win/loss stats for both players
  3. Game status is set to `finished` and removed from the lobby list
  4. Player clicks "Return to lobby" → routed back to the lobby
- **Architectural pattern:** Request/response for stat updates (triggered server-side at game-over); routing for navigation
- **Supports:** F5, F6

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

#### 5. In-memory storage over a persistent database
All player and game state is held in server memory. No SQLite, file persistence, or external DB.

**Tradeoff:** Zero setup, zero dependencies, trivially inspectable during development. The cost is that all data (player stats, game history) resets on server restart. Acceptable for a local concept project; the data model is designed so a persistent store could be swapped in without changing any API contracts.

---

## PR Plan

#### PR 1 — Foundation: player registration + lobby shell
- **User-visible change:** A player can open the app, enter their name, and see a lobby screen (even if empty)
- **Scope:** `POST /api/players`, `GET /api/games`, `GET /api/lobby/events` SSE endpoint; Welcome screen component; Lobby shell with empty state; localStorage player ID persistence; in-memory player and game stores
- **Satisfies:** F1 (all AC), F2 (lobby renders, SSE connected)
- **Depends on:** none

#### PR 2 — Lobby: game creation and joining _(after PR 1)_
- **User-visible change:** Player A can create a game with a preset; Player B sees it in the lobby list and can join; both transition to a "Game starting…" placeholder
- **Scope:** `POST /api/games`, `POST /api/games/:gameId/join`; Create Game modal; lobby list rows with player stats; join button; real-time lobby updates via SSE
- **Satisfies:** F2 (all remaining AC), F6 (stats shown in lobby)
- **Depends on:** PR 1

#### PR 3 — Placement phase _(after PR 2)_
- **User-visible change:** Both players can place their ships, rotate them, reset the board, and click "I'm ready!"; the placement timer counts down live; expired timer returns both to the lobby
- **Scope:** `POST /api/games/:gameId/place`, `POST /api/games/:gameId/ready`, `GET /api/games/:gameId/events` (placement events); FleetGrid component; ShipPalette component; hover preview + R key rotation; server-side placement timer; placement expiry logic
- **Satisfies:** F3 (all AC), NF1 (SSE for timer), NF2 (responsive grid)
- **Depends on:** PR 2

#### PR 4 — Battle phase _(after PR 3)_
- **User-visible change:** Players alternate firing shots; hits/misses update live on both tabs; sunk ships reveal; forfeited turns are announced; turn timer counts down
- **Scope:** `POST /api/games/:gameId/shot`; TargetingGrid component; battle layout (two grids + banner); shot result rendering (hit/miss/sunk); server-side turn timer; turn expiry logic; SSE shot and timer events
- **Satisfies:** F4 (all AC), NF1 (shot SSE), NF2 (responsive battle layout), NF3 (input validation)
- **Depends on:** PR 3

#### PR 5 — Game over + stats _(parallel with PR 4, depends on PR 3)_
- **User-visible change:** Game-over banner with winner/loser message; stats updated; "Return to lobby" routes back correctly
- **Scope:** `game_over` SSE handling; GameOver component; stat update logic on server; lobby cleanup on game finish
- **Satisfies:** F5 (all AC), F6 (stats updated at game end)
- **Depends on:** PR 3 _(can be developed in parallel with PR 4 once the SSE event contract is agreed)_

---

## Open Questions

_None — all decisions have been resolved in conversation. The spec is ready for implementation._
