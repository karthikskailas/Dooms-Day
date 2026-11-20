// Logic for scripts/tmdb-map.ts, kept free of file and environment access so it can be tested with a fake client.
import { z } from 'zod'
import type { TmdbClient } from '../server/utils/tmdb/client.ts'
import { ApiError } from '../server/utils/tmdb/errors.ts'
import { movieDetailsSchema, searchResultsSchema, tvDetailsSchema } from '../server/utils/tmdb/schemas.ts'
import type { RoadmapDataset } from '../shared/types/roadmap.ts'
import type { TmdbMappingEntry, TmdbMappingFile, TmdbMediaType } from '../shared/types/tmdb-mapping.ts'
import { decideMatch, isSeasonYearConsistent, searchMediaTypes, type SearchCandidate } from '../shared/utils/tmdb-match.ts'
import { parseTitleForSearch } from '../shared/utils/title-query.ts'

export interface MapOptions {
  /** Only these project IDs. */
  only?: string[]
  /** ISO date (YYYY-MM-DD) recorded as verified_on. */
  today: string
  /** Re-search titles already marked needs_review. Verified titles are never touched. */
  retryReview?: boolean
  log?: (line: string) => void
  sleep?: (ms: number) => Promise<void>
}

export interface MapOutcome {
  mapping: TmdbMappingFile
  /** IDs whose entry changed. */
  changed: string[]
  /** Titles that could not be searched (network or upstream failure). Their entries are unchanged. */
  failed: { id: string; message: string }[]
  /** Set when the run stopped early (bad credentials, repeated network failure). */
  aborted: string | null
}

const yearOf = (date: string | null | undefined): number | null => {
  const y = date ? Number(date.slice(0, 4)) : Number.NaN
  return Number.isInteger(y) ? y : null
}

async function withRetry<T>(run: () => Promise<T>, sleep: (ms: number) => Promise<void>): Promise<T> {
  try {
    return await run()
  } catch (err) {
    if (err instanceof ApiError && err.code === 'rate_limited') {
      await sleep(Math.min((err.retryAfterSeconds ?? 2) * 1000, 30_000))
      return run()
    }
    throw err
  }
}

async function search(client: TmdbClient, mediaType: TmdbMediaType, query: string): Promise<SearchCandidate[]> {
  const res = await client.get(`/search/${mediaType}`, searchResultsSchema, {
    // "*" is part of some display titles (Thunderbolts*) and is not searchable text.
    query: query.replace(/\*/g, '').trim(),
    include_adult: false,
    language: 'en-US',
    page: 1,
  })
  return res.results.map((r) => ({
    tmdb_id: r.id,
    media_type: mediaType,
    title: (mediaType === 'movie' ? r.title : r.name) ?? '',
    originalTitle: (mediaType === 'movie' ? r.original_title : r.original_name) ?? null,
    year: yearOf(mediaType === 'movie' ? r.release_date : r.first_air_date),
    popularity: r.popularity ?? null,
  }))
}

/**
 * Searches TMDB for each title that is not yet verified and records the outcome:
 * verified (unique exact title and year; "Season N" titles also need that season to have aired that year),
 * or needs_review with candidates. Never overwrites a verified entry. Does not modify its inputs.
 */
