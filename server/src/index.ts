import {
  CreateGameRequestSchema,
  CreatePlayerRequestSchema,
  JoinGameRequestSchema,
  CancelGameRequestSchema,
  PlaceShipsRequestSchema,
  ReadyRequestSchema,
  PRESET_SECONDS,
  SHIP_SIZES,
  type ShipPlacement,
} from '@shared/schemas'
import { getOccupiedCells } from '@shared/geometry'
import express, { NextFunction, Request, Response } from 'express'

import './db/db.js'
import type { GameRow } from './db/games.repository.js'
import {
  cancelGame,
  createGame,
  getGameById,
  getPlayerById,
  getWaitingGames,
  joinGame,
  markPlacementExpired,
  markPlayerReady,
  startBattle,
} from './db/games.repository.js'
import type { PlayerRow } from './db/players.repository.js'
import { upsertPlayerByName } from './db/players.repository.js'
import { getShips, upsertShips } from './db/ships.repository.js'
import { addGameConnection, addLobbyConnection, emitGameEvent, emitLobbyEvent } from './sse.js'
import { cancelTimer, startTimer } from './timer.js'

export const app = express()

app.use(express.json())

app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') {
    res.sendStatus(204)
    return
  }
  next()
})

function toPlayerStats(player: PlayerRow) {
  const win_rate = player.games_played === 0 ? 0 : player.wins / player.games_played
  return { ...player, win_rate }
}

function gameIdParam(req: Request): string {
  const { gameId } = req.params
  return Array.isArray(gameId) ? gameId[0] : gameId
}

function openSseStream(res: Response): void {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()
}

function startPlacementTimer(game: GameRow): void {
  startTimer(
    game.id,
    PRESET_SECONDS[game.preset],
    (secondsRemaining) => {
      emitGameEvent(game.id, 'timer_tick', { seconds_remaining: secondsRemaining })
    },
    () => {
      if (markPlacementExpired(game.id)) {
        emitGameEvent(game.id, 'placement_expired', {})
      }
    },
  )
}

const REQUIRED_SHIP_TYPES = Object.keys(SHIP_SIZES)

function validatePlacement(ships: ShipPlacement[]): string | null {
  const types = new Set(ships.map((s) => s.type))
  if (ships.length !== REQUIRED_SHIP_TYPES.length || types.size !== REQUIRED_SHIP_TYPES.length) {
    return 'exactly one of each ship type is required'
  }

  const occupied = new Set<string>()
  for (const ship of ships) {
    for (const cell of getOccupiedCells(ship)) {
      if (cell.col < 0 || cell.col > 9 || cell.row < 1 || cell.row > 10) {
        return 'ship is out of bounds'
      }
      const key = `${String(cell.col)},${String(cell.row)}`
      if (occupied.has(key)) return 'ships overlap'
      occupied.add(key)
    }
  }
  return null
}

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' })
})

app.post('/api/players', (req: Request, res: Response) => {
  const parsed = CreatePlayerRequestSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'name is required' })
    return
  }

  const player = upsertPlayerByName(parsed.data.name)
  res.json(toPlayerStats(player))
})

app.get('/api/games', (_req: Request, res: Response) => {
  const games = getWaitingGames().map((g) => ({
    id: g.id,
    preset: g.preset,
    creator: toPlayerStats({
      id: g.creator_id,
      name: g.creator_name,
      games_played: g.creator_games_played,
      wins: g.creator_wins,
      losses: g.creator_losses,
    }),
  }))
  res.json({ games })
})

app.post('/api/games', (req: Request, res: Response) => {
  const parsed = CreateGameRequestSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'creator_id and preset are required' })
    return
  }

  const creator = getPlayerById(parsed.data.creator_id)
  if (!creator) {
    res.status(400).json({ error: 'creator not found' })
    return
  }

  const game = createGame(creator.id, parsed.data.preset)
  emitLobbyEvent('game_created', {
    id: game.id,
    preset: game.preset,
    creator: toPlayerStats(creator),
  })

  res.json({
    id: game.id,
    preset: game.preset,
    status: 'waiting',
    creator_id: game.creator_id,
  })
})

