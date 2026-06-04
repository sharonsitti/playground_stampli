import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { GameOverScreen } from '../src/components/GameOverScreen'

afterEach(cleanup)

const winner = { id: 'w', name: 'Alice', games_played: 4, wins: 3, losses: 1, win_rate: 0.75 }
const loser = { id: 'l', name: 'Bob', games_played: 4, wins: 1, losses: 3, win_rate: 0.25 }

function renderScreen(playerId: string) {
  const onReturnToLobby = vi.fn()
  render(
    <GameOverScreen
      playerId={playerId}
      winnerId="w"
      loserId="l"
      winner={winner}
      loser={loser}
      onReturnToLobby={onReturnToLobby}
    />,
  )
  return { onReturnToLobby }
}

describe('F8 AC2 — game over result screen', () => {
  it('shows the winner banner and subtitle to the winning player', () => {
    renderScreen('w')
    expect(screen.getByRole('heading', { name: 'You won!' })).toBeInTheDocument()
    expect(screen.getByText("All of Bob's ships are sunk")).toBeInTheDocument()
  })

  it('shows the loser banner and subtitle to the losing player', () => {
    renderScreen('l')
    expect(screen.getByRole('heading', { name: 'You lost' })).toBeInTheDocument()
    expect(screen.getByText('Alice sunk your fleet')).toBeInTheDocument()
  })

  it('renders updated wins, losses and win rate for both players', () => {
    renderScreen('w')
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
    expect(screen.getByText('75%')).toBeInTheDocument()
    expect(screen.getByText('25%')).toBeInTheDocument()
  })

  it('shows 0% win rate when the player has played no games', () => {
    render(
      <GameOverScreen
        playerId="w"
        winnerId="w"
        loserId="l"
        winner={{ ...winner, games_played: 0, wins: 0, win_rate: 0 }}
        loser={loser}
        onReturnToLobby={vi.fn()}
      />,
    )
    expect(screen.getByText('0%')).toBeInTheDocument()
  })

  it('AC5: Return to lobby button invokes the callback', async () => {
    const user = userEvent.setup()
    const { onReturnToLobby } = renderScreen('l')
    await user.click(screen.getByRole('button', { name: /return to lobby/i }))
    expect(onReturnToLobby).toHaveBeenCalledTimes(1)
  })
})
