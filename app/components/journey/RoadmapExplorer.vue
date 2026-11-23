
<script setup lang="ts">
import { ChevronLeft, List, Map as MapIcon, Search, SlidersHorizontal } from 'lucide-vue-next'
import { roadmap } from '../../utils/roadmap-data.ts'
import {
  buildLayout,
  currentTitleId,
  defaultFilters,
  hasActiveFilters,
  matchesFilters,
  type MapFilters,
} from '../../utils/roadmap-map.ts'

// The roadmap screen: toolbar, map or list, and the preview. Doomsday shows only the Doomsday-relevant titles; Universe shows
// all 82 main titles plus the 10 supplemental ones. Both read the same dataset and the same local progress.
const props = defineProps<{ title: string; includeSupplemental: boolean; doomsdayOnly?: boolean }>()

const layout = buildLayout(roadmap, props.includeSupplemental, props.doomsdayOnly)
const mainIds = layout.nodes.filter((n) => n.kind === 'main').map((n) => n.id)

// Set by the landing buttons; the intro plays once per click and is not repeated when switching tabs.
const introRequested = useState('playIntro', () => false)
const showIntro = ref(introRequested.value)
// The tree fades up as the intro fades out.
const revealed = ref(!introRequested.value)
function introDone() {
  showIntro.value = false
  introRequested.value = false
  // The tree holds still for a second, then glides in to the first title.
  setTimeout(() => canvas.value?.diveIn(), 1000)
}
const alignIntro = introRequested.value

const progress = useProgress()
const isWatched = (id: string) => progress.isWatched(id)

const filters = ref<MapFilters>(defaultFilters())
const filtersOpen = ref(false)
const mode = ref<'map' | 'list'>('map')
const selectedId = ref<string | null>(null)
const canvas = ref<{ focusOn: (id: string) => void; diveIn: () => void } | null>(null)
const root = ref<HTMLElement | null>(null)
const bar = ref<HTMLElement | null>(null)
// Height of the toolbar's first row; the canvas, list and preview keep clear of it.
const topInset = ref(72)
onMounted(() => {
  if (!bar.value) return
  const ro = new ResizeObserver(() => (topInset.value = (bar.value?.offsetHeight ?? 60) + 12))
  ro.observe(bar.value)
  onBeforeUnmount(() => ro.disconnect())
})

const route = computed(() =>
  layout.nodes.flatMap((n) => (n.kind === 'main' ? [{ id: n.id, order: n.order, title: n.item.title, watched: isWatched(n.id) }] : [])),
)
const currentId = computed(() => currentTitleId(layout, isWatched))
const nextId = computed(() => {
  const i = layout.nodes.findIndex((n) => n.id === currentId.value)
  const n = i >= 0 ? layout.nodes[i + 1] : undefined
  return n?.kind === 'main' ? n.id : null
})
const watchedCount = computed(() => progress.watchedCount(mainIds))
const percent = computed(() => Math.round((watchedCount.value / mainIds.length) * 100))
const markerText = computed(() => (watchedCount.value > 0 ? 'You are here' : 'Start here'))

const active = computed(() => hasActiveFilters(filters.value))
const matching = computed(() => layout.nodes.filter((n) => matchesFilters(n, filters.value, isWatched)))
const visibleIds = computed(() => (active.value ? new Set(matching.value.map((n) => n.id)) : null))
const selected = computed(() => layout.nodes.find((n) => n.id === selectedId.value) ?? null)

function clearFilters() {
  filters.value = defaultFilters()
}

function select(id: string) {
  selectedId.value = id
}

/** The title before (-1) or after (+1) the open one, in route order. */
function neighbourId(step: number) {
  const i = layout.nodes.findIndex((n) => n.id === selectedId.value)
  return i < 0 ? null : (layout.nodes[i + step]?.id ?? null)
}

function pickFromList(id: string) {
  select(id)
}

function closePreview() {
  const id = selectedId.value
  selectedId.value = null
  // Hand focus back to the node (or list row) the preview came from.
  if (id) nextTick(() => root.value?.querySelector<HTMLElement>(`[data-node-id="${id}"]`)?.focus({ preventScroll: true }))
}

/** Enter in the search box selects and centres the first match. */
function jumpToFirstMatch() {
  const first = matching.value[0]
  if (!first || !active.value) return
  select(first.id)
  if (mode.value === 'map') canvas.value?.focusOn(first.id)
}

async function showMap() {
  mode.value = 'map'
  await nextTick()
  if (selectedId.value) canvas.value?.focusOn(selectedId.value)
}

const tabs = [
  { to: '/journey/doomsday', label: 'Doomsday', short: 'Doomsday' },
  { to: '/universe', label: 'Whole Universe', short: 'Universe' },
]

const toolButton =
  'inline-flex min-h-11 items-center gap-2 rounded-control border border-line-strong bg-surface-raised px-3 text-control font-semibold uppercase tracking-[0.06em] text-ink transition-colors duration-150 hover:border-relic-gold hover:bg-surface-soft'
</script>

