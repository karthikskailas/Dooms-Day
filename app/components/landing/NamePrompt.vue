<script setup lang="ts">
import { ArrowRight } from 'lucide-vue-next'
import { codenameOf } from '../../utils/card-theme.ts'

// Asked after "Doomsday Journey" or "Whole Universe" is chosen, before the intro plays. The name goes on every
// achievement card. Leaving it blank is allowed: the player gets a codename made from their collector code.
const emit = defineEmits<{ cancel: []; enter: [name: string] }>()

const progress = useProgress()
const cardState = useCardState()

const name = ref('')
const input = ref<HTMLInputElement | null>(null)
const codename = computed(() => codenameOf(cardState.collector.value))

onMounted(() => {
  cardState.hydrate()
  progress.hydrate()
  name.value = progress.state.value.preferences.displayName ?? ''
  input.value?.focus()
  preloadIntro().catch(() => {}) // start the intro download while the player types a name
})

function enter() {
  const typed = name.value.trim()
  progress.setDisplayName(typed || null)
  emit('enter', typed || codename.value)
}
</script>

<template>
  <div
    class="detail-fade fixed inset-0 z-50 flex items-center justify-center bg-void/90 p-4"
    role="dialog"
    aria-modal="true"
    aria-labelledby="name-title"
    @keydown.esc="emit('cancel')"
  >
    <div class="cut-panel w-full max-w-md bg-gold-soft/40 p-px">
      <form class="cut-panel flex flex-col gap-5 bg-surface px-6 py-7 md:px-8" @submit.prevent="enter">
        <div class="space-y-2">
          <h2 id="name-title" class="font-display text-[clamp(1.75rem,6vw,2.5rem)] font-bold uppercase leading-none tracking-[0.04em]">Who is walking the road?</h2>
          <p class="text-body text-ink-muted">Your name goes on every achievement card you unlock. Leave it empty and you get a codename.</p>
        </div>

        <label class="space-y-2">
          <span class="text-meta font-semibold uppercase tracking-wider text-gold-soft">Your name</span>
          <input
            ref="input"
            v-model="name"
            type="text"
            maxlength="30"
            autocomplete="given-name"
            :placeholder="codename"
            class="min-h-12 w-full rounded-control border border-line-strong bg-void px-3 text-body text-ink placeholder:text-ink-subtle focus-visible:outline-relic-gold"
          >
        </label>

        <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <UiButton variant="ghost" @click="emit('cancel')">Back</UiButton>
          <UiButton type="submit" size="lg">
            Enter
            <ArrowRight :size="18" aria-hidden="true" />
          </UiButton>
        </div>
      </form>
    </div>
  </div>
</template>
