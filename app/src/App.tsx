import { useState } from 'react'
import { WelcomeView } from '@/views/WelcomeView'

type View = 'welcome' | 'lobby' | 'placement' | 'battle' | 'gameover'

export default function App() {
  const [view, setView] = useState<View>('welcome')
  const [playerId, setPlayerId] = useState<string | null>(null)
  const [playerName, setPlayerName] = useState<string | null>(null)

  switch (view) {
    case 'welcome':
      return (
        <WelcomeView
          onRegistered={({ id, name }) => {
            sessionStorage.setItem('playerId', id)
            sessionStorage.setItem('playerName', name)
            setPlayerId(id)
            setPlayerName(name)
            setView('lobby')
          }}
        />
      )
    case 'lobby':
      return (
        <div>
          Lobby (coming soon)
          {playerName ? ` — ${playerName} (${playerId ?? ''})` : ''}
        </div>
      )
    case 'placement':
      return <div>Placement (coming soon)</div>
    case 'battle':
      return <div>Battle (coming soon)</div>
    case 'gameover':
      return <div>Game Over (coming soon)</div>
  }
}