<template>
  <div ref="root" class="relative size-full overflow-hidden" @keydown.esc="selected ? closePreview() : (filtersOpen = false)">
    <ClientOnly>
      <JourneyMapIntro v-if="showIntro" @leave="revealed = true" @done="introDone" />
    </ClientOnly>

    <!-- Map stays mounted while the list is shown, so pan and zoom survive switching views. -->
    <ClientOnly>
      <div v-show="mode === 'map'" class="absolute inset-0" :class="revealed ? 'map-reveal' : 'opacity-0'">
        <JourneyMapCanvas
          ref="canvas"
          :layout="layout"
          :is-watched="isWatched"
          :current-id="currentId"
          :next-id="nextId"
          :align-intro="alignIntro"
          :marker-text="markerText"
          :selected-id="selectedId"
          :visible-ids="visibleIds"
          :preview-open="false"
          :top-inset="topInset"
          @select="select"
        />
      </div>
      <template #fallback>
        <p class="absolute inset-0 flex items-center justify-center text-ink-muted">Loading the map…</p>
      </template>
    </ClientOnly>

    <JourneyTitleList
      v-if="mode === 'list'"
      class="absolute inset-0"
      :nodes="matching"
      :is-watched="isWatched"
      :current-id="currentId"
      :marker-text="markerText"
      :selected-id="selectedId"
      :top-inset="topInset"
      @select="pickFromList"
    />

    <!-- Toolbar -->
    <div class="pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-col gap-2 bg-linear-to-b from-void/90 to-transparent p-3">
      <div ref="bar" class="flex flex-wrap items-center gap-2">
        <NuxtLink to="/" :class="[toolButton, 'pointer-events-auto']" aria-label="Back to home">
          <ChevronLeft :size="18" aria-hidden="true" />
          <span class="hidden sm:inline">Back</span>
        </NuxtLink>

        <nav class="pointer-events-auto flex overflow-hidden rounded-control border border-line-strong bg-surface-raised" aria-label="Journey">
          <NuxtLink
            v-for="tab in tabs"
            :key="tab.to"
            :to="tab.to"
            exact-active-class=""
            class="inline-flex min-h-11 items-center px-3 text-control font-semibold uppercase tracking-[0.06em] text-ink-muted transition-colors duration-150 hover:text-ink aria-[current=page]:bg-doom-green aria-[current=page]:text-ink"
          >
            <span class="sm:hidden">{{ tab.short }}</span><span class="hidden sm:inline">{{ tab.label }}</span>
          </NuxtLink>
        </nav>

        <div class="pointer-events-auto flex items-center gap-2 rounded-control bg-void/90 px-2 py-1" role="group" :aria-label="`${title} progress`">
          <h1 class="sr-only">{{ title }}</h1>
          <p class="whitespace-nowrap text-control font-semibold tabular-nums">
            {{ watchedCount }}<span class="hidden sm:inline"> of {{ mainIds.length }} watched</span><span class="sm:hidden">/{{ mainIds.length }}</span>
          </p>
          <div class="hidden h-1.5 w-20 overflow-hidden rounded-full bg-line md:block" aria-hidden="true">
            <div class="h-full bg-doom-green-bright" :style="{ width: `${percent}%` }" />
          </div>
          <span class="hidden text-meta tabular-nums text-ink-muted md:inline">{{ percent }}%</span>
        </div>

        <label class="pointer-events-auto relative min-w-44 flex-1 md:max-w-sm">
          <span class="sr-only">Search titles</span>
          <Search :size="18" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
          <input
            v-model="filters.query"
            type="search"
            placeholder="Search titles"
            autocomplete="off"
            class="min-h-11 w-full rounded-control border border-line-strong bg-surface py-2 pl-10 pr-3 text-body text-ink placeholder:text-ink-subtle focus-visible:outline-relic-gold"
            @keydown.enter.prevent="jumpToFirstMatch"
          >
        </label>

        <button
          type="button"
          :class="[toolButton, 'pointer-events-auto', filtersOpen || (active && !filters.query) ? 'border-doom-green-bright' : '']"
          :aria-expanded="filtersOpen"
          aria-controls="map-filters"
          @click="filtersOpen = !filtersOpen"
        >
          <SlidersHorizontal :size="18" aria-hidden="true" />
          Filters
        </button>

        <button
          v-if="mode === 'map'"
          type="button"
          :class="[toolButton, 'pointer-events-auto']"
          @click="mode = 'list'"
        >
          <List :size="18" aria-hidden="true" />
          List view
        </button>
        <button v-else type="button" :class="[toolButton, 'pointer-events-auto']" @click="showMap">
          <MapIcon :size="18" aria-hidden="true" />
          Map view
        </button>
      </div>

      <div v-show="filtersOpen" id="map-filters" class="pointer-events-auto max-w-xl">
        <JourneyMapFilters v-model="filters" @clear="clearFilters" />
      </div>

      <p v-if="active" class="pointer-events-auto w-fit rounded-control bg-void/90 px-2 py-1 text-meta text-ink-muted" role="status">
        {{ matching.length }} of {{ layout.nodes.length }} titles match
      </p>
      <p v-if="progress.persistError.value" class="pointer-events-auto w-fit rounded-control bg-void/90 px-2 py-1 text-meta text-danger-text" role="alert">
        Progress could not be saved in this browser. Changes last until you leave this page.
      </p>
    </div>

    <!-- Empty state: one sentence and one action. -->
    <div
      v-if="active && matching.length === 0"
      class="absolute inset-x-0 top-1/2 z-10 mx-auto w-fit max-w-[90%] -translate-y-1/2 space-y-3 rounded-panel border border-line-strong bg-surface-raised p-5 text-center"
      role="status"
    >
      <p class="text-body text-ink">No titles match your search and filters.</p>
      <UiButton variant="secondary" @click="clearFilters">Clear filters</UiButton>
    </div>

    <!-- Title screen: opens over the map; "Timeline" returns to it. -->
    <JourneyTitleDetail
      v-if="selected"
      :node="selected"
      :watched="isWatched(selected.id)"
      :current="selected.id === currentId"
      :prev-id="neighbourId(-1)"
      :next-id="neighbourId(1)"
      :route="route"
      @timeline="closePreview"
      @go="select"
      @toggle-watched="progress.setWatched(selected.id, !isWatched(selected.id))"
    />
  </div>
</template>
