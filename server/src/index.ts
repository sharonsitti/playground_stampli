import express, { NextFunction, Request, Response } from 'express'

import { getOccupiedCells } from '@shared/geometry'
import {
  CreateGameRequestSchema,
  CreateGameResponseSchema,
  CreatePlayerRequestSchema,
  DeleteGameRequestSchema,
  JoinGameRequestSchema,
  JoinGameResponseSchema,
  ListGamesResponseSchema,
  PRESET_SECONDS,
  PlaceShipsRequestSchema,
  PlayerSchema,
  ReadyRequestSchema,
  ShipTypeSchema,
  ShotRequestSchema,
} from '@shared/schemas'

import {
  createGame,
  deleteGame,
  getGame,
  getWaitingGames,
  joinGame,
  markPlayerReady,
  setBattlePhase,
  setCurrentTurn,
  setGameFinished,
  updateGameStatus,
} from './db/games.repository.js'
import {
  getPlayerById,
  incrementLoss,
  incrementWin,
  upsertPlayer,
} from './db/players.repository.js'
import { deleteShips, getShips, markShipSunk, saveShips } from './db/ships.repository.js'
import { getShotsByPlayer, saveShot, shotExists } from './db/shots.repository.js'
import {
  addGameClient,
  addLobbyClient,
  broadcastGameEvent,
  broadcastLobbyEvent,
  removeGameClient,
  removeLobbyClient,
  sendGameEvent,
} from './sse.js'
import { cancelTimer, getTimerRemaining, startTimer } from './timer.js'

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

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' })
})

app.post('/api/players', (req: Request, res: Response) => {
  const parsed = CreatePlayerRequestSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'name is required' })
    return
  }

  const name = parsed.data.name.trim()
  if (name.length === 0) {
    res.status(400).json({ error: 'name must contain at least 1 non-whitespace character' })
    return
  }

  const player = upsertPlayer(name)
  res.status(200).json(PlayerSchema.parse(player))
})

app.get('/api/lobby/events', (req: Request, res: Response) => {
  addLobbyClient(res)
  req.on('close', () => {
    removeLobbyClient(res)
  })
})

app.get('/api/games', (_req: Request, res: Response) => {
  res.status(200).json(ListGamesResponseSchema.parse({ games: getWaitingGames() }))
})

app.post('/api/games', (req: Request, res: Response) => {
  const parsed = CreateGameRequestSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'creator_id and preset are required' })
    return
  }

  const creator = getPlayerById(parsed.data.creator_id)
  if (!creator) {
    res.status(400).json({ error: 'creator does not exist' })
    return
  }

  const game = createGame(parsed.data.creator_id, parsed.data.preset)
  const response = CreateGameResponseSchema.parse({
    id: game.id,
    preset: game.preset,
    status: game.status,
    creator_id: game.creator_id,
  })
  broadcastLobbyEvent('game_created', { id: game.id, preset: game.preset, creator })
  res.status(200).json(response)
})

app.post('/api/games/:gameId/join', (req: Request<{ gameId: string }>, res: Response) => {
  const game = getGame(req.params.gameId)
  if (!game) {
    res.status(404).json({ error: 'game not found' })
    return
  }
  // NF3 AC5 ordering: status (409) → authorization (403) → input validity (400).
  if (game.status !== 'waiting') {
    res.status(409).json({ error: 'game is not available' })
    return
  }

  const parsed = JoinGameRequestSchema.safeParse(req.body)
  if (parsed.success && parsed.data.player_id === game.creator_id) {
    res.status(403).json({ error: 'cannot join your own game' })
    return
  }
  if (!parsed.success) {
    res.status(400).json({ error: 'player_id is required' })
    return
  }

  const joiner = getPlayerById(parsed.data.player_id)
  if (!joiner) {
    res.status(400).json({ error: 'player does not exist' })
    return
  }

  const updated = joinGame(game.id, joiner.id)
  const response = JoinGameResponseSchema.parse({
    id: updated.id,
    preset: updated.preset,
    status: updated.status,
    creator_id: updated.creator_id,
    joiner_id: updated.joiner_id,
  })
  broadcastLobbyEvent('game_removed', { id: game.id })
  broadcastGameEvent(game.id, 'player_joined', {
    joiner: { id: joiner.id, name: joiner.name },
    timer_seconds: PRESET_SECONDS[updated.preset],
  })
  startTimer(
    game.id,
    PRESET_SECONDS[updated.preset],
    (remaining) => {
      broadcastGameEvent(game.id, 'timer_tick', { seconds_remaining: remaining })
    },
    () => {
      // Re-check status: if both players readied up in the last tick window,
      // the game may already be in 'battle' — don't overwrite it.
      if (getGame(game.id)?.status === 'placing') {
        updateGameStatus(game.id, 'finished')
        broadcastGameEvent(game.id, 'placement_expired', {})
      }
    },
  )
  res.status(200).json(response)
})

