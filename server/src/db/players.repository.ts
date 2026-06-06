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
const selectByIdStmt = db.prepare('SELECT * FROM players WHERE id = ?')

function toResponse(row: PlayerRow): PlayerResponse {
  return {
    ...row,
    win_rate: row.games_played === 0 ? 0 : row.wins / row.games_played,
  }
}

export function upsertPlayer(name: string): PlayerResponse {
  insertStmt.run(randomUUID(), name)
  return toResponse(selectStmt.get(name) as PlayerRow)
}

export function getPlayerById(id: string): PlayerResponse | null {
  const row = selectByIdStmt.get(id) as PlayerRow | undefined
  return row ? toResponse(row) : null
}
