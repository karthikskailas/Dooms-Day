// Pure countdown logic. No Vue, no clock access: callers pass `now`, so every case is testable.

export interface CountdownParts {
  days: number
  hours: number
  minutes: number
  seconds: number
}

export type CountdownState =
  | { status: 'invalid' }
  | { status: 'ended' }
  | { status: 'running'; parts: CountdownParts }

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/

/**
 * Parses a YYYY-MM-DD release date as midnight at the start of that day in the viewer's local time zone.
 * Returns null for anything that is not a real calendar date. (The dataset gives a date, not a time, and notes
 * that regional release dates differ, so local midnight is the neutral reading.)
 */
export function parseReleaseDate(iso: string): Date | null {
  const match = ISO_DATE.exec(iso)
  if (!match) return null
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])]
  const date = new Date(year, month - 1, day)
  const real = date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
  return real ? date : null
}

/** Time left until `target` at `now` (ms since epoch). `invalid` for no target, `ended` once it has been reached. */
export function getCountdown(target: Date | null, now: number): CountdownState {
  if (!target) return { status: 'invalid' }
  const remaining = target.getTime() - now
  if (!Number.isFinite(remaining)) return { status: 'invalid' }
  if (remaining <= 0) return { status: 'ended' }
  const totalSeconds = Math.floor(remaining / 1000)
  return {
    status: 'running',
    parts: {
      days: Math.floor(totalSeconds / 86_400),
      hours: Math.floor((totalSeconds % 86_400) / 3600),
      minutes: Math.floor((totalSeconds % 3600) / 60),
      seconds: totalSeconds % 60,
    },
  }
}

/** Milliseconds until the next whole second, so ticks stay aligned to the clock instead of drifting. */
export function msUntilNextSecond(now: number): number {
  return 1000 - (now % 1000)
}

/**
 * "18 December 2026". Formatted in UTC from the date's own parts, so the server and every browser time zone
 * produce the same text (no hydration mismatch). Null when the date is not valid.
 */
export function formatReleaseDate(iso: string): string | null {
  const match = ISO_DATE.exec(iso)
  if (!match || !parseReleaseDate(iso)) return null
  const utc = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])))
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(utc)
}

export const pad2 = (n: number) => String(n).padStart(2, '0')
