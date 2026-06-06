import { useEffect, useState } from 'react'
import { GameCreatedEvent, GameRemovedEvent, type GetGamesResponse } from '@shared/schemas'

const API_BASE = 'http://localhost:8000'

type Game = GetGamesResponse['games'][number]

export function useLobbySSE(initialGames: Game[]): Game[] {
  const [games, setGames] = useState<Game[]>(initialGames)

  useEffect(() => {
    const source = new EventSource(`${API_BASE}/api/lobby/events`)

    source.addEventListener('game_created', (event: MessageEvent<string>) => {
      const game = GameCreatedEvent.parse(JSON.parse(event.data) as unknown)
      setGames((prev) => (prev.some((g) => g.id === game.id) ? prev : [...prev, game]))
    })

    source.addEventListener('game_removed', (event: MessageEvent<string>) => {
      const { id } = GameRemovedEvent.parse(JSON.parse(event.data) as unknown)
      setGames((prev) => prev.filter((g) => g.id !== id))
    })

    return () => {
      source.close()
    }
  }, [])

  return games
}
