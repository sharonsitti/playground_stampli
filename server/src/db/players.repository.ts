import { randomUUID } from 'node:crypto'

import type { Player } from '@shared/schemas'

import { getDb } from './database.js'

interface PlayerRow {
  id: string
  name: string
  games_played: number
  wins: number
  losses: number
}

function toPlayer(row: PlayerRow): Player {
  return {
    ...row,
    win_rate: row.games_played === 0 ? 0 : row.wins / row.games_played,
  }
}

export function upsertPlayer(name: string): Player {
  const db = getDb()
  const existing = db.prepare('SELECT * FROM players WHERE name = ?').get(name) as
    | PlayerRow
    | undefined
  if (existing) {
    return toPlayer(existing)
  }

  const id = randomUUID()
  db.prepare('INSERT INTO players (id, name) VALUES (?, ?)').run(id, name)
  return toPlayer({ id, name, games_played: 0, wins: 0, losses: 0 })
}

export function getPlayerById(id: string): Player | undefined {
  const db = getDb()
  const row = db.prepare('SELECT * FROM players WHERE id = ?').get(id) as PlayerRow | undefined
  return row ? toPlayer(row) : undefined
}

export function incrementWin(playerId: string): Player {
  const db = getDb()
  db.prepare(
    'UPDATE players SET wins = wins + 1, games_played = games_played + 1 WHERE id = ?',
  ).run(playerId)
  return getPlayerById(playerId) as Player
}

export function incrementLoss(playerId: string): Player {
  const db = getDb()
  db.prepare(
    'UPDATE players SET losses = losses + 1, games_played = games_played + 1 WHERE id = ?',
  ).run(playerId)
  return getPlayerById(playerId) as Player
}
