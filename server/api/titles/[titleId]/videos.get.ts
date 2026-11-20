import { getVideos } from '../../../utils/tmdb/cached.ts'
import { respondForTitle } from '../../../utils/tmdb/respond.ts'

// GET /api/titles/:titleId/videos — embeddable YouTube trailers, teasers and clips.
export default defineEventHandler((event) => respondForTitle(event, 1800, (target) => getVideos(target)))
