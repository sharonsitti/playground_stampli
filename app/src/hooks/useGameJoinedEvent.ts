import { useEffect } from 'react'
import { PlayerJoinedEventSchema } from '@shared/schemas'
import { parseSseData } from '@/lib/sse'

const gameEventsEndpoint = (gameId: string) => `http://localhost:8000/api/games/${gameId}/events`

export function useGameJoinedEvent(gameId: string | null, onJoined: (gameId: string) => void) {
  useEffect(() => {
    if (!gameId) return

    const source = new EventSource(gameEventsEndpoint(gameId))
    source.addEventListener('player_joined', (e) => {
      const parsed = PlayerJoinedEventSchema.safeParse(parseSseData(e))
      if (parsed.success) onJoined(gameId)
    })

    return () => {
      source.close()
    }
  }, [gameId, onJoined])
}
