import { randomUUID } from 'node:crypto'

import { getDb } from './database.js'

export interface Shot {
  id: string
  game_id: string
  player_id: string
  col: number
  row: number
  hit: number
}

export function saveShot(
  gameId: string,
  playerId: string,
  col: number,
  row: number,
  hit: boolean,
): Shot {
  const db = getDb()
  const id = randomUUID()
  db.prepare(
    'INSERT INTO shots (id, game_id, player_id, col, row, hit) VALUES (?, ?, ?, ?, ?, ?)',
  ).run(id, gameId, playerId, col, row, hit ? 1 : 0)
  return { id, game_id: gameId, player_id: playerId, col, row, hit: hit ? 1 : 0 }
}

export function getShotsByPlayer(gameId: string, playerId: string): Shot[] {
  const db = getDb()
  return db
    .prepare('SELECT * FROM shots WHERE game_id = ? AND player_id = ?')
    .all(gameId, playerId) as Shot[]
}

export function shotExists(gameId: string, playerId: string, col: number, row: number): boolean {
  const db = getDb()
  const row_ = db
    .prepare('SELECT 1 FROM shots WHERE game_id = ? AND player_id = ? AND col = ? AND row = ?')
    .get(gameId, playerId, col, row)
  return row_ !== undefined
}
