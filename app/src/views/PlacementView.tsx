import { Check, RotateCcw, Ship } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { FleetGrid } from './placement/FleetGrid'
import {
  FLEET,
  SHIP_SIZES,
  usePlacement,
  type Cell,
  type PlacedShip,
  type ShipType,
} from './placement/usePlacement'

type PlacementViewProps = {
  gameId: string
  playerId: string
  preset: 'quick' | 'casual'
  role: 'creator' | 'joiner'
  onReady: (ships: PlacedShip[]) => void
  onExpired: () => void
}

const SHIP_LABELS: Record<ShipType, string> = {
  carrier: 'Carrier',
  battleship: 'Battleship',
  cruiser: 'Cruiser',
  submarine: 'Submarine',
  destroyer: 'Destroyer',
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

// gameId/playerId/preset/onReady/onExpired are part of the contract PR4 wires into the live flow.
export function PlacementView(_props: PlacementViewProps) {
  const placement = usePlacement()
  const allPlaced = placement.placedShips.length === FLEET.length

  const handleCellClick = (cell: Cell) => {
    const placedType = placement.cellToShip.get(cellKey(cell))
    if (placedType) {
      placement.pickUpPlaced(placedType)
      return
    }
    placement.placeAtCursor()
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
        <span className="text-2xl font-bold text-[#4F46E5] tabular-nums" aria-hidden="true">
          —:—
        </span>
      </header>

      <main className="mx-auto flex max-w-[820px] flex-col gap-6 px-6 py-8">
        <div className="flex flex-wrap gap-6">
          <FleetGrid
            cellToShip={placement.cellToShip}
            previewCells={placement.previewCells}
            isPreviewValid={placement.isPreviewValid}
            disabled={false}
            onCellEnter={placement.setCursorCell}
            onCellClick={handleCellClick}
            onLeave={() => {
              placement.setCursorCell(null)
            }}
          />

          <aside className="bg-card flex w-[220px] flex-col gap-3 rounded-xl border border-[#E5E7EB] p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-[#0F172A]">Ships to place</h2>

            <ul className="flex flex-col gap-1.5">
              {placement.availableShips.map((type) => {
                const isSelected = placement.selectedShip === type
                return (
                  <li key={type}>
                    <button
                      type="button"
                      onClick={() => {
                        placement.selectFromPalette(type)
                      }}
                      aria-pressed={isSelected}
                      className={cn(
                        'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors',
                        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F46E5]',
                        isSelected
                          ? 'bg-[#EEF2FF] text-[#4F46E5]'
                          : 'text-[#0F172A] hover:bg-[#F1F5F9]',
                      )}
                    >
                      <Ship className="size-4" aria-hidden="true" />
                      <span className="text-sm">{SHIP_LABELS[type]}</span>
                      <span className="ml-auto text-xs text-[#94A3B8]">{SHIP_SIZES[type]}</span>
                    </button>
                  </li>
                )
              })}
              {placement.availableShips.length === 0 ? (
                <li className="px-2 py-1.5 text-xs text-[#94A3B8]">All ships placed.</li>
              ) : null}
            </ul>

            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={placement.reset}
              disabled={placement.placedShips.length === 0 && placement.selectedShip === null}
            >
              <RotateCcw className="size-3.5" aria-hidden="true" />
              Reset
            </Button>

            {/* TODO PR4: wire timer + ready logic here (3-state button, place/ready POSTs). */}
            <div className="mt-1 flex flex-col gap-1">
              <Button
                size="lg"
                className="w-full bg-[#F1F5F9] text-[#94A3B8] hover:bg-[#F1F5F9]"
                disabled
              >
                <Check className="size-4" aria-hidden="true" />
                I&apos;m ready!
              </Button>
              {!allPlaced ? (
                <p className="text-xs text-[#94A3B8]">Place all 5 ships to continue</p>
              ) : null}
            </div>
          </aside>
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
