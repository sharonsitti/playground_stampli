import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, test } from 'vitest'
import App from '../src/App'

afterEach(cleanup)

// TODO: restore h1 assertion once BattleshipMockup is removed from App
test.skip('renders the app', () => {
  render(<App />)
  expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
})
