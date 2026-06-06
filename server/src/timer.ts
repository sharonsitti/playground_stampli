const gameTimers = new Map<string, ReturnType<typeof setInterval>>()
const gameSeconds = new Map<string, number>()

export function startTimer(
  gameId: string,
  seconds: number,
  onTick: (remaining: number) => void,
  onExpire: () => void,
): void {
  clearTimer(gameId)

  let remaining = seconds
  gameSeconds.set(gameId, remaining)
  onTick(remaining)

  const handle = setInterval(() => {
    remaining -= 1
    gameSeconds.set(gameId, remaining)
    if (remaining <= 0) {
      clearTimer(gameId)
      onExpire()
      return
    }
    onTick(remaining)
  }, 1000)
  handle.unref()

  gameTimers.set(gameId, handle)
}

export function clearTimer(gameId: string): void {
  const handle = gameTimers.get(gameId)
  if (handle) {
    clearInterval(handle)
    gameTimers.delete(gameId)
  }
}

export function getCurrentSeconds(gameId: string): number | null {
  return gameSeconds.get(gameId) ?? null
}
