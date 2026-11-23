
<script setup lang="ts">
import { Check, Film, Sparkles, Tv, X } from 'lucide-vue-next'
import { roadmap } from '../../utils/roadmap-data.ts'
import type { MapNode } from '../../utils/roadmap-map.ts'

// Compact preview of the selected node. Editorial text only; the full detail page is Phase 06.
const props = defineProps<{ node: MapNode; watched: boolean; current: boolean }>()
defineEmits<{ close: []; toggleWatched: [] }>()

const typeIcon = { movie: Film, series: Tv, special: Sparkles } as const
const typeLabel = { movie: 'Movie', series: 'Series', special: 'Special' } as const

const item = computed(() => props.node.item)
const connectionNote = computed(() => roadmap.collection.connection_status_definitions[item.value.connection_status])
const heading = ref<HTMLElement | null>(null)

// Move focus into the preview when it opens so keyboard and screen-reader users land on it.
watch(
  () => props.node.id,
  async () => {
    await nextTick()
    heading.value?.focus({ preventScroll: true })
  },
  { immediate: true },
)
</script>

<template>
  <section
    role="dialog"
    aria-modal="false"
    :aria-label="`${item.title}, preview`"
    class="flex max-h-full flex-col overflow-hidden rounded-t-media border border-line-strong bg-surface-raised md:rounded-media"
  >
    <header class="flex items-start justify-between gap-3 border-b border-line p-4">
      <div class="min-w-0">
        <p class="flex items-center gap-1.5 text-meta uppercase tracking-wider text-ink-muted">
          <component :is="typeIcon[item.type]" :size="14" aria-hidden="true" />
          {{ typeLabel[item.type] }} · {{ item.release_year }}
          <template v-if="node.kind === 'main'"> · Watch order {{ node.item.watch_order }}</template>
        </p>
        <h2 ref="heading" tabindex="-1" class="mt-1 font-display text-heading font-bold leading-none outline-none">
          {{ item.title }}
        </h2>
      </div>
      <button
        type="button"
        class="-mr-2 -mt-2 inline-flex size-11 shrink-0 items-center justify-center rounded-control text-ink-muted transition-colors duration-150 hover:bg-surface-soft hover:text-ink"
        aria-label="Close preview"
        @click="$emit('close')"
      >
        <X :size="20" aria-hidden="true" />
      </button>
    </header>

    <div class="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
      <div class="flex flex-wrap gap-2">
        <UiBadge :tone="item.priority" />
        <UiBadge :tone="watched ? 'completed' : 'not-started'" />
        <UiBadge v-if="current" tone="current" />
        <span
          v-if="node.kind === 'supplemental'"
          class="inline-flex items-center rounded-control border border-gold-soft/60 px-2 py-0.5 text-meta font-semibold uppercase tracking-wider text-gold-soft"
        >
          Supplemental
        </span>
      </div>

      <dl class="space-y-4 text-body">
        <div>
          <dt class="text-meta font-semibold uppercase tracking-wider text-ink-subtle">Doomsday relevance</dt>
          <dd class="text-ink">
            <template v-if="node.kind === 'main'">{{ node.item.is_doomsday_relevant ? 'Relevant to Doomsday' : 'Not marked as Doomsday-relevant' }}</template>
            <template v-else>Not classified: supplemental titles have no relevance flag or watch order.</template>
          </dd>
        </div>
        <div>
          <dt class="text-meta font-semibold uppercase tracking-wider text-ink-subtle">Why it matters</dt>
          <dd class="text-ink-muted">{{ item.importance_statement }}</dd>
        </div>
        <div>
          <dt class="text-meta font-semibold uppercase tracking-wider text-ink-subtle">Doomsday connection</dt>
          <dd class="text-ink-muted">{{ item.doomsday_connection }}</dd>
          <dd class="mt-1 text-meta text-ink-subtle">
            <span class="font-semibold capitalize">{{ item.connection_status }}:</span> {{ connectionNote }}
          </dd>
        </div>
      </dl>
    </div>

    <footer class="space-y-2 border-t border-line p-4">
      <UiButton class="w-full" :variant="watched ? 'secondary' : 'primary'" @click="$emit('toggleWatched')">
        <Check :size="18" aria-hidden="true" />
        {{ watched ? 'Mark as not watched' : 'Mark as watched' }}
      </UiButton>
      <UiButton class="w-full" variant="ghost" disabled>Full details · later phase</UiButton>
          </footer>
  </section>
</template>
