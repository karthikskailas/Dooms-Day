import { describe, expect, it } from 'vitest'
import roadmapJson from '../app/constant/marvel_doomsday_watchlist.json'
import type { RoadmapDataset } from '../shared/types/roadmap.ts'
import {
  NODE_H, NODE_W, TREE, buildLayout, currentTitleId, defaultFilters, hasActiveFilters, matchesFilters, neighbour,
} from '../app/utils/roadmap-map.ts'
import { centerOn, clampK, fitView, revealRect, zoomAt, MAX_K, MIN_K } from '../app/utils/map-viewport.ts'

const data = roadmapJson as unknown as RoadmapDataset
const full = buildLayout(data, true)
const journey = buildLayout(data, false, true)
const none = () => false

describe('layout: collections and order', () => {
  it('represents all 92 titles, 82 main and 10 supplemental', () => {
    expect(full.nodes).toHaveLength(92)
    expect(full.nodes.filter((n) => n.kind === 'main')).toHaveLength(82)
    expect(full.nodes.filter((n) => n.kind === 'supplemental')).toHaveLength(10)
    expect(new Set(full.nodes.map((n) => n.id)).size).toBe(92)
  })

  it('keeps main titles in watch order with original ids, and supplemental in dataset order', () => {
    const main = full.nodes.filter((n) => n.kind === 'main')
    expect(main.map((n) => n.id)).toEqual(data.titles.map((t) => t.id))
    main.forEach((n, i) => n.kind === 'main' && expect(n.item.watch_order).toBe(i + 1))
    expect(full.nodes.filter((n) => n.kind === 'supplemental').map((n) => n.id)).toEqual(
      data.supplemental_titles.map((t) => t.id),
    )
  })

  it('keeps the editorial records untouched', () => {
    for (const n of full.nodes) {
      const src = [...data.titles, ...data.supplemental_titles].find((t) => t.id === n.id)
      expect(n.item).toBe(src)
    }
  })

  it('the journey view has the three Fox X-Men films then the Doomsday-relevant main titles, in watch order, and no supplemental frame', () => {
    const relevant = data.titles.filter((t) => t.is_doomsday_relevant)
    expect(journey.nodes).toHaveLength(27)
    expect(journey.nodes.map((n) => n.id)).toEqual(['legacy_xmen_001', 'legacy_xmen_002', 'legacy_xmen_003', ...relevant.map((t) => t.id)])
    expect(journey.nodes.map((n) => n.kind === 'main' && n.order)).toEqual(Array.from({ length: 27 }, (_, i) => i + 1))
    expect(journey.edges).toHaveLength(26)
    expect(journey.supplementalFrame).toBeNull()
    expect(full.supplementalFrame).not.toBeNull()
  })

  it('draws only consecutive watch-order edges, never to supplemental titles', () => {
    expect(full.edges).toHaveLength(81)
    full.edges.forEach((e, i) => {
      expect(e.from).toBe(data.titles[i]!.id)
      expect(e.to).toBe(data.titles[i + 1]!.id)
    })
  })

  it('does not overlap nodes', () => {
    for (const a of full.nodes) {
      for (const b of full.nodes) {
        if (a === b) continue
        const overlap = a.x < b.x + NODE_W && b.x < a.x + NODE_W && a.y < b.y + NODE_H && b.y < a.y + NODE_H
        expect(overlap, `${a.id} overlaps ${b.id}`).toBe(false)
      }
    }
  })

  it('places the supplemental cluster below the whole tree', () => {
    const mainBottom = Math.max(...full.nodes.filter((n) => n.kind === 'main').map((n) => n.y + n.h))
    const suppTop = Math.min(...full.nodes.filter((n) => n.kind === 'supplemental').map((n) => n.y))
    expect(suppTop).toBeGreaterThan(mainBottom)
  })

  it('starts at the base of the trunk: the first title is the lowest', () => {
    const main = full.nodes.filter((n) => n.kind === 'main')
    expect(main[0]!.y).toBe(Math.max(...main.map((n) => n.y)))
  })

  it('keeps every hop bounded (the longest crosses from one bough tip to the next bough start)', () => {
    const byId = new Map(full.nodes.map((n) => [n.id, n]))
    for (const e of full.edges) {
      const a = byId.get(e.from)!
      const b = byId.get(e.to)!
      expect(Math.hypot(a.x - b.x, a.y - b.y), `${e.from}→${e.to}`).toBeLessThan(1700)
    }
  })

  it('puts every node on or beside a traced branch, inside the artwork', () => {
    const w = TREE.imgW / 2
    for (const n of full.nodes.filter((m) => m.kind === 'main')) {
      expect(Math.abs(n.x + n.w / 2), n.id).toBeLessThan(w)
      expect(n.y, n.id).toBeGreaterThan(0)
      expect(n.y, n.id).toBeLessThan(TREE.imgH)
    }
  })

  it('also lays out the 23-title Doomsday route without overlaps', () => {
    for (const a of journey.nodes) {
      for (const b of journey.nodes) {
        if (a === b) continue
        const overlap = a.x < b.x + NODE_W && b.x < a.x + NODE_W && a.y < b.y + NODE_H && b.y < a.y + NODE_H
        expect(overlap, `${a.id} overlaps ${b.id}`).toBe(false)
      }
    }
  })
})

