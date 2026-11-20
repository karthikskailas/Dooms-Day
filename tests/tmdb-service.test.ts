import { describe, expect, it, vi } from 'vitest'
import type { TmdbClient } from '../server/utils/tmdb/client.ts'
import { createTmdbService, type TmdbTarget } from '../server/utils/tmdb/service.ts'

// Records which TMDB endpoint is used for each media type. IDs are synthetic.
function recorder() {
  const body = (path: string) => (path.endsWith('/videos') ? { results: [] } : path.endsWith('/watch/providers') ? { results: {} } : { id: 1, name: 'X', title: 'X', cast: [], crew: [] })
  const get = vi.fn(async (path: string, schema: { parse: (v: unknown) => unknown }) => schema.parse(body(path)))
  return { client: { get } as unknown as TmdbClient, paths: () => get.mock.calls.map((c) => c[0]) }
}
const movie: TmdbTarget = { mediaType: 'movie', tmdbId: 11, seasonNumber: null }
const tv: TmdbTarget = { mediaType: 'tv', tmdbId: 22, seasonNumber: 2 }

describe('tmdb service endpoint selection', () => {
  it('uses movie endpoints for movies', async () => {
    const r = recorder()
    const s = createTmdbService(r.client)
    await s.details(movie)
    await s.credits(movie)
    await s.videos(movie)
    await s.providers(movie, 'IN')
    expect(r.paths()).toEqual(['/movie/11', '/movie/11/credits', '/movie/11/videos', '/movie/11/watch/providers'])
  })

  it('uses tv endpoints for series, with aggregate credits', async () => {
    const r = recorder()
    const s = createTmdbService(r.client)
    await s.details(tv)
    await s.credits(tv)
    await s.videos(tv)
    await s.providers(tv, 'IN')
    expect(r.paths()).toEqual(['/tv/22', '/tv/22/aggregate_credits', '/tv/22/videos', '/tv/22/watch/providers'])
  })
})
