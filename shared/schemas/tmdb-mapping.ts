import { z } from 'zod'
import type { RoadmapDataset } from '../types/roadmap.ts'
import { TMDB_MEDIA_TYPES, type TmdbMappingFile } from '../types/tmdb-mapping.ts'
import { parseTitleForSearch } from '../utils/title-query.ts'
import type { ValidationIssue } from './roadmap.ts'

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'must be an ISO date (YYYY-MM-DD)')
const positiveInt = z.number().int().positive()
const mediaType = z.enum(TMDB_MEDIA_TYPES)

const candidateSchema = z
  .object({
    tmdb_id: positiveInt,
    media_type: mediaType,
    title: z.string().min(1),
    year: z.number().int().nullable(),
    popularity: z.number().nullable(),
  })
  .strict()

export const tmdbMappingEntrySchema = z.discriminatedUnion('status', [
  z
    .object({
      status: z.literal('verified'),
      tmdb_id: positiveInt,
      media_type: mediaType,
      season_number: positiveInt.optional(),
      matched_title: z.string().min(1),
      matched_year: z.number().int().nullable(),
      method: z.enum(['auto_exact', 'manual']),
      verified_on: isoDate,
    })
    .strict(),
  z
    .object({ status: z.literal('needs_review'), reason: z.string().min(1), candidates: z.array(candidateSchema) })
    .strict(),
  z.object({ status: z.literal('unmapped') }).strict(),
])

export const tmdbMappingFileSchema = z
  .object({
    schema_version: z.literal('1.0.0'),
    entries: z.record(z.string(), tmdbMappingEntrySchema),
  })
  .strict()

type AssertAssignable<_Sub extends Super, Super> = true
export type _MappingSchemaMatchesTypes = [
  AssertAssignable<z.infer<typeof tmdbMappingFileSchema>, TmdbMappingFile>,
  AssertAssignable<TmdbMappingFile, z.infer<typeof tmdbMappingFileSchema>>,
]

export interface MappingReport {
  ok: boolean
  issues: ValidationIssue[]
  counts: { verified: number; needs_review: number; unmapped: number }
}

/**
 * Validates the mapping against itself and against the roadmap. Assumes `roadmap` already passed validateRoadmap.
 * `unmapped` and `needs_review` are valid work-in-progress states; only `strict` callers treat them as failures.
 */
export function validateTmdbMapping(mapping: unknown, roadmap: RoadmapDataset): MappingReport {
  const issues: ValidationIssue[] = []
  const counts = { verified: 0, needs_review: 0, unmapped: 0 }

  const parsed = tmdbMappingFileSchema.safeParse(mapping)
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const id = issue.path[0] === 'entries' && typeof issue.path[1] === 'string' ? issue.path[1] : null
      issues.push({ path: issue.path.map(String).join('.') || '(root)', titleId: id, message: issue.message })
    }
    return { ok: false, issues, counts }
  }

  const entries = parsed.data.entries
  const all = [...roadmap.titles, ...roadmap.supplemental_titles]
  const known = new Map(all.map((t) => [t.id, t]))

  for (const t of all) {
    if (!(t.id in entries)) issues.push({ path: `entries.${t.id}`, titleId: t.id, message: 'missing mapping entry' })
  }
  for (const id of Object.keys(entries)) {
    if (!known.has(id)) issues.push({ path: `entries.${id}`, titleId: id, message: 'no such title in the roadmap' })
  }

  const claimed = new Map<string, string>()
  for (const [id, entry] of Object.entries(entries)) {
    counts[entry.status]++
    const title = known.get(id)
    if (entry.status !== 'verified' || !title) continue

    if (entry.season_number !== undefined && entry.media_type !== 'tv') {
      issues.push({ path: `entries.${id}.season_number`, titleId: id, message: 'season_number is only valid for media_type "tv"' })
    }
    if (title.type === 'movie' && entry.media_type !== 'movie') {
      issues.push({ path: `entries.${id}.media_type`, titleId: id, message: 'editorial type "movie" must map to TMDB "movie"' })
    }
    if (title.type === 'series' && entry.media_type !== 'tv') {
      issues.push({ path: `entries.${id}.media_type`, titleId: id, message: 'editorial type "series" must map to TMDB "tv"' })
    }
    // "X - Season N" titles must say which season they are.
    const { seasonNumber } = parseTitleForSearch(title.title)
    if (seasonNumber !== null && entry.season_number !== seasonNumber) {
      issues.push({
        path: `entries.${id}.season_number`,
        titleId: id,
        message: `title "${title.title}" requires season_number ${seasonNumber}`,
      })
    }
    const key = `${entry.media_type}:${entry.tmdb_id}:${entry.season_number ?? ''}`
    const prior = claimed.get(key)
    if (prior) issues.push({ path: `entries.${id}`, titleId: id, message: `same TMDB target (${key}) as ${prior}` })
    else claimed.set(key, id)
  }

  return { ok: issues.length === 0, issues, counts }
}
