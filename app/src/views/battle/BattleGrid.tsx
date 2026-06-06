import type { ReactNode } from 'react'

const COL_LETTERS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j']
const ROWS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
const COLS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

const colLetter = (col: number) => String.fromCharCode(97 + col)

type BattleGridProps = {
  label: string
  ariaLabel: string
  renderCell: (col: number, row: number, coord: string) => ReactNode
}

export function BattleGrid({ label, ariaLabel, renderCell }: BattleGridProps) {
  return (
    <div className="inline-flex flex-col">
      <h2 className="mb-1.5 text-sm font-semibold text-[#0F172A]">{label}</h2>

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
          aria-label={ariaLabel}
          className="grid grid-cols-10 rounded-[4px] border border-[#CBD5E1]"
        >
          {ROWS.map((row) =>
            COLS.map((col) => renderCell(col, row, `${colLetter(col)}${String(row)}`)),
          )}
        </div>
      </div>
    </div>
  )
}
