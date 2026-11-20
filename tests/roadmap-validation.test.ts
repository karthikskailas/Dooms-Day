import { describe, expect, it } from 'vitest'
import { validateRoadmap } from '../shared/schemas/roadmap.ts'
import { loadRoadmap } from './helpers.ts'

const messages = (data: unknown) => validateRoadmap(data).issues.map((i) => `${i.titleId ?? '-'} ${i.path}: ${i.message}`)

describe('roadmap dataset (real file)', () => {
  it('is valid', () => {
    const report = validateRoadmap(loadRoadmap())
    expect(report.issues).toEqual([])
    expect(report.counts).toEqual({ titles: 82, supplemental: 10 })
  })

  it('keeps the editorial facts established by the Phase 03 audit', () => {
    const d = loadRoadmap()
    const byPriority = (p: string) => d.titles.filter((t) => t.priority === p).length
    expect([byPriority('essential'), byPriority('recommended'), byPriority('optional')]).toEqual([10, 19, 53])
    expect(d.titles.map((t) => t.watch_order)).toEqual(Array.from({ length: 82 }, (_, i) => i + 1))
    expect(d.supplemental_titles.every((t) => !('watch_order' in t) && !('completion_status' in t))).toBe(true)
  })

  it('does not modify the data it validates', () => {
    const d = loadRoadmap()
    const before = structuredClone(d)
    validateRoadmap(d)
    expect(d).toEqual(before)
  })
})

describe('roadmap validation failures', () => {
  it('reports a duplicate id across collections, naming the title', () => {
    const d = loadRoadmap()
    d.supplemental_titles[0]!.id = 'marvel_001'
    expect(messages(d).join('\n')).toMatch(/marvel_001 supplemental_titles\[0\]\.id: duplicate id; also used at titles\[0\]/)
  })

  it('reports duplicate and missing watch orders', () => {
    const d = loadRoadmap()
    d.titles[1]!.watch_order = 1
    const out = messages(d).join('\n')
    expect(out).toMatch(/watch_order 1 is used by marvel_001, marvel_002/)
    expect(out).toMatch(/missing 2/)
  })

  it('reports an invalid priority with the title and field', () => {
    const d = loadRoadmap()
    ;(d.titles[4] as unknown as Record<string, unknown>).priority = 'critical'
    expect(messages(d).join('\n')).toMatch(/marvel_005 titles\[4\]\.priority/)
  })

  it('rejects watch_order and completion_status on a supplemental title', () => {
    const d = loadRoadmap()
    Object.assign(d.supplemental_titles[2]!, { watch_order: 5, completion_status: 'not_started' })
    const out = messages(d).join('\n')
    expect(out).toMatch(/legacy_xmen_003 supplemental_titles\[2\]\.watch_order: "watch_order" belongs only to main roadmap titles/)
    expect(out).toMatch(/completion_status/)
  })

  it('requires the main-only fields on main titles', () => {
    const d = loadRoadmap()
    delete (d.titles[0] as unknown as Record<string, unknown>).completion_status
    expect(messages(d).join('\n')).toMatch(/marvel_001 titles\[0\]\.completion_status/)
  })

  it('reports unknown fields instead of dropping them', () => {
    const d = loadRoadmap()
    Object.assign(d.titles[3]!, { nots: 'typo' })
    expect(messages(d).join('\n')).toMatch(/marvel_004 titles\[3\]\.nots: unrecognized field/)
  })

  it('accepts the optional notes field', () => {
    const d = loadRoadmap()
    expect(d.titles[3]!.notes).toBeTypeOf('string')
    expect(validateRoadmap(d).ok).toBe(true)
  })

  it('rejects an impossible collection date and bad completion status', () => {
    const d = loadRoadmap()
    d.collection.target_release_date = '2026-02-30'
    ;(d.titles[0] as unknown as Record<string, unknown>).completion_status = 'done'
    const out = messages(d).join('\n')
    expect(out).toMatch(/collection\.target_release_date: must be a real calendar date/)
    expect(out).toMatch(/marvel_001 titles\[0\]\.completion_status/)
  })

  it('does not throw on garbage input', () => {
    for (const bad of [null, 42, 'x', [], {}, { titles: 'no' }]) {
      expect(validateRoadmap(bad).ok).toBe(false)
    }
  })
})
