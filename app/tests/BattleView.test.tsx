import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'

import { BattleBanner } from '../src/views/battle/BattleBanner'
import { TargetingGrid } from '../src/views/battle/TargetingGrid'

afterEach(() => {
  cleanup()
})

// F6 AC3: a prominent banner shows "Your turn" when it is the player's turn
test('BattleBanner shows "Your Turn" when isMyTurn is true', () => {
  render(<BattleBanner isMyTurn={true} gameOver={false} secondsRemaining={30} />)
  expect(screen.getByText(/your turn/i)).toBeInTheDocument()
  expect(screen.queryByText(/waiting for opponent/i)).not.toBeInTheDocument()
})

// F6 AC3: the banner shows "Waiting for opponent..." when it is not the player's turn
test('BattleBanner shows "Waiting for opponent" when isMyTurn is false', () => {
  render(<BattleBanner isMyTurn={false} gameOver={false} secondsRemaining={30} />)
  expect(screen.getByText(/waiting for opponent/i)).toBeInTheDocument()
  expect(screen.queryByText(/your turn/i)).not.toBeInTheDocument()
})

// F6 AC5 / NF1 AC3: the targeting grid is non-interactive when it is not the player's turn
test('TargetingGrid cells are non-interactive when interactive is false', () => {
  const onFire = vi.fn()
  render(<TargetingGrid myShots={[]} sunkOpponentShips={[]} interactive={false} onFire={onFire} />)
  const cells = screen.getAllByRole('gridcell')
  expect(cells).toHaveLength(100)
  for (const cell of cells) {
    expect(cell).toBeDisabled()
  }
})
