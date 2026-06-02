import supertest from 'supertest'
import { describe, expect, it } from 'vitest'

import { app } from './index.js'

const request = supertest(app)

describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request.get('/health')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ status: 'ok' })
  })
})
