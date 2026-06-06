import { CreatePlayerRequest, PlayerResponse } from '@shared/schemas'
import express, { NextFunction, Request, Response } from 'express'

import { upsertPlayer } from './db/players.repository.js'

export const app = express()

app.use(express.json())

app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') {
    res.sendStatus(204)
    return
  }
  next()
})

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' })
})

app.post('/api/players', (req: Request, res: Response) => {
  const parsed = CreatePlayerRequest.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Name must be 1-50 characters' })
    return
  }
  const player = upsertPlayer(parsed.data.name)
  res.json(PlayerResponse.parse(player))
})

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
})

app.listen(8000, () => {
  console.log('API running at http://localhost:8000')
})
