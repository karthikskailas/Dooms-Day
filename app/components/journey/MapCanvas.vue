
<script setup lang="ts">
import { Maximize, Minus, Plus, RotateCcw } from 'lucide-vue-next'
import { centerOn, fitView, revealRect, zoomAt, type View } from '../../utils/map-viewport.ts'
import { TREE, neighbour, type Direction, type MapLayout } from '../../utils/roadmap-map.ts'

// The pan/zoom surface. Nodes are real buttons inside one transformed layer; edges are one SVG behind them.
// Mouse drag, wheel, trackpad pinch and touch pinch all feed the same View.
const props = defineProps<{
  layout: MapLayout
  isWatched: (id: string) => boolean
  currentId: string | null
  /** The title after the current one. */
  nextId: string | null
  /** Start framed like the intro video's last shot, until diveIn() is called. */
  alignIntro: boolean
  markerText: string
  selectedId: string | null
  /** Ids that match the search and filters; null when none are active. */
  visibleIds: ReadonlySet<string> | null
  /** Whether the preview is open, so the canvas can keep the selected node out from under it. */
  previewOpen: boolean
  /** Screen pixels at the top covered by the toolbar. */
  topInset: number
}>()
defineEmits<{ select: [id: string] }>()

const DRAG_THRESHOLD = 5
const COMPACT_BELOW = 0.45

const el = ref<HTMLElement | null>(null)
const size = reactive({ w: 0, h: 0 })
const view = ref<View>({ x: 0, y: 0, k: 1 })
const animating = ref(false)
const duration = ref(350)
const ready = ref(false)
let moved = false // the user has moved the camera; stop auto-centering on the current title
const tabbableId = ref<string | null>(null)

const compact = computed(() => view.value.k < COMPACT_BELOW)
const wide = () => size.w >= 768
const DRAWER_W = 400
const insets = () => ({
  top: props.topInset,
  right: props.previewOpen && wide() ? DRAWER_W + 16 : 0,
  bottom: props.previewOpen && !wide() ? size.h * 0.5 : 0,
})
const freeRect = () => {
  const i = insets()
  return { x: 8, y: i.top, w: size.w - 16 - i.right, h: size.h - i.top - i.bottom - 8 }
}

const nodeById = (id: string) => props.layout.nodes.find((n) => n.id === id)

function go(next: View, animate = true, ms = 350) {
  animating.value = animate
  duration.value = ms
  view.value = next
}

function resetView() {
  moved = false
  const n = nodeById(props.currentId ?? '') ?? props.layout.nodes[0]
  if (!n) return
  const f = freeRect()
  go(centerOn(n.x + n.w / 2, n.y + n.h / 2, wide() ? 0.9 : 0.8, f.x + f.w / 2, f.y + f.h / 2))
}

function fit() {
  moved = true
  const f = freeRect()
  const v = fitView(props.layout.bounds, f.w, f.h, wide() ? 32 : 12)
  go({ ...v, x: v.x + f.x, y: v.y + f.y })
}

function zoomBy(factor: number) {
  moved = true
  go(zoomAt(view.value, size.w / 2, size.h / 2, view.value.k * factor))
}

/** Pans only if the node is outside the free area (not under the toolbar or preview). */
function reveal(id: string) {
  const n = nodeById(id)
  if (!n) return
  const next = revealRect(view.value, n, freeRect())
  if (next !== view.value) {
    moved = true
    go(next)
  }
}

/** Centres a node in the free area, zooming in to a readable scale if needed. */
function focusOn(id: string) {
  const n = nodeById(id)
  if (!n) return
  moved = true
  const f = freeRect()
  go(centerOn(n.x + n.w / 2, n.y + n.h / 2, Math.max(view.value.k, 0.85), f.x + f.w / 2, f.y + f.h / 2))
}

/**
 * Frames the tree where it stands in the intro video's final shot (letterbox cropped, 1920 x 864, shown like
 * object-fit: cover): trunk foot at the horizontal centre and 81% down, canopy as wide as in the frame about 1.75 s before the end
 * (the middle of the dissolve; the video camera is still pulling back).
 */
function alignToIntro() {
  const c = Math.max(size.w / 1920, size.h / 864)
  const k = (1.05 * c) / (TREE.imgW / 966)
  const footX = ((500 - 483) * TREE.imgW) / 966
  const footY = (1075 * TREE.imgW) / 966
  moved = true
  go({ x: size.w / 2 - footX * k, y: (size.h - 864 * c) / 2 + 0.81 * 864 * c - footY * k, k }, false)
}

/** After the intro: glide from the tree overview into the start of the route. */
function diveIn() {
  moved = false
  const n = nodeById(props.currentId ?? '') ?? props.layout.nodes[0]
  if (!n) return
  const f = freeRect()
  go(centerOn(n.x + n.w / 2, n.y + n.h / 2, wide() ? 0.9 : 0.8, f.x + f.w / 2, f.y + f.h / 2), true, 1400)
}
defineExpose({ focusOn, diveIn })

