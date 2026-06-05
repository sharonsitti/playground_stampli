import '@testing-library/jest-dom/vitest'
import { useEffect } from 'react'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { PlacementGrid } from '@/components/PlacementGrid'
import { ReadyButton } from '@/components/ReadyButton'
import { ShipPalette } from '@/components/ShipPalette'
import { usePlacement } from '@/hooks/usePlacement'

// Contract under test: docs/spec.md F4 AC1–7 (ship placement interaction) and F5 AC3(a)
// (the "Unready" helper text). The placement interaction is fully client-side (KDD #3) and lives
// in usePlacement + PlacementGrid + ShipPalette + ReadyButton — none of which touch SSE. This
// harness wires them exactly as PlacementScreen does (placement, locked={false}) plus the same
// window R-key listener, so F4 stays independent of the PR 4 SSE/timer machinery in PlacementScreen.

function PlacementHarness() {
  const placement = usePlacement()
  const { rotate } = placement
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'r' || e.key === 'R') rotate()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [rotate])
  return (
    <div>
      <PlacementGrid placement={placement} locked={false} />
      <ShipPalette placement={placement} locked={false} />
    </div>
  )
}

const SHIP_NAMES = ['Carrier', 'Battleship', 'Cruiser', 'Submarine', 'Destroyer'] as const

// A palette ship button's accessible name is the ship label plus its size span (e.g. "Carrier 5"),
// so match on the leading ship word. Grid cells are named by coordinate (e.g. "a1"), so this never
// collides with the grid.
function selectShip(user: ReturnType<typeof userEvent.setup>, name: string) {
  return user.click(screen.getByRole('button', { name: new RegExp(`^${name}\\b`) }))
}

function paletteShip(name: string) {
  return screen.queryByRole('button', { name: new RegExp(`^${name}\\b`) })
}

function cell(label: string): HTMLElement {
  return screen.getByRole('gridcell', { name: label })
}

// 'valid' green = bg-[#BBF7D0], 'invalid' red = bg-[#FECACA], 'ship' = bg-[#BFDBFE] (GridCell visuals).
// Per team-lead: F4 AC4 green/red is conveyed only by background class; assert the class as the
// only available hook — this checks a visual convention, not a semantic contract.
const SHIP_CLASS = 'bg-[#BFDBFE]'

afterEach(() => {
  cleanup()
})

