import { useCallback, useState } from 'react'
import type { Player, Preset } from '@shared/schemas'
import { BattleScreen } from '@/components/BattleScreen'
import { GameOverScreen } from '@/components/GameOverScreen'
import { LobbyScreen } from '@/components/LobbyScreen'
import { PlacementScreen } from '@/components/PlacementScreen'
import { WelcomeScreen } from '@/components/WelcomeScreen'
import type { PlacedShip } from '@/components/placement/types'

type ViewType = 'welcome' | 'lobby' | 'placement' | 'battle' | 'gameover'

type GameOverData = { winnerId: string; loserId: string; winner: Player; loser: Player }

export default function App() {
  const [view, setView] = useState<ViewType>('welcome')
  const [playerId, setPlayerId] = useState<string | null>(null)
  const [playerName, setPlayerName] = useState<string | null>(null)
  const [gameId, setGameId] = useState<string | null>(null)
  const [preset, setPreset] = useState<Preset | null>(null)
  const [placedShips, setPlacedShips] = useState<PlacedShip[] | null>(null)
  const [currentTurn, setCurrentTurn] = useState<string | null>(null)
  const [placementExpired, setPlacementExpired] = useState(false)
  const [gameOverData, setGameOverData] = useState<GameOverData | null>(null)

  const handleBattleStart = useCallback((currentTurn: string) => {
    setCurrentTurn(currentTurn)
    setView('battle')
  }, [])

  const handlePlacementExpired = useCallback(() => {
    setPlacementExpired(true)
    setView('lobby')
  }, [])

  const handleGameOver = useCallback(
    (winnerId: string, loserId: string, winner: Player, loser: Player) => {
      setGameOverData({ winnerId, loserId, winner, loser })
      setView('gameover')
    },
    [],
  )

  const safeGameId = gameId ?? ''
  const safePlayerId = playerId ?? ''
  const safePlayerName = playerName ?? ''
  const safePreset = preset ?? 'quick'

  switch (view) {
    case 'welcome':
      return (
        <WelcomeScreen
          onPlayerRegistered={(id, name) => {
            setPlayerId(id)
            setPlayerName(name)
            setView('lobby')
          }}
        />
      )
    case 'lobby':
      return (
        <LobbyScreen
          playerId={safePlayerId}
          playerName={safePlayerName}
          expiredMessage={placementExpired}
          onDismissExpired={() => {
            setPlacementExpired(false)
          }}
          onGameJoined={(gId, joinedPreset) => {
            setPlacementExpired(false)
            setGameId(gId)
            setPreset(joinedPreset)
            setView('placement')
          }}
        />
      )
    case 'placement':
      return (
        <PlacementScreen
          gameId={safeGameId}
          playerId={safePlayerId}
          preset={safePreset}
          onReady={setPlacedShips}
          onBattleStart={handleBattleStart}
          onPlacementExpired={handlePlacementExpired}
        />
      )
    case 'battle':
      return (
        <BattleScreen
          gameId={safeGameId}
          playerId={safePlayerId}
          playerName={safePlayerName || 'You'}
          preset={safePreset}
          placedShips={placedShips ?? []}
          currentTurn={currentTurn ?? ''}
          onGameOver={handleGameOver}
        />
      )
    case 'gameover':
      if (!gameOverData) return <div>Loading…</div>
      return (
        <GameOverScreen
          playerId={safePlayerId}
          winnerId={gameOverData.winnerId}
          loserId={gameOverData.loserId}
          winner={gameOverData.winner}
          loser={gameOverData.loser}
          onReturnToLobby={() => {
            setView('lobby')
            setGameId(null)
            setPlacedShips(null)
            setCurrentTurn(null)
            setGameOverData(null)
          }}
        />
      )
  }
}
