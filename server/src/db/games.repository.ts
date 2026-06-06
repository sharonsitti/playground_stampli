import { randomUUID } from 'node:crypto'

import type { CreateGameResponse, GetGamesResponse } from '@shared/schemas'

import { db } from './database.js'

type Preset = CreateGameResponse['preset']

export interface GameRow {
  id: string
  preset: Preset
  status: 'waiting' | 'placing' | 'battle' | 'finished'
  creator_id: string
  joiner_id: string | null
  current_turn: string | null
  winner_id: string | null
  creator_ready: number
  joiner_ready: number
}

interface WaitingGameRow {
  id: string
  preset: Preset
  creator_id: string
  name: string
  games_played: number
  wins: number
  losses: number
}

const insertStmt = db.prepare('INSERT INTO games (id, preset, creator_id) VALUES (?, ?, ?)')
const waitingStmt = db.prepare(
  `SELECT g.id, g.preset, g.creator_id, p.name, p.games_played, p.wins, p.losses
   FROM games g JOIN players p ON p.id = g.creator_id
   WHERE g.status = 'waiting'`,
)
const joinStmt = db.prepare(
  "UPDATE games SET status = 'placing', joiner_id = ? WHERE id = ? AND status = 'waiting'",
)
const deleteStmt = db.prepare("DELETE FROM games WHERE id = ? AND status = 'waiting'")
const getStmt = db.prepare('SELECT * FROM games WHERE id = ?')
const readyCreatorStmt = db.prepare('UPDATE games SET creator_ready = 1 WHERE id = ?')
const readyJoinerStmt = db.prepare('UPDATE games SET joiner_ready = 1 WHERE id = ?')
const startBattleStmt = db.prepare(
  "UPDATE games SET status = 'battle', current_turn = ? WHERE id = ?",
)
const expirePlacementStmt = db.prepare(
  "UPDATE games SET status = 'finished', winner_id = NULL WHERE id = ?",
)
const updateTurnStmt = db.prepare('UPDATE games SET current_turn = ? WHERE id = ?')
const finishGameStmt = db.prepare(
  "UPDATE games SET status = 'finished', winner_id = ? WHERE id = ?",
)

export function createGame(creatorId: string, preset: Preset): CreateGameResponse {
  const id = randomUUID()
  insertStmt.run(id, preset, creatorId)
  return { id, preset, status: 'waiting', creator_id: creatorId }
}

export function getWaitingGames(): GetGamesResponse['games'] {
  const rows = waitingStmt.all() as WaitingGameRow[]
  return rows.map((row) => ({
    id: row.id,
    preset: row.preset,
    creator: {
      id: row.creator_id,
      name: row.name,
      games_played: row.games_played,
      wins: row.wins,
      losses: row.losses,
      win_rate: row.games_played === 0 ? 0 : row.wins / row.games_played,
    },
  }))
}

export function joinGame(gameId: string, joinerId: string): number {
  return joinStmt.run(joinerId, gameId).changes
}

export function deleteGame(gameId: string): number {
  return deleteStmt.run(gameId).changes
}

export function getGame(gameId: string): GameRow | null {
  return (getStmt.get(gameId) as GameRow | undefined) ?? null
}

export function markReady(gameId: string, isCreator: boolean): void {
  if (isCreator) {
    readyCreatorStmt.run(gameId)
  } else {
    readyJoinerStmt.run(gameId)
  }
}

export function startBattle(gameId: string, firstTurn: string): void {
  startBattleStmt.run(firstTurn, gameId)
}

export function expirePlacement(gameId: string): void {
  expirePlacementStmt.run(gameId)
}

export function updateCurrentTurn(gameId: string, playerId: string): void {
  updateTurnStmt.run(playerId, gameId)
}

export function finishGame(gameId: string, winnerId: string): void {
  finishGameStmt.run(winnerId, gameId)
}
