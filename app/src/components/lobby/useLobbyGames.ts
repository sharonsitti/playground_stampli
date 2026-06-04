import { useEffect, useState } from 'react'
import type { GameSummary } from '@shared/schemas'

const API = 'http://localhost:8000'

export function useLobbyGames(active: boolean): GameSummary[] {
  const [games, setGames] = useState<GameSummary[]>([])

  useEffect(() => {
    if (!active) return

    let cancelled = false

    void fetch(`${API}/api/games`)
      .then((res) => res.json() as Promise<{ games: GameSummary[] }>)
      .then((body) => {
        if (!cancelled) setGames(body.games)
      })
      .catch(() => {
        if (!cancelled) setGames([])
      })

    const source = new EventSource(`${API}/api/lobby/events`)

    source.addEventListener('game_created', (event) => {
      const game = JSON.parse((event as MessageEvent<string>).data) as GameSummary
      setGames((prev) => (prev.some((g) => g.id === game.id) ? prev : [...prev, game]))
    })

    source.addEventListener('game_removed', (event) => {
      const { id } = JSON.parse((event as MessageEvent<string>).data) as { id: string }
      setGames((prev) => prev.filter((g) => g.id !== id))
    })

    return () => {
      cancelled = true
      source.close()
    }
  }, [active])

  return games
}
