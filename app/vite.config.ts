import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, '../shared'),
      // shared/ lives outside this project root and can't walk up to app/node_modules,
      // so point its bare `zod` import at the copy installed here.
      zod: path.resolve(__dirname, './node_modules/zod'),
    },
  },
  server: {
    port: 3000,
  },
  test: {
    environment: 'happy-dom',
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      // Thresholds enforced on every test run — failing coverage blocks CI and pre-commit.
      // Raise these as test coverage improves; never lower them.
      thresholds: {
        statements: 5,
        branches: 5,
        functions: 5,
        lines: 5,
      },
    },
  },
})
