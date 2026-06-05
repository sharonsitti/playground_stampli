import { useEffect } from 'react'
import { X } from 'lucide-react'
import { type BattleStartEvent } from '@shared/schemas'
import { PlacementGrid } from '@/components/PlacementGrid'
import { ReadyButton } from '@/components/ReadyButton'
import { ShipPalette } from '@/components/ShipPalette'
import { usePlacement } from '@/hooks/usePlacement'
import { usePlacementPhase } from '@/hooks/usePlacementPhase'
import { formatTimer } from '@/lib/format'

type PlacementScreenProps = {
  gameId: string
  playerId: string
  onBattleStart: (event: BattleStartEvent) => void
  onExpired: () => void
}

const INSTRUCTIONS: { action: string; rest: string }[] = [
  {
    action: 'Select',
    rest: 'Click a ship in the palette. It attaches to your cursor as a ghost preview.',
  },
  {
    action: 'Position',
    rest: 'Hover over the grid. The preview snaps cell-by-cell. Green = valid; red = invalid.',
  },
  {
    action: 'Rotate',
    rest: 'Press R to toggle horizontal / vertical. The preview updates instantly.',
  },
  { action: 'Place', rest: 'Click a green cell to drop the ship. Red cells are blocked.' },
  { action: 'Reposition', rest: 'Click a ship already on the grid to pick it back up.' },
  { action: 'Reset', rest: 'Clears all placed ships and refills the palette.' },
]

export function PlacementScreen({
  gameId,
  playerId,
  onBattleStart,
  onExpired,
}: PlacementScreenProps) {
  const placement = usePlacement()
  const { rotate } = placement
  const phase = usePlacementPhase({ gameId, playerId, onBattleStart })

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!phase.locked && (e.key === 'r' || e.key === 'R')) rotate()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [rotate, phase.locked])

  const readyState = phase.locked ? 'locked' : placement.allPlaced ? 'ready' : 'unready'

  return (
    <div className="flex min-h-screen flex-col bg-[#F5F6F8]">
      <div className="flex items-center justify-between border-b border-[#C7D2FE] bg-[#EEF2FF] px-5 py-2.5">
        <div className="flex items-center gap-2.5">
          <span className="rounded-full bg-[#EEF2FF] px-2 py-0.5 text-xs font-semibold tracking-wide text-[#4F46E5] uppercase ring-1 ring-[#C7D2FE]">
            Placement Phase
          </span>
          <span className="text-sm text-[#64748B]">
            Place all 5 ships on your grid before time runs out.
          </span>
        </div>
        <span className="text-2xl font-bold text-[#4338CA] tabular-nums">
          {phase.secondsRemaining === null ? '—:—' : formatTimer(phase.secondsRemaining)}
        </span>
      </div>

      {phase.expired && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 border-b border-[#FB923C] bg-[#FFF7ED] px-5 py-2.5 text-sm font-medium text-[#92400E]"
        >
          <span>Time&apos;s up! The game ended before both players were ready.</span>
          <button
            type="button"
            onClick={onExpired}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 font-semibold text-[#92400E] hover:bg-[#FED7AA]"
          >
            <X className="size-3.5" />
            Return to lobby
          </button>
        </div>
      )}

      <div className="mx-auto flex w-full max-w-[960px] flex-col gap-6 px-6 py-8">
        <div className="flex gap-6">
          <div className="flex-1">
            <PlacementGrid placement={placement} locked={phase.locked} />
          </div>
          <div className="flex flex-col gap-3">
            <ShipPalette placement={placement} locked={phase.locked} />
            <ReadyButton
              state={readyState}
              onReady={() => {
                void phase.submitReady(placement.placed)
              }}
            />
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-xs font-bold tracking-wider text-[#94A3B8] uppercase">
            How to place ships
          </h3>
          <ol className="flex flex-col gap-1.5 text-sm text-[#64748B]">
            {INSTRUCTIONS.map((item) => (
              <li key={item.action}>
                <span className="font-semibold text-[#0F172A]">{item.action}</span> — {item.rest}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  )
}
