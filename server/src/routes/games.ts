import { getOccupiedCells, SHIP_SIZES } from '@shared/geometry'
import {
  DeleteGameRequest,
  DeleteGameResponse,
  JoinGameRequest,
  JoinGameResponse,
  OkResponse,
  PlaceShipsRequest,
  PRESET_SECONDS,
  ReadyRequest,
} from '@shared/schemas'
import { Router, type Request, type Response } from 'express'

import {
  deleteGame,
  expirePlacement,
  type GameRow,
  getGame,
  joinGame,
  markReady,
  startBattle,
} from '../db/games.repository.js'
import { getPlayerById } from '../db/players.repository.js'
import { savePlacement } from '../db/ships.repository.js'
import { broadcastGame, broadcastLobby, gameClients, openStream, sendEvent } from '../sse.js'
import { clearTimer, getCurrentSeconds, startTimer } from '../timer.js'

export const gamesRouter = Router()

const FLEET = Object.keys(SHIP_SIZES) as Array<keyof typeof SHIP_SIZES>

export function startPlacementTimer(game: GameRow): void {
  const gameId = game.id
  startTimer(
    gameId,
    PRESET_SECONDS[game.preset],
    (remaining) => {
      broadcastGame(gameId, 'timer_tick', { seconds_remaining: remaining })
    },
    () => {
      expirePlacement(gameId)
      broadcastGame(gameId, 'placement_expired', {})
      clearTimer(gameId)
    },
  )
}

function validatePlacement(ships: PlaceShipsRequest['ships']): string | null {
  if (ships.length !== FLEET.length) return 'Fleet must contain exactly 5 ships'

  const types = new Set(ships.map((s) => s.type))
  if (types.size !== FLEET.length || FLEET.some((t) => !types.has(t))) {
    return 'Fleet must contain one of each ship type'
  }

  const occupied = new Set<string>()
  for (const ship of ships) {
    for (const cell of getOccupiedCells(ship)) {
      if (cell.col < 0 || cell.col > 9 || cell.row < 1 || cell.row > 10) {
        return 'Ship is out of bounds'
      }
      const key = `${String(cell.col)},${String(cell.row)}`
      if (occupied.has(key)) return 'Ships overlap'
      occupied.add(key)
    }
  }

  return null
}

gamesRouter.post('/api/games/:gameId/join', (req: Request, res: Response) => {
  const gameId = String(req.params.gameId)

  const game = getGame(gameId)
  if (!game || game.status !== 'waiting') {
    res.status(409).json({ error: 'Game is not available to join' })
    return
  }

  const parsed = JoinGameRequest.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid join request' })
    return
  }
  const { player_id } = parsed.data

  if (player_id === game.creator_id) {
    res.status(403).json({ error: 'Cannot join your own game' })
    return
  }

  const joiner = getPlayerById(player_id)
  if (!joiner) {
    res.status(400).json({ error: 'Unknown player' })
    return
  }

  if (joinGame(gameId, player_id) === 0) {
    res.status(409).json({ error: 'Game is not available to join' })
    return
  }

  broadcastLobby('game_removed', { id: gameId })
  broadcastGame(gameId, 'player_joined', {
    joiner: { id: joiner.id, name: joiner.name },
    timer_seconds: PRESET_SECONDS[game.preset],
  })
  startPlacementTimer(game)

  res.json(
    JoinGameResponse.parse({
      id: gameId,
      preset: game.preset,
      status: 'placing',
      creator_id: game.creator_id,
      joiner_id: player_id,
    }),
  )
})

gamesRouter.delete('/api/games/:gameId', (req: Request, res: Response) => {
  const gameId = String(req.params.gameId)

  const game = getGame(gameId)
  if (!game || game.status !== 'waiting') {
    res.status(409).json({ error: 'Game cannot be cancelled' })
    return
  }

  const parsed = DeleteGameRequest.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid cancel request' })
    return
  }

  if (parsed.data.player_id !== game.creator_id) {
    res.status(403).json({ error: 'Only the creator can cancel the game' })
    return
  }

  deleteGame(gameId)
  broadcastLobby('game_removed', { id: gameId })
  res.json(DeleteGameResponse.parse({ ok: true }))
})

function isParticipant(game: GameRow, playerId: string): boolean {
  return playerId === game.creator_id || playerId === game.joiner_id
}

gamesRouter.post('/api/games/:gameId/place', (req: Request, res: Response) => {
  const gameId = String(req.params.gameId)

  const game = getGame(gameId)
  if (!game || game.status !== 'placing') {
    res.status(409).json({ error: 'Game is not in the placement phase' })
    return
  }

  const parsed = PlaceShipsRequest.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid placement request' })
    return
  }
  const { player_id, ships } = parsed.data

  if (!isParticipant(game, player_id)) {
    res.status(403).json({ error: 'Not a participant in this game' })
    return
  }

  const invalid = validatePlacement(ships)
  if (invalid) {
    res.status(400).json({ error: invalid })
    return
  }

  savePlacement(gameId, player_id, ships)
  res.json(OkResponse.parse({ ok: true }))
})

gamesRouter.post('/api/games/:gameId/ready', (req: Request, res: Response) => {
  const gameId = String(req.params.gameId)

  const game = getGame(gameId)
  if (!game || game.status !== 'placing') {
    res.status(409).json({ error: 'Game is not in the placement phase' })
    return
  }

  const parsed = ReadyRequest.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid ready request' })
    return
  }
  const { player_id } = parsed.data

  if (!isParticipant(game, player_id)) {
    res.status(403).json({ error: 'Not a participant in this game' })
    return
  }

  const isCreator = player_id === game.creator_id
  markReady(gameId, isCreator)
  broadcastGame(gameId, 'player_ready', { player_id })

  const creatorReady = isCreator || game.creator_ready === 1
  const joinerReady = !isCreator || game.joiner_ready === 1
  if (creatorReady && joinerReady) {
    startBattle(gameId, game.creator_id)
    clearTimer(gameId)
    broadcastGame(gameId, 'battle_start', {
      current_turn: game.creator_id,
      timer_seconds: PRESET_SECONDS[game.preset],
    })
  }

  res.json(OkResponse.parse({ ok: true }))
})

gamesRouter.get('/api/games/:gameId/events', (req: Request, res: Response) => {
  const gameId = String(req.params.gameId)

  openStream(res)

  let clients = gameClients.get(gameId)
  if (!clients) {
    clients = new Set()
    gameClients.set(gameId, clients)
  }
  clients.add(res)

  const game = getGame(gameId)
  if (game && game.status === 'placing' && game.joiner_id) {
    const joiner = getPlayerById(game.joiner_id)
    if (joiner) {
      sendEvent(res, 'player_joined', {
        joiner: { id: joiner.id, name: joiner.name },
        timer_seconds: PRESET_SECONDS[game.preset],
      })
    }
    const remaining = getCurrentSeconds(gameId)
    if (remaining !== null) {
      sendEvent(res, 'timer_tick', { seconds_remaining: remaining })
    }
  }

  req.on('close', () => {
    const set = gameClients.get(gameId)
    if (!set) return
    set.delete(res)
    if (set.size === 0) gameClients.delete(gameId)
  })
})
