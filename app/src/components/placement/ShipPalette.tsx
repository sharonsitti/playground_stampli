import { SHIP_SIZES } from '@shared/geometry'
import { cn } from '@/lib/utils'
import { FLEET, type Orientation, type ShipType } from './types'

type ShipPaletteProps = {
  placedTypes: Set<ShipType>
  selectedType: ShipType | null
  orientation: Orientation
  locked: boolean
  onSelect: (type: ShipType) => void
}

const SHIP_LABELS: Record<ShipType, string> = {
  carrier: 'Carrier',
  battleship: 'Battleship',
  cruiser: 'Cruiser',
  submarine: 'Submarine',
  destroyer: 'Destroyer',
}

export function ShipPalette({
  placedTypes,
  selectedType,
  orientation,
  locked,
  onSelect,
}: ShipPaletteProps) {
  const remaining = FLEET.filter((type) => !placedTypes.has(type))

  return (
    <div className="w-48 space-y-2">
      <h2 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
        Fleet
      </h2>
      {remaining.length === 0 ? (
        <p className="text-muted-foreground text-sm">All ships placed.</p>
      ) : (
        <ul className="space-y-2">
          {remaining.map((type) => {
            const size = SHIP_SIZES[type] ?? 0
            const isSelected = selectedType === type
            return (
              <li key={type}>
                <button
                  type="button"
                  disabled={locked}
                  aria-pressed={isSelected}
                  onClick={() => {
                    onSelect(type)
                  }}
                  className={cn(
                    'flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50',
                    isSelected
                      ? 'border-primary bg-primary/20'
                      : 'border-border bg-slate-800/40 hover:bg-slate-700/50',
                  )}
                >
                  <span className="text-sm font-medium">{SHIP_LABELS[type]}</span>
                  <span className="flex gap-0.5" aria-hidden>
                    {Array.from({ length: size }, (_, i) => (
                      <span
                        key={`${type}-${String(i)}`}
                        className={cn(
                          'size-2.5 rounded-[2px]',
                          isSelected ? 'bg-primary' : 'bg-slate-500',
                        )}
                      />
                    ))}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
      {selectedType && (
        <p className="text-muted-foreground text-xs">
          Press <kbd className="bg-muted rounded px-1 py-0.5 font-mono text-[10px]">R</kbd> to
          rotate ({orientation === 'H' ? 'horizontal' : 'vertical'})
        </p>
      )}
    </div>
  )
}
