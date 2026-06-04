import '@testing-library/jest-dom/vitest'
import { act, cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { PlacementScreen } from '../src/components/PlacementScreen'
import type { PlacedShip } from '../src/components/placement/types'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

function renderScreen(preset: 'quick' | 'casual' = 'quick') {
  vi.stubGlobal(
    'EventSource',
    class {
      addEventListener() {}
      close() {}
    },
  )
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve({ ok: true }) }),
  )

  const onReady = vi.fn()
  const onBattleStart = vi.fn()
  const onPlacementExpired = vi.fn()
  render(
    <PlacementScreen
      gameId="g1"
      playerId="p1"
      preset={preset}
      onReady={onReady}
      onBattleStart={onBattleStart}
      onPlacementExpired={onPlacementExpired}
    />,
  )
  return { onReady, onBattleStart, onPlacementExpired }
}

describe('F4/F5 — placement screen', () => {
  it('renders one 10x10 grid, the full palette, and a preset-based timer', () => {
    renderScreen('casual')
    expect(screen.getByRole('grid', { name: /fleet grid/i })).toBeInTheDocument()
    expect(screen.getAllByRole('gridcell')).toHaveLength(100)
    expect(screen.getByText('Carrier')).toBeInTheDocument()
    expect(screen.getByText('Destroyer')).toBeInTheDocument()
    expect(screen.getByLabelText('Time remaining')).toHaveTextContent('1:00')
  })

  it('F5 AC3: ready button starts Unready/disabled with helper text', () => {
    renderScreen()
    const ready = screen.getByRole('button', { name: /i.m ready/i })
    expect(ready).toBeDisabled()
    expect(screen.getByText('Place all 5 ships to continue')).toBeInTheDocument()
  })

  it('F4 AC2/AC4: selecting a ship and clicking a valid cell places it and removes it from the palette', async () => {
    const user = userEvent.setup()
    renderScreen()

    await user.click(screen.getByText('Carrier'))
    const a1 = screen.getByRole('gridcell', { name: 'a1' })
    await user.click(a1)

    expect(screen.queryByText('Carrier')).not.toBeInTheDocument()
  })

  it('F4 AC4: clicking an out-of-bounds (invalid) position is a no-op', async () => {
    const user = userEvent.setup()
    renderScreen()

    await user.click(screen.getByText('Carrier'))
    await user.click(screen.getByRole('gridcell', { name: 'h1' }))

    expect(screen.getByText('Carrier')).toBeInTheDocument()
  })

  it('F4 AC7: Reset restores the full palette', async () => {
    const user = userEvent.setup()
    renderScreen()

    await user.click(screen.getByText('Destroyer'))
    await user.click(screen.getByRole('gridcell', { name: 'a1' }))
    expect(screen.queryByText('Destroyer')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Reset' }))
    expect(screen.getByText('Destroyer')).toBeInTheDocument()
  })

  it('F4 AC6: clicking a placed ship picks it back up INTO THE CURSOR — slot returns and a fresh click re-places it', async () => {
    const user = userEvent.setup()
    renderScreen()

    await user.click(screen.getByText('Carrier'))
    await user.click(screen.getByRole('gridcell', { name: 'a1' }))
    await user.click(screen.getByText('Destroyer'))
    await user.click(screen.getByRole('gridcell', { name: 'a10' }))

    expect(screen.queryByText('Carrier')).not.toBeInTheDocument()
    expect(screen.queryByText('Destroyer')).not.toBeInTheDocument()

    // Pick Carrier back up by clicking its origin cell on the grid.
    await user.click(screen.getByRole('gridcell', { name: 'a1' }))

    // (a) Its palette slot reappears; Destroyer stays placed (only Carrier picked up).
    expect(screen.getByText('Carrier')).toBeInTheDocument()
    expect(screen.queryByText('Destroyer')).not.toBeInTheDocument()

    // (b) It is HELD in the cursor (the AC6 ≠ AC7 distinction): a fresh click on a
    // different valid cell re-places it WITHOUT re-selecting from the palette, so
    // the slot disappears again. Reset would leave nothing held and do nothing here.
    await user.click(screen.getByRole('gridcell', { name: 'a5' }))
    expect(screen.queryByText('Carrier')).not.toBeInTheDocument()
    expect(screen.queryByText('Destroyer')).not.toBeInTheDocument()
  })
})

describe('F4/F5 — placement screen: rotation, ready, and encoding', () => {
  it('F4 AC5: pressing R toggles the rotation hint', async () => {
    const user = userEvent.setup()
    renderScreen()

    await user.click(screen.getByText('Carrier'))
    expect(screen.getByText(/horizontal/i)).toBeInTheDocument()

    await user.keyboard('r')
    expect(screen.getByText(/vertical/i)).toBeInTheDocument()
  })

  it('F5 AC3: placing all 5 ships enables the green Ready button; clicking it locks and calls onReady', async () => {
    const user = userEvent.setup()
    const { onReady } = renderScreen()

    const origins: Record<string, string> = {
      Carrier: 'a1',
      Battleship: 'a3',
      Cruiser: 'a5',
      Submarine: 'a7',
      Destroyer: 'a9',
    }
    for (const [label, cell] of Object.entries(origins)) {
      await user.click(screen.getByText(label))
      await user.click(screen.getByRole('gridcell', { name: cell }))
    }

    const ready = screen.getByRole('button', { name: /i.m ready/i })
    expect(ready).toBeEnabled()
    expect(within(ready).getByText(/✓/)).toBeInTheDocument()

    await user.click(ready)
    expect(onReady).toHaveBeenCalledTimes(1)
    expect(onReady.mock.calls[0]?.[0]).toHaveLength(5)
    expect(ready).toBeDisabled()
  })

  it('F5 AC4/AC3: the Locked state disables Reset + all grid cells and drops the ✓ and helper text', async () => {
    const user = userEvent.setup()
    renderScreen()

    const origins: Record<string, string> = {
      Carrier: 'a1',
      Battleship: 'a3',
      Cruiser: 'a5',
      Submarine: 'a7',
      Destroyer: 'a9',
    }
    for (const [label, cell] of Object.entries(origins)) {
      await user.click(screen.getByText(label))
      await user.click(screen.getByRole('gridcell', { name: cell }))
    }

    await user.click(screen.getByRole('button', { name: /i.m ready/i }))

    expect(screen.getByRole('button', { name: /reset/i })).toBeDisabled()
    expect(screen.getAllByRole('gridcell')[0]).toBeDisabled()
    expect(screen.queryByText(/✓/)).not.toBeInTheDocument()
    expect(screen.queryByText(/place all 5 ships/i)).not.toBeInTheDocument()
  })

  it('F4 AC1: column letters map to integers a→0 … j→9 in the onReady payload', async () => {
    const user = userEvent.setup()
    const { onReady } = renderScreen()

    await user.keyboard('r')

    const placements: { label: string; cell: string; col: string; expectedCol: number }[] = [
      { label: 'Carrier', cell: 'a1', col: 'a', expectedCol: 0 },
      { label: 'Battleship', cell: 'c1', col: 'c', expectedCol: 2 },
      { label: 'Cruiser', cell: 'e1', col: 'e', expectedCol: 4 },
      { label: 'Submarine', cell: 'g1', col: 'g', expectedCol: 6 },
      { label: 'Destroyer', cell: 'j1', col: 'j', expectedCol: 9 },
    ]

    for (const { label, cell } of placements) {
      await user.click(screen.getByText(label))
      await user.click(screen.getByRole('gridcell', { name: cell }))
    }

    await user.click(screen.getByRole('button', { name: /i.m ready/i }))

    const ships = onReady.mock.calls[0]?.[0] as PlacedShip[]
    for (const { label, expectedCol } of placements) {
      const ship = ships.find((s) => s.type === label.toLowerCase())
      expect(ship?.origin_col).toBe(expectedCol)
      expect(ship?.origin_row).toBe(1)
    }
  })
})

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

function renderWithStream(preset: 'quick' | 'casual' = 'quick') {
  FakeEventSource.instances = []
  vi.stubGlobal('EventSource', FakeEventSource)
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve({ ok: true }) }),
  )
  const onBattleStart = vi.fn()
  const onPlacementExpired = vi.fn()
  render(
    <PlacementScreen
      gameId="g1"
      playerId="p1"
      preset={preset}
      onReady={vi.fn()}
      onBattleStart={onBattleStart}
      onPlacementExpired={onPlacementExpired}
    />,
  )
  return { onBattleStart, onPlacementExpired, stream: () => FakeEventSource.instances[0] }
}

describe('F5/NF2 — SSE-driven timer and phase transitions', () => {
  it('F5 AC2/NF2: timer_tick replaces the fallback timer with the server value (M:SS)', () => {
    const { stream } = renderWithStream('quick')
    expect(screen.getByLabelText('Time remaining')).toHaveTextContent('0:30')
    act(() => {
      stream()?.emit('timer_tick', { seconds_remaining: 7 })
    })
    expect(screen.getByLabelText('Time remaining')).toHaveTextContent('0:07')
  })

  it('F5 AC5: battle_start navigates with the current_turn from the SSE payload', () => {
    const { onBattleStart, stream } = renderWithStream()
    act(() => {
      stream()?.emit('battle_start', { current_turn: 'p1', timer_seconds: 30 })
    })
    expect(onBattleStart).toHaveBeenCalledWith('p1')
  })

  it('F5 AC6: placement_expired fires the return-to-lobby callback', () => {
    const { onPlacementExpired, stream } = renderWithStream()
    act(() => {
      stream()?.emit('placement_expired', {})
    })
    expect(onPlacementExpired).toHaveBeenCalledTimes(1)
  })
})
