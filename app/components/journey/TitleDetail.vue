<script setup lang="ts">
import { ArrowLeft, Check, ChevronLeft, ChevronRight, ChevronUp, ExternalLink, Film, Play, Sparkles, Tv, X } from 'lucide-vue-next'
import type {
  ProviderOffer,
  TitleEpisodes,
  TitleMetadata,
  TitleProviders,
  TitleResponse,
  TitleVideos,
} from '../../../shared/types/tmdb.ts'
import type { MapNode } from '../../utils/roadmap-map.ts'
import { providerLink } from '../../utils/provider-links.ts'

// Full-screen title screen: TMDB artwork behind the title, synopsis and actions on the left, and a panel on the
// right: where to watch for a movie, the season's episodes (each markable) for a series.
const props = defineProps<{
  node: MapNode
  watched: boolean
  current: boolean
  prevId: string | null
  nextId: string | null
  /** The numbered route, for the tracker strip. */
  route: { id: string; order: number; title: string; watched: boolean }[]
}>()
const emit = defineEmits<{ timeline: []; go: [id: string]; toggleWatched: [] }>()

const watchedOnRoute = computed(() => props.route.filter((r) => r.watched).length)
const pad = (n: number) => String(n).padStart(2, '0')
const linkFor = (o: ProviderOffer) => providerLink(o.name, `${item.value.title} ${item.value.release_year}`, providers.value?.link ?? null)

const progress = useProgress()
const region = useRuntimeConfig().public.tmdbRegion.toString().toUpperCase()

const typeIcon = { movie: Film, series: Tv, special: Sparkles } as const
const item = computed(() => props.node.item)

// ---------- Data ----------
const details = ref<TitleMetadata | null>(null)
const videos = ref<TitleVideos | null>(null)
const providers = ref<TitleProviders | null>(null)
const episodes = ref<TitleEpisodes | null>(null)
const detailsError = ref<string | null>(null)
const panelError = ref<string | null>(null)
const loading = ref(true)
const season = ref<number | null>(null)
let token = 0

async function get<T>(id: string, path: string): Promise<T> {
  try {
    return (await $fetch<TitleResponse<T>>(`/api/titles/${id}${path}`)).data
  } catch (e) {
    throw new Error((e as { data?: { error?: { message?: string } } }).data?.error?.message ?? 'Could not load this section.', { cause: e })
  }
}

async function load(id: string) {
  const mine = ++token
  details.value = videos.value = providers.value = episodes.value = null
  detailsError.value = panelError.value = null
  season.value = null
  loading.value = true
  try {
    const d = await get<TitleMetadata>(id, '')
    if (mine !== token) return
    details.value = d
    const rest: Promise<unknown>[] = [get<TitleVideos>(id, '/videos').then((v) => mine === token && (videos.value = v))]
    if (d.mediaType === 'movie') {
      rest.push(get<TitleProviders>(id, `/providers?region=${region}`).then((p) => mine === token && (providers.value = p)))
    } else {
      season.value = d.season?.seasonNumber ?? 1
      rest.push(loadEpisodes(id, season.value, mine))
    }
    // Trailer or panel failing must not hide the title itself.
    const results = await Promise.allSettled(rest)
    const failed = results.find((r) => r.status === 'rejected')
    if (mine === token && failed && d.mediaType === 'movie' && !providers.value) panelError.value = (failed as PromiseRejectedResult).reason.message
  } catch (e) {
    if (mine === token) detailsError.value = (e as Error).message
  } finally {
    if (mine === token) loading.value = false
  }
}

async function loadEpisodes(id: string, n: number, mine = token) {
  try {
    const e = await get<TitleEpisodes>(id, `/episodes?season=${n}`)
    if (mine === token) episodes.value = e
  } catch (e) {
    if (mine === token) panelError.value = (e as Error).message
  }
}

watch(() => props.node.id, (id) => load(id), { immediate: true })

