import { randomUUID } from 'node:crypto'

import {
  CreateGameResponse,
  FireShotResponse,
  PlaceShipsRequest,
  PlayerResponse,
} from '@shared/schemas'
import supertest from 'supertest'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import { getGame } from './db/games.repository.js'
import { app } from './index.js'

const request = supertest(app)

const ErrorEnvelope = z.object({ error: z.string() })

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

describe('POST /api/games/:gameId/shot', () => {
  // F7 AC1: a shot landing on an opponent ship cell resolves as a hit; the creator fires first (F6 AC2)
  it('resolves a hit and passes the turn to the opponent', async () => {
    const { id, creatorId, joinerId } = await battleGame()

    const res = await request
      .post(`/api/games/${id}/shot`)
      .send({ player_id: creatorId, col: 0, row: 1 })

    expect(res.status).toBe(200)
    expect(FireShotResponse.parse(res.body).hit).toBe(true)
    expect(getGame(id)?.current_turn).toBe(joinerId)
  })

  // F7 AC1: a shot on empty water resolves as a miss
  it('resolves a miss on an empty cell', async () => {
    const { id, creatorId } = await battleGame()

    const res = await request
      .post(`/api/games/${id}/shot`)
      .send({ player_id: creatorId, col: 9, row: 10 })

    expect(res.status).toBe(200)
    expect(FireShotResponse.parse(res.body).hit).toBe(false)
  })

  // F7 AC2: sinking every cell of a ship reports sunk with the ship type and full outline
  it('reports a ship sunk once all its cells are hit', async () => {
    const { id, creatorId, joinerId } = await battleGame()

    await request.post(`/api/games/${id}/shot`).send({ player_id: creatorId, col: 0, row: 5 })
    // joiner takes their intervening turn so control returns to the creator
    await request.post(`/api/games/${id}/shot`).send({ player_id: joinerId, col: 9, row: 10 })
    const res = await request
      .post(`/api/games/${id}/shot`)
      .send({ player_id: creatorId, col: 1, row: 5 })

    const body = FireShotResponse.parse(res.body)
    expect(body.sunk).toBe(true)
    expect(body.ship_type).toBe('destroyer')
    expect(body.ship_cells).toEqual([
      { col: 0, row: 5 },
      { col: 1, row: 5 },
    ])
  })

  // NF5 AC2: firing when the game is not in battle returns 409
  it('returns 409 when the game is not in the battle phase', async () => {
    const creatorId = await createPlayer()
    const game = CreateGameResponse.parse(
      (await request.post('/api/games').send({ creator_id: creatorId, preset: 'quick' })).body,
    )

    const res = await request
      .post(`/api/games/${game.id}/shot`)
      .send({ player_id: creatorId, col: 0, row: 1 })

    expect(res.status).toBe(409)
    ErrorEnvelope.parse(res.body)
  })

  // NF3 AC3: acting out of turn returns 403 (after the status guard passes)
  it('returns 403 when firing out of turn', async () => {
    const { id, joinerId } = await battleGame()

    const res = await request
      .post(`/api/games/${id}/shot`)
      .send({ player_id: joinerId, col: 0, row: 1 })

    expect(res.status).toBe(403)
    ErrorEnvelope.parse(res.body)
  })

  // NF3 AC1: out-of-bounds coordinates return 400
  it('returns 400 for out-of-bounds coordinates', async () => {
    const { id, creatorId } = await battleGame()

    const res = await request
      .post(`/api/games/${id}/shot`)
      .send({ player_id: creatorId, col: 10, row: 1 })

    expect(res.status).toBe(400)
    ErrorEnvelope.parse(res.body)
  })

  // NF3 AC2: firing on an already-fired cell returns 400
  it('returns 400 when firing on an already-fired cell', async () => {
    const { id, creatorId, joinerId } = await battleGame()

    await request.post(`/api/games/${id}/shot`).send({ player_id: creatorId, col: 9, row: 10 })
    await request.post(`/api/games/${id}/shot`).send({ player_id: joinerId, col: 9, row: 10 })

    const res = await request
      .post(`/api/games/${id}/shot`)
      .send({ player_id: creatorId, col: 9, row: 10 })

    expect(res.status).toBe(400)
    ErrorEnvelope.parse(res.body)
  })
})
