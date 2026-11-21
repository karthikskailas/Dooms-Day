<script setup lang="ts">
// No-scroll shell: the viewport is the page. `main` only scrolls internally for pages that need it.
</script>

<template>
  <div class="relative isolate flex h-dvh flex-col overflow-hidden">
    <a
      href="#main"
      class="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-surface-raised focus:px-4 focus:py-2"
    >
      Skip to content
    </a>
    <LayoutSiteHeader />
    <main id="main" class="min-h-0 flex-1 overflow-y-auto">
      <slot />
    </main>
    <LayoutSiteFooter />
  </div>
</template>
