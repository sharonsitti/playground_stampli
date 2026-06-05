import type { Response } from 'express'

const lobbyConnections = new Set<Response>()
const gameConnections = new Map<string, Set<Response>>()
const lastPlayerJoined = new Map<string, unknown>()

function writeEvent(res: Response, type: string, data: unknown): void {
  try {
    res.write(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`)
  } catch {
    // socket already closed — drop the write so one dead connection can't abort the broadcast
  }
}

export function addLobbyConnection(res: Response): void {
  lobbyConnections.add(res)
  res.on('error', () => {
    lobbyConnections.delete(res)
  })
  res.on('close', () => {
    lobbyConnections.delete(res)
  })
}

export function emitLobbyEvent(type: string, data: unknown): void {
  for (const res of lobbyConnections) {
    writeEvent(res, type, data)
  }
}

export function addGameConnection(gameId: string, res: Response): void {
  let set = gameConnections.get(gameId)
  if (!set) {
    set = new Set<Response>()
    gameConnections.set(gameId, set)
  }
  set.add(res)
  const cleanup = () => {
    const current = gameConnections.get(gameId)
    if (!current) return
    current.delete(res)
    if (current.size === 0) gameConnections.delete(gameId)
  }
  res.on('error', cleanup)
  res.on('close', cleanup)

  const replay = lastPlayerJoined.get(gameId)
  if (replay) {
    writeEvent(res, 'player_joined', replay)
    writeEvent(res, 'timer_tick', { seconds_remaining: 0 })
  }
}

export function emitGameEvent(gameId: string, type: string, data: unknown): void {
  if (type === 'player_joined') lastPlayerJoined.set(gameId, data)
  const set = gameConnections.get(gameId)
  if (!set) return
  for (const res of set) {
    writeEvent(res, type, data)
  }
}
