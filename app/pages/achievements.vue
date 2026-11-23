<script setup lang="ts">
import { Download, ChevronLeft, ChevronRight, LayoutGrid, Lock, Map as MapIcon, RotateCcw, Share2 } from 'lucide-vue-next'
import type { TitleMetadata, TitleResponse } from '../../shared/types/tmdb.ts'
import { roadmap } from '../utils/roadmap-data.ts'
import { buildLayout } from '../utils/roadmap-map.ts'
import { codenameOf } from '../utils/card-theme.ts'
import { collectionMeta } from '../utils/collection.ts'
import { SITE_URL } from '../utils/site.ts'
import { taglineFor } from '../utils/card-taglines.ts'
import { fileNameFor, renderCard, renderGallery, type CardExport, type CardFormat } from '../utils/card-export.ts'
import frame from '../assets/cards/frame.webp'
import bg from '../assets/cards/bg.webp'
import ring from '../assets/cards/ring.webp'
import knight from '../assets/cards/knight.webp'

definePageMeta({ layout: 'bare' })
useSeoMeta({ title: 'Achievements — Marvel: Road to Doomsday', description: 'Collectible cards for every title on the road to Avengers: Doomsday. An independent fan project.' })

const layers = { frame, bg, ring, knight }

// One card per title. Watched titles unlock; the rest stay as locked outlines.
const toCards = (doomsdayOnly: boolean) =>
  buildLayout(roadmap, false, doomsdayOnly).nodes.flatMap((n) => (n.kind === 'main' ? [{ id: n.id, order: n.order, item: n.item }] : []))
const sets = { all: toCards(false), doomsday: toCards(true) }
// "All" numbers cards by watch order; "Doomsday" is the shorter route, numbered 1, 2, 3.
const wanted = useRoute().query.card
// Opened from a title's unlock notice: land on the mode that contains that card (the Fox X-Men films only exist in the
// Doomsday route). Otherwise the Doomsday route is the default.
const mode = ref<'all' | 'doomsday'>(sets.doomsday.some((c) => c.id === wanted) || !sets.all.some((c) => c.id === wanted) ? 'doomsday' : 'all')
const cards = computed(() => sets[mode.value])

const progress = useProgress()
const cardState = useCardState()
onMounted(() => cardState.hydrate())

const view = ref<'card' | 'gallery' | 'ready'>('card')
const index = ref(Math.max(0, sets[mode.value].findIndex((c) => c.id === wanted)))
const hue = ref<number | null>(null)
const busy = ref(false)
const problem = ref<string | null>(null)
const note = ref<string | null>(null)
const format = ref<CardFormat>('story')
const arts = reactive<Record<string, string | null>>({})

const card = computed(() => cards.value[index.value]!)
const watched = (id: string) => progress.isWatched(id)
const unlockedCards = computed(() => cards.value.filter((c) => watched(c.id)))
const dateOf = (id: string) => {
  const iso = progress.progressFor(id)?.completedAt
  return iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase() : ''
}
const player = computed(() => progress.state.value.preferences.displayName ?? codenameOf(cardState.collector.value))
const collector = computed(() => cardState.collector.value)

// ---------- Doors: an earned card stays sealed until it is tapped once ----------
const replayId = ref<string | null>(null)
const flash = ref(0)
const sealed = computed(() => cardState.ready.value && watched(card.value.id) && (!cardState.isOpened(card.value.id) || replayId.value === card.value.id))
function opened() {
  cardState.open(card.value.id)
  replayId.value = null
  flash.value++
}

async function loadArt(id: string) {
  if (id in arts) return
  arts[id] = null
  try {
    arts[id] = (await $fetch<TitleResponse<TitleMetadata>>(`/api/titles/${id}`)).data.posterUrl
  } catch {
    arts[id] = null
  }
}
watch(index, () => loadArt(card.value.id), { immediate: true })
watch(view, (v) => v === 'gallery' && unlockedCards.value.forEach((c) => loadArt(c.id)))
watch(mode, () => {
  index.value = 0
  flash.value = 0
})

const go = (step: number) => {
  index.value = (index.value + step + cards.value.length) % cards.value.length
  flash.value = 0
}
function openFromGallery(id: string) {
  index.value = Math.max(0, cards.value.findIndex((c) => c.id === id))
  view.value = 'card'
  flash.value = 0
}

