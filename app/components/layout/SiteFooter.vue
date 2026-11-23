<script setup lang="ts">
import { Heart } from 'lucide-vue-next'
</script>

<template>
  <footer class="relative z-10 border-t border-line/60 bg-void/70 py-1.5 md:py-3">
    <LayoutPageContainer>
      <p class="text-center text-[0.6875rem] text-ink-subtle md:text-meta md:text-ink-muted">
        <span class="md:hidden">Fan project. Not affiliated with Marvel or Disney.</span>
        <span class="max-md:hidden">An independent fan project. Not affiliated with or endorsed by Marvel, Disney or their subsidiaries.</span>
        <span class="mx-2 max-md:hidden" aria-hidden="true">·</span>
        <br class="md:hidden">
        <span class="inline-flex items-center gap-1 whitespace-nowrap">
          Built with <Heart :size="12" class="fill-current text-danger" aria-label="love" /> by
          <a href="https://linkspaces.me/karthikskailas" target="_blank" rel="noopener noreferrer" class="font-semibold text-ink underline underline-offset-2 transition-colors duration-150 hover:text-gold-soft">Karthik</a>
          for Marvel fans
        </span>
      </p>
    </LayoutPageContainer>
  </footer>
</template>
