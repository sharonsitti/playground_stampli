import type { Response } from 'express'

const lobbyClients = new Set<Response>()
const gameClients = new Map<string, Set<Response>>()

function initStream(res: Response): void {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()
}

function writeEvent(res: Response, type: string, data: unknown): boolean {
  if (res.writableEnded) return false
  try {
    res.write(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`)
    return true
  } catch {
    return false
  }
}

export function addLobbyClient(res: Response): void {
  initStream(res)
  lobbyClients.add(res)
}

export function removeLobbyClient(res: Response): void {
  lobbyClients.delete(res)
}

export function broadcastLobbyEvent(type: string, data: unknown): void {
  for (const res of lobbyClients) {
    if (!writeEvent(res, type, data)) lobbyClients.delete(res)
  }
}

export function addGameClient(gameId: string, res: Response): void {
  initStream(res)
  let clients = gameClients.get(gameId)
  if (!clients) {
    clients = new Set<Response>()
    gameClients.set(gameId, clients)
  }
  clients.add(res)
}

export function removeGameClient(gameId: string, res: Response): void {
  const clients = gameClients.get(gameId)
  if (!clients) return
  clients.delete(res)
  if (clients.size === 0) {
    gameClients.delete(gameId)
  }
}

export function broadcastGameEvent(gameId: string, type: string, data: unknown): void {
  const clients = gameClients.get(gameId)
  if (!clients) return
  for (const res of clients) {
    if (!writeEvent(res, type, data)) removeGameClient(gameId, res)
  }
}

export function sendGameEvent(res: Response, type: string, data: unknown): void {
  writeEvent(res, type, data)
}
