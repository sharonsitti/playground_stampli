import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { LobbyScreen } from '../src/components/LobbyScreen'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

beforeEach(() => {
  vi.stubGlobal(
    'EventSource',
    class {
      addEventListener() {}
      close() {}
    },
  )
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve({ games: [] }) }),
  )
})

describe('F5 AC6 — placement-expired banner', () => {
  it('shows the timeout alert only when expiredMessage is set, and Dismiss clears it', async () => {
    const onDismissExpired = vi.fn()
    const user = userEvent.setup()
    const lobby = (expired: boolean) => (
      <LobbyScreen
        playerId="me"
        playerName="Me"
        expiredMessage={expired}
        onDismissExpired={onDismissExpired}
        onGameJoined={vi.fn()}
      />
    )

    const { rerender } = render(lobby(false))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()

    rerender(lobby(true))
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Game timed out — placement timer expired')

    await user.click(within(alert).getByRole('button', { name: 'Dismiss' }))
    expect(onDismissExpired).toHaveBeenCalledTimes(1)
  })
})
