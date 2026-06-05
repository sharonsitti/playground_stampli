import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import Database from 'better-sqlite3'

const dbPath = process.env.DB_PATH ?? join(import.meta.dirname, '../../battleship.db')

export const db = new Database(dbPath)
db.pragma('journal_mode = WAL')

const schemaPath = join(import.meta.dirname, 'schema.sql')
// eslint-disable-next-line security/detect-non-literal-fs-filename -- path is a fixed file colocated with this module, not user input
const schema = readFileSync(schemaPath, 'utf-8')
db.exec(schema)
