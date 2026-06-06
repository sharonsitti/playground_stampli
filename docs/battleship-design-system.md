# Battleship — UI Design System

Reference for implementing all six screens in `docs/battleship-ui-mockup.png`. Describes element types, layout, typography, color, and visual hierarchy for every screen and state. Read alongside `docs/spec.md`, which governs behavior.

---

## Global Tokens

### Color Palette

| Token | Value | Usage |
|---|---|---|
| `--color-bg` | `#F5F6F8` | Page background |
| `--color-surface` | `#FFFFFF` | Card / panel background |
| `--color-border` | `#E5E7EB` | Card borders, grid lines, input borders |
| `--color-text-primary` | `#0F172A` | Headings, strong labels |
| `--color-text-secondary` | `#64748B` | Subtitles, helper text, stats captions |
| `--color-text-muted` | `#94A3B8` | Disabled labels, placeholder text |
| `--color-indigo-600` | `#4F46E5` | Primary action buttons, active state fills |
| `--color-indigo-50` | `#EEF2FF` | Banner background (YOUR TURN, PLACEMENT PHASE) |
| `--color-indigo-100` | `#E0E7FF` | Selected option card background tint |
| `--color-indigo-700` | `#4338CA` | Button hover, locked-ready button |
| `--color-green-500` | `#22C55E` | Ready button enabled state, win icon |
| `--color-green-50` | `#F0FDF4` | Win screen background tint |
| `--color-red-500` | `#EF4444` | Hit cells, invalid preview overlay, error |
| `--color-red-100` | `#FEE2E2` | "Sunk!" notification background |
| `--color-red-700` | `#B91C1C` | "Sunk!" notification text |
| `--color-orange-400` | `#FB923C` | Turn-expired toast text/icon |
| `--color-orange-50` | `#FFF7ED` | Turn-expired toast background |
| `--color-ship-fill` | `#BFDBFE` | Own fleet ship cells (blue-200) |
| `--color-ship-border` | `#93C5FD` | Own fleet ship cell border (blue-300) |
| `--color-valid-fill` | `#BBF7D0` | Valid placement ghost preview (green-200) |
| `--color-invalid-fill` | `#FECACA` | Invalid placement ghost preview (red-200) |
| `--color-miss` | `#CBD5E1` | Miss marker on targeting grid (slate-300) |
| `--color-gray-100` | `#F1F5F9` | Waiting state card background, disabled button |
| `--color-gray-200` | `#E2E8F0` | Disabled button border |

### Typography

Font family: **Inter** (system fallback: `ui-sans-serif, system-ui, sans-serif`)

| Scale | Size | Weight | Line-height | Usage |
|---|---|---|---|---|
| `text-xs` | 11px | 400 | 1.5 | Helper text, stat captions |
| `text-sm` | 13px | 400–500 | 1.5 | Body copy, list items, input text |
| `text-base` | 15px | 400–500 | 1.5 | Card subtitles, instruction text |
| `text-lg` | 18px | 600 | 1.4 | Card headings, lobby section title |
| `text-xl` | 20px | 700 | 1.3 | Player name in welcome screen |
| `text-2xl` | 24px | 700 | 1.2 | "Lobby" heading, modal title |
| `text-4xl` | 36px | 800 | 1.1 | "You won!" / "You lost" game over |
| `text-5xl` | 48px | 800 | 1.0 | Timer display (monospaced tabular nums) |

Timer digits use `font-variant-numeric: tabular-nums` to prevent layout shift as seconds change.

Section labels in the mockup (e.g., `01 — WELCOME / REGISTRATION`) are **annotation overlays**, not rendered UI elements.

### Spacing & Layout

- Page max-width: `640px`, centered horizontally, padding `24px` on each side for mobile.
- Base spacing unit: `4px`. Use multiples: `8, 12, 16, 20, 24, 32, 40, 48`.
- Card border-radius: `12px`
- Button border-radius: `8px`
- Input border-radius: `8px`
- Inner card padding: `24px`
- Section gap between major blocks: `24px`

### Elevation & Shadows

| Level | Box-shadow | Usage |
|---|---|---|
| `shadow-sm` | `0 1px 3px rgba(0,0,0,0.08)` | Cards, list rows |
| `shadow-md` | `0 4px 12px rgba(0,0,0,0.12)` | Modal dialog |
| `shadow-none` | — | Inline elements, banners |