// ---------- Size and first view ----------
onMounted(() => {
  const target = el.value
  if (!target) return
  const measure = () => {
    size.w = target.clientWidth
    size.h = target.clientHeight
    // A hidden canvas (list view) measures 0; keep the camera until it is shown again.
    if (size.w > 0 && !ready.value) {
      ready.value = true
      if (props.alignIntro) alignToIntro()
      else resetView()
      animating.value = false
    }
  }
  const ro = new ResizeObserver(measure)
  ro.observe(target)
  measure()
  onBeforeUnmount(() => ro.disconnect())
})

// Saved progress arrives after mount; follow it until the user takes the camera.
watch(
  () => props.currentId,
  () => {
    if (ready.value && !moved) resetView()
  },
)

watch(
  () => [props.selectedId, props.previewOpen] as const,
  ([id, open]) => {
    if (id && open && ready.value) reveal(id)
  },
)

// ---------- Pointer: drag and pinch ----------
const pointers = new Map<number, { x: number; y: number }>()
let dragging = false
let suppressClick = false
let lastPinch: { dist: number; cx: number; cy: number } | null = null

const local = (e: PointerEvent) => {
  const r = el.value!.getBoundingClientRect()
  return { x: e.clientX - r.left, y: e.clientY - r.top }
}
const pinchState = () => {
  const [a, b] = [...pointers.values()]
  return { dist: Math.hypot(a!.x - b!.x, a!.y - b!.y), cx: (a!.x + b!.x) / 2, cy: (a!.y + b!.y) / 2 }
}
let downAt = { x: 0, y: 0 }

function onPointerDown(e: PointerEvent) {
  if (e.pointerType === 'mouse' && e.button !== 0) return
  animating.value = false
  pointers.set(e.pointerId, local(e))
  if (pointers.size === 1) {
    downAt = { ...local(e) }
    dragging = false
  } else if (pointers.size === 2) {
    lastPinch = pinchState()
    dragging = true
    suppressClick = true
  }
}

function onPointerMove(e: PointerEvent) {
  const prev = pointers.get(e.pointerId)
  if (!prev) return
  const p = local(e)
  pointers.set(e.pointerId, p)

  if (pointers.size >= 2 && lastPinch) {
    const now = pinchState()
    const zoomed = zoomAt(view.value, lastPinch.cx, lastPinch.cy, view.value.k * (now.dist / lastPinch.dist))
    view.value = { ...zoomed, x: zoomed.x + (now.cx - lastPinch.cx), y: zoomed.y + (now.cy - lastPinch.cy) }
    lastPinch = now
    moved = true
    return
  }
  if (!dragging && Math.hypot(p.x - downAt.x, p.y - downAt.y) > DRAG_THRESHOLD) {
    dragging = true
    el.value?.setPointerCapture(e.pointerId)
  }
  if (dragging) {
    view.value = { ...view.value, x: view.value.x + p.x - prev.x, y: view.value.y + p.y - prev.y }
    moved = true
  }
}

function onPointerEnd(e: PointerEvent) {
  pointers.delete(e.pointerId)
  lastPinch = null
  if (pointers.size === 0 && dragging) {
    // The browser fires a click after a drag; swallow it so dragging over a node does not select it.
    suppressClick = true
    setTimeout(() => (suppressClick = false), 0)
    dragging = false
  }
}

function onClickCapture(e: MouseEvent) {
  if (suppressClick) {
    e.stopPropagation()
    e.preventDefault()
  }
}

function onWheel(e: WheelEvent) {
  const r = el.value!.getBoundingClientRect()
  // Trackpad pinch arrives as ctrl+wheel with small deltas, so it gets a larger factor.
  const factor = Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015))
  animating.value = false
  moved = true
  view.value = zoomAt(view.value, e.clientX - r.left, e.clientY - r.top, view.value.k * factor)
}

// ---------- Keyboard ----------
const arrows: Record<string, Direction> = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' }

async function focusNode(id: string) {
  tabbableId.value = id
  reveal(id)
  await nextTick()
  el.value?.querySelector<HTMLElement>(`[data-node-id="${id}"]`)?.focus({ preventScroll: true })
}

function onKeydown(e: KeyboardEvent) {
  const inNode = (e.target as HTMLElement).dataset?.nodeId
  const dir = arrows[e.key]
  if (dir && inNode) {
    e.preventDefault()
    const next = neighbour(props.layout.nodes, inNode, dir)
    if (next) focusNode(next.id)
  } else if (e.key === '+' || e.key === '=') zoomBy(1.25)
  else if (e.key === '-') zoomBy(0.8)
  else if (e.key === '0') resetView()
  else if (e.key === 'Home' && inNode) {
    e.preventDefault()
    focusNode(props.layout.nodes[0]!.id)
  }
}

