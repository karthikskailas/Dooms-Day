<script setup lang="ts">
import { ArrowRight, RotateCcw, Share2 } from 'lucide-vue-next'
import type { Pace } from '../../utils/pace.ts'
import tree from '../../assets/images/yggdrasil-tree.webp'
import { codenameOf } from '../../utils/card-theme.ts'
import { renderProgressStory } from '../../utils/share-story.ts'
import { SITE_URL } from '../../utils/site.ts'

// The "what next" bar: the next title to watch, how fast to go, and Share / Reset.
const props = defineProps<{ nextTitle: string | null; order: number | null; watched: number; total: number; pace: Pace; shareLabel: string; /** True over the map, which keeps its zoom controls at the left. */ overMap: boolean }>()
const emit = defineEmits<{ open: []; reset: [] }>()

const note = ref('')
const confirming = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined

function flash(text: string) {
  note.value = text
  clearTimeout(timer)
  timer = setTimeout(() => (note.value = ''), 2500)
}

const progress = useProgress()
const cardState = useCardState()
const busy = ref(false)

/** Shares a story image (progress, name, QR code and address). Without file sharing it saves the image and copies the link. */
async function share() {
  busy.value = true
  const text = `${props.shareLabel} Road to Doomsday: ${props.watched} of ${props.total} watched. ${SITE_URL}`
  try {
    await cardState.hydrate()
    const blob = await renderProgressStory({
      player: progress.state.value.preferences.displayName ?? codenameOf(cardState.collector.value),
      watched: props.watched,
      total: props.total,
      journey: props.shareLabel.replace(/:$/, ''),
      next: props.nextTitle,
      backdrop: tree,
    })
    const file = new File([blob], 'road-to-doomsday-progress.png', { type: 'image/png' })
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: 'Road to Doomsday', text })
    } else {
      const url = URL.createObjectURL(file)
      const a = document.createElement('a')
      a.href = url
      a.download = file.name
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      await navigator.clipboard?.writeText(text).catch(() => undefined)
      flash('Image saved, link copied')
    }
  } catch (e) {
    if ((e as Error).name !== 'AbortError') flash('Could not make the image')
  } finally {
    busy.value = false
  }
}

function reset() {
  if (!confirming.value) {
    confirming.value = true
    clearTimeout(timer)
    timer = setTimeout(() => (confirming.value = false), 4000)
    return
  }
  confirming.value = false
  emit('reset')
  flash('Progress cleared')
}

const small =
  'inline-flex min-h-11 items-center justify-center gap-1.5 rounded-control border border-line-strong bg-surface-raised max-sm:min-w-11 sm:px-3 text-control font-semibold uppercase tracking-[0.06em] text-ink-muted transition-colors duration-150 hover:border-relic-gold hover:text-ink'
</script>

<template>
  <div
    class="pointer-events-none absolute z-20 flex items-center justify-end gap-2"
    :class="overMap ? 'bottom-3 left-3 right-3 md:left-20' : 'inset-x-0 bottom-0 bg-linear-to-t from-void via-void/90 to-transparent px-3 pb-3 pt-8'"
  >
    <div class="pointer-events-auto flex min-w-0 flex-1 items-center gap-3 rounded-panel border border-line-strong bg-surface/95 py-1.5 pl-3 pr-1.5 md:max-w-xl">
      <div class="min-w-0 flex-1">
        <p v-if="nextTitle" class="truncate text-control font-semibold text-ink">
          <span class="mr-1.5 text-meta uppercase tracking-wider text-gold-soft">Up next</span>{{ order }}. {{ nextTitle }}
        </p>
        <p v-else class="text-control font-semibold text-success">Every title watched. You are ready.</p>
        <p class="hidden truncate text-meta tabular-nums text-ink-subtle sm:block">
          {{ watched }} of {{ total }} watched
          <template v-if="pace.perWeek"> · {{ pace.left }} left, about {{ pace.perWeek }} a week to finish by release</template>
          <template v-else-if="pace.left && !pace.daysLeft"> · release date reached</template>
        </p>
      </div>
      <button v-if="nextTitle" type="button" class="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-control bg-doom-green px-3 text-control font-semibold uppercase tracking-[0.06em] text-ink transition-colors duration-150 hover:bg-doom-green-bright hover:text-void" @click="emit('open')">
        Open
        <ArrowRight :size="16" aria-hidden="true" />
      </button>
    </div>
    <div class="pointer-events-auto flex items-center gap-2 max-sm:hidden">
      <button type="button" :class="small" :disabled="busy" @click="share">
        <Share2 :size="16" aria-hidden="true" />
        <span class="hidden sm:inline">Share</span>
        <span class="sr-only sm:hidden">Share progress</span>
      </button>
      <button type="button" :class="[small, confirming ? 'border-danger text-danger-text' : '']" @click="reset">
        <RotateCcw :size="16" aria-hidden="true" />
        <span :class="confirming ? '' : 'max-sm:sr-only'">{{ confirming ? 'Sure?' : 'Reset' }}</span>
      </button>
    </div>
    <p v-if="note" class="pointer-events-none absolute -top-6 right-0 text-meta text-gold-soft" role="status">{{ note }}</p>
  </div>
</template>
