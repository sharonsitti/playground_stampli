import { useCallback, useState } from 'react'
import type { CreateGameResponse, GameSummary, JoinGameResponse, Preset } from '@shared/schemas'
import { Button } from '@/components/ui/button'
import { CreateGameModal } from './lobby/CreateGameModal'
import { GameList } from './lobby/GameList'
import { HoldingCard } from './lobby/HoldingCard'
import { useLobbyGames } from './lobby/useLobbyGames'
import { usePlayerJoined } from './lobby/usePlayerJoined'

const API = 'http://localhost:8000'

type LobbyScreenProps = {
  playerId: string
  playerName: string
  expiredMessage?: boolean
  onDismissExpired?: () => void
  onGameJoined: (gameId: string, preset: Preset) => void
}

type Holding = { gameId: string; preset: Preset }

export function LobbyScreen({
  playerId,
  expiredMessage = false,
  onDismissExpired,
  onGameJoined,
}: LobbyScreenProps) {
  const [holding, setHolding] = useState<Holding | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const games = useLobbyGames(holding === null)
  const visibleGames = games.filter((game) => game.creator.id !== playerId)

  usePlayerJoined(
    holding?.gameId ?? null,
    useCallback(() => {
      if (holding) onGameJoined(holding.gameId, holding.preset)
    }, [holding, onGameJoined]),
  )

  async function handleCreate(preset: Preset) {
    const res = await fetch(`${API}/api/games`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ creator_id: playerId, preset }),
    })
    if (!res.ok) return
    const game = (await res.json()) as CreateGameResponse
    setShowCreateModal(false)
    setHolding({ gameId: game.id, preset: game.preset })
  }

  async function handleJoin(game: GameSummary) {
    const res = await fetch(`${API}/api/games/${game.id}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ player_id: playerId }),
    })
    if (!res.ok) return
    const joined = (await res.json()) as JoinGameResponse
    onGameJoined(joined.id, joined.preset)
  }

  async function handleCancel() {
    if (!holding) return
    const res = await fetch(`${API}/api/games/${holding.gameId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ player_id: playerId }),
    })
    if (!res.ok) return
    setHolding(null)
  }

  return (
    <div className="bg-background text-foreground min-h-screen bg-[oklch(0.16_0.04_255)] p-6">
      <div className="mx-auto max-w-2xl space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="font-heading text-2xl font-bold tracking-tight">Lobby</h1>
          {holding === null && (
            <Button
              type="button"
              onClick={() => {
                setShowCreateModal(true)
              }}
            >
              Create Game
            </Button>
          )}
        </header>

        {expiredMessage && (
          <div
            role="alert"
            className="border-destructive/40 bg-destructive/10 text-destructive flex items-center justify-between gap-4 rounded-lg border px-4 py-3 text-sm"
          >
            <span>Game timed out — placement timer expired</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                onDismissExpired?.()
              }}
            >
              Dismiss
            </Button>
          </div>
        )}

        {holding ? (
          <HoldingCard
            preset={holding.preset}
            onCancel={() => {
              void handleCancel()
            }}
          />
        ) : (
          <GameList
            games={visibleGames}
            onJoin={(game) => {
              void handleJoin(game)
            }}
          />
        )}
      </div>

      <CreateGameModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onCreate={(selected) => {
          void handleCreate(selected)
        }}
      />
    </div>
  )
}
