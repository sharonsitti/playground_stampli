import { useState } from 'react'
import { useGameSSE } from '@/hooks/useGameSSE'
import { ConflictError, markReady, placeShips } from '@/lib/api'
import { FleetGrid } from './placement/FleetGrid'
import { PlacementPanel, type ReadyState } from './placement/PlacementPanel'
import { FLEET, usePlacement, type Cell, type PlacedShip } from './placement/usePlacement'

type PlacementViewProps = {
  gameId: string
  playerId: string
  preset: 'quick' | 'casual'
  role: 'creator' | 'joiner'
  onReady: (ships: PlacedShip[]) => void
  onExpired: () => void
}

const INSTRUCTIONS: Array<{ action: string; text: string }> = [
  {
    action: 'Select',
    text: 'Click a ship in the palette. It attaches to your cursor as a ghost preview.',
  },
  {
    action: 'Position',
    text: 'Hover over the grid. The preview snaps cell-by-cell. Green = valid; red = invalid.',
  },
  {
    action: 'Rotate',
    text: 'Press R to toggle horizontal / vertical. The preview updates instantly.',
  },
  { action: 'Place', text: 'Click a green cell to drop the ship. Red cells are blocked.' },
  { action: 'Reposition', text: 'Click a ship already on the grid to pick it back up.' },
  { action: 'Reset', text: 'Clears all placed ships and refills the palette.' },
]

const cellKey = (cell: Cell) => `${String(cell.col)},${String(cell.row)}`

function formatTimer(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = String(seconds % 60).padStart(2, '0')
  return `${String(mins)}:${secs}`
}

export function PlacementView({ gameId, playerId, onReady, onExpired }: PlacementViewProps) {
  const placement = usePlacement()
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [opponentReady, setOpponentReady] = useState(false)

  const allPlaced = placement.placedShips.length === FLEET.length
  const readyState: ReadyState = submitted ? 'locked' : allPlaced ? 'ready' : 'unready'

  useGameSSE(gameId, {
    onTimerTick: ({ seconds_remaining }) => {
      setSecondsRemaining(seconds_remaining)
    },
    onPlayerReady: ({ player_id }) => {
      if (player_id !== playerId) setOpponentReady(true)
    },
    onBattleStart: () => {
      onReady(placement.placedShips)
    },
    onPlacementExpired: () => {
      onExpired()
    },
  })

  const handleCellClick = (cell: Cell) => {
    if (submitted) return
    const placedType = placement.cellToShip.get(cellKey(cell))
    if (placedType) {
      placement.pickUpPlaced(placedType)
      return
    }
    placement.placeAtCursor()
  }

  const handleReady = () => {
    if (readyState !== 'ready') return
    const ships = placement.placedShips
    setSubmitted(true)
    void placeShips(gameId, playerId, ships)
      .then(() => markReady(gameId, playerId))
      .catch((err: unknown) => {
        if (err instanceof ConflictError) return
        throw err
      })
  }

  return (
    <div className="bg-background min-h-screen">
      <header className="flex items-center justify-between border-b border-[#C7D2FE] bg-[#EEF2FF] px-5 py-2.5">
        <div className="flex items-center gap-2.5">
          <span className="rounded-full bg-[#E0E7FF] px-2 py-0.5 text-xs font-semibold tracking-wider text-[#4F46E5] uppercase">
            Placement Phase
          </span>
          <span className="text-sm text-[#64748B]">
            Place all 5 ships on your grid before time runs out.
          </span>
        </div>
        <span className="text-2xl font-bold text-[#4F46E5] tabular-nums">
          {secondsRemaining === null ? '—:—' : formatTimer(secondsRemaining)}
        </span>
      </header>

      <main className="mx-auto flex max-w-[820px] flex-col gap-6 px-6 py-8">
        <div className="flex flex-wrap gap-6">
          <FleetGrid
            cellToShip={placement.cellToShip}
            previewCells={placement.previewCells}
            isPreviewValid={placement.isPreviewValid}
            disabled={submitted}
            onCellEnter={placement.setCursorCell}
            onCellClick={handleCellClick}
            onLeave={() => {
              placement.setCursorCell(null)
            }}
          />

          <PlacementPanel
            availableShips={placement.availableShips}
            selectedShip={placement.selectedShip}
            readyState={readyState}
            opponentReady={opponentReady}
            resetDisabled={
              submitted || (placement.placedShips.length === 0 && placement.selectedShip === null)
            }
            locked={submitted}
            onSelect={placement.selectFromPalette}
            onReset={placement.reset}
            onReady={handleReady}
          />
        </div>

        <section>
          <h2 className="mb-2 text-xs font-bold tracking-[0.08em] text-[#94A3B8] uppercase">
            How to place ships
          </h2>
          <ol className="flex flex-col gap-1.5 text-sm text-[#64748B]">
            {INSTRUCTIONS.map(({ action, text }) => (
              <li key={action}>
                <span className="font-semibold text-[#0F172A]">{action}</span> — {text}
              </li>
            ))}
          </ol>
        </section>
      </main>
    </div>
  )
}
