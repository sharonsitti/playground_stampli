import http from 'node:http'
import type { AddressInfo } from 'node:net'

import type { CreateGameResponse, Player } from '@shared/schemas'
import { PRESET_SECONDS } from '@shared/schemas'
import supertest from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { app } from './index.js'

let server: http.Server
let baseUrl: string
let request: supertest.Agent

beforeAll(async () => {
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      resolve()
    })
  })
  const { port } = server.address() as AddressInfo
  baseUrl = `http://127.0.0.1:${port.toString()}`
  request = supertest(server)
})

afterAll(async () => {
  await new Promise<void>((resolve) => {
    server.close(() => {
      resolve()
    })
  })
})

function uniqueName(prefix: string) {
  return `${prefix}-${Date.now().toString()}-${Math.random().toString(36).slice(2)}`
}

async function createPlayer(prefix: string): Promise<Player> {
  const res = await request.post('/api/players').send({ name: uniqueName(prefix) })
  return res.body as Player
}

async function placingGame() {
  const creator = await createPlayer('Creator')
  const joiner = await createPlayer('Joiner')
  const gameRes = await request.post('/api/games').send({ creator_id: creator.id, preset: 'quick' })
  const game = gameRes.body as CreateGameResponse
  await request.post(`/api/games/${game.id}/join`).send({ player_id: joiner.id })
  return { game, creator, joiner }
}

type SseEvent = { event: string; data: unknown }

// Opens a real SSE connection and resolves once an event named `until` arrives
// (or rejects on timeout), then tears the socket down so the test can't hang.
function readUntil(gameId: string, until: string, onOpen?: () => void): Promise<SseEvent[]> {
  return new Promise((resolve, reject) => {
    const events: SseEvent[] = []
    let buffer = ''
    let done = false
    const finish = () => {
      done = true
      req.destroy()
      resolve(events)
    }
    const req = http.get(`${baseUrl}/api/games/${gameId}/events`, (res) => {
      res.setEncoding('utf8')
      res.on('data', (chunk: string) => {
        buffer += chunk
        let sep = buffer.indexOf('\n\n')
        while (sep !== -1) {
          const block = buffer.slice(0, sep)
          buffer = buffer.slice(sep + 2)
          const eventLine = block.split('\n').find((l) => l.startsWith('event: '))
          const dataLine = block.split('\n').find((l) => l.startsWith('data: '))
          if (eventLine && dataLine) {
            const evt = {
              event: eventLine.slice('event: '.length),
              data: JSON.parse(dataLine.slice('data: '.length)) as unknown,
            }
            events.push(evt)
            if (evt.event === until) {
              finish()
              return
            }
          }
          sep = buffer.indexOf('\n\n')
        }
      })
      onOpen?.()
    })
    req.on('error', () => {
      // destroy() after finish triggers an aborted error — ignore once resolved.
      if (!done) reject(new Error('SSE connection error'))
    })
    setTimeout(() => {
      if (done) return
      req.destroy()
      reject(
        new Error(`timed out waiting for '${until}'; got ${events.map((e) => e.event).join(',')}`),
      )
    }, 4000).unref()
  })
}

