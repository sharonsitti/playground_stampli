import { useEffect, useRef } from 'react'
import {
  BattleStartEvent,
  PlacementExpiredEvent,
  PlayerJoinedEvent,
  PlayerReadyEvent,
  TimerTickEvent,
} from '@shared/schemas'

const API_BASE = 'http://localhost:8000'

export type GameSSECallbacks = {
  onPlayerJoined?: (data: { joiner: { id: string; name: string }; timer_seconds: number }) => void
  onTimerTick?: (data: { seconds_remaining: number }) => void
  onPlayerReady?: (data: { player_id: string }) => void
  onBattleStart?: (data: { current_turn: string; timer_seconds: number }) => void
  onPlacementExpired?: () => void
}

export function useGameSSE(gameId: string | null, callbacks: GameSSECallbacks): void {
  const callbacksRef = useRef(callbacks)

  useEffect(() => {
    callbacksRef.current = callbacks
  })

  useEffect(() => {
    if (!gameId) return

    const source = new EventSource(`${API_BASE}/api/games/${gameId}/events`)

    source.addEventListener('player_joined', (event: MessageEvent<string>) => {
      const data = PlayerJoinedEvent.parse(JSON.parse(event.data) as unknown)
      callbacksRef.current.onPlayerJoined?.(data)
    })

    source.addEventListener('timer_tick', (event: MessageEvent<string>) => {
      const data = TimerTickEvent.parse(JSON.parse(event.data) as unknown)
      callbacksRef.current.onTimerTick?.(data)
    })

    source.addEventListener('player_ready', (event: MessageEvent<string>) => {
      const data = PlayerReadyEvent.parse(JSON.parse(event.data) as unknown)
      callbacksRef.current.onPlayerReady?.(data)
    })

    source.addEventListener('battle_start', (event: MessageEvent<string>) => {
      const data = BattleStartEvent.parse(JSON.parse(event.data) as unknown)
      callbacksRef.current.onBattleStart?.(data)
    })

    source.addEventListener('placement_expired', (event: MessageEvent<string>) => {
      PlacementExpiredEvent.parse(JSON.parse(event.data) as unknown)
      callbacksRef.current.onPlacementExpired?.()
    })

    return () => {
      source.close()
    }
  }, [gameId])
}
