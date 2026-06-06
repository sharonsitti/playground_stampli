import { useEffect, useRef } from 'react'
import {
  BattleStartEvent,
  GameOverEvent,
  PlacementExpiredEvent,
  PlayerJoinedEvent,
  PlayerReadyEvent,
  ShotFiredEvent,
  TimerTickEvent,
  TurnExpiredEvent,
} from '@shared/schemas'

const API_BASE = 'http://localhost:8000'

export type GameSSECallbacks = {
  onPlayerJoined?: (data: PlayerJoinedEvent) => void
  onTimerTick?: (data: TimerTickEvent) => void
  onPlayerReady?: (data: PlayerReadyEvent) => void
  onBattleStart?: (data: BattleStartEvent) => void
  onPlacementExpired?: () => void
  onShotFired?: (data: ShotFiredEvent) => void
  onTurnExpired?: (data: TurnExpiredEvent) => void
  onGameOver?: (data: GameOverEvent) => void
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

    source.addEventListener('shot_fired', (event: MessageEvent<string>) => {
      const data = ShotFiredEvent.parse(JSON.parse(event.data) as unknown)
      callbacksRef.current.onShotFired?.(data)
    })

    source.addEventListener('turn_expired', (event: MessageEvent<string>) => {
      const data = TurnExpiredEvent.parse(JSON.parse(event.data) as unknown)
      callbacksRef.current.onTurnExpired?.(data)
    })

    source.addEventListener('game_over', (event: MessageEvent<string>) => {
      const data = GameOverEvent.parse(JSON.parse(event.data) as unknown)
      callbacksRef.current.onGameOver?.(data)
    })

    return () => {
      source.close()
    }
  }, [gameId])
}
