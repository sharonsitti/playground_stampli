import { PlayerResponse } from '@shared/schemas'
import type { PlayerResponse as Player } from '@shared/schemas'

const API_BASE = 'http://localhost:8000'

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
