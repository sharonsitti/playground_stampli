import type { Player } from '@shared/schemas'
import type { ShipType } from '../placement/types'

export type ShotMark = { hit: boolean }

export type SunkShip = {
  type: ShipType
  cells: { col: number; row: number }[]
}

export type ShotFiredEvent = {
  shooter_id: string
  col: number
  row: number
  hit: boolean
  sunk: boolean
  ship_type: ShipType | null
  ship_cells: { col: number; row: number }[] | null
  next_turn: string
}

export type TurnExpiredEvent = {
  player_id: string
  next_turn: string
}

export type GameOverEvent = {
  winner_id: string
  loser_id: string
  winner: Player
  loser: Player
}
