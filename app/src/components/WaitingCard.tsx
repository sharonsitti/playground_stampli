import { Anchor } from 'lucide-react'
import { type Preset } from '@shared/schemas'
import { Button } from '@/components/ui/button'

const PRESET_LABEL: Map<Preset, string> = new Map([
  ['quick', 'Quick 30s'],
  ['casual', 'Casual 60s'],
])

type WaitingCardProps = {
  preset: Preset
  onCancel: () => void
}

export function WaitingCard({ preset, onCancel }: WaitingCardProps) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-[#C7D2FE] bg-[#EEF2FF] px-6 py-8">
      <Anchor className="size-8 text-[#A5B4FC]" strokeWidth={2} />
      <p className="mt-3 text-base font-semibold text-[#4338CA]">Waiting for opponent…</p>
      <p className="mt-1 text-sm text-[#64748B]">
        Your game ({PRESET_LABEL.get(preset) ?? preset}) is listed in the lobby
      </p>
      <Button
        variant="ghost"
        onClick={onCancel}
        className="mt-4 h-9 rounded-lg border border-[#E5E7EB] bg-white px-4 text-sm font-semibold text-[#4F46E5]"
      >
        Cancel
      </Button>
    </div>
  )
}
