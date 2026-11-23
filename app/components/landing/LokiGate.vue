<script setup lang="ts">
import type { TitleMetadata, TitleResponse } from '../../../shared/types/tmdb.ts'

// The step between the name and the intro: the screen fades to black, Loki's own artwork rises slowly out of it, and a
// short welcome names the player. Then the picture sinks back into black, a black curtain (app.vue) holds while the map
// page loads, and the intro video fades up out of that same black. Any click, or Skip, goes straight on.
const props = defineProps<{ target: string; name: string }>()

const playIntro = useState('playIntro', () => false)
const curtain = useState('curtain', () => false)
const backdrop = useState<string | null>('lokiBackdrop', () => null)
const leaving = ref(false)
const timers: ReturnType<typeof setTimeout>[] = []

function proceed() {
  timers.forEach(clearTimeout)
  curtain.value = true
  playIntro.value = true
  navigateTo(props.target)
}

onMounted(async () => {
  // 0-1.1 s black settles, art rises over ~2.4 s, three lines follow; hold; 5.6 s the scene sinks to black over 1.2 s.
  timers.push(setTimeout(() => (leaving.value = true), 5600))
  timers.push(setTimeout(proceed, 6900))
  if (!backdrop.value) {
    try {
      backdrop.value = (await $fetch<TitleResponse<TitleMetadata>>('/api/titles/marvel_048')).data.backdropUrl
    } catch {
      backdrop.value = null
    }
  }
})
onBeforeUnmount(() => timers.forEach(clearTimeout))
</script>

<template>
  <div
    class="gate-in fixed inset-0 z-[60] overflow-hidden bg-black"
    role="dialog"
    aria-modal="true"
    aria-label="Entering Yggdrasil"
    @click="proceed"
  >
    <div class="absolute inset-0 transition-opacity duration-[1200ms] ease-in-out" :class="leaving ? 'opacity-0' : 'opacity-100'">
    <img v-if="backdrop" :src="backdrop" alt="" class="gate-art absolute inset-0 size-full object-cover" draggable="false">
    <div class="absolute inset-0 bg-linear-to-t from-black via-black/40 to-black/60" />

    <div class="absolute inset-x-0 bottom-[16dvh] flex flex-col items-center gap-3 px-6 text-center">
      <p class="gate-line text-meta font-semibold uppercase tracking-[0.4em] text-gold-soft" style="--gate-delay: 1400ms">Entering Yggdrasil</p>
      <p class="gate-line max-w-3xl text-balance font-display text-[clamp(2.25rem,7vw,5rem)] font-bold uppercase leading-[0.95] tracking-[0.02em]" style="--gate-delay: 2300ms">
        Welcome, {{ name }}
      </p>
      <p class="gate-line text-body text-ink-muted" style="--gate-delay: 3400ms">Every branch is a story. Walk them in order.</p>
    </div>
    </div>

    <button type="button" class="absolute bottom-5 right-5 min-h-11 px-3 text-control font-semibold uppercase tracking-[0.08em] text-ink-subtle hover:text-ink" @click.stop="proceed">Skip</button>
  </div>
</template>