### Interactive States

- **Focus:** `outline: 2px solid #4F46E5; outline-offset: 2px`
- **Hover (buttons):** 10% darker fill
- **Disabled:** `opacity: 0.45`, `cursor: not-allowed`

---

## Components

### Button

Three variants used throughout:

| Variant | Background | Text | Border | Usage |
|---|---|---|---|---|
| `primary` | `#4F46E5` | white | none | Main CTA ("Play", "Join", "Create Game") |
| `ghost` | transparent | `#4F46E5` | `1px solid #E5E7EB` | Secondary actions ("Cancel") |
| `success` | `#22C55E` | white | none | "I'm ready!" enabled state |
| `locked` | `#4338CA` | white | none | "I'm ready!" locked state (after click) |
| `danger-ghost` | transparent | `#EF4444` | `1px solid #EF4444` | Destructive secondary action |

All buttons:
- Height: `40px` (default), `32px` (small, used in lobby rows)
- Padding: `0 16px`
- Font: `text-sm`, `font-weight: 600`
- Border-radius: `8px`
- Icon + text: icon is 16×16, gap `6px` between icon and label

Primary button on welcome screen is full-width. Buttons in modal footer are side by side (Cancel left, confirm right).

### Input

- Height: `44px`
- Border: `1px solid #E5E7EB`, radius `8px`
- Padding: `0 12px`
- Background: white
- Focus: indigo outline (see Interactive States)
- Placeholder text: `#94A3B8`
- Font: `text-base`

### Card

White surface, `border: 1px solid #E5E7EB`, `border-radius: 12px`, `box-shadow: shadow-sm`, `padding: 24px`.

### Badge / Chip

Inline pill for labels like "Quick 30s", "Casual 60s", and phase labels.

- Background: `#EEF2FF`
- Text: `#4F46E5`, `text-xs`, `font-weight: 600`, `letter-spacing: 0.05em`, uppercase
- Padding: `2px 8px`
- Border-radius: `999px`

### Toast / Notification

Used for "sunk!" alerts and turn-expired notices.

- Appears inline below the grid section, not overlaid
- **Sunk notification:** background `#FEE2E2`, text `#B91C1C`, `border-radius: 8px`, `padding: 8px 12px`, `text-sm`, `font-weight: 500`
- **Turn-expired toast:** background `#FFF7ED`, text `#92400E`, left border `3px solid #FB923C`, `padding: 10px 14px`, `text-sm`

### Modal

- Overlay: `rgba(0,0,0,0.3)` full-screen
- Dialog: white card, `border-radius: 16px`, `box-shadow: shadow-md`, `max-width: 400px`, `padding: 28px`
- Title: `text-2xl`, `font-weight: 700`
- Subtitle: `text-sm`, `color: #64748B`, `margin-top: 4px`
- Content gap: `20px` below subtitle
- Footer: flex row, gap `8px`, right-aligned

### Phase Banner

Horizontal strip spanning full content width, placed at the very top of the placement and battle screens.

- Background: `#EEF2FF`
- Border-bottom: `1px solid #C7D2FE`
- Padding: `10px 20px`
- Layout: flex row, space-between
- Left side: badge chip ("PLACEMENT PHASE" or "YOUR TURN" / "WAITING FOR OPPONENT") + descriptive text (`text-sm`, `color: #64748B`), gap `10px`
- Right side: timer display (`text-2xl` or `text-3xl`, `font-weight: 700`, `color: #4F46E5`, tabular-nums)

---

## Screens

### 01 — Welcome / Registration

**Layout:** Full-page centered vertically and horizontally. A single card (`max-width: 360px`) sits in the middle of the `--color-bg` page.

**Card contents (top to bottom):**
1. **Anchor icon** — 40×40px, `color: #4F46E5`, centered horizontally. Rendered as a `lucide-react` `Anchor` icon.
2. **"Battleship"** — `text-2xl`, `font-weight: 800`, `color: #0F172A`, centered, `margin-top: 12px`
3. **"Enter your name to set sail"** — `text-sm`, `color: #64748B`, centered, `margin-top: 4px`
4. **Name input** — full-width, placeholder `"Admiral [name]"` or blank. `margin-top: 20px`.
5. **"Play →" button** — full-width `primary` variant. `margin-top: 12px`. Contains a `Send` or `ArrowRight` lucide icon after the label.
6. **Helper text** — `"Name is used to track your win/loss record"` — `text-xs`, `color: #94A3B8`, centered, `margin-top: 8px`