async function pickSeason(n: number) {
  season.value = n
  episodes.value = null
  panelError.value = null
  await loadEpisodes(props.node.id, n)
}

// ---------- Display ----------
const isTv = computed(() => details.value?.mediaType === 'tv')
const seasonOptions = computed(() => {
  const d = details.value
  if (d?.mediaType !== 'tv') return []
  // A season-level title shows its own season only; a whole-show title lists every real season.
  return d.season ? [d.season] : d.seasons.filter((s) => s.seasonNumber >= 1)
})
const seasonIndex = computed(() => seasonOptions.value.findIndex((s) => s.seasonNumber === season.value))

const date = (iso: string | null) => (iso ? new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : null)
const meta = computed(() => {
  const d = details.value
  if (!d) return [String(item.value.release_year)]
  if (d.mediaType === 'movie') return [date(d.releaseDate) ?? String(item.value.release_year), d.runtimeMinutes ? `${d.runtimeMinutes} min` : null, d.genres.slice(0, 3).join(', ') || null]
  return [date(d.season?.airDate ?? d.firstAirDate) ?? String(item.value.release_year), d.season?.episodeCount ? `${d.season.episodeCount} episodes` : null, d.genres.slice(0, 3).join(', ') || null]
})
const overview = computed(() => (details.value?.mediaType === 'tv' ? details.value.season?.overview : null) || details.value?.overview || item.value.importance_statement)

const offerGroups = computed(() => {
  const p = providers.value
  if (!p) return []
  const groups: [string, ProviderOffer[]][] = [
    ['Subscription', p.flatrate],
    ['Free', p.free],
    ['With ads', p.ads],
    ['Rent', p.rent],
    ['Buy', p.buy],
  ]
  return groups.filter(([, offers]) => offers.length)
})

// ---------- Episodes and progress ----------
const key = (ep: number) => (season.value ?? 1) * 1000 + ep
const watchedEps = computed(() => new Set(progress.watchedEpisodes(props.node.id)))
const seasonDone = computed(() => episodes.value?.episodes.filter((e) => watchedEps.value.has(key(e.episodeNumber))).length ?? 0)

function toggleEpisode(ep: number) {
  const on = !watchedEps.value.has(key(ep))
  progress.setEpisodeWatched(props.node.id, key(ep), on)
  const total = episodes.value?.episodes.length ?? 0
  const done = seasonDone.value + (on ? 1 : -1)
  // The season is watched exactly when every episode is.
  if (total && seasonOptions.value.length <= 1) progress.setWatched(props.node.id, done >= total)
}

function toggleWatched() {
  const on = !props.watched
  if (isTv.value && episodes.value && seasonOptions.value.length <= 1) {
    for (const e of episodes.value.episodes) progress.setEpisodeWatched(props.node.id, key(e.episodeNumber), on)
  }
  emit('toggleWatched')
}