// ---------- Making images ----------
const exportOf = (c: (typeof sets.all)[number]): CardExport => ({
  titleId: c.id,
  title: c.item.title,
  order: c.order,
  year: c.item.release_year,
  collector: collector.value,
  type: c.item.type,
  priority: c.item.priority,
  tagline: taglineFor(c.id, c.order),
  featuring: c.item.characters,
  player: player.value,
  date: dateOf(c.id),
  art: arts[c.id] ?? null,
  hue: c.id === card.value.id ? hue.value : null,
})

function save(file: File) {
  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = file.name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Phones open their share sheet (Instagram, Telegram, WhatsApp are in it). Elsewhere the image is saved instead. */
async function deliver(file: File, share: boolean, text: string) {
  if (share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: 'Road to Doomsday', text })
  } else {
    save(file)
    if (share) note.value = 'Saved. Open Instagram or Telegram and add the image from your gallery.'
  }
}

async function run(share: boolean, what: 'card' | 'gallery') {
  busy.value = true
  problem.value = null
  note.value = null
  try {
    if (what === 'card') {
      const c = card.value
      const blob = await renderCard(exportOf(c), layers, format.value)
      await deliver(new File([blob], fileNameFor(c.order, c.item.title, format.value), { type: 'image/png' }), share, `I unlocked ${c.item.title} on the road to Avengers: Doomsday.`)
    } else {
      await Promise.all(unlockedCards.value.slice(-9).map((c) => loadArt(c.id)))
      const latest = [...unlockedCards.value]
        .sort((a, b) => (progress.progressFor(b.id)?.completedAt ?? '').localeCompare(progress.progressFor(a.id)?.completedAt ?? ''))
        .slice(0, 9)
      const blob = await renderGallery(latest.map(exportOf), { player: player.value, collector: collector.value, number: cardState.number.value, count: unlockedCards.value.length, total: cards.value.length }, layers)
      await deliver(new File([blob], `road-to-doomsday-collection-${collector.value}.png`, { type: 'image/png' }), share, `My Road to Doomsday collection: ${unlockedCards.value.length} of ${cards.value.length} unlocked.`)
    }
  } catch (e) {
    if ((e as Error).name !== 'AbortError') problem.value = 'Could not make the image. Check your connection and try again.'
  } finally {
    busy.value = false
  }
}


// ---------- Doomsday Ready: unlocks when every essential title is watched ----------
const essentials = sets.all.filter((c) => c.item.priority === 'essential')
const essentialsDone = computed(() => essentials.filter((c) => watched(c.id)).length)
const ready = computed(() => essentials.length > 0 && essentialsDone.value === essentials.length)
const readyId = 'doomsday_ready'
const showDate = ref(true)
const finish = ref<'emerald' | 'midnight' | 'silver'>('emerald')
const finishes = {
  emerald: { label: 'Emerald', filter: '' },
  midnight: { label: 'Midnight', filter: 'hue-rotate(95deg)' },
  silver: { label: 'Silver', filter: 'grayscale(0.85) brightness(1.1)' },
} as const
// The film's own poster from TMDB goes in the card's window; the knight shows until it arrives (or if TMDB has none).
const readyArt = ref<string | null>(null)
watch(view, async (v) => {
  if (v !== 'ready' || readyArt.value) return
  try {
    readyArt.value = (await $fetch<{ posterUrl: string | null }>('/api/doomsday')).posterUrl
  } catch {
    readyArt.value = null
  }
})
const readyReplay = ref(false)
const readySealed = computed(() => cardState.ready.value && ready.value && (!cardState.isOpened(readyId) || readyReplay.value))
const readyDate = computed(() => {
  if (!showDate.value) return ''
  const dates = essentials.map((c) => progress.progressFor(c.id)?.completedAt ?? '').sort()
  const iso = dates[dates.length - 1]
  return iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase() : ''
})
const releaseYear = new Date(`${collectionMeta.target_release_date}T00:00:00`).getFullYear()
function readyOpened() {
  cardState.open(readyId)
  readyReplay.value = false
}
const readyExport = (): CardExport => ({
  titleId: readyId,
  serial: `READY-${collector.value}`,
  extraFilter: finishes[finish.value].filter,
  title: 'Doomsday Ready',
  order: essentials.length,
  year: releaseYear,
  collector: collector.value,
  type: 'Avengers: Doomsday',
  priority: 'essential',
  tagline: 'All essentials watched',
  featuring: [`${essentials.length} of ${essentials.length} essential titles`],
  player: player.value,
  date: readyDate.value,
  art: readyArt.value,
  hue: null,
})
async function runReady(share: boolean) {
  busy.value = true
  problem.value = null
  note.value = null
  try {
    const blob = await renderCard(readyExport(), layers, format.value)
    const file = new File([blob], `doomsday-ready-${collector.value}-${format.value}.png`, { type: 'image/png' })
    await deliver(file, share, `I'm Doomsday Ready: all ${essentials.length} essential titles watched. ${SITE_URL}`)
  } catch (e) {
    if ((e as Error).name !== 'AbortError') problem.value = 'Could not make the image. Try again.'
  } finally {
    busy.value = false
  }
}

