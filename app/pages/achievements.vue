<script setup lang="ts">
import { ChevronLeft, ChevronRight, Map as MapIcon } from 'lucide-vue-next'
import type { TitleMetadata, TitleResponse } from '../../shared/types/tmdb.ts'
import { roadmap } from '../utils/roadmap-data.ts'
import { buildLayout } from '../utils/roadmap-map.ts'

definePageMeta({ layout: 'bare' })
useSeoMeta({ title: 'Achievements — Marvel: Road to Doomsday', description: 'Collectible cards for every title on the road to Avengers: Doomsday. An independent fan project.' })

// One card per step of the Doomsday route. Watched titles unlock; the rest stay as locked outlines.
const cards = buildLayout(roadmap, false, true).nodes.flatMap((n) => (n.kind === 'main' ? [{ id: n.id, order: n.order, item: n.item }] : []))

const progress = useProgress()
const index = ref(0)
const arts = reactive<Record<string, string | null>>({})

const card = computed(() => cards[index.value]!)
const unlocked = computed(() => cards.filter((c) => progress.isWatched(c.id)).length)
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

const go = (step: number) => (index.value = (index.value + step + cards.length) % cards.length)
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
      <label class="ml-auto flex items-center gap-2 text-meta text-ink-muted">
        <span>Name on cards</span>
        <input v-model="name" type="text" maxlength="30" placeholder="Anonymous Avenger" class="min-h-11 w-44 rounded-control border border-line-strong bg-surface px-3 text-body text-ink placeholder:text-ink-subtle">
      </label>
    </div>

    <div class="flex min-h-0 flex-1 items-center justify-center">
      <div class="h-full max-w-full aspect-[3/4]">
        <AchievementsAchievementCard
          :key="card.id"
          class="h-full shadow-[0_24px_60px_-20px_rgb(0_0_0/0.8)]"
          :title="card.item.title"
          :order="card.order"
          :year="card.item.release_year"
          :priority="card.item.priority"
          :player="player"
          :date="date"
          :art="arts[card.id]"
          :locked="!progress.isWatched(card.id)"
        />
      </div>
    </div>

    <div class="flex shrink-0 items-center justify-center gap-4">
      <button type="button" :class="btn" aria-label="Previous card" @click="go(-1)"><ChevronLeft :size="22" aria-hidden="true" /></button>
      <p class="min-w-24 text-center text-body font-semibold tabular-nums">{{ index + 1 }} <span class="text-ink-subtle">of {{ cards.length }}</span></p>
      <button type="button" :class="btn" aria-label="Next card" @click="go(1)"><ChevronRight :size="22" aria-hidden="true" /></button>
    </div>
  </section>
</template>
