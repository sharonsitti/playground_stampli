import type { GameSummary } from '@shared/schemas'
import { PRESET_SECONDS } from '@shared/schemas'
import { Button } from '@/components/ui/button'

type GameListProps = {
  games: GameSummary[]
  onJoin: (game: GameSummary) => void
}

function formatWinRate(creator: GameSummary['creator']): string {
  return creator.games_played === 0 ? '0%' : `${String(Math.round(creator.win_rate * 100))}%`
}

function presetLabel(preset: GameSummary['preset']): string {
  const seconds = PRESET_SECONDS[preset]
  const name = preset === 'quick' ? 'Quick' : 'Casual'
  return `${name} ${String(seconds)}s`
}

export function GameList({ games, onJoin }: GameListProps) {
  if (games.length === 0) {
    return (
      <p className="text-muted-foreground rounded-lg border border-dashed py-12 text-center">
        No games available — create one to get started
      </p>
    )
  }

  return (
    <ul className="space-y-2">
      {games.map((game) => (
        <li
          key={game.id}
          className="border-border bg-card flex items-center justify-between rounded-lg border px-4 py-3"
        >
          <div className="space-y-0.5">
            <div className="font-medium">{game.creator.name}</div>
            <div className="text-muted-foreground text-sm">
              {game.creator.wins}W / {game.creator.losses}L · {formatWinRate(game.creator)} win rate
              · {presetLabel(game.preset)}
            </div>
          </div>
          <Button
            type="button"
            onClick={() => {
              onJoin(game)
            }}
          >
            Join
          </Button>
        </li>
      ))}
    </ul>
  )
}
