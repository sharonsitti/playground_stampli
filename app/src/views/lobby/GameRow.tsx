import type { GetGamesResponse } from '@shared/schemas'
import { Button } from '@/components/ui/button'

type Game = GetGamesResponse['games'][number]

const PRESET_LABELS: Record<'quick' | 'casual', string> = {
  quick: 'Quick 30s',
  casual: 'Casual 60s',
}

type GameRowProps = {
  game: Game
  onJoin: (game: Game) => void
}

export function GameRow({ game, onJoin }: GameRowProps) {
  const { creator, preset } = game
  const winRate = Math.round(creator.win_rate * 100)

  return (
    <li className="flex items-center gap-3 rounded-[10px] bg-white px-4 py-3.5 shadow-sm ring-1 ring-[#E5E7EB]">
      <span
        className="size-[18px] shrink-0 rounded-full border-2 border-[#CBD5E1]"
        aria-hidden="true"
      />

      <div className="flex flex-1 flex-col">
        <span className="text-sm font-semibold text-[#0F172A]">{creator.name}</span>
        <span className="text-xs text-[#64748B]">
          {creator.wins}W / {creator.losses}L · {winRate}% win rate
        </span>
      </div>

      <span className="rounded-full bg-[#EEF2FF] px-2 py-0.5 text-xs font-semibold tracking-wider text-[#4F46E5] uppercase">
        {PRESET_LABELS[preset]}
      </span>

      <Button
        size="sm"
        onClick={() => {
          onJoin(game)
        }}
      >
        Join
      </Button>
    </li>
  )
}
