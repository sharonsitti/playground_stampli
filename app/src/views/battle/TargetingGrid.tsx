import { cn } from '@/lib/utils'
import { BattleGrid } from './BattleGrid'
import type { Cell, Shot, SunkShip } from './useBattle'

const key = (col: number, row: number) => `${String(col)},${String(row)}`

type CellStatus = 'sunk' | 'hit' | 'miss' | 'unfired'

const STATUS_CLASS: Record<CellStatus, string> = {
  sunk: 'border-2 border-[#B91C1C] bg-[#EF4444]',
  hit: 'border-[#E5E7EB] bg-[#EF4444]',
  miss: 'border-[#E5E7EB] bg-white',
  unfired: 'border-[#E5E7EB] bg-white',
}

type TargetingGridProps = {
  myShots: Shot[]
  sunkOpponentShips: SunkShip[]
  interactive: boolean
  onFire: (cell: Cell) => void
}

export function TargetingGrid({
  myShots,
  sunkOpponentShips,
  interactive,
  onFire,
}: TargetingGridProps) {
  const status = new Map<string, CellStatus>()
  for (const s of myShots) status.set(key(s.col, s.row), s.hit ? 'hit' : 'miss')
  for (const ship of sunkOpponentShips) {
    for (const c of ship.cells) status.set(key(c.col, c.row), 'sunk')
  }

  return (
    <BattleGrid
      label="Targeting Grid"
      ariaLabel="Targeting grid"
      renderCell={(col, row, coord) => {
        const k = key(col, row)
        const cellStatus = status.get(k) ?? 'unfired'
        const canFire = interactive && cellStatus === 'unfired'
        return (
          <button
            key={k}
            type="button"
            role="gridcell"
            aria-label={`${coord}, ${cellStatus}`}
            disabled={!canFire}
            className={cn(
              'flex size-8 items-center justify-center border transition-colors',
              STATUS_CLASS[cellStatus],
              canFire && 'cursor-crosshair hover:bg-[#EEF2FF]',
              'focus-visible:relative focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#4F46E5]',
            )}
            onClick={() => {
              onFire({ col, row })
            }}
          >
            {cellStatus === 'miss' ? (
              <span className="block size-2 rounded-full bg-[#CBD5E1]" aria-hidden="true" />
            ) : null}
          </button>
        )
      }}
    />
  )
}
