import { useState } from 'react'
import type { GameOverEvent, ShotFiredEvent, TurnExpiredEvent } from '@shared/schemas'
import { useGameSSE } from '@/hooks/useGameSSE'
import { ConflictError, fireShot } from '@/lib/api'

export type Cell = { col: number; row: number }
export type Shot = { col: number; row: number; hit: boolean }
export type SunkShip = { type: string; cells: Cell[] }

export type Notification = { id: number; kind: 'sunk' | 'expired'; text: string }

export type Battle = {
  isMyTurn: boolean
  gameOver: boolean
  shotPending: boolean
  secondsRemaining: number | null
  myShots: Shot[]
  incomingShots: Shot[]
  sunkOpponentShips: SunkShip[]
  notifications: Notification[]
  fireAt: (cell: Cell) => void
}

const SHIP_LABELS: Record<string, string> = {
  carrier: 'Carrier',
  battleship: 'Battleship',
  cruiser: 'Cruiser',
  submarine: 'Submarine',
  destroyer: 'Destroyer',
}

const key = (col: number, row: number) => `${String(col)},${String(row)}`

export function useBattle(
  gameId: string,
  playerId: string,
  initialTurn: string | null,
  onGameOver: (data: GameOverEvent) => void,
): Battle {
  const [currentTurn, setCurrentTurn] = useState<string | null>(initialTurn)
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null)
  const [myShots, setMyShots] = useState<Shot[]>([])
  const [incomingShots, setIncomingShots] = useState<Shot[]>([])
  const [sunkOpponentShips, setSunkOpponentShips] = useState<SunkShip[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [shotPending, setShotPending] = useState(false)
  const [gameOver, setGameOver] = useState(false)

  const isMyTurn = currentTurn === playerId

  const pushNotification = (kind: Notification['kind'], text: string) => {
    const id = Date.now() + Math.random()
    setNotifications((prev) => [...prev, { id, kind, text }])
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    }, 4000)
  }

  const onShotFired = (data: ShotFiredEvent) => {
    const shot: Shot = { col: data.col, row: data.row, hit: data.hit }
    const sunkType = data.sunk ? data.ship_type : null
    const sunkLabel = sunkType ? (SHIP_LABELS[sunkType] ?? sunkType) : null

    if (data.shooter_id === playerId) {
      setMyShots((prev) => [...prev, shot])
      if (sunkType && data.ship_cells) {
        const cells = data.ship_cells
        setSunkOpponentShips((prev) => [...prev, { type: sunkType, cells }])
      }
    } else {
      setIncomingShots((prev) => [...prev, shot])
    }

    if (sunkLabel) pushNotification('sunk', `● ${sunkLabel} sunk!`)

    setShotPending(false)

    if (data.next_turn === data.shooter_id) {
      setGameOver(true)
      setSecondsRemaining(null)
      return
    }
    setCurrentTurn(data.next_turn)
  }

  const onTurnExpired = (data: TurnExpiredEvent) => {
    const who = data.player_id === playerId ? 'You' : 'Opponent'
    pushNotification('expired', `${who} ran out of time — turn skipped`)
    setCurrentTurn(data.next_turn)
  }

  useGameSSE(gameId, {
    onTimerTick: ({ seconds_remaining }) => {
      setSecondsRemaining(seconds_remaining)
    },
    onBattleStart: ({ current_turn }) => {
      setCurrentTurn(current_turn)
    },
    onShotFired,
    onTurnExpired,
    onGameOver,
  })

  const fired = new Set(myShots.map((s) => key(s.col, s.row)))

  const fireAt = (cell: Cell) => {
    if (!isMyTurn || shotPending || gameOver) return
    if (fired.has(key(cell.col, cell.row))) return
    setShotPending(true)
    void fireShot(gameId, playerId, cell.col, cell.row).catch((err: unknown) => {
      setShotPending(false)
      if (err instanceof ConflictError) return
      throw err
    })
  }

  return {
    isMyTurn,
    gameOver,
    shotPending,
    secondsRemaining,
    myShots,
    incomingShots,
    sunkOpponentShips,
    notifications,
    fireAt,
  }
}
