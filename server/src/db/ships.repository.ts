import { randomUUID } from 'node:crypto'

import type { ShipPlacement, ShipType } from '@shared/schemas'

import { getDb } from './database.js'

export interface Ship {
  id: string
  game_id: string
  player_id: string
  type: ShipType
  orientation: 'H' | 'V'
  origin_col: number
  origin_row: number
  sunk: number
}

export function saveShips(gameId: string, playerId: string, ships: ShipPlacement[]): void {
  const db = getDb()
  const insert = db.prepare(
    `INSERT INTO ships (id, game_id, player_id, type, orientation, origin_col, origin_row)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  )
  const insertAll = db.transaction((rows: ShipPlacement[]) => {
    for (const ship of rows) {
      insert.run(
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
  insertAll(ships)
}

export function getShips(gameId: string, playerId: string): Ship[] {
  const db = getDb()
  return db
    .prepare('SELECT * FROM ships WHERE game_id = ? AND player_id = ?')
    .all(gameId, playerId) as Ship[]
}

export function deleteShips(gameId: string, playerId: string): void {
  const db = getDb()
  db.prepare('DELETE FROM ships WHERE game_id = ? AND player_id = ?').run(gameId, playerId)
}

export function markShipSunk(shipId: string): void {
  const db = getDb()
  db.prepare('UPDATE ships SET sunk = 1 WHERE id = ?').run(shipId)
}
