import { useState } from 'react'
import type { GameOverEvent } from '@shared/schemas'
import { WelcomeView } from '@/views/WelcomeView'
import { LobbyView } from '@/views/LobbyView'
import { PlacementView } from '@/views/PlacementView'
import { BattleView } from '@/views/BattleView'
import { GameOverView } from '@/views/GameOverView'
import type { PlacedShip } from '@/views/placement/usePlacement'

type View = 'welcome' | 'lobby' | 'placement' | 'battle' | 'gameover'
type Preset = 'quick' | 'casual'
type Role = 'creator' | 'joiner'

type Player = { id: string; name: string }
type GameContext = { gameId: string; preset: Preset; role: Role }

export default function App() {
  const [view, setView] = useState<View>('welcome')
  const [player, setPlayer] = useState<Player | null>(null)
  const [game, setGame] = useState<GameContext | null>(null)
  const [placedShips, setPlacedShips] = useState<PlacedShip[]>([])
  const [expiredNotice, setExpiredNotice] = useState(false)
  const [gameOverData, setGameOverData] = useState<GameOverEvent | null>(null)

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
        <>
          {expiredNotice ? (
            <div
              role="alert"
              className="flex items-center justify-between gap-3 bg-[#FEF2F2] px-5 py-3 text-sm font-medium text-[#B91C1C]"
            >
              <span>Game cancelled — placement timer expired</span>
              <button
                type="button"
                className="text-xs font-semibold text-[#B91C1C] underline"
                onClick={() => {
                  setExpiredNotice(false)
                }}
              >
                Dismiss
              </button>
            </div>
          ) : null}
          <LobbyView
            playerId={player.id}
            playerName={player.name}
            onGameJoined={(gameId, preset, role) => {
              setExpiredNotice(false)
              setGame({ gameId, preset, role })
              setView('placement')
            }}
          />
        </>
      )
    case 'placement':
      if (!player || !game) return null
      return (
        <PlacementView
          gameId={game.gameId}
          playerId={player.id}
          preset={game.preset}
          role={game.role}
          onReady={(ships) => {
            setPlacedShips(ships)
            setView('battle')
          }}
          onExpired={() => {
            setExpiredNotice(true)
            setView('lobby')
          }}
        />
      )
    case 'battle':
      if (!player || !game) return null
      return (
        <BattleView
          gameId={game.gameId}
          playerId={player.id}
          placedShips={placedShips}
          role={game.role}
          onGameOver={(data) => {
            setGameOverData(data)
            setView('gameover')
          }}
        />
      )
    case 'gameover':
      if (!player || !gameOverData) return null
      return (
        <GameOverView
          playerId={player.id}
          winner={gameOverData.winner}
          loser={gameOverData.loser}
          onReturnToLobby={() => {
            setGameOverData(null)
            setView('lobby')
          }}
        />
      )
  }
}
