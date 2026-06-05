import { useState } from 'react'
import { type BattleStartEvent } from '@shared/schemas'
import { BattleScreen } from '@/components/BattleScreen'
import { LobbyScreen } from '@/components/LobbyScreen'
import { PlacementScreen } from '@/components/PlacementScreen'
import { WelcomeScreen, type Player } from '@/components/WelcomeScreen'
import type { PlacedShip } from '@/hooks/usePlacement'

type View = 'welcome' | 'lobby' | 'placement' | 'battle' | 'gameover'

const PLAYER_STORAGE_KEY = 'battleship.player'

function loadStoredPlayer(): Player | null {
  const raw = sessionStorage.getItem(PLAYER_STORAGE_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Player
    return parsed.id && parsed.name ? parsed : null
  } catch {
    return null
  }
}

function ViewPlaceholder({ label }: { label: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F6F8] text-sm text-[#64748B]">
      {label} — coming soon
    </div>
  )
}

export default function App() {
  const [view, setView] = useState<View>('welcome')
  const [player, setPlayer] = useState<Player | null>(loadStoredPlayer)
  const [gameId, setGameId] = useState<string | null>(null)
  const [placedShips, setPlacedShips] = useState<PlacedShip[]>([])
  const [firstTurn, setFirstTurn] = useState<string | null>(null)

  function handleRegistered(registered: Player) {
    sessionStorage.setItem(PLAYER_STORAGE_KEY, JSON.stringify(registered))
    setPlayer(registered)
    setView('lobby')
  }

  function handleJoinPlacement(joinedGameId: string) {
    setGameId(joinedGameId)
    setView('placement')
  }

  function handleBattleStart(event: BattleStartEvent, ships: PlacedShip[]) {
    setPlacedShips(ships)
    setFirstTurn(event.current_turn)
    setView('battle')
  }

  function handleExpired() {
    setGameId(null)
    setView('lobby')
  }

  switch (view) {
    case 'welcome':
      return <WelcomeScreen onRegistered={handleRegistered} />
    case 'lobby':
      return player ? (
        <LobbyScreen player={player} onJoinPlacement={handleJoinPlacement} />
      ) : (
        <WelcomeScreen onRegistered={handleRegistered} />
      )
    case 'placement':
      return player && gameId ? (
        <PlacementScreen
          gameId={gameId}
          playerId={player.id}
          onBattleStart={handleBattleStart}
          onExpired={handleExpired}
        />
      ) : (
        <ViewPlaceholder label="Placement" />
      )
    case 'battle':
      return player && gameId && firstTurn ? (
        <BattleScreen
          gameId={gameId}
          playerId={player.id}
          firstTurn={firstTurn}
          placedShips={placedShips}
          onGameOver={() => {
            // PR6 wires game-over navigation; PR5 holds state so the final shot renders.
          }}
        />
      ) : (
        <ViewPlaceholder label="Battle" />
      )
    case 'gameover':
      return <ViewPlaceholder label="Game Over" />
  }
}
