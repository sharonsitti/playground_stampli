import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import Database from 'better-sqlite3'

const here = dirname(fileURLToPath(import.meta.url))

export const db = new Database(process.env['DB_PATH'] ?? join(here, '..', '..', 'battleship.db'))
db.pragma('journal_mode = WAL')

const schema = readFileSync(join(here, 'schema.sql'), 'utf8')
db.exec(schema)
