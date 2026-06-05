import { randomUUID } from 'node:crypto'

import type { Orientation, ShipPlacement, ShipType } from '@shared/schemas'

import { db } from './db.js'

export interface ShipRow {
  id: string
  game_id: string
  player_id: string
  type: ShipType
  orientation: Orientation
  origin_col: number
  origin_row: number
  sunk: number
}

const deleteShipsStmt = db.prepare<[string, string]>(
  'DELETE FROM ships WHERE game_id = ? AND player_id = ?',
)

const insertShipStmt = db.prepare<[string, string, string, string, string, number, number]>(
  'INSERT INTO ships (id, game_id, player_id, type, orientation, origin_col, origin_row) VALUES (?, ?, ?, ?, ?, ?, ?)',
)

const getShipsStmt = db.prepare<[string, string], ShipRow>(
  'SELECT id, game_id, player_id, type, orientation, origin_col, origin_row, sunk FROM ships WHERE game_id = ? AND player_id = ?',
)

const markShipSunkStmt = db.prepare<[string]>('UPDATE ships SET sunk = 1 WHERE id = ?')

const replaceShips = db.transaction((gameId: string, playerId: string, ships: ShipPlacement[]) => {
  deleteShipsStmt.run(gameId, playerId)
  for (const ship of ships) {
    insertShipStmt.run(
      randomUUID(),
      gameId,
      playerId,
      ship.type,
      ship.orientation,
      ship.origin_col,
      ship.origin_row,
    )
  }
})

export function upsertShips(gameId: string, playerId: string, ships: ShipPlacement[]): void {
  replaceShips(gameId, playerId, ships)
}

export function getShips(gameId: string, playerId: string): ShipRow[] {
  return getShipsStmt.all(gameId, playerId)
}

export function markShipSunk(shipId: string): void {
  markShipSunkStmt.run(shipId)
}
