import { CreatePlayerRequestSchema } from '@shared/schemas'
import express, { NextFunction, Request, Response } from 'express'

import './db/db.js'
import { upsertPlayerByName } from './db/players.repository.js'

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
  const parsed = CreatePlayerRequestSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'name is required' })
    return
  }

  const player = upsertPlayerByName(parsed.data.name)
  const win_rate = player.games_played === 0 ? 0 : player.wins / player.games_played

  res.json({ ...player, win_rate })
})

if (process.env.NODE_ENV !== 'test') {
  app.listen(8000, () => {
    console.log('API running at http://localhost:8000')
  })
}
