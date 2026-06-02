import express, { NextFunction, Request, Response } from 'express'

const app = express()

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

app.listen(8000, () => {
  console.log('API running at http://localhost:8000')
})
