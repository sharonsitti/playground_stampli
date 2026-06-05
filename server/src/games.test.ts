import type {
  CancelGameResponse,
  CreateGameResponse,
  CreatePlayerResponse,
  ErrorResponse,
  JoinGameResponse,
  ListGamesResponse,
} from '@shared/schemas'
import supertest from 'supertest'
import { afterAll, describe, expect, it } from 'vitest'

import { db } from './db/db.js'
import { app } from './index.js'

const request = supertest(app)

afterAll(() => {
  db.exec('DELETE FROM games')
  db.exec('DELETE FROM players')
})

function asPlayer(body: unknown): CreatePlayerResponse {
  return body as CreatePlayerResponse
}
function asGame(body: unknown): CreateGameResponse {
  return body as CreateGameResponse
}
function asJoined(body: unknown): JoinGameResponse {
  return body as JoinGameResponse
}
function asCancelled(body: unknown): CancelGameResponse {
  return body as CancelGameResponse
}
function asList(body: unknown): ListGamesResponse {
  return body as ListGamesResponse
}
function asError(body: unknown): ErrorResponse {
  return body as ErrorResponse
}

async function createPlayer(name: string): Promise<CreatePlayerResponse> {
  const res = await request.post('/api/players').send({ name })
  return asPlayer(res.body)
}

async function createWaitingGame(creatorId: string): Promise<CreateGameResponse> {
  const res = await request.post('/api/games').send({ creator_id: creatorId, preset: 'quick' })
  return asGame(res.body)
}

// A game reaches 'placing' (no longer waiting) once a second player joins it.
async function createPlacingGame(creatorId: string, joinerId: string): Promise<CreateGameResponse> {
  const game = await createWaitingGame(creatorId)
  await request.post(`/api/games/${game.id}/join`).send({ player_id: joinerId })
  return game
}

describe('Games endpoints — happy path', () => {
  it('H1: POST /api/games with a valid creator and preset returns a waiting game (spec POST /api/games)', async () => {
    const creator = await createPlayer('H1-creator')
    const res = await request.post('/api/games').send({ creator_id: creator.id, preset: 'casual' })
    expect(res.status).toBe(200)
    const game = asGame(res.body)
    expect(typeof game.id).toBe('string')
    expect(game.id.length).toBeGreaterThan(0)
    expect(game.preset).toBe('casual')
    expect(game.status).toBe('waiting')
    expect(game.creator_id).toBe(creator.id)
  })

  it('H2: POST /api/games/:gameId/join with a valid joiner transitions the game to placing (spec POST /api/games/:gameId/join, F3 AC3)', async () => {
    const creator = await createPlayer('H2-creator')
    const joiner = await createPlayer('H2-joiner')
    const game = await createWaitingGame(creator.id)

    const res = await request.post(`/api/games/${game.id}/join`).send({ player_id: joiner.id })
    expect(res.status).toBe(200)
    const joined = asJoined(res.body)
    expect(joined.id).toBe(game.id)
    expect(joined.status).toBe('placing')
    expect(joined.creator_id).toBe(creator.id)
    expect(joined.joiner_id).toBe(joiner.id)
  })

  it('H3: GET /api/games lists a waiting game with the documented creator stats shape, and drops it once joined (F2 AC1, F3 AC2)', async () => {
    const creator = await createPlayer('H3-creator')
    const joiner = await createPlayer('H3-joiner')
    const game = await createWaitingGame(creator.id)

    const listed = asList((await request.get('/api/games')).body)
    const row = listed.games.find((g) => g.id === game.id)
    expect(row).toBeDefined()
    expect(row?.preset).toBe('quick')
    expect(Object.keys(row?.creator ?? {}).sort()).toEqual(
      ['games_played', 'id', 'losses', 'name', 'win_rate', 'wins'].sort(),
    )
    expect(row?.creator.id).toBe(creator.id)
    expect(row?.creator.name).toBe('H3-creator')

    await request.post(`/api/games/${game.id}/join`).send({ player_id: joiner.id })

    const afterJoin = asList((await request.get('/api/games')).body)
    expect(afterJoin.games.find((g) => g.id === game.id)).toBeUndefined()
  })

  it('H4: DELETE /api/games/:gameId by the creator cancels a waiting game (spec DELETE /api/games/:gameId, F3 AC5)', async () => {
    const creator = await createPlayer('H4-creator')
    const game = await createWaitingGame(creator.id)

    const res = await request.delete(`/api/games/${game.id}`).send({ player_id: creator.id })
    expect(res.status).toBe(200)
    expect(asCancelled(res.body).ok).toBe(true)

    const listed = asList((await request.get('/api/games')).body)
    expect(listed.games.find((g) => g.id === game.id)).toBeUndefined()
  })
})

describe('Games endpoints — unhappy path', () => {
  it('U1: DELETE on a non-waiting game by a non-creator returns 409 — status check precedes the auth check (NF3 AC5, NF5 AC5)', async () => {
    const creator = await createPlayer('U1-creator')
    const joiner = await createPlayer('U1-joiner')
    const outsider = await createPlayer('U1-outsider')
    const game = await createPlacingGame(creator.id, joiner.id)

    const res = await request.delete(`/api/games/${game.id}`).send({ player_id: outsider.id })
    expect(res.status).toBe(409)
    expect(typeof asError(res.body).error).toBe('string')
  })

  it('U2: POST /api/games/:gameId/join on a non-waiting game returns 409 (NF5 AC4, NF1 AC1)', async () => {
    const creator = await createPlayer('U2-creator')
    const joiner = await createPlayer('U2-joiner')
    const latecomer = await createPlayer('U2-latecomer')
    const game = await createPlacingGame(creator.id, joiner.id)

    const res = await request.post(`/api/games/${game.id}/join`).send({ player_id: latecomer.id })
    expect(res.status).toBe(409)
    expect(typeof asError(res.body).error).toBe('string')
  })

  it('U3: POST /api/games/:gameId/join with the creator’s own id on a waiting game returns 403 (spec POST /api/games/:gameId/join)', async () => {
    const creator = await createPlayer('U3-creator')
    const game = await createWaitingGame(creator.id)

    const res = await request.post(`/api/games/${game.id}/join`).send({ player_id: creator.id })
    expect(res.status).toBe(403)
    expect(typeof asError(res.body).error).toBe('string')
  })

  it('U4: DELETE on a waiting game by a non-creator returns 403 (spec DELETE /api/games/:gameId)', async () => {
    const creator = await createPlayer('U4-creator')
    const outsider = await createPlayer('U4-outsider')
    const game = await createWaitingGame(creator.id)

    const res = await request.delete(`/api/games/${game.id}`).send({ player_id: outsider.id })
    expect(res.status).toBe(403)
    expect(typeof asError(res.body).error).toBe('string')
  })

  it('U5: POST /api/games with a missing creator_id returns 400 with the error envelope (NF4 AC1)', async () => {
    const res = await request.post('/api/games').send({ preset: 'quick' })
    expect(res.status).toBe(400)
    const error = asError(res.body).error
    expect(typeof error).toBe('string')
    expect(error.length).toBeGreaterThan(0)
  })

  it('U6: DELETE on a non-waiting game by the creator returns 409 (NF5 AC5)', async () => {
    const creator = await createPlayer('U6-creator')
    const joiner = await createPlayer('U6-joiner')
    const game = await createPlacingGame(creator.id, joiner.id)

    const res = await request.delete(`/api/games/${game.id}`).send({ player_id: creator.id })
    expect(res.status).toBe(409)
    expect(typeof asError(res.body).error).toBe('string')
  })
})
