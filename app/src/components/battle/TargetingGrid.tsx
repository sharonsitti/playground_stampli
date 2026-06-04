import { cellKey } from '../placement/types'
import { BattleGrid, type BattleCellState } from './BattleGrid'
import type { ShotMark, SunkShip } from './types'

type TargetingGridProps = {
  myShots: Map<string, ShotMark>
  sunkShips: SunkShip[]
  canFire: boolean
  onFire: (col: number, row: number) => void
}

export function TargetingGrid({ myShots, sunkShips, canFire, onFire }: TargetingGridProps) {
  const sunkCells = new Set<string>()
  for (const ship of sunkShips) {
    for (const cell of ship.cells) {
      sunkCells.add(cellKey(cell.col, cell.row))
    }
  }

  function cellState(col: number, row: number): BattleCellState {
    const key = cellKey(col, row)
    if (sunkCells.has(key)) return 'sunk'
    const shot = myShots.get(key)
    if (shot) return shot.hit ? 'hit' : 'miss'
    return 'empty'
  }

  function isFireable(col: number, row: number): boolean {
    return canFire && !myShots.has(cellKey(col, row))
  }

  return (
    <BattleGrid
      label="Targeting grid"
      cellState={cellState}
      interactive={canFire}
      isFireable={isFireable}
      onFire={onFire}
    />
  )
}
