import { useEffect } from 'react'
import { GameCreatedEventSchema, GameRemovedEventSchema, type LobbyGame } from '@shared/schemas'
import { parseSseData } from '@/lib/sse'

const LOBBY_EVENTS_ENDPOINT = 'http://localhost:8000/api/lobby/events'

type LobbyEventHandlers = {
  onGameCreated: (game: LobbyGame) => void
  onGameRemoved: (id: string) => void
}

export function useLobbyEvents({ onGameCreated, onGameRemoved }: LobbyEventHandlers) {
  useEffect(() => {
    const source = new EventSource(LOBBY_EVENTS_ENDPOINT)

    source.addEventListener('game_created', (e) => {
      const parsed = GameCreatedEventSchema.safeParse(parseSseData(e))
      if (parsed.success) onGameCreated(parsed.data)
    })
    source.addEventListener('game_removed', (e) => {
      const parsed = GameRemovedEventSchema.safeParse(parseSseData(e))
      if (parsed.success) onGameRemoved(parsed.data.id)
    })

    return () => {
      source.close()
    }
  }, [onGameCreated, onGameRemoved])
}
