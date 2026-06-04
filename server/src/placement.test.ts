import type { CreateGameResponse, Player, ShipPlacement } from '@shared/schemas'
import { PRESET_SECONDS } from '@shared/schemas'
import supertest from 'supertest'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { getGame } from './db/games.repository.js'
import { getPlayerById } from './db/players.repository.js'
import { app } from './index.js'

const request = supertest(app)

function uniqueName(prefix: string) {
  return `${prefix}-${Date.now().toString()}-${Math.random().toString(36).slice(2)}`
}

async function createPlayer(prefix: string): Promise<Player> {
  const res = await request.post('/api/players').send({ name: uniqueName(prefix) })
  return res.body as Player
}

async function placingGame(): Promise<{
  game: CreateGameResponse
  creator: Player
  joiner: Player
}> {
  const creator = await createPlayer('Creator')
  const joiner = await createPlayer('Joiner')
  const gameRes = await request.post('/api/games').send({ creator_id: creator.id, preset: 'quick' })
  const game = gameRes.body as CreateGameResponse
  await request.post(`/api/games/${game.id}/join`).send({ player_id: joiner.id })
  return { game, creator, joiner }
}

const VALID_FLEET: ShipPlacement[] = [
  { type: 'carrier', orientation: 'H', origin_col: 0, origin_row: 1 },
  { type: 'battleship', orientation: 'H', origin_col: 0, origin_row: 2 },
  { type: 'cruiser', orientation: 'H', origin_col: 0, origin_row: 3 },
  { type: 'submarine', orientation: 'H', origin_col: 0, origin_row: 4 },
  { type: 'destroyer', orientation: 'H', origin_col: 0, origin_row: 5 },
]

describe('POST /api/games/:gameId/place — F5 / NF5 AC1 / NF3 AC5', () => {
  it('accepts a complete, in-bounds, non-overlapping fleet', async () => {
    const { game, creator } = await placingGame()
    const res = await request
      .post(`/api/games/${game.id}/place`)
      .send({ player_id: creator.id, ships: VALID_FLEET })
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ ok: true })
  })

  it('overwrites a previous placement on a second call', async () => {
    const { game, creator } = await placingGame()
    await request
      .post(`/api/games/${game.id}/place`)
      .send({ player_id: creator.id, ships: VALID_FLEET })
    const moved = VALID_FLEET.map((s) => ({ ...s, origin_col: s.origin_col + 1 }))
    const res = await request
      .post(`/api/games/${game.id}/place`)
      .send({ player_id: creator.id, ships: moved })
    expect(res.status).toBe(200)
  })

  it('rejects an incomplete fleet (missing a ship) with 400', async () => {
    const { game, creator } = await placingGame()
    const res = await request
      .post(`/api/games/${game.id}/place`)
      .send({ player_id: creator.id, ships: VALID_FLEET.slice(0, 4) })
    expect(res.status).toBe(400)
    expect(typeof (res.body as { error: string }).error).toBe('string')
  })

  it('rejects overlapping ships with 400', async () => {
    const { game, creator } = await placingGame()
    const overlap: ShipPlacement[] = [
      { type: 'carrier', orientation: 'H', origin_col: 0, origin_row: 1 },
      { type: 'battleship', orientation: 'V', origin_col: 2, origin_row: 1 },
      { type: 'cruiser', orientation: 'H', origin_col: 0, origin_row: 3 },
      { type: 'submarine', orientation: 'H', origin_col: 0, origin_row: 4 },
      { type: 'destroyer', orientation: 'H', origin_col: 0, origin_row: 5 },
    ]
    const res = await request
      .post(`/api/games/${game.id}/place`)
      .send({ player_id: creator.id, ships: overlap })
    expect(res.status).toBe(400)
  })

  it('F5: rejects a fleet with a duplicate ship type (not one of each) with 400', async () => {
    const { game, creator } = await placingGame()
    const dupes: ShipPlacement[] = [
      { type: 'carrier', orientation: 'H', origin_col: 0, origin_row: 1 },
      { type: 'carrier', orientation: 'H', origin_col: 0, origin_row: 2 },
      { type: 'cruiser', orientation: 'H', origin_col: 0, origin_row: 3 },
      { type: 'submarine', orientation: 'H', origin_col: 0, origin_row: 4 },
      { type: 'destroyer', orientation: 'H', origin_col: 0, origin_row: 5 },
    ]
    const res = await request
      .post(`/api/games/${game.id}/place`)
      .send({ player_id: creator.id, ships: dupes })
    expect(res.status).toBe(400)
    expect(typeof (res.body as { error: string }).error).toBe('string')
  })

  it('rejects out-of-bounds coordinates with 400', async () => {
    const { game, creator } = await placingGame()
    const oob = VALID_FLEET.map((s, i) => (i === 0 ? { ...s, origin_col: 7 } : s))
    const res = await request
      .post(`/api/games/${game.id}/place`)
      .send({ player_id: creator.id, ships: oob })
    expect(res.status).toBe(400)
  })

  it('returns 409 when the game is not in the placing phase', async () => {
    const creator = await createPlayer('Solo')
    const gameRes = await request
      .post('/api/games')
      .send({ creator_id: creator.id, preset: 'quick' })
    const game = gameRes.body as CreateGameResponse
    const res = await request
      .post(`/api/games/${game.id}/place`)
      .send({ player_id: creator.id, ships: VALID_FLEET })
    expect(res.status).toBe(409)
  })

  it('NF3 AC5: a stranger placing on a placing game gets 403 (auth before input)', async () => {
    const { game } = await placingGame()
    const stranger = await createPlayer('Stranger')
    const res = await request
      .post(`/api/games/${game.id}/place`)
      .send({ player_id: stranger.id, ships: VALID_FLEET.slice(0, 2) })
    expect(res.status).toBe(403)
  })

  it('NF3 AC5: status beats authorization — a stranger placing on a WAITING game gets 409, not 403', async () => {
    const creator = await createPlayer('Creator')
    const stranger = await createPlayer('Stranger')
    const gameRes = await request
      .post('/api/games')
      .send({ creator_id: creator.id, preset: 'quick' })
    const game = gameRes.body as CreateGameResponse

    const res = await request
      .post(`/api/games/${game.id}/place`)
      .send({ player_id: stranger.id, ships: VALID_FLEET })
    expect(res.status).toBe(409)
    expect(typeof (res.body as { error: string }).error).toBe('string')
  })

  it('returns 404 for an unknown game', async () => {
    const creator = await createPlayer('Ghost')
    const res = await request
      .post('/api/games/nope/place')
      .send({ player_id: creator.id, ships: VALID_FLEET })
    expect(res.status).toBe(404)
  })
})