**Visual hierarchy:** Title dominates. Input and button are the only interactive elements. Helper text is visually quiet.

---

### 02 — Lobby

**Layout:** Full page with `--color-bg`. Content at max-width `640px`, centered. Top spacing `32px`.

#### Header Row

Flex row, `align-items: flex-end`, `justify-content: space-between`.

- **Left:** "Lobby" in `text-2xl`, `font-weight: 700`, `color: #0F172A`. Below it: "Open games ready to join" in `text-sm`, `color: #64748B`.
- **Right:** "+ Create Game" button — `primary` variant, `small` size (32px height). Contains a `Plus` lucide icon before the label.

`margin-bottom: 16px` below this header row.

#### Game List

A vertical list of rows. Each row is a white card (`padding: 14px 16px`, `border-radius: 10px`, `shadow-sm`).

**Row layout (flex, align-items: center, gap: 12px):**
1. **Radio circle** — 18×18px unfilled circle, `border: 2px solid #CBD5E1`. Indicates selectable row (visual only; clicking "Join" is the action).
2. **Player info block (flex-col, flex: 1):**
   - Player name — `text-sm`, `font-weight: 600`, `color: #0F172A`
   - Record + win rate — `text-xs`, `color: #64748B`, e.g., `"10W / 4L · 71% win rate"`
3. **Preset badge** — e.g., "Quick 30s" — chip variant
4. **"Join" button** — `primary` variant, `small` (height 32px, padding `0 12px`)

Rows have `gap: 8px` between them.

#### Waiting State (replaces game list when creator is waiting)

A card with a lavender/indigo tint replacing the game list rows:

- Background: `#EEF2FF`, border: `1px solid #C7D2FE`, `border-radius: 12px`, `padding: 32px 24px`
- **Layout:** centered flex-col
- **Anchor icon** — 32×32px, `color: #A5B4FC`, centered
- **"Waiting for opponent..."** — `text-base`, `font-weight: 600`, `color: #4338CA`, `margin-top: 12px`, centered
- **"Your game (Quick 30s) is listed in the lobby"** — `text-sm`, `color: #64748B`, centered, `margin-top: 4px`
- **"Cancel" button** — `ghost` variant, centered, `margin-top: 16px`

---

### 03 — Create Game Modal

Triggered by "+ Create Game". Overlays the lobby.

**Modal header:**
- Title: "Create Game" — `text-xl`, `font-weight: 700`
- Subtitle: "Choose a timer preset for both phases." — `text-sm`, `color: #64748B`, `margin-top: 4px`

**Option cards (flex row, gap: 12px, margin-top: 20px):**

Two equal-width cards side by side. Each:
- `border: 2px solid #E5E7EB`, `border-radius: 10px`, `padding: 16px`, flex-col, `align-items: center`, `cursor: pointer`
- **Icon** — `Clock` lucide icon, 24×24px, `color: #94A3B8`
- **Label** — `text-sm`, `font-weight: 600`, `color: #0F172A`, `margin-top: 8px` (e.g., "Quick", "Casual")
- **Duration** — `text-xs`, `color: #64748B` (e.g., "30 seconds", "60 seconds")

**Selected state:**
- `border-color: #4F46E5`
- Background: `#EEF2FF`
- Icon color: `#4F46E5`
- Label color: `#4F46E5`

**Default selected:** "Quick" is pre-selected when modal opens.

**Modal footer (flex row, justify-content: flex-end, gap: 8px, margin-top: 24px):**
- "Cancel" — `ghost` variant
- "Create Game" — `primary` variant

---

### 04 — Ship Placement Phase

**Important:** The mockup shows two example grids ("Valid placement ✓" and "Overlap — invalid ✗") as a visual legend for the ghost preview colors only. The actual placement screen renders **one** 10×10 fleet grid plus a ship palette sidebar. Do not render two grids.

