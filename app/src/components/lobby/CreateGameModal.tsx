import { useState } from 'react'
import { PRESET_SECONDS, type Preset } from '@shared/schemas'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type CreateGameModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (preset: Preset) => void
}

const PRESETS: readonly Preset[] = ['quick', 'casual']

const PRESET_LABELS: Record<Preset, string> = {
  quick: 'Quick',
  casual: 'Casual',
}

export function CreateGameModal({ open, onOpenChange, onCreate }: CreateGameModalProps) {
  const [selectedPreset, setSelectedPreset] = useState<Preset>('quick')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a game</DialogTitle>
          <DialogDescription>Choose how much time each phase allows.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Preset">
          {PRESETS.map((preset) => {
            const selected = selectedPreset === preset
            return (
              <button
                key={preset}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => {
                  setSelectedPreset(preset)
                }}
                className={cn(
                  'rounded-lg border px-4 py-3 text-left transition-colors',
                  selected ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted',
                )}
              >
                <div className="font-medium">{PRESET_LABELS[preset]}</div>
                <div className="text-muted-foreground text-sm">
                  {PRESET_SECONDS[preset]}s per phase
                </div>
              </button>
            )
          })}
        </div>

        <Button
          type="button"
          onClick={() => {
            onCreate(selectedPreset)
          }}
        >
          Create
        </Button>
      </DialogContent>
    </Dialog>
  )
}
