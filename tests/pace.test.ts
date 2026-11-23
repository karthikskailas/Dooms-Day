import { describe, expect, it } from 'vitest'
import { pace } from '../app/utils/pace.ts'

const target = new Date(2026, 11, 18)
const at = (d: number) => new Date(2026, 11, d).getTime()

describe('pace', () => {
  it('spreads the remaining titles over the weeks left', () => {
    expect(pace(27, 0, target, at(4))).toEqual({ left: 27, daysLeft: 14, perWeek: 13.5 })
  })
  it('has no pace when finished, or once the date has passed or is missing', () => {
    expect(pace(10, 10, target, at(4)).perWeek).toBeNull()
    expect(pace(10, 0, target, at(20)).perWeek).toBeNull()
    expect(pace(10, 0, null, at(4)).perWeek).toBeNull()
  })
})
