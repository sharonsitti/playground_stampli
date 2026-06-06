import { randomUUID } from 'node:crypto'

import { getOccupiedCells } from '@shared/geometry'
import {
  CreateGameResponse,
  GameOverEvent,
  PlaceShipsRequest,
  PlayerResponse,
} from '@shared/schemas'
import type { Response } from 'express'
import supertest from 'supertest'
import { describe, expect, it } from 'vitest'

import { getGame } from './db/games.repository.js'
import { getPlayerById } from './db/players.repository.js'
import { app } from './index.js'
import { gameClients } from './sse.js'

const request = supertest(app)

function uniqueName() {
  return `Player-${randomUUID()}`
}

async function createPlayer(): Promise<string> {
  const res = await request.post('/api/players').send({ name: uniqueName() })
  return PlayerResponse.parse(res.body).id
}

const fleet: PlaceShipsRequest['ships'] = [
  { type: 'carrier', orientation: 'H', origin_col: 0, origin_row: 1 },
  { type: 'battleship', orientation: 'H', origin_col: 0, origin_row: 2 },
  { type: 'cruiser', orientation: 'H', origin_col: 0, origin_row: 3 },
  { type: 'submarine', orientation: 'H', origin_col: 0, origin_row: 4 },
  { type: 'destroyer', orientation: 'H', origin_col: 0, origin_row: 5 },
]

const fleetCells = fleet.flatMap((ship) => getOccupiedCells(ship))

async function battleGame(): Promise<{ id: string; creatorId: string; joinerId: string }> {
  const creatorId = await createPlayer()
  const joinerId = await createPlayer()
  const game = CreateGameResponse.parse(
    (await request.post('/api/games').send({ creator_id: creatorId, preset: 'quick' })).body,
  )
  await request.post(`/api/games/${game.id}/join`).send({ player_id: joinerId })
  for (const playerId of [creatorId, joinerId]) {
    await request.post(`/api/games/${game.id}/place`).send({ player_id: playerId, ships: fleet })
    await request.post(`/api/games/${game.id}/ready`).send({ player_id: playerId })
  }
  return { id: game.id, creatorId, joinerId }
}

function captureGameEvents(gameId: string): () => Array<{ event: string; data: unknown }> {
  const chunks: string[] = []
  const fake = { write: (chunk: string) => chunks.push(chunk) } as unknown as Response
  let clients = gameClients.get(gameId)
  if (!clients) {
    clients = new Set()
    gameClients.set(gameId, clients)
  }
  clients.add(fake)

  return () => {
    const events: Array<{ event: string; data: unknown }> = []
    for (const block of chunks.join('').split('\n\n')) {
      const eventLine = block.split('\n').find((l) => l.startsWith('event: '))
      const dataLine = block.split('\n').find((l) => l.startsWith('data: '))
      if (!eventLine || !dataLine) continue
      events.push({
        event: eventLine.slice('event: '.length),
        data: JSON.parse(dataLine.slice('data: '.length)),
      })
    }
    return events
  }
}

// Creator sinks every opponent ship cell; the joiner fires harmless misses on intervening turns.
async function sinkOpponentFleet(id: string, creatorId: string, joinerId: string): Promise<void> {
  let i = 0
  for (const cell of fleetCells) {
    await request.post(`/api/games/${id}/shot`).send({ player_id: creatorId, ...cell })
    if (i < fleetCells.length - 1) {
      const miss = { col: 5 + Math.floor(i / 10), row: (i % 10) + 1 }
      await request.post(`/api/games/${id}/shot`).send({ player_id: joinerId, ...miss })
    }
    i++
  }
}

describe('game over', () => {
  // F8 AC1: firing the game-ending shot (all 5 ships sunk) emits game_over with winner_id and loser_id
  it('emits game_over with winner and loser ids when the final ship is sunk', async () => {
    const { id, creatorId, joinerId } = await battleGame()
    const readEvents = captureGameEvents(id)

    await sinkOpponentFleet(id, creatorId, joinerId)

    const events = readEvents()
    const gameOver = events.find((e) => e.event === 'game_over')
    expect(gameOver).toBeDefined()
    const payload = GameOverEvent.parse(gameOver?.data)
    expect(payload.winner_id).toBe(creatorId)
    expect(payload.loser_id).toBe(joinerId)
  })

  // F8 AC4 / F9: the winner's wins+games_played and the loser's losses+games_played are incremented
  it('increments winner and loser stats after game over', async () => {
    const { id, creatorId, joinerId } = await battleGame()

    await sinkOpponentFleet(id, creatorId, joinerId)

    const winner = getPlayerById(creatorId)
    const loser = getPlayerById(joinerId)
    expect(winner).toMatchObject({ wins: 1, losses: 0, games_played: 1 })
    expect(loser).toMatchObject({ wins: 0, losses: 1, games_played: 1 })
  })

  // F8 AC3: the game record is marked finished with the winner id
  it('marks the game finished with the winner id', async () => {
    const { id, creatorId, joinerId } = await battleGame()

    await sinkOpponentFleet(id, creatorId, joinerId)

    const game = getGame(id)
    expect(game?.status).toBe('finished')
    expect(game?.winner_id).toBe(creatorId)
  })
})