app.post('/api/games/:gameId/join', (req: Request, res: Response) => {
  const gameId = gameIdParam(req)
  const game = getGameById(gameId)
  if (!game || game.status !== 'waiting') {
    res.status(409).json({ error: 'game is not joinable' })
    return
  }

  const parsed = JoinGameRequestSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'player_id is required' })
    return
  }
  if (parsed.data.player_id === game.creator_id) {
    res.status(403).json({ error: 'cannot join your own game' })
    return
  }

  const joiner = getPlayerById(parsed.data.player_id)
  if (!joiner) {
    res.status(400).json({ error: 'player not found' })
    return
  }

  const updated = joinGame(gameId, joiner.id)
  if (!updated?.joiner_id) {
    res.status(409).json({ error: 'game is not joinable' })
    return
  }

  emitLobbyEvent('game_removed', { id: gameId })
  emitGameEvent(gameId, 'player_joined', {
    joiner: { id: joiner.id, name: joiner.name },
    timer_seconds: PRESET_SECONDS[updated.preset],
  })
  startPlacementTimer(updated)

  res.json({
    id: updated.id,
    preset: updated.preset,
    status: 'placing',
    creator_id: updated.creator_id,
    joiner_id: updated.joiner_id,
  })
})

app.post('/api/games/:gameId/place', (req: Request, res: Response) => {
  const gameId = gameIdParam(req)
  const game = getGameById(gameId)
  if (!game || game.status !== 'placing') {
    res.status(409).json({ error: 'game is not in the placement phase' })
    return
  }

  const parsed = PlaceShipsRequestSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'player_id and ships are required' })
    return
  }
  if (parsed.data.player_id !== game.creator_id && parsed.data.player_id !== game.joiner_id) {
    res.status(403).json({ error: 'player is not in this game' })
    return
  }

  const invalid = validatePlacement(parsed.data.ships)
  if (invalid) {
    res.status(400).json({ error: invalid })
    return
  }

  upsertShips(gameId, parsed.data.player_id, parsed.data.ships)
  res.json({ ok: true })
})

app.post('/api/games/:gameId/ready', (req: Request, res: Response) => {
  const gameId = gameIdParam(req)
  const game = getGameById(gameId)
  if (!game || game.status !== 'placing') {
    res.status(409).json({ error: 'game is not in the placement phase' })
    return
  }

  const parsed = ReadyRequestSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'player_id is required' })
    return
  }
  const isCreator = parsed.data.player_id === game.creator_id
  if (!isCreator && parsed.data.player_id !== game.joiner_id) {
    res.status(403).json({ error: 'player is not in this game' })
    return
  }

  if (getShips(gameId, parsed.data.player_id).length !== Object.keys(SHIP_SIZES).length) {
    res.status(400).json({ error: 'all 5 ships must be placed before readying' })
    return
  }

  const updated = markPlayerReady(gameId, isCreator)
  if (!updated) {
    res.status(409).json({ error: 'game is not in the placement phase' })
    return
  }
  emitGameEvent(gameId, 'player_ready', { player_id: parsed.data.player_id })

  if (updated.creator_ready === 1 && updated.joiner_ready === 1) {
    const started = startBattle(gameId, updated.creator_id)
    if (started) {
      cancelTimer(gameId)
      emitGameEvent(gameId, 'battle_start', {
        current_turn: started.creator_id,
        timer_seconds: PRESET_SECONDS[started.preset],
      })
    }
  }

  res.json({ ok: true })
})

app.delete('/api/games/:gameId', (req: Request, res: Response) => {
  const gameId = gameIdParam(req)
  const game = getGameById(gameId)
  if (!game) {
    res.status(404).json({ error: 'game not found' })
    return
  }
  if (game.status !== 'waiting') {
    res.status(409).json({ error: 'game cannot be cancelled' })
    return
  }

  const parsed = CancelGameRequestSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'player_id is required' })
    return
  }
  if (parsed.data.player_id !== game.creator_id) {
    res.status(403).json({ error: 'only the creator can cancel' })
    return
  }

  cancelGame(gameId)
  emitLobbyEvent('game_removed', { id: gameId })
  res.json({ ok: true })
})

app.get('/api/lobby/events', (_req: Request, res: Response) => {
  openSseStream(res)
  addLobbyConnection(res)
})

app.get('/api/games/:gameId/events', (req: Request, res: Response) => {
  openSseStream(res)
  addGameConnection(gameIdParam(req), res)
})

if (process.env.NODE_ENV !== 'test') {
  app.listen(8000, () => {
    console.log('API running at http://localhost:8000')
  })
}
