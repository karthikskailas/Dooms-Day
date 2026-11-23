<script setup lang="ts">
import { ArrowRight } from 'lucide-vue-next'
import { collectionMeta } from '../../utils/collection.ts'

// The release date and target title come from the roadmap JSON, never from this component.
// The name is asked first; the intro and the map follow it (see NamePrompt).
const asking = ref<{ to: string } | null>(null)
const entering = ref<{ to: string; name: string } | null>(null)
// The two choices stay hidden until the backdrop (video or poster) is on screen, so the first thing seen is the
// countdown, not buttons over a blank page. A timer shows them anyway if the backdrop is slow.
const ready = ref(false)
onMounted(() => setTimeout(() => (ready.value = true), 9000))
const { target_title: targetTitle, target_release_date: targetDate } = collectionMeta
// The section is deliberately not positioned: the backdrop anchors to the layout shell.
</script>

<template>
  <section
    aria-labelledby="hero-title"
    class="flex h-full flex-col items-center justify-center gap-8 px-4 pt-[12dvh] md:justify-end md:pb-[12dvh] md:pt-0 md:portrait:justify-center md:portrait:pb-0 md:portrait:pt-[56dvh]"
  >
    <LandingHeroBackdrop @ready="ready = true" />

    <h1 id="hero-title" class="sr-only">Marvel: Road to Doomsday, countdown to {{ targetTitle }}</h1>

    <!-- Phones: our own countdown over the poster. Tablet and up: the video is the countdown. -->
    <div class="enter w-full max-w-sm md:hidden" style="--enter-delay: 120ms">
      <LandingDoomsdayCountdown :target-date="targetDate" :target-title="targetTitle" />
    </div>

    <div class="flex w-full flex-col justify-center gap-3 transition-opacity duration-1000 ease-out sm:w-auto sm:flex-row" :class="ready ? 'opacity-100' : 'pointer-events-none opacity-0'" :inert="!ready">
      <UiButton size="lg" @click="asking = { to: '/journey/doomsday' }">
        Doomsday Journey
        <ArrowRight :size="18" aria-hidden="true" />
      </UiButton>
      <UiButton variant="secondary" size="lg" @click="asking = { to: '/universe' }">Whole Universe</UiButton>
    </div>
  </section>

  <!-- Loader: covers the whole page, buttons included, until the backdrop is playing. -->
  <Transition leave-active-class="transition-opacity duration-1000 ease-out" leave-to-class="opacity-0">
    <div v-if="!ready" class="fixed inset-0 z-40 flex flex-col items-center justify-center gap-4 bg-black" role="status" aria-label="Loading">
      <span class="size-10 animate-spin rounded-full border-2 border-line-strong border-t-relic-gold" aria-hidden="true" />
      <span class="text-meta font-semibold uppercase tracking-[0.4em] text-ink-subtle">Loading</span>
    </div>
  </Transition>

  <LandingNamePrompt v-if="asking && !entering" @cancel="asking = null" @enter="entering = { to: asking.to, name: $event }" />
  <LandingLokiGate v-if="entering" :target="entering.to" :name="entering.name" />
</template>
