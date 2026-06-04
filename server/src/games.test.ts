import type {
  CreateGameResponse,
  JoinGameResponse,
  ListGamesResponse,
  Player,
} from '@shared/schemas'
import supertest from 'supertest'
import { describe, expect, it } from 'vitest'

import { app } from './index.js'

const request = supertest(app)

function uniqueName(prefix: string) {
  return `${prefix}-${Date.now().toString()}-${Math.random().toString(36).slice(2)}`
}

async function createPlayer(prefix: string): Promise<Player> {
  const res = await request.post('/api/players').send({ name: uniqueName(prefix) })
  return res.body as Player
}

async function createGame(creatorId: string, preset = 'quick'): Promise<CreateGameResponse> {
  const res = await request.post('/api/games').send({ creator_id: creatorId, preset })
  return res.body as CreateGameResponse
}

describe('POST /api/games — F3 AC1', () => {
  it('creates a waiting game owned by the creator', async () => {
    const creator = await createPlayer('Creator')
    const res = await request.post('/api/games').send({ creator_id: creator.id, preset: 'casual' })
    const body = res.body as CreateGameResponse

    expect(res.status).toBe(200)
    expect(body).toMatchObject({
      preset: 'casual',
      status: 'waiting',
      creator_id: creator.id,
    })
    expect(typeof body.id).toBe('string')
  })

  it('rejects an unknown creator with 400', async () => {
    const res = await request.post('/api/games').send({ creator_id: 'nope', preset: 'quick' })
    expect(res.status).toBe(400)
    expect(typeof (res.body as { error: string }).error).toBe('string')
  })

  it('rejects an invalid preset with 400', async () => {
    const creator = await createPlayer('Creator')
    const res = await request.post('/api/games').send({ creator_id: creator.id, preset: 'turbo' })
    expect(res.status).toBe(400)
  })
})

describe('GET /api/games — F2 AC1', () => {
  it('lists only waiting games with creator stats', async () => {
    const creator = await createPlayer('Lister')
    const game = await createGame(creator.id)

    const res = await request.get('/api/games')
    const body = res.body as ListGamesResponse

    expect(res.status).toBe(200)
    const row = body.games.find((g) => g.id === game.id)
    expect(row).toBeDefined()
    expect(row?.creator.id).toBe(creator.id)
    expect(row?.creator.win_rate).toBe(0)
  })

  it('F2 AC2: each row nests the full creator record — all six fields', async () => {
    const creator = await createPlayer('Nested')
    const game = await createGame(creator.id)

    const res = await request.get('/api/games')
    const body = res.body as ListGamesResponse
    const row = body.games.find((g) => g.id === game.id)

    expect(row?.creator).toEqual({
      id: creator.id,
      name: creator.name,
      games_played: 0,
      wins: 0,
      losses: 0,
      win_rate: 0,
    })
  })

  it('omits a game once it has been joined (status placing)', async () => {
    const creator = await createPlayer('Creator')
    const joiner = await createPlayer('Joiner')
    const game = await createGame(creator.id)
    await request.post(`/api/games/${game.id}/join`).send({ player_id: joiner.id })

    const res = await request.get('/api/games')
    const body = res.body as ListGamesResponse
    expect(body.games.find((g) => g.id === game.id)).toBeUndefined()
  })
})

describe('POST /api/games/:gameId/join — F3 AC3 / NF3 AC5 / NF5 AC4', () => {
  it('transitions the game to placing and sets the joiner', async () => {
    const creator = await createPlayer('Creator')
    const joiner = await createPlayer('Joiner')
    const game = await createGame(creator.id)

    const res = await request.post(`/api/games/${game.id}/join`).send({ player_id: joiner.id })
    const body = res.body as JoinGameResponse

    expect(res.status).toBe(200)
    expect(body).toMatchObject({
      id: game.id,
      status: 'placing',
      creator_id: creator.id,
      joiner_id: joiner.id,
    })
  })

  it('returns 409 when the game is not waiting', async () => {
    const creator = await createPlayer('Creator')
    const joiner = await createPlayer('Joiner')
    const second = await createPlayer('Second')
    const game = await createGame(creator.id)
    await request.post(`/api/games/${game.id}/join`).send({ player_id: joiner.id })

    const res = await request.post(`/api/games/${game.id}/join`).send({ player_id: second.id })
    expect(res.status).toBe(409)
  })

  it('NF4: a 409 from /join carries an { error: string } envelope', async () => {
    const creator = await createPlayer('Creator')
    const joiner = await createPlayer('Joiner')
    const second = await createPlayer('Second')
    const game = await createGame(creator.id)
    await request.post(`/api/games/${game.id}/join`).send({ player_id: joiner.id })

    const res = await request.post(`/api/games/${game.id}/join`).send({ player_id: second.id })
    const body = res.body as { error: string }

    expect(res.status).toBe(409)
    expect(typeof body.error).toBe('string')
    expect(body.error.length).toBeGreaterThan(0)
  })

  it('F3 AC2 / NF3 AC5: creator self-joining their own waiting game → 403 + { error: string }', async () => {
    const creator = await createPlayer('Creator')
    const game = await createGame(creator.id)

    const res = await request.post(`/api/games/${game.id}/join`).send({ player_id: creator.id })
    const body = res.body as { error: string }

    expect(res.status).toBe(403)
    expect(typeof body.error).toBe('string')
    expect(body.error.length).toBeGreaterThan(0)
  })

  it('returns 400 when player_id is missing', async () => {
    const creator = await createPlayer('Creator')
    const game = await createGame(creator.id)

    const res = await request.post(`/api/games/${game.id}/join`).send({})
    expect(res.status).toBe(400)
  })
})

describe('DELETE /api/games/:gameId — F3 AC5 / NF5 AC5', () => {
  it('lets the creator cancel a waiting game', async () => {
    const creator = await createPlayer('Creator')
    const game = await createGame(creator.id)

    const res = await request.delete(`/api/games/${game.id}`).send({ player_id: creator.id })
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ ok: true })

    const list = await request.get('/api/games')
    const body = list.body as ListGamesResponse
    expect(body.games.find((g) => g.id === game.id)).toBeUndefined()
  })

  it('returns 403 when a non-creator tries to cancel', async () => {
    const creator = await createPlayer('Creator')
    const other = await createPlayer('Other')
    const game = await createGame(creator.id)

    const res = await request.delete(`/api/games/${game.id}`).send({ player_id: other.id })
    expect(res.status).toBe(403)
  })

  it('returns 409 when cancelling a game that is no longer waiting', async () => {
    const creator = await createPlayer('Creator')
    const joiner = await createPlayer('Joiner')
    const game = await createGame(creator.id)
    await request.post(`/api/games/${game.id}/join`).send({ player_id: joiner.id })

    const res = await request.delete(`/api/games/${game.id}`).send({ player_id: creator.id })
    expect(res.status).toBe(409)
  })

  it('NF5 AC5: status is checked before authorization — a non-creator deleting a placing game gets 409, not 403', async () => {
    const creator = await createPlayer('Creator')
    const joiner = await createPlayer('Joiner')
    const outsider = await createPlayer('Outsider')
    const game = await createGame(creator.id)
    await request.post(`/api/games/${game.id}/join`).send({ player_id: joiner.id })

    const res = await request.delete(`/api/games/${game.id}`).send({ player_id: outsider.id })
    const body = res.body as { error: string }

    expect(res.status).toBe(409)
    expect(typeof body.error).toBe('string')
  })
})
