// Pure map logic: layout, filters, current position and keyboard neighbours. No DOM, no storage.
// The editorial JSON defines exactly one relationship between titles: watch_order. Edges are drawn only
// between consecutive watch orders; the spatial arrangement carries no narrative or chronological meaning.
import type { Priority, RoadmapDataset, RoadmapTitle, SupplementalTitle, TitleType } from '../../shared/types/roadmap.ts'

/** A node's box: the orb on top, its label underneath. */
export const NODE_W = 150
export const NODE_H = 104
export const ORB = 64
const SUPP_COLS = 5
const SUPP_STEP_X = 190
const SUPP_STEP_Y = 150
const FRAME_PAD = 40

/**
 * The tree artwork (app/assets/images/yggdrasil-tree.webp, 966 x 1628 source px) is shown IMG_W map units wide.
 * BRANCHES below are traced by eye over that picture, in source pixels.
 */
const SRC_W = 966
const SRC_H = 1628
const IMG_W = 3400
export const TREE = {
  imgW: IMG_W,
  imgH: Math.round((IMG_W * SRC_H) / SRC_W),
  /** Space between the lowest route node and the supplemental grove (under the roots). */
  groveGap: 260,
}
const SCALE = IMG_W / SRC_W

type P = readonly [number, number]
interface Branch {
  name: string
  /** Source-pixel polyline, outward from its junction on the trunk. */
  pts: readonly P[]
}

/** In route order: up the trunk, out along the left boughs low to high, across the crown, then back down the right. */
const BRANCHES: readonly Branch[] = [
  { name: 'trunk', pts: [[500, 1075], [498, 990], [500, 900], [503, 810], [505, 720], [505, 645]] },
  { name: 'left-low', pts: [[503, 800], [446, 782], [357, 789], [275, 804], [208, 811], [149, 856], [111, 886]] },
  { name: 'left-mid', pts: [[505, 750], [461, 744], [386, 700], [297, 670], [223, 655], [149, 625], [74, 603], [22, 596]] },
  { name: 'left-high', pts: [[505, 665], [431, 640], [371, 573], [312, 529], [245, 484], [178, 455], [111, 462]] },
  { name: 'crown-left', pts: [[505, 645], [453, 626], [416, 566], [405, 506], [416, 462], [446, 432], [461, 395]] },
  { name: 'crown-right', pts: [[508, 645], [520, 626], [520, 566], [512, 499], [505, 447], [520, 402], [512, 372]] },
  { name: 'right-high', pts: [[508, 665], [535, 626], [594, 596], [654, 552], [713, 507], [773, 463], [817, 432]] },
  { name: 'right-mid', pts: [[505, 745], [550, 737], [624, 700], [698, 685], [773, 670], [847, 655], [921, 625], [958, 603]] },
  { name: 'right-low', pts: [[505, 800], [542, 782], [602, 789], [661, 804], [706, 837], [758, 874], [817, 889], [884, 889], [936, 878]] },
]

interface Pt {
  x: number
  y: number
}
interface Line {
  pts: Pt[]
  /** Distance along the line at each point. */
  at: number[]
  length: number
}

/** Map-space polylines with cumulative lengths, one per branch. */
const LINES: readonly Line[] = BRANCHES.map((b) => {
  const pts = b.pts.map(([x, y]) => ({ x: (x - SRC_W / 2) * SCALE, y: y * SCALE }))
  const at = [0]
  for (let i = 1; i < pts.length; i++) at.push(at[i - 1]! + Math.hypot(pts[i]!.x - pts[i - 1]!.x, pts[i]!.y - pts[i - 1]!.y))
  return { pts, at, length: at[at.length - 1]! }
})

/** The point at a distance along a line, and its unit tangent. */
function pointAt(line: Line, d: number): Pt & { tx: number; ty: number } {
  const dd = Math.min(Math.max(d, 0), line.length)
  let i = 1
  while (i < line.pts.length - 1 && line.at[i]! < dd) i++
  const a = line.pts[i - 1]!
  const b = line.pts[i]!
  const seg = line.at[i]! - line.at[i - 1]! || 1
  const f = (dd - line.at[i - 1]!) / seg
  return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, tx: (b.x - a.x) / seg, ty: (b.y - a.y) / seg }
}

