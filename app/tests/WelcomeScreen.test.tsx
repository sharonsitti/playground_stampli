import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import App from '../src/App'
import { WelcomeScreen } from '../src/components/WelcomeScreen'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  sessionStorage.clear()
  localStorage.clear()
})

beforeEach(() => {
  sessionStorage.clear()
  localStorage.clear()
})

describe('F1 AC2/AC3 — Play button gating on non-whitespace input', () => {
  it('AC3: Play is disabled on empty, stays disabled for whitespace-only, enables on a real character', async () => {
    const user = userEvent.setup()
    render(<WelcomeScreen onPlayerRegistered={vi.fn()} />)

    const input = screen.getByRole('textbox', { name: /name/i })
    const play = screen.getByRole('button', { name: /play/i })

    expect(play).toBeDisabled()

    await user.type(input, '   ')
    expect(play).toBeDisabled()

    await user.type(input, 'A')
    expect(play).toBeEnabled()
  })
})

describe('F1 AC4/AC5 — Submit persists identity and advances to lobby', () => {
  it('AC4/AC5: trims the name, stores id+name in sessionStorage (not localStorage), and navigates to lobby', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn((url: string, _init?: RequestInit) => {
      const body = url.endsWith('/api/games')
        ? { games: [] }
        : { id: 'player-123', name: 'Alice', games_played: 0, wins: 0, losses: 0, win_rate: 0 }
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) })
    })
    vi.stubGlobal('fetch', fetchMock)

    vi.stubGlobal(
      'EventSource',
      class {
        addEventListener() {}
        close() {}
      },
    )

    render(<App />)

    const input = screen.getByRole('textbox', { name: /name/i })
    await user.type(input, '  Alice  ')
    await user.click(screen.getByRole('button', { name: /play/i }))

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'Lobby' })).toBeInTheDocument()
    })

    const playersCall = fetchMock.mock.calls.find(
      ([url]) => url === 'http://localhost:8000/api/players',
    )
    expect(playersCall).toBeDefined()
    const init = playersCall?.[1]
    expect(init?.method).toBe('POST')
    expect(JSON.parse(init?.body as string)).toEqual({ name: 'Alice' })

    expect(sessionStorage.getItem('playerId')).toBe('player-123')
    expect(sessionStorage.getItem('playerName')).toBe('Alice')
    expect(localStorage.length).toBe(0)

    expect(screen.queryByRole('textbox', { name: /name/i })).not.toBeInTheDocument()
  })
})

describe('F1 AC1 — Welcome screen always shown on load', () => {
  it('AC1: renders the welcome screen even when sessionStorage already holds a player identity', () => {
    sessionStorage.setItem('playerId', 'returning-player')
    sessionStorage.setItem('playerName', 'Bob')

    render(<App />)

    expect(screen.getByRole('heading', { level: 1, name: 'BATTLESHIP' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /name/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument()
    expect(screen.queryByText('Lobby — coming soon')).not.toBeInTheDocument()
  })
})
