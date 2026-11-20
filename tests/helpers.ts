import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import type { RoadmapDataset } from '../shared/types/roadmap.ts'
import type { TmdbMappingFile } from '../shared/types/tmdb-mapping.ts'

const readJson = (rel: string): unknown => JSON.parse(readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8'))

/** A fresh deep copy each call, so tests can mutate freely. */
export const loadRoadmap = () => structuredClone(readJson('../app/constant/marvel_doomsday_watchlist.json')) as RoadmapDataset
export const loadMapping = () => structuredClone(readJson('../app/constant/tmdb_mapping.json')) as TmdbMappingFile

/** A mapping with every title unmapped: a fixed starting point for tests that must not depend on the real mapping's progress. */
export const loadBlankMapping = (): TmdbMappingFile => ({
  schema_version: '1.0.0',
  entries: Object.fromEntries([...loadRoadmap().titles, ...loadRoadmap().supplemental_titles].map((t) => [t.id, { status: 'unmapped' as const }])),
})
