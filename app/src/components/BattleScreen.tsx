import { getOccupiedCells } from '@shared/geometry'
import { type GameOverEvent, type ShipType } from '@shared/schemas'
import { BattleGrid, type BattleCell } from '@/components/BattleGrid'
import type { PlacedShip } from '@/hooks/usePlacement'
import { cellKey, useBattlePhase } from '@/hooks/useBattlePhase'
import { formatTimer } from '@/lib/format'

const SHIP_LABEL = new Map<ShipType, string>([
  ['carrier', 'Carrier'],
  ['battleship', 'Battleship'],
  ['cruiser', 'Cruiser'],
  ['submarine', 'Submarine'],
  ['destroyer', 'Destroyer'],
])

type BattleScreenProps = {
  gameId: string
  playerId: string
  firstTurn: string
  placedShips: PlacedShip[]
  onGameOver: (event: GameOverEvent) => void
}

export function BattleScreen({
  gameId,
  playerId,
  firstTurn,
  placedShips,
  onGameOver,
}: BattleScreenProps) {
  const battle = useBattlePhase({ gameId, playerId, firstTurn, onGameOver })

  const fleetCells = new Set<string>()
  for (const ship of placedShips) {
    for (const c of getOccupiedCells(ship)) fleetCells.add(cellKey(c.col, c.row))
  }

  function targetingCellFor(col: number, row: number): BattleCell {
    const key = cellKey(col, row)
    const mark = battle.targetingShots.get(key)
    if (mark === 'hit') return { visual: 'hit', sunk: battle.sunkCells.has(key) }
    if (mark === 'miss') return { visual: 'miss', sunk: false }
    return { visual: 'empty', sunk: false }
  }

  function fleetCellFor(col: number, row: number): BattleCell {
    const key = cellKey(col, row)
    const mark = battle.incomingShots.get(key)
    if (mark === 'hit') return { visual: 'hit', sunk: false }
    if (mark === 'miss') return { visual: 'miss', sunk: false }
    return { visual: fleetCells.has(key) ? 'ship' : 'empty', sunk: false }
  }

  const timerText = battle.secondsRemaining === null ? '—:—' : formatTimer(battle.secondsRemaining)

  return (
    <div className="flex min-h-screen flex-col bg-[#F5F6F8]">
      <div className="flex items-center justify-between border-b border-[#C7D2FE] bg-[#EEF2FF] px-5 py-3">
        {battle.isMyTurn ? (
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-[#EEF2FF] px-2 py-0.5 text-xs font-semibold tracking-wide text-[#4F46E5] uppercase ring-1 ring-[#C7D2FE]">
              Your turn
            </span>
            <span className="text-sm text-[#64748B]">Click any cell on the targeting grid</span>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-[#F1F5F9] px-2 py-0.5 text-xs font-semibold tracking-wide text-[#64748B] uppercase">
              Waiting for opponent…
            </span>
            <span className="text-sm text-[#64748B]">Opponent is taking their shot</span>
          </div>
        )}
        <span
          className={`text-3xl font-bold tabular-nums ${battle.isMyTurn ? 'text-[#4F46E5]' : 'text-[#94A3B8]'}`}
        >
          {timerText}
        </span>
      </div>

      <div className="mx-auto flex w-full max-w-[760px] flex-col gap-4 px-6 py-8">
        <div className="flex gap-6">
          <BattleGrid label="Your Fleet" cellFor={fleetCellFor} />
          <BattleGrid
            label="Targeting Grid"
            cellFor={targetingCellFor}
            interactive={battle.isMyTurn && !battle.firing}
            onFire={battle.fireShot}
          />
        </div>

        {battle.sunkNotice && (
          <div
            role="status"
            className="rounded-lg bg-[#FEE2E2] px-3.5 py-2 text-sm font-medium text-[#B91C1C]"
          >
            ● {SHIP_LABEL.get(battle.sunkNotice.shipType) ?? battle.sunkNotice.shipType} sunk!
          </div>
        )}

        {battle.turnExpired && (
          <div
            role="status"
            className="rounded-r-md border-l-[3px] border-[#FB923C] bg-[#FFF7ED] px-3.5 py-2.5 text-sm text-[#92400E]"
          >
            {battle.turnExpired.byMe ? 'You' : 'Opponent'} ran out of time — turn skipped
          </div>
        )}

        <div className="flex gap-3 text-xs text-[#64748B]">
          <span>
            <span className="text-[#EF4444]">●</span> Hit
          </span>
          <span>
            <span className="text-[#CBD5E1]">○</span> Miss
          </span>
        </div>
      </div>
    </div>
  )
}
