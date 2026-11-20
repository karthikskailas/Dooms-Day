import { describe, expect, it, vi } from 'vitest'
import type { TmdbClient } from '../server/utils/tmdb/client.ts'
import { ApiError } from '../server/utils/tmdb/errors.ts'
import { mapTitles, verifyManually } from '../scripts/tmdb-map-lib.ts'
import type { TmdbMappingEntry } from '../shared/types/tmdb-mapping.ts'
import { loadBlankMapping as loadMapping, loadRoadmap } from './helpers.ts'

// All TMDB responses here are synthetic fixtures with made-up IDs.
type Handler = (path: string, query: Record<string, unknown>) => unknown
function fakeClient(handler: Handler) {
  const get = vi.fn(async (path: string, schema: { parse: (v: unknown) => unknown }, query: Record<string, unknown> = {}) => {
    const out = handler(path, query)
    if (out instanceof Error) throw out
    return schema.parse(out)
  })
  return { client: { get } as unknown as TmdbClient, get, paths: () => get.mock.calls.map((c) => c[0]) }
}
const base = { today: '2026-11-21', sleep: async () => {} }
const movieHit = (id: number, title: string, year: number) => ({ id, title, release_date: `${year}-05-01`, popularity: 5 })
const tvHit = (id: number, name: string, year: number) => ({ id, name, first_air_date: `${year}-05-01`, popularity: 5 })

describe('mapTitles', () => {
  it('verifies a unique exact title and year, recording what matched', async () => {
    const { client } = fakeClient((p) => (p === '/search/movie' ? { results: [movieHit(9001, 'Iron Man', 2008), movieHit(9002, 'Iron Man', 1990)] } : {}))
    const out = await mapTitles(client, loadRoadmap(), loadMapping(), { ...base, only: ['marvel_007'] })
    expect(out.mapping.entries.marvel_007).toEqual({
      status: 'verified', tmdb_id: 9001, media_type: 'movie', matched_title: 'Iron Man', matched_year: 2008, method: 'auto_exact', verified_on: '2026-11-21',
    })
    expect(out.changed).toEqual(['marvel_007'])
  })

  it('sends ambiguity to review and keeps the candidates', async () => {
    const { client } = fakeClient(() => ({ results: [movieHit(1, 'Iron Man', 2008), movieHit(2, 'Iron Man', 2008)] }))
    const out = await mapTitles(client, loadRoadmap(), loadMapping(), { ...base, only: ['marvel_007'] })
    const e = out.mapping.entries.marvel_007 as Extract<TmdbMappingEntry, { status: 'needs_review' }>
    expect(e.status).toBe('needs_review')
    expect(e.candidates.map((c) => c.tmdb_id).sort()).toEqual([1, 2])
  })

  it('verifies a season title only when that season aired in the editorial year, and records the season', async () => {
    const handler = (aired: string): Handler => (p) =>
      p === '/search/tv' ? { results: [tvHit(7, 'Daredevil', 2015)] } : { id: 7, name: 'Daredevil', seasons: [{ season_number: 1, air_date: aired }] }
    const ok = await mapTitles(fakeClient(handler('2015-04-10')).client, loadRoadmap(), loadMapping(), { ...base, only: ['marvel_021'] })
    expect(ok.mapping.entries.marvel_021).toMatchObject({ status: 'verified', media_type: 'tv', tmdb_id: 7, season_number: 1 })
    const bad = await mapTitles(fakeClient(handler('2014-04-10')).client, loadRoadmap(), loadMapping(), { ...base, only: ['marvel_021'] })
    expect(bad.mapping.entries.marvel_021).toMatchObject({ status: 'needs_review', reason: expect.stringMatching(/aired in 2014, not 2015/) })
  })

  it('searches both media types for a special', async () => {
    const { client, paths } = fakeClient(() => ({ results: [] }))
    await mapTitles(client, loadRoadmap(), loadMapping(), { ...base, only: ['marvel_064'] })
    expect(paths()).toEqual(['/search/movie', '/search/tv'])
  })

  it('strips "*" from the search query', async () => {
    const { client, get } = fakeClient(() => ({ results: [] }))
    await mapTitles(client, loadRoadmap(), loadMapping(), { ...base, only: ['marvel_078'] })
    expect((get.mock.calls[0]![2] as { query: string }).query).toBe('Thunderbolts')
  })

  it('never re-searches or overwrites verified entries, including manual ones', async () => {
    const mapping = loadMapping()
    mapping.entries.marvel_007 = { status: 'verified', tmdb_id: 5, media_type: 'movie', matched_title: 'Iron Man', matched_year: 2008, method: 'manual', verified_on: '2026-01-01' }
    const { client, get } = fakeClient(() => ({ results: [movieHit(9999, 'Iron Man', 2008)] }))
    const out = await mapTitles(client, loadRoadmap(), mapping, { ...base, only: ['marvel_007'] })
    expect(get).not.toHaveBeenCalled()
    expect(out.mapping.entries.marvel_007).toEqual(mapping.entries.marvel_007)
  })

  it('skips needs_review unless asked to retry', async () => {
    const mapping = loadMapping()
    mapping.entries.marvel_007 = { status: 'needs_review', reason: 'r', candidates: [] }
    const { client, get } = fakeClient(() => ({ results: [movieHit(9001, 'Iron Man', 2008)] }))
    await mapTitles(client, loadRoadmap(), mapping, { ...base, only: ['marvel_007'] })
    expect(get).not.toHaveBeenCalled()
    const retried = await mapTitles(client, loadRoadmap(), mapping, { ...base, only: ['marvel_007'], retryReview: true })
    expect(retried.mapping.entries.marvel_007!.status).toBe('verified')
  })

  it('stops on invalid credentials and leaves earlier progress intact', async () => {
    let calls = 0
    const { client } = fakeClient(() => (++calls === 1 ? { results: [movieHit(9001, 'Iron Man', 2008)] } : new ApiError('credentials_invalid', 'rejected', 503)))
    const out = await mapTitles(client, loadRoadmap(), loadMapping(), { ...base, only: ['marvel_007', 'marvel_008'] })
    expect(out.aborted).toBe('rejected')
    expect(out.mapping.entries.marvel_007!.status).toBe('verified')
    expect(out.mapping.entries.marvel_008!.status).toBe('unmapped')
  })

  it('reports a missing token as an abort, without partial changes', async () => {
    const { client } = fakeClient(() => new ApiError('credentials_missing', 'no token', 503))
    const out = await mapTitles(client, loadRoadmap(), loadMapping(), { ...base, only: ['marvel_007'] })
    expect(out).toMatchObject({ aborted: 'no token', changed: [] })
  })

  it('records per-title failures without changing the entry, and aborts after three network failures in a row', async () => {
    const { client } = fakeClient(() => new ApiError('network_error', 'down', 502))
    const out = await mapTitles(client, loadRoadmap(), loadMapping(), { ...base, only: ['marvel_007', 'marvel_008', 'marvel_009', 'marvel_011'] })
    expect(out.failed.map((f) => f.id)).toEqual(['marvel_007', 'marvel_008', 'marvel_009'])
    expect(out.aborted).toMatch(/3 consecutive network failures/)
    expect(out.mapping.entries.marvel_007!.status).toBe('unmapped')
  })

  it('waits for the rate limit window and retries once', async () => {
    let calls = 0
    const sleep = vi.fn(async () => {})
    const { client } = fakeClient(() => (++calls === 1 ? new ApiError('rate_limited', 'slow', 429, 3) : { results: [movieHit(9001, 'Iron Man', 2008)] }))
    const out = await mapTitles(client, loadRoadmap(), loadMapping(), { ...base, sleep, only: ['marvel_007'] })
    expect(sleep).toHaveBeenCalledWith(3000)
    expect(out.mapping.entries.marvel_007!.status).toBe('verified')
  })

  it('does not modify its inputs', async () => {
    const mapping = loadMapping()
    const roadmap = loadRoadmap()
    const [m0, r0] = [structuredClone(mapping), structuredClone(roadmap)]
    const { client } = fakeClient(() => ({ results: [movieHit(9001, 'Iron Man', 2008)] }))
    await mapTitles(client, roadmap, mapping, { ...base, only: ['marvel_007'] })
    expect(mapping).toEqual(m0)
    expect(roadmap).toEqual(r0)
  })
})

