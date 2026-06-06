import { cn } from '@/lib/utils'
import type { PlacedShip } from '@/views/placement/usePlacement'
import { BattleGrid } from './BattleGrid'
import type { Shot } from './useBattle'

const key = (col: number, row: number) => `${String(col)},${String(row)}`

type CellStatus = 'hit' | 'miss' | 'ship' | 'empty'

const STATUS_CLASS: Record<CellStatus, string> = {
  hit: 'bg-[#EF4444]',
  miss: 'bg-white',
  ship: 'bg-[#BFDBFE]',
  empty: 'bg-white',
}

type FleetBattleGridProps = {
  placedShips: PlacedShip[]
  incomingShots: Shot[]
}

export function FleetBattleGrid({ placedShips, incomingShots }: FleetBattleGridProps) {
  const status = new Map<string, CellStatus>()
  for (const ship of placedShips) {
    for (const c of ship.placedAt) status.set(key(c.col, c.row), 'ship')
  }
  for (const s of incomingShots) status.set(key(s.col, s.row), s.hit ? 'hit' : 'miss')

  return (
    <BattleGrid
      label="Your Fleet"
      ariaLabel="Your fleet grid"
      renderCell={(col, row, coord) => {
        const k = key(col, row)
        const cellStatus = status.get(k) ?? 'empty'
        return (
          <div
            key={k}
            role="gridcell"
            aria-label={`${coord}, ${cellStatus}`}
            className={cn(
              'flex size-8 items-center justify-center border border-[#E5E7EB]',
              STATUS_CLASS[cellStatus],
            )}
          >
            {cellStatus === 'miss' ? (
              <span className="block size-2 rounded-full bg-[#CBD5E1]" aria-hidden="true" />
            ) : null}
          </div>
        )
      }}
    />
  )
}
