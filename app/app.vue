<script setup lang="ts">
// A black curtain that can stay up across a page change, so a hand-over between two full-screen scenes (the Loki gate
// on the landing and the intro on the map) never shows the page underneath. Whoever raises it lowers it; a safety
// timer lowers it anyway after 8 s.
const curtain = useState('curtain', () => false)
let safety: ReturnType<typeof setTimeout> | undefined
watch(curtain, (up) => {
  clearTimeout(safety)
  if (up) safety = setTimeout(() => (curtain.value = false), 8000)
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <Transition leave-active-class="transition-opacity duration-700 ease-out" leave-to-class="opacity-0">
    <div v-if="curtain" class="fixed inset-0 z-[70] bg-black" aria-hidden="true" />
  </Transition>
</template>
