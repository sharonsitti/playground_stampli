import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// Each test worker gets its own on-disk SQLite file so parallel files never share
// game/SSE state. Without this, timing-sensitive SSE integration tests can observe
// rows and broadcasts produced by other files running in the same worker pool.
const dir = mkdtempSync(join(tmpdir(), 'battleship-test-'))
process.env.DB_PATH = join(dir, `worker-${process.env.VITEST_WORKER_ID ?? '0'}.db`)
