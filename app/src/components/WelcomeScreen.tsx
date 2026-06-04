import { useActionState, useState } from 'react'
import type { ErrorResponse, Player } from '@shared/schemas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type WelcomeScreenProps = {
  onPlayerRegistered: (id: string, name: string) => void
}

export function WelcomeScreen({ onPlayerRegistered }: WelcomeScreenProps) {
  const [name, setName] = useState('')

  const [error, submitAction, isSubmitting] = useActionState<string | null>(async () => {
    const trimmedName = name.trim()
    try {
      const res = await fetch('http://localhost:8000/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmedName }),
      })
      if (!res.ok) {
        const body = (await res.json()) as ErrorResponse
        return body.error
      }
      const player = (await res.json()) as Player
      sessionStorage.setItem('playerId', player.id)
      sessionStorage.setItem('playerName', player.name)
      onPlayerRegistered(player.id, player.name)
      return null
    } catch {
      return 'Could not reach the server. Please try again.'
    }
  }, null)

  const canSubmit = name.trim().length > 0 && !isSubmitting

  return (
    <div className="bg-background text-foreground flex min-h-screen items-center justify-center bg-[oklch(0.16_0.04_255)] p-4">
      <form
        action={submitAction}
        className="border-border/40 bg-card/95 w-full max-w-sm space-y-6 rounded-2xl border p-8 shadow-xl"
      >
        <div className="space-y-2 text-center">
          <h1 className="font-heading text-4xl font-bold tracking-tight">BATTLESHIP</h1>
          <p className="text-muted-foreground text-sm">Enter your name to play</p>
        </div>

        <div className="space-y-3">
          <Input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
            }}
            placeholder="Your name"
            aria-label="Player name"
            aria-invalid={error != null}
            autoFocus
          />

          <Button type="submit" disabled={!canSubmit} size="lg" className="w-full">
            {isSubmitting ? 'Starting…' : 'Play'}
          </Button>
        </div>

        {error != null && (
          <p role="alert" className="text-destructive text-center text-sm">
            {error}
          </p>
        )}
      </form>
    </div>
  )
}