describe('GET /api/games/:gameId/events — F5/F6 SSE integration', () => {
  it('PM-B4 (F5 replay): a client connecting mid-placement is replayed player_joined then the current timer_tick', async () => {
    const { game } = await placingGame()

    const events = await readUntil(game.id, 'timer_tick')

    expect(events[0]?.event).toBe('player_joined')
    expect(events[1]?.event).toBe('timer_tick')
    expect((events[1]?.data as { seconds_remaining: number }).seconds_remaining).toBe(
      PRESET_SECONDS.quick,
    )
  })

  it('PM-B2 (F6 AC2): battle_start reaches a subscribed client with current_turn === creator.id', async () => {
    const { game, creator, joiner } = await placingGame()
    const fleet = [
      { type: 'carrier', orientation: 'H', origin_col: 0, origin_row: 1 },
      { type: 'battleship', orientation: 'H', origin_col: 0, origin_row: 2 },
      { type: 'cruiser', orientation: 'H', origin_col: 0, origin_row: 3 },
      { type: 'submarine', orientation: 'H', origin_col: 0, origin_row: 4 },
      { type: 'destroyer', orientation: 'H', origin_col: 0, origin_row: 5 },
    ]

    // Connect first (replays player_joined + timer_tick), then drive both to ready
    // so the live battle_start broadcast lands on this same stream.
    const collected = readUntil(game.id, 'battle_start', () => {
      void (async () => {
        await request
          .post(`/api/games/${game.id}/place`)
          .send({ player_id: creator.id, ships: fleet })
        await request
          .post(`/api/games/${game.id}/place`)
          .send({ player_id: joiner.id, ships: fleet })
        await request.post(`/api/games/${game.id}/ready`).send({ player_id: creator.id })
        await request.post(`/api/games/${game.id}/ready`).send({ player_id: joiner.id })
      })()
    })

    const events = await collected
    const battleStart = events.find((e) => e.event === 'battle_start')
    expect(battleStart).toBeDefined()
    expect((battleStart?.data as { current_turn: string }).current_turn).toBe(creator.id)
  })

  it('Flow 5: the game-ending shot streams shot_fired then game_over with full stats', async () => {
    const { game, creator, joiner } = await placingGame()
    const fleet = [
      { type: 'carrier', orientation: 'H', origin_col: 0, origin_row: 1 },
      { type: 'battleship', orientation: 'H', origin_col: 0, origin_row: 2 },
      { type: 'cruiser', orientation: 'H', origin_col: 0, origin_row: 3 },
      { type: 'submarine', orientation: 'H', origin_col: 0, origin_row: 4 },
      { type: 'destroyer', orientation: 'H', origin_col: 0, origin_row: 5 },
    ]
    await request.post(`/api/games/${game.id}/place`).send({ player_id: creator.id, ships: fleet })
    await request.post(`/api/games/${game.id}/place`).send({ player_id: joiner.id, ships: fleet })
    await request.post(`/api/games/${game.id}/ready`).send({ player_id: creator.id })
    await request.post(`/api/games/${game.id}/ready`).send({ player_id: joiner.id })

    const targets: { col: number; row: number }[] = []
    for (let c = 0; c <= 4; c++) targets.push({ col: c, row: 1 })
    for (let c = 0; c <= 3; c++) targets.push({ col: c, row: 2 })
    for (let c = 0; c <= 2; c++) targets.push({ col: c, row: 3 })
    for (let c = 0; c <= 2; c++) targets.push({ col: c, row: 4 })
    for (let c = 0; c <= 1; c++) targets.push({ col: c, row: 5 })
    const fillers: { col: number; row: number }[] = []
    for (let c = 5; c <= 9; c++) {
      for (let r = 6; r <= 10; r++) fillers.push({ col: c, row: r })
    }
    const nextFiller = fillers[Symbol.iterator]()

    const collected = readUntil(game.id, 'game_over', () => {
      void (async () => {
        for (const [index, target] of targets.entries()) {
          await request
            .post(`/api/games/${game.id}/shot`)
            .send({ player_id: creator.id, col: target.col, row: target.row })
          if (index < targets.length - 1) {
            const filler = nextFiller.next().value as { col: number; row: number }
            await request
              .post(`/api/games/${game.id}/shot`)
              .send({ player_id: joiner.id, col: filler.col, row: filler.row })
          }
        }
      })()
    })

    const events = await collected
    const names = events.map((e) => e.event)
    const overIdx = names.indexOf('game_over')
    const shotIdx = names.lastIndexOf('shot_fired')
    expect(shotIdx).toBeGreaterThanOrEqual(0)
    expect(overIdx).toBeGreaterThan(shotIdx)

    const overEvent = events.find((e) => e.event === 'game_over')
    const over = overEvent?.data as {
      winner_id: string
      loser_id: string
      winner: Player
      loser: Player
    }
    expect(over.winner_id).toBe(creator.id)
    expect(over.loser_id).toBe(joiner.id)
    expect(over.winner.wins).toBe(1)
    expect(over.winner.games_played).toBe(1)
    expect(over.winner.win_rate).toBe(1)
    expect(over.loser.losses).toBe(1)
    expect(over.loser.games_played).toBe(1)
  })
})
