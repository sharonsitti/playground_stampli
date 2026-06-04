import { getOccupiedCells } from '@shared/geometry'
import { cellKey, type PlacedShip } from '../placement/types'
import { BattleGrid, type BattleCellState } from './BattleGrid'
import type { ShotMark } from './types'

type BattleFleetGridProps = {
  placedShips: PlacedShip[]
  opponentShots: Map<string, ShotMark>
}

export function BattleFleetGrid({ placedShips, opponentShots }: BattleFleetGridProps) {
  const shipCells = new Set<string>()
  for (const ship of placedShips) {
    for (const cell of getOccupiedCells(ship)) {
      shipCells.add(cellKey(cell.col, cell.row))
    }
  }

  function cellState(col: number, row: number): BattleCellState {
    const key = cellKey(col, row)
    const shot = opponentShots.get(key)
    if (shot) return shot.hit ? 'hit' : 'miss'
    if (shipCells.has(key)) return 'ship'
    return 'empty'
  }

  return <BattleGrid label="Fleet grid" cellState={cellState} interactive={false} />
}
