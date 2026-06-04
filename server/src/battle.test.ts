import type { CreateGameResponse, Player, ShipPlacement, ShotResponse } from '@shared/schemas'
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

const FLEET: ShipPlacement[] = [
  { type: 'carrier', orientation: 'H', origin_col: 0, origin_row: 1 },
  { type: 'battleship', orientation: 'H', origin_col: 0, origin_row: 2 },
  { type: 'cruiser', orientation: 'H', origin_col: 0, origin_row: 3 },
  { type: 'submarine', orientation: 'H', origin_col: 0, origin_row: 4 },
  { type: 'destroyer', orientation: 'H', origin_col: 0, origin_row: 5 },
]

interface BattleCtx {
  gameId: string
  creator: Player
  joiner: Player
}

async function battleGame(): Promise<BattleCtx> {
  const creator = await createPlayer('Creator')
  const joiner = await createPlayer('Joiner')
  const gameRes = await request.post('/api/games').send({ creator_id: creator.id, preset: 'quick' })
  const game = gameRes.body as CreateGameResponse
  await request.post(`/api/games/${game.id}/join`).send({ player_id: joiner.id })
  await request.post(`/api/games/${game.id}/place`).send({ player_id: creator.id, ships: FLEET })
  await request.post(`/api/games/${game.id}/place`).send({ player_id: joiner.id, ships: FLEET })
  await request.post(`/api/games/${game.id}/ready`).send({ player_id: creator.id })
  await request.post(`/api/games/${game.id}/ready`).send({ player_id: joiner.id })
  return { gameId: game.id, creator, joiner }
}

