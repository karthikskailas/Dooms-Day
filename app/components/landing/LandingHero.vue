<script setup lang="ts">
import { ArrowRight } from 'lucide-vue-next'
import { collectionMeta } from '../../utils/collection.ts'

// The release date and target title come from the roadmap JSON, never from this component.
const { target_title: targetTitle, target_release_date: targetDate } = collectionMeta
// The section is deliberately not positioned: the backdrop anchors to the layout shell.
</script>

<template>
  <section
    aria-labelledby="hero-title"
    class="flex h-full flex-col items-center justify-center gap-8 px-4 pt-[12dvh] md:justify-end md:pb-[12dvh] md:pt-0 md:portrait:justify-center md:portrait:pb-0 md:portrait:pt-[56dvh]"
  >
    <LandingHeroBackdrop />

    <h1 id="hero-title" class="sr-only">Marvel: Road to Doomsday, countdown to {{ targetTitle }}</h1>

    <!-- Phones: our own countdown over the poster. Tablet and up: the video is the countdown. -->
    <div class="enter w-full max-w-sm md:hidden" style="--enter-delay: 120ms">
      <LandingDoomsdayCountdown :target-date="targetDate" :target-title="targetTitle" />
    </div>

    <div class="enter flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row" style="--enter-delay: 240ms">
      <UiButton to="/journey/doomsday" size="lg">
        Doomsday Journey
        <ArrowRight :size="18" aria-hidden="true" />
      </UiButton>
      <UiButton to="/universe" variant="secondary" size="lg">Whole Universe</UiButton>
    </div>
  </section>
</template>
