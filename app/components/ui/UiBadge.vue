<script setup lang="ts">
import { computed } from 'vue'
import { Bookmark, Check, CircleAlert, Clock, Crosshair, Star, Circle } from 'lucide-vue-next'

/** Status and priority labels. Every tone pairs a text label and an icon, never colour alone. */
export type BadgeTone =
  | 'essential'
  | 'recommended'
  | 'optional'
  | 'current'
  | 'watching'
  | 'completed'
  | 'not-started'
  | 'error'

const props = defineProps<{ tone: BadgeTone }>()

const config = {
  essential: { label: 'Essential', icon: Star, classes: 'border-doom-green bg-doom-green text-ink' },
  recommended: { label: 'Recommended', icon: Bookmark, classes: 'border-line-strong text-ink-muted' },
  optional: { label: 'Optional', icon: Circle, classes: 'border-dashed border-line-strong text-ink-subtle' },
  current: { label: 'You are here', icon: Crosshair, classes: 'border-relic-gold text-gold-soft' },
  watching: { label: 'In progress', icon: Clock, classes: 'border-doom-green-bright text-doom-green-bright' },
  completed: { label: 'Completed', icon: Check, classes: 'border-success text-success' },
  'not-started': { label: 'Not started', icon: Circle, classes: 'border-line-strong text-ink-muted' },
  error: { label: 'Error', icon: CircleAlert, classes: 'border-danger text-danger-text' },
} as const

const current = computed(() => config[props.tone])
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 rounded-control border px-2 py-0.5 text-meta font-semibold uppercase tracking-wider"
    :class="current.classes"
  >
    <component :is="current.icon" :size="14" aria-hidden="true" />
    {{ current.label }}
  </span>
</template>