const name = computed({ get: () => progress.state.value.preferences.displayName ?? '', set: (v: string) => progress.setDisplayName(v) })

const seg = 'min-h-11 px-3 text-control font-semibold uppercase tracking-[0.06em] aria-pressed:bg-doom-green aria-pressed:text-ink'
const segOff = 'bg-surface-raised text-ink-muted hover:text-ink'
const btn =
  'inline-flex size-12 items-center justify-center rounded-control border border-line-strong bg-surface-raised text-ink transition-colors duration-150 hover:border-relic-gold hover:bg-surface-soft'
</script>

<template>
  <section class="flex size-full flex-col gap-3 p-3 md:p-5" @keydown.left="view === 'card' && go(-1)" @keydown.right="view === 'card' && go(1)">
    <!-- Bar -->
    <div class="flex shrink-0 flex-wrap items-center gap-2 md:gap-3">
      <NuxtLink
        to="/journey/doomsday"
        class="inline-flex min-h-11 items-center gap-2 rounded-control border border-line-strong bg-surface-raised px-3 text-control font-semibold uppercase tracking-[0.06em] hover:border-relic-gold"
        aria-label="Back to the timeline"
      >
        <MapIcon :size="18" aria-hidden="true" />
        <span class="max-sm:hidden">Timeline</span>
      </NuxtLink>
      <h1 class="font-display text-xl font-bold uppercase tracking-[0.08em]">
        Cards <span class="text-gold-soft tabular-nums">{{ unlockedCards.length }}/{{ cards.length }}</span>
      </h1>
      <div class="flex overflow-hidden rounded-control border border-line-strong" role="group" aria-label="View">
        <button type="button" :aria-pressed="view === 'card'" :class="[seg, view === 'card' ? '' : segOff]" @click="view = 'card'">Card</button>
        <button type="button" :aria-pressed="view === 'gallery'" :class="[seg, view === 'gallery' ? '' : segOff]" @click="view = 'gallery'">
          <LayoutGrid :size="16" class="mr-1 inline align-[-3px]" aria-hidden="true" />Gallery
        </button>
        <button type="button" :aria-pressed="view === 'ready'" :class="[seg, view === 'ready' ? '' : segOff, ready ? 'text-gold-soft' : '']" @click="view = 'ready'">Ready</button>
      </div>
      <div class="flex overflow-hidden rounded-control border border-line-strong max-md:hidden" role="group" aria-label="Which cards">
        <button v-for="m in (['all', 'doomsday'] as const)" :key="m" type="button" :aria-pressed="mode === m" :class="[seg, mode === m ? '' : segOff]" @click="mode = m">
          {{ m === 'all' ? 'All titles' : 'Doomsday route' }}
        </button>
      </div>
      <label class="flex min-w-0 basis-full items-center gap-2 text-meta text-ink-muted md:ml-auto md:basis-auto">
        <span class="max-sm:sr-only">Name on cards</span>
        <input v-model="name" type="text" maxlength="30" placeholder="Your codename" class="min-h-11 w-full min-w-0 rounded-control border border-line-strong bg-surface px-3 text-body text-ink placeholder:text-ink-subtle md:w-44">
      </label>
    </div>

    <!-- Card view -->
    <template v-if="view === 'card'">
      <div class="flex min-h-0 flex-1 items-center justify-center">
        <div class="h-full max-w-full" style="aspect-ratio: 627 / 1005">
          <AchievementsAchievementDoors :closed="sealed" :glow="watched(card.id)" :label="card.item.title" @opened="opened">
            <AchievementsAchievementCard
              :key="`${card.id}-${flash}`"
              class="h-full"
              :title="card.item.title"
              :order="card.order"
              :title-id="card.id"
              :year="card.item.release_year"
              :collector="collector"
              :type="card.item.type"
              :priority="card.item.priority"
              :tagline="taglineFor(card.id, card.order)"
              :featuring="card.item.characters"
              :reveal="flash"
              flash-only
              :player="player"
              :date="dateOf(card.id)"
              :art="arts[card.id]"
              :locked="!watched(card.id)"
              @hue="hue = $event"
            />
          </AchievementsAchievementDoors>
        </div>
      </div>

      <p v-if="problem" class="shrink-0 text-center text-meta text-danger-text" role="alert">{{ problem }}</p>
      <p v-if="note" class="shrink-0 text-center text-meta text-gold-soft" role="status">{{ note }}</p>
      <div v-if="watched(card.id) && !sealed" class="flex shrink-0 flex-wrap items-center justify-center gap-2 md:gap-3">
        <div class="flex overflow-hidden rounded-control border border-line-strong" role="group" aria-label="Image format">
          <button v-for="f in (['story', 'card'] as const)" :key="f" type="button" :aria-pressed="format === f" :class="[seg, format === f ? '' : segOff]" @click="format = f">
            {{ f === 'story' ? '9:16' : '3:4' }}
          </button>
        </div>
        <UiButton :disabled="busy" @click="run(true, 'card')">
          <Share2 :size="18" aria-hidden="true" />
          {{ busy ? 'Preparing…' : 'Share' }}
        </UiButton>
        <UiButton variant="secondary" :disabled="busy" @click="run(false, 'card')">
          <Download :size="18" aria-hidden="true" />
          <span class="max-sm:sr-only">Download</span>
        </UiButton>
        <UiButton variant="secondary" aria-label="Replay the unlock" @click="replayId = card.id">
          <RotateCcw :size="18" aria-hidden="true" />
        </UiButton>
      </div>
      <div class="flex shrink-0 items-center justify-center gap-4">
        <button type="button" :class="btn" aria-label="Previous card" @click="go(-1)"><ChevronLeft :size="22" aria-hidden="true" /></button>
        <p class="min-w-24 text-center text-body font-semibold tabular-nums">{{ index + 1 }} <span class="text-ink-subtle">of {{ cards.length }}</span></p>
        <button type="button" :class="btn" aria-label="Next card" @click="go(1)"><ChevronRight :size="22" aria-hidden="true" /></button>
      </div>
    </template>

    <!-- Gallery: every unlocked card, and one image of the collection to share -->
    <template v-else-if="view === 'gallery'">
      <p v-if="problem" class="shrink-0 text-center text-meta text-danger-text" role="alert">{{ problem }}</p>
      <p v-if="note" class="shrink-0 text-center text-meta text-gold-soft" role="status">{{ note }}</p>
      <div class="flex shrink-0 flex-wrap items-center gap-2 md:gap-3">
        <p class="text-body text-ink-muted">
          <span class="font-semibold tabular-nums text-gold-soft">{{ unlockedCards.length }} of {{ cards.length }}</span> unlocked · {{ player }} ·
          Collector <span class="font-semibold tabular-nums text-gold-soft">{{ cardState.number.value === null ? '' : `#${String(cardState.number.value).padStart(4, '0')} · ` }}{{ collector }}</span>
        </p>
        <div v-if="unlockedCards.length" class="ml-auto flex gap-2">
          <UiButton :disabled="busy" @click="run(true, 'gallery')">
            <Share2 :size="18" aria-hidden="true" />
            {{ busy ? 'Preparing…' : 'Share collection' }}
          </UiButton>
          <UiButton variant="secondary" :disabled="busy" aria-label="Download the collection image" @click="run(false, 'gallery')">
            <Download :size="18" aria-hidden="true" />
          </UiButton>
        </div>
      </div>
      <ul class="grid min-h-0 flex-1 grid-cols-3 content-start gap-2 overflow-y-auto sm:grid-cols-4 md:grid-cols-6 md:gap-3">
        <li v-for="c in cards" :key="c.id">
          <div
            v-if="!watched(c.id)"
            class="relative flex w-full flex-col items-center justify-center gap-1 border border-line bg-surface/60 text-ink-subtle"
            style="aspect-ratio: 627 / 1005"
            :aria-label="`Card ${c.order}, locked`"
          >
            <Lock :size="16" aria-hidden="true" />
            <span class="font-display text-2xl font-bold tabular-nums">{{ String(c.order).padStart(2, '0') }}</span>
          </div>
          <button v-else type="button" class="block w-full transition-transform duration-150 hover:-translate-y-0.5" :aria-label="`Open the ${c.item.title} card`" @click="openFromGallery(c.id)">
            <AchievementsAchievementCard
              :title="c.item.title"
              :order="c.order"
              :title-id="c.id"
              :year="c.item.release_year"
              :collector="collector"
              :type="c.item.type"
              :priority="c.item.priority"
              :tagline="taglineFor(c.id, c.order)"
              :featuring="c.item.characters"
              :player="player"
              :date="dateOf(c.id)"
              :art="arts[c.id]"
            />
          </button>
        </li>
      </ul>
    </template>

    <!-- Doomsday Ready: the final card -->
    <template v-else>
      <p v-if="problem" class="shrink-0 text-center text-meta text-danger-text" role="alert">{{ problem }}</p>
      <p v-if="note" class="shrink-0 text-center text-meta text-gold-soft" role="status">{{ note }}</p>
      <div class="flex min-h-0 flex-1 items-center justify-center">
        <div class="h-full max-w-full" style="aspect-ratio: 627 / 1005">
          <AchievementsAchievementDoors :closed="readySealed" :glow="ready" label="Doomsday Ready" @opened="readyOpened">
            <AchievementsAchievementCard
              class="h-full"
              title="Doomsday Ready"
              title-id="doomsday_ready"
              :serial="`READY-${collector}`"
              :extra-filter="finishes[finish].filter"
              :order="essentials.length"
              :year="releaseYear"
              :collector="collector"
              type="Avengers: Doomsday"
              priority="essential"
              tagline="All essentials watched"
              :featuring="[`${essentials.length} of ${essentials.length} essential titles`]"
              :player="player"
              :date="readyDate"
              :art="readyArt"
              :locked="!ready"
            />
          </AchievementsAchievementDoors>
        </div>
      </div>

      <!-- Locked: how far along, and what is left -->
      <div v-if="!ready" class="shrink-0 space-y-1 text-center">
        <p class="text-body font-semibold">{{ essentialsDone }} of {{ essentials.length }} essential titles watched</p>
        <p class="text-meta text-ink-muted">Left: {{ essentials.filter((c) => !watched(c.id)).map((c) => c.item.title).join(' · ') }}</p>
      </div>

      <!-- Unlocked: make it yours -->
      <div v-else-if="!readySealed" class="flex shrink-0 flex-wrap items-center justify-center gap-2 md:gap-3">
        <div class="flex overflow-hidden rounded-control border border-line-strong" role="group" aria-label="Finish">
          <button v-for="(f, key) in finishes" :key="key" type="button" :aria-pressed="finish === key" :class="[seg, finish === key ? '' : segOff]" @click="finish = key">{{ f.label }}</button>
        </div>
        <label class="inline-flex min-h-11 items-center gap-2 text-control text-ink-muted">
          <input v-model="showDate" type="checkbox" class="size-5 accent-doom-green">
          Show date
        </label>
        <div class="flex overflow-hidden rounded-control border border-line-strong" role="group" aria-label="Image format">
          <button v-for="f in (['story', 'card'] as const)" :key="f" type="button" :aria-pressed="format === f" :class="[seg, format === f ? '' : segOff]" @click="format = f">{{ f === 'story' ? '9:16' : '3:4' }}</button>
        </div>
        <UiButton :disabled="busy" @click="runReady(true)">
          <Share2 :size="18" aria-hidden="true" />
          {{ busy ? 'Preparing…' : 'Share' }}
        </UiButton>
        <UiButton variant="secondary" :disabled="busy" aria-label="Download" @click="runReady(false)">
          <Download :size="18" aria-hidden="true" />
        </UiButton>
        <UiButton variant="secondary" aria-label="Replay the unlock" @click="readyReplay = true">
          <RotateCcw :size="18" aria-hidden="true" />
        </UiButton>
      </div>
    </template>
  </section>
</template>
