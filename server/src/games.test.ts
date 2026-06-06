import { randomUUID } from 'node:crypto'

import {
  CreateGameResponse,
  DeleteGameResponse,
  GetGamesResponse,
  JoinGameResponse,
  PlayerResponse,
} from '@shared/schemas'
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

async function createWaitingGame(creatorId: string, preset: 'quick' | 'casual' = 'quick') {
  return request.post('/api/games').send({ creator_id: creatorId, preset })
}

describe('POST /api/games', () => {
  // F3 AC1: creating a game returns a waiting game owned by the creator with the chosen preset
  it('creates a waiting game with the chosen preset and creator', async () => {
    const creatorId = await createPlayer()

    const res = await createWaitingGame(creatorId, 'quick')

    expect(res.status).toBe(200)
    const game = CreateGameResponse.parse(res.body)
    expect(game.preset).toBe('quick')
    expect(game.status).toBe('waiting')
    expect(game.creator_id).toBe(creatorId)
    expect(game.id.length).toBeGreaterThan(0)
  })

  // DR#1: a creator_id with no matching player record is rejected as invalid input -> 400 { error }
  it('returns 400 with an { error } envelope when creator_id references no player', async () => {
    const res = await createWaitingGame(randomUUID(), 'quick')

    expect(res.status).toBe(400)
    const body = ErrorEnvelope.parse(res.body)
    expect(body.error.length).toBeGreaterThan(0)
  })
})

describe('GET /api/games', () => {
  // F2 AC1: the lobby lists only waiting games; a game that has been joined (placing) is excluded
  it('returns waiting games and excludes games that have left waiting status', async () => {
    const waitingCreator = await createPlayer()
    const joinedCreator = await createPlayer()
    const joiner = await createPlayer()

    const waiting = CreateGameResponse.parse((await createWaitingGame(waitingCreator)).body)
    const joined = CreateGameResponse.parse((await createWaitingGame(joinedCreator)).body)
    await request.post(`/api/games/${joined.id}/join`).send({ player_id: joiner })

    const res = await request.get('/api/games')

    expect(res.status).toBe(200)
    const body = GetGamesResponse.parse(res.body)
    const ids = body.games.map((g) => g.id)
    expect(ids).toContain(waiting.id)
    expect(ids).not.toContain(joined.id)
  })
})

describe('POST /api/games/:gameId/join', () => {
  // F3 AC3: joining a waiting game transitions it to placing and records both players
  it('transitions the game to placing and returns both player ids', async () => {
    const creatorId = await createPlayer()
    const joinerId = await createPlayer()
    const game = CreateGameResponse.parse((await createWaitingGame(creatorId)).body)

    const res = await request.post(`/api/games/${game.id}/join`).send({ player_id: joinerId })

    expect(res.status).toBe(200)
    const joined = JoinGameResponse.parse(res.body)
    expect(joined.status).toBe('placing')
    expect(joined.creator_id).toBe(creatorId)
    expect(joined.joiner_id).toBe(joinerId)
  })

  // NF5 AC4: joining a game that is not waiting (already joined -> placing) returns 409
  it('returns 409 when joining a game that is no longer waiting', async () => {
    const creatorId = await createPlayer()
    const firstJoiner = await createPlayer()
    const secondJoiner = await createPlayer()
    const game = CreateGameResponse.parse((await createWaitingGame(creatorId)).body)
    await request.post(`/api/games/${game.id}/join`).send({ player_id: firstJoiner })

    const res = await request.post(`/api/games/${game.id}/join`).send({ player_id: secondJoiner })

    expect(res.status).toBe(409)
    ErrorEnvelope.parse(res.body)
  })
})

describe('DELETE /api/games/:gameId', () => {
  // F3 AC5: the creator can cancel a waiting game and gets { ok: true }
  it('lets the creator cancel a waiting game', async () => {
    const creatorId = await createPlayer()
    const game = CreateGameResponse.parse((await createWaitingGame(creatorId)).body)

    const res = await request.delete(`/api/games/${game.id}`).send({ player_id: creatorId })

    expect(res.status).toBe(200)
    expect(DeleteGameResponse.parse(res.body).ok).toBe(true)
  })

  // NF3 AC5 ordering + NF5 AC5: status guard wins first — a non-waiting game returns 409 even for the creator
  it('returns 409 when cancelling a game that is no longer waiting', async () => {
    const creatorId = await createPlayer()
    const joinerId = await createPlayer()
    const game = CreateGameResponse.parse((await createWaitingGame(creatorId)).body)
    await request.post(`/api/games/${game.id}/join`).send({ player_id: joinerId })

    const res = await request.delete(`/api/games/${game.id}`).send({ player_id: creatorId })

    expect(res.status).toBe(409)
    ErrorEnvelope.parse(res.body)
  })

  // NF3 AC3 + DELETE contract: a non-creator may not cancel a waiting game -> 403
  it('returns 403 when a non-creator tries to cancel a waiting game', async () => {
    const creatorId = await createPlayer()
    const strangerId = await createPlayer()
    const game = CreateGameResponse.parse((await createWaitingGame(creatorId)).body)

    const res = await request.delete(`/api/games/${game.id}`).send({ player_id: strangerId })

    expect(res.status).toBe(403)
    ErrorEnvelope.parse(res.body)
  })
})
