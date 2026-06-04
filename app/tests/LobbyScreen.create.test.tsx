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

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  FakeEventSource.instances = []
})

beforeEach(() => {
  vi.stubGlobal('EventSource', FakeEventSource)
})

describe('F3 — create, hold, cancel', () => {
  it('F3 AC1/AC2: Create opens modal (Quick pre-selected), confirm enters holding state', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url.endsWith('/api/games')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              games: [],
              id: 'new-game',
              preset: 'quick',
              status: 'waiting',
              creator_id: 'me',
            }),
        })
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<LobbyScreen playerId="me" playerName="Me" onGameJoined={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: 'Create Game' }))

    const quick = screen.getByRole('radio', { name: /quick/i })
    expect(quick).toHaveAttribute('aria-checked', 'true')

    await user.click(screen.getByRole('button', { name: 'Create' }))
    expect(await screen.findByText('Waiting for opponent…')).toBeInTheDocument()
  })

  it('F3 AC5: player_joined while holding navigates to placement', async () => {
    const onGameJoined = vi.fn()
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          games: [],
          id: 'new-game',
          preset: 'casual',
          status: 'waiting',
          creator_id: 'me',
        }),
    })
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()

    render(<LobbyScreen playerId="me" playerName="Me" onGameJoined={onGameJoined} />)
    await user.click(screen.getByRole('button', { name: 'Create Game' }))
    await user.click(screen.getByRole('button', { name: 'Create' }))
    await screen.findByText('Waiting for opponent…')

    const gameStream = FakeEventSource.instances.find((s) => s.url.includes('/new-game/events'))
    expect(gameStream).toBeDefined()
    gameStream?.emit('player_joined', { joiner: { id: 'p2', name: 'Bo' }, timer_seconds: 60 })

    await waitFor(() => {
      expect(onGameJoined).toHaveBeenCalledWith('new-game', 'casual')
    })
  })

  it('F3 AC5: Cancel deletes the game and returns to the browse list', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          games: [],
          id: 'new-game',
          preset: 'quick',
          status: 'waiting',
          creator_id: 'me',
          ok: true,
        }),
    })
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()

    render(<LobbyScreen playerId="me" playerName="Me" onGameJoined={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: 'Create Game' }))
    await user.click(screen.getByRole('button', { name: 'Create' }))
    const holding = await screen.findByText('Waiting for opponent…')
    expect(holding).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    await waitFor(() => {
      expect(screen.queryByText('Waiting for opponent…')).not.toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: 'Create Game' })).toBeInTheDocument()
  })

  it('NF1 AC2: a 409 on join is discarded — no navigation', async () => {
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
        ok: false,
        status: 409,
        json: () => Promise.resolve({ error: 'stale' }),
      })
    })
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()

    render(<LobbyScreen playerId="me" playerName="Me" onGameJoined={onGameJoined} />)
    const joinBtn = await screen.findByRole('button', { name: 'Join' })
    await user.click(joinBtn)

    await waitFor(() => {
      expect(fetchMock.mock.calls.some(([u]) => String(u).includes('/join'))).toBe(true)
    })
    expect(onGameJoined).not.toHaveBeenCalled()
  })
})

describe('GameList row content', () => {
  it('shows 0% win rate when games_played is 0', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          games: [
            {
              id: 'g1',
              preset: 'casual',
              creator: creator({ games_played: 0, wins: 0, losses: 0, win_rate: 0 }),
            },
          ],
        }),
    })
    vi.stubGlobal('fetch', fetchMock)
    const { within: localWithin } = await import('@testing-library/react')
    render(<LobbyScreen playerId="me" playerName="Me" onGameJoined={vi.fn()} />)
    const row = await screen.findByText('Zoe')
    const li = row.closest('li')
    expect(li).not.toBeNull()
    if (li) expect(localWithin(li).getByText(/0% win rate/)).toBeInTheDocument()
  })
})