describe('Ship placement — interaction (F4)', () => {
  it('H1: placing a ship removes its slot from the palette entirely (F4 AC3)', async () => {
    const user = userEvent.setup()
    render(<PlacementHarness />)
    expect(paletteShip('Carrier')).toBeInTheDocument()

    await selectShip(user, 'Carrier')
    await user.click(cell('a1'))

    expect(paletteShip('Carrier')).not.toBeInTheDocument()
  })

  it('H2: renders a 10×10 grid labeled a–j / 1–10 (F4 AC1)', () => {
    render(<PlacementHarness />)
    expect(screen.getByRole('grid', { name: 'Fleet grid' })).toBeInTheDocument()
    expect(screen.getAllByRole('gridcell')).toHaveLength(100)
    // Corners pin the a=0..j=9 / row 1..10 encoding the whole shot API depends on.
    for (const label of ['a1', 'j1', 'a10', 'j10']) {
      expect(cell(label)).toBeInTheDocument()
    }
  })

  it('H3: clicking a placed ship on the grid picks it back up — its palette slot returns (F4 AC6)', async () => {
    const user = userEvent.setup()
    render(<PlacementHarness />)

    await selectShip(user, 'Destroyer')
    await user.click(cell('a1'))
    expect(paletteShip('Destroyer')).not.toBeInTheDocument()

    await user.click(cell('a1'))
    expect(paletteShip('Destroyer')).toBeInTheDocument()
  })

  it('H4: Reset clears all placed ships and repopulates the full palette (F4 AC7)', async () => {
    const user = userEvent.setup()
    render(<PlacementHarness />)

    await selectShip(user, 'Destroyer')
    await user.click(cell('a1'))
    await selectShip(user, 'Cruiser')
    await user.click(cell('a3'))
    expect(paletteShip('Destroyer')).not.toBeInTheDocument()
    expect(paletteShip('Cruiser')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Reset' }))

    for (const name of SHIP_NAMES) {
      expect(paletteShip(name)).toBeInTheDocument()
    }
  })

  it('H6: pressing R toggles orientation so the placed footprint becomes vertical (F4 AC5)', async () => {
    const user = userEvent.setup()
    render(<PlacementHarness />)

    // Destroyer is 2 cells. H from a1 = a1,b1 (across a row). After R, V from a1 = a1,a2 (down a column).
    await selectShip(user, 'Destroyer')
    await user.keyboard('r')
    await user.click(cell('a1'))

    expect(cell('a1')).toHaveClass(SHIP_CLASS)
    expect(cell('a2')).toHaveClass(SHIP_CLASS) // vertical neighbor occupied
    expect(cell('b1')).not.toHaveClass(SHIP_CLASS) // horizontal neighbor NOT occupied
  })

  it('U1: clicking an overlapping cell is a no-op — the ship stays on the cursor and the palette is unchanged (F4 AC4)', async () => {
    const user = userEvent.setup()
    render(<PlacementHarness />)

    await selectShip(user, 'Carrier')
    await user.click(cell('a1')) // Carrier H occupies a1..e1
    expect(paletteShip('Carrier')).not.toBeInTheDocument()

    await selectShip(user, 'Battleship')
    await user.click(cell('a1')) // overlaps the Carrier — invalid

    // Battleship was not placed: still in the palette.
    expect(paletteShip('Battleship')).toBeInTheDocument()
  })

  it('U2: an out-of-bounds placement is blocked (F4 AC4 — must fit in bounds)', async () => {
    const user = userEvent.setup()
    render(<PlacementHarness />)

    // Carrier is 5 cells, H. From i1 it would span i1,j1,k1,l1,m1 — k/l/m are off the 10-wide grid.
    await selectShip(user, 'Carrier')
    await user.click(cell('i1'))

    expect(paletteShip('Carrier')).toBeInTheDocument() // not placed
    expect(cell('i1')).not.toHaveClass(SHIP_CLASS)
  })

  it('U3: ships may touch — an adjacent (non-overlapping) placement succeeds (F4 AC4: "ships may touch")', async () => {
    const user = userEvent.setup()
    render(<PlacementHarness />)

    await selectShip(user, 'Destroyer')
    await user.click(cell('a1')) // Destroyer H occupies a1,b1
    expect(paletteShip('Destroyer')).not.toBeInTheDocument()

    await selectShip(user, 'Cruiser')
    await user.click(cell('a2')) // Cruiser H occupies a2,b2,c2 — directly touches the Destroyer, no overlap

    expect(paletteShip('Cruiser')).not.toBeInTheDocument() // placement succeeded
    expect(cell('a2')).toHaveClass(SHIP_CLASS)
  })

  it('U4: a placed cell shows the occupied (ship) visual, not empty (F4 AC2/AC4 state integrity)', async () => {
    const user = userEvent.setup()
    render(<PlacementHarness />)

    expect(cell('a1')).not.toHaveClass(SHIP_CLASS)
    await selectShip(user, 'Destroyer')
    await user.click(cell('a1'))

    expect(cell('a1')).toHaveClass(SHIP_CLASS)
  })

  it('U5: clicking an empty cell with no ship selected is a no-op (F4 AC2 — selection required first)', async () => {
    const user = userEvent.setup()
    render(<PlacementHarness />)

    await user.click(cell('a1')) // nothing selected

    expect(cell('a1')).not.toHaveClass(SHIP_CLASS)
    for (const name of SHIP_NAMES) {
      expect(paletteShip(name)).toBeInTheDocument() // palette intact
    }
  })
})

describe('Ship placement — ready gate (F5 AC3(a))', () => {
  it('H5: the "I\'m ready!" button is disabled with the helper text "Place all 5 ships to continue" while unready (F5 AC3(a))', () => {
    render(<ReadyButton state="unready" onReady={() => undefined} />)

    expect(screen.getByRole('button', { name: /i'm ready!/i })).toBeDisabled()
    expect(screen.getByText('Place all 5 ships to continue')).toBeInTheDocument()
  })
})
