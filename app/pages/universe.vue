<script setup lang="ts">
definePageMeta({ layout: 'map' })
useSeoMeta({
  title: 'Every Marvel Title Before Avengers: Doomsday — Whole Universe',
  description: 'The Doomsday roadmap plus supplemental Fox X-Men titles. An independent fan project.',
})
</script>

<template>
  <JourneyRoadmapExplorer title="Whole Universe" :include-supplemental="true" />
</template>
