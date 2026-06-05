import { useEffect } from 'react'
import { Check } from 'lucide-react'
import { PlacementGrid } from '@/components/PlacementGrid'
import { ShipPalette } from '@/components/ShipPalette'
import { usePlacement, type PlacedShip } from '@/hooks/usePlacement'

type PlacementScreenProps = {
  onReady: (ships: PlacedShip[]) => void
}

const INSTRUCTIONS: { action: string; rest: string }[] = [
  {
    action: 'Select',
    rest: 'Click a ship in the palette. It attaches to your cursor as a ghost preview.',
  },
  {
    action: 'Position',
    rest: 'Hover over the grid. The preview snaps cell-by-cell. Green = valid; red = invalid.',
  },
  {
    action: 'Rotate',
    rest: 'Press R to toggle horizontal / vertical. The preview updates instantly.',
  },
  { action: 'Place', rest: 'Click a green cell to drop the ship. Red cells are blocked.' },
  { action: 'Reposition', rest: 'Click a ship already on the grid to pick it back up.' },
  { action: 'Reset', rest: 'Clears all placed ships and refills the palette.' },
]

export function PlacementScreen({ onReady }: PlacementScreenProps) {
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
    <div className="flex min-h-screen flex-col bg-[#F5F6F8]">
      <div className="flex items-center justify-between border-b border-[#C7D2FE] bg-[#EEF2FF] px-5 py-2.5">
        <div className="flex items-center gap-2.5">
          <span className="rounded-full bg-[#EEF2FF] px-2 py-0.5 text-xs font-semibold tracking-wide text-[#4F46E5] uppercase ring-1 ring-[#C7D2FE]">
            Placement Phase
          </span>
          <span className="text-sm text-[#64748B]">
            Place all 5 ships on your grid before time runs out.
          </span>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-[960px] flex-col gap-6 px-6 py-8">
        <div className="flex gap-6">
          <div className="flex-1">
            <PlacementGrid placement={placement} />
          </div>
          <div className="flex flex-col gap-3">
            <ShipPalette placement={placement} />
            {placement.allPlaced ? (
              <button
                type="button"
                onClick={() => {
                  onReady(placement.placed)
                }}
                className="h-10 w-full rounded-lg bg-[#22C55E] text-sm font-semibold text-white"
              >
                <span className="inline-flex items-center justify-center gap-1.5">
                  <Check className="size-4" />
                  I&apos;m ready!
                </span>
              </button>
            ) : (
              <div>
                <button
                  type="button"
                  disabled
                  className="h-10 w-full cursor-not-allowed rounded-lg border border-[#E2E8F0] bg-[#F1F5F9] text-sm font-semibold text-[#94A3B8]"
                >
                  I&apos;m ready!
                </button>
                <p className="mt-1 text-center text-xs text-[#94A3B8]">
                  Place all 5 ships to continue
                </p>
              </div>
            )}
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-xs font-bold tracking-wider text-[#94A3B8] uppercase">
            How to place ships
          </h3>
          <ol className="flex flex-col gap-1.5 text-sm text-[#64748B]">
            {INSTRUCTIONS.map((item) => (
              <li key={item.action}>
                <span className="font-semibold text-[#0F172A]">{item.action}</span> — {item.rest}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  )
}
