import { mkdirSync, readFileSync } from 'node:fs'
import { dirname } from 'node:path'

import Database from 'better-sqlite3'

let instance: Database.Database | undefined

// Opened lazily on first use so DB_PATH (read here, not at import time) can be
// overridden by tests before the first query runs.
export function getDb(): Database.Database {
  if (!instance) {
    const dbPath = process.env.DB_PATH ?? 'data/battleship.db'

    // dbPath comes from the env or a hardcoded default, never request input.
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    mkdirSync(dirname(dbPath), { recursive: true })

    instance = new Database(dbPath)

    // Path is derived from import.meta.url, never user input.
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const schema = readFileSync(new URL('./schema.sql', import.meta.url), 'utf8')
    instance.exec(schema)
  }
  return instance
}
