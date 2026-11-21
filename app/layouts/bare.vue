<script setup lang="ts">
// Chrome-free no-scroll shell for the landing: the viewport is the page.
</script>

<template>
  <div class="relative isolate h-dvh overflow-hidden">
    <main id="main" class="h-full">
      <slot />
    </main>
  </div>
</template>
