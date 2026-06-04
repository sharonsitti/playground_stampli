import { useCallback } from 'react'
import type { PlacedShip } from './types'

const API = 'http://localhost:8000'

export function useSubmitFleet(
  gameId: string,
  playerId: string,
): (ships: PlacedShip[]) => Promise<void> {
  return useCallback(
    async (ships: PlacedShip[]) => {
      const placeRes = await fetch(`${API}/api/games/${gameId}/place`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player_id: playerId, ships }),
      })
      if (!placeRes.ok) return

      await fetch(`${API}/api/games/${gameId}/ready`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player_id: playerId }),
      })
    },
    [gameId, playerId],
  )
}
