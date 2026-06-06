import { randomUUID } from 'node:crypto'

import { PlayerResponse } from '@shared/schemas'
import supertest from 'supertest'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import { app } from './index.js'

const request = supertest(app)

const ErrorEnvelope = z.object({ error: z.string() })

function uniqueName() {
  return `Player-${randomUUID()}`
}

describe('POST /api/players', () => {
  // F1 AC4: a valid name creates/retrieves a player record matching PlayerResponse
  it('returns a player record with the full stats shape for a valid name', async () => {
    const name = uniqueName()
    const res = await request.post('/api/players').send({ name })

    expect(res.status).toBe(200)
    const player = PlayerResponse.parse(res.body)
    expect(player.name).toBe(name)
    expect(player.games_played).toBe(0)
    expect(player.wins).toBe(0)
    expect(player.losses).toBe(0)
    expect(player.win_rate).toBe(0)
    expect(player.id.length).toBeGreaterThan(0)
  })

  // F1 AC4: upsert by name — the same name returns the same id (identity is not forked)
  it('returns the same id when the same name is submitted twice', async () => {
    const name = uniqueName()
    const first = PlayerResponse.parse((await request.post('/api/players').send({ name })).body)
    const second = PlayerResponse.parse((await request.post('/api/players').send({ name })).body)

    expect(second.id).toBe(first.id)
  })

  // F1 AC4: name is trimmed before lookup — surrounding whitespace must not fork identity
  it('trims the name before lookup so padded and unpadded names share one id', async () => {
    const name = uniqueName()
    const padded = PlayerResponse.parse(
      (await request.post('/api/players').send({ name: `  ${name}  ` })).body,
    )
    const plain = PlayerResponse.parse((await request.post('/api/players').send({ name })).body)

    expect(padded.id).toBe(plain.id)
    expect(plain.name).toBe(name)
  })

  // NF4 AC1 + spec (name must be 1–50 chars after trimming): invalid input -> 400 { error: string }
  it('returns 400 with an { error } envelope for a whitespace-only name', async () => {
    const res = await request.post('/api/players').send({ name: '   ' })

    expect(res.status).toBe(400)
    const body = ErrorEnvelope.parse(res.body)
    expect(body.error.length).toBeGreaterThan(0)
  })
})
