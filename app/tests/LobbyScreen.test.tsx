import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { LobbyScreen } from '../src/components/LobbyScreen'
import type { GameSummary } from '@shared/schemas'

type Listener = (event: MessageEvent<string>) => void

class FakeEventSource {
  static instances: FakeEventSource[] = []
  url: string
  listeners = new Map<string, Listener>()
  closed = false

  constructor(url: string) {
    this.url = url
    FakeEventSource.instances.push(this)
  }
  addEventListener(type: string, listener: Listener) {
    this.listeners.set(type, listener)
  }
  close() {
    this.closed = true
  }
  emit(type: string, data: unknown) {
    this.listeners.get(type)?.({ data: JSON.stringify(data) } as MessageEvent<string>)
  }
}

function creator(overrides: Partial<GameSummary['creator']> = {}): GameSummary['creator'] {
  return {
    id: 'creator-1',
    name: 'Zoe',
    games_played: 3,
    wins: 2,
    losses: 1,
    win_rate: 0.6666,
    ...overrides,
  }
}

function mockGamesFetch(games: GameSummary[]) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ games }),
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  FakeEventSource.instances = []
})

beforeEach(() => {
  vi.stubGlobal('EventSource', FakeEventSource)
})

describe('F2/F3 — lobby', () => {
  it('F2: renders waiting games with record, win rate, and preset; hides own game', async () => {
    mockGamesFetch([
      { id: 'g1', preset: 'quick', creator: creator() },
      { id: 'g-own', preset: 'casual', creator: creator({ id: 'me', name: 'Me' }) },
    ])

    render(<LobbyScreen playerId="me" playerName="Me" onGameJoined={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText('Zoe')).toBeInTheDocument()
    })
    expect(screen.getByText(/2W \/ 1L/)).toBeInTheDocument()
    expect(screen.getByText(/67% win rate/)).toBeInTheDocument()
    expect(screen.getByText(/Quick 30s/)).toBeInTheDocument()
    expect(screen.queryByText('Me')).not.toBeInTheDocument()
  })

  it('F2: shows the empty state when no games are available', async () => {
    mockGamesFetch([])
    render(<LobbyScreen playerId="me" playerName="Me" onGameJoined={vi.fn()} />)
    await waitFor(() => {
      expect(screen.getByText('No games available — create one to get started')).toBeInTheDocument()
    })
  })

  it('F3 AC4: adds a game on game_created and removes it on game_removed via SSE', async () => {
    mockGamesFetch([])
    render(<LobbyScreen playerId="me" playerName="Me" onGameJoined={vi.fn()} />)
    await waitFor(() => {
      expect(FakeEventSource.instances).toHaveLength(1)
    })

    const lobby = FakeEventSource.instances[0]
    lobby?.emit('game_created', {
      id: 'g2',
      preset: 'casual',
      creator: creator({ id: 'c2', name: 'Ada' }),
    })
    expect(await screen.findByText('Ada')).toBeInTheDocument()

    lobby?.emit('game_removed', { id: 'g2' })
    await waitFor(() => {
      expect(screen.queryByText('Ada')).not.toBeInTheDocument()
    })
  })

  it('F3 AC3: clicking Join posts and calls onGameJoined on success', async () => {
    const user = userEvent.setup()
    const onGameJoined = vi.fn()
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url.endsWith('/api/games')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({ games: [{ id: 'g1', preset: 'quick', creator: creator() }] }),
        })
      }
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            id: 'g1',
            preset: 'quick',
            status: 'placing',
            creator_id: 'creator-1',
            joiner_id: 'me',
          }),
      })
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<LobbyScreen playerId="me" playerName="Me" onGameJoined={onGameJoined} />)
    const joinBtn = await screen.findByRole('button', { name: 'Join' })
    await user.click(joinBtn)

    await waitFor(() => {
      expect(onGameJoined).toHaveBeenCalledWith('g1', 'quick')
    })
  })
})
