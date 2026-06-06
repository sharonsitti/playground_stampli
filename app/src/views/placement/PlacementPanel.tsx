import { Check, RotateCcw, Ship } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { SHIP_SIZES, type ShipType } from './usePlacement'

export type ReadyState = 'unready' | 'ready' | 'locked'

const SHIP_LABELS: Record<ShipType, string> = {
  carrier: 'Carrier',
  battleship: 'Battleship',
  cruiser: 'Cruiser',
  submarine: 'Submarine',
  destroyer: 'Destroyer',
}

const READY_BUTTON_CLASS: Record<ReadyState, string> = {
  unready: 'bg-muted text-muted-foreground hover:bg-muted',
  ready: 'bg-green-600 text-white hover:bg-green-700',
  locked: 'bg-primary text-primary-foreground hover:bg-primary',
}

type PlacementPanelProps = {
  availableShips: ShipType[]
  selectedShip: ShipType | null
  readyState: ReadyState
  opponentReady: boolean
  resetDisabled: boolean
  locked: boolean
  onSelect: (type: ShipType) => void
  onReset: () => void
  onReady: () => void
}

export function PlacementPanel({
  availableShips,
  selectedShip,
  readyState,
  opponentReady,
  resetDisabled,
  locked,
  onSelect,
  onReset,
  onReady,
}: PlacementPanelProps) {
  return (
    <aside className="bg-card flex w-[220px] flex-col gap-3 rounded-xl border border-[#E5E7EB] p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-[#0F172A]">Ships to place</h2>

      <ul className="flex flex-col gap-1.5">
        {availableShips.map((type) => {
          const isSelected = selectedShip === type
          return (
            <li key={type}>
              <button
                type="button"
                disabled={locked}
                onClick={() => {
                  onSelect(type)
                }}
                aria-pressed={isSelected}
                className={cn(
                  'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F46E5]',
                  isSelected ? 'bg-[#EEF2FF] text-[#4F46E5]' : 'text-[#0F172A] hover:bg-[#F1F5F9]',
                )}
              >
                <Ship className="size-4" aria-hidden="true" />
                <span className="text-sm">{SHIP_LABELS[type]}</span>
                <span className="ml-auto text-xs text-[#94A3B8]">{SHIP_SIZES[type]}</span>
              </button>
            </li>
          )
        })}
        {availableShips.length === 0 ? (
          <li className="px-2 py-1.5 text-xs text-[#94A3B8]">All ships placed.</li>
        ) : null}
      </ul>

      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={onReset}
        disabled={resetDisabled}
      >
        <RotateCcw className="size-3.5" aria-hidden="true" />
        Reset
      </Button>

      <div className="mt-1 flex flex-col gap-1">
        <Button
          size="lg"
          className={cn('w-full', READY_BUTTON_CLASS[readyState])}
          disabled={readyState !== 'ready'}
          onClick={onReady}
        >
          {readyState === 'ready' ? <Check className="size-4" aria-hidden="true" /> : null}
          I&apos;m ready!
        </Button>
        {readyState === 'unready' ? (
          <p className="text-xs text-[#94A3B8]">Place all 5 ships to continue</p>
        ) : null}
        {opponentReady ? (
          <p className="text-xs font-medium text-green-600">Opponent is ready</p>
        ) : null}
      </div>
    </aside>
  )
}
