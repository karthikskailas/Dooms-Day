import { z } from 'zod'
import { defineCachedFunction } from 'nitropack/runtime'
import { tmdbImageUrl } from '../../shared/utils/tmdb-image.ts'
import { createTmdbClient } from '../utils/tmdb/client.ts'
import { ApiError } from '../utils/tmdb/errors.ts'

// GET /api/doomsday: the Avengers: Doomsday movie's artwork from TMDB, for the Doomsday Ready card.
// The film is the roadmap's destination and is not in the roadmap data, so it is found by search and cached.
const searchSchema = z.object({
  results: z.array(
    z.object({
      id: z.number(),
      title: z.string().nullish(),
      release_date: z.string().nullish(),
      poster_path: z.string().nullish(),
      backdrop_path: z.string().nullish(),
      popularity: z.number().nullish(),
    }),
  ),
})

const find = defineCachedFunction(
  async (token: string, baseUrl: string, title: string) => {
    const client = createTmdbClient({ token, baseUrl })
    const { results } = await client.get('/search/movie', searchSchema, { query: title, year: 2026, language: 'en-US' })
    const exact = results.filter((r) => r.title?.toLowerCase() === title.toLowerCase() && r.poster_path)
    const best = (exact.length ? exact : results.filter((r) => r.poster_path)).sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0))[0]
    if (!best) return null
    return { tmdbId: best.id, posterUrl: tmdbImageUrl(best.poster_path, 'w500'), backdropUrl: tmdbImageUrl(best.backdrop_path, 'w1280') }
  },
  { name: 'tmdb-doomsday', maxAge: 60 * 60 * 12, swr: false, getKey: (_t: string, _b: string, title: string) => title },
)

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  try {
    const data = await find(config.tmdbApiToken, config.tmdbApiBaseUrl, 'Avengers: Doomsday')
    if (!data) throw new ApiError('tmdb_not_found', 'TMDB has no artwork for this film yet.', 404)
    setResponseHeader(event, 'Cache-Control', 'public, max-age=600')
    return data
  } catch (err) {
    if (err instanceof ApiError) {
      setResponseStatus(event, err.statusCode)
      return { error: { code: err.code, message: err.message } }
    }
    console.error('[api/doomsday]', err)
    setResponseStatus(event, 502)
    return { error: { code: 'upstream_error', message: 'Could not reach TMDB.' } }
  }
})
