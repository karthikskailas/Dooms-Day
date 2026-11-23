<script setup lang="ts">
definePageMeta({ layout: 'map' })
useSeoMeta({
  title: 'Doomsday Journey — Marvel: Road to Doomsday',
  description: 'The Doomsday-relevant titles, in watch order, on the road to Avengers: Doomsday. An independent fan project.',
})
</script>

<template>
  <JourneyRoadmapExplorer title="Doomsday Journey" :include-supplemental="false" doomsday-only />
</template>
