import type { ReactNode } from 'react'

export type CellVisual = 'empty' | 'ship' | 'valid' | 'invalid' | 'hit' | 'miss'

const VISUAL_CLASS = new Map<CellVisual, string>([
  ['empty', 'bg-white'],
  ['ship', 'bg-[#BFDBFE]'],
  ['valid', 'bg-[#BBF7D0]'],
  ['invalid', 'bg-[#FECACA]'],
  ['hit', 'bg-[#EF4444]'],
  ['miss', 'bg-white'],
])

type GridCellProps = {
  visual: CellVisual
  label: string
  interactive?: boolean
  hoverStyle?: 'pointer' | 'crosshair'
  onActivate?: () => void
  onHover?: () => void
  children?: ReactNode
}

const HOVER_CLASS = new Map<'pointer' | 'crosshair', string>([
  ['pointer', 'cursor-pointer'],
  ['crosshair', 'cursor-crosshair hover:bg-[#EEF2FF]'],
])

export function GridCell({
  visual,
  label,
  interactive = false,
  hoverStyle = 'pointer',
  onActivate,
  onHover,
  children,
}: GridCellProps) {
  const interactiveClass = interactive
    ? (HOVER_CLASS.get(hoverStyle) ?? 'cursor-pointer')
    : 'cursor-default'
  return (
    <button
      type="button"
      role="gridcell"
      aria-label={label}
      disabled={!interactive}
      onClick={onActivate}
      onMouseEnter={onHover}
      onFocus={onHover}
      className={`relative size-9 border border-[#E5E7EB] ${VISUAL_CLASS.get(visual) ?? 'bg-white'} ${interactiveClass} outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5] focus-visible:ring-inset`}
    >
      {children}
    </button>
  )
}
