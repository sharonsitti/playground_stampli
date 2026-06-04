import { randomUUID } from 'node:crypto'

import type { GameStatus, Player, Preset } from '@shared/schemas'

import { getDb } from './database.js'

export interface Game {
  id: string
  preset: Preset
  status: GameStatus
  creator_id: string
  joiner_id: string | null
  current_turn: string | null
  winner_id: string | null
  creator_ready: number
  joiner_ready: number
}

export interface GameWithCreator {
  id: string
  preset: Preset
  creator: Player
}

interface GameCreatorRow {
  id: string
  preset: Preset
  player_id: string
  name: string
  games_played: number
  wins: number
  losses: number
}

export function createGame(creatorId: string, preset: Preset): Game {
  const db = getDb()
  const id = randomUUID()
  db.prepare('INSERT INTO games (id, preset, status, creator_id) VALUES (?, ?, ?, ?)').run(
    id,
    preset,
    'waiting',
    creatorId,
  )
  return getGame(id) as Game
}

export function getGame(gameId: string): Game | undefined {
  const db = getDb()
  return db.prepare('SELECT * FROM games WHERE id = ?').get(gameId) as Game | undefined
}

export function getWaitingGames(): GameWithCreator[] {
  const db = getDb()
  const rows = db
    .prepare(
      `SELECT g.id, g.preset,
              p.id AS player_id, p.name, p.games_played, p.wins, p.losses
       FROM games g
       JOIN players p ON p.id = g.creator_id
       WHERE g.status = 'waiting'`,
    )
    .all() as GameCreatorRow[]

  return rows.map((row) => ({
    id: row.id,
    preset: row.preset,
    creator: {
      id: row.player_id,
      name: row.name,
      games_played: row.games_played,
      wins: row.wins,
      losses: row.losses,
      win_rate: row.games_played === 0 ? 0 : row.wins / row.games_played,
    },
  }))
}

export function joinGame(gameId: string, joinerId: string): Game {
  const db = getDb()
  db.prepare("UPDATE games SET status = 'placing', joiner_id = ? WHERE id = ?").run(
    joinerId,
    gameId,
  )
  return getGame(gameId) as Game
}

export function deleteGame(gameId: string): void {
  const db = getDb()
  db.prepare('DELETE FROM games WHERE id = ?').run(gameId)
}

export function markPlayerReady(gameId: string, isCreator: boolean): Game {
  const db = getDb()
  const column = isCreator ? 'creator_ready' : 'joiner_ready'
  db.prepare(`UPDATE games SET ${column} = 1 WHERE id = ?`).run(gameId)
  return getGame(gameId) as Game
}

export function setBattlePhase(gameId: string, currentTurn: string): Game {
  const db = getDb()
  db.prepare("UPDATE games SET status = 'battle', current_turn = ? WHERE id = ?").run(
    currentTurn,
    gameId,
  )
  return getGame(gameId) as Game
}

export function updateGameStatus(gameId: string, status: GameStatus): void {
  const db = getDb()
  db.prepare('UPDATE games SET status = ? WHERE id = ?').run(status, gameId)
}

export function setCurrentTurn(gameId: string, playerId: string): Game {
  const db = getDb()
  db.prepare('UPDATE games SET current_turn = ? WHERE id = ?').run(playerId, gameId)
  return getGame(gameId) as Game
}

export function setGameFinished(gameId: string, winnerId: string): void {
  const db = getDb()
  db.prepare("UPDATE games SET status = 'finished', winner_id = ? WHERE id = ?").run(
    winnerId,
    gameId,
  )
}
