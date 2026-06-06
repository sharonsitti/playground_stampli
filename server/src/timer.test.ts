import { afterEach, describe, expect, it, vi } from 'vitest'

import { clearTimer, getCurrentSeconds, startTimer } from './timer.js'

const GAME = 'timer-test-game'

afterEach(() => {
  clearTimer(GAME)
  vi.useRealTimers()
})

describe('startTimer', () => {
  // KDD#2 / spec: the first tick fires immediately at the full value, before any interval elapses
  it('emits the first tick synchronously at the full value', () => {
    vi.useFakeTimers()
    const ticks: number[] = []

    startTimer(GAME, 3, (r) => ticks.push(r), vi.fn())

    expect(ticks).toEqual([3])
    expect(getCurrentSeconds(GAME)).toBe(3)
  })

  // spec: one tick per second, counting down; onExpire fires when it reaches 0
  it('counts down once per second and calls onExpire at zero', () => {
    vi.useFakeTimers()
    const ticks: number[] = []
    const onExpire = vi.fn()

    startTimer(GAME, 3, (r) => ticks.push(r), onExpire)
    vi.advanceTimersByTime(3000)

    expect(ticks).toEqual([3, 2, 1])
    expect(onExpire).toHaveBeenCalledOnce()
    expect(getCurrentSeconds(GAME)).toBe(0)
  })

  // KDD#2: starting a timer for a game cancels any existing one (resettable countdown)
  it('restarts the countdown when called again for the same game', () => {
    vi.useFakeTimers()
    const ticks: number[] = []

    startTimer(GAME, 5, (r) => ticks.push(r), vi.fn())
    vi.advanceTimersByTime(2000)
    startTimer(GAME, 5, (r) => ticks.push(r), vi.fn())

    expect(getCurrentSeconds(GAME)).toBe(5)
    expect(ticks).toEqual([5, 4, 3, 5])
  })
})

describe('clearTimer', () => {
  // clearing stops further ticks and prevents onExpire
  it('stops ticking and never expires after clear', () => {
    vi.useFakeTimers()
    const ticks: number[] = []
    const onExpire = vi.fn()

    startTimer(GAME, 3, (r) => ticks.push(r), onExpire)
    clearTimer(GAME)
    vi.advanceTimersByTime(5000)

    expect(ticks).toEqual([3])
    expect(onExpire).not.toHaveBeenCalled()
  })
})
