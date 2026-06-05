import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest'

import App from '@/App'

const PLAYER_STORAGE_KEY = 'battleship.player'

function mockFetchOk(player: { id: string; name: string }): Mock<typeof fetch> {
  const fetchMock = vi.fn<typeof fetch>().mockResolvedValue({
    ok: true,
    json: () =>
      Promise.resolve({
        games_played: 0,
        wins: 0,
        losses: 0,
        win_rate: 0,
        ...player,
      }),
  } as Response)
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

beforeEach(() => {
  sessionStorage.clear()
  localStorage.clear()
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('App registration flow', () => {
  it('shows the welcome screen even when a prior player exists in sessionStorage — no auto-skip (F1 AC1)', () => {
    sessionStorage.setItem(
      PLAYER_STORAGE_KEY,
      JSON.stringify({ id: 'returning-id', name: 'Grace' }),
    )

    render(<App />)

    expect(screen.getByLabelText('Player name')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument()
  })

  it('stores the returned id and name in sessionStorage (not localStorage) on register (F1 AC4)', async () => {
    const user = userEvent.setup()
    mockFetchOk({ id: 'server-id-123', name: 'Ada' })

    render(<App />)

    await user.type(screen.getByLabelText('Player name'), 'Ada')
    await user.click(screen.getByRole('button', { name: /play/i }))

    await waitFor(() => {
      expect(sessionStorage.getItem(PLAYER_STORAGE_KEY)).not.toBeNull()
    })

    const stored: unknown = JSON.parse(sessionStorage.getItem(PLAYER_STORAGE_KEY) ?? 'null')
    expect(stored).toEqual({ id: 'server-id-123', name: 'Ada' })
    expect(localStorage.getItem(PLAYER_STORAGE_KEY)).toBeNull()
  })
})
