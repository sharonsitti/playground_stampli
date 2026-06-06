import type { Response } from 'express'

export const lobbyClients = new Set<Response>()
export const gameClients = new Map<string, Set<Response>>()

export function openStream(res: Response): void {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  })
  res.write('\n')
}

export function sendEvent(res: Response, eventType: string, data: unknown): void {
  res.write(`event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`)
}

export function broadcastLobby(eventType: string, data: unknown): void {
  for (const res of lobbyClients) {
    sendEvent(res, eventType, data)
  }
}

export function broadcastGame(gameId: string, eventType: string, data: unknown): void {
  const clients = gameClients.get(gameId)
  if (!clients) return
  for (const res of clients) {
    sendEvent(res, eventType, data)
  }
}
