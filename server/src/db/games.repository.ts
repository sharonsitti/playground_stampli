import { randomUUID } from 'node:crypto'

import type { Preset } from '@shared/schemas'

import { db } from './db.js'
import type { PlayerRow } from './players.repository.js'

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

export interface WaitingGameRow {
  id: string
  preset: Preset
  creator_id: string
  creator_name: string
  creator_games_played: number
  creator_wins: number
  creator_losses: number
}

const insertGameStmt = db.prepare<[string, string, string]>(
  'INSERT INTO games (id, preset, creator_id) VALUES (?, ?, ?)',
)

const getByIdStmt = db.prepare<[string], GameRow>('SELECT * FROM games WHERE id = ?')

const getWaitingStmt = db.prepare<[], WaitingGameRow>(
  `SELECT
     g.id,
     g.preset,
     g.creator_id,
     p.name AS creator_name,
     p.games_played AS creator_games_played,
     p.wins AS creator_wins,
     p.losses AS creator_losses
   FROM games g
   JOIN players p ON p.id = g.creator_id
   WHERE g.status = 'waiting'`,
)

const joinGameStmt = db.prepare<[string, string]>(
  "UPDATE games SET status = 'placing', joiner_id = ? WHERE id = ? AND status = 'waiting'",
)

const deleteGameStmt = db.prepare<[string]>("DELETE FROM games WHERE id = ? AND status = 'waiting'")

const setCreatorReadyStmt = db.prepare<[string]>(
  "UPDATE games SET creator_ready = 1 WHERE id = ? AND status = 'placing'",
)

const setJoinerReadyStmt = db.prepare<[string]>(
  "UPDATE games SET joiner_ready = 1 WHERE id = ? AND status = 'placing'",
)

const startBattleStmt = db.prepare<[string, string]>(
  "UPDATE games SET status = 'battle', current_turn = ? WHERE id = ? AND status = 'placing'",
)

const finishPlacementStmt = db.prepare<[string]>(
  "UPDATE games SET status = 'finished', winner_id = NULL WHERE id = ? AND status = 'placing'",
)

const setCurrentTurnStmt = db.prepare<[string, string]>(
  "UPDATE games SET current_turn = ? WHERE id = ? AND status = 'battle'",
)

export function createGame(creatorId: string, preset: Preset): GameRow {
  const id = randomUUID()
  insertGameStmt.run(id, preset, creatorId)
  return {
    id,
    preset,
    status: 'waiting',
    creator_id: creatorId,
    joiner_id: null,
    current_turn: null,
    winner_id: null,
    creator_ready: 0,
    joiner_ready: 0,
  }
}

export function getWaitingGames(): WaitingGameRow[] {
  return getWaitingStmt.all()
}

export function getGameById(gameId: string): GameRow | undefined {
  return getByIdStmt.get(gameId)
}

export function joinGame(gameId: string, joinerId: string): GameRow | undefined {
  if (joinGameStmt.run(joinerId, gameId).changes === 0) return undefined
  return getByIdStmt.get(gameId)
}

export function cancelGame(gameId: string): boolean {
  return deleteGameStmt.run(gameId).changes > 0
}

export function markPlayerReady(gameId: string, isCreator: boolean): GameRow | undefined {
  const stmt = isCreator ? setCreatorReadyStmt : setJoinerReadyStmt
  if (stmt.run(gameId).changes === 0) return undefined
  return getByIdStmt.get(gameId)
}

export function startBattle(gameId: string, firstTurn: string): GameRow | undefined {
  if (startBattleStmt.run(firstTurn, gameId).changes === 0) return undefined
  return getByIdStmt.get(gameId)
}

export function markPlacementExpired(gameId: string): boolean {
  return finishPlacementStmt.run(gameId).changes > 0
}

export function setCurrentTurn(gameId: string, playerId: string): GameRow | undefined {
  if (setCurrentTurnStmt.run(playerId, gameId).changes === 0) return undefined
  return getByIdStmt.get(gameId)
}

export function getPlayerById(playerId: string): PlayerRow | undefined {
  return db
    .prepare<
      [string],
      PlayerRow
    >('SELECT id, name, games_played, wins, losses FROM players WHERE id = ?')
    .get(playerId)
}
