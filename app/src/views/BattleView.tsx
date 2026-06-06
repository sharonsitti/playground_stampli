import type { GameOverEvent } from '@shared/schemas'
import type { PlacedShip } from '@/views/placement/usePlacement'
import { BattleBanner } from './battle/BattleBanner'
import { BattleNotifications } from './battle/BattleNotifications'
import { FleetBattleGrid } from './battle/FleetBattleGrid'
import { TargetingGrid } from './battle/TargetingGrid'
import { useBattle } from './battle/useBattle'

type BattleViewProps = {
  gameId: string
  playerId: string
  placedShips: PlacedShip[]
  role: 'creator' | 'joiner'
  onGameOver: (data: GameOverEvent) => void
}

export function BattleView({ gameId, playerId, placedShips, role, onGameOver }: BattleViewProps) {
  const initialTurn = role === 'creator' ? playerId : null
  const battle = useBattle(gameId, playerId, initialTurn, onGameOver)

  return (
    <div className="bg-background min-h-screen">
      <BattleBanner
        isMyTurn={battle.isMyTurn}
        gameOver={battle.gameOver}
        secondsRemaining={battle.secondsRemaining}
      />

      <main className="mx-auto flex max-w-[820px] flex-col gap-6 px-6 py-8">
        <div className="flex flex-wrap gap-6">
          <FleetBattleGrid placedShips={placedShips} incomingShots={battle.incomingShots} />
          <TargetingGrid
            myShots={battle.myShots}
            sunkOpponentShips={battle.sunkOpponentShips}
            interactive={battle.isMyTurn && !battle.shotPending && !battle.gameOver}
            onFire={battle.fireAt}
          />
        </div>

        <div className="flex items-center gap-3 text-xs text-[#64748B]">
          <span>
            <span className="text-[#EF4444]">●</span> Hit
          </span>
          <span>
            <span className="text-[#CBD5E1]">○</span> Miss
          </span>
        </div>

        <BattleNotifications notifications={battle.notifications} />
      </main>
    </div>
  )
}