function onFocusin(e: FocusEvent) {
  const id = (e.target as HTMLElement).dataset?.nodeId
  if (id) tabbableId.value = id
}

const tabbable = computed(() => tabbableId.value ?? props.currentId ?? props.layout.nodes[0]?.id ?? null)

const edgeClass = (from: string, to: string) => {
  const done = props.isWatched(from) && props.isWatched(to)
  const dim = props.visibleIds && !(props.visibleIds.has(from) && props.visibleIds.has(to))
  return [done ? 'stroke-doom-green-bright drop-shadow-[0_0_6px_var(--color-doom-green-bright)]' : 'stroke-ink/40', dim ? 'opacity-25' : '']
}

const controlClass =
  'inline-flex size-11 items-center justify-center bg-surface-raised text-ink transition-colors duration-150 hover:bg-surface-soft hover:text-gold-soft'
</script>

<template>
  <div
    ref="el"
    role="group"
    aria-label="Roadmap map. Drag to pan, scroll or pinch to zoom. Use the arrow keys to move between titles, plus and minus to zoom, 0 to reset."
    class="group/map relative size-full touch-none select-none overflow-hidden bg-void cursor-grab active:cursor-grabbing"
    :data-compact="compact ? '' : null"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerEnd"
    @pointercancel="onPointerEnd"
    @click.capture="onClickCapture"
    @wheel.prevent="onWheel"
    @keydown="onKeydown"
    @focusin="onFocusin"
  >
    <div
      class="absolute left-0 top-0 origin-top-left will-change-transform"
      :class="[animating ? 'transition-transform ease-out' : '', ready ? '' : 'invisible']"
      :style="{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})`, transitionDuration: `${duration}ms` }"
    >
      <div
        v-if="layout.supplementalFrame"
        class="absolute rounded-media border border-dashed border-gold-soft/50"
        :style="{
          left: `${layout.supplementalFrame.x}px`,
          top: `${layout.supplementalFrame.y}px`,
          width: `${layout.supplementalFrame.w}px`,
          height: `${layout.supplementalFrame.h}px`,
        }"
      >
        <p class="absolute left-6 top-4 text-[0.9375rem] font-semibold uppercase tracking-wider text-gold-soft">
          Supplemental titles · no watch order · not part of the path
        </p>
      </div>

      <JourneyTreeBackdrop />

      <svg class="pointer-events-none absolute left-0 top-0 overflow-visible" width="1" height="1" aria-hidden="true">
        <defs>
          <marker id="route-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">
            <path d="M0 0 L10 5 L0 10 z" class="fill-ink/70" />
          </marker>
          <marker id="route-arrow-done" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">
            <path d="M0 0 L10 5 L0 10 z" class="fill-doom-green-bright" />
          </marker>
        </defs>
        <path
          v-for="edge in layout.edges"
          :key="edge.to"
          :class="edgeClass(edge.from, edge.to)"
          :d="edge.d"
          fill="none"
          stroke-width="3"
          stroke-linecap="round"
          :marker-end="`url(#${isWatched(edge.from) && isWatched(edge.to) ? 'route-arrow-done' : 'route-arrow'})`"
        />
      </svg>

      <JourneyMapNode
        v-for="node in layout.nodes"
        :key="node.id"
        :node="node"
        :watched="isWatched(node.id)"
        :marker="node.id === currentId ? markerText : null"
        :next="node.id === nextId"
        :selected="node.id === selectedId"
        :dimmed="visibleIds !== null && !visibleIds.has(node.id)"
        :tabbable="node.id === tabbable"
        @select="$emit('select', $event)"
      />
    </div>

    <!-- Controls stay clear of the toolbar and the preview. -->
    <div
      class="absolute bottom-3 left-3 z-20 flex flex-col divide-y divide-line-strong overflow-hidden rounded-panel border border-line-strong"
      role="group"
      aria-label="Map view controls"
      @pointerdown.stop
      @wheel.stop
    >
      <button type="button" :class="controlClass" aria-label="Zoom in" @click="zoomBy(1.25)"><Plus :size="18" aria-hidden="true" /></button>
      <button type="button" :class="controlClass" aria-label="Zoom out" @click="zoomBy(0.8)"><Minus :size="18" aria-hidden="true" /></button>
      <button type="button" :class="controlClass" aria-label="Fit whole map" @click="fit"><Maximize :size="18" aria-hidden="true" /></button>
      <button type="button" :class="controlClass" aria-label="Reset view to current position" @click="resetView"><RotateCcw :size="18" aria-hidden="true" /></button>
    </div>
  </div>
</template>
