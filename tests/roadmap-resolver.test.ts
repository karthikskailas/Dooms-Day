import { afterEach, describe, expect, it, vi } from 'vitest'

// Synthetic verified entry (not a real TMDB ID) so the resolver's verified path can be exercised.
const withMapping = async (entries: Record<string, unknown>) => {
  vi.resetModules()
  const real = (await import('../app/constant/tmdb_mapping.json')).default as { schema_version: string; entries: Record<string, unknown> }
  vi.doMock('../app/constant/tmdb_mapping.json', () => ({ default: { ...real, entries: { ...real.entries, ...entries } } }))
  return import('../server/utils/roadmap.ts')
}
const verified = { status: 'verified', tmdb_id: 4242, media_type: 'tv', season_number: 1, matched_title: 'F', matched_year: 2015, method: 'manual', verified_on: '2026-11-21' }

afterEach(() => vi.doUnmock('../app/constant/tmdb_mapping.json'))

describe('resolveTarget', () => {
  it('rejects malformed IDs before any lookup', async () => {
    const { resolveTarget } = await withMapping({})
    for (const bad of ['', 'Marvel_001', '../etc', 'a b', 'x'.repeat(65), '1abc']) {
      expect(() => resolveTarget(bad)).toThrowError(expect.objectContaining({ code: 'invalid_title_id', statusCode: 400 }))
    }
  })

  it('reports unknown and unmapped titles differently', async () => {
    const { resolveTarget } = await withMapping({ marvel_001: { status: 'unmapped' } })
    expect(() => resolveTarget('marvel_999')).toThrowError(expect.objectContaining({ code: 'title_not_found', statusCode: 404 }))
    expect(() => resolveTarget('marvel_001')).toThrowError(expect.objectContaining({ code: 'tmdb_not_mapped', statusCode: 404 }))
  })

  it('does not treat needs_review as mapped', async () => {
    const { resolveTarget } = await withMapping({ marvel_002: { status: 'needs_review', reason: 'r', candidates: [] } })
    expect(() => resolveTarget('marvel_002')).toThrowError(expect.objectContaining({ code: 'tmdb_not_mapped' }))
  })

  it('returns the target for a verified title, including its season', async () => {
    const { resolveTarget } = await withMapping({ marvel_021: verified })
    expect(resolveTarget('marvel_021')).toEqual({ mediaType: 'tv', tmdbId: 4242, seasonNumber: 1 })
  })
})
