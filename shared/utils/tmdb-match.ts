import type { TitleType } from '../types/roadmap.ts'
import type { TmdbCandidate, TmdbMediaType } from '../types/tmdb-mapping.ts'
import { parseTitleForSearch } from './title-query.ts'

/** A TMDB search hit, normalised across movie and tv. */
export interface SearchCandidate extends TmdbCandidate {
  originalTitle: string | null
}

export interface MatchInput {
  displayTitle: string
  releaseYear: number
  type: TitleType
}

export type MatchDecision =
  | { status: 'verified'; candidate: SearchCandidate; seasonNumber: number | null }
  | { status: 'needs_review'; reason: string; candidates: TmdbCandidate[] }

/** Lowercase, accent-free, "&" as "and", punctuation removed: "Thunderbolts*" equals "thunderbolts". */
export function normalizeTitle(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Media types worth searching for an editorial type. Specials have no TMDB equivalent, so both are searched. */
export function searchMediaTypes(type: TitleType): TmdbMediaType[] {
  if (type === 'movie') return ['movie']
  if (type === 'series') return ['tv']
  return ['movie', 'tv']
}

const REVIEW_LIMIT = 5

const toReviewList = (candidates: SearchCandidate[]): TmdbCandidate[] =>
  [...candidates]
    .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0))
    .slice(0, REVIEW_LIMIT)
    .map(({ tmdb_id, media_type, title, year, popularity }) => ({ tmdb_id, media_type, title, year, popularity }))

/**
 * Decides whether search results identify the title with confidence. Never picks the first result:
 * it verifies only when exactly one candidate matches the title and the year, otherwise it asks for review.
 *
 * Years: movies and non-season series must share the release year. A "Season N" title can only be matched
 * on the show (the season's own year is checked later with isSeasonYearConsistent), so the show must
 * have started no later than the editorial year.
 */
export function decideMatch(input: MatchInput, candidates: SearchCandidate[]): MatchDecision {
  const { query, seasonNumber } = parseTitleForSearch(input.displayTitle)
  const wanted = normalizeTitle(query)
  const allowed = new Set(searchMediaTypes(input.type))

  const eligible = candidates.filter((c) => allowed.has(c.media_type))
  const titleMatches = eligible.filter(
    (c) => normalizeTitle(c.title) === wanted || (c.originalTitle !== null && normalizeTitle(c.originalTitle) === wanted),
  )
  if (titleMatches.length === 0) {
    return { status: 'needs_review', reason: `no search result has the title "${query}"`, candidates: toReviewList(eligible) }
  }

  const matches = titleMatches.filter((c) => {
    if (c.year === null) return false
    if (c.media_type === 'tv' && seasonNumber !== null) return c.year <= input.releaseYear
    return c.year === input.releaseYear
  })
  if (matches.length === 1) return { status: 'verified', candidate: matches[0]!, seasonNumber }
  if (matches.length === 0) {
    return {
      status: 'needs_review',
      reason: `title matches, but none is from ${input.releaseYear}`,
      candidates: toReviewList(titleMatches),
    }
  }
  return {
    status: 'needs_review',
    reason: `${matches.length} candidates match the title and year`,
    candidates: toReviewList(matches),
  }
}

/** Whether TMDB's season N aired in the editorial year. Used to confirm "Season N" titles. */
export function isSeasonYearConsistent(
  seasons: { season_number: number; air_date?: string | null }[],
  seasonNumber: number,
  releaseYear: number,
): { ok: true } | { ok: false; reason: string } {
  const season = seasons.find((s) => s.season_number === seasonNumber)
  if (!season) return { ok: false, reason: `TMDB lists no season ${seasonNumber}` }
  const year = season.air_date ? Number(season.air_date.slice(0, 4)) : null
  if (year === null || Number.isNaN(year)) return { ok: false, reason: `TMDB season ${seasonNumber} has no air date` }
  return year === releaseYear ? { ok: true } : { ok: false, reason: `TMDB season ${seasonNumber} aired in ${year}, not ${releaseYear}` }
}
