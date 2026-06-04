import { useEffect, useRef, useState } from 'react'
import { type Player, PRESET_SECONDS, type Preset } from '@shared/schemas'
import { cellKey } from '../placement/types'
import type { GameOverEvent, ShotFiredEvent, ShotMark, SunkShip, TurnExpiredEvent } from './types'

const API = 'http://localhost:8000'

type BattleSSEArgs = {
  gameId: string
  playerId: string
  preset: Preset
  initialTurn: string
  resolveName: (id: string) => string
  onGameOver: (winnerId: string, loserId: string, winner: Player, loser: Player) => void
}

export type BattleState = {
  secondsRemaining: number
  currentTurn: string
  myShots: Map<string, ShotMark>
  opponentShots: Map<string, ShotMark>
  sunkOpponentShips: SunkShip[]
  notifications: string[]
  frozen: boolean
}

const TOTAL_SHIP_CELLS = 5 + 4 + 3 + 3 + 2

export function useBattleSSE({
  gameId,
  playerId,
  preset,
  initialTurn,
  resolveName,
  onGameOver,
}: BattleSSEArgs): BattleState {
  const [secondsRemaining, setSecondsRemaining] = useState(PRESET_SECONDS[preset])
  const [currentTurn, setCurrentTurn] = useState(initialTurn)
  const [myShots, setMyShots] = useState<Map<string, ShotMark>>(new Map())
  const [opponentShots, setOpponentShots] = useState<Map<string, ShotMark>>(new Map())
  const [sunkOpponentShips, setSunkOpponentShips] = useState<SunkShip[]>([])
  const [notifications, setNotifications] = useState<string[]>([])
  const [frozen, setFrozen] = useState(false)

  const handlers = useRef({ resolveName, onGameOver })
  useEffect(() => {
    handlers.current = { resolveName, onGameOver }
  }, [resolveName, onGameOver])

  useEffect(() => {
    if (!gameId) return
    const source = new EventSource(`${API}/api/games/${gameId}/events`)

    source.addEventListener('timer_tick', (event) => {
      const { seconds_remaining } = JSON.parse((event as MessageEvent<string>).data) as {
        seconds_remaining: number
      }
      setSecondsRemaining(seconds_remaining)
    })

    source.addEventListener('shot_fired', (event) => {
      const shot = JSON.parse((event as MessageEvent<string>).data) as ShotFiredEvent
      const key = cellKey(shot.col, shot.row)
      const mine = shot.shooter_id === playerId

      if (mine) {
        setMyShots((prev) => new Map(prev).set(key, { hit: shot.hit }))
      } else {
        setOpponentShots((prev) => new Map(prev).set(key, { hit: shot.hit }))
      }

      const sunkType = shot.ship_type
      const sunkCells = shot.ship_cells
      if (shot.sunk && sunkType) {
        if (mine && sunkCells) {
          setSunkOpponentShips((prev) => [...prev, { type: sunkType, cells: sunkCells }])
        }
        setNotifications((prev) => [...prev, `${sunkType} sunk!`])
      }

      setCurrentTurn(shot.next_turn)
    })

    source.addEventListener('turn_expired', (event) => {
      const { player_id, next_turn } = JSON.parse(
        (event as MessageEvent<string>).data,
      ) as TurnExpiredEvent
      setNotifications((prev) => [
        ...prev,
        `${handlers.current.resolveName(player_id)} ran out of time — turn skipped`,
      ])
      setCurrentTurn(next_turn)
    })

    source.addEventListener('game_over', (event) => {
      const { winner_id, loser_id, winner, loser } = JSON.parse(
        (event as MessageEvent<string>).data,
      ) as GameOverEvent
      setFrozen(true)
      handlers.current.onGameOver(winner_id, loser_id, winner, loser)
    })

    return () => {
      source.close()
    }
  }, [gameId, playerId])

  const opponentSunkCells = sunkOpponentShips.reduce((sum, ship) => sum + ship.cells.length, 0)
  const battleFrozen = frozen || opponentSunkCells >= TOTAL_SHIP_CELLS

  return {
    secondsRemaining,
    currentTurn,
    myShots,
    opponentShots,
    sunkOpponentShips,
    notifications,
    frozen: battleFrozen,
  }
}
