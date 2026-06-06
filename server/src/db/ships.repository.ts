import { randomUUID } from 'node:crypto'

import { getOccupiedCells } from '@shared/geometry'
import type { PlaceShipsRequest } from '@shared/schemas'

import { db } from './database.js'

export interface ShipRow {
  id: string
  game_id: string
  player_id: string
  type: PlaceShipsRequest['ships'][number]['type']
  orientation: PlaceShipsRequest['ships'][number]['orientation']
  origin_col: number
  origin_row: number
  sunk: number
}

const deleteStmt = db.prepare('DELETE FROM ships WHERE game_id = ? AND player_id = ?')
const insertStmt = db.prepare(
  `INSERT INTO ships (id, game_id, player_id, type, orientation, origin_col, origin_row)
   VALUES (?, ?, ?, ?, ?, ?, ?)`,
)
const selectStmt = db.prepare('SELECT * FROM ships WHERE game_id = ? AND player_id = ?')

const savePlacementTxn = db.transaction(
  (gameId: string, playerId: string, ships: PlaceShipsRequest['ships']) => {
    deleteStmt.run(gameId, playerId)
    for (const ship of ships) {
      insertStmt.run(
        randomUUID(),
        gameId,
        playerId,
        ship.type,
        ship.orientation,
        ship.origin_col,
        ship.origin_row,
      )
    }
  },
)

export function savePlacement(
  gameId: string,
  playerId: string,
  ships: PlaceShipsRequest['ships'],
): void {
  savePlacementTxn(gameId, playerId, ships)
}

export function getShips(gameId: string, playerId: string): ShipRow[] {
  return selectStmt.all(gameId, playerId) as ShipRow[]
}

export function getShipAtCell(
  gameId: string,
  playerId: string,
  col: number,
  row: number,
): ShipRow | null {
  for (const ship of getShips(gameId, playerId)) {
    const occupied = getOccupiedCells(ship).some((c) => c.col === col && c.row === row)
    if (occupied) return ship
  }
  return null
}
