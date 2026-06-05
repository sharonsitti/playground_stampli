import { useCallback, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  CreateGameResponseSchema,
  ListGamesResponseSchema,
  type LobbyGame,
  type Preset,
} from '@shared/schemas'
import type { Player } from '@/components/WelcomeScreen'
import { useGameJoinedEvent } from '@/hooks/useGameJoinedEvent'
import { useLobbyEvents } from '@/hooks/useLobbyEvents'

const GAMES_ENDPOINT = 'http://localhost:8000/api/games'
const GAMES_QUERY_KEY = ['games'] as const

type HoldingGame = {
  id: string
  preset: Preset
}

async function fetchGames(): Promise<LobbyGame[]> {
  const res = await fetch(GAMES_ENDPOINT)
  const body: unknown = await res.json()
  return ListGamesResponseSchema.parse(body).games
}

export function useLobby(player: Player, onEnterPlacement: (gameId: string) => void) {
  const queryClient = useQueryClient()
  const [holding, setHolding] = useState<HoldingGame | null>(null)

  const { data: games = [] } = useQuery({
    queryKey: GAMES_QUERY_KEY,
    queryFn: fetchGames,
  })

  const onGameCreated = useCallback(
    (game: LobbyGame) => {
      queryClient.setQueryData<LobbyGame[]>(GAMES_QUERY_KEY, (prev = []) =>
        prev.some((g) => g.id === game.id) ? prev : [...prev, game],
      )
    },
    [queryClient],
  )

  const onGameRemoved = useCallback(
    (id: string) => {
      queryClient.setQueryData<LobbyGame[]>(GAMES_QUERY_KEY, (prev = []) =>
        prev.filter((g) => g.id !== id),
      )
    },
    [queryClient],
  )

  useLobbyEvents({ onGameCreated, onGameRemoved })
  useGameJoinedEvent(holding?.id ?? null, onEnterPlacement)

  const createGame = useMutation({
    mutationFn: async (preset: Preset) => {
      const res = await fetch(GAMES_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creator_id: player.id, preset }),
      })
      const body: unknown = await res.json()
      return CreateGameResponseSchema.parse(body)
    },
    onSuccess: (game) => {
      setHolding({ id: game.id, preset: game.preset })
    },
  })

  const joinGame = useMutation({
    mutationFn: async (gameId: string) => {
      const res = await fetch(`${GAMES_ENDPOINT}/${gameId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player_id: player.id }),
      })
      if (!res.ok) throw new Error('join_rejected')
      onEnterPlacement(gameId)
    },
  })

  const cancelGame = useMutation({
    mutationFn: async (gameId: string) => {
      await fetch(`${GAMES_ENDPOINT}/${gameId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player_id: player.id }),
      })
    },
    onSettled: () => {
      setHolding(null)
    },
  })

  const visibleGames = games.filter((g) => g.creator.id !== player.id)

  return {
    games: visibleGames,
    holding,
    createGame: (preset: Preset) => {
      createGame.mutate(preset)
    },
    joinGame: (gameId: string) => {
      joinGame.mutate(gameId)
    },
    cancelHolding: () => {
      if (holding) cancelGame.mutate(holding.id)
    },
    isCreating: createGame.isPending,
  }
}
