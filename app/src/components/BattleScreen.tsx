import { useCallback } from 'react'
import type { Player, Preset } from '@shared/schemas'
import type { PlacedShip } from '@/components/placement/types'
import { BattleFleetGrid } from './battle/BattleFleetGrid'
import { TargetingGrid } from './battle/TargetingGrid'
import { useBattleSSE } from './battle/useBattleSSE'
import { useFireShot } from './battle/useFireShot'

type BattleScreenProps = {
  gameId: string
  playerId: string
  playerName?: string
  preset: Preset
  placedShips: PlacedShip[]
  currentTurn: string
  onGameOver: (winnerId: string, loserId: string, winner: Player, loser: Player) => void
}

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes)}:${String(seconds).padStart(2, '0')}`
}

export function BattleScreen({
  gameId,
  playerId,
  playerName = 'You',
  preset,
  placedShips,
  currentTurn,
  onGameOver,
}: BattleScreenProps) {
  const resolveName = useCallback(
    (id: string) => (id === playerId ? playerName : 'Opponent'),
    [playerId, playerName],
  )

  const battle = useBattleSSE({
    gameId,
    playerId,
    preset,
    initialTurn: currentTurn,
    resolveName,
    onGameOver,
  })

  const { pending, fire } = useFireShot(gameId, playerId, battle.myShots.size)

  const isMyTurn = battle.currentTurn === playerId
  const canFire = isMyTurn && !pending && !battle.frozen

  return (
    <div className="bg-background text-foreground min-h-screen bg-[oklch(0.16_0.04_255)] p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <header
          className="flex items-center justify-between rounded-lg border px-5 py-3"
          aria-live="polite"
        >
          <span className="font-heading text-xl font-bold tracking-tight">
            {isMyTurn ? 'Your turn' : 'Waiting for opponent…'}
          </span>
          <span
            className="font-mono text-xl font-semibold tabular-nums"
            aria-label="Time remaining"
          >
            {formatTime(battle.secondsRemaining)}
          </span>
        </header>

        {battle.notifications.length > 0 && (
          <ul className="space-y-1" aria-live="polite">
            {battle.notifications.map((message, index) => (
              <li
                key={`${message}-${String(index)}`}
                className="border-border bg-card/70 rounded-md border px-3 py-1.5 text-sm"
              >
                {message}
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-wrap items-start gap-10">
          <section className="space-y-2">
            <h2 className="text-muted-foreground text-sm font-semibold tracking-wider uppercase">
              Your fleet
            </h2>
            <BattleFleetGrid placedShips={placedShips} opponentShots={battle.opponentShots} />
          </section>

          <section className="space-y-2">
            <h2 className="text-muted-foreground text-sm font-semibold tracking-wider uppercase">
              Targeting
            </h2>
            <TargetingGrid
              myShots={battle.myShots}
              sunkShips={battle.sunkOpponentShips}
              canFire={canFire}
              onFire={fire}
            />
          </section>
        </div>
      </div>
    </div>
  )
}
