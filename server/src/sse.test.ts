import type { Response } from 'express'
import { describe, expect, it, vi } from 'vitest'

import {
  addGameClient,
  addLobbyClient,
  broadcastGameEvent,
  broadcastLobbyEvent,
  removeGameClient,
  removeLobbyClient,
} from './sse.js'

function mockRes() {
  const writes: string[] = []
  const res = {
    setHeader: vi.fn(),
    flushHeaders: vi.fn(),
    write: vi.fn((chunk: string) => {
      writes.push(chunk)
      return true
    }),
  }
  return { res: res as unknown as Response, writes }
}

describe('SSE manager', () => {
  it('formats events as event/data lines with JSON-encoded payloads', () => {
    const { res, writes } = mockRes()
    addLobbyClient(res)
    broadcastLobbyEvent('game_created', { id: 'g1', creator: { name: 'Bob' } })
    removeLobbyClient(res)

    expect(writes).toEqual(['event: game_created\ndata: {"id":"g1","creator":{"name":"Bob"}}\n\n'])
  })

  it('escapes newlines in names so a crafted name cannot inject a fake event', () => {
    const { res, writes } = mockRes()
    addLobbyClient(res)
    broadcastLobbyEvent('game_created', { creator: { name: 'evil\nevent: hijack\ndata: x' } })
    removeLobbyClient(res)

    // The newline is JSON-escaped to \\n, so the payload stays on a single data line.
    expect(writes[0]).toContain('evil\\nevent: hijack\\ndata: x')
    expect(writes[0]).not.toContain('\nevent: hijack')
  })

  it('does not deliver lobby events to a removed client', () => {
    const { res, writes } = mockRes()
    addLobbyClient(res)
    removeLobbyClient(res)
    broadcastLobbyEvent('game_created', { id: 'g1' })
    expect(writes).toHaveLength(0)
  })

  it('scopes game events to the matching gameId only', () => {
    const a = mockRes()
    const b = mockRes()
    addGameClient('game-a', a.res)
    addGameClient('game-b', b.res)

    broadcastGameEvent('game-a', 'player_joined', { joiner: { id: 'p1', name: 'Ann' } })

    expect(a.writes).toHaveLength(1)
    expect(b.writes).toHaveLength(0)

    removeGameClient('game-a', a.res)
    removeGameClient('game-b', b.res)
  })
})
