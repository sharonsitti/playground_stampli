interface RunningTimer {
  interval: ReturnType<typeof setInterval> | undefined
  remaining: number
}

const timers = new Map<string, RunningTimer>()

export function startTimer(
  gameId: string,
  seconds: number,
  onTick: (remaining: number) => void,
  onExpiry: () => void,
): void {
  cancelTimer(gameId)

  const timer: RunningTimer = { interval: undefined, remaining: seconds }
  timers.set(gameId, timer)

  // First tick fires immediately at the full value (spec: timer_tick AC).
  onTick(timer.remaining)

  timer.interval = setInterval(() => {
    timer.remaining -= 1
    onTick(timer.remaining)
    if (timer.remaining <= 0) {
      cancelTimer(gameId)
      onExpiry()
    }
  }, 1000)
  timer.interval.unref()
}

export function cancelTimer(gameId: string): void {
  const timer = timers.get(gameId)
  if (!timer) return
  if (timer.interval !== undefined) clearInterval(timer.interval)
  timers.delete(gameId)
}

export function getTimerRemaining(gameId: string): number | undefined {
  return timers.get(gameId)?.remaining
}
