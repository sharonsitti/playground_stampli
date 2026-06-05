import { useEffect, useRef, useState } from 'react'
import {
  BattleStartEventSchema,
  PlacementExpiredEventSchema,
  PlayerReadyEventSchema,
  TimerTickEventSchema,
  type BattleStartEvent,
} from '@shared/schemas'
import type { PlacedShip } from '@/hooks/usePlacement'
import { parseSseData } from '@/lib/sse'

const gameEventsEndpoint = (gameId: string) => `http://localhost:8000/api/games/${gameId}/events`
const placeEndpoint = (gameId: string) => `http://localhost:8000/api/games/${gameId}/place`
const readyEndpoint = (gameId: string) => `http://localhost:8000/api/games/${gameId}/ready`

type PlacementPhaseCallbacks = {
  gameId: string
  playerId: string
  onBattleStart: (event: BattleStartEvent) => void
}

export function usePlacementPhase({ gameId, playerId, onBattleStart }: PlacementPhaseCallbacks) {
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null)
  const [readyPlayers, setReadyPlayers] = useState<Set<string>>(() => new Set())
  const [locked, setLocked] = useState(false)
  const [expired, setExpired] = useState(false)

  const onBattleStartRef = useRef(onBattleStart)
  useEffect(() => {
    onBattleStartRef.current = onBattleStart
  }, [onBattleStart])

  useEffect(() => {
    const source = new EventSource(gameEventsEndpoint(gameId))

    source.addEventListener('timer_tick', (e) => {
      const parsed = TimerTickEventSchema.safeParse(parseSseData(e))
      if (parsed.success) setSecondsRemaining(parsed.data.seconds_remaining)
    })
    source.addEventListener('player_ready', (e) => {
      const parsed = PlayerReadyEventSchema.safeParse(parseSseData(e))
      if (parsed.success) {
        setReadyPlayers((prev) => new Set(prev).add(parsed.data.player_id))
      }
    })
    source.addEventListener('battle_start', (e) => {
      const parsed = BattleStartEventSchema.safeParse(parseSseData(e))
      if (parsed.success) onBattleStartRef.current(parsed.data)
    })
    source.addEventListener('placement_expired', (e) => {
      if (PlacementExpiredEventSchema.safeParse(parseSseData(e)).success) setExpired(true)
    })

    return () => {
      source.close()
    }
  }, [gameId])

  async function submitReady(ships: PlacedShip[]) {
    setLocked(true)
    await fetch(placeEndpoint(gameId), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ player_id: playerId, ships }),
    })
    await fetch(readyEndpoint(gameId), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ player_id: playerId }),
    })
  }

  return {
    secondsRemaining,
    readyCount: readyPlayers.size,
    locked,
    expired,
    submitReady,
  }
}
