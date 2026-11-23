<script setup lang="ts">
// Shown for any unknown address or server error: one sentence and one way back.
const props = defineProps<{ error: { statusCode: number; statusMessage?: string } }>()
const notFound = computed(() => props.error.statusCode === 404)
useHead({ title: notFound.value ? 'Page not found — Road to Doomsday' : 'Something went wrong — Road to Doomsday' })
</script>

<template>
  <main class="flex h-dvh flex-col items-center justify-center gap-6 bg-void px-6 text-center text-ink">
    <p class="font-display text-[clamp(4rem,18vw,9rem)] font-bold leading-none tracking-[0.04em] text-relic-gold">{{ error.statusCode }}</p>
    <h1 class="font-display text-[clamp(1.5rem,5vw,2.5rem)] font-bold uppercase tracking-[0.06em]">{{ notFound ? 'This branch does not exist' : 'Something went wrong' }}</h1>
    <p class="max-w-md text-body text-ink-muted">{{ notFound ? 'The page you asked for is not on the tree.' : 'Try again in a moment.' }}</p>
    <UiButton size="lg" @click="clearError({ redirect: '/' })">Back to the start</UiButton>
  </main>
</template>
