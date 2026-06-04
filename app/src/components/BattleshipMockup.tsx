/* eslint-disable complexity, max-lines */
import {
  Anchor,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Plus,
  RefreshCw,
  RotateCw,
  Shield,
  Trophy,
  Users,
  Waves,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

// ─── helpers ────────────────────────────────────────────────────────────────

const COLS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j']
const ROWS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

type CellState =
  | 'empty'
  | 'ship'
  | 'hit'
  | 'miss'
  | 'sunk'
  | 'hover-valid'
  | 'hover-invalid'
  | 'ship-invalid'

const cellVariants: Record<CellState, string> = {
  empty: 'bg-background hover:bg-muted/50 cursor-pointer',
  ship: 'bg-primary/30 cursor-pointer',
  hit: 'bg-destructive/80 cursor-default',
  miss: 'bg-slate-300 cursor-default',
  sunk: 'bg-destructive/40 cursor-default',
  'hover-valid': 'bg-green-500/30 cursor-pointer',
  'hover-invalid': 'bg-destructive/60 cursor-pointer',
  'ship-invalid': 'bg-primary/80 cursor-pointer',
}

function Grid({
  cells,
  size = 'md',
  showLabels = true,
}: {
  cells: (CellState | undefined)[][]
  size?: 'sm' | 'md'
  showLabels?: boolean
}) {
  const S = size === 'sm' ? 28 : 36
  const labelW = 20

  return (
    <div className="inline-block select-none">
      {/* Column labels */}
      {showLabels && (
        <div className="flex" style={{ paddingLeft: labelW }}>
          {COLS.map((c) => (
            <div
              key={c}
              style={{ width: S, height: 20 }}
              className="text-muted-foreground flex shrink-0 items-center justify-center font-mono text-[10px]"
            >
              {c}
            </div>
          ))}
        </div>
      )}

      <div className="flex">
        {/* Row labels */}
        {showLabels && (
          <div style={{ width: labelW }}>
            {ROWS.map((row) => (
              <div
                key={row}
                style={{ height: S }}
                className="text-muted-foreground flex items-center justify-end pr-1 font-mono text-[10px]"
              >
                {row}
              </div>
            ))}
          </div>
        )}

        {/* Grid: container provides top+left border; each cell provides right+bottom */}
        <div className="border-border border-t border-l">
          {cells.map((row, ri) => (
            <div key={ROWS[ri]} className="flex">
              {row.map((cell, ci) => {
                const state = cell ?? 'empty'
                return (
                  <div
                    key={COLS[ci]}
                    style={{ width: S, height: S, position: 'relative' }}
                    className={`border-border flex shrink-0 items-center justify-center border-r border-b transition-colors ${cellVariants[state]}`}
                  >
                    {state === 'hit' && (
                      <div className="size-2.5 rounded-full bg-white/90 shadow-sm" />
                    )}
                    {state === 'miss' && <div className="size-2.5 rounded-full bg-slate-500/60" />}
                    {state === 'sunk' && <div className="size-2.5 rounded-full bg-white/70" />}
                    {state === 'ship-invalid' && (
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          backgroundColor: 'oklch(0.5 0.22 22 / 0.45)',
                        }}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Placement — valid hover: carrier placed, battleship hovering in a free zone (green)
const placementValidCells: (CellState | undefined)[][] = ROWS.map((_, ri) =>
  COLS.map((_, ci) => {
    if (ri === 0 && ci >= 0 && ci <= 4) return 'ship'
    if (ri === 3 && ci >= 1 && ci <= 4) return 'ship'
    if (ri === 6 && ci >= 5 && ci <= 8) return 'hover-valid'
    return undefined
  }),
)

// Placement — invalid hover: cruiser dragged to E4-G4 overlaps battleship at E4 only
// ship-invalid must come before ship so the overlay wins for that cell
const placementInvalidCells: (CellState | undefined)[][] = ROWS.map((_, ri) =>
  COLS.map((_, ci) => {
    if (ri === 0 && ci >= 0 && ci <= 4) return 'ship'
    if (ri === 3 && ci === 4) return 'ship-invalid' // E4: overlap — check before ship
    if (ri === 3 && ci >= 1 && ci <= 3) return 'ship' // B–D: rest of battleship
    if (ri === 3 && ci >= 5 && ci <= 6) return 'hover-invalid' // F–G: free hover cells
    return undefined
  }),
)

// Fleet grid for battle phase (with incoming hits)
const fleetCells: (CellState | undefined)[][] = ROWS.map((_, ri) =>
  COLS.map((_, ci) => {
    if (ri === 0 && ci >= 0 && ci <= 4) return 'ship'
    if (ri === 0 && ci === 2) return 'hit'
    if (ri === 0 && ci === 3) return 'hit'
    if (ri === 2 && ci >= 1 && ci <= 4) return 'ship'
    if (ri === 4 && ci >= 0 && ci <= 2) return 'ship'
    if (ri === 5 && ci === 7) return 'miss'
    if (ri === 7 && ci === 3) return 'miss'
    return undefined
  }),
)

// Targeting grid (shots fired at opponent)
const targetCells: (CellState | undefined)[][] = ROWS.map((_, ri) =>
  COLS.map((_, ci) => {
    if (ri === 1 && ci === 4) return 'hit'
    if (ri === 1 && ci === 5) return 'sunk'
    if (ri === 1 && ci === 6) return 'sunk'
    if (ri === 3 && ci === 2) return 'miss'
    if (ri === 3 && ci === 7) return 'miss'
    if (ri === 5 && ci === 0) return 'miss'
    if (ri === 6 && ci === 9) return 'hit'
    return undefined
  }),
)

// ─── section wrapper ─────────────────────────────────────────────────────────

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="border-border/40 border-t py-16">
      <div className="mx-auto max-w-5xl px-6">
        <p className="text-muted-foreground mb-8 text-xs font-medium tracking-widest uppercase">
          {label}
        </p>
        {children}
      </div>
    </section>
  )
}

// ─── 1. Welcome screen ───────────────────────────────────────────────────────

function WelcomeScreen() {
  return (
    <div className="flex justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader className="pb-2 text-center">
          <div className="bg-primary/10 mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl">
            <Anchor className="text-primary size-7" />
          </div>
          <CardTitle className="font-heading text-2xl">Battleship</CardTitle>
          <p className="text-muted-foreground text-sm">Enter your name to set sail</p>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <Input placeholder="Your name…" defaultValue="Admiral Sharon" />
          <Button className="w-full" size="lg">
            Play
            <Waves className="ml-1.5 size-4" />
          </Button>
          <p className="text-muted-foreground text-center text-xs">
            Name is used to track your win/loss record
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── 2. Lobby ────────────────────────────────────────────────────────────────

const openGames = [
  { creator: 'CaptainDave', wins: 12, losses: 4, preset: 'Quick 30s', winRate: '75%' },
  { creator: 'NavyNick', wins: 3, losses: 7, preset: 'Casual 60s', winRate: '30%' },
]

function LobbyScreen() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-xl font-semibold">Lobby</h2>
          <p className="text-muted-foreground text-sm">Open games ready to join</p>
        </div>
        <Button>
          <Plus className="mr-1 size-3.5" />
          Create Game
        </Button>
      </div>

      <div className="space-y-3">
        {openGames.map((g) => (
          <Card key={g.creator} className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 flex size-9 items-center justify-center rounded-full">
                <Shield className="text-primary size-4" />
              </div>
              <div>
                <p className="font-medium">{g.creator}</p>
                <p className="text-muted-foreground text-xs">
                  {g.wins}W / {g.losses}L · {g.winRate} win rate
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="bg-muted text-muted-foreground rounded-full px-2.5 py-0.5 text-xs font-medium">
                {g.preset}
              </span>
              <Button size="sm">Join</Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Waiting state */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="py-8 text-center">
          <div className="bg-primary/15 mx-auto mb-3 flex size-10 items-center justify-center rounded-full">
            <Users className="text-primary size-5" />
          </div>
          <p className="font-medium">Waiting for opponent…</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Your game (Quick 30s) is listed in the lobby
          </p>
          <Button variant="outline" size="sm" className="mt-4">
            Cancel
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── 3. Create Game modal (inline mockup) ────────────────────────────────────

function CreateGameModal() {
  return (
    <div className="flex justify-center">
      <Card className="ring-border/60 w-full max-w-sm shadow-xl ring-1">
        <CardHeader className="border-border/40 border-b pb-4">
          <CardTitle className="text-base">Create Game</CardTitle>
          <p className="text-muted-foreground text-sm">Choose a timer preset for both phases</p>
        </CardHeader>
        <CardContent className="space-y-4 pt-5">
          <div className="grid grid-cols-2 gap-3">
            {/* Quick — selected */}
            <div className="border-primary bg-primary/5 cursor-pointer rounded-xl border-2 p-4 text-center">
              <div className="bg-primary/15 mx-auto mb-2 flex size-9 items-center justify-center rounded-lg">
                <Zap className="text-primary size-4" />
              </div>
              <p className="text-sm font-semibold">Quick</p>
              <p className="text-muted-foreground mt-0.5 text-xs">30 seconds</p>
            </div>
            {/* Casual */}
            <div className="border-border hover:bg-muted/40 cursor-pointer rounded-xl border-2 p-4 text-center">
              <div className="bg-muted mx-auto mb-2 flex size-9 items-center justify-center rounded-lg">
                <Clock className="text-muted-foreground size-4" />
              </div>
              <p className="text-sm font-semibold">Casual</p>
              <p className="text-muted-foreground mt-0.5 text-xs">60 seconds</p>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1">
              Cancel
            </Button>
            <Button className="flex-1">Create Game</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── 4. Ship placement ───────────────────────────────────────────────────────

const SHIP_EMOJI: Record<string, string> = {
  Carrier: '✈️',
  Battleship: '🚢',
  Cruiser: '🛥️',
  Submarine: '🤿',
  Destroyer: '💥',
}

const palette = [
  { name: 'Battleship', size: 4 },
  { name: 'Cruiser', size: 3 },
  { name: 'Submarine', size: 3 },
  { name: 'Destroyer', size: 2 },
]

function PlacementPhase() {
  return (
    <div className="space-y-6">
      <Card className="border-primary/30 bg-primary/5 px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-primary text-xs font-medium tracking-widest uppercase">
              Placement Phase
            </p>
            <p className="text-muted-foreground mt-0.5 text-sm">
              Place all 5 ships on your grid before time runs out.
            </p>
          </div>
          <span className="text-primary font-mono text-3xl font-bold">0:23</span>
        </div>
      </Card>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Grids: valid + invalid placement states */}
        <div className="flex flex-1 flex-col gap-6 sm:flex-row">
          <div>
            <p className="text-muted-foreground mb-3 text-sm font-medium">
              Valid placement <span className="font-semibold text-green-600">✓</span>
            </p>
            <Grid cells={placementValidCells} size="sm" />
          </div>
          <div>
            <p className="text-muted-foreground mb-3 text-sm font-medium">
              Overlap — invalid <span className="text-destructive font-semibold">✗</span>
            </p>
            <Grid cells={placementInvalidCells} size="sm" />
          </div>
        </div>

        {/* Palette */}
        <div className="w-full space-y-3 lg:w-56">
          <p className="text-muted-foreground text-sm font-medium">Ships to place</p>

          {/* Carrier — already placed (grayed out) */}
          <div className="bg-muted/40 flex items-center gap-2 rounded-lg px-3 py-2 opacity-40">
            <span className="text-base">{SHIP_EMOJI['Carrier']}</span>
            <span className="text-muted-foreground text-xs line-through">Carrier</span>
            <span className="text-muted-foreground ml-auto text-xs">5</span>
          </div>

          {palette.map((ship) => (
            <div
              key={ship.name}
              className="border-border bg-card hover:bg-muted/40 flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2"
            >
              <span className="text-base">{SHIP_EMOJI[ship.name]}</span>
              <span className="text-xs font-medium">{ship.name}</span>
              <span className="text-muted-foreground ml-auto text-xs">{ship.size}</span>
            </div>
          ))}

          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" className="flex-1 gap-1">
              <RotateCw className="size-3" />
              Rotate
            </Button>
            <Button variant="outline" size="sm" className="flex-1 gap-1">
              <RefreshCw className="size-3" />
              Reset
            </Button>
          </div>

          <Button className="w-full" disabled>
            I'm ready!
          </Button>
          <p className="text-muted-foreground text-center text-xs">Place all 5 ships to continue</p>

          {/* Ready state variant */}
          <div className="border-border/40 border-t pt-4">
            <p className="text-muted-foreground mb-2 text-xs font-medium">All placed → enabled:</p>
            <Button className="w-full bg-green-600 text-white hover:bg-green-700">
              <CheckCircle2 className="mr-1.5 size-4" />
              I'm ready!
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── 5. Battle phase ─────────────────────────────────────────────────────────

function BattlePhase() {
  return (
    <div className="space-y-6">
      {/* Turn banner — your turn */}
      <Card className="border-primary/30 bg-primary/5 px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-primary text-xs font-medium tracking-widest uppercase">Your Turn</p>
            <p className="text-muted-foreground mt-0.5 text-sm">
              Click any cell on the targeting grid
            </p>
          </div>
          <span className="text-primary font-mono text-3xl font-bold">0:18</span>
        </div>
      </Card>

      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Fleet grid (left) */}
        <div className="flex-1">
          <p className="text-muted-foreground mb-3 text-sm font-medium">Your Fleet</p>
          <Grid cells={fleetCells} size="sm" />
        </div>

        {/* Targeting grid (right) */}
        <div className="flex-1">
          <p className="text-muted-foreground mb-3 text-sm font-medium">Targeting Grid</p>
          <div className="w-fit">
            <Grid cells={targetCells} size="sm" />
            {/* Sunk notification */}
            <div className="border-destructive/30 bg-destructive/5 mt-3 w-full rounded-lg border px-3 py-2">
              <p className="text-destructive text-xs font-medium">
                {SHIP_EMOJI['Destroyer']} Destroyer sunk!
              </p>
            </div>
            <div className="text-muted-foreground mt-3 flex gap-3 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="bg-destructive/80 inline-block size-3 rounded-sm" /> Hit
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block size-3 rounded-sm bg-slate-300" /> Miss
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Waiting variant */}
      <Card className="border-border/40 bg-muted/30 px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-xs font-medium tracking-widest uppercase">
              Waiting for opponent…
            </p>
            <p className="text-muted-foreground mt-0.5 text-sm">CaptainDave is taking their shot</p>
          </div>
          <span className="text-muted-foreground font-mono text-3xl font-bold">0:07</span>
        </div>
      </Card>

      {/* Turn expired notification */}
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-700">
        CaptainDave ran out of time — turn skipped
      </div>
    </div>
  )
}

// ─── 6. Game over ────────────────────────────────────────────────────────────

function GameOver() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Winner */}
      <Card className="border-green-500/30 bg-green-500/5 text-center">
        <CardContent className="py-10">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-green-500/15">
            <Trophy className="size-8 text-green-600" />
          </div>
          <p className="font-heading text-3xl font-bold text-green-700">You won!</p>
          <p className="text-muted-foreground mt-2 text-sm">All of CaptainDave's ships are sunk</p>
          <div className="mt-4 flex justify-center gap-6 text-sm">
            <div>
              <p className="font-semibold">13</p>
              <p className="text-muted-foreground text-xs">Wins</p>
            </div>
            <div>
              <p className="font-semibold">4</p>
              <p className="text-muted-foreground text-xs">Losses</p>
            </div>
            <div>
              <p className="font-semibold">76%</p>
              <p className="text-muted-foreground text-xs">Win rate</p>
            </div>
          </div>
          <Button className="mt-6 bg-green-600 text-white hover:bg-green-700">
            <ArrowLeft className="mr-1.5 size-4" />
            Return to Lobby
          </Button>
        </CardContent>
      </Card>

      {/* Loser */}
      <Card className="border-destructive/20 bg-destructive/5 text-center">
        <CardContent className="py-10">
          <div className="bg-destructive/10 mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl">
            <Anchor className="text-destructive/70 size-8" />
          </div>
          <p className="font-heading text-destructive/80 text-3xl font-bold">You lost</p>
          <p className="text-muted-foreground mt-2 text-sm">Admiral Sharon sunk your fleet</p>
          <div className="mt-4 flex justify-center gap-6 text-sm">
            <div>
              <p className="font-semibold">3</p>
              <p className="text-muted-foreground text-xs">Wins</p>
            </div>
            <div>
              <p className="font-semibold">8</p>
              <p className="text-muted-foreground text-xs">Losses</p>
            </div>
            <div>
              <p className="font-semibold">27%</p>
              <p className="text-muted-foreground text-xs">Win rate</p>
            </div>
          </div>
          <Button variant="outline" className="mt-6">
            <ArrowLeft className="mr-1.5 size-4" />
            Return to Lobby
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── root ────────────────────────────────────────────────────────────────────

export default function BattleshipMockup() {
  return (
    <div className="bg-background text-foreground min-h-screen">
      {/* Page header */}
      <div className="border-border/40 bg-muted/30 border-b px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          <Anchor className="text-primary size-5" />
          <span className="font-heading font-semibold">Battleship — UI Mockup</span>
          <span className="ml-auto rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
            Visual only · delete BattleshipMockup.tsx to remove
          </span>
        </div>
      </div>

      <Section label="01 — Welcome / Registration">
        <WelcomeScreen />
      </Section>

      <Section label="02 — Lobby">
        <LobbyScreen />
      </Section>

      <Section label="03 — Create Game Modal">
        <CreateGameModal />
      </Section>

      <Section label="04 — Ship Placement Phase">
        <PlacementPhase />
      </Section>

      <Section label="05 — Battle Phase">
        <BattlePhase />
      </Section>

      <Section label="06 — Game Over">
        <GameOver />
      </Section>
      <div style={{ height: 500 }} />
    </div>
  )
}
