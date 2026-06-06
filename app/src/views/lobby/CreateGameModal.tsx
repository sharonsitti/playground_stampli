import { useState } from 'react'
import { Clock } from 'lucide-react'
import { PRESET_SECONDS } from '@shared/schemas'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

type Preset = 'quick' | 'casual'

const PRESETS: Array<{ value: Preset; label: string }> = [
  { value: 'quick', label: 'Quick' },
  { value: 'casual', label: 'Casual' },
]

type CreateGameModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (preset: Preset) => void
}

export function CreateGameModal({ open, onOpenChange, onConfirm }: CreateGameModalProps) {
  const [preset, setPreset] = useState<Preset>('quick')

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) setPreset('quick')
        onOpenChange(next)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-2xl">Create Game</DialogTitle>
          <DialogDescription>Choose a timer preset for both phases.</DialogDescription>
        </DialogHeader>

        <div className="flex gap-3" role="radiogroup" aria-label="Timer preset">
          {PRESETS.map(({ value, label }) => {
            const selected = preset === value
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => {
                  setPreset(value)
                }}
                className={cn(
                  'flex flex-1 flex-col items-center gap-2 rounded-[10px] border-2 p-4 transition-colors',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F46E5]',
                  selected
                    ? 'border-[#4F46E5] bg-[#EEF2FF] text-[#4F46E5]'
                    : 'border-[#E5E7EB] text-[#0F172A] hover:border-[#C7D2FE]',
                )}
              >
                <Clock
                  className={cn('size-6', selected ? 'text-[#4F46E5]' : 'text-[#94A3B8]')}
                  aria-hidden="true"
                />
                <span className="text-sm font-semibold">{label}</span>
                <span className="text-xs text-[#64748B]">{PRESET_SECONDS[value]} seconds</span>
              </button>
            )
          })}
        </div>

        <DialogFooter showCloseButton={false}>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button
            onClick={() => {
              onConfirm(preset)
            }}
          >
            Create Game
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
