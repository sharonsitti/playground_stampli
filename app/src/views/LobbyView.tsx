import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import type { GetGamesResponse } from '@shared/schemas'
import { Button } from '@/components/ui/button'
import { ConflictError, createGame, deleteGame, getGames, joinGame } from '@/lib/api'
import { useGameSSE } from '@/hooks/useGameSSE'
import { useLobbySSE } from '@/hooks/useLobbySSE'
import { CreateGameModal } from './lobby/CreateGameModal'
import { GameRow } from './lobby/GameRow'
import { HoldingCard } from './lobby/HoldingCard'

type Game = GetGamesResponse['games'][number]
type Preset = 'quick' | 'casual'

type LobbyState = { phase: 'browsing' } | { phase: 'holding'; gameId: string; preset: Preset }

type LobbyViewProps = {
  playerId: string
  playerName: string
  onGameJoined: (gameId: string, preset: Preset, role: 'creator' | 'joiner') => void
}

export function LobbyView({ playerId, onGameJoined }: LobbyViewProps) {
  const [initialGames, setInitialGames] = useState<Game[]>([])
  const games = useLobbySSE(initialGames)
  const [state, setState] = useState<LobbyState>({ phase: 'browsing' })
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    let active = true
    void getGames().then((loaded) => {
      if (active) setInitialGames(loaded)
    })
    return () => {
      active = false
    }
  }, [])

  const holdingGameId = state.phase === 'holding' ? state.gameId : null
  useGameSSE(holdingGameId, () => {
    if (state.phase === 'holding') {
      onGameJoined(state.gameId, state.preset, 'creator')
    }
  })

  const handleCreate = (preset: Preset) => {
    setModalOpen(false)
    void createGame(playerId, preset)
      .then((game) => {
        setState({ phase: 'holding', gameId: game.id, preset: game.preset })
      })
      .catch((err: unknown) => {
        if (err instanceof ConflictError) return
        throw err
      })
  }

  const handleJoin = (game: Game) => {
    void joinGame(game.id, playerId)
      .then((joined) => {
        onGameJoined(joined.id, joined.preset, 'joiner')
      })
      .catch((err: unknown) => {
        if (err instanceof ConflictError) return
        throw err
      })
  }

  const handleCancel = () => {
    if (state.phase !== 'holding') return
    const { gameId } = state
    void deleteGame(gameId, playerId)
      .then(() => {
        setState({ phase: 'browsing' })
      })
      .catch((err: unknown) => {
        if (err instanceof ConflictError) return
        throw err
      })
  }

  const visibleGames = games.filter((g) => g.creator.id !== playerId)

  return (
    <div className="bg-background min-h-screen">
      <main className="mx-auto max-w-[640px] px-6 pt-8">
        <header className="mb-4 flex items-end justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold text-[#0F172A]">Lobby</h1>
            <p className="text-sm text-[#64748B]">Open games ready to join</p>
          </div>
          {state.phase === 'browsing' ? (
            <Button
              size="sm"
              onClick={() => {
                setModalOpen(true)
              }}
            >
              <Plus aria-hidden="true" />
              Create Game
            </Button>
          ) : null}
        </header>

        {state.phase === 'holding' ? (
          <HoldingCard preset={state.preset} onCancel={handleCancel} />
        ) : visibleGames.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[#E5E7EB] px-6 py-10 text-center text-sm text-[#94A3B8]">
            No open games yet. Create one to get started.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {visibleGames.map((game) => (
              <GameRow key={game.id} game={game} onJoin={handleJoin} />
            ))}
          </ul>
        )}
      </main>

      <CreateGameModal open={modalOpen} onOpenChange={setModalOpen} onConfirm={handleCreate} />
    </div>
  )
}