**Full-screen layout (flex-col):**
1. Phase banner (full-width strip at top)
2. Main content area (flex-row, gap: `24px`)
   - Fleet grid section (left, flex: 1)
   - Ship palette panel (right, `width: 220px`)
3. Instructions section (below main content)

#### Phase Banner

- Badge label: "PLACEMENT PHASE" (indigo chip)
- Descriptive text: "Place all 5 ships on your grid before time runs out."
- Timer: e.g., "0:23"

#### Fleet Grid

- 10×10 grid
- **Column headers (a–j):** `text-xs`, `font-weight: 500`, `color: #94A3B8`, centered above each column. `14px` wide each. Letter-spaced. Lowercase.
- **Row headers (1–10):** same style, right-aligned to the left of each row. `20px` wide.
- **Cells:** `32px × 32px` squares (adjust to available width). `border: 1px solid #E5E7EB`. Background: white.
- **Placed ship cells:** background `#BFDBFE` (blue-200). Ships spanning multiple cells appear as a continuous rectangle — outer border of the ship gets `2px solid #93C5FD` (blue-300); inner shared borders between cells of the same ship are suppressed.
- **Valid ghost preview cells:** background `#BBF7D0` (green-200), border `1px solid #86EFAC`
- **Invalid ghost preview cells:** background `#FECACA` (red-200), border `1px solid #FCA5A5`

#### Ship Palette Panel

White card (`padding: 16px`, `border-radius: 12px`, `shadow-sm`).

**Header:** "Ships to place" — `text-sm`, `font-weight: 600`, `color: #0F172A`

**Search input** (optional filter, shown in mockup): full-width input, `height: 32px`, placeholder "Carrier", `margin-top: 8px`

**Ship list (flex-col, gap: 6px, margin-top: 12px):**

Each row (flex, align-items: center, gap: 8px, padding: `6px 8px`, border-radius: `6px`, cursor: pointer):
- **Icon** — `lucide-react` icon matching ship type (e.g., `Anchor` for Battleship, `Ship` for others). 16×16, `color: #64748B`
- **Ship name** — `text-sm`, `color: #0F172A`
- **Size number** — `text-xs`, `color: #94A3B8`, pushed right (`margin-left: auto`)

Ship types and sizes:
| Name | Size |
|---|---|
| Carrier | 5 |
| Battleship | 4 |
| Cruiser | 3 |
| Submarine | 3 |
| Destroyer | 2 |

When a ship is placed on the grid, its palette row **disappears entirely** (no disabled placeholder). When picked back up, the row reappears.

**Selected ship row** (attached to cursor for placement): `background: #EEF2FF`, `color: #4F46E5`

**Reset button** (below ship list, full-width): `ghost` variant, small size. `margin-top: 8px`. Label "↺ Reset".

**"I'm ready!" button** — three visual states:

| State | Background | Text | Border | Helper text below |
|---|---|---|---|---|
| Unready | `#F1F5F9` | `#94A3B8` | `1px solid #E2E8F0` | "Place all 5 ships to continue" (`text-xs`, `#94A3B8`) |
| Ready | `#22C55E` | white | none | — |
| Locked | `#4338CA` | white | none | — |

Ready state label: "✓ I'm ready!" (checkmark prefix)
Locked state label: "I'm ready!" (no change to label text, button simply becomes disabled/indigo-700)

Full-width, `height: 40px`, `margin-top: 12px`.

#### Instructions Section

Below the main content area. Collapsible or static block.

**Heading:** "HOW TO PLACE SHIPS" — `text-xs`, `font-weight: 700`, `color: #94A3B8`, `letter-spacing: 0.08em`, uppercase. `margin-bottom: 8px`.

Numbered list (`text-sm`, `color: #64748B`, `gap: 6px`):
1. **Select** — Click a ship in the palette. It attaches to your cursor as a ghost preview.
2. **Position** — Hover over the grid. The preview snaps cell-by-cell. Green = valid; red = invalid.
3. **Rotate** — Press `R` to toggle horizontal / vertical. The preview updates instantly.
4. **Place** — Click a green cell to drop the ship. Red cells are blocked.
5. **Reposition** — Click a ship already on the grid to pick it back up.
6. **Reset** — Clears all placed ships and refills the palette.

