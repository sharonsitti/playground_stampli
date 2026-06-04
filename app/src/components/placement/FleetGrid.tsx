import { cn } from '@/lib/utils'
import { computePreview, occupiedKeySet } from './geometry'
import { cellKey, COLS, ROWS, type Cell, type PlacedShip, type SelectedShip } from './types'

type FleetGridProps = {
  placedShips: PlacedShip[]
  selectedShip: SelectedShip | null
  hoverCell: Cell | null
  locked: boolean
  onHoverCell: (cell: Cell | null) => void
  onCellClick: (cell: Cell) => void
}

type CellState = 'empty' | 'ship' | 'preview-valid' | 'preview-invalid'

const CELL_STYLES: Record<CellState, string> = {
  empty: 'bg-slate-800/60 hover:bg-slate-700/60',
  ship: 'bg-slate-400',
  'preview-valid': 'bg-emerald-500/80',
  'preview-invalid': 'bg-red-500/80',
}

export function FleetGrid({
  placedShips,
  selectedShip,
  hoverCell,
  locked,
  onHoverCell,
  onCellClick,
}: FleetGridProps) {
  const occupied = occupiedKeySet(placedShips)
  const preview =
    selectedShip && hoverCell ? computePreview(selectedShip, hoverCell, placedShips) : null
  const previewKeys = new Set(preview?.cells.map((c) => cellKey(c.col, c.row)))

  function stateFor(col: number, row: number): CellState {
    const key = cellKey(col, row)
    if (previewKeys.has(key)) return preview?.valid ? 'preview-valid' : 'preview-invalid'
    if (occupied.has(key)) return 'ship'
    return 'empty'
  }

  return (
    <div
      className="inline-grid gap-0.5"
      style={{ gridTemplateColumns: `1.25rem repeat(${String(COLS.length)}, 1.75rem)` }}
      onPointerLeave={() => {
        onHoverCell(null)
      }}
      role="grid"
      aria-label="Fleet grid"
    >
      <div aria-hidden />
      {COLS.map((label) => (
        <div key={`col-${label}`} className="text-muted-foreground text-center text-xs font-medium">
          {label}
        </div>
      ))}

      {ROWS.map((row) => (
        <div key={`row-${String(row)}`} className="contents">
          <div className="text-muted-foreground flex items-center justify-end pr-1 text-xs font-medium">
            {row}
          </div>
          {COLS.map((_, col) => {
            const state = stateFor(col, row)
            return (
              <button
                key={cellKey(col, row)}
                type="button"
                role="gridcell"
                disabled={locked}
                aria-label={`${COLS[col] ?? ''}${String(row)}`}
                className={cn(
                  'size-7 rounded-sm transition-colors disabled:cursor-not-allowed',
                  CELL_STYLES[state],
                )}
                onPointerEnter={() => {
                  if (!locked) onHoverCell({ col, row })
                }}
                onClick={() => {
                  onCellClick({ col, row })
                }}
              />
            )
          })}
        </div>
      ))}
    </div>
  )
}
