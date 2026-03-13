/**
 * Returns a date string in 'YYYY-MM-DD' format using LOCAL time (not UTC).
 * This is critical for Uruguay (UTC-3) where toISOString().split('T')[0]
 * would return the wrong date after 9pm local time.
 */
export function localDateStr(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
