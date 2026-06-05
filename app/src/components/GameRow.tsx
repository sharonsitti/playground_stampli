import { type LobbyGame } from '@shared/schemas'
import { Button } from '@/components/ui/button'

const PRESET_BADGE: Map<LobbyGame['preset'], string> = new Map([
  ['quick', 'Quick 30s'],
  ['casual', 'Casual 60s'],
])

type GameRowProps = {
  game: LobbyGame
  onJoin: (gameId: string) => void
}

function formatRecord(creator: LobbyGame['creator']): string {
  const winRate = Math.round(creator.win_rate * 100)
  return `${String(creator.wins)}W / ${String(creator.losses)}L · ${String(winRate)}% win rate`
}

export function GameRow({ game, onJoin }: GameRowProps) {
  return (
    <li className="flex items-center gap-3 rounded-[10px] bg-white px-4 py-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
      <span aria-hidden className="size-[18px] shrink-0 rounded-full border-2 border-[#CBD5E1]" />
      <div className="flex flex-1 flex-col">
        <span className="text-sm font-semibold text-[#0F172A]">{game.creator.name}</span>
        <span className="text-xs text-[#64748B]">{formatRecord(game.creator)}</span>
      </div>
      <span className="rounded-full bg-[#EEF2FF] px-2 py-0.5 text-xs font-semibold tracking-wide text-[#4F46E5]">
        {PRESET_BADGE.get(game.preset) ?? game.preset}
      </span>
      <Button
        onClick={() => {
          onJoin(game.id)
        }}
        className="h-8 rounded-lg bg-[#4F46E5] px-3 text-sm font-semibold text-white hover:bg-[#4338CA]"
      >
        Join
      </Button>
    </li>
  )
}
