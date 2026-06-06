import { randomUUID } from 'node:crypto'

import type { PlayerResponse } from '@shared/schemas'

import { db } from './database.js'

interface PlayerRow {
  id: string
  name: string
  games_played: number
  wins: number
  losses: number
}

const insertStmt = db.prepare('INSERT OR IGNORE INTO players (id, name) VALUES (?, ?)')
const selectStmt = db.prepare('SELECT * FROM players WHERE name = ?')

export function upsertPlayer(name: string): PlayerResponse {
  insertStmt.run(randomUUID(), name)
  const row = selectStmt.get(name) as PlayerRow
  return {
    ...row,
    win_rate: row.games_played === 0 ? 0 : row.wins / row.games_played,
  }
}
