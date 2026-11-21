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
    class="flex h-full flex-col items-center justify-end gap-8 px-4 pb-[6dvh] portrait:justify-center portrait:pb-0 portrait:pt-[12dvh] sm:pb-[12dvh] sm:portrait:pb-0"
  >
    <LandingHeroBackdrop />

    <h1 id="hero-title" class="sr-only">Marvel: Road to Doomsday, countdown to {{ targetTitle }}</h1>

    <!-- Portrait (phones): our own countdown over the poster. Landscape: the video is the countdown. -->
    <div class="enter w-full max-w-sm landscape:hidden" style="--enter-delay: 120ms">
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
