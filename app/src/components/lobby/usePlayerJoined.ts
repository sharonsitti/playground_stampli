import { useEffect } from 'react'

const API = 'http://localhost:8000'

export function usePlayerJoined(gameId: string | null, onJoined: () => void): void {
  useEffect(() => {
    if (!gameId) return

    const source = new EventSource(`${API}/api/games/${gameId}/events`)
    source.addEventListener('player_joined', () => {
      onJoined()
    })

    return () => {
      source.close()
    }
  }, [gameId, onJoined])
}