Bold the action word at the start of each item (`font-weight: 600`, `color: #0F172A`).

---

### 05 — Battle Phase

**Layout (flex-col):**
1. Phase banner
2. Two grids side by side (flex-row, gap: `24px`)
3. Sunk notification (conditional, below grids)
4. Turn-expired toast (conditional, below grids)

#### Phase Banner — Two States

**YOUR TURN:**
- Badge: "YOUR TURN" (indigo chip)
- Text: "Click any cell on the targeting grid"
- Timer: e.g., "0:18" in `#4F46E5`, large (`text-3xl`, tabular-nums)

**WAITING FOR OPPONENT:**
- Badge: "WAITING FOR OPPONENT…" (use a muted gray chip: background `#F1F5F9`, text `#64748B`)
- Text: "[Opponent name] is taking their shot"
- Timer: same size/style but text color `#94A3B8` (dimmed)

Only one banner renders at a time.

#### Fleet Grid (left)

Label above: "Your Fleet" — `text-sm`, `font-weight: 600`, `color: #0F172A`, `margin-bottom: 6px`

Same 10×10 grid as placement. Placed ships render with `--color-ship-fill` background. Incoming hits from opponent are shown as **red filled squares** overlaid on ship cells. Incoming misses shown as **small gray circle** (`8px` diameter, `background: #CBD5E1`) centered in the cell. Grid is non-interactive during battle.

#### Targeting Grid (right)

Label above: "Targeting Grid" — same label style.

All cells start neutral (white with grid borders). On the active player's turn, un-fired cells show a hover highlight (`background: #EEF2FF`, `cursor: crosshair`). Non-interactive when it's the opponent's turn.

**Hit cells:** `background: #EF4444` (red-500), full cell fill
**Miss cells:** small gray circle (`8px` diameter, `background: #CBD5E1`) centered in the cell
**Sunk ship cells (revealed):** same red fill as hit, plus a `2px solid #B91C1C` outline around the entire ship footprint connecting all its cells

#### "Sunk!" Notification

Appears below the grids when a ship is sunk. Single line:

`background: #FEE2E2`, `border-radius: 8px`, `padding: 8px 14px`, `text-sm`, `font-weight: 500`, `color: #B91C1C`

Text format: `"● [ShipName] sunk!"` — e.g., "● Destroyer sunk!"

Shown to both players. Dismissed automatically when the next shot is fired.

#### Legend

`text-xs`, `color: #64748B`, flex row, gap `12px`, `margin-top: 8px`:
- `"● Hit"` — `●` in `#EF4444`
- `"○ Miss"` — `○` in `#CBD5E1`

#### Turn-Expired Toast

Shown when `turn_expired` SSE event received. Inline block below the grids (not floating).

`background: #FFF7ED`, `border-left: 3px solid #FB923C`, `border-radius: 0 6px 6px 0`, `padding: 10px 14px`, `text-sm`, `color: #92400E`

Text: `"[PlayerName] ran out of time — turn skipped"`

Dismissed automatically when the next turn begins.

---

### 06 — Game Over

Centered on the `--color-bg` page. A single card (`max-width: 400px`).

Two variants:

#### Win Variant

- **Icon:** `Trophy` lucide icon, 48×48px, `color: #22C55E`, centered. Background circle: `background: #F0FDF4`, `border-radius: 50%`, `padding: 16px`.
- **"You won!"** — `text-4xl`, `font-weight: 800`, `color: #22C55E`, centered, `margin-top: 16px`
- **Subtitle:** `"All of [LoserName]'s ships are sunk"` — `text-sm`, `color: #64748B`, centered, `margin-top: 4px`
- **Stats row (flex, justify-center, gap: 24px, margin-top: 20px):**
  Each stat is a flex-col, centered:
  - Number: `text-xl`, `font-weight: 700`, `color: #0F172A`
  - Label: `text-xs`, `color: #94A3B8` ("Wins", "Losses", "Win rate")
  Stats shown: Wins | Losses | Win rate (formatted as `"76%"`)
- **"+ Return to Lobby" button** — `success` variant (green), full-width, `margin-top: 24px`. Contains a `Plus` or `ArrowLeft` lucide icon before label.

#### Loss Variant