describe('filters', () => {
  const find = (q: string) => full.nodes.filter((n) => matchesFilters(n, { ...defaultFilters(), query: q }, none))

  it('defaults match everything and are inactive', () => {
    expect(hasActiveFilters(defaultFilters())).toBe(false)
    expect(full.nodes.every((n) => matchesFilters(n, defaultFilters(), none))).toBe(true)
  })

  it('searches titles case-insensitively, including supplemental ones', () => {
    expect(find('CAPTAIN AMERICA').length).toBeGreaterThan(0)
    expect(find('x-men').some((n) => n.kind === 'supplemental')).toBe(true)
    expect(find('zzzz-no-such-title')).toHaveLength(0)
  })

  it('filters by type and priority against the data', () => {
    const movies = full.nodes.filter((n) => matchesFilters(n, { ...defaultFilters(), type: 'movie' }, none))
    expect(movies).toHaveLength(38 + 10)
    const essential = full.nodes.filter((n) => matchesFilters(n, { ...defaultFilters(), priority: 'essential' }, none))
    expect(essential).toHaveLength(10)
  })

  it('filters by completion using the supplied progress', () => {
    const watched = (id: string) => id === 'marvel_001'
    const done = full.nodes.filter((n) => matchesFilters(n, { ...defaultFilters(), status: 'completed' }, watched))
    expect(done.map((n) => n.id)).toEqual(['marvel_001'])
    const todo = full.nodes.filter((n) => matchesFilters(n, { ...defaultFilters(), status: 'not_started' }, watched))
    expect(todo).toHaveLength(91)
  })
})

describe('current position', () => {
  it('is the first main title when nothing is watched', () => {
    expect(currentTitleId(full, none)).toBe('marvel_001')
  })
  it('is the first unwatched title in watch order, not the last watched', () => {
    const watched = new Set(['marvel_001', 'marvel_002', 'marvel_004'])
    expect(currentTitleId(full, (id) => watched.has(id))).toBe('marvel_003')
  })
  it('ignores supplemental titles and is null when every main title is watched', () => {
    const ids = new Set(data.titles.map((t) => t.id))
    expect(currentTitleId(full, (id) => ids.has(id))).toBeNull()
  })
})

describe('keyboard neighbours', () => {
  it('moves up the tree and returns null at the base', () => {
    expect(neighbour(journey.nodes, 'marvel_002', 'up')).not.toBeNull()
    const base = journey.nodes.reduce((lo, n) => (n.y > lo.y ? n : lo))
    expect(neighbour(journey.nodes, base.id, 'down')).toBeNull()
  })
  it('only returns a node lying in the requested direction', () => {
    const from = journey.nodes[5]!
    const right = neighbour(journey.nodes, from.id, 'right')
    if (right) expect(right.x).toBeGreaterThan(from.x)
  })
})

describe('viewport math', () => {
  it('zoomAt keeps the point under the cursor fixed', () => {
    const v = { x: 40, y: -20, k: 1 }
    const z = zoomAt(v, 300, 200, 1.5)
    const before = { x: (300 - v.x) / v.k, y: (200 - v.y) / v.k }
    expect((300 - z.x) / z.k).toBeCloseTo(before.x)
    expect((200 - z.y) / z.k).toBeCloseTo(before.y)
  })
  it('clamps scale', () => {
    expect(clampK(99)).toBe(MAX_K)
    expect(clampK(0)).toBe(MIN_K)
  })
  it('fitView shows the whole map inside the viewport', () => {
    const v = fitView(full.bounds, 1440, 700, 48)
    const b = full.bounds
    expect(b.x * v.k + v.x).toBeGreaterThanOrEqual(0)
    expect((b.x + b.w) * v.k + v.x).toBeLessThanOrEqual(1440)
    expect(b.y * v.k + v.y).toBeGreaterThanOrEqual(0)
    expect((b.y + b.h) * v.k + v.y).toBeLessThanOrEqual(700)
  })
  it('centerOn puts the map point at the screen point', () => {
    const v = centerOn(100, 50, 0.8, 400, 300)
    expect(100 * v.k + v.x).toBeCloseTo(400)
    expect(50 * v.k + v.y).toBeCloseTo(300)
  })
  it('revealRect leaves a visible rect alone and pans a hidden one in', () => {
    const v = { x: 0, y: 0, k: 1 }
    const free = { x: 0, y: 0, w: 800, h: 600 }
    expect(revealRect(v, { x: 10, y: 10, w: 100, h: 50 }, free)).toBe(v)
    const moved = revealRect(v, { x: 900, y: 10, w: 100, h: 50 }, free)
    expect(900 + moved.x + 100).toBeLessThanOrEqual(800)
  })
})
