import type { PlayerResponse } from '@shared/schemas'
import { Trophy, Skull } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

type GameOverViewProps = {
  playerId: string
  winner: PlayerResponse
  loser: PlayerResponse
  onReturnToLobby: () => void
}

function StatRow({ player, accent }: { player: PlayerResponse; accent: 'winner' | 'loser' }) {
  const winRate = Math.round(player.win_rate * 100)
  return (
    <li className="flex items-center gap-3 rounded-[10px] bg-white px-4 py-3 ring-1 ring-[#E5E7EB]">
      <span
        className={`size-2 shrink-0 rounded-full ${accent === 'winner' ? 'bg-[#22C55E]' : 'bg-[#CBD5E1]'}`}
        aria-hidden="true"
      />
      <span className="flex-1 text-sm font-semibold text-[#0F172A]">{player.name}</span>
      <span className="text-xs text-[#64748B]">
        {player.wins}W / {player.losses}L · {winRate}% win rate
      </span>
    </li>
  )
}

export function GameOverView({ playerId, winner, loser, onReturnToLobby }: GameOverViewProps) {
  const won = playerId === winner.id
  const headline = won ? 'You won!' : 'You lost'
  const subtitle = won ? `All of ${loser.name}'s ships are sunk` : `${winner.name} sunk your fleet`

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-[420px]">
        <CardContent className="flex flex-col items-center pt-2">
          {won ? (
            <Trophy className="size-10 text-[#22C55E]" aria-hidden="true" />
          ) : (
            <Skull className="size-10 text-[#94A3B8]" aria-hidden="true" />
          )}
          <h1 className="font-heading text-foreground mt-3 text-2xl font-extrabold">{headline}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{subtitle}</p>

          <ul className="mt-6 flex w-full flex-col gap-2">
            <StatRow player={winner} accent="winner" />
            <StatRow player={loser} accent="loser" />
          </ul>

          <Button size="lg" className="mt-6 w-full" onClick={onReturnToLobby}>
            Return to Lobby
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