- **Icon:** `Anchor` lucide icon, 48×48px, `color: #EF4444`. Background circle: `background: #FEF2F2`, `border-radius: 50%`, `padding: 16px`.
- **"You lost"** — `text-4xl`, `font-weight: 800`, `color: #EF4444`, centered, `margin-top: 16px`
- **Subtitle:** `"[WinnerName] sunk your fleet"` — same style as win variant
- **Stats row:** same layout, same labels, showing this player's stats
- **"+ Return to Lobby" button** — `ghost` variant (outlined, not filled green), full-width, `margin-top: 24px`

---

## Grid — Shared Specification

Used in both the placement phase and battle phase.

- **Dimensions:** 10 columns (a–j) × 10 rows (1–10)
- **Cell size:** `32px × 32px`. If the container is narrower, scale proportionally while keeping cells square.
- **Column headers:** Displayed above the grid. Letters `a`–`j`, lowercase, `text-xs`, `color: #94A3B8`, `font-weight: 500`, `text-align: center`, `width: 32px`, `padding-bottom: 4px`.
- **Row headers:** Displayed to the left of the grid. Numbers `1`–`10`, `text-xs`, `color: #94A3B8`, `font-weight: 500`, `text-align: right`, `padding-right: 6px`, `line-height: 32px`.
- **Cell borders:** `border: 1px solid #E5E7EB`. Adjacent cells share borders (use CSS grid or table layout; do not double-border).
- **Grid outer border:** `border: 1px solid #CBD5E1`, `border-radius: 4px` (wraps the 10×10 area, not the headers).

### Ship Rendering on Fleet Grid

Ships span consecutive cells in one direction (H or V). Render as a single continuous rectangle — suppress the internal shared borders between cells of the same ship. The ship cell fill is `#BFDBFE` with an outer `2px solid #93C5FD` border around the ship's entire footprint, not individual cells.

### Hit / Miss Markers

| Cell state | Rendering |
|---|---|
| Un-fired (targeting) | White background, hover: `#EEF2FF` |
| Hit (targeting) | Full fill `#EF4444` |
| Miss (targeting) | White background + centered `8px` circle fill `#CBD5E1` |
| Sunk ship (targeting) | Full fill `#EF4444` + outer `2px solid #B91C1C` around entire ship footprint |
| Incoming hit (fleet) | Red fill `#EF4444` overlaid on blue ship cell |
| Incoming miss (fleet) | Small `8px` circle `#CBD5E1` on white cell |

---

## Responsive Notes

This game is **desktop-first**. The spec explicitly excludes mobile/responsive layout. Target: minimum viewport width `960px`. The two-grid battle layout requires horizontal space; do not reflow it vertically.

---

## Lucide Icons Reference

Use `lucide-react` for all icons. Key mappings:

| Element | Icon name |
|---|---|
| Welcome screen header / lobby waiting state | `Anchor` |
| Create Game modal timer option | `Clock` |
| Play button arrow | `ArrowRight` or `Send` |
| Create Game lobby button | `Plus` |
| Return to Lobby button | `Plus` (win) / `ArrowLeft` (loss) |
| Ready check (✓) | `Check` |
| Reset button | `RotateCcw` |
| Win result | `Trophy` |
| Ship palette — Carrier | `Ship` |
| Ship palette — Battleship | `Anchor` |
| Ship palette — Cruiser, Submarine, Destroyer | `Ship` (vary by size or use a generic boat icon) |

---

## State Matrix

| Screen | Triggered by |
|---|---|
| Welcome | App load (always shown) |
| Lobby — idle | After player registration |
| Lobby — waiting | After `POST /api/games` succeeds |
| Create Game modal | Click "+ Create Game" |
| Placement | `player_joined` SSE (creator) or `POST /join` response (joiner) |
| Battle — your turn | `battle_start` with `current_turn === playerId` OR `shot_fired` with `next_turn === playerId` |
| Battle — waiting | `battle_start` with `current_turn !== playerId` OR `shot_fired` with `next_turn !== playerId` |
| Battle — sunk notification | `shot_fired` with `sunk: true` |
| Battle — turn-expired toast | `turn_expired` SSE event |
| Game over — win | `game_over` with `winner_id === playerId` |
| Game over — loss | `game_over` with `loser_id === playerId` |