/** The line's points between two distances, inclusive, in travel order (works backwards too). */
function walk(line: Line, from: number, to: number): Pt[] {
  const out: Pt[] = [pointAt(line, from)]
  const inner = line.pts.map((p, i) => ({ p, d: line.at[i]! })).filter(({ d }) => d > Math.min(from, to) && d < Math.max(from, to))
  if (to < from) inner.reverse()
  out.push(...inner.map(({ p }) => p), pointAt(line, to))
  return out
}

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

interface NodeBase extends Rect {
  id: string
}
export interface MainNode extends NodeBase {
  kind: 'main'
  item: RoadmapTitle
  /** 1-based position on this map. Equals watch_order on the Universe map; counts 1, 2, 3 on the Doomsday map. */
  order: number
}
export interface SupplementalNode extends NodeBase {
  kind: 'supplemental'
  item: SupplementalTitle
}
export type MapNode = MainNode | SupplementalNode

export interface MapEdge {
  from: string
  to: string
  /** SVG path in map coordinates. */
  d: string
}

export interface MapLayout {
  /** Main nodes in watch order, then supplemental nodes in dataset order. */
  nodes: MapNode[]
  /** One edge per consecutive pair of main titles. */
  edges: MapEdge[]
  bounds: Rect
  /** The labelled frame around the supplemental cluster; null when it is not shown. */
  supplementalFrame: Rect | null
}

/**
 * Lays main titles along the branches of the tree artwork: the route climbs the trunk, then follows each bough
 * out in turn. Which branch a title lands on comes from watch_order and branch length only; the dataset defines no
 * branches or realms, so none are implied.
 * `doomsdayOnly` keeps just the titles flagged is_doomsday_relevant, still in watch order, after the two Fox X-Men films.
 */
/**
 * Disney+'s official "Countdown to Avengers: Doomsday" list opens with the Fox films X-Men (2000) and
 * X2: X-Men United (2003), and the announced cast includes Fox-era actors (Mystique, Cyclops, Gambit, Kelsey Grammer),
 * so The Last Stand joins them. They live in the supplemental collection (no watch order), so the Doomsday route
 * borrows them as its first three steps. Source: https://thedirect.com/article/disney-plus-adds-mcu-project-avengers-doomsday-movies-list
 */
export const DOOMSDAY_FOX_IDS = ['legacy_xmen_001', 'legacy_xmen_002', 'legacy_xmen_003'] as const

export function buildLayout(data: RoadmapDataset, includeSupplemental: boolean, doomsdayOnly = false): MapLayout {
  const main = data.titles.filter((t) => !doomsdayOnly || t.is_doomsday_relevant).sort((a, b) => a.watch_order - b.watch_order)
  if (doomsdayOnly) {
    const fox = DOOMSDAY_FOX_IDS.flatMap((id) => data.supplemental_titles.find((s) => s.id === id) ?? [])
    // watch_order 0: they sit before the dataset's order; the map's own `order` numbers them 1 and 2.
    main.unshift(...fox.map((s): RoadmapTitle => ({ ...s, watch_order: 0, is_doomsday_relevant: true, completion_status: 'not_started' })))
  }
  const spots = branchSpots(main.length)
  const nodes: MapNode[] = spots.map((p, i) => ({
    kind: 'main',
    id: main[i]!.id,
    item: main[i]!,
    order: i + 1,
    x: Math.round(p.x - NODE_W / 2),
    y: Math.round(p.y - ORB / 2),
    w: NODE_W,
    h: NODE_H,
  }))

  const edges: MapEdge[] = []
  for (let i = 1; i < nodes.length; i++) edges.push(edgeBetween(nodes[i - 1]!, nodes[i]!, spots[i - 1]!, spots[i]!))

  const mainBounds = boundsOf(nodes)
  let frame: Rect | null = null
  if (includeSupplemental && data.supplemental_titles.length > 0) {
    const top = mainBounds.y + mainBounds.h + TREE.groveGap
    const left = -((SUPP_COLS - 1) * SUPP_STEP_X + NODE_W) / 2
    data.supplemental_titles.forEach((item, i) => {
      nodes.push({
        kind: 'supplemental',
        id: item.id,
        item,
        x: left + (i % SUPP_COLS) * SUPP_STEP_X,
        y: top + Math.floor(i / SUPP_COLS) * SUPP_STEP_Y,
        w: NODE_W,
        h: NODE_H,
      })
    })
    const supp = boundsOf(nodes.filter((n) => n.kind === 'supplemental'))
    frame = { x: supp.x - FRAME_PAD, y: supp.y - FRAME_PAD - 32, w: supp.w + FRAME_PAD * 2, h: supp.h + FRAME_PAD * 2 + 32 }
  }

  return { nodes, edges, bounds: unionBounds(boundsOf(nodes), frame), supplementalFrame: frame }
}

