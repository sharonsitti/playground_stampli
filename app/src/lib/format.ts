export function formatTimer(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds))
  const minutes = Math.floor(safe / 60)
  const remainder = safe % 60
  return `${String(minutes)}:${String(remainder).padStart(2, '0')}`
}
