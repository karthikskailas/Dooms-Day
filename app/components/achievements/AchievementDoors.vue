<script setup lang="ts">
// The seal on a card that has been earned but not yet opened: two heavy doors with a light seam and the words
// "Achievement unlocked". One tap slides them apart and the card behind glows. The doors play once per card;
// `closed` turning true again (Replay) shuts them.
const props = defineProps<{ closed: boolean; label: string; glow?: boolean }>()
const emit = defineEmits<{ opened: [] }>()

const phase = ref<'closed' | 'opening' | 'open'>(props.closed ? 'closed' : 'open')
let timer: ReturnType<typeof setTimeout> | undefined

watch(
  () => props.closed,
  (c) => {
    clearTimeout(timer)
    phase.value = c ? 'closed' : 'open'
  },
)
onBeforeUnmount(() => clearTimeout(timer))

function open() {
  if (phase.value !== 'closed') return
  phase.value = 'opening'
  timer = setTimeout(() => {
    phase.value = 'open'
    emit('opened')
  }, 1100)
}
</script>

<template>
  <div class="relative size-full" :class="phase === 'open' && glow ? 'card-glow' : ''">
    <slot />

    <div v-if="phase !== 'open'" class="absolute inset-0 overflow-hidden">
      <!-- Light behind the doors, which spills out as they part -->
      <div class="door-light absolute inset-y-0 left-1/2 w-1/3 -translate-x-1/2" :class="phase === 'opening' ? 'door-light-on' : ''" aria-hidden="true" />
      <div class="door door-left" :class="phase === 'opening' ? 'door-open-left' : ''" aria-hidden="true" />
      <div class="door door-right" :class="phase === 'opening' ? 'door-open-right' : ''" aria-hidden="true" />

      <button
        type="button"
        class="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center transition-opacity duration-300 focus-visible:outline-offset-[-6px]"
        :class="phase === 'opening' ? 'pointer-events-none opacity-0' : ''"
        :aria-label="`Achievement unlocked: ${label}. Open the card.`"
        @click="open"
      >
        <span class="door-badge font-display text-[clamp(1.5rem,5vw,2.25rem)] md:text-[2.25rem] font-bold uppercase leading-none tracking-[0.12em] text-gold-soft">Achievement<br>unlocked</span>
        <span class="text-meta font-semibold uppercase tracking-[0.2em] text-ink-muted">Tap to open</span>
      </button>
    </div>
  </div>
</template>
