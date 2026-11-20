// Validates the roadmap JSON and the TMDB mapping. Run: pnpm validate:data [--strict]
// Never modifies the data. --strict also fails while any title is not yet verified.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { validateRoadmap, type ValidationIssue } from '../shared/schemas/roadmap.ts'
import { validateTmdbMapping } from '../shared/schemas/tmdb-mapping.ts'
import type { RoadmapDataset } from '../shared/types/roadmap.ts'

const strict = process.argv.includes('--strict')
const read = (rel: string): unknown => JSON.parse(readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8'))

const print = (issues: ValidationIssue[]) => {
  for (const i of issues) console.error(`  ✗ ${i.titleId ? `[${i.titleId}] ` : ''}${i.path}: ${i.message}`)
}

let failed = false

const roadmapRaw = read('../app/constant/marvel_doomsday_watchlist.json')
const roadmap = validateRoadmap(roadmapRaw)
if (roadmap.ok) {
  console.log(`roadmap: OK (${roadmap.counts?.titles} titles, ${roadmap.counts?.supplemental} supplemental)`)
} else {
  console.error(`roadmap: ${roadmap.issues.length} problem(s)`)
  print(roadmap.issues)
  failed = true
}

if (roadmap.ok) {
  const mapping = validateTmdbMapping(read('../app/constant/tmdb_mapping.json'), roadmapRaw as RoadmapDataset)
  const { verified, needs_review, unmapped } = mapping.counts
  if (mapping.ok) {
    console.log(`tmdb mapping: OK (verified ${verified}, needs_review ${needs_review}, unmapped ${unmapped})`)
  } else {
    console.error(`tmdb mapping: ${mapping.issues.length} problem(s)`)
    print(mapping.issues)
    failed = true
  }
  if (strict && (needs_review > 0 || unmapped > 0)) {
    console.error(`tmdb mapping (--strict): ${needs_review + unmapped} title(s) are not verified`)
    failed = true
  }
}

process.exit(failed ? 1 : 0)
