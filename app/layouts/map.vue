<script setup lang="ts">
// No-scroll shell for the roadmap screens, without the site nav (the map has its own Back and tabs): a map that fills the rest, and the fan-project footer.
</script>

<template>
  <div class="relative isolate flex h-dvh flex-col overflow-hidden">
    <a
      href="#main"
      class="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-surface-raised focus:px-4 focus:py-2"
    >
      Skip to content
    </a>
    <main id="main" class="relative min-h-0 flex-1 overflow-hidden">
      <slot />
    </main>
    <LayoutSiteFooter />
  </div>
</template>
