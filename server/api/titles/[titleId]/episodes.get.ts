import { getEpisodes } from '../../../utils/tmdb/cached.ts'
import { ApiError } from '../../../utils/tmdb/errors.ts'
import { respondForTitle } from '../../../utils/tmdb/respond.ts'

// GET /api/titles/:titleId/episodes?season=N — episodes of one season (default: the title's own season, else 1). TV titles only.
export default defineEventHandler((event) =>
  respondForTitle(event, 3600, (target) => {
    if (target.mediaType !== 'tv') throw new ApiError('tmdb_not_found', 'This title is not a TV series.', 404)
    const requested = getQuery(event).season
    const season = requested === undefined ? (target.seasonNumber ?? 1) : Number(requested)
    if (!Number.isInteger(season) || season < 0 || season > 100) throw new ApiError('invalid_season', 'Season must be a whole number.', 400)
    return getEpisodes(target, season)
  }),
)
