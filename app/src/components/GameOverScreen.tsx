import type { Player } from '@shared/schemas'
import { Button } from '@/components/ui/button'

type GameOverScreenProps = {
  playerId: string
  winnerId: string
  loserId: string
  winner: Player
  loser: Player
  onReturnToLobby: () => void
}

function formatWinRate(player: Player): string {
  return player.games_played === 0 ? '0%' : `${String(Math.round(player.win_rate * 100))}%`
}

function StatCard({ player, isWinner }: { player: Player; isWinner: boolean }) {
  return (
    <div className="border-border/40 bg-card/80 flex-1 space-y-3 rounded-xl border p-5">
      <div className="flex items-baseline justify-between">
        <span className="font-heading text-lg font-bold tracking-tight">{player.name}</span>
        <span
          className={
            isWinner
              ? 'text-xs font-semibold tracking-wider text-emerald-400 uppercase'
              : 'text-muted-foreground text-xs font-semibold tracking-wider uppercase'
          }
        >
          {isWinner ? 'Winner' : 'Defeated'}
        </span>
      </div>
      <dl className="grid grid-cols-3 gap-2 text-center">
        <div>
          <dt className="text-muted-foreground text-xs uppercase">Wins</dt>
          <dd className="font-mono text-xl font-semibold tabular-nums">{player.wins}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-xs uppercase">Losses</dt>
          <dd className="font-mono text-xl font-semibold tabular-nums">{player.losses}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-xs uppercase">Win rate</dt>
          <dd className="font-mono text-xl font-semibold tabular-nums">{formatWinRate(player)}</dd>
        </div>
      </dl>
    </div>
  )
}

export function GameOverScreen({
  playerId,
  winnerId,
  winner,
  loser,
  onReturnToLobby,
}: GameOverScreenProps) {
  const didWin = playerId === winnerId
  const headline = didWin ? 'You won!' : 'You lost'
  const subtitle = didWin
    ? `All of ${loser.name}'s ships are sunk`
    : `${winner.name} sunk your fleet`

  return (
    <div className="bg-background text-foreground flex min-h-screen items-center justify-center bg-[oklch(0.16_0.04_255)] p-4">
      <div className="border-border/40 bg-card/95 w-full max-w-lg space-y-6 rounded-2xl border p-8 shadow-xl">
        <div className="space-y-2 text-center">
          <h1
            className={
              didWin
                ? 'font-heading text-4xl font-bold tracking-tight text-emerald-400'
                : 'font-heading text-destructive text-4xl font-bold tracking-tight'
            }
          >
            {headline}
          </h1>
          <p className="text-muted-foreground text-sm">{subtitle}</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <StatCard player={winner} isWinner />
          <StatCard player={loser} isWinner={false} />
        </div>

        <Button type="button" size="lg" className="w-full" onClick={onReturnToLobby}>
          Return to lobby
        </Button>
      </div>
    </div>
  )
}
