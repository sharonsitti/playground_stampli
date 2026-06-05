import { useState } from 'react'
import type { ShipType } from '@shared/schemas'
import { GridCell, type CellVisual } from '@/components/GridCell'
import type { usePlacement } from '@/hooks/usePlacement'

const COL_LABELS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j']
const ROWS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

type Placement = ReturnType<typeof usePlacement>

type PlacementGridProps = {
  placement: Placement
  locked?: boolean
}

function cellLabel(col: number, row: number) {
  return `${COL_LABELS.at(col) ?? ''}${String(row)}`
}

export function PlacementGrid({ placement, locked = false }: PlacementGridProps) {
  const [hover, setHover] = useState<{ col: number; row: number } | null>(null)

  const preview = placement.selection && hover ? placement.previewCells(hover.col, hover.row) : []
  const previewValid = preview.length > 0 && placement.isValidPlacement(preview)
  const previewKeys = new Set(preview.map((c) => `${String(c.col)},${String(c.row)}`))

  function visualFor(col: number, row: number): CellVisual {
    const key = `${String(col)},${String(row)}`
    if (previewKeys.has(key)) return previewValid ? 'valid' : 'invalid'
    if (placement.occupied.has(key)) return 'ship'
    return 'empty'
  }

  function activate(col: number, row: number) {
    const occupant: ShipType | undefined = placement.occupied.get(`${String(col)},${String(row)}`)
    if (placement.selection) {
      placement.placeAt(col, row)
      return
    }
    if (occupant) placement.pickUp(occupant)
  }

  return (
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
        aria-label="Fleet grid"
        className="flex flex-col rounded border border-[#CBD5E1]"
        onMouseLeave={() => {
          setHover(null)
        }}
      >
        {ROWS.map((row) => (
          <div key={row} role="row" className="flex items-center">
            <div className="w-5 pr-1.5 text-right text-xs leading-9 font-medium text-[#94A3B8]">
              {row}
            </div>
            {COL_LABELS.map((_, col) => (
              <GridCell
                key={cellLabel(col, row)}
                label={cellLabel(col, row)}
                visual={visualFor(col, row)}
                interactive={!locked}
                onHover={() => {
                  setHover({ col, row })
                }}
                onActivate={() => {
                  activate(col, row)
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