describe('verifyManually', () => {
  const movieClient = () => fakeClient((p) => (p === '/movie/321' ? { id: 321, title: 'Iron Man', release_date: '2008-04-30' } : new ApiError('tmdb_not_found', 'nope', 404)))
  const tvClient = () => fakeClient(() => ({ id: 654, name: 'Daredevil', first_air_date: '2015-04-10', seasons: [{ season_number: 1 }, { season_number: 2 }] }))

  it('records a manual movie verification using what TMDB says the ID is', async () => {
    const out = await verifyManually(movieClient().client, loadRoadmap(), loadMapping(), 'marvel_007=movie:321', '2026-11-21')
    expect(out.entries.marvel_007).toMatchObject({ status: 'verified', tmdb_id: 321, media_type: 'movie', matched_title: 'Iron Man', matched_year: 2008, method: 'manual' })
  })

  it('takes the season from a "Season N" title, or an explicit one', async () => {
    const auto = await verifyManually(tvClient().client, loadRoadmap(), loadMapping(), 'marvel_025=tv:654', '2026-11-21')
    expect(auto.entries.marvel_025).toMatchObject({ season_number: 2, media_type: 'tv' })
    const explicit = await verifyManually(tvClient().client, loadRoadmap(), loadMapping(), 'marvel_019=tv:654:1', '2026-11-21')
    expect(explicit.entries.marvel_019).toMatchObject({ season_number: 1 })
  })

  it('rejects bad specs, unknown titles, missing seasons and an ID TMDB does not have', async () => {
    const run = (spec: string, c = movieClient().client) => verifyManually(c, loadRoadmap(), loadMapping(), spec, '2026-11-21')
    await expect(run('marvel_007')).rejects.toThrow(/Bad spec/)
    await expect(run('marvel_007=film:1')).rejects.toThrow(/Bad spec/)
    await expect(run('marvel_007=movie:abc')).rejects.toThrow(/Bad spec/)
    await expect(run('nope_001=movie:321')).rejects.toThrow(/No such title/)
    await expect(run('marvel_007=movie:1')).rejects.toThrow(/nope/)
    await expect(run('marvel_021=tv:654:9', tvClient().client)).rejects.toThrow(/no season 9/)
    await expect(run('marvel_007=movie:321:2')).rejects.toThrow(/season/i)
  })
})
