import { useActionState, useState } from 'react'
import { Anchor, ArrowRight } from 'lucide-react'
import { CreatePlayerResponseSchema, ErrorResponseSchema } from '@shared/schemas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export type Player = {
  id: string
  name: string
}

type WelcomeScreenProps = {
  onRegistered: (player: Player) => void
}

type FormState = {
  error: string | null
}

const PLAYERS_ENDPOINT = 'http://localhost:8000/api/players'

export function WelcomeScreen({ onRegistered }: WelcomeScreenProps) {
  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    async (_prev, formData) => {
      const raw = formData.get('name')
      const name = typeof raw === 'string' ? raw.trim() : ''
      if (!name) return { error: 'Please enter a name.' }

      const res = await fetch(PLAYERS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })

      const body: unknown = await res.json().catch(() => null)

      if (!res.ok) {
        const parsed = ErrorResponseSchema.safeParse(body)
        return {
          error: parsed.success ? parsed.data.error : 'Could not register. Please try again.',
        }
      }

      const player = CreatePlayerResponseSchema.parse(body)
      onRegistered({ id: player.id, name: player.name })
      return { error: null }
    },
    { error: null },
  )

  const [name, setName] = useState('')
  const canSubmit = name.trim().length > 0 && !isPending

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F6F8] px-6">
      <div className="w-full max-w-[360px] rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
        <form action={formAction} className="flex flex-col">
          <Anchor className="mx-auto size-10 text-[#4F46E5]" strokeWidth={2} />
          <h1 className="mt-3 text-center text-2xl font-extrabold text-[#0F172A]">Battleship</h1>
          <p className="mt-1 text-center text-sm text-[#64748B]">Enter your name to set sail</p>

          <Input
            name="name"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
            }}
            autoFocus
            autoComplete="off"
            placeholder="Admiral"
            aria-label="Player name"
            disabled={isPending}
            className="mt-5 h-11 rounded-lg border-[#E5E7EB] bg-white px-3 text-base text-[#0F172A] placeholder:text-[#94A3B8]"
          />

          <Button
            type="submit"
            disabled={!canSubmit}
            className="mt-3 h-10 w-full rounded-lg bg-[#4F46E5] text-sm font-semibold text-white hover:bg-[#4338CA] disabled:opacity-45"
          >
            {isPending ? 'Setting sail…' : 'Play'}
            {!isPending && <ArrowRight className="size-4" />}
          </Button>

          {state.error ? (
            <p className="mt-2 text-center text-xs text-[#EF4444]" role="alert">
              {state.error}
            </p>
          ) : (
            <p className="mt-2 text-center text-xs text-[#94A3B8]">
              Name is used to track your win/loss record
            </p>
          )}
        </form>
      </div>
    </div>
  )
}
