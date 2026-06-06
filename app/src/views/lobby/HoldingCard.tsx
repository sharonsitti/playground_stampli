import { Anchor } from 'lucide-react'
import { Button } from '@/components/ui/button'

const PRESET_LABELS: Record<'quick' | 'casual', string> = {
  quick: 'Quick 30s',
  casual: 'Casual 60s',
}

type HoldingCardProps = {
  preset: 'quick' | 'casual'
  onCancel: () => void
}

export function HoldingCard({ preset, onCancel }: HoldingCardProps) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-[#C7D2FE] bg-[#EEF2FF] px-6 py-8 text-center">
      <Anchor className="size-8 text-[#A5B4FC]" aria-hidden="true" />
      <p className="mt-3 text-base font-semibold text-[#4338CA]">Waiting for opponent...</p>
      <p className="mt-1 text-sm text-[#64748B]">
        Your game ({PRESET_LABELS[preset]}) is listed in the lobby
      </p>
      <Button variant="outline" className="mt-4" onClick={onCancel}>
        Cancel
      </Button>
    </div>
  )
}
