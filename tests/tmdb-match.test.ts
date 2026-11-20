import { describe, expect, it } from 'vitest'
import { decideMatch, isSeasonYearConsistent, normalizeTitle, type SearchCandidate } from '../shared/utils/tmdb-match.ts'

// Synthetic candidates: IDs and titles are fixtures, not real TMDB data.
const cand = (over: Partial<SearchCandidate>): SearchCandidate => ({
  tmdb_id: 1,
  media_type: 'movie',
  title: 'Fixture',
  originalTitle: null,
  year: 2000,
  popularity: 1,
  ...over,
})

describe('normalizeTitle', () => {
  it('ignores case, punctuation, accents and ampersands', () => {
    expect(normalizeTitle('Thunderbolts*')).toBe('thunderbolts')
    expect(normalizeTitle('Deadpool & Wolverine')).toBe(normalizeTitle('Deadpool and Wolverine'))
    expect(normalizeTitle('Café  Society')).toBe('cafe society')
    expect(normalizeTitle('What If...?')).toBe('what if')
  })
})

describe('decideMatch', () => {
  const movie = { displayTitle: 'Fixture', releaseYear: 2000, type: 'movie' as const }

  it('verifies a unique exact title and year', () => {
    const d = decideMatch(movie, [cand({ tmdb_id: 5 }), cand({ tmdb_id: 6, title: 'Other' })])
    expect(d).toMatchObject({ status: 'verified', candidate: { tmdb_id: 5 }, seasonNumber: null })
  })

  it('does not pick the first or most popular result when the year differs', () => {
    const d = decideMatch(movie, [cand({ tmdb_id: 5, year: 1999, popularity: 99 })])
    expect(d.status).toBe('needs_review')
    if (d.status === 'needs_review') expect(d.reason).toMatch(/none is from 2000/)
  })

  it('sends ambiguity to review, with candidates', () => {
    const d = decideMatch(movie, [cand({ tmdb_id: 5 }), cand({ tmdb_id: 6 })])
    expect(d).toMatchObject({ status: 'needs_review', reason: expect.stringMatching(/2 candidates/) })
    if (d.status === 'needs_review') expect(d.candidates.map((c) => c.tmdb_id).sort()).toEqual([5, 6])
  })

  it('requests review when no title matches', () => {
    const d = decideMatch(movie, [cand({ title: 'Different' })])
    expect(d).toMatchObject({ status: 'needs_review', reason: expect.stringMatching(/no search result has the title/) })
  })

  it('ignores candidates of the wrong media type', () => {
    expect(decideMatch(movie, [cand({ media_type: 'tv' })]).status).toBe('needs_review')
    const series = { displayTitle: 'Fixture', releaseYear: 2000, type: 'series' as const }
    expect(decideMatch(series, [cand({ media_type: 'movie' })]).status).toBe('needs_review')
    expect(decideMatch(series, [cand({ media_type: 'tv', tmdb_id: 9 })]).status).toBe('verified')
  })

  it('searches both media types for specials', () => {
    const special = { displayTitle: 'Fixture', releaseYear: 2000, type: 'special' as const }
    expect(decideMatch(special, [cand({ media_type: 'tv', tmdb_id: 9 })])).toMatchObject({ status: 'verified' })
    expect(decideMatch(special, [cand({ tmdb_id: 1 }), cand({ media_type: 'tv', tmdb_id: 2 })]).status).toBe('needs_review')
  })

  it('matches the original title too', () => {
    const d = decideMatch(movie, [cand({ title: 'Localised', originalTitle: 'Fixture' })])
    expect(d.status).toBe('verified')
  })

  it('matches a season title on the show, requiring the show to start no later than the season year', () => {
    const season = { displayTitle: 'Fixture - Season 2', releaseYear: 2016, type: 'series' as const }
    const d = decideMatch(season, [cand({ media_type: 'tv', tmdb_id: 7, year: 2015 })])
    expect(d).toMatchObject({ status: 'verified', seasonNumber: 2, candidate: { tmdb_id: 7 } })
    expect(decideMatch(season, [cand({ media_type: 'tv', year: 2020 })]).status).toBe('needs_review')
  })

  it('disambiguates two shows with the same name by year', () => {
    const series = { displayTitle: 'Fixture', releaseYear: 2021, type: 'series' as const }
    const d = decideMatch(series, [cand({ media_type: 'tv', tmdb_id: 1, year: 2021 }), cand({ media_type: 'tv', tmdb_id: 2, year: 1994 })])
    expect(d).toMatchObject({ status: 'verified', candidate: { tmdb_id: 1 } })
  })

  it('caps review candidates at five, most popular first', () => {
    const many = Array.from({ length: 8 }, (_, i) => cand({ tmdb_id: i + 1, title: 'Different', popularity: i }))
    const d = decideMatch(movie, many)
    if (d.status !== 'needs_review') throw new Error('expected review')
    expect(d.candidates.map((c) => c.tmdb_id)).toEqual([8, 7, 6, 5, 4])
  })
})

describe('isSeasonYearConsistent', () => {
  const seasons = [
    { season_number: 1, air_date: '2015-04-10' },
    { season_number: 2, air_date: null },
  ]
  it('checks the season air year', () => {
    expect(isSeasonYearConsistent(seasons, 1, 2015)).toEqual({ ok: true })
    expect(isSeasonYearConsistent(seasons, 1, 2016)).toMatchObject({ ok: false, reason: expect.stringMatching(/aired in 2015/) })
    expect(isSeasonYearConsistent(seasons, 2, 2016)).toMatchObject({ ok: false, reason: expect.stringMatching(/no air date/) })
    expect(isSeasonYearConsistent(seasons, 3, 2016)).toMatchObject({ ok: false, reason: expect.stringMatching(/no season 3/) })
  })
})