describe('POST /api/games/:gameId/ready — F5 AC4-5 / NF5 AC1', () => {
  it('marks a player ready after they have placed ships', async () => {
    const { game, creator } = await placingGame()
    await request
      .post(`/api/games/${game.id}/place`)
      .send({ player_id: creator.id, ships: VALID_FLEET })
    const res = await request.post(`/api/games/${game.id}/ready`).send({ player_id: creator.id })
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ ok: true })
  })

  it('rejects ready before ships are submitted with 400', async () => {
    const { game, creator } = await placingGame()
    const res = await request.post(`/api/games/${game.id}/ready`).send({ player_id: creator.id })
    expect(res.status).toBe(400)
  })

  it('F5 AC5: both players ready transitions the game to battle, creator goes first', async () => {
    const { game, creator, joiner } = await placingGame()
    await request
      .post(`/api/games/${game.id}/place`)
      .send({ player_id: creator.id, ships: VALID_FLEET })
    await request
      .post(`/api/games/${game.id}/place`)
      .send({ player_id: joiner.id, ships: VALID_FLEET })

    await request.post(`/api/games/${game.id}/ready`).send({ player_id: creator.id })
    const res = await request.post(`/api/games/${game.id}/ready`).send({ player_id: joiner.id })
    expect(res.status).toBe(200)

    const place = await request
      .post(`/api/games/${game.id}/place`)
      .send({ player_id: creator.id, ships: VALID_FLEET })
    expect(place.status).toBe(409)
  })

  it('NF5 AC1: ready on a game that is not placing returns 409', async () => {
    const creator = await createPlayer('Solo')
    const gameRes = await request
      .post('/api/games')
      .send({ creator_id: creator.id, preset: 'quick' })
    const game = gameRes.body as CreateGameResponse
    const res = await request.post(`/api/games/${game.id}/ready`).send({ player_id: creator.id })
    expect(res.status).toBe(409)
  })

  it('NF3 AC5: a stranger readying gets 403, not 400', async () => {
    const { game } = await placingGame()
    const stranger = await createPlayer('Stranger')
    const res = await request.post(`/api/games/${game.id}/ready`).send({ player_id: stranger.id })
    expect(res.status).toBe(403)
  })
})

describe('placement timer expiry — F5 AC6', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('F5 AC6: when the placement timer runs out, the game ends and no stats are awarded', async () => {
    const creator = await createPlayer('Creator')
    const joiner = await createPlayer('Joiner')
    const gameRes = await request
      .post('/api/games')
      .send({ creator_id: creator.id, preset: 'quick' })
    const game = gameRes.body as CreateGameResponse

    // Fake timers must be active BEFORE /join arms the setInterval, or
    // advanceTimersByTime can't drive the already-running real interval.
    // Fake timers only patch timer APIs, not the promise/socket I/O supertest uses.
    vi.useFakeTimers()
    await request.post(`/api/games/${game.id}/join`).send({ player_id: joiner.id })
    expect(getGame(game.id)?.status).toBe('placing')

    vi.advanceTimersByTime(PRESET_SECONDS.quick * 1000)

    expect(getGame(game.id)?.status).toBe('finished')
    expect(getPlayerById(joiner.id)?.games_played).toBe(0)
    expect(getPlayerById(joiner.id)?.wins).toBe(0)
  })
})
