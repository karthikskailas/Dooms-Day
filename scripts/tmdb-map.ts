// Builds app/constant/tmdb_mapping.json by searching TMDB. Needs a token: set NUXT_TMDB_API_TOKEN in .env.
//   pnpm tmdb:map                       search every title that is not verified yet
//   pnpm tmdb:map --dry-run             show results without writing
//   pnpm tmdb:map --only marvel_001,marvel_002
//   pnpm tmdb:map --retry-review        also re-search titles marked needs_review
//   pnpm tmdb:map --verify marvel_015=movie:12345   record a manual verification (tv: id=tv:6789:1 for season 1)
// Never edits the roadmap JSON, and never overwrites a verified entry with a search result.
import { readFileSync, renameSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createTmdbClient } from '../server/utils/tmdb/client.ts'
import { validateRoadmap } from '../shared/schemas/roadmap.ts'
import { validateTmdbMapping } from '../shared/schemas/tmdb-mapping.ts'
import type { RoadmapDataset } from '../shared/types/roadmap.ts'
import type { TmdbMappingFile } from '../shared/types/tmdb-mapping.ts'
import { mapTitles, verifyManually } from './tmdb-map-lib.ts'

const path = (rel: string) => fileURLToPath(new URL(rel, import.meta.url))
const ROADMAP = path('../app/constant/marvel_doomsday_watchlist.json')
const MAPPING = path('../app/constant/tmdb_mapping.json')

const args = process.argv.slice(2)
const flag = (name: string) => args.includes(name)
const value = (name: string) => {
  const i = args.indexOf(name)
  return i === -1 ? undefined : args[i + 1]
}

const fail: (message: string) => never = (message) => {
  console.error(message)
  process.exit(1)
}

if (!process.env.NUXT_TMDB_API_TOKEN) {
  fail('NUXT_TMDB_API_TOKEN is not set. Add your TMDB API Read Access Token to .env (see README, "TMDB credentials").')
}

const roadmapRaw: unknown = JSON.parse(readFileSync(ROADMAP, 'utf8'))
const report = validateRoadmap(roadmapRaw)
if (!report.ok) fail('Roadmap data is invalid; run `pnpm validate:data` first.')
const roadmap = roadmapRaw as RoadmapDataset
const mapping = JSON.parse(readFileSync(MAPPING, 'utf8')) as TmdbMappingFile

const client = createTmdbClient({
  token: process.env.NUXT_TMDB_API_TOKEN,
  baseUrl: process.env.NUXT_TMDB_API_BASE_URL || undefined,
})
const today = new Date().toISOString().slice(0, 10)

let next: TmdbMappingFile = mapping
let summary: string
try {
  const verifySpec = value('--verify')
  if (verifySpec) {
    next = await verifyManually(client, roadmap, mapping, verifySpec, today)
    summary = `verified ${verifySpec.split('=')[0]} manually`
  } else {
    const only = value('--only')?.split(',').filter(Boolean)
    const outcome = await mapTitles(client, roadmap, mapping, { only, today, retryReview: flag('--retry-review'), log: console.log })
    next = outcome.mapping
    summary = `${outcome.changed.length} updated, ${outcome.failed.length} failed`
    if (outcome.aborted) summary += `; STOPPED: ${outcome.aborted}`
    if (outcome.aborted || outcome.failed.length) process.exitCode = 1
  }
} catch (err) {
  // Expected failures (bad spec, unknown ID, TMDB error) are messages, not stack traces.
  fail(`Error: ${err instanceof Error ? err.message : String(err)}`)
}

const check = validateTmdbMapping(next, roadmap)
if (!check.ok) {
  console.error('Refusing to write an invalid mapping:')
  for (const i of check.issues) console.error(`  ✗ ${i.titleId ? `[${i.titleId}] ` : ''}${i.path}: ${i.message}`)
  process.exit(1)
}

console.log(`\n${summary}`)
console.log(`mapping: verified ${check.counts.verified}, needs_review ${check.counts.needs_review}, unmapped ${check.counts.unmapped}`)
if (flag('--dry-run')) {
  console.log('(dry run: nothing written)')
} else {
  const tmp = `${MAPPING}.tmp`
  writeFileSync(tmp, `${JSON.stringify(next, null, 2)}\n`)
  renameSync(tmp, MAPPING)
  console.log(`wrote ${MAPPING}`)
}
