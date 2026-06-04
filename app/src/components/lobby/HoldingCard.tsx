import { PRESET_SECONDS, type Preset } from '@shared/schemas'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type HoldingCardProps = {
  preset: Preset
  onCancel: () => void
}

export function HoldingCard({ preset, onCancel }: HoldingCardProps) {
  const name = preset === 'quick' ? 'Quick' : 'Casual'

  return (
    <Card className="mx-auto max-w-md text-center">
      <CardHeader>
        <CardTitle>Waiting for opponent…</CardTitle>
        <CardDescription>
          {name} game · {PRESET_SECONDS[preset]}s per phase
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground text-sm">
          Your game is open in the lobby. It’ll start the moment someone joins.
        </p>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </CardContent>
    </Card>
  )
}
