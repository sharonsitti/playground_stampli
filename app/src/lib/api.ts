import {
  CreateGameResponse,
  GetGamesResponse,
  JoinGameResponse,
  PlayerResponse,
} from '@shared/schemas'
import type { PlayerResponse as Player } from '@shared/schemas'
import type { PlacedShip } from '@/views/placement/usePlacement'

const API_BASE = 'http://localhost:8000'

export class ConflictError extends Error {}

export async function registerPlayer(name: string): Promise<Player> {
  const res = await fetch(`${API_BASE}/api/players`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })
  if (!res.ok) {
    throw new Error(`Failed to register player: ${String(res.status)}`)
  }
  return PlayerResponse.parse(await res.json())
}

export async function getGames(): Promise<GetGamesResponse['games']> {
  const res = await fetch(`${API_BASE}/api/games`)
  if (!res.ok) {
    throw new Error(`Failed to load games: ${String(res.status)}`)
  }
  return GetGamesResponse.parse(await res.json()).games
}

export async function createGame(
  creatorId: string,
  preset: 'quick' | 'casual',
): Promise<{ id: string; preset: 'quick' | 'casual' }> {
  const res = await fetch(`${API_BASE}/api/games`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creator_id: creatorId, preset }),
  })
  if (res.status === 409) {
    throw new ConflictError()
  }
  if (!res.ok) {
    throw new Error(`Failed to create game: ${String(res.status)}`)
  }
  const game = CreateGameResponse.parse(await res.json())
  return { id: game.id, preset: game.preset }
}

export async function joinGame(
  gameId: string,
  playerId: string,
): Promise<{ id: string; preset: 'quick' | 'casual'; creator_id: string; joiner_id: string }> {
  const res = await fetch(`${API_BASE}/api/games/${gameId}/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ player_id: playerId }),
  })
  if (res.status === 409) {
    throw new ConflictError()
  }
  if (!res.ok) {
    throw new Error(`Failed to join game: ${String(res.status)}`)
  }
  const game = JoinGameResponse.parse(await res.json())
  return {
    id: game.id,
    preset: game.preset,
    creator_id: game.creator_id,
    joiner_id: game.joiner_id,
  }
}

export async function placeShips(
  gameId: string,
  playerId: string,
  ships: PlacedShip[],
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/games/${gameId}/place`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      player_id: playerId,
      ships: ships.map((s) => ({
        type: s.type,
        orientation: s.orientation,
        origin_col: s.origin_col,
        origin_row: s.origin_row,
      })),
    }),
  })
  if (res.status === 409) {
    throw new ConflictError()
  }
  if (!res.ok) {
    throw new Error(`Failed to place ships: ${String(res.status)}`)
  }
}

export async function markReady(gameId: string, playerId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/games/${gameId}/ready`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ player_id: playerId }),
  })
  if (res.status === 409) {
    throw new ConflictError()
  }
  if (!res.ok) {
    throw new Error(`Failed to mark ready: ${String(res.status)}`)
  }
}

export async function deleteGame(gameId: string, playerId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/games/${gameId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ player_id: playerId }),
  })
  if (res.status === 409) {
    throw new ConflictError()
  }
  if (!res.ok) {
    throw new Error(`Failed to cancel game: ${String(res.status)}`)
  }
}
