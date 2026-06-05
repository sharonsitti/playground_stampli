import { GridCell, type CellVisual } from '@/components/GridCell'

const COL_LABELS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j']
const ROWS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

export type BattleCell = {
  visual: CellVisual
  sunk: boolean
}

type BattleGridProps = {
  label: string
  cellFor: (col: number, row: number) => BattleCell
  interactive?: boolean
  onFire?: (col: number, row: number) => void
}

function cellLabel(col: number, row: number) {
  return `${COL_LABELS.at(col) ?? ''}${String(row)}`
}

function MissDot() {
  return (
    <span className="absolute top-1/2 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#CBD5E1]" />
  )
}

export function BattleGrid({ label, cellFor, interactive = false, onFire }: BattleGridProps) {
  return (
    <div className="inline-flex flex-col">
      <span className="mb-1.5 text-sm font-semibold text-[#0F172A]">{label}</span>
      <div className="inline-flex flex-col">
        <div className="flex pl-5">
          {COL_LABELS.map((c) => (
            <div key={c} className="w-9 pb-1 text-center text-xs font-medium text-[#94A3B8]">
              {c}
            </div>
          ))}
        </div>
        <div
          role="grid"
          aria-label={label}
          className="flex flex-col rounded border border-[#CBD5E1]"
        >
          {ROWS.map((row) => (
            <div key={row} role="row" className="flex items-center">
              <div className="w-5 pr-1.5 text-right text-xs leading-9 font-medium text-[#94A3B8]">
                {row}
              </div>
              {COL_LABELS.map((_, col) => {
                const cell = cellFor(col, row)
                return (
                  <div
                    key={cellLabel(col, row)}
                    className={cell.sunk ? 'ring-2 ring-[#B91C1C] ring-inset' : undefined}
                  >
                    <GridCell
                      label={cellLabel(col, row)}
                      visual={cell.visual}
                      interactive={interactive && cell.visual === 'empty'}
                      hoverStyle="crosshair"
                      onActivate={() => {
                        onFire?.(col, row)
                      }}
                    >
                      {cell.visual === 'miss' && <MissDot />}
                    </GridCell>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
