export type ShipType = 'carrier' | 'battleship' | 'cruiser' | 'submarine' | 'destroyer'

export type Orientation = 'H' | 'V'

export type PlacedShip = {
  type: ShipType
  orientation: Orientation
  origin_col: number
  origin_row: number
}

export type SelectedShip = {
  type: ShipType
  orientation: Orientation
}

export type Cell = {
  col: number
  row: number
}

export const FLEET: readonly ShipType[] = [
  'carrier',
  'battleship',
  'cruiser',
  'submarine',
  'destroyer',
]

export const COLS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j']
export const ROWS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

export function cellKey(col: number, row: number): string {
  return `${String(col)}-${String(row)}`
}
