import { useState } from 'react'
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

  function handleRegistered(registered: Player) {
    sessionStorage.setItem(PLAYER_STORAGE_KEY, JSON.stringify(registered))
    setPlayer(registered)
    setView('lobby')
  }

  function handleJoinPlacement(_gameId: string) {
    setView('placement')
  }

  function handleReady(_ships: PlacedShip[]) {
    setView('battle')
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
      return <PlacementScreen onReady={handleReady} />
    case 'battle':
      return <ViewPlaceholder label="Battle" />
    case 'gameover':
      return <ViewPlaceholder label="Game Over" />
  }
}
