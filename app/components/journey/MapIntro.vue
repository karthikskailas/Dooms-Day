<script setup lang="ts">
import { SkipForward } from 'lucide-vue-next'

// Full-screen intro played when a journey is opened from the landing page. It plays with sound (the click that opened
// the map counts as the user's gesture; if the browser still refuses, it plays muted), ends by itself, and can be skipped.
const emit = defineEmits<{ leave: []; done: [] }>()

const video = ref<HTMLVideoElement | null>(null)
const skip = ref<HTMLButtonElement | null>(null)
const src = ref('')
const leaving = ref(false)
const FADE_MS = 1500
/** Seconds before the end at which the slow dissolve into the map's tree begins. */
const FADE_LEAD = 1.8

function onTime() {
  const v = video.value
  if (v && v.duration && v.duration - v.currentTime <= FADE_LEAD) finish()
}

function finish() {
  if (leaving.value) return
  leaving.value = true
  emit('leave')
  setTimeout(() => emit('done'), FADE_MS)
}

onMounted(async () => {
  src.value = window.matchMedia('(min-width: 768px)').matches ? '/media/intro-1080.mp4' : '/media/intro-720.mp4'
  await nextTick()
  skip.value?.focus({ preventScroll: true })
  const v = video.value
  if (!v) return finish()
  try {
    await v.play()
  } catch {
    v.muted = true
    v.play().catch(finish)
  }
})
</script>

<template>
  <div
    class="fixed inset-0 z-50 bg-black transition-opacity duration-[1500ms] ease-in-out"
    :class="leaving ? 'opacity-0' : 'opacity-100'"
    role="dialog"
    aria-label="Intro video"
    @keydown.esc="finish"
  >
    <video
      v-if="src"
      ref="video"
      :src="src"
      class="size-full object-cover"
      playsinline
      preload="auto"
      aria-hidden="true"
      @timeupdate="onTime"
      @ended="finish"
      @error="finish"
    />
    <button
      ref="skip"
      type="button"
      class="absolute bottom-6 right-6 inline-flex min-h-11 items-center gap-2 rounded-control border border-line-strong bg-void/80 px-4 text-control font-semibold uppercase tracking-[0.06em] text-ink transition-colors duration-150 hover:border-relic-gold hover:bg-surface-soft focus-visible:outline-relic-gold"
      @click="finish"
    >
      Skip intro
      <SkipForward :size="18" aria-hidden="true" />
    </button>
  </div>
</template>
