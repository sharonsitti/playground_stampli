import { useCallback, useState } from 'react'

const API = 'http://localhost:8000'

export function useFireShot(
  gameId: string,
  playerId: string,
  myShotCount: number,
): { pending: boolean; fire: (col: number, row: number) => void } {
  const [firedAtCount, setFiredAtCount] = useState<number | null>(null)

  const pending = firedAtCount !== null && myShotCount === firedAtCount

  const fire = useCallback(
    (col: number, row: number) => {
      setFiredAtCount(myShotCount)
      void fetch(`${API}/api/games/${gameId}/shot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player_id: playerId, col, row }),
      }).then((res) => {
        if (!res.ok) setFiredAtCount(null)
      })
    },
    [gameId, playerId, myShotCount],
  )

  return { pending, fire }
}
