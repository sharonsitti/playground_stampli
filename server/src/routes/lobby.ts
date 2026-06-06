import { CreateGameRequest, CreateGameResponse, GetGamesResponse } from '@shared/schemas'
import { Router, type Request, type Response } from 'express'

import { createGame, getWaitingGames } from '../db/games.repository.js'
import { getPlayerById } from '../db/players.repository.js'
import { broadcastLobby, lobbyClients, openStream } from '../sse.js'

export const lobbyRouter = Router()

lobbyRouter.get('/api/games', (_req: Request, res: Response) => {
  res.json(GetGamesResponse.parse({ games: getWaitingGames() }))
})

lobbyRouter.post('/api/games', (req: Request, res: Response) => {
  const parsed = CreateGameRequest.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid game request' })
    return
  }

  const creator = getPlayerById(parsed.data.creator_id)
  if (!creator) {
    res.status(400).json({ error: 'Unknown creator' })
    return
  }

  const game = createGame(parsed.data.creator_id, parsed.data.preset)
  broadcastLobby('game_created', { id: game.id, preset: game.preset, creator })
  res.json(CreateGameResponse.parse(game))
})

lobbyRouter.get('/api/lobby/events', (req: Request, res: Response) => {
  openStream(res)
  lobbyClients.add(res)
  req.on('close', () => {
    lobbyClients.delete(res)
  })
})
