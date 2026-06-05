import type { CreatePlayerResponse, ErrorResponse } from '@shared/schemas'
import supertest from 'supertest'
import { afterAll, describe, expect, it } from 'vitest'

import { db } from './db/db.js'
import { app } from './index.js'

const request = supertest(app)

afterAll(() => {
  db.exec('DELETE FROM players')
})

function asPlayer(body: unknown): CreatePlayerResponse {
  return body as CreatePlayerResponse
}

function asError(body: unknown): ErrorResponse {
  return body as ErrorResponse
}

describe('POST /api/players — happy path', () => {
  it('H1: creates a player and returns the full record with zeroed stats', async () => {
    const res = await request.post('/api/players').send({ name: 'Ada' })
    expect(res.status).toBe(200)
    const player = asPlayer(res.body)
    expect(player.name).toBe('Ada')
    expect(player.games_played).toBe(0)
    expect(player.wins).toBe(0)
    expect(player.losses).toBe(0)
    expect(player.win_rate).toBe(0)
    expect(Object.keys(player).sort()).toEqual(
      ['games_played', 'id', 'losses', 'name', 'win_rate', 'wins'].sort(),
    )
  })

  it('H2: returns the same record (same id) when the same name is posted twice', async () => {
    const first = await request.post('/api/players').send({ name: 'Grace' })
    const second = await request.post('/api/players').send({ name: 'Grace' })
    expect(asPlayer(second.body).id).toBe(asPlayer(first.body).id)
  })

  it('H3: trims leading/trailing whitespace before lookup and storage', async () => {
    const a = await request.post('/api/players').send({ name: 'Linus' })
    const b = await request.post('/api/players').send({ name: '  Linus  ' })
    expect(asPlayer(b.body).id).toBe(asPlayer(a.body).id)
    expect(asPlayer(b.body).name).toBe('Linus')
  })

  it('H4: win_rate is 0 (not NaN) when games_played is 0', async () => {
    const res = await request.post('/api/players').send({ name: 'Margaret' })
    const player = asPlayer(res.body)
    expect(player.win_rate).toBe(0)
    expect(Number.isNaN(player.win_rate)).toBe(false)
  })

  it('H5: id is a non-empty string and stable across upsert calls', async () => {
    const first = await request.post('/api/players').send({ name: 'Edsger' })
    const second = await request.post('/api/players').send({ name: 'Edsger' })
    const id = asPlayer(first.body).id
    expect(typeof id).toBe('string')
    expect(id.length).toBeGreaterThan(0)
    expect(asPlayer(second.body).id).toBe(id)
  })

  it('H6: responds with application/json content type', async () => {
    const res = await request.post('/api/players').send({ name: 'Barbara' })
    expect(res.headers['content-type']).toMatch(/application\/json/)
  })
})

describe('POST /api/players — unhappy path', () => {
  it('U1: rejects an empty name with 400 and an error envelope', async () => {
    const res = await request.post('/api/players').send({ name: '' })
    expect(res.status).toBe(400)
    const error = asError(res.body).error
    expect(typeof error).toBe('string')
    expect(error.length).toBeGreaterThan(0)
  })

  it('U2: rejects an all-whitespace name with 400 and an error envelope', async () => {
    const res = await request.post('/api/players').send({ name: '   ' })
    expect(res.status).toBe(400)
    const error = asError(res.body).error
    expect(typeof error).toBe('string')
    expect(error.length).toBeGreaterThan(0)
  })

  it('U3: rejects a missing name with 400 and an error envelope', async () => {
    const res = await request.post('/api/players').send({})
    expect(res.status).toBe(400)
    const error = asError(res.body).error
    expect(typeof error).toBe('string')
    expect(error.length).toBeGreaterThan(0)
  })

  it('U4: error responses use the { error: string } envelope only', async () => {
    const res = await request.post('/api/players').send({})
    expect(res.status).toBe(400)
    expect(Object.keys(asError(res.body))).toEqual(['error'])
    expect(typeof asError(res.body).error).toBe('string')
  })

  it('U5: rejects a non-string name with 400 (does not crash the handler)', async () => {
    const res = await request.post('/api/players').send({ name: 123 })
    expect(res.status).toBe(400)
    expect(typeof asError(res.body).error).toBe('string')
  })

  it('U6: ignores client-supplied stat fields; server is authoritative', async () => {
    const res = await request
      .post('/api/players')
      .send({ name: 'Mallory', wins: 999, losses: 999, games_played: 999, win_rate: 1 })
    expect(res.status).toBe(200)
    const player = asPlayer(res.body)
    expect(player.wins).toBe(0)
    expect(player.losses).toBe(0)
    expect(player.games_played).toBe(0)
    expect(player.win_rate).toBe(0)
  })
})