export async function mapTitles(
  client: TmdbClient,
  roadmap: RoadmapDataset,
  mapping: TmdbMappingFile,
  options: MapOptions,
): Promise<MapOutcome> {
  const { today, log = () => {}, sleep = (ms) => new Promise((r) => setTimeout(r, ms)) } = options
  const entries: Record<string, TmdbMappingEntry> = { ...mapping.entries }
  const changed: string[] = []
  const failed: MapOutcome['failed'] = []
  let consecutiveNetworkErrors = 0
  let aborted: string | null = null

  const todo = [...roadmap.titles, ...roadmap.supplemental_titles].filter((t) => {
    if (options.only && !options.only.includes(t.id)) return false
    const status = entries[t.id]?.status ?? 'unmapped'
    return status === 'unmapped' || (status === 'needs_review' && options.retryReview === true)
  })

  for (const title of todo) {
    try {
      const { query, seasonNumber } = parseTitleForSearch(title.title)
      const candidates: SearchCandidate[] = []
      for (const mediaType of searchMediaTypes(title.type)) {
        candidates.push(...(await withRetry(() => search(client, mediaType, query), sleep)))
      }
      const decision = decideMatch({ displayTitle: title.title, releaseYear: title.release_year, type: title.type }, candidates)

      let next: TmdbMappingEntry
      if (decision.status === 'verified') {
        const c = decision.candidate
        next = {
          status: 'verified',
          tmdb_id: c.tmdb_id,
          media_type: c.media_type,
          ...(seasonNumber !== null ? { season_number: seasonNumber } : {}),
          matched_title: c.title,
          matched_year: c.year,
          method: 'auto_exact',
          verified_on: today,
        }
        if (c.media_type === 'tv' && seasonNumber !== null) {
          const show = await withRetry(() => client.get(`/tv/${c.tmdb_id}`, tvDetailsSchema, { language: 'en-US' }), sleep)
          const check = isSeasonYearConsistent(show.seasons ?? [], seasonNumber, title.release_year)
          if (!check.ok) {
            next = {
              status: 'needs_review',
              reason: check.reason,
              candidates: [{ tmdb_id: c.tmdb_id, media_type: c.media_type, title: c.title, year: c.year, popularity: c.popularity }],
            }
          }
        }
      } else {
        next = { status: 'needs_review', reason: decision.reason, candidates: decision.candidates }
      }

      entries[title.id] = next
      changed.push(title.id)
      consecutiveNetworkErrors = 0
      log(`${title.id} ${next.status}${next.status === 'needs_review' ? `: ${next.reason}` : ''}`)
    } catch (err) {
      if (err instanceof ApiError && (err.code === 'credentials_missing' || err.code === 'credentials_invalid')) {
        aborted = err.message
        break
      }
      const message = err instanceof Error ? err.message : String(err)
      failed.push({ id: title.id, message })
      log(`${title.id} FAILED: ${message}`)
      consecutiveNetworkErrors = err instanceof ApiError && err.code === 'network_error' ? consecutiveNetworkErrors + 1 : 0
      if (consecutiveNetworkErrors >= 3) {
        aborted = 'Stopped after 3 consecutive network failures.'
        break
      }
    }
  }

  return { mapping: { ...mapping, entries }, changed, failed, aborted }
}

const specSchema = z.tuple([z.string(), z.enum(['movie', 'tv']), z.coerce.number().int().positive(), z.coerce.number().int().positive().optional()])

/**
 * Records a manual verification from a spec like "marvel_015=movie:12345" or "marvel_021=tv:6789:1".
 * Fetches the TMDB record so the entry stores what the ID actually refers to, and fails if it does not exist.
 */
export async function verifyManually(
  client: TmdbClient,
  roadmap: RoadmapDataset,
  mapping: TmdbMappingFile,
  spec: string,
  today: string,
): Promise<TmdbMappingFile> {
  const [id, rest = ''] = spec.split('=')
  const parts = specSchema.safeParse([id, ...rest.split(':')])
  if (!parts.success) throw new Error(`Bad spec "${spec}". Use id=movie:TMDB_ID or id=tv:TMDB_ID[:season]`)
  const [titleId, mediaType, tmdbId, explicitSeason] = parts.data

  const title = [...roadmap.titles, ...roadmap.supplemental_titles].find((t) => t.id === titleId)
  if (!title) throw new Error(`No such title "${titleId}"`)

  const seasonNumber = explicitSeason ?? parseTitleForSearch(title.title).seasonNumber ?? undefined
  if (seasonNumber !== undefined && mediaType !== 'tv') throw new Error('A season number only applies to tv')

  let matchedTitle: string
  let matchedYear: number | null
  if (mediaType === 'movie') {
    const m = await client.get(`/movie/${tmdbId}`, movieDetailsSchema, { language: 'en-US' })
    matchedTitle = m.title ?? m.original_title ?? ''
    matchedYear = yearOf(m.release_date)
  } else {
    const show = await client.get(`/tv/${tmdbId}`, tvDetailsSchema, { language: 'en-US' })
    if (seasonNumber !== undefined && !(show.seasons ?? []).some((s) => s.season_number === seasonNumber)) {
      throw new Error(`TMDB lists no season ${seasonNumber} for tv ${tmdbId}`)
    }
    matchedTitle = show.name ?? show.original_name ?? ''
    matchedYear = yearOf(show.first_air_date)
  }
  if (!matchedTitle) throw new Error(`TMDB returned no title for ${mediaType} ${tmdbId}`)

  return {
    ...mapping,
    entries: {
      ...mapping.entries,
      [titleId]: {
        status: 'verified',
        tmdb_id: tmdbId,
        media_type: mediaType,
        ...(seasonNumber !== undefined ? { season_number: seasonNumber } : {}),
        matched_title: matchedTitle,
        matched_year: matchedYear,
        method: 'manual',
        verified_on: today,
      },
    },
  }
}
