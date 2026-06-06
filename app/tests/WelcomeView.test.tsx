import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { WelcomeView } from '../src/views/WelcomeView'

const playerRecord = {
  id: 'player-123',
  name: 'Alice',
  games_played: 0,
  wins: 0,
  losses: 0,
  win_rate: 0,
}

function mockFetchOk(record = playerRecord) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(record),
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

beforeEach(() => {
  vi.restoreAllMocks()
})

// F1 AC2: the welcome screen has a single text input for name and a "Play" button
test('renders a name input and a Play button', () => {
  render(<WelcomeView onRegistered={vi.fn()} />)
  expect(screen.getByLabelText('Your name')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument()
})

// F1 AC4: submitting creates/retrieves the player via POST /api/players with the trimmed name
test('clicking Play posts the trimmed name to /api/players exactly once', async () => {
  const user = userEvent.setup()
  const fetchMock = mockFetchOk()
  render(<WelcomeView onRegistered={vi.fn()} />)

  await user.type(screen.getByLabelText('Your name'), '  Alice  ')
  await user.click(screen.getByRole('button', { name: /play/i }))

  await waitFor(() => {
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
  const call = fetchMock.mock.calls[0] as [string, RequestInit]
  const url = call[0]
  const init = call[1]
  expect(url).toBe('http://localhost:8000/api/players')
  expect(init.method).toBe('POST')
  expect(JSON.parse(init.body as string)).toEqual({ name: 'Alice' })
})

// F1 AC4: the returned id and name are propagated to the caller (App stores them + navigates)
test('on success, onRegistered is called with the returned id and name', async () => {
  const user = userEvent.setup()
  mockFetchOk()
  const onRegistered = vi.fn()
  render(<WelcomeView onRegistered={onRegistered} />)

  await user.type(screen.getByLabelText('Your name'), 'Alice')
  await user.click(screen.getByRole('button', { name: /play/i }))

  await waitFor(() => {
    expect(onRegistered).toHaveBeenCalledWith({ id: 'player-123', name: 'Alice' })
  })
})

describe('Play button enablement (F1 AC3)', () => {
  // F1 AC3: "Play" is disabled until at least 1 non-whitespace character is entered
  test('Play is disabled when the input is empty', () => {
    render(<WelcomeView onRegistered={vi.fn()} />)
    expect(screen.getByRole('button', { name: /play/i })).toBeDisabled()
  })

  // F1 AC3: whitespace-only input does not count as a non-whitespace character
  test('Play is disabled when the input is whitespace only', async () => {
    const user = userEvent.setup()
    render(<WelcomeView onRegistered={vi.fn()} />)
    await user.type(screen.getByLabelText('Your name'), '   ')
    expect(screen.getByRole('button', { name: /play/i })).toBeDisabled()
  })

  // F1 AC3: one non-whitespace character enables Play
  test('Play is enabled once a non-whitespace character is entered', async () => {
    const user = userEvent.setup()
    render(<WelcomeView onRegistered={vi.fn()} />)
    await user.type(screen.getByLabelText('Your name'), 'A')
    expect(screen.getByRole('button', { name: /play/i })).toBeEnabled()
  })
})
