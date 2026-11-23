// How fast the user must watch to finish before the release. Pure: callers pass `now`.
export interface Pace {
  left: number
  daysLeft: number
  /** Titles per week needed; null when nothing is left or the date has passed. */
  perWeek: number | null
}

const DAY = 86_400_000

export function pace(total: number, watched: number, target: Date | null, now: number): Pace {
  const left = Math.max(0, total - watched)
  const daysLeft = target ? Math.max(0, Math.ceil((target.getTime() - now) / DAY)) : 0
  const perWeek = left === 0 || daysLeft === 0 ? null : Math.round((left / (daysLeft / 7)) * 10) / 10
  return { left, daysLeft, perWeek }
}
