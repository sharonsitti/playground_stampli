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

function fleetCells(): { col: number; row: number }[] {
  const cells: { col: number; row: number }[] = []
  for (let c = 0; c <= 4; c++) cells.push({ col: c, row: 1 })
  for (let c = 0; c <= 3; c++) cells.push({ col: c, row: 2 })
  for (let c = 0; c <= 2; c++) cells.push({ col: c, row: 3 })
  for (let c = 0; c <= 2; c++) cells.push({ col: c, row: 4 })
  for (let c = 0; c <= 1; c++) cells.push({ col: c, row: 5 })
  return cells
}

function emptyCells(): { col: number; row: number }[] {
  const cells: { col: number; row: number }[] = []
  for (let c = 5; c <= 9; c++) {
    for (let r = 6; r <= 10; r++) cells.push({ col: c, row: r })
  }
  return cells
}

interface Finished {
  gameId: string
  creator: Player
  joiner: Player
  lastShot: ShotResponse
}

// Drives a fresh game all the way to creator-wins game over.
async function playToCreatorWin(): Promise<Finished> {
  const creator = await createPlayer('Winner')
  const joiner = await createPlayer('Loser')
  const gameRes = await request.post('/api/games').send({ creator_id: creator.id, preset: 'quick' })
  const game = gameRes.body as CreateGameResponse
  await request.post(`/api/games/${game.id}/join`).send({ player_id: joiner.id })
  await request.post(`/api/games/${game.id}/place`).send({ player_id: creator.id, ships: FLEET })
  await request.post(`/api/games/${game.id}/place`).send({ player_id: joiner.id, ships: FLEET })
  await request.post(`/api/games/${game.id}/ready`).send({ player_id: creator.id })
  await request.post(`/api/games/${game.id}/ready`).send({ player_id: joiner.id })

  const targets = fleetCells()
  const fillers = emptyCells()[Symbol.iterator]()
  let lastShot: ShotResponse | undefined
  for (const [index, target] of targets.entries()) {
    const shot = await request
      .post(`/api/games/${game.id}/shot`)
      .send({ player_id: creator.id, col: target.col, row: target.row })
    lastShot = shot.body as ShotResponse
    if (index < targets.length - 1) {
      const filler = fillers.next().value as { col: number; row: number }
      await request
        .post(`/api/games/${game.id}/shot`)
        .send({ player_id: joiner.id, col: filler.col, row: filler.row })
    }
  }

  return { gameId: game.id, creator, joiner, lastShot: lastShot as ShotResponse }
}

describe('game over + stats — F8 / F9 / Flow 5', () => {
  it('F8 AC1: the game ends when the final ship is sunk', async () => {
    const { lastShot } = await playToCreatorWin()
    expect(lastShot.hit).toBe(true)
    expect(lastShot.sunk).toBe(true)
    expect(lastShot.ship_type).toBe('destroyer')
  })

  it('F8 AC4 / F9: winner gets wins+1 & games_played+1; loser gets losses+1 & games_played+1', async () => {
    const { creator, joiner } = await playToCreatorWin()

    const winner = (await request.post('/api/players').send({ name: creator.name })).body as Player
    const loser = (await request.post('/api/players').send({ name: joiner.name })).body as Player

    expect(winner.wins).toBe(1)
    expect(winner.losses).toBe(0)
    expect(winner.games_played).toBe(1)
    expect(winner.win_rate).toBe(1)

    expect(loser.wins).toBe(0)
    expect(loser.losses).toBe(1)
    expect(loser.games_played).toBe(1)
    expect(loser.win_rate).toBe(0)
  })

  it('NF5 AC3: any action on a finished game returns 409', async () => {
    const { gameId, creator, joiner } = await playToCreatorWin()

    const shotRes = await request
      .post(`/api/games/${gameId}/shot`)
      .send({ player_id: joiner.id, col: 9, row: 9 })
    expect(shotRes.status).toBe(409)

    const placeRes = await request
      .post(`/api/games/${gameId}/place`)
      .send({ player_id: creator.id, ships: FLEET })
    expect(placeRes.status).toBe(409)
  })

  it('Flow 5: stats are durable — re-fetching the players shows the persisted record', async () => {
    const { creator } = await playToCreatorWin()
    const refetch = (await request.post('/api/players').send({ name: creator.name })).body as Player
    expect(refetch.games_played).toBe(1)
    expect(refetch.wins).toBe(1)
  })
})
