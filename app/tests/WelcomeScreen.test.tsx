import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest'

import { WelcomeScreen } from '@/components/WelcomeScreen'

function mockFetchOk(player: {
  id: string
  name: string
  games_played?: number
  wins?: number
  losses?: number
  win_rate?: number
}): Mock<typeof fetch> {
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

function mockFetchError(status: number, error: string): Mock<typeof fetch> {
  const fetchMock = vi.fn<typeof fetch>().mockResolvedValue({
    ok: false,
    status,
    json: () => Promise.resolve({ error }),
  } as Response)
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

beforeEach(() => {
  sessionStorage.clear()
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('WelcomeScreen — happy path', () => {
  it('renders a name input and a Play button (F1 AC2)', () => {
    render(<WelcomeScreen onRegistered={vi.fn()} />)
    expect(screen.getByLabelText('Player name')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument()
  })

  it('enables Play once a non-whitespace character is entered (F1 AC3)', async () => {
    const user = userEvent.setup()
    render(<WelcomeScreen onRegistered={vi.fn()} />)
    await user.type(screen.getByLabelText('Player name'), 'Ada')
    expect(screen.getByRole('button', { name: /play/i })).toBeEnabled()
  })

  it('submits the trimmed name to the players endpoint (F1 AC4)', async () => {
    const user = userEvent.setup()
    const fetchMock = mockFetchOk({ id: 'p1', name: 'Ada' })
    render(<WelcomeScreen onRegistered={vi.fn()} />)

    await user.type(screen.getByLabelText('Player name'), '  Ada  ')
    await user.click(screen.getByRole('button', { name: /play/i }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8000/api/players',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'Ada' }),
      }),
    )
  })

  it('calls onRegistered with the returned id and name on success (F1 AC4, AC5)', async () => {
    const user = userEvent.setup()
    mockFetchOk({ id: 'server-id-123', name: 'Grace' })
    const onRegistered = vi.fn()
    render(<WelcomeScreen onRegistered={onRegistered} />)

    await user.type(screen.getByLabelText('Player name'), 'Grace')
    await user.click(screen.getByRole('button', { name: /play/i }))

    await waitFor(() => {
      expect(onRegistered).toHaveBeenCalledWith({ id: 'server-id-123', name: 'Grace' })
    })
  })

  it('uses the id/name from the server response, not the typed input (F1 AC4)', async () => {
    const user = userEvent.setup()
    mockFetchOk({ id: 'canonical-id', name: 'Grace' })
    const onRegistered = vi.fn()
    render(<WelcomeScreen onRegistered={onRegistered} />)

    await user.type(screen.getByLabelText('Player name'), '  Grace  ')
    await user.click(screen.getByRole('button', { name: /play/i }))

    await waitFor(() => {
      expect(onRegistered).toHaveBeenCalledWith({ id: 'canonical-id', name: 'Grace' })
    })
  })
})

describe('WelcomeScreen — unhappy path', () => {
  it('disables Play when the input is empty (F1 AC3)', () => {
    render(<WelcomeScreen onRegistered={vi.fn()} />)
    expect(screen.getByRole('button', { name: /play/i })).toBeDisabled()
  })

  it('keeps Play disabled for whitespace-only input (F1 AC3)', async () => {
    const user = userEvent.setup()
    render(<WelcomeScreen onRegistered={vi.fn()} />)
    await user.type(screen.getByLabelText('Player name'), '   ')
    expect(screen.getByRole('button', { name: /play/i })).toBeDisabled()
  })

  it('surfaces the server error envelope and does not navigate (F1 AC4, NF4)', async () => {
    const user = userEvent.setup()
    mockFetchError(400, 'name is taken')
    const onRegistered = vi.fn()
    render(<WelcomeScreen onRegistered={onRegistered} />)

    await user.type(screen.getByLabelText('Player name'), 'Mallory')
    await user.click(screen.getByRole('button', { name: /play/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('name is taken')
    expect(onRegistered).not.toHaveBeenCalled()
  })
})
