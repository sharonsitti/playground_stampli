import { randomUUID } from 'node:crypto'

import { CreateGameResponse, PlayerResponse } from '@shared/schemas'
import supertest from 'supertest'
import { describe, expect, it } from 'vitest'

import { getGame } from './db/games.repository.js'
import { app } from './index.js'

const request = supertest(app)

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

describe('POST /api/games/:gameId/ready — phase transition', () => {
  // F5 AC5: when both players are ready the game enters the *battle* phase specifically —
  // not merely "leaves placing". The game record must be marked status='battle', and per
  // F6 AC2 / battle_start contract the creator takes the first turn (current_turn = creator).
  it('transitions the game record to battle with the creator on first turn', async () => {
    const { id, creatorId, joinerId } = await placingGame()

    await request.post(`/api/games/${id}/ready`).send({ player_id: creatorId })
    await request.post(`/api/games/${id}/ready`).send({ player_id: joinerId })

    const game = getGame(id)
    expect(game?.status).toBe('battle')
    expect(game?.current_turn).toBe(creatorId)
  })
})
