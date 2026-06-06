import { randomUUID } from 'node:crypto'

import { CreateGameResponse, OkResponse, PlaceShipsRequest, PlayerResponse } from '@shared/schemas'
import supertest from 'supertest'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'

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

async function placingGame(): Promise<{ id: string; creatorId: string; joinerId: string }> {
  const creatorId = await createPlayer()
  const joinerId = await createPlayer()
  const game = CreateGameResponse.parse(
    (await request.post('/api/games').send({ creator_id: creatorId, preset: 'quick' })).body,
  )
  await request.post(`/api/games/${game.id}/join`).send({ player_id: joinerId })
  return { id: game.id, creatorId, joinerId }
}

const validFleet: PlaceShipsRequest['ships'] = [
  { type: 'carrier', orientation: 'H', origin_col: 0, origin_row: 1 },
  { type: 'battleship', orientation: 'H', origin_col: 0, origin_row: 2 },
  { type: 'cruiser', orientation: 'H', origin_col: 0, origin_row: 3 },
  { type: 'submarine', orientation: 'H', origin_col: 0, origin_row: 4 },
  { type: 'destroyer', orientation: 'H', origin_col: 0, origin_row: 5 },
]

describe('POST /api/games/:gameId/place', () => {
  // F5/F4: a complete, in-bounds, non-overlapping fleet is accepted with { ok: true }
  it('accepts a valid fleet from a participant', async () => {
    const { id, creatorId } = await placingGame()

    const res = await request
      .post(`/api/games/${id}/place`)
      .send({ player_id: creatorId, ships: validFleet })

    expect(res.status).toBe(200)
    expect(OkResponse.parse(res.body).ok).toBe(true)
  })

  // F4 AC4: a fleet with overlapping ships is rejected as invalid input -> 400 { error }
  it('rejects an overlapping fleet with 400', async () => {
    const { id, creatorId } = await placingGame()
    const overlapping = [...validFleet]
    overlapping[1] = { type: 'battleship', orientation: 'H', origin_col: 0, origin_row: 1 }

    const res = await request
      .post(`/api/games/${id}/place`)
      .send({ player_id: creatorId, ships: overlapping })

    expect(res.status).toBe(400)
    ErrorEnvelope.parse(res.body)
  })

  // F4 AC4: a fleet that runs off the board is rejected -> 400
  it('rejects an out-of-bounds fleet with 400', async () => {
    const { id, creatorId } = await placingGame()
    const oob = [...validFleet]
    oob[0] = { type: 'carrier', orientation: 'H', origin_col: 6, origin_row: 1 }

    const res = await request
      .post(`/api/games/${id}/place`)
      .send({ player_id: creatorId, ships: oob })

    expect(res.status).toBe(400)
    ErrorEnvelope.parse(res.body)
  })

  // NF3 AC5 ordering: status guard wins first — placing on a non-placing game returns 409 even with a valid fleet
  it('returns 409 when the game is not in the placement phase', async () => {
    const creatorId = await createPlayer()
    const game = CreateGameResponse.parse(
      (await request.post('/api/games').send({ creator_id: creatorId, preset: 'quick' })).body,
    )

    const res = await request
      .post(`/api/games/${game.id}/place`)
      .send({ player_id: creatorId, ships: validFleet })

    expect(res.status).toBe(409)
    ErrorEnvelope.parse(res.body)
  })

  // NF3 AC5 ordering: a non-participant cannot place -> 403 (after the status guard passes)
  it('returns 403 when the player is not a participant', async () => {
    const { id } = await placingGame()
    const stranger = await createPlayer()

    const res = await request
      .post(`/api/games/${id}/place`)
      .send({ player_id: stranger, ships: validFleet })

    expect(res.status).toBe(403)
    ErrorEnvelope.parse(res.body)
  })
})

describe('POST /api/games/:gameId/ready', () => {
  // F5 AC4: a participant can mark ready and gets { ok: true }
  it('marks a participant ready', async () => {
    const { id, creatorId } = await placingGame()

    const res = await request.post(`/api/games/${id}/ready`).send({ player_id: creatorId })

    expect(res.status).toBe(200)
    expect(OkResponse.parse(res.body).ok).toBe(true)
  })

  // F5 AC5: when both players are ready, the game transitions out of placing into battle
  it('transitions to battle when both players are ready', async () => {
    const { id, creatorId, joinerId } = await placingGame()

    await request.post(`/api/games/${id}/ready`).send({ player_id: creatorId })
    await request.post(`/api/games/${id}/ready`).send({ player_id: joinerId })

    const after = await request.post(`/api/games/${id}/ready`).send({ player_id: creatorId })
    expect(after.status).toBe(409)
    ErrorEnvelope.parse(after.body)
  })

  // NF5 AC1: readying a game that is not placing returns 409
  it('returns 409 when the game is not in the placement phase', async () => {
    const creatorId = await createPlayer()
    const game = CreateGameResponse.parse(
      (await request.post('/api/games').send({ creator_id: creatorId, preset: 'quick' })).body,
    )

    const res = await request.post(`/api/games/${game.id}/ready`).send({ player_id: creatorId })

    expect(res.status).toBe(409)
    ErrorEnvelope.parse(res.body)
  })

  // NF3 AC5: a non-participant cannot ready -> 403
  it('returns 403 when the player is not a participant', async () => {
    const { id } = await placingGame()
    const stranger = await createPlayer()

    const res = await request.post(`/api/games/${id}/ready`).send({ player_id: stranger })

    expect(res.status).toBe(403)
    ErrorEnvelope.parse(res.body)
  })
})
