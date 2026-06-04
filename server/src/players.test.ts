import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import type { ErrorResponse, Player } from '@shared/schemas'
import supertest from 'supertest'
import { afterEach, describe, expect, it, vi } from 'vitest'

type PlayerRepo = { upsertPlayer: (name: string) => Player }
type DatabaseModule = { getDb: () => { close: () => void } }

import { app } from './index.js'

const request = supertest(app)

function uniqueName(prefix: string) {
  return `${prefix}-${Date.now().toString()}-${Math.random().toString(36).slice(2)}`
}

describe('POST /api/players — F1 AC4 / F9 AC1 / NF4', () => {
  it('AC4: creates a player and returns the full record shape with win_rate 0', async () => {
    const name = uniqueName('Bob')
    const res = await request.post('/api/players').send({ name })
    const body = res.body as Player

    expect(res.status).toBe(200)
    expect(typeof body.id).toBe('string')
    expect(body.id).not.toHaveLength(0)
    expect(body).toMatchObject({
      name,
      games_played: 0,
      wins: 0,
      losses: 0,
      win_rate: 0,
    })
  })

  it('AC4: upserts by name — a second POST with the same name returns the same id, not a duplicate', async () => {
    const name = uniqueName('Bob')

    const first = await request.post('/api/players').send({ name })
    const second = await request.post('/api/players').send({ name })
    const firstBody = first.body as Player
    const secondBody = second.body as Player

    expect(first.status).toBe(200)
    expect(second.status).toBe(200)
    expect(secondBody.id).toBe(firstBody.id)
    expect(secondBody.name).toBe(name)
  })

  it('AC4/NF4: rejects a whitespace-only name with 400 and an { error: string } envelope', async () => {
    const res = await request.post('/api/players').send({ name: '   ' })
    const body = res.body as ErrorResponse

    expect(res.status).toBe(400)
    expect(typeof body.error).toBe('string')
    expect(body.error.length).toBeGreaterThan(0)
  })
})

describe('Player stats persistence — F9 AC2', () => {
  let dir: string

  afterEach(() => {
    vi.resetModules()
    delete process.env.DB_PATH
    if (dir) rmSync(dir, { recursive: true, force: true })
  })

  it('AC2: the real upsertPlayer resolves to the same id across a DB close/reopen', async () => {
    dir = mkdtempSync(join(tmpdir(), 'battleship-persist-'))
    process.env.DB_PATH = join(dir, 'battleship.db')

    vi.resetModules()
    const { upsertPlayer } = (await import('./db/players.repository.js')) as PlayerRepo
    const { getDb } = await import('./db/database.js')
    const id1 = upsertPlayer('PersistBob').id
    getDb().close()

    vi.resetModules()
    const { upsertPlayer: upsertPlayerAfterRestart } =
      (await import('./db/players.repository.js')) as PlayerRepo
    const id2 = upsertPlayerAfterRestart('PersistBob').id

    expect(id2).toBe(id1)
  })
})
