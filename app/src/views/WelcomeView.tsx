import { useActionState, useState } from 'react'
import { Anchor, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { registerPlayer } from '@/lib/api'

type WelcomeViewProps = {
  onRegistered: (player: { id: string; name: string }) => void
}

type FormState = { error: string | null }

export function WelcomeView({ onRegistered }: WelcomeViewProps) {
  const [name, setName] = useState('')

  const [formState, submit, pending] = useActionState<FormState, FormData>(
    async () => {
      const trimmed = name.trim()
      try {
        const player = await registerPlayer(trimmed)
        onRegistered({ id: player.id, name: player.name })
        return { error: null }
      } catch {
        return { error: 'Could not start the game. Please try again.' }
      }
    },
    { error: null },
  )

  const canPlay = name.trim().length > 0

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-[360px]">
        <CardContent className="flex flex-col items-center pt-2">
          <Anchor className="text-primary size-10" aria-hidden="true" />
          <h1 className="font-heading text-foreground mt-3 text-2xl font-extrabold">Battleship</h1>
          <p className="text-muted-foreground mt-1 text-sm">Enter your name to set sail</p>

          <form action={submit} className="mt-5 flex w-full flex-col gap-3">
            <Input
              name="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
              }}
              placeholder="Admiral"
              aria-label="Your name"
              autoFocus
              maxLength={50}
              disabled={pending}
            />
            <Button type="submit" size="lg" className="w-full" disabled={!canPlay || pending}>
              {pending ? 'Setting sail…' : 'Play'}
              <ArrowRight className="size-4" />
            </Button>
          </form>

          {formState.error ? (
            <p role="alert" className="text-destructive mt-2 text-xs">
              {formState.error}
            </p>
          ) : (
            <p className="text-muted-foreground mt-2 text-xs">
              Name is used to track your win/loss record
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