interface Spot extends Pt {
  branch: number
  /** Distance along the branch line (the orb itself may sit slightly to one side of it). */
  d: number
}

/** Below this spacing along a branch, orbs alternate to either side of it so their labels clear each other. */
const TIGHT = 220
const SIDE = 52

/**
 * Orb centres along the branches, in route order: each branch gets a share of the titles in proportion to its
 * length (largest remainder), spaced evenly along it.
 */
export function branchSpots(n: number): Spot[] {
  const total = LINES.reduce((sum, l) => sum + l.length, 0)
  const exact = LINES.map((l) => (n * l.length) / total)
  const counts = exact.map(Math.floor)
  let left = n - counts.reduce((a, b) => a + b, 0)
  exact
    .map((e, i) => ({ i, r: e - Math.floor(e) }))
    .sort((a, b) => b.r - a.r)
    .forEach(({ i }) => {
      if (left-- > 0) counts[i]!++
    })

  const spots: Spot[] = []
  LINES.forEach((line, branch) => {
    const m = counts[branch]!
    const tight = line.length / m < TIGHT
    for (let k = 0; k < m; k++) {
      const d = (line.length * (k + 0.5)) / m
      const p = pointAt(line, d)
      const side = tight ? (k % 2 === 0 ? SIDE : -SIDE) : 0
      spots.push({ x: p.x - p.ty * side, y: p.y + p.tx * side, branch, d })
    }
  })
  separate(spots)
  return spots
}

/** Nudges apart any two label boxes that still overlap (mostly near the trunk, where boughs meet). */
function separate(spots: Spot[]) {
  const gap = 6
  for (let pass = 0; pass < 60; pass++) {
    let moved = false
    for (let i = 0; i < spots.length; i++) {
      for (let j = i + 1; j < spots.length; j++) {
        const a = spots[i]!
        const b = spots[j]!
        const ox = NODE_W + gap - Math.abs(a.x - b.x)
        const oy = NODE_H + gap - Math.abs(a.y - b.y)
        if (ox <= 0 || oy <= 0) continue
        moved = true
        if (ox < oy) {
          const s = (a.x <= b.x ? -1 : 1) * (ox / 2)
          a.x += s
          b.x -= s
        } else {
          const s = (a.y <= b.y ? -1 : 1) * (oy / 2)
          a.y += s
          b.y -= s
        }
      }
    }
    if (!moved) return
  }
}

/**
 * The route line between two consecutive orbs, drawn along the wood: straight down the branch when both sit on it,
 * otherwise back to the first branch's root, across to the next one and out along it.
 */
