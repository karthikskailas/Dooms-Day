
<script setup lang="ts">
import { hasActiveFilters, type MapFilters } from '../../utils/roadmap-map.ts'

// Type, priority and progress filters. The search box lives in the toolbar.
const filters = defineModel<MapFilters>({ required: true })
defineEmits<{ clear: [] }>()

const groups = [
  {
    key: 'type',
    label: 'Type',
    options: [['all', 'All'], ['movie', 'Movies'], ['series', 'Series'], ['special', 'Specials']],
  },
  {
    key: 'priority',
    label: 'Priority',
    options: [['all', 'All'], ['essential', 'Essential'], ['recommended', 'Recommended'], ['optional', 'Optional']],
  },
  {
    key: 'status',
    label: 'Progress',
    options: [['all', 'All'], ['not_started', 'Not started'], ['completed', 'Completed']],
  },
] as const

function pick(key: 'type' | 'priority' | 'status', value: string) {
  filters.value = { ...filters.value, [key]: value }
}
</script>

<template>
  <div class="space-y-3 rounded-panel border border-line-strong bg-surface-raised p-3">
    <fieldset v-for="g in groups" :key="g.key" class="flex flex-wrap items-center gap-2">
      <legend class="sr-only">{{ g.label }}</legend>
      <span class="w-16 text-meta font-semibold uppercase tracking-wider text-ink-subtle" aria-hidden="true">{{ g.label }}</span>
      <button
        v-for="[value, text] in g.options"
        :key="value"
        type="button"
        :aria-pressed="filters[g.key] === value"
        class="min-h-11 rounded-control border px-3 text-control font-semibold transition-colors duration-150"
        :class="
          filters[g.key] === value
            ? 'border-doom-green-bright bg-doom-green text-ink'
            : 'border-line-strong text-ink-muted hover:border-relic-gold hover:text-ink'
        "
        @click="pick(g.key, value)"
      >
        {{ text }}
      </button>
    </fieldset>
    <div class="flex items-center justify-between gap-3 border-t border-line pt-3">
      <p class="text-meta text-ink-subtle">
        Lines join consecutive watch-order titles. Position on the map has no story meaning.
      </p>
      <UiButton variant="ghost" :disabled="!hasActiveFilters(filters)" @click="$emit('clear')">Clear filters</UiButton>
    </div>
  </div>
</template>
