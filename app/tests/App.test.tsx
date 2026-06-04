import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, test } from 'vitest'
import App from '../src/App'

afterEach(cleanup)

test('renders the welcome screen on load', () => {
  render(<App />)
  expect(screen.getByRole('heading', { level: 1, name: 'BATTLESHIP' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Play' })).toBeDisabled()
})
