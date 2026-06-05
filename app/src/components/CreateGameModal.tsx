import { useState } from 'react'
import { Clock } from 'lucide-react'
import { PRESET_SECONDS, type Preset } from '@shared/schemas'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const PRESET_OPTIONS: { value: Preset; label: string }[] = [
  { value: 'quick', label: 'Quick' },
  { value: 'casual', label: 'Casual' },
]

type CreateGameModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (preset: Preset) => void
  isCreating: boolean
}

export function CreateGameModal({
  open,
  onOpenChange,
  onConfirm,
  isCreating,
}: CreateGameModalProps) {
  const [selected, setSelected] = useState<Preset>('quick')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[400px] gap-0 rounded-2xl p-7">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#0F172A]">Create Game</DialogTitle>
          <DialogDescription className="text-sm text-[#64748B]">
            Choose a timer preset for both phases.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-5 flex gap-3" role="radiogroup" aria-label="Timer preset">
          {PRESET_OPTIONS.map((option) => {
            const isSelected = selected === option.value
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => {
                  setSelected(option.value)
                }}
                className={`flex flex-1 cursor-pointer flex-col items-center rounded-[10px] border-2 p-4 transition-colors ${
                  isSelected
                    ? 'border-[#4F46E5] bg-[#EEF2FF]'
                    : 'border-[#E5E7EB] bg-white hover:border-[#C7D2FE]'
                }`}
              >
                <Clock
                  className={`size-6 ${isSelected ? 'text-[#4F46E5]' : 'text-[#94A3B8]'}`}
                  strokeWidth={2}
                />
                <span
                  className={`mt-2 text-sm font-semibold ${
                    isSelected ? 'text-[#4F46E5]' : 'text-[#0F172A]'
                  }`}
                >
                  {option.label}
                </span>
                <span className="text-xs text-[#64748B]">
                  {PRESET_SECONDS[option.value]} seconds
                </span>
              </button>
            )
          })}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button
            variant="ghost"
            onClick={() => {
              onOpenChange(false)
            }}
            disabled={isCreating}
            className="h-10 rounded-lg border border-[#E5E7EB] px-4 text-sm font-semibold text-[#4F46E5]"
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              onConfirm(selected)
            }}
            disabled={isCreating}
            className="h-10 rounded-lg bg-[#4F46E5] px-4 text-sm font-semibold text-white hover:bg-[#4338CA]"
          >
            {isCreating ? 'Creating…' : 'Create Game'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
