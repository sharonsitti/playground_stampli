import { cn } from '@/lib/utils'
import { cellKey, COLS, ROWS } from '../placement/types'

export type BattleCellState = 'empty' | 'ship' | 'hit' | 'miss' | 'sunk'

const CELL_STYLES: Record<BattleCellState, string> = {
  empty: 'bg-slate-800/60',
  ship: 'bg-slate-400',
  hit: 'bg-red-500/80',
  miss: 'bg-slate-500/40',
  sunk: 'bg-red-900/80 ring-1 ring-red-400',
}

type BattleGridProps = {
  label: string
  cellState: (col: number, row: number) => BattleCellState
  interactive: boolean
  isFireable?: (col: number, row: number) => boolean
  onFire?: (col: number, row: number) => void
}

export function BattleGrid({ label, cellState, interactive, isFireable, onFire }: BattleGridProps) {
  return (
    <div
      className="inline-grid gap-0.5"
      style={{ gridTemplateColumns: `1.25rem repeat(${String(COLS.length)}, 1.5rem)` }}
      role="grid"
      aria-label={label}
    >
      <div aria-hidden />
      {COLS.map((c) => (
        <div key={`col-${c}`} className="text-muted-foreground text-center text-xs font-medium">
          {c}
        </div>
      ))}

      {ROWS.map((row) => (
        <div key={`row-${String(row)}`} className="contents">
          <div className="text-muted-foreground flex items-center justify-end pr-1 text-xs font-medium">
            {row}
          </div>
          {COLS.map((_, col) => {
            const state = cellState(col, row)
            const fireable = interactive && (isFireable?.(col, row) ?? false)
            const content =
              state === 'miss' ? <span className="bg-foreground/70 size-1.5 rounded-full" /> : null
            return (
              <button
                key={cellKey(col, row)}
                type="button"
                role="gridcell"
                disabled={!fireable}
                aria-label={`${COLS[col] ?? ''}${String(row)}`}
                onClick={fireable ? () => onFire?.(col, row) : undefined}
                className={cn(
                  'flex size-6 items-center justify-center rounded-sm transition-colors',
                  CELL_STYLES[state],
                  fireable ? 'cursor-pointer hover:brightness-125' : 'cursor-default',
                )}
              >
                {content}
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}
