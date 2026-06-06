import { useEffect, useRef } from 'react'
import { PlayerJoinedEvent } from '@shared/schemas'

const API_BASE = 'http://localhost:8000'

export function useGameSSE(gameId: string | null, onPlayerJoined: () => void): void {
  const onPlayerJoinedRef = useRef(onPlayerJoined)

  useEffect(() => {
    onPlayerJoinedRef.current = onPlayerJoined
  })

  useEffect(() => {
    if (!gameId) return

    const source = new EventSource(`${API_BASE}/api/games/${gameId}/events`)

    source.addEventListener('player_joined', (event: MessageEvent<string>) => {
      PlayerJoinedEvent.parse(JSON.parse(event.data) as unknown)
      onPlayerJoinedRef.current()
    })

    return () => {
      source.close()
    }
  }, [gameId])
}
