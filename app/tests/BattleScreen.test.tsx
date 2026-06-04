import '@testing-library/jest-dom/vitest'
import { act, cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { BattleScreen } from '../src/components/BattleScreen'
import type { PlacedShip } from '../src/components/placement/types'

type Listener = (event: MessageEvent<string>) => void

class FakeEventSource {
  static instances: FakeEventSource[] = []
  listeners = new Map<string, Listener>()
  constructor() {
    FakeEventSource.instances.push(this)
  }
  addEventListener(type: string, listener: Listener) {
    this.listeners.set(type, listener)
  }
  close() {}
  emit(type: string, data: unknown) {
    this.listeners.get(type)?.({ data: JSON.stringify(data) } as MessageEvent<string>)
  }
}

const OWN_SHIPS: PlacedShip[] = [
  { type: 'carrier', orientation: 'H', origin_col: 0, origin_row: 1 },
]

function mockFetchOk() {
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({}) })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function renderBattle(currentTurn: string) {
  const onGameOver = vi.fn()
  render(
    <BattleScreen
      gameId="g1"
      playerId="me"
      playerName="Me"
      preset="quick"
      placedShips={OWN_SHIPS}
      currentTurn={currentTurn}
      onGameOver={onGameOver}
    />,
  )
  const stream = () => FakeEventSource.instances[0]
  return { onGameOver, stream }
}

beforeEach(() => {
  FakeEventSource.instances = []
  vi.stubGlobal('EventSource', FakeEventSource)
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('F6 — battle turn mechanics', () => {
  it('F6 AC1: renders both the fleet grid and the targeting grid', () => {
    mockFetchOk()
    renderBattle('me')
    expect(screen.getByRole('grid', { name: 'Fleet grid' })).toBeInTheDocument()
    expect(screen.getByRole('grid', { name: 'Targeting grid' })).toBeInTheDocument()
  })

  it('F6 AC3: banner shows "Your turn" when it is my turn, with a countdown', () => {
    mockFetchOk()
    renderBattle('me')
    expect(screen.getByText('Your turn')).toBeInTheDocument()
    expect(screen.getByLabelText('Time remaining')).toHaveTextContent('0:30')
  })

  it('F6 AC5: targeting cells are non-interactive when waiting for the opponent', () => {
    mockFetchOk()
    renderBattle('them')
    expect(screen.getByText('Waiting for opponent…')).toBeInTheDocument()
    const targeting = screen.getByRole('grid', { name: 'Targeting grid' })
    const cells = targeting.querySelectorAll('[role="gridcell"]')
    cells.forEach((cell) => {
      expect(cell).toBeDisabled()
    })
  })

  it('F6 AC4: firing a shot on my turn POSTs to /shot and blocks further clicks until shot_fired', async () => {
    const fetchMock = mockFetchOk()
    const user = userEvent.setup()
    const { stream } = renderBattle('me')

    const targeting = screen.getByRole('grid', { name: 'Targeting grid' })
    const cell = targeting.querySelector('[aria-label="c3"]') as HTMLButtonElement
    await user.click(cell)

    const shotCall = fetchMock.mock.calls.find(([u]) => String(u).includes('/shot'))
    expect(shotCall).toBeDefined()
    const init = shotCall?.[1] as RequestInit
    expect(JSON.parse(init.body as string)).toEqual({ player_id: 'me', col: 2, row: 3 })

    // Blocked until SSE confirms: every targeting cell disabled while pending
    targeting.querySelectorAll('[role="gridcell"]').forEach((c) => {
      expect(c).toBeDisabled()
    })

    act(() => {
      stream()?.emit('shot_fired', {
        shooter_id: 'me',
        col: 2,
        row: 3,
        hit: false,
        sunk: false,
        ship_type: null,
        ship_cells: null,
        next_turn: 'them',
      })
    })
    expect(screen.getByText('Waiting for opponent…')).toBeInTheDocument()
  })
})

describe('F7 — shot results and notifications', () => {
  it('F7 AC4: incoming opponent hit shows on my fleet grid in real time', () => {
    mockFetchOk()
    const { stream } = renderBattle('them')
    act(() => {
      stream()?.emit('shot_fired', {
        shooter_id: 'them',
        col: 0,
        row: 1,
        hit: true,
        sunk: false,
        ship_type: null,
        ship_cells: null,
        next_turn: 'me',
      })
    })
    const fleet = screen.getByRole('grid', { name: 'Fleet grid' })
    const cell = fleet.querySelector('[aria-label="a1"]')
    expect(cell?.className).toContain('bg-red-500/80')
    expect(screen.getByText('Your turn')).toBeInTheDocument()
  })

  it('F7 AC3: a sunk ship shows a "[Ship] sunk!" notification', () => {
    mockFetchOk()
    const { stream } = renderBattle('me')
    act(() => {
      stream()?.emit('shot_fired', {
        shooter_id: 'me',
        col: 5,
        row: 5,
        hit: true,
        sunk: true,
        ship_type: 'destroyer',
        ship_cells: [
          { col: 5, row: 5 },
          { col: 6, row: 5 },
        ],
        next_turn: 'them',
      })
    })
    expect(screen.getByText('destroyer sunk!')).toBeInTheDocument()
  })

  it('F7 AC5: turn_expired shows a turn-skipped notification and passes the turn', () => {
    mockFetchOk()
    const { stream } = renderBattle('them')
    act(() => {
      stream()?.emit('turn_expired', { player_id: 'them', next_turn: 'me' })
    })
    expect(screen.getByText(/ran out of time — turn skipped/)).toBeInTheDocument()
    expect(screen.getByText('Your turn')).toBeInTheDocument()
  })

  it('NF2: timer_tick updates the countdown', () => {
    mockFetchOk()
    const { stream } = renderBattle('me')
    act(() => {
      stream()?.emit('timer_tick', { seconds_remaining: 9 })
    })
    expect(screen.getByLabelText('Time remaining')).toHaveTextContent('0:09')
  })

  it('PR5 freeze: game_over fires onGameOver and freezes the targeting grid', () => {
    mockFetchOk()
    const { stream, onGameOver } = renderBattle('me')
    const winnerStats = {
      id: 'me',
      name: 'Alice',
      games_played: 1,
      wins: 1,
      losses: 0,
      win_rate: 1,
    }
    const loserStats = { id: 'them', name: 'Bob', games_played: 1, wins: 0, losses: 1, win_rate: 0 }
    act(() => {
      stream()?.emit('game_over', {
        winner_id: 'me',
        loser_id: 'them',
        winner: winnerStats,
        loser: loserStats,
      })
    })
    expect(onGameOver).toHaveBeenCalledWith('me', 'them', winnerStats, loserStats)
    const targeting = screen.getByRole('grid', { name: 'Targeting grid' })
    targeting.querySelectorAll('[role="gridcell"]').forEach((c) => {
      expect(c).toBeDisabled()
    })
  })
})
