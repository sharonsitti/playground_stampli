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

// Contract: docs/spec.md POST /api/players — "name ... must contain 1–50 characters
// after trimming (inclusive)"; Decision Record #2 (1–50 bound, padding stripped before measuring).
describe('POST /api/players — name length bounds', () => {
  it('U7a: rejects a name longer than 50 characters after trimming with 400 and the error envelope (spec POST /api/players; Decision Record #2)', async () => {
    const res = await request.post('/api/players').send({ name: 'a'.repeat(51) })
    expect(res.status).toBe(400)
    const error = asError(res.body).error
    expect(typeof error).toBe('string')
    expect(error.length).toBeGreaterThan(0)
  })

  it('U7b: accepts a name of exactly 50 characters (inclusive upper bound) (spec POST /api/players; Decision Record #2)', async () => {
    const name = 'b'.repeat(50)
    const res = await request.post('/api/players').send({ name })
    expect(res.status).toBe(200)
    expect(asPlayer(res.body).name).toBe(name)
  })

  it('U7c: measures length after trimming — whitespace padding does not push a 49-character name over the limit (Decision Record #2: padding stripped before measuring)', async () => {
    const core = 'c'.repeat(49)
    const res = await request.post('/api/players').send({ name: `  ${core}  ` })
    expect(res.status).toBe(200)
    expect(asPlayer(res.body).name).toBe(core)
  })
})