app.delete('/api/games/:gameId', (req: Request<{ gameId: string }>, res: Response) => {
  const game = getGame(req.params.gameId)
  if (!game) {
    res.status(404).json({ error: 'game not found' })
    return
  }
  // NF3 AC5 ordering: status (409) → authorization (403) → input validity (400).
  if (game.status !== 'waiting') {
    res.status(409).json({ error: 'game is not available' })
    return
  }

  const parsed = DeleteGameRequestSchema.safeParse(req.body)
  if (parsed.success && parsed.data.player_id !== game.creator_id) {
    res.status(403).json({ error: 'only the creator can cancel the game' })
    return
  }
  if (!parsed.success) {
    res.status(400).json({ error: 'player_id is required' })
    return
  }

  deleteGame(game.id)
  broadcastLobbyEvent('game_removed', { id: game.id })
  res.status(200).json({ ok: true })
})

function isPlayerInGame(game: { creator_id: string; joiner_id: string | null }, playerId: string) {
  return playerId === game.creator_id || playerId === game.joiner_id
}

function opponentOf(
  game: { creator_id: string; joiner_id: string | null },
  playerId: string,
): string {
  return playerId === game.creator_id ? (game.joiner_id ?? '') : game.creator_id
}

// Resettable per-turn battle timer (KDD #2). On expiry it forfeits the active
// player's turn, hands control to the opponent, and restarts itself — so the
// countdown always reflects the live current_turn.
function startBattleTurnTimer(gameId: string): void {
  const game = getGame(gameId)
  if (!game) return
  startTimer(
    gameId,
    PRESET_SECONDS[game.preset],
    (remaining) => {
      broadcastGameEvent(gameId, 'timer_tick', { seconds_remaining: remaining })
    },
    () => {
      const current = getGame(gameId)
      if (current?.status !== 'battle' || !current.current_turn) return
      const expiredPlayer = current.current_turn
      const nextTurn = opponentOf(current, expiredPlayer)
      setCurrentTurn(gameId, nextTurn)
      broadcastGameEvent(gameId, 'turn_expired', {
        player_id: expiredPlayer,
        next_turn: nextTurn,
      })
      startBattleTurnTimer(gameId)
    },
  )
}

const ALL_SHIP_TYPES = ShipTypeSchema.options

app.post('/api/games/:gameId/place', (req: Request<{ gameId: string }>, res: Response) => {
  const game = getGame(req.params.gameId)
  if (!game) {
    res.status(404).json({ error: 'game not found' })
    return
  }
  // NF3 AC5 ordering: status (409) → authorization (403) → input validity (400).
  if (game.status !== 'placing') {
    res.status(409).json({ error: 'game is not in the placement phase' })
    return
  }

  const parsed = PlaceShipsRequestSchema.safeParse(req.body)
  if (parsed.success && !isPlayerInGame(game, parsed.data.player_id)) {
    res.status(403).json({ error: 'player is not part of this game' })
    return
  }
  if (!parsed.success) {
    res.status(400).json({ error: 'player_id and ships are required' })
    return
  }

  const { player_id, ships } = parsed.data
  const types = ships.map((s) => s.type)
  const hasAllTypes =
    types.length === ALL_SHIP_TYPES.length &&
    ALL_SHIP_TYPES.every((t) => types.includes(t)) &&
    new Set(types).size === ALL_SHIP_TYPES.length
  if (!hasAllTypes) {
    res.status(400).json({ error: 'all 5 ships must be placed, one of each type' })
    return
  }

  const occupied = new Set<string>()
  for (const ship of ships) {
    for (const cell of getOccupiedCells(ship)) {
      if (cell.col < 0 || cell.col > 9 || cell.row < 1 || cell.row > 10) {
        res.status(400).json({ error: 'ships must fit within the 10x10 grid' })
        return
      }
      const key = `${cell.col.toString()},${cell.row.toString()}`
      if (occupied.has(key)) {
        res.status(400).json({ error: 'ships must not overlap' })
        return
      }
      occupied.add(key)
    }
  }

  deleteShips(game.id, player_id)
  saveShips(game.id, player_id, ships)
  res.status(200).json({ ok: true })
})

app.post('/api/games/:gameId/ready', (req: Request<{ gameId: string }>, res: Response) => {
  const game = getGame(req.params.gameId)
  if (!game) {
    res.status(404).json({ error: 'game not found' })
    return
  }
  // NF3 AC5 ordering: status (409) → authorization (403) → input validity (400).
  if (game.status !== 'placing') {
    res.status(409).json({ error: 'game is not in the placement phase' })
    return
  }

  const parsed = ReadyRequestSchema.safeParse(req.body)
  if (parsed.success && !isPlayerInGame(game, parsed.data.player_id)) {
    res.status(403).json({ error: 'player is not part of this game' })
    return
  }
  if (!parsed.success) {
    res.status(400).json({ error: 'player_id is required' })
    return
  }

  const { player_id } = parsed.data
  if (getShips(game.id, player_id).length === 0) {
    res.status(400).json({ error: 'ships must be submitted before readying up' })
    return
  }

  const isCreator = player_id === game.creator_id
  const updated = markPlayerReady(game.id, isCreator)
  broadcastGameEvent(game.id, 'player_ready', { player_id })

  if (updated.creator_ready === 1 && updated.joiner_ready === 1) {
    cancelTimer(game.id)
    const battle = setBattlePhase(game.id, game.creator_id)
    broadcastGameEvent(game.id, 'battle_start', {
      current_turn: battle.creator_id,
      timer_seconds: PRESET_SECONDS[battle.preset],
    })
    startBattleTurnTimer(game.id)
  }

  res.status(200).json({ ok: true })
})

