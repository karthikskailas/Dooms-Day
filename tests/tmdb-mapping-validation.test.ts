import { describe, expect, it } from 'vitest'
import { validateTmdbMapping } from '../shared/schemas/tmdb-mapping.ts'
import type { TmdbMappingEntry } from '../shared/types/tmdb-mapping.ts'
import { parseTitleForSearch } from '../shared/utils/title-query.ts'
import { loadBlankMapping, loadMapping, loadRoadmap } from './helpers.ts'

// Synthetic IDs below are test fixtures, not real TMDB identifiers.
const verified = (over: Partial<Extract<TmdbMappingEntry, { status: 'verified' }>> = {}): TmdbMappingEntry => ({
  status: 'verified',
  tmdb_id: 111,
  media_type: 'movie',
  matched_title: 'Fixture',
  matched_year: 2000,
  method: 'manual',
  verified_on: '2026-11-21',
  ...over,
})
const run = (mutate: (m: ReturnType<typeof loadMapping>) => void) => {
  const m = loadBlankMapping()
  mutate(m)
  return validateTmdbMapping(m, loadRoadmap())
}
const text = (r: ReturnType<typeof run>) => r.issues.map((i) => `${i.titleId} ${i.message}`).join('\n')

describe('tmdb mapping (real file)', () => {
  it('is valid and covers every title', () => {
    const report = validateTmdbMapping(loadMapping(), loadRoadmap())
    expect(report.issues).toEqual([])
    expect(report.counts.verified + report.counts.needs_review + report.counts.unmapped).toBe(92)
  })

  it('records evidence for every verified entry', () => {
    for (const [id, e] of Object.entries(loadMapping().entries)) {
      if (e.status !== 'verified') continue
      expect(e.matched_title, id).not.toBe('')
      expect(['auto_exact', 'manual'], id).toContain(e.method)
    }
  })
})

describe('tmdb mapping failures', () => {
  it('reports missing and unknown entries', () => {
    const r = run((m) => {
      delete m.entries.marvel_001
      m.entries.ghost_999 = { status: 'unmapped' }
    })
    expect(text(r)).toMatch(/marvel_001 missing mapping entry/)
    expect(text(r)).toMatch(/ghost_999 no such title/)
  })

  it('requires a season number for "Season N" titles and matches it', () => {
    expect(text(run((m) => (m.entries.marvel_021 = verified({ media_type: 'tv' }))))).toMatch(/requires season_number 1/)
    expect(run((m) => (m.entries.marvel_021 = verified({ media_type: 'tv', season_number: 1 }))).ok).toBe(true)
    expect(text(run((m) => (m.entries.marvel_021 = verified({ media_type: 'tv', season_number: 2 }))))).toMatch(/requires season_number 1/)
  })

  it('rejects a movie mapped as tv and a series mapped as movie', () => {
    expect(text(run((m) => (m.entries.marvel_007 = verified({ media_type: 'tv' }))))).toMatch(/must map to TMDB "movie"/)
    expect(text(run((m) => (m.entries.marvel_019 = verified({ media_type: 'movie' }))))).toMatch(/must map to TMDB "tv"/)
  })

  it('allows a special to map to either media type', () => {
    expect(run((m) => (m.entries.marvel_064 = verified({ media_type: 'movie' }))).ok).toBe(true)
    expect(run((m) => (m.entries.marvel_064 = verified({ media_type: 'tv' }))).ok).toBe(true)
  })

  it('rejects two titles claiming the same TMDB target, but allows different seasons of one show', () => {
    const dup = run((m) => {
      m.entries.marvel_007 = verified()
      m.entries.marvel_008 = verified()
    })
    expect(text(dup)).toMatch(/same TMDB target/)
    const seasons = run((m) => {
      m.entries.marvel_021 = verified({ media_type: 'tv', tmdb_id: 7, season_number: 1 })
      m.entries.marvel_025 = verified({ media_type: 'tv', tmdb_id: 7, season_number: 2 })
    })
    expect(seasons.ok).toBe(true)
  })

  it('rejects season_number on a movie and malformed entries', () => {
    expect(text(run((m) => (m.entries.marvel_064 = verified({ media_type: 'movie', season_number: 1 }))))).toMatch(/only valid for media_type "tv"/)
    const bad = run((m) => ((m.entries.marvel_001 as unknown) = { status: 'verified', tmdb_id: 0 }))
    expect(bad.ok).toBe(false)
  })
})

describe('parseTitleForSearch', () => {
  it('strips season and limited-series suffixes without changing other titles', () => {
    expect(parseTitleForSearch('Daredevil - Season 3')).toEqual({ query: 'Daredevil', seasonNumber: 3 })
    expect(parseTitleForSearch('What If...? - Season 2')).toEqual({ query: 'What If...?', seasonNumber: 2 })
    expect(parseTitleForSearch('VisionQuest - Limited Series')).toEqual({ query: 'VisionQuest', seasonNumber: null })
    expect(parseTitleForSearch('Daredevil: Born Again - Season 1')).toEqual({ query: 'Daredevil: Born Again', seasonNumber: 1 })
    expect(parseTitleForSearch('Thunderbolts*')).toEqual({ query: 'Thunderbolts*', seasonNumber: null })
  })
})