function edgeBetween(a: MapNode, b: MapNode, sa: Spot, sb: Spot): MapEdge {
  const via: Pt[] =
    sa.branch === sb.branch
      ? walk(LINES[sa.branch]!, sa.d, sb.d)
      : [...walk(LINES[sa.branch]!, sa.d, 0), ...walk(LINES[sb.branch]!, 0, sb.d)]
  const ends = (n: MapNode) => ({ x: n.x + n.w / 2, y: n.y + ORB / 2 })
  const pts = trimEnd([ends(a), ...via, ends(b)], ORB / 2 + 10)
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${Math.round(p.x)} ${Math.round(p.y)}`).join(' ')
  return { from: a.id, to: b.id, d }
}

/** Shortens a polyline's end by `r`, so a closing arrowhead lands on the orb's rim instead of under it. */
function trimEnd(pts: Pt[], r: number): Pt[] {
  const out = [...pts]
  let left = r
  while (out.length > 2) {
    const a = out[out.length - 2]!
    const b = out[out.length - 1]!
    const len = Math.hypot(b.x - a.x, b.y - a.y)
    if (len > left) break
    left -= len
    out.pop()
  }
  const a = out[out.length - 2]!
  const b = out[out.length - 1]!
  const len = Math.hypot(b.x - a.x, b.y - a.y) || 1
  const f = Math.max(0, len - left) / len
  out[out.length - 1] = { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f }
  return out
}

function boundsOf(nodes: readonly Rect[]): Rect {
  const minX = Math.min(...nodes.map((n) => n.x))
  const minY = Math.min(...nodes.map((n) => n.y))
  const maxX = Math.max(...nodes.map((n) => n.x + n.w))
  const maxY = Math.max(...nodes.map((n) => n.y + n.h))
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY }
}

function unionBounds(a: Rect, b: Rect | null): Rect {
  if (!b) return a
  return boundsOf([a, b])
}

// ---------- Filters ----------

export type StatusFilter = 'all' | 'not_started' | 'completed'

export interface MapFilters {
  query: string
  type: TitleType | 'all'
  priority: Priority | 'all'
  status: StatusFilter
}

export const defaultFilters = (): MapFilters => ({ query: '', type: 'all', priority: 'all', status: 'all' })

export const hasActiveFilters = (f: MapFilters) =>
  f.query.trim() !== '' || f.type !== 'all' || f.priority !== 'all' || f.status !== 'all'

/** Case-insensitive title search plus the type, priority and status filters. */
export function matchesFilters(node: MapNode, f: MapFilters, isWatched: (id: string) => boolean): boolean {
  const q = f.query.trim().toLowerCase()
  if (q && !node.item.title.toLowerCase().includes(q)) return false
  if (f.type !== 'all' && node.item.type !== f.type) return false
  if (f.priority !== 'all' && node.item.priority !== f.priority) return false
  if (f.status === 'completed' && !isWatched(node.id)) return false
  if (f.status === 'not_started' && isWatched(node.id)) return false
  return true
}

// ---------- Current position ----------

/**
 * The first main title, in watch order, that the user has not marked watched; null when all are watched.
 * Progress has no "in progress" state, so this is the only position that can be derived without inventing data.
 * Supplemental titles have no order and never count.
 */
export function currentTitleId(layout: MapLayout, isWatched: (id: string) => boolean): string | null {
  return layout.nodes.find((n) => n.kind === 'main' && !isWatched(n.id))?.id ?? null
}

// ---------- Keyboard navigation ----------

export type Direction = 'left' | 'right' | 'up' | 'down'

/**
 * The nearest node in a direction from the given one, judged by centre position. Off-axis distance is
 * weighted so ArrowRight prefers the node on the same row over a closer one on another row.
 */
export function neighbour(nodes: readonly MapNode[], fromId: string, dir: Direction): MapNode | null {
  const from = nodes.find((n) => n.id === fromId)
  if (!from) return null
  const cx = from.x + from.w / 2
  const cy = from.y + from.h / 2
  let best: MapNode | null = null
  let bestScore = Infinity
  for (const n of nodes) {
    if (n.id === fromId) continue
    const dx = n.x + n.w / 2 - cx
    const dy = n.y + n.h / 2 - cy
    const along = dir === 'right' ? dx : dir === 'left' ? -dx : dir === 'down' ? dy : -dy
    if (along <= 1) continue
    const across = dir === 'left' || dir === 'right' ? Math.abs(dy) : Math.abs(dx)
    const score = along + across * 3
    if (score < bestScore) {
      bestScore = score
      best = n
    }
  }
  return best
}
