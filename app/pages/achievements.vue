<script setup lang="ts">
import { Download, ChevronLeft, ChevronRight, Map as MapIcon, Share2, Sparkles } from 'lucide-vue-next'
import type { TitleMetadata, TitleResponse } from '../../shared/types/tmdb.ts'
import { roadmap } from '../utils/roadmap-data.ts'
import { buildLayout } from '../utils/roadmap-map.ts'
import { taglineFor } from '../utils/card-taglines.ts'
import { fileNameFor, renderCard, type CardFormat } from '../utils/card-export.ts'
import frame from '../assets/cards/frame.webp'
import bg from '../assets/cards/bg.webp'
import ring from '../assets/cards/ring.webp'
import knight from '../assets/cards/knight.webp'

definePageMeta({ layout: 'bare' })
useSeoMeta({ title: 'Achievements — Marvel: Road to Doomsday', description: 'Collectible cards for every title on the road to Avengers: Doomsday. An independent fan project.' })

// One card per title. Watched titles unlock; the rest stay as locked outlines.
const toCards = (doomsdayOnly: boolean) =>
  buildLayout(roadmap, false, doomsdayOnly).nodes.flatMap((n) => (n.kind === 'main' ? [{ id: n.id, order: n.order, item: n.item }] : []))
const sets = { all: toCards(false), doomsday: toCards(true) }
// Every title has a card. "All" numbers them by watch order; "Doomsday" is the shorter route, numbered 1, 2, 3.
const mode = ref<'all' | 'doomsday'>('all')
const cards = computed(() => sets[mode.value])

const progress = useProgress()
const route = useRoute()
const start = sets.all.findIndex((c) => c.id === route.query.card)
const index = ref(Math.max(0, start))
// Opening a card from its unlock notice plays the unlock animation; the button replays it.
const reveal = ref(start >= 0 ? 1 : 0)
const hue = ref<number | null>(null)
const busy = ref(false)
const problem = ref<string | null>(null)
const arts = reactive<Record<string, string | null>>({})

const card = computed(() => cards.value[index.value]!)
watch(mode, () => {
  index.value = 0
  reveal.value = 0
})
const unlocked = computed(() => cards.value.filter((c) => progress.isWatched(c.id)).length)
const entry = computed(() => progress.progressFor(card.value.id))
const date = computed(() => {
  const iso = entry.value?.completedAt
  return iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase() : ''
})
const player = computed(() => progress.state.value.preferences.displayName ?? 'Anonymous Avenger')

async function loadArt(id: string) {
  if (id in arts) return
  arts[id] = null
  try {
    const r = await $fetch<TitleResponse<TitleMetadata>>(`/api/titles/${id}`)
    arts[id] = r.data.posterUrl
  } catch {
    arts[id] = null
  }
}
watch(index, () => loadArt(card.value.id), { immediate: true })

const go = (step: number) => {
  index.value = (index.value + step + cards.value.length) % cards.value.length
  reveal.value = 0
}

const format = ref<CardFormat>('story')
const note = ref<string | null>(null)

async function makeFile() {
  const c = card.value
  const blob = await renderCard(
    {
      title: c.item.title,
      order: c.order,
      year: c.item.release_year,
      type: c.item.type,
      priority: c.item.priority,
      tagline: taglineFor(c.id, c.order),
      featuring: c.item.characters,
      player: player.value,
      date: date.value,
      art: arts[c.id] ?? null,
      hue: hue.value,
    },
    { frame, bg, ring, knight },
    format.value,
  )
  return new File([blob], fileNameFor(c.order, c.item.title, format.value), { type: 'image/png' })
}

function save(file: File) {
  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = file.name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

async function run(share: boolean) {
  busy.value = true
  problem.value = null
  note.value = null
  try {
    const file = await makeFile()
    // Phones open their share sheet (Instagram Stories is in it). Elsewhere the image is saved instead.
    if (share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: 'Road to Doomsday', text: `I unlocked ${card.value.item.title} on the road to Avengers: Doomsday.` })
    } else {
      save(file)
      if (share) note.value = 'Saved. Open Instagram and add the image to your story.'
    }
  } catch (e) {
    if ((e as Error).name !== 'AbortError') problem.value = 'Could not make the image. Check your connection and try again.'
  } finally {
    busy.value = false
  }
}
const name = computed({ get: () => progress.state.value.preferences.displayName ?? '', set: (v: string) => progress.setDisplayName(v) })

const btn =
  'inline-flex size-12 items-center justify-center rounded-control border border-line-strong bg-surface-raised text-ink transition-colors duration-150 hover:border-relic-gold hover:bg-surface-soft'
