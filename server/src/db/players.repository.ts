import { randomUUID } from 'node:crypto'

import { db } from './db.js'

export interface PlayerRow {
  id: string
  name: string
  games_played: number
  wins: number
  losses: number
}

const findByNameStmt = db.prepare<[string], PlayerRow>(
  'SELECT id, name, games_played, wins, losses FROM players WHERE name = ?',
)

const insertStmt = db.prepare<[string, string]>('INSERT INTO players (id, name) VALUES (?, ?)')

export function upsertPlayerByName(name: string): PlayerRow {
  const existing = findByNameStmt.get(name)
  if (existing) return existing

  const id = randomUUID()
  insertStmt.run(id, name)
  return { id, name, games_played: 0, wins: 0, losses: 0 }
}