app.post('/api/games/:gameId/shot', (req: Request<{ gameId: string }>, res: Response) => {
  const game = getGame(req.params.gameId)
  if (!game) {
    res.status(404).json({ error: 'game not found' })
    return
  }
  // NF3 AC5 ordering: status (409) → turn/authorization (403) → input validity (400).
  if (game.status !== 'battle') {
    res.status(409).json({ error: 'game is not in the battle phase' })
    return
  }

  const parsed = ShotRequestSchema.safeParse(req.body)
  if (parsed.success && parsed.data.player_id !== game.current_turn) {
    res.status(403).json({ error: 'it is not your turn' })
    return
  }
  if (!parsed.success) {
    res.status(400).json({ error: 'player_id, col (0-9) and row (1-10) are required' })
    return
  }

  const { player_id, col, row } = parsed.data
  if (shotExists(game.id, player_id, col, row)) {
    res.status(400).json({ error: 'cell already fired' })
    return
  }

  const opponentId = opponentOf(game, player_id)
  const opponentShips = getShips(game.id, opponentId)
  const hitShip = opponentShips.find((ship) =>
    getOccupiedCells(ship).some((cell) => cell.col === col && cell.row === row),
  )
  const hit = hitShip !== undefined
  saveShot(game.id, player_id, col, row, hit)

  let sunk = false
  let gameOver = false
  if (hitShip) {
    const firedCells = new Set(
      getShotsByPlayer(game.id, player_id).map((s) => `${s.col.toString()},${s.row.toString()}`),
    )
    sunk = getOccupiedCells(hitShip).every((cell) =>
      firedCells.has(`${cell.col.toString()},${cell.row.toString()}`),
    )
    if (sunk) {
      markShipSunk(hitShip.id)
      gameOver = opponentShips.every((ship) => (ship.id === hitShip.id ? true : ship.sunk === 1))
    }
  }

  const shipCells = sunk && hitShip ? getOccupiedCells(hitShip) : null
  const shipType = sunk && hitShip ? hitShip.type : null

  if (!gameOver) {
    setCurrentTurn(game.id, opponentId)
    startBattleTurnTimer(game.id)
  } else {
    cancelTimer(game.id)
  }

  broadcastGameEvent(game.id, 'shot_fired', {
    shooter_id: player_id,
    col,
    row,
    hit,
    sunk,
    ship_type: shipType,
    ship_cells: shipCells,
    // On the game-ending shot, echo the winner (shooter) as next_turn so the client
    // never briefly sets isMyTurn=true for the defeated player before game_over arrives.
    next_turn: gameOver ? player_id : opponentId,
  })

  // Flow 5: on the game-ending shot, emit shot_fired (above) so clients update the
  // grid, then game_over immediately after. Stats are persisted before the event so
  // the client renders the result screen without a separate fetch.
  if (gameOver) {
    setGameFinished(game.id, player_id)
    const winner = incrementWin(player_id)
    const loser = incrementLoss(opponentId)
    broadcastGameEvent(game.id, 'game_over', {
      winner_id: player_id,
      loser_id: opponentId,
      winner,
      loser,
    })
  }

  res.status(200).json({ hit, sunk, ship_type: shipType, ship_cells: shipCells })
})

app.get('/api/games/:gameId/events', (req: Request<{ gameId: string }>, res: Response) => {
  const gameId = req.params.gameId
  addGameClient(gameId, res)

  const game = getGame(gameId)
  if (game?.status === 'placing' && game.joiner_id) {
    const joiner = getPlayerById(game.joiner_id)
    if (joiner) {
      sendGameEvent(res, 'player_joined', {
        joiner: { id: joiner.id, name: joiner.name },
        timer_seconds: PRESET_SECONDS[game.preset],
      })
      const remaining = getTimerRemaining(gameId)
      if (remaining !== undefined) {
        sendGameEvent(res, 'timer_tick', { seconds_remaining: remaining })
      }
    }
  }

  req.on('close', () => {
    removeGameClient(gameId, res)
  })
})

// Catches Express body-parser errors (e.g. malformed JSON) and any unhandled throws,
// ensuring all 4xx/5xx responses return { error } per NF4 AC1.
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const status =
    typeof err === 'object' && err !== null && 'status' in err
      ? (err as { status: number }).status
      : 500
  const message = err instanceof Error ? err.message : 'Internal server error'
  res.status(status).json({ error: message })
})

if (process.env.NODE_ENV !== 'test') {
  app.listen(8000, () => {
    console.log('API running at http://localhost:8000')
  })
}