</script>

<template>
  <section class="flex size-full flex-col gap-3 p-3 md:p-5" @keydown.left="go(-1)" @keydown.right="go(1)">
    <div class="flex shrink-0 flex-wrap items-center gap-3">
      <NuxtLink to="/journey/doomsday" class="inline-flex min-h-11 items-center gap-2 rounded-control border border-line-strong bg-surface-raised px-3 text-control font-semibold uppercase tracking-[0.06em] hover:border-relic-gold">
        <MapIcon :size="18" aria-hidden="true" />
        Timeline
      </NuxtLink>
      <h1 class="font-display text-xl font-bold uppercase tracking-[0.08em]">Achievements <span class="text-gold-soft tabular-nums">{{ unlocked }}/{{ cards.length }}</span></h1>
      <div class="flex overflow-hidden rounded-control border border-line-strong" role="group" aria-label="Which cards">
        <button
          v-for="m in (['all', 'doomsday'] as const)"
          :key="m"
          type="button"
          :aria-pressed="mode === m"
          class="min-h-11 px-3 text-control font-semibold uppercase tracking-[0.06em] transition-colors duration-150 aria-pressed:bg-doom-green aria-pressed:text-ink"
          :class="mode === m ? '' : 'bg-surface-raised text-ink-muted hover:text-ink'"
          @click="mode = m"
        >
          {{ m === 'all' ? 'All titles' : 'Doomsday route' }}
        </button>
      </div>
      <label class="ml-auto flex items-center gap-2 text-meta text-ink-muted">
        <span>Name on cards</span>
        <input v-model="name" type="text" maxlength="30" placeholder="Anonymous Avenger" class="min-h-11 w-44 rounded-control border border-line-strong bg-surface px-3 text-body text-ink placeholder:text-ink-subtle">
      </label>
    </div>

    <div class="flex min-h-0 flex-1 items-center justify-center">
      <div class="h-full max-w-full" style="aspect-ratio: 627 / 1005">
        <AchievementsAchievementCard
          :key="`${card.id}-${reveal}`"
          class="h-full"
          :title="card.item.title"
          :order="card.order"
          :year="card.item.release_year"
          :type="card.item.type"
          :priority="card.item.priority"
          :tagline="taglineFor(card.id, card.order)"
          :featuring="card.item.characters"
          :reveal="reveal"
          :player="player"
          :date="date"
          :art="arts[card.id]"
          :locked="!progress.isWatched(card.id)"
          @hue="hue = $event"
        />
      </div>
    </div>

    <p v-if="problem" class="shrink-0 text-center text-meta text-danger-text" role="alert">{{ problem }}</p>
    <p v-if="note" class="shrink-0 text-center text-meta text-gold-soft" role="status">{{ note }}</p>
    <div v-if="progress.isWatched(card.id)" class="flex shrink-0 flex-wrap items-center justify-center gap-3">
      <div class="flex overflow-hidden rounded-control border border-line-strong" role="group" aria-label="Image format">
        <button
          v-for="f in (['story', 'card'] as const)"
          :key="f"
          type="button"
          :aria-pressed="format === f"
          class="min-h-11 px-3 text-control font-semibold uppercase tracking-[0.06em] aria-pressed:bg-doom-green aria-pressed:text-ink"
          :class="format === f ? '' : 'bg-surface-raised text-ink-muted hover:text-ink'"
          @click="format = f"
        >
          {{ f === 'story' ? 'Story 9:16' : 'Card 3:4' }}
        </button>
      </div>
      <UiButton :disabled="busy" @click="run(true)">
        <Share2 :size="18" aria-hidden="true" />
        {{ busy ? 'Preparing…' : 'Share' }}
      </UiButton>
      <UiButton variant="secondary" :disabled="busy" @click="run(false)">
        <Download :size="18" aria-hidden="true" />
        Download
      </UiButton>
      <UiButton variant="secondary" @click="reveal++">
        <Sparkles :size="18" aria-hidden="true" />
        Replay unlock
      </UiButton>
    </div>
    <div class="flex shrink-0 items-center justify-center gap-4">
      <button type="button" :class="btn" aria-label="Previous card" @click="go(-1)"><ChevronLeft :size="22" aria-hidden="true" /></button>
      <p class="min-w-24 text-center text-body font-semibold tabular-nums">{{ index + 1 }} <span class="text-ink-subtle">of {{ cards.length }}</span></p>
      <button type="button" :class="btn" aria-label="Next card" @click="go(1)"><ChevronRight :size="22" aria-hidden="true" /></button>
    </div>
  </section>
</template>
