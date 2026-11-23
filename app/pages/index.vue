<script setup lang="ts">
import { collectionMeta } from '../utils/collection.ts'

useSeoMeta({
  title: 'Marvel: Road to Doomsday — What to Watch Before Avengers: Doomsday',
  description: `A fan-made watch roadmap to ${collectionMeta.target_title}: follow the curated Doomsday Journey or explore the wider Marvel universe.`,
  ogTitle: 'Marvel: Road to Doomsday',
  ogDescription: `A fan-made watch roadmap to ${collectionMeta.target_title}.`,
})

definePageMeta({ layout: 'bare' })
</script>

<template>
  <LandingHero />
</template>
