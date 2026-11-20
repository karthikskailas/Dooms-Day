import { getProviders } from '../../../utils/tmdb/cached.ts'
import { ApiError } from '../../../utils/tmdb/errors.ts'
import { REGION, respondForTitle } from '../../../utils/tmdb/respond.ts'

// GET /api/titles/:titleId/providers?region=IN — watch providers for one region (default from runtime config).
export default defineEventHandler((event) =>
  respondForTitle(event, 600, (target) => {
    const requested = getQuery(event).region
    const region = (typeof requested === 'string' && requested ? requested : useRuntimeConfig(event).public.tmdbRegion).toString()
    if (!REGION.test(region)) throw new ApiError('invalid_region', 'Region must be a two-letter country code.', 400)
    return getProviders(target, region.toUpperCase())
  }),
)
