export function parseSseData(event: MessageEvent): unknown {
  const raw: unknown = event.data
  if (typeof raw !== 'string') return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}