// ---------- Trailer ----------
// Phones: the right-hand panel starts folded away so the artwork and title can breathe.
const panelOpen = ref(false)
const trailerOpen = ref(false)
const trailerUrl = computed(() =>
  videos.value?.trailer ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videos.value.trailer.key)}?autoplay=1&rel=0&modestbranding=1&playsinline=1` : null,
)

const back = ref<HTMLButtonElement | null>(null)
onMounted(() => back.value?.focus({ preventScroll: true }))

const bar =
  'inline-flex min-h-11 items-center gap-2 rounded-control border border-line-strong bg-void/70 px-3 text-control font-semibold uppercase tracking-[0.06em] text-ink transition-colors duration-150 hover:border-relic-gold hover:bg-surface-soft disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-line-strong disabled:hover:bg-void/70'
</script>

<template>
  <section
    role="dialog"
    aria-modal="true"
    :aria-label="`${item.title}, details`"
    class="absolute inset-0 z-40 overflow-hidden bg-void"
    @keydown.esc.stop="trailerOpen ? (trailerOpen = false) : panelOpen ? (panelOpen = false) : emit('timeline')"
  >
    <!-- Artwork, then a halftone print screen and a left-weighted shade so text and panel stay legible. -->
    <img
      v-if="details?.backdropUrl"
      :key="details.backdropUrl"
      :src="details.backdropUrl"
      alt=""
      class="detail-fade absolute inset-0 size-full object-cover"
    >
    <div class="halftone absolute inset-0 opacity-60 mix-blend-multiply" />
    <div class="absolute inset-0 bg-linear-to-r from-void/95 via-void/50 to-transparent" />
    <div class="absolute inset-0 bg-linear-to-t from-void via-transparent to-void/50" />

    <div class="relative flex size-full flex-col gap-4 p-4 md:gap-3 md:p-6">
      <!-- Top bar -->
      <div class="flex shrink-0 flex-wrap items-center gap-2">
        <button ref="back" type="button" :class="bar" @click="emit('timeline')">
          <ArrowLeft :size="18" aria-hidden="true" />
          Timeline
        </button>
        <button type="button" :class="bar" :disabled="!prevId" aria-label="Previous title" @click="prevId && emit('go', prevId)">
          <ChevronLeft :size="18" aria-hidden="true" />
          <span class="hidden sm:inline">Previous</span>
        </button>
        <button type="button" :class="bar" :disabled="!nextId" aria-label="Next title" @click="nextId && emit('go', nextId)">
          <span class="hidden sm:inline">Next</span>
          <ChevronRight :size="18" aria-hidden="true" />
        </button>
        <button type="button" :class="[bar, 'ml-auto']" aria-label="Close and return to the timeline" @click="emit('timeline')">
          <X :size="18" aria-hidden="true" />
        </button>
      </div>

      <div class="flex min-h-0 flex-1 flex-col gap-4 md:grid md:grid-cols-[minmax(0,1fr)_400px] md:gap-8">
        <!-- Left: the title -->
        <div class="flex min-h-0 flex-1 flex-col justify-end gap-3 md:shrink md:gap-4 md:pb-2">
          <div class="flex flex-wrap items-center gap-2">
            <span
              v-if="node.kind === 'main'"
              class="step-plate inline-flex items-baseline gap-2 bg-comic-red py-1 pl-4 pr-5 font-display font-bold uppercase leading-none text-ink"
            >
              <span class="text-sm tracking-[0.12em]">Step</span>
              <span class="text-2xl tabular-nums">{{ pad(node.order) }}</span>
            </span>
            <span class="inline-flex items-center gap-1.5 text-meta font-semibold uppercase tracking-wider text-ink-muted">
              <component :is="typeIcon[item.type]" :size="14" aria-hidden="true" />
              {{ item.type }}
            </span>
            <UiBadge v-if="current" tone="current" />
            <UiBadge v-if="watched" tone="completed" />
          </div>
          <h2 class="max-w-3xl text-balance font-display text-[clamp(2.25rem,6.5vw,5.5rem)] max-md:text-[2.5rem] font-bold uppercase leading-[0.9] tracking-[0.01em]">{{ item.title }}</h2>
          <p class="flex flex-wrap gap-x-4 text-body font-semibold tabular-nums text-ink">
            <template v-for="(m, i) in meta" :key="i"><span v-if="m">{{ m }}</span></template>
          </p>
          <p class="line-clamp-3 max-w-2xl text-body text-ink-muted md:line-clamp-5 [@media(max-height:680px)]:max-md:hidden">{{ overview }}</p>
          <p class="hidden max-w-2xl text-meta text-ink-subtle md:line-clamp-2 md:block">
            <span class="font-semibold text-gold-soft">Why it matters:</span> {{ item.doomsday_connection }}
          </p>
          <p v-if="detailsError" class="w-fit rounded-control bg-void/80 px-2 py-1 text-meta text-danger-text" role="status">
            Artwork and details unavailable: {{ detailsError }}
          </p>
          <div class="grid grid-cols-2 gap-3 pt-1 md:flex md:flex-wrap">
            <UiButton v-if="trailerUrl" size="lg" class="max-md:w-full max-md:px-2" @click="trailerOpen = true">
              <Play :size="18" aria-hidden="true" />
              Trailer
            </UiButton>
            <UiButton size="lg" class="max-md:w-full max-md:px-2" :variant="watched || trailerUrl ? 'secondary' : 'primary'" @click="toggleWatched">
              <Check :size="18" aria-hidden="true" />
              <span class="md:hidden">{{ watched ? 'Watched' : 'Mark watched' }}</span>
              <span class="hidden md:inline">{{ watched ? 'Watched' : isTv ? 'Mark season watched' : 'Mark as watched' }}</span>
            </UiButton>
          </div>
        </div>

        <!-- Right: where to watch (movie) or episodes (series), in a cut-corner plate with a gold hairline edge. -->
        <button
          type="button"
          class="flex min-h-12 shrink-0 items-center justify-between gap-3 border border-line-strong bg-surface/90 px-4 text-control font-semibold uppercase tracking-[0.06em] text-ink md:hidden"
          :aria-expanded="panelOpen"
          @click="panelOpen = !panelOpen"
        >
          <span>{{ isTv ? 'Episodes' : 'Where to watch' }}<template v-if="!isTv"> · <span class="text-gold-soft">{{ region }}</span></template></span>
          <ChevronUp :size="18" class="transition-transform duration-200" :class="panelOpen ? 'rotate-180' : ''" aria-hidden="true" />
        </button>
        <div
          v-if="panelOpen"
          class="absolute inset-0 z-10 bg-void/70 md:hidden"
          aria-hidden="true"
          @click="panelOpen = false"
        />
        <!-- Phones: the panel is a bottom sheet over the screen, so it never squeezes the title above it. -->
        <div
          class="cut-panel min-h-0 flex-1 bg-gold-soft/40 p-px md:block md:max-h-full md:flex-none md:self-start"
          :class="panelOpen ? 'max-md:absolute max-md:inset-x-0 max-md:bottom-0 max-md:z-20 max-md:h-[72%] max-md:flex-none' : 'max-md:hidden'"
        >
          <aside
            class="cut-panel flex h-full max-h-full min-h-0 flex-col overflow-hidden bg-surface/95 md:max-h-[calc(100dvh-14rem)]"
            :aria-label="isTv ? 'Episodes' : 'Where to watch'"
          >
            <div class="flex shrink-0 items-center justify-between border-b border-line py-1 pl-5 pr-2 md:hidden">
              <span class="font-display text-lg font-bold uppercase tracking-[0.08em] text-ink">
                {{ isTv ? "Episodes" : "Where to watch" }}<template v-if="!isTv">{{ " " }}<span class="text-gold-soft">· {{ region }}</span></template>
              </span>
              <button type="button" class="inline-flex size-11 items-center justify-center text-ink-muted hover:text-ink" aria-label="Close panel" @click="panelOpen = false">
                <X :size="20" aria-hidden="true" />
              </button>
            </div>
            <template v-if="loading && !details">
              <p class="p-4 text-body text-ink-muted" role="status">Loading…</p>
            </template>

            <!-- Series: season selector and episodes -->
            <template v-else-if="isTv">
              <div class="flex items-center gap-2 border-b border-line p-3">
                <button
                  type="button"
                  class="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-surface-soft text-ink transition-colors duration-150 hover:text-gold-soft disabled:opacity-30"
                  aria-label="Previous season"
                  :disabled="seasonIndex <= 0"
                  @click="pickSeason(seasonOptions[seasonIndex - 1]!.seasonNumber)"
                >
                  <ChevronLeft :size="18" aria-hidden="true" />
                </button>
                <label class="min-w-0 flex-1">
                  <span class="sr-only">Season</span>
                  <select
                    class="min-h-11 w-full rounded-full border border-line-strong bg-surface-soft px-4 text-control font-semibold text-ink focus-visible:outline-relic-gold"
                    :value="season"
                    @change="pickSeason(Number(($event.target as HTMLSelectElement).value))"
                  >
                    <option v-for="s in seasonOptions" :key="s.seasonNumber" :value="s.seasonNumber">{{ s.name ?? `Season ${s.seasonNumber}` }}</option>
                  </select>
                </label>
                <button
                  type="button"
                  class="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-surface-soft text-ink transition-colors duration-150 hover:text-gold-soft disabled:opacity-30"
                  aria-label="Next season"
                  :disabled="seasonIndex < 0 || seasonIndex >= seasonOptions.length - 1"
                  @click="pickSeason(seasonOptions[seasonIndex + 1]!.seasonNumber)"
                >
                  <ChevronRight :size="18" aria-hidden="true" />
                </button>
              </div>
              <p v-if="episodes" class="px-4 pt-2 text-meta tabular-nums text-ink-subtle">{{ seasonDone }} of {{ episodes.episodes.length }} watched</p>
              <p v-if="panelError" class="p-4 text-body text-danger-text" role="alert">Episodes unavailable: {{ panelError }}</p>
              <p v-else-if="!episodes" class="p-4 text-body text-ink-muted" role="status">Loading episodes…</p>
              <ol v-else class="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
                <li v-for="ep in episodes.episodes" :key="ep.episodeNumber">
                  <button
                    type="button"
                    :aria-pressed="watchedEps.has(key(ep.episodeNumber))"
                    class="flex w-full items-center gap-3 rounded-control p-2 text-left transition-colors duration-150 hover:bg-surface-soft"
                    @click="toggleEpisode(ep.episodeNumber)"
                  >
                    <span class="relative block aspect-video w-28 shrink-0 overflow-hidden rounded-control bg-surface-soft">
                      <img v-if="ep.stillUrl" :src="ep.stillUrl" alt="" loading="lazy" class="size-full object-cover" :class="watchedEps.has(key(ep.episodeNumber)) ? 'opacity-60' : ''">
                      <span
                        v-if="watchedEps.has(key(ep.episodeNumber))"
                        class="absolute right-1 top-1 inline-flex size-6 items-center justify-center rounded-full bg-doom-green-bright text-void"
                      >
                        <Check :size="14" aria-hidden="true" />
                      </span>
                    </span>
                    <span class="min-w-0 flex-1">
                      <span class="block truncate text-control font-semibold" :class="watchedEps.has(key(ep.episodeNumber)) ? 'text-ink-muted' : 'text-ink'">
                        {{ ep.episodeNumber }}. {{ ep.name }}
                      </span>
                      <span class="block text-meta text-ink-subtle">{{ date(ep.airDate) }}<template v-if="ep.runtimeMinutes"> · {{ ep.runtimeMinutes }} min</template></span>
                    </span>
                  </button>
                </li>
              </ol>
            </template>

            <!-- Movie or special: where to watch. Each platform opens its own site in a new tab. -->
            <template v-else>
              <h3 class="border-b border-line px-5 py-3 max-md:hidden font-display text-lg font-bold uppercase tracking-[0.08em] text-ink">Where to watch <span class="text-gold-soft">· {{ region }}</span></h3>
              <p v-if="panelError || detailsError" class="p-4 text-body text-ink-muted" role="status">Watch options are unavailable right now.</p>
              <p v-else-if="!providers" class="p-4 text-body text-ink-muted" role="status">Loading…</p>
              <p v-else-if="!offerGroups.length" class="p-4 text-body text-ink-muted">Not available to stream, rent or buy in {{ region }} right now.</p>
              <div v-else class="min-h-0 flex-1 space-y-4 overflow-y-auto p-3">
                <section v-for="[label, offers] in offerGroups" :key="label">
                  <h4 class="mb-1 px-2 text-meta font-semibold uppercase tracking-wider text-gold-soft">{{ label }}</h4>
                  <ul>
                    <li v-for="o in offers" :key="o.providerId">
                      <component
                        :is="linkFor(o) ? 'a' : 'div'"
                        :href="linkFor(o) ?? undefined"
                        :target="linkFor(o) ? '_blank' : undefined"
                        :rel="linkFor(o) ? 'noopener noreferrer' : undefined"
                        :aria-label="linkFor(o) ? `${o.name}, ${label}. Opens in a new tab.` : undefined"
                        class="flex min-h-12 items-center gap-3 rounded-control px-2 py-1.5 transition-colors duration-150"
                        :class="linkFor(o) ? 'hover:bg-surface-soft' : ''"
                      >
                        <img v-if="o.logoUrl" :src="o.logoUrl" alt="" class="size-9 rounded-control" loading="lazy">
                        <span v-else class="size-9 rounded-control bg-surface-soft" />
                        <span class="min-w-0 flex-1 truncate text-body font-semibold text-ink">{{ o.name }}</span>
                        <ExternalLink v-if="linkFor(o)" :size="16" class="shrink-0 text-gold-soft" aria-hidden="true" />
                      </component>
                    </li>
                  </ul>
                </section>
              </div>
              <p v-if="providers" class="border-t border-line p-3 text-meta text-ink-subtle">
                Availability from
                <a v-if="providers.link" :href="providers.link" target="_blank" rel="noopener noreferrer" class="underline underline-offset-2 hover:text-ink">JustWatch via TMDB</a>
                <template v-else>JustWatch via TMDB</template>.
              </p>
            </template>
          </aside>
        </div>
      </div>

      <!-- Tracker: the whole route at a glance. Tap a segment to jump to that title. -->
      <nav v-if="route.length" class="shrink-0" aria-label="Route progress">
        <p class="mb-1.5 flex items-baseline justify-between text-meta font-semibold uppercase tracking-wider text-ink-muted">
          <span>Route</span>
          <span class="tabular-nums text-ink">{{ watchedOnRoute }} <span class="text-ink-subtle">of {{ route.length }} watched</span></span>
        </p>
        <ol class="flex items-end gap-0.5 md:gap-1">
          <li v-for="r in route" :key="r.id" class="min-w-0 flex-1">
            <button
              type="button"
              :title="`${r.order}. ${r.title}${r.watched ? ' (watched)' : ''}`"
              :aria-label="`Step ${r.order}: ${r.title}${r.watched ? ', watched' : ''}`"
              :aria-current="r.id === node.id ? 'step' : undefined"
              class="block w-full transition-[background-color,height] duration-150 hover:h-5"
              :class="[
                r.watched ? 'bg-doom-green-bright' : 'bg-line-strong/60',
                r.id === node.id ? 'h-5 bg-relic-gold' : 'h-3',
              ]"
              @click="emit('go', r.id)"
            />
          </li>
        </ol>
      </nav>
    </div>

    <!-- Trailer -->
    <div v-if="trailerOpen && trailerUrl" class="absolute inset-0 z-10 flex items-center justify-center bg-void/95 p-3 md:p-10" role="dialog" aria-modal="true" aria-label="Trailer">
      <button type="button" :class="[bar, 'absolute right-3 top-3 md:right-6 md:top-6']" aria-label="Close trailer" @click="trailerOpen = false">
        <X :size="18" aria-hidden="true" />
      </button>
      <iframe
        :src="trailerUrl"
        title="Trailer"
        class="aspect-video max-h-full w-full max-w-5xl rounded-media border-0"
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowfullscreen
        referrerpolicy="strict-origin-when-cross-origin"
      />
    </div>
  </section>
</template>
