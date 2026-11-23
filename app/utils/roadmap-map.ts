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
 * Where things sit on the tree artwork (app/assets/images/yggdrasil-tree.webp, shown 2400 px wide, 4034 tall),
 * in map coordinates: the canopy's centre and half-axes, and the trunk's height range.
 */
export const TREE = {
  imgW: 2400,
  imgH: 4034,
  canopy: { cx: 0, cy: 1250, rx: 1100, ry: 880 },
  /** Route nodes climb the trunk at this spacing before the canopy spiral. */
  stepY: 165,
  /** Space between the lowest route node and the supplemental grove. */
  groveGap: 520,
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
 * Lays main titles on the tree artwork: the route climbs the trunk, then spirals outward through the canopy, so
 * each title sits beside its neighbours in watch order and every line stays short. Position comes from
 * watch_order only; the dataset defines no branches or realms, so none are drawn or implied.
 * `doomsdayOnly` keeps just the titles flagged is_doomsday_relevant, still in watch order.
 */
export function buildLayout(data: RoadmapDataset, includeSupplemental: boolean, doomsdayOnly = false): MapLayout {
  const main = data.titles.filter((t) => !doomsdayOnly || t.is_doomsday_relevant).sort((a, b) => a.watch_order - b.watch_order)
  const nodes: MapNode[] = treePoints(main.length).map((p, i) => ({
    kind: 'main',
    id: main[i]!.id,
    item: main[i]!,
    x: Math.round(p.x - NODE_W / 2),
    y: Math.round(p.y - ORB / 2),
    w: NODE_W,
    h: NODE_H,
  }))

  const edges: MapEdge[] = []
  for (let i = 1; i < nodes.length; i++) edges.push(edgeBetween(nodes[i - 1]!, nodes[i]!, i))

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

interface Point {
  x: number
  y: number
}

/** Orb centres: a wavy stem up the trunk, then an elliptical spiral outward from the canopy's centre. */
export function treePoints(n: number): Point[] {
  const { cx, cy, rx, ry } = TREE.canopy
  const stemN = n <= 4 ? n : Math.min(10, Math.ceil(n * 0.35))
  const pts: Point[] = []
  for (let i = 0; i < stemN; i++) {
    const up = stemN - 1 - i // 0 at the stem's top
    pts.push({ x: cx + Math.round(Math.sin(i * 1.4) * 26), y: cy + TREE.stepY + up * TREE.stepY })
  }

  const rest = n - stemN
  if (rest <= 0) return pts
  const avg = (rx + ry) / 2
  // Arc spacing that fills the canopy, but never so tight that labels collide or so loose the route falls apart.
  const arc = Math.min(300, Math.max(186, Math.sqrt((Math.PI * rx * ry) / rest)))
  let theta = -Math.PI / 2
  let rho = (arc * 0.8) / avg
  while (pts.length < n) {
    const x = cx + rx * rho * Math.cos(theta)
    const y = cy - ry * rho * Math.sin(theta)
    const r = Math.hypot(rx * rho * Math.cos(theta), ry * rho * Math.sin(theta))
    // Skip spots on the stem; the next point carries the route on.
    if (!(Math.abs(x - cx) < NODE_W + 40 && y > cy + 60)) pts.push({ x, y })
    const dTheta = arc / Math.max(r, 140)
    theta += dTheta
    rho += (arc / (2 * Math.PI * avg)) * dTheta
  }
  return pts
}

/** A gently bent line between orb centres, like a path on a game map. */
function edgeBetween(a: MapNode, b: MapNode, i: number): MapEdge {
  const x1 = a.x + a.w / 2
  const y1 = a.y + ORB / 2
  const x2 = b.x + b.w / 2
  const y2 = b.y + ORB / 2
  const bend = (i % 2 === 0 ? 1 : -1) * 0.1
  const cxm = (x1 + x2) / 2 - (y2 - y1) * bend
  const cym = (y1 + y2) / 2 + (x2 - x1) * bend
  return { from: a.id, to: b.id, d: `M${x1} ${y1} Q${cxm} ${cym} ${x2} ${y2}` }
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
