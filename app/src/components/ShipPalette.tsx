import { RotateCcw, Ship } from 'lucide-react'
import type { ShipType } from '@shared/schemas'
import { Button } from '@/components/ui/button'
import type { usePlacement } from '@/hooks/usePlacement'

const SHIP_LABEL = new Map<ShipType, string>([
  ['carrier', 'Carrier'],
  ['battleship', 'Battleship'],
  ['cruiser', 'Cruiser'],
  ['submarine', 'Submarine'],
  ['destroyer', 'Destroyer'],
])

type Placement = ReturnType<typeof usePlacement>

type ShipPaletteProps = {
  placement: Placement
  locked?: boolean
}

export function ShipPalette({ placement, locked = false }: ShipPaletteProps) {
  return (
    <div className="w-[220px] rounded-xl bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
      <h2 className="text-sm font-semibold text-[#0F172A]">Ships to place</h2>

      <ul className="mt-3 flex flex-col gap-1.5">
        {placement.remaining.map((type) => {
          const selected = placement.selection?.type === type
          return (
            <li key={type}>
              <button
                type="button"
                disabled={locked}
                onClick={() => {
                  placement.selectFromPalette(type)
                }}
                className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left disabled:cursor-not-allowed disabled:opacity-45 ${
                  selected ? 'bg-[#EEF2FF] text-[#4F46E5]' : 'text-[#0F172A] hover:bg-[#F8FAFC]'
                }`}
              >
                <Ship className="size-4 text-[#64748B]" />
                <span className="text-sm">{SHIP_LABEL.get(type) ?? type}</span>
                <span className="ml-auto text-xs text-[#94A3B8]">{placement.shipSizeOf(type)}</span>
              </button>
            </li>
          )
        })}
      </ul>

      <Button
        type="button"
        variant="ghost"
        disabled={locked || placement.placed.length === 0}
        onClick={() => {
          placement.reset()
        }}
        className="mt-2 h-8 w-full justify-center gap-1.5 rounded-lg border border-[#E5E7EB] text-sm font-semibold text-[#4F46E5]"
      >
        <RotateCcw className="size-3.5" />
        Reset
      </Button>
    </div>
  )
}
