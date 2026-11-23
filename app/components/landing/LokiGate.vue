<script setup lang="ts">
import type { TitleMetadata, TitleResponse } from '../../../shared/types/tmdb.ts'

// The step between the name and the intro: the screen fades to black, Loki's own artwork rises out of it, and a
// short welcome names the player. Then it fades back to black, which is where the intro video starts, so nothing
// jumps. Any click, or Skip, goes straight on.
const props = defineProps<{ target: string; name: string }>()

const playIntro = useState('playIntro', () => false)
const backdrop = useState<string | null>('lokiBackdrop', () => null)
const leaving = ref(false)
let go: ReturnType<typeof setTimeout> | undefined

function proceed() {
  clearTimeout(go)
  playIntro.value = true
  navigateTo(props.target)
}

onMounted(async () => {
  go = setTimeout(() => (leaving.value = true), 3300)
  go = setTimeout(proceed, 4000)
  if (!backdrop.value) {
    try {
      backdrop.value = (await $fetch<TitleResponse<TitleMetadata>>('/api/titles/marvel_048')).data.backdropUrl
    } catch {
      backdrop.value = null
    }
  }
})
onBeforeUnmount(() => clearTimeout(go))
</script>

<template>
  <div
    class="gate-in fixed inset-0 z-[60] overflow-hidden bg-black"
    :class="leaving ? 'gate-out' : ''"
    role="dialog"
    aria-modal="true"
    aria-label="Entering Yggdrasil"
    @click="proceed"
  >
    <img v-if="backdrop" :src="backdrop" alt="" class="gate-art absolute inset-0 size-full object-cover" draggable="false">
    <div class="absolute inset-0 bg-linear-to-t from-black via-black/40 to-black/60" />

    <div class="absolute inset-x-0 bottom-[16dvh] flex flex-col items-center gap-3 px-6 text-center">
      <p class="gate-line text-meta font-semibold uppercase tracking-[0.4em] text-gold-soft" style="--gate-delay: 900ms">Entering Yggdrasil</p>
      <p class="gate-line max-w-3xl text-balance font-display text-[clamp(2.25rem,7vw,5rem)] font-bold uppercase leading-[0.95] tracking-[0.02em]" style="--gate-delay: 1500ms">
        Welcome, {{ name }}
      </p>
      <p class="gate-line text-body text-ink-muted" style="--gate-delay: 2200ms">Every branch is a story. Walk them in order.</p>
    </div>

    <button type="button" class="absolute bottom-5 right-5 min-h-11 px-3 text-control font-semibold uppercase tracking-[0.08em] text-ink-subtle hover:text-ink" @click.stop="proceed">Skip</button>
  </div>
</template>
