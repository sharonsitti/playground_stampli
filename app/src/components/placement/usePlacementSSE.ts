import { useEffect } from 'react'

const API = 'http://localhost:8000'

type PlacementSSEHandlers = {
  gameId: string
  onTimerTick: (secondsRemaining: number) => void
  onPlayerReady: (playerId: string) => void
  onBattleStart: (currentTurn: string) => void
  onPlacementExpired: () => void
}

export function usePlacementSSE({
  gameId,
  onTimerTick,
  onPlayerReady,
  onBattleStart,
  onPlacementExpired,
}: PlacementSSEHandlers): void {
  useEffect(() => {
    if (!gameId) return

    const source = new EventSource(`${API}/api/games/${gameId}/events`)

    source.addEventListener('timer_tick', (event) => {
      const { seconds_remaining } = JSON.parse((event as MessageEvent<string>).data) as {
        seconds_remaining: number
      }
      onTimerTick(seconds_remaining)
    })

    source.addEventListener('player_ready', (event) => {
      const { player_id } = JSON.parse((event as MessageEvent<string>).data) as {
        player_id: string
      }
      onPlayerReady(player_id)
    })

    source.addEventListener('battle_start', (event) => {
      const { current_turn } = JSON.parse((event as MessageEvent<string>).data) as {
        current_turn: string
      }
      onBattleStart(current_turn)
    })

    source.addEventListener('placement_expired', () => {
      onPlacementExpired()
    })

    return () => {
      source.close()
    }
  }, [gameId, onTimerTick, onPlayerReady, onBattleStart, onPlacementExpired])
}
