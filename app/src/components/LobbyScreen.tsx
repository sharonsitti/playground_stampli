import { useState } from 'react'
import { Plus } from 'lucide-react'
import { CreateGameModal } from '@/components/CreateGameModal'
import { GameRow } from '@/components/GameRow'
import { WaitingCard } from '@/components/WaitingCard'
import { Button } from '@/components/ui/button'
import type { Player } from '@/components/WelcomeScreen'
import { useLobby } from '@/hooks/useLobby'

type LobbyScreenProps = {
  player: Player
  onJoinPlacement: (gameId: string) => void
}

export function LobbyScreen({ player, onJoinPlacement }: LobbyScreenProps) {
  const lobby = useLobby(player, onJoinPlacement)
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#F5F6F8] px-6 pt-8">
      <div className="mx-auto w-full max-w-[640px]">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#0F172A]">Lobby</h1>
            <p className="text-sm text-[#64748B]">Open games ready to join</p>
          </div>
          {!lobby.holding && (
            <Button
              onClick={() => {
                setModalOpen(true)
              }}
              className="h-8 gap-1.5 rounded-lg bg-[#4F46E5] px-3 text-sm font-semibold text-white hover:bg-[#4338CA]"
            >
              <Plus className="size-4" />
              Create Game
            </Button>
          )}
        </div>

        {lobby.holding ? (
          <WaitingCard preset={lobby.holding.preset} onCancel={lobby.cancelHolding} />
        ) : lobby.games.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[#E5E7EB] bg-white px-4 py-10 text-center text-sm text-[#94A3B8]">
            No open games yet. Create one to wait for an opponent.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {lobby.games.map((game) => (
              <GameRow key={game.id} game={game} onJoin={lobby.joinGame} />
            ))}
          </ul>
        )}
      </div>

      <CreateGameModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        isCreating={lobby.isCreating}
        onConfirm={(preset) => {
          lobby.createGame(preset)
          setModalOpen(false)
        }}
      />
    </div>
  )
}
