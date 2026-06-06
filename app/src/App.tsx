import { useState } from 'react'
import { WelcomeView } from '@/views/WelcomeView'
import { LobbyView } from '@/views/LobbyView'
import { PlacementView } from '@/views/PlacementView'

type View = 'welcome' | 'lobby' | 'placement' | 'battle' | 'gameover'
type Preset = 'quick' | 'casual'
type Role = 'creator' | 'joiner'

type Player = { id: string; name: string }
type GameContext = { gameId: string; preset: Preset; role: Role }

export default function App() {
  const [view, setView] = useState<View>('welcome')
  const [player, setPlayer] = useState<Player | null>(null)
  const [game, setGame] = useState<GameContext | null>(null)

  switch (view) {
    case 'welcome':
      return (
        <WelcomeView
          onRegistered={({ id, name }) => {
            sessionStorage.setItem('playerId', id)
            sessionStorage.setItem('playerName', name)
            setPlayer({ id, name })
            setView('lobby')
          }}
        />
      )
    case 'lobby':
      if (!player) return null
      return (
        <LobbyView
          playerId={player.id}
          playerName={player.name}
          onGameJoined={(gameId, preset, role) => {
            setGame({ gameId, preset, role })
            setView('placement')
          }}
        />
      )
    case 'placement':
      if (!player || !game) return null
      return (
        <PlacementView
          gameId={game.gameId}
          playerId={player.id}
          preset={game.preset}
          role={game.role}
          onReady={() => {}}
          onExpired={() => {
            setView('lobby')
          }}
        />
      )
    case 'battle':
      return <div>Battle (coming soon)</div>
    case 'gameover':
      return <div>Game Over (coming soon)</div>
  }
}
