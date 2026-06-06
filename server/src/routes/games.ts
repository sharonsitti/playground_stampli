import {
  DeleteGameRequest,
  DeleteGameResponse,
  JoinGameRequest,
  JoinGameResponse,
  PRESET_SECONDS,
} from '@shared/schemas'
import { Router, type Request, type Response } from 'express'

import { deleteGame, getGame, joinGame } from '../db/games.repository.js'
import { getPlayerById } from '../db/players.repository.js'
import { broadcastGame, broadcastLobby, gameClients, openStream, sendEvent } from '../sse.js'

export const gamesRouter = Router()

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
  }

  req.on('close', () => {
    const set = gameClients.get(gameId)
    if (!set) return
    set.delete(res)
    if (set.size === 0) gameClients.delete(gameId)
  })
})
