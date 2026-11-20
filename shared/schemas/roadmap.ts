import { z } from 'zod'
import {
  COMPLETION_STATUSES,
  CONNECTION_STATUSES,
  PRIORITIES,
  TITLE_TYPES,
  type RoadmapDataset,
} from '../types/roadmap.ts'

const text = z
  .string()
  .min(1, 'must not be empty')
  .refine((s) => s === s.trim(), 'must not have leading or trailing whitespace')

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'must be an ISO date (YYYY-MM-DD)')
  .refine((s) => {
    const d = new Date(`${s}T00:00:00Z`)
    return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(s)
  }, 'must be a real calendar date')

const titleBaseShape = {
  id: z.string().regex(/^[a-z][a-z0-9_]*$/, 'must be lowercase letters, digits and underscores'),
  title: text,
  release_year: z.number().int().min(1900).max(2100),
  type: z.enum(TITLE_TYPES),
  priority: z.enum(PRIORITIES),
  importance_statement: text,
  doomsday_connection: text,
  connection_status: z.enum(CONNECTION_STATUSES),
  characters: z.array(text),
}

/** Main roadmap entry. Strict: unknown keys are reported, never silently dropped. */
export const roadmapTitleSchema = z
  .object({
    ...titleBaseShape,
    watch_order: z.number().int().min(1),
    is_doomsday_relevant: z.boolean(),
    completion_status: z.enum(COMPLETION_STATUSES),
    notes: text.optional(),
  })
  .strict()

/** Supplemental entry. Strict: `watch_order`, `completion_status` and `is_doomsday_relevant` are rejected. */
export const supplementalTitleSchema = z.object(titleBaseShape).strict()

export const collectionMetaSchema = z
  .object({
    id: text,
    title: text,
    description: text,
    target_title: text,
    target_release_date: isoDate,
    target_release_date_note: text,
    priority_definitions: z.object({ essential: text, recommended: text, optional: text }).strict(),
    connection_status_definitions: z
      .object({ confirmed: text, indirect: text, unconfirmed: text })
      .strict(),
    sources: z.array(z.url()).min(1),
  })
  .strict()

export const roadmapDatasetSchema = z
  .object({
    schema_version: z.literal('1.0.0'),
    collection: collectionMetaSchema,
    titles: z.array(roadmapTitleSchema),
    supplemental_titles: z.array(supplementalTitleSchema),
  })
  .strict()

// Compile-time guard: the schema and the hand-written interfaces must stay assignable both ways.
type AssertAssignable<_Sub extends Super, Super> = true
export type _RoadmapSchemaMatchesTypes = [
  AssertAssignable<z.infer<typeof roadmapDatasetSchema>, RoadmapDataset>,
  AssertAssignable<RoadmapDataset, z.infer<typeof roadmapDatasetSchema>>,
]

export interface ValidationIssue {
  /** e.g. `titles[3].priority` */
  path: string
  /** Affected project ID, when the issue is inside a title. */
  titleId: string | null
  message: string
}

export interface ValidationReport {
  ok: boolean
  issues: ValidationIssue[]
  counts: { titles: number; supplemental: number } | null
}

const MAIN_ONLY_FIELDS = new Set(['watch_order', 'completion_status', 'is_doomsday_relevant'])

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function idAt(data: unknown, section: string, index: number): string | null {
  if (!isRecord(data)) return null
  const list = data[section]
  if (!Array.isArray(list)) return null
  const entry: unknown = list[index]
  return isRecord(entry) && typeof entry.id === 'string' ? entry.id : null
}

function formatPath(path: PropertyKey[]): string {
  return path.reduce<string>((acc, seg) => {
    if (typeof seg === 'number') return `${acc}[${seg}]`
    return acc ? `${acc}.${String(seg)}` : String(seg)
  }, '')
}

/**
 * Validates the dataset without modifying it. Reports every problem with the affected title ID and field.
 * Checks the schema first, then cross-collection rules (unique IDs, watch order, duplicate titles).
 */
export function validateRoadmap(data: unknown): ValidationReport {
  const issues: ValidationIssue[] = []

  const parsed = roadmapDatasetSchema.safeParse(data)
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const [section, index] = issue.path
      const titleId = typeof section === 'string' && typeof index === 'number' ? idAt(data, section, index) : null
      const base = formatPath(issue.path)
      if (issue.code === 'unrecognized_keys') {
        for (const key of issue.keys) {
          const where = base ? `${base}.${key}` : key
          const message =
            section === 'supplemental_titles' && MAIN_ONLY_FIELDS.has(key)
              ? `"${key}" belongs only to main roadmap titles; supplemental titles must not have it`
              : 'unrecognized field'
          issues.push({ path: where, titleId, message })
        }
      } else {
        issues.push({ path: base || '(root)', titleId, message: issue.message })
      }
    }
  }

  if (isRecord(data)) {
    const main: unknown[] = Array.isArray(data.titles) ? data.titles : []
    const supp: unknown[] = Array.isArray(data.supplemental_titles) ? data.supplemental_titles : []

    const seenIds = new Map<string, string>()
    const seenTitles = new Map<string, string>()
    const orders = new Map<number, string[]>()
    const place = (section: string, list: unknown[]) =>
      list.forEach((entry, i) => {
        if (!isRecord(entry)) return
        const where = `${section}[${i}]`
        if (typeof entry.id === 'string') {
          const prior = seenIds.get(entry.id)
          if (prior) issues.push({ path: `${where}.id`, titleId: entry.id, message: `duplicate id; also used at ${prior}` })
          else seenIds.set(entry.id, where)
        }
        if (typeof entry.title === 'string' && typeof entry.release_year === 'number') {
          const key = `${entry.title.trim().toLowerCase()}|${entry.release_year}`
          const prior = seenTitles.get(key)
          if (prior) {
            issues.push({
              path: `${where}.title`,
              titleId: typeof entry.id === 'string' ? entry.id : null,
              message: `same title and release_year as ${prior}`,
            })
          } else seenTitles.set(key, where)
        }
        if (section === 'titles' && typeof entry.watch_order === 'number' && Number.isInteger(entry.watch_order)) {
          const ids = orders.get(entry.watch_order) ?? []
          ids.push(typeof entry.id === 'string' ? entry.id : where)
          orders.set(entry.watch_order, ids)
        }
      })
    place('titles', main)
    place('supplemental_titles', supp)

    for (const [order, ids] of orders) {
      if (ids.length > 1) {
        issues.push({ path: 'titles[].watch_order', titleId: ids[0] ?? null, message: `watch_order ${order} is used by ${ids.join(', ')}` })
      }
    }
    // Contiguity: 1..N with no gaps, N = number of main titles.
    const missing: number[] = []
    for (let n = 1; n <= main.length; n++) if (!orders.has(n)) missing.push(n)
    if (missing.length) {
      issues.push({ path: 'titles[].watch_order', titleId: null, message: `watch_order must cover 1..${main.length}; missing ${missing.join(', ')}` })
    }
  }

  const counts =
    isRecord(data) && Array.isArray(data.titles) && Array.isArray(data.supplemental_titles)
      ? { titles: data.titles.length, supplemental: data.supplemental_titles.length }
      : null
  return { ok: issues.length === 0, issues, counts }
}
