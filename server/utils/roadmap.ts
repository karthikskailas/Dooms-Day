// Server-side lookup from a project title ID to its verified TMDB target. Both JSON files are bundled at build time.
import mappingJson from '../../app/constant/tmdb_mapping.json'
import roadmapJson from '../../app/constant/marvel_doomsday_watchlist.json'
import { validateRoadmap } from '../../shared/schemas/roadmap.ts'
import { validateTmdbMapping } from '../../shared/schemas/tmdb-mapping.ts'
import type { RoadmapDataset } from '../../shared/types/roadmap.ts'
import type { TmdbMappingFile } from '../../shared/types/tmdb-mapping.ts'
import { ApiError } from './tmdb/errors.ts'
import type { TmdbTarget } from './tmdb/service.ts'

interface Catalog {
  roadmap: RoadmapDataset
  mapping: TmdbMappingFile
}

let catalog: Catalog | undefined

/** Validates once per process. A broken dataset fails loudly instead of serving wrong metadata. */
function getCatalog(): Catalog {
  if (catalog) return catalog
  const roadmapReport = validateRoadmap(roadmapJson)
  if (!roadmapReport.ok) throw new Error(`Roadmap data is invalid: ${roadmapReport.issues[0]?.message}`)
  const roadmap = roadmapJson as unknown as RoadmapDataset
  const mappingReport = validateTmdbMapping(mappingJson, roadmap)
  if (!mappingReport.ok) throw new Error(`TMDB mapping is invalid: ${mappingReport.issues[0]?.message}`)
  catalog = { roadmap, mapping: mappingJson as unknown as TmdbMappingFile }
  return catalog
}

const TITLE_ID = /^[a-z][a-z0-9_]{0,63}$/

/**
 * Resolves a project title ID to a verified TMDB target.
 * Throws ApiError: invalid_title_id (400), title_not_found (404), tmdb_not_mapped (404).
 */
export function resolveTarget(titleId: string): TmdbTarget {
  if (!TITLE_ID.test(titleId)) throw new ApiError('invalid_title_id', 'Title ID is not valid.', 400)
  const { mapping } = getCatalog()
  const entry = mapping.entries[titleId]
  if (!entry) throw new ApiError('title_not_found', 'No such title in the roadmap.', 404)
  if (entry.status !== 'verified') {
    throw new ApiError('tmdb_not_mapped', 'This title has no verified TMDB match yet.', 404)
  }
  return { mediaType: entry.media_type, tmdbId: entry.tmdb_id, seasonNumber: entry.season_number ?? null }
}
