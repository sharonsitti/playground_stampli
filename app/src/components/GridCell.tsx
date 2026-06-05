import type { ReactNode } from 'react'

export type CellVisual = 'empty' | 'ship' | 'valid' | 'invalid'

const VISUAL_CLASS = new Map<CellVisual, string>([
  ['empty', 'bg-white'],
  ['ship', 'bg-[#BFDBFE]'],
  ['valid', 'bg-[#BBF7D0]'],
  ['invalid', 'bg-[#FECACA]'],
])

type GridCellProps = {
  visual: CellVisual
  label: string
  interactive?: boolean
  onActivate?: () => void
  onHover?: () => void
  children?: ReactNode
}

export function GridCell({
  visual,
  label,
  interactive = false,
  onActivate,
  onHover,
  children,
}: GridCellProps) {
  return (
    <button
      type="button"
      role="gridcell"
      aria-label={label}
      disabled={!interactive}
      onClick={onActivate}
      onMouseEnter={onHover}
      onFocus={onHover}
      className={`size-9 border border-[#E5E7EB] ${VISUAL_CLASS.get(visual) ?? 'bg-white'} ${interactive ? 'cursor-pointer' : 'cursor-default'} outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5] focus-visible:ring-inset`}
    >
      {children}
    </button>
  )
}
