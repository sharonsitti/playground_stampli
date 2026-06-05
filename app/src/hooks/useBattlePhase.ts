import { useEffect, useRef, useState } from 'react'
import {
  GameOverEventSchema,
  ShotFiredEventSchema,
  TimerTickEventSchema,
  TurnExpiredEventSchema,
  type Cell,
  type GameOverEvent,
  type ShipType,
} from '@shared/schemas'
import { parseSseData } from '@/lib/sse'

const gameEventsEndpoint = (gameId: string) => `http://localhost:8000/api/games/${gameId}/events`
const shotEndpoint = (gameId: string) => `http://localhost:8000/api/games/${gameId}/shot`

export type ShotMark = 'hit' | 'miss'

export type SunkNotice = { shipType: ShipType }
export type TurnExpiredNotice = { byMe: boolean }

export function cellKey(col: number, row: number) {
  return `${String(col)},${String(row)}`
}

type BattlePhaseArgs = {
  gameId: string
  playerId: string
  firstTurn: string
  onGameOver: (event: GameOverEvent) => void
}

export function useBattlePhase({ gameId, playerId, firstTurn, onGameOver }: BattlePhaseArgs) {
  const [currentTurn, setCurrentTurn] = useState(firstTurn)
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null)
  const [targetingShots, setTargetingShots] = useState<Map<string, ShotMark>>(() => new Map())
  const [incomingShots, setIncomingShots] = useState<Map<string, ShotMark>>(() => new Map())
  const [sunkCells, setSunkCells] = useState<Set<string>>(() => new Set())
  const [sunkNotice, setSunkNotice] = useState<SunkNotice | null>(null)
  const [turnExpired, setTurnExpired] = useState<TurnExpiredNotice | null>(null)
  const [firing, setFiring] = useState(false)

  const onGameOverRef = useRef(onGameOver)
  useEffect(() => {
    onGameOverRef.current = onGameOver
  }, [onGameOver])

  useEffect(() => {
    const source = new EventSource(gameEventsEndpoint(gameId))

    source.addEventListener('timer_tick', (e) => {
      const parsed = TimerTickEventSchema.safeParse(parseSseData(e))
      if (parsed.success) setSecondsRemaining(parsed.data.seconds_remaining)
    })

    source.addEventListener('shot_fired', (e) => {
      const parsed = ShotFiredEventSchema.safeParse(parseSseData(e))
      if (!parsed.success) return
      const shot = parsed.data
      const key = cellKey(shot.col, shot.row)
      const mark: ShotMark = shot.hit ? 'hit' : 'miss'

      if (shot.shooter_id === playerId) {
        setTargetingShots((prev) => new Map(prev).set(key, mark))
        if (shot.sunk && shot.ship_cells) {
          markSunk(setSunkCells, shot.ship_cells)
        }
      } else {
        setIncomingShots((prev) => new Map(prev).set(key, mark))
      }

      setSunkNotice(shot.sunk && shot.ship_type ? { shipType: shot.ship_type } : null)
      setTurnExpired(null)
      setCurrentTurn(shot.next_turn)
      setFiring(false)
    })

    source.addEventListener('turn_expired', (e) => {
      const parsed = TurnExpiredEventSchema.safeParse(parseSseData(e))
      if (!parsed.success) return
      setTurnExpired({ byMe: parsed.data.player_id === playerId })
      setSunkNotice(null)
      setCurrentTurn(parsed.data.next_turn)
      setFiring(false)
    })

    source.addEventListener('game_over', (e) => {
      const parsed = GameOverEventSchema.safeParse(parseSseData(e))
      if (parsed.success) onGameOverRef.current(parsed.data)
    })

    return () => {
      source.close()
    }
  }, [gameId, playerId])

  const isMyTurn = currentTurn === playerId

  function fireShot(col: number, row: number) {
    const key = cellKey(col, row)
    if (!isMyTurn || firing || targetingShots.has(key)) return
    setFiring(true)
    fetch(shotEndpoint(gameId), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ player_id: playerId, col, row }),
    })
      .then((res) => {
        if (!res.ok) setFiring(false)
      })
      .catch(() => {
        setFiring(false)
      })
  }

  return {
    isMyTurn,
    secondsRemaining,
    targetingShots,
    incomingShots,
    sunkCells,
    sunkNotice,
    turnExpired,
    firing,
    fireShot,
  }
}

function markSunk(setSunkCells: React.Dispatch<React.SetStateAction<Set<string>>>, cells: Cell[]) {
  setSunkCells((prev) => {
    const next = new Set(prev)
    for (const c of cells) next.add(cellKey(c.col, c.row))
    return next
  })
}
