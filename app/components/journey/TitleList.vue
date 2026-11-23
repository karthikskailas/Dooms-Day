
<script setup lang="ts">
import { Check, Zap } from 'lucide-vue-next'
import type { MapNode } from '../../utils/roadmap-map.ts'

// The list alternative to the map: same titles, same order, same filters, same preview.
const props = defineProps<{
  nodes: readonly MapNode[]
  isWatched: (id: string) => boolean
  currentId: string | null
  markerText: string
  selectedId: string | null
  topInset: number
}>()
defineEmits<{ select: [id: string] }>()

const main = computed(() => props.nodes.filter((n) => n.kind === 'main'))
const supplemental = computed(() => props.nodes.filter((n) => n.kind === 'supplemental'))

const row =
  'flex min-h-16 w-full items-center gap-4 border-b border-line/60 px-3 py-3 text-left transition-colors duration-150 hover:bg-surface-soft md:min-h-14 md:items-start md:gap-3 md:py-2'
</script>

<template>
  <div class="size-full overflow-y-auto bg-void" :style="{ paddingTop: `${topInset}px` }">
    <div class="mx-auto max-w-3xl px-3 pb-32">
      <h2 class="py-2 text-meta font-semibold uppercase tracking-wider text-ink-subtle">Watch order</h2>
      <ol>
        <li v-for="n in main" :key="n.id">
          <button type="button" :aria-pressed="n.id === selectedId" :class="[row, n.id === selectedId ? 'bg-surface-soft' : '']" @click="$emit('select', n.id)">
            <span class="w-8 shrink-0 text-right font-display text-xl font-bold md:self-start md:pt-0.5" :class="n.id === currentId ? 'text-relic-gold' : 'text-ink-muted'">{{ n.kind === 'main' ? n.order : '' }}</span>
            <span class="min-w-0 flex-1">
              <span class="block font-semibold">{{ n.item.title }}</span>
              <span class="block text-meta capitalize text-ink-muted">{{ n.item.type }} · {{ n.item.release_year }}<span class="max-md:hidden"> · {{ n.item.priority }}</span></span>
              <span class="mt-0.5 line-clamp-2 max-md:hidden text-meta normal-case text-ink-subtle">{{ n.item.doomsday_connection }}</span>
              <span class="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 empty:hidden max-md:hidden">
                <span v-if="n.id === currentId" class="rounded-control bg-relic-gold px-2 py-0.5 text-meta font-bold uppercase tracking-wider text-void">{{ markerText }}</span>
                <span v-if="n.kind === 'main' && n.item.is_doomsday_relevant" class="inline-flex items-center gap-1 text-meta text-doom-green-bright"><Zap :size="14" aria-hidden="true" />Doomsday</span>
                <span v-if="isWatched(n.id)" class="inline-flex items-center gap-1 text-meta text-success"><Check :size="14" aria-hidden="true" />Completed</span>
              </span>
            </span>
            <!-- Phones: one quiet mark on the right instead of the chips. -->
            <span v-if="isWatched(n.id)" class="text-success md:hidden" aria-label="Completed"><Check :size="20" /></span>
            <span v-else-if="n.id === currentId" class="text-meta font-bold uppercase tracking-wider text-relic-gold md:hidden">Now</span>
          </button>
        </li>
      </ol>

      <template v-if="supplemental.length">
        <h2 class="pt-6 pb-1 text-meta font-semibold uppercase tracking-wider text-gold-soft">Supplemental · no watch order</h2>
        <ul>
          <li v-for="n in supplemental" :key="n.id">
            <button type="button" :aria-pressed="n.id === selectedId" :class="[row, n.id === selectedId ? 'bg-surface-soft' : '']" @click="$emit('select', n.id)">
              <span class="min-w-0 flex-1">
                <span class="block truncate font-semibold">{{ n.item.title }}</span>
                <span class="block text-meta capitalize text-ink-muted">{{ n.item.type }} · {{ n.item.release_year }} · {{ n.item.priority }}</span>
              </span>
              <span v-if="isWatched(n.id)" class="inline-flex items-center gap-1 text-meta text-success"><Check :size="14" aria-hidden="true" />Completed</span>
            </button>
          </li>
        </ul>
      </template>
    </div>
  </div>
</template>
