<script setup lang="ts">
definePageMeta({ layout: 'map' })
useSeoMeta({
  title: 'Whole Universe — Marvel: Road to Doomsday',
  description: 'The Doomsday roadmap plus supplemental Fox X-Men titles. An independent fan project.',
})
</script>

<template>
  <JourneyRoadmapExplorer title="Whole Universe" :include-supplemental="true" />
</template>
