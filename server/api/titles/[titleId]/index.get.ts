import { getDetails } from '../../../utils/tmdb/cached.ts'
import { respondForTitle } from '../../../utils/tmdb/respond.ts'

// GET /api/titles/:titleId — core movie or TV metadata for a roadmap title.
export default defineEventHandler((event) => respondForTitle(event, 3600, (target) => getDetails(target)))
