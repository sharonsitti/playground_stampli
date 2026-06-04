import { getOccupiedCells } from '@shared/geometry'
import { cellKey, type Cell, type PlacedShip, type SelectedShip } from './types'

function inBounds(cell: Cell): boolean {
  return cell.col >= 0 && cell.col <= 9 && cell.row >= 1 && cell.row <= 10
}

export function occupiedKeySet(ships: PlacedShip[]): Set<string> {
  const keys = new Set<string>()
  for (const ship of ships) {
    for (const cell of getOccupiedCells(ship)) {
      keys.add(cellKey(cell.col, cell.row))
    }
  }
  return keys
}

export function placedShipAt(col: number, row: number, ships: PlacedShip[]): PlacedShip | null {
  for (const ship of ships) {
    for (const cell of getOccupiedCells(ship)) {
      if (cell.col === col && cell.row === row) return ship
    }
  }
  return null
}

export type Preview = {
  cells: Cell[]
  valid: boolean
}

export function computePreview(
  selected: SelectedShip,
  hover: Cell,
  placedShips: PlacedShip[],
): Preview {
  const cells = getOccupiedCells({
    type: selected.type,
    orientation: selected.orientation,
    origin_col: hover.col,
    origin_row: hover.row,
  })
  const occupied = occupiedKeySet(placedShips)
  const valid = cells.every((cell) => inBounds(cell) && !occupied.has(cellKey(cell.col, cell.row)))
  return { cells, valid }
}
