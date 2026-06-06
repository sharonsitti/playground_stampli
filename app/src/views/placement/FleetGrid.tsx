import { cn } from '@/lib/utils'
import type { Cell, ShipType } from './usePlacement'

const COL_LETTERS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j']
const ROWS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
const COLS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

const cellKey = (cell: Cell) => `${String(cell.col)},${String(cell.row)}`
const colLetter = (col: number) => String.fromCharCode(97 + col)

type CellState = 'empty' | 'ship' | 'preview-valid' | 'preview-invalid'

type FleetGridProps = {
  cellToShip: Map<string, ShipType>
  previewCells: Cell[]
  isPreviewValid: boolean
  disabled: boolean
  onCellEnter: (cell: Cell) => void
  onCellClick: (cell: Cell) => void
  onLeave: () => void
}

const STATE_CLASS: Record<CellState, string> = {
  empty: 'bg-white',
  ship: 'bg-[#BFDBFE] border-[#93C5FD]',
  'preview-valid': 'bg-[#BBF7D0] border-[#86EFAC]',
  'preview-invalid': 'bg-[#FECACA] border-[#FCA5A5]',
}

export function FleetGrid({
  cellToShip,
  previewCells,
  isPreviewValid,
  disabled,
  onCellEnter,
  onCellClick,
  onLeave,
}: FleetGridProps) {
  const previewSet = new Set(previewCells.map(cellKey))

  const stateFor = (cell: Cell): CellState => {
    if (previewSet.has(cellKey(cell))) {
      return isPreviewValid ? 'preview-valid' : 'preview-invalid'
    }
    if (cellToShip.has(cellKey(cell))) return 'ship'
    return 'empty'
  }

  return (
    <div className="inline-flex flex-col" onMouseLeave={onLeave}>
      <div className="flex pl-5">
        {COL_LETTERS.map((letter) => (
          <div
            key={letter}
            className="w-8 pb-1 text-center text-xs font-medium text-[#94A3B8]"
            aria-hidden="true"
          >
            {letter}
          </div>
        ))}
      </div>

      <div className="flex">
        <div className="flex flex-col">
          {ROWS.map((row) => (
            <div
              key={row}
              className="flex h-8 w-5 items-center justify-end pr-1.5 text-xs font-medium text-[#94A3B8]"
              aria-hidden="true"
            >
              {row}
            </div>
          ))}
        </div>

        <div
          role="grid"
          aria-label="Fleet placement grid"
          className="grid grid-cols-10 rounded-[4px] border border-[#CBD5E1]"
        >
          {ROWS.map((row) =>
            COLS.map((col) => {
              const cell = { col, row }
              const state = stateFor(cell)
              const shipType = cellToShip.get(cellKey(cell))
              const coord = `${colLetter(col)}${String(row)}`
              const label = `${coord}, ${shipType ?? 'empty'}`
              return (
                <button
                  key={cellKey(cell)}
                  type="button"
                  role="gridcell"
                  aria-label={label}
                  disabled={disabled}
                  className={cn(
                    'size-8 border border-[#E5E7EB] transition-colors',
                    'focus-visible:relative focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#4F46E5]',
                    !disabled && 'cursor-pointer',
                    STATE_CLASS[state],
                  )}
                  onMouseEnter={() => {
                    onCellEnter(cell)
                  }}
                  onFocus={() => {
                    onCellEnter(cell)
                  }}
                  onClick={() => {
                    onCellClick(cell)
                  }}
                />
              )
            }),
          )}
        </div>
      </div>
    </div>
  )
}