describe('POST /api/games/:gameId/shot — F6 / F7 / NF3 / NF5 AC2', () => {
  it('F7 AC1: a shot on an occupied cell is a hit', async () => {
    const { gameId, creator } = await battleGame()
    // Joiner's carrier occupies (0,1)..(4,1); creator fires first.
    const res = await request
      .post(`/api/games/${gameId}/shot`)
      .send({ player_id: creator.id, col: 0, row: 1 })
    const body = res.body as ShotResponse

    expect(res.status).toBe(200)
    expect(body.hit).toBe(true)
    expect(body.sunk).toBe(false)
    expect(body.ship_type).toBeNull()
    expect(body.ship_cells).toBeNull()
  })

  it('a shot on an empty cell is a miss', async () => {
    const { gameId, creator } = await battleGame()
    const res = await request
      .post(`/api/games/${gameId}/shot`)
      .send({ player_id: creator.id, col: 9, row: 10 })
    const body = res.body as ShotResponse

    expect(res.status).toBe(200)
    expect(body.hit).toBe(false)
    expect(body.sunk).toBe(false)
  })

  it('F7 AC2-3: sinking a ship returns sunk + full outline', async () => {
    const { gameId, creator, joiner } = await battleGame()
    // Destroyer (size 2) at (0,5)-(1,5). Creator and joiner alternate turns.
    let res = await request
      .post(`/api/games/${gameId}/shot`)
      .send({ player_id: creator.id, col: 0, row: 5 })
    expect((res.body as ShotResponse).sunk).toBe(false)

    // Joiner's turn — a miss so control returns to creator.
    await request.post(`/api/games/${gameId}/shot`).send({ player_id: joiner.id, col: 9, row: 9 })

    res = await request
      .post(`/api/games/${gameId}/shot`)
      .send({ player_id: creator.id, col: 1, row: 5 })
    const body = res.body as ShotResponse

    expect(body.hit).toBe(true)
    expect(body.sunk).toBe(true)
    expect(body.ship_type).toBe('destroyer')
    expect(body.ship_cells).toEqual([
      { col: 0, row: 5 },
      { col: 1, row: 5 },
    ])
  })

  it('NF3 AC3 / NF5 AC2 ordering: acting out of turn returns 403', async () => {
    const { gameId, joiner } = await battleGame()
    // Creator fires first; joiner shooting now is out of turn.
    const res = await request
      .post(`/api/games/${gameId}/shot`)
      .send({ player_id: joiner.id, col: 0, row: 1 })
    expect(res.status).toBe(403)
  })

  it('NF3 AC1: out-of-bounds coordinates return 400', async () => {
    const { gameId, creator } = await battleGame()
    const res = await request
      .post(`/api/games/${gameId}/shot`)
      .send({ player_id: creator.id, col: 10, row: 1 })
    expect(res.status).toBe(400)
  })

  it('NF3 AC2: firing on an already-fired cell returns 400', async () => {
    const { gameId, creator, joiner } = await battleGame()
    await request.post(`/api/games/${gameId}/shot`).send({ player_id: creator.id, col: 3, row: 7 })
    // Joiner takes a turn so control returns to creator.
    await request.post(`/api/games/${gameId}/shot`).send({ player_id: joiner.id, col: 8, row: 8 })

    const res = await request
      .post(`/api/games/${gameId}/shot`)
      .send({ player_id: creator.id, col: 3, row: 7 })
    expect(res.status).toBe(400)
  })

  it('NF5 AC2: shooting before the battle phase returns 409', async () => {
    const creator = await createPlayer('Early')
    const joiner = await createPlayer('Joiner')
    const gameRes = await request
      .post('/api/games')
      .send({ creator_id: creator.id, preset: 'quick' })
    const game = gameRes.body as CreateGameResponse
    await request.post(`/api/games/${game.id}/join`).send({ player_id: joiner.id })

    const res = await request
      .post(`/api/games/${game.id}/shot`)
      .send({ player_id: creator.id, col: 0, row: 1 })
    expect(res.status).toBe(409)
  })

  it('returns 404 for an unknown game', async () => {
    const creator = await createPlayer('Ghost')
    const res = await request
      .post('/api/games/nope/shot')
      .send({ player_id: creator.id, col: 0, row: 1 })
    expect(res.status).toBe(404)
  })

  it('F6: control alternates — after a shot it is the opponent’s turn', async () => {
    const { gameId, creator, joiner } = await battleGame()
    await request.post(`/api/games/${gameId}/shot`).send({ player_id: creator.id, col: 9, row: 10 })

    // Creator firing again immediately is now out of turn.
    const again = await request
      .post(`/api/games/${gameId}/shot`)
      .send({ player_id: creator.id, col: 8, row: 9 })
    expect(again.status).toBe(403)

    // Joiner can fire.
    const joinerShot = await request
      .post(`/api/games/${gameId}/shot`)
      .send({ player_id: joiner.id, col: 8, row: 9 })
    expect(joinerShot.status).toBe(200)
  })

  it('NF1 AC3: a miss does not sink and reveals no outline', async () => {
    const { gameId, creator } = await battleGame()
    const res = await request
      .post(`/api/games/${gameId}/shot`)
      .send({ player_id: creator.id, col: 7, row: 8 })
    const body = res.body as ShotResponse
    expect(body.hit).toBe(false)
    expect(body.ship_type).toBeNull()
    expect(body.ship_cells).toBeNull()
  })

  it('game-over: sinking the last ship freezes the board (no turn handoff to the loser)', async () => {
    const { gameId, creator, joiner } = await battleGame()

    // All occupied cells of the FLEET layout, in shot order. Destroyer last so its
    // sink is the final, game-ending shot.
    const targets: { col: number; row: number }[] = []
    for (let c = 0; c <= 4; c++) targets.push({ col: c, row: 1 })
    for (let c = 0; c <= 3; c++) targets.push({ col: c, row: 2 })
    for (let c = 0; c <= 2; c++) targets.push({ col: c, row: 3 })
    for (let c = 0; c <= 2; c++) targets.push({ col: c, row: 4 })
    for (let c = 0; c <= 1; c++) targets.push({ col: c, row: 5 })

    // Empty cells (fleet sits in cols 0-4 / rows 1-5) for the joiner's filler misses.
    const fillers: { col: number; row: number }[] = []
    for (let c = 5; c <= 9; c++) {
      for (let r = 6; r <= 10; r++) fillers.push({ col: c, row: r })
    }
    const nextFiller = fillers[Symbol.iterator]()

    let last: ShotResponse | undefined
    for (const [index, target] of targets.entries()) {
      const shot = await request
        .post(`/api/games/${gameId}/shot`)
        .send({ player_id: creator.id, col: target.col, row: target.row })
      last = shot.body as ShotResponse
      if (index < targets.length - 1) {
        const filler = nextFiller.next().value as { col: number; row: number }
        await request
          .post(`/api/games/${gameId}/shot`)
          .send({ player_id: joiner.id, col: filler.col, row: filler.row })
      }
    }

    // Final shot sinks the destroyer and ends the game.
    expect(last?.sunk).toBe(true)
    expect(last?.ship_type).toBe('destroyer')

    // Board is frozen: the game is finished, so any further shot — including the
    // loser's — is rejected with 409 (NF5 AC3), never handed to a defeated player.
    const joinerAttempt = await request
      .post(`/api/games/${gameId}/shot`)
      .send({ player_id: joiner.id, col: 0, row: 10 })
    expect(joinerAttempt.status).toBe(409)
  })
})
