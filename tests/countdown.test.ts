import { describe, expect, it } from 'vitest'
import { collectionMeta } from '../app/utils/collection.ts'
import { formatReleaseDate, getCountdown, msUntilNextSecond, pad2, parseReleaseDate } from '../app/utils/countdown.ts'

const at = (y: number, m: number, d: number, h = 0, min = 0, s = 0, ms = 0) => new Date(y, m - 1, d, h, min, s, ms).getTime()

describe('parseReleaseDate', () => {
  it('parses a real date as local midnight', () => {
    const d = parseReleaseDate('2026-12-18')!
    expect([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes()]).toEqual([2026, 11, 18, 0, 0])
  })

  it('rejects impossible and malformed dates', () => {
    for (const bad of ['2026-02-30', '2026-13-01', '2026-00-10', '2026-12-32', '2026-1-1', '18-12-2026', '2026/12/18', '', 'tomorrow', ' 2026-12-18', '2026-12-18T00:00:00Z']) {
      expect(parseReleaseDate(bad), bad).toBeNull()
    }
  })

  it('accepts a leap day only in a leap year', () => {
    expect(parseReleaseDate('2028-02-29')).not.toBeNull()
    expect(parseReleaseDate('2027-02-29')).toBeNull()
  })
})

describe('getCountdown', () => {
  const target = parseReleaseDate('2026-12-18')

  it('splits the remaining time into days, hours, minutes and seconds', () => {
    // 27 days, 2 hours, 3 minutes, 4 seconds before the target.
    const now = at(2026, 12, 18) - ((27 * 24 + 2) * 3600 + 3 * 60 + 4) * 1000
    expect(getCountdown(target, now)).toEqual({ status: 'running', parts: { days: 27, hours: 2, minutes: 3, seconds: 4 } })
  })

  it('floors partial seconds, so it never shows time that has passed', () => {
    expect(getCountdown(target, at(2026, 12, 17, 23, 59, 58, 400))).toEqual({
      status: 'running',
      parts: { days: 0, hours: 0, minutes: 0, seconds: 1 },
    })
  })

  it('shows the final second, then ends exactly at the target', () => {
    expect(getCountdown(target, at(2026, 12, 17, 23, 59, 59, 1)).status).toBe('running')
    expect(getCountdown(target, at(2026, 12, 18))).toEqual({ status: 'ended' })
    expect(getCountdown(target, at(2026, 12, 18, 0, 0, 1))).toEqual({ status: 'ended' })
    expect(getCountdown(target, at(2030, 1, 1))).toEqual({ status: 'ended' })
  })

  it('reports invalid for a missing or unusable target or clock', () => {
    expect(getCountdown(null, 0)).toEqual({ status: 'invalid' })
    expect(getCountdown(new Date(Number.NaN), 0)).toEqual({ status: 'invalid' })
    expect(getCountdown(target, Number.NaN)).toEqual({ status: 'invalid' })
  })

  it('keeps more than 99 days as days, not a wrapped value', () => {
    const out = getCountdown(target, at(2026, 1, 1))
    expect(out.status === 'running' && out.parts.days).toBe(351)
  })
})

describe('msUntilNextSecond', () => {
  it('aligns ticks to the next whole second', () => {
    expect(msUntilNextSecond(10_000)).toBe(1000)
    expect(msUntilNextSecond(10_250)).toBe(750)
    expect(msUntilNextSecond(10_999)).toBe(1)
  })
})

describe('formatReleaseDate', () => {
  it('formats the date the same way in any time zone', () => {
    expect(formatReleaseDate('2026-12-18')).toBe('18 December 2026')
    expect(formatReleaseDate('2027-01-01')).toBe('1 January 2027')
  })
  it('returns null for an invalid date', () => {
    expect(formatReleaseDate('2026-02-30')).toBeNull()
    expect(formatReleaseDate('nope')).toBeNull()
  })
})

describe('pad2', () => {
  it('pads to two digits without truncating', () => {
    expect([pad2(0), pad2(7), pad2(10), pad2(123)]).toEqual(['00', '07', '10', '123'])
  })
})

describe('collection metadata', () => {
  it('provides a valid target date and title from the roadmap JSON', () => {
    expect(collectionMeta.target_title).toBe('Avengers: Doomsday')
    expect(parseReleaseDate(collectionMeta.target_release_date)).not.toBeNull()
    expect(collectionMeta.target_release_date_note.length).toBeGreaterThan(0)
  })
})
