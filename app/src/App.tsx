import { useState } from 'react'
import { WelcomeScreen, type Player } from '@/components/WelcomeScreen'

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

  switch (view) {
    case 'welcome':
      return <WelcomeScreen onRegistered={handleRegistered} />
    case 'lobby':
      return <ViewPlaceholder label={`Lobby (${player?.name ?? 'unknown'})`} />
    case 'placement':
      return <ViewPlaceholder label="Placement" />
    case 'battle':
      return <ViewPlaceholder label="Battle" />
    case 'gameover':
      return <ViewPlaceholder label="Game Over" />
  }
}
