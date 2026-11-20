<template>
  <div class="flex min-h-dvh flex-col">
    <a
      href="#main"
      class="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-surface-raised focus:px-4 focus:py-2"
    >
      Skip to content
    </a>
    <main id="main" class="flex-1">
      <slot />
    </main>
  </div>
</template>
