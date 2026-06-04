import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { cancelTimer, getTimerRemaining, startTimer } from './timer.js'

describe('timer — server-authoritative countdown (KDD #2, F5 AC2)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    cancelTimer('g')
    vi.useRealTimers()
  })

  it('fires the first tick immediately at the full value', () => {
    const ticks: number[] = []
    startTimer('g', 3, (r) => ticks.push(r), vi.fn())
    expect(ticks).toEqual([3])
  })

  it('ticks down one per second and reaches 0', () => {
    const ticks: number[] = []
    startTimer('g', 3, (r) => ticks.push(r), vi.fn())
    vi.advanceTimersByTime(3000)
    expect(ticks).toEqual([3, 2, 1, 0])
  })

  it('calls onExpiry exactly once when the countdown hits 0', () => {
    const onExpiry = vi.fn()
    startTimer('g', 2, vi.fn(), onExpiry)
    vi.advanceTimersByTime(5000)
    expect(onExpiry).toHaveBeenCalledTimes(1)
  })

  it('stops ticking after expiry', () => {
    const ticks: number[] = []
    startTimer('g', 2, (r) => ticks.push(r), vi.fn())
    vi.advanceTimersByTime(10000)
    expect(ticks).toEqual([2, 1, 0])
  })

  it('cancelTimer halts further ticks and clears remaining', () => {
    const ticks: number[] = []
    startTimer('g', 5, (r) => ticks.push(r), vi.fn())
    vi.advanceTimersByTime(2000)
    cancelTimer('g')
    vi.advanceTimersByTime(5000)
    expect(ticks).toEqual([5, 4, 3])
    expect(getTimerRemaining('g')).toBeUndefined()
  })

  it('starting a timer for the same game cancels the previous one (reset semantics)', () => {
    const first: number[] = []
    const second: number[] = []
    startTimer('g', 5, (r) => first.push(r), vi.fn())
    vi.advanceTimersByTime(1000)
    startTimer('g', 3, (r) => second.push(r), vi.fn())
    vi.advanceTimersByTime(1000)
    expect(first).toEqual([5, 4])
    expect(second).toEqual([3, 2])
  })

  it('exposes the current remaining value via getTimerRemaining', () => {
    startTimer('g', 5, vi.fn(), vi.fn())
    expect(getTimerRemaining('g')).toBe(5)
    vi.advanceTimersByTime(2000)
    expect(getTimerRemaining('g')).toBe(3)
  })
})
