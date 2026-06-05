import { useState } from 'react'
import { getOccupiedCells } from '@shared/geometry'
import { SHIP_SIZES, type Orientation, type ShipType } from '@shared/schemas'

export type PlacedShip = {
  type: ShipType
  orientation: Orientation
  origin_col: number
  origin_row: number
}

export const FLEET: ShipType[] = ['carrier', 'battleship', 'cruiser', 'submarine', 'destroyer']

const COLS = 10
const MIN_ROW = 1
const MAX_ROW = 10

function cellKey(col: number, row: number) {
  return `${String(col)},${String(row)}`
}

export function isInBounds(col: number, row: number) {
  return col >= 0 && col < COLS && row >= MIN_ROW && row <= MAX_ROW
}

export type Selection = {
  type: ShipType
  orientation: Orientation
}

export function usePlacement() {
  const [placed, setPlaced] = useState<PlacedShip[]>([])
  const [selection, setSelection] = useState<Selection | null>(null)

  const placedTypes = new Set(placed.map((s) => s.type))
  const remaining = FLEET.filter((t) => !placedTypes.has(t))

  const occupied = new Map<string, ShipType>()
  for (const ship of placed) {
    for (const cell of getOccupiedCells(ship)) occupied.set(cellKey(cell.col, cell.row), ship.type)
  }

  function previewCells(originCol: number, originRow: number): { col: number; row: number }[] {
    if (!selection) return []
    return getOccupiedCells({
      type: selection.type,
      orientation: selection.orientation,
      origin_col: originCol,
      origin_row: originRow,
    })
  }

  function isValidPlacement(cells: { col: number; row: number }[]) {
    return cells.every((c) => isInBounds(c.col, c.row) && !occupied.has(cellKey(c.col, c.row)))
  }

  function selectFromPalette(type: ShipType) {
    setSelection({ type, orientation: selection?.orientation ?? 'H' })
  }

  function rotate() {
    setSelection((prev) =>
      prev ? { ...prev, orientation: prev.orientation === 'H' ? 'V' : 'H' } : prev,
    )
  }

  function placeAt(originCol: number, originRow: number) {
    if (!selection) return
    const cells = previewCells(originCol, originRow)
    if (!isValidPlacement(cells)) return
    setPlaced((prev) => [
      ...prev,
      {
        type: selection.type,
        orientation: selection.orientation,
        origin_col: originCol,
        origin_row: originRow,
      },
    ])
    setSelection(null)
  }

  function pickUp(type: ShipType) {
    const ship = placed.find((s) => s.type === type)
    if (!ship) return
    setPlaced((prev) => prev.filter((s) => s.type !== type))
    setSelection({ type: ship.type, orientation: ship.orientation })
  }

  function reset() {
    setPlaced([])
    setSelection(null)
  }

  return {
    placed,
    remaining,
    selection,
    occupied,
    allPlaced: placed.length === FLEET.length,
    // eslint-disable-next-line security/detect-object-injection -- ShipType is a fixed literal union, not user input
    shipSizeOf: (type: ShipType) => SHIP_SIZES[type] ?? 0,
    previewCells,
    isValidPlacement,
    selectFromPalette,
    rotate,
    placeAt,
    pickUp,
    reset,
  }
}
