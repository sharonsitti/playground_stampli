import { useCallback, useState } from 'react'
import { PRESET_SECONDS } from '@shared/schemas'
import { Button } from '@/components/ui/button'
import { FleetGrid } from './placement/FleetGrid'
import { computePreview, placedShipAt } from './placement/geometry'
import { ReadyButton } from './placement/ReadyButton'
import { ShipPalette } from './placement/ShipPalette'
import {
  FLEET,
  type Cell,
  type Orientation,
  type PlacedShip,
  type SelectedShip,
  type ShipType,
} from './placement/types'
import { usePlacementSSE } from './placement/usePlacementSSE'
import { useRotationKey } from './placement/useRotationKey'
import { useSubmitFleet } from './placement/useSubmitFleet'

type PlacementScreenProps = {
  gameId: string
  playerId: string
  preset: 'quick' | 'casual'
  onReady: (placedShips: PlacedShip[]) => void
  onBattleStart: (currentTurn: string) => void
  onPlacementExpired: () => void
}

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes)}:${String(seconds).padStart(2, '0')}`
}

export function PlacementScreen({
  gameId,
  playerId,
  preset,
  onReady,
  onBattleStart,
  onPlacementExpired,
}: PlacementScreenProps) {
  const [placedShips, setPlacedShips] = useState<PlacedShip[]>([])
  const [selectedShip, setSelectedShip] = useState<SelectedShip | null>(null)
  const [hoverCell, setHoverCell] = useState<Cell | null>(null)
  const [orientation, setOrientation] = useState<Orientation>('H')
  const [locked, setLocked] = useState(false)
  const [secondsRemaining, setSecondsRemaining] = useState(PRESET_SECONDS[preset])

  const submitFleet = useSubmitFleet(gameId, playerId)
  usePlacementSSE({
    gameId,
    onTimerTick: setSecondsRemaining,
    onPlayerReady: useCallback(() => undefined, []),
    onBattleStart,
    onPlacementExpired,
  })

  const rotate = useCallback(() => {
    setOrientation((prev) => (prev === 'H' ? 'V' : 'H'))
    setSelectedShip((prev) =>
      prev ? { ...prev, orientation: prev.orientation === 'H' ? 'V' : 'H' } : prev,
    )
  }, [])
  useRotationKey(rotate)

  const placedTypes = new Set(placedShips.map((s) => s.type))
  const allPlaced = placedTypes.size === FLEET.length

  function selectFromPalette(type: ShipType) {
    setSelectedShip({ type, orientation })
  }

  function handleCellClick(cell: Cell) {
    if (locked) return

    if (selectedShip) {
      const { valid } = computePreview(selectedShip, cell, placedShips)
      if (!valid) return
      setPlacedShips((prev) => [
        ...prev,
        {
          type: selectedShip.type,
          orientation: selectedShip.orientation,
          origin_col: cell.col,
          origin_row: cell.row,
        },
      ])
      setSelectedShip(null)
      return
    }

    const existing = placedShipAt(cell.col, cell.row, placedShips)
    if (existing) {
      setPlacedShips((prev) => prev.filter((s) => s.type !== existing.type))
      setSelectedShip({ type: existing.type, orientation: existing.orientation })
      setOrientation(existing.orientation)
    }
  }

  function handleReset() {
    setPlacedShips([])
    setSelectedShip(null)
  }

  function handleReady() {
    setLocked(true)
    setSelectedShip(null)
    onReady(placedShips)
    void submitFleet(placedShips)
  }

  const readyState = locked ? 'locked' : allPlaced ? 'ready' : 'unready'

  return (
    <div className="bg-background text-foreground min-h-screen bg-[oklch(0.16_0.04_255)] p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="font-heading text-2xl font-bold tracking-tight">Place your fleet</h1>
          <div
            className="border-border bg-card/80 rounded-lg border px-4 py-2 font-mono text-xl font-semibold tabular-nums"
            aria-label="Time remaining"
          >
            {formatTime(secondsRemaining)}
          </div>
        </header>

        <div className="flex flex-wrap items-start gap-8">
          <FleetGrid
            placedShips={placedShips}
            selectedShip={selectedShip}
            hoverCell={hoverCell}
            locked={locked}
            onHoverCell={setHoverCell}
            onCellClick={handleCellClick}
          />

          <ShipPalette
            placedTypes={placedTypes}
            selectedType={selectedShip?.type ?? null}
            orientation={orientation}
            locked={locked}
            onSelect={selectFromPalette}
          />
        </div>

        <div className="flex items-center gap-4">
          <ReadyButton state={readyState} onReady={handleReady} />
          <Button type="button" variant="outline" disabled={locked} onClick={handleReset}>
            Reset
          </Button>
        </div>
      </div>
    </div>
  )
}
