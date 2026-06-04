import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
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
        statements: 60,
        branches: 70,
        functions: 20,
        lines: 50,
      },
    },
  },
})
