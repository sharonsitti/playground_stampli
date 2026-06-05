type TickHandler = (secondsRemaining: number) => void
type ExpireHandler = () => void

const timers = new Map<string, NodeJS.Timeout>()

export function startTimer(
  gameId: string,
  seconds: number,
  onTick: TickHandler,
  onExpire: ExpireHandler,
): void {
  cancelTimer(gameId)

  let remaining = seconds
  onTick(remaining)

  const interval = setInterval(() => {
    remaining -= 1
    if (remaining <= 0) {
      cancelTimer(gameId)
      onTick(0)
      onExpire()
      return
    }
    onTick(remaining)
  }, 1000)

  timers.set(gameId, interval)
}

export function resetTimer(
  gameId: string,
  seconds: number,
  onTick: TickHandler,
  onExpire: ExpireHandler,
): void {
  startTimer(gameId, seconds, onTick, onExpire)
}

export function cancelTimer(gameId: string): void {
  const existing = timers.get(gameId)
  if (existing) {
    clearInterval(existing)
    timers.delete(gameId)
  }
}
