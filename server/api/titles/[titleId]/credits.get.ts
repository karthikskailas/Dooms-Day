import { getCredits } from '../../../utils/tmdb/cached.ts'
import { respondForTitle } from '../../../utils/tmdb/respond.ts'

// GET /api/titles/:titleId/credits — top cast and key crew.
export default defineEventHandler((event) => respondForTitle(event, 3600, (target) => getCredits(target)))
