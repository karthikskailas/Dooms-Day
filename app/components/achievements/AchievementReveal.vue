<script setup lang="ts">
import { Download, LayoutGrid, Share2, X } from 'lucide-vue-next'
import frame from '../../assets/cards/frame.webp'
import bg from '../../assets/cards/bg.webp'
import ring from '../../assets/cards/ring.webp'
import knight from '../../assets/cards/knight.webp'
import { renderCard, fileNameFor } from '../../utils/card-export.ts'
import { codenameOf } from '../../utils/card-theme.ts'
import { taglineFor } from '../../utils/card-taglines.ts'
import type { CardPriority } from '../../utils/card-theme.ts'

// Shown over the title screen the moment a title is marked watched: "Achievement unlocked", one tap slides the doors
// apart and this player's own copy of the card appears and breathes with a soft glow.
const props = defineProps<{
  titleId: string
  title: string
  order: number
  year: number
  type: string
  priority: CardPriority
  featuring: string[]
  art: string | null
  date: string
}>()
const emit = defineEmits<{ close: [] }>()

const progress = useProgress()
const cardState = useCardState()
onMounted(() => cardState.hydrate())

const collector = computed(() => cardState.collector.value)
const player = computed(() => progress.state.value.preferences.displayName ?? codenameOf(collector.value))
const sealed = ref(true)
const hue = ref<number | null>(null)
const busy = ref(false)
const note = ref<string | null>(null)

const root = ref<HTMLElement | null>(null)
onMounted(() => root.value?.querySelector<HTMLElement>('button')?.focus({ preventScroll: true }))

function opened() {
  sealed.value = false
  cardState.open(props.titleId)
}

async function make(share: boolean) {
  busy.value = true
  note.value = null
  try {
    const blob = await renderCard(
      {
        titleId: props.titleId,
        title: props.title,
        order: props.order,
        year: props.year,
        collector: collector.value,
        type: props.type,
        priority: props.priority,
        tagline: taglineFor(props.titleId, props.order),
        featuring: props.featuring,
        player: player.value,
        date: props.date,
        art: props.art,
        hue: hue.value,
      },
      { frame, bg, ring, knight },
      'story',
    )
    const file = new File([blob], fileNameFor(props.order, props.title, 'story'), { type: 'image/png' })
    if (share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: 'Road to Doomsday', text: `I unlocked ${props.title} on the road to Avengers: Doomsday.` })
    } else {
      const url = URL.createObjectURL(file)
      const a = document.createElement('a')
      a.href = url
      a.download = file.name
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      if (share) note.value = 'Saved. Open Instagram or Telegram and add the image from your gallery.'
    }
  } catch (e) {
    if ((e as Error).name !== 'AbortError') note.value = 'Could not make the image. Try again.'
  } finally {
    busy.value = false
  }
}

const iconBtn =
  'inline-flex size-11 items-center justify-center rounded-control border border-line-strong bg-void/70 text-ink transition-colors duration-150 hover:border-relic-gold hover:bg-surface-soft'
</script>

<template>
  <div
    ref="root"
    class="detail-fade absolute inset-0 z-50 flex flex-col items-center gap-3 bg-void/96 p-4"
    role="dialog"
    aria-modal="true"
    aria-label="Achievement unlocked"
    @keydown.esc.stop="emit('close')"
  >
    <div class="flex w-full shrink-0 justify-end">
      <button type="button" :class="iconBtn" aria-label="Close" @click="emit('close')"><X :size="20" aria-hidden="true" /></button>
    </div>

    <div class="flex min-h-0 flex-1 items-center justify-center">
      <div class="h-full max-w-full" style="aspect-ratio: 627 / 1005">
        <AchievementsAchievementDoors :closed="sealed" glow :label="title" @opened="opened">
          <AchievementsAchievementCard
            class="h-full"
            :title="title"
            :title-id="titleId"
            :order="order"
            :year="year"
            :collector="collector"
            :type="type"
            :priority="priority"
            :tagline="taglineFor(titleId, order)"
            :featuring="featuring"
            :player="player"
            :date="date"
            :art="art"
            @hue="hue = $event"
          />
        </AchievementsAchievementDoors>
      </div>
    </div>

    <p v-if="note" class="shrink-0 text-center text-meta text-gold-soft" role="status">{{ note }}</p>
    <div v-if="!sealed" class="flex shrink-0 flex-wrap items-center justify-center gap-2 md:gap-3">
      <UiButton :disabled="busy" @click="make(true)">
        <Share2 :size="18" aria-hidden="true" />
        {{ busy ? 'Preparing…' : 'Share' }}
      </UiButton>
      <UiButton variant="secondary" :disabled="busy" aria-label="Download as a story image" @click="make(false)">
        <Download :size="18" aria-hidden="true" />
      </UiButton>
      <UiButton variant="secondary" :to="`/achievements?card=${titleId}`">
        <LayoutGrid :size="18" aria-hidden="true" />
        Collection
      </UiButton>
    </div>
  </div>
</template>
