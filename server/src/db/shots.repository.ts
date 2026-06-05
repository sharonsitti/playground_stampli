import { randomUUID } from 'node:crypto'

import { db } from './db.js'

export interface ShotRow {
  id: string
  game_id: string
  player_id: string
  col: number
  row: number
  hit: number
}

const getShotStmt = db.prepare<[string, string, number, number], ShotRow>(
  'SELECT id, game_id, player_id, col, row, hit FROM shots WHERE game_id = ? AND player_id = ? AND col = ? AND row = ?',
)

const insertShotStmt = db.prepare<[string, string, string, number, number, number]>(
  'INSERT INTO shots (id, game_id, player_id, col, row, hit) VALUES (?, ?, ?, ?, ?, ?)',
)

const getShotsStmt = db.prepare<[string, string], ShotRow>(
  'SELECT id, game_id, player_id, col, row, hit FROM shots WHERE game_id = ? AND player_id = ?',
)

export function getShot(
  gameId: string,
  playerId: string,
  col: number,
  row: number,
): ShotRow | undefined {
  return getShotStmt.get(gameId, playerId, col, row)
}

export function recordShot(
  gameId: string,
  playerId: string,
  col: number,
  row: number,
  hit: boolean,
): void {
  insertShotStmt.run(randomUUID(), gameId, playerId, col, row, hit ? 1 : 0)
}

export function getShots(gameId: string, playerId: string): ShotRow[] {
  return getShotsStmt.all(gameId, playerId)
}
