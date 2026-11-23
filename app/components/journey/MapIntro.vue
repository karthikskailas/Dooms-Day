<script setup lang="ts">
import { SkipForward } from 'lucide-vue-next'

// Full-screen intro played when a journey is opened from the landing page. It plays with sound (the click that opened
// the map counts as the user's gesture; if the browser still refuses, it plays muted), ends by itself, and can be skipped.
// Picture and sound both fade: the video rises out of black while its volume climbs from silence, and at the end
// both sink together, so there is no hard cut at either end.
const emit = defineEmits<{ leave: []; done: [] }>()

const video = ref<HTMLVideoElement | null>(null)
const skip = ref<HTMLButtonElement | null>(null)
const src = ref('')
const leaving = ref(false)
const FADE_MS = 1500
/** Seconds before the end at which the slow dissolve into the map's tree begins. */
const FADE_LEAD = 1.8
/** Where in the file playback starts, in seconds. Raise it to skip a slow opening. */
const START_AT = 0
const SOUND_IN_MS = 2500

const curtain = useState('curtain', () => false)
const shown = ref(false)
let ramp = 0

/** Moves the volume to `to` over `ms`, smoothly (eased), replacing any ramp already running. */
function fadeVolume(to: number, ms: number) {
  const v = video.value
  if (!v) return
  cancelAnimationFrame(ramp)
  const from = v.volume
  const start = performance.now()
  const step = (t: number) => {
    const k = Math.min(1, (t - start) / ms)
    v.volume = from + (to - from) * (k * k * (3 - 2 * k))
    if (k < 1) ramp = requestAnimationFrame(step)
  }
  ramp = requestAnimationFrame(step)
}

/** First frame is on screen: lower the curtain and let picture and sound rise. */
function onPlaying() {
  if (shown.value) return
  shown.value = true
  curtain.value = false
  fadeVolume(1, SOUND_IN_MS)
}
onBeforeUnmount(() => cancelAnimationFrame(ramp))

function onTime() {
  const v = video.value
  if (v && v.duration && v.duration - v.currentTime <= FADE_LEAD) finish()
}

function finish() {
  if (leaving.value) return
  leaving.value = true
  curtain.value = false
  fadeVolume(0, FADE_MS)
  emit('leave')
  setTimeout(() => emit('done'), FADE_MS)
}

onMounted(async () => {
  src.value = window.matchMedia('(min-width: 768px)').matches ? '/media/intro-1080.mp4' : '/media/intro-720.mp4'
  await nextTick()
  skip.value?.focus({ preventScroll: true })
  const v = video.value
  if (!v) return finish()
  v.volume = 0
  if (START_AT) v.currentTime = START_AT
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
      class="size-full object-cover transition-opacity duration-[1800ms] ease-in-out"
      :class="shown ? 'opacity-100' : 'opacity-0'"
      playsinline
      preload="auto"
      aria-hidden="true"
      @playing="onPlaying"
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
