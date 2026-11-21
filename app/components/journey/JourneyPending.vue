<script setup lang="ts">
import { ChevronLeft } from 'lucide-vue-next'

// A deliberate holding state for destinations that arrive in the next phase. It shows no fake map or content.
defineProps<{ title: string }>()
</script>

<template>
  <LayoutPageContainer>
    <section class="flex min-h-[50svh] flex-col items-start justify-center gap-6 py-16 md:py-24">
      <h1 class="font-display text-page font-bold uppercase text-ink">{{ title }}</h1>
      <p class="max-w-prose text-body text-ink-muted">
        The interactive roadmap for this path is the next part of the project and is not built yet.
      </p>
      <UiButton to="/" variant="secondary">
        <ChevronLeft :size="18" aria-hidden="true" />
        Back to home
      </UiButton>
    </section>
  </LayoutPageContainer>
</template>
