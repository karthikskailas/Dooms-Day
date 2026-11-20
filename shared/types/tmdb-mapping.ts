// Mapping from stable project IDs to TMDB identifiers. Lives beside, never inside, the editorial JSON.

export const TMDB_MEDIA_TYPES = ['movie', 'tv'] as const
export type TmdbMediaType = (typeof TMDB_MEDIA_TYPES)[number]

export interface TmdbCandidate {
  tmdb_id: number
  media_type: TmdbMediaType
  title: string
  year: number | null
  popularity: number | null
}

export type TmdbMappingEntry =
  | {
      status: 'verified'
      tmdb_id: number
      media_type: TmdbMediaType
      /** Set when the project title is one season of a TMDB series. */
      season_number?: number
      matched_title: string
      matched_year: number | null
      /** `auto_exact`: unique exact title and year match. `manual`: confirmed by a person. */
      method: 'auto_exact' | 'manual'
      /** ISO date the match was recorded. */
      verified_on: string
    }
  | { status: 'needs_review'; reason: string; candidates: TmdbCandidate[] }
  | { status: 'unmapped' }

export interface TmdbMappingFile {
  schema_version: '1.0.0'
  /** Keyed by project ID, covering both `titles` and `supplemental_titles`. */
  entries: Record<string, TmdbMappingEntry>
}
