import path from 'node:path'

import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@shared': path.resolve(import.meta.dirname, '../shared'),
    },
  },
  test: {
    env: { DB_PATH: ':memory:' },
  },
})
