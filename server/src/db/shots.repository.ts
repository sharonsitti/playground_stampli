import { randomUUID } from 'node:crypto'

import { db } from './database.js'

export interface ShotRow {
  id: string
  game_id: string
  player_id: string
  col: number
  row: number
  hit: number
}

const insertStmt = db.prepare(
  'INSERT INTO shots (id, game_id, player_id, col, row, hit) VALUES (?, ?, ?, ?, ?, ?)',
)
const selectStmt = db.prepare('SELECT * FROM shots WHERE game_id = ? AND player_id = ?')
const existsStmt = db.prepare(
  'SELECT 1 FROM shots WHERE game_id = ? AND player_id = ? AND col = ? AND row = ?',
)

export function recordShot(
  gameId: string,
  playerId: string,
  col: number,
  row: number,
  hit: boolean,
): void {
  insertStmt.run(randomUUID(), gameId, playerId, col, row, hit ? 1 : 0)
}

export function getShots(gameId: string, playerId: string): ShotRow[] {
  return selectStmt.all(gameId, playerId) as ShotRow[]
}

export function hasShot(gameId: string, playerId: string, col: number, row: number): boolean {
  return existsStmt.get(gameId, playerId, col, row) !== undefined
}
