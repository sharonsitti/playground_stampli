import { useEffect, useState } from 'react'
import { getOccupiedCells, SHIP_SIZES, type ShipDef } from '@shared/geometry'

export type ShipType = ShipDef['type']
export type Orientation = ShipDef['orientation']
export type Cell = { col: number; row: number }
export type PlacedShip = ShipDef & { placedAt: Cell[] }

export const FLEET: ShipType[] = ['carrier', 'battleship', 'cruiser', 'submarine', 'destroyer']

const COLS = 10
const FIRST_ROW = 1
const LAST_ROW = 10

const inBounds = (cell: Cell) =>
  cell.col >= 0 && cell.col < COLS && cell.row >= FIRST_ROW && cell.row <= LAST_ROW

function cellsOf(type: ShipType, orientation: Orientation, origin: Cell): Cell[] {
  return getOccupiedCells({
    type,
    orientation,
    origin_col: origin.col,
    origin_row: origin.row,
  })
}

export type Placement = {
  placedShips: PlacedShip[]
  selectedShip: ShipType | null
  cursorCell: Cell | null
  orientation: Orientation
  availableShips: ShipType[]
  previewCells: Cell[]
  isPreviewValid: boolean
  selectFromPalette: (type: ShipType) => void
  setCursorCell: (cell: Cell | null) => void
  placeAtCursor: () => void
  pickUpPlaced: (type: ShipType) => void
  reset: () => void
  cellToShip: Map<string, ShipType>
}

const key = (cell: Cell) => `${String(cell.col)},${String(cell.row)}`

export function usePlacement(): Placement {
  const [placedShips, setPlacedShips] = useState<PlacedShip[]>([])
  const [selectedShip, setSelectedShip] = useState<ShipType | null>(null)
  const [cursorCell, setCursorCell] = useState<Cell | null>(null)
  const [orientation, setOrientation] = useState<Orientation>('H')

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') {
        setOrientation((prev) => (prev === 'H' ? 'V' : 'H'))
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  const availableShips = FLEET.filter((type) => !placedShips.some((ship) => ship.type === type))

  const occupied = new Set<string>(
    placedShips.flatMap((ship) => ship.placedAt.map((cell) => key(cell))),
  )

  const cellToShip = new Map<string, ShipType>()
  for (const ship of placedShips) {
    for (const cell of ship.placedAt) {
      cellToShip.set(key(cell), ship.type)
    }
  }

  const previewCells =
    selectedShip && cursorCell ? cellsOf(selectedShip, orientation, cursorCell) : []

  const isPreviewValid =
    previewCells.length > 0 &&
    previewCells.every((cell) => inBounds(cell) && !occupied.has(key(cell)))

  const selectFromPalette = (type: ShipType) => {
    setSelectedShip(type)
  }

  const placeAtCursor = () => {
    if (!selectedShip || !cursorCell || !isPreviewValid) return
    const placed: PlacedShip = {
      type: selectedShip,
      orientation,
      origin_col: cursorCell.col,
      origin_row: cursorCell.row,
      placedAt: previewCells,
    }
    setPlacedShips((prev) => [...prev, placed])
    setSelectedShip(null)
  }

  const pickUpPlaced = (type: ShipType) => {
    setPlacedShips((prev) => prev.filter((ship) => ship.type !== type))
    setSelectedShip(type)
  }

  const reset = () => {
    setPlacedShips([])
    setSelectedShip(null)
    setCursorCell(null)
  }

  return {
    placedShips,
    selectedShip,
    cursorCell,
    orientation,
    availableShips,
    previewCells,
    isPreviewValid,
    selectFromPalette,
    setCursorCell,
    placeAtCursor,
    pickUpPlaced,
    reset,
    cellToShip,
  }
}

export { SHIP_SIZES }
