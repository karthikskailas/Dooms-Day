
<script setup lang="ts">
import { Check, Film, Sparkles, Tv, Zap } from 'lucide-vue-next'
import { ORB, type MapNode } from '../../utils/roadmap-map.ts'

// One title on the map. A real button, so it is focusable and announced; the canvas manages which node is tabbable.
const props = defineProps<{
  node: MapNode
  watched: boolean
  /** null, or the marker text ("You are here" / "Start here"). */
  marker: string | null
  selected: boolean
  /** Does not match the search or filters. Still visible and clickable, just quieter. */
  dimmed: boolean
  tabbable: boolean
  /** The title to watch after the current one. */
  next?: boolean
}>()
defineEmits<{ select: [id: string] }>()

const typeIcon = { movie: Film, series: Tv, special: Sparkles } as const
const typeLabel = { movie: 'Movie', series: 'Series', special: 'Special' } as const
const priorityLabel = { essential: 'Essential', recommended: 'Recommended', optional: 'Optional' } as const

const item = computed(() => props.node.item)
const doomsday = computed(() => props.node.kind === 'main' && props.node.item.is_doomsday_relevant)

const label = computed(() => {
  const i = item.value
  const parts = [i.title, String(i.release_year), typeLabel[i.type], `${priorityLabel[i.priority]} priority`]
  if (props.node.kind === 'main') {
    parts.push(`step ${props.node.order}`)
    parts.push(doomsday.value ? 'Doomsday relevant' : 'not marked Doomsday relevant')
  } else {
    parts.push('supplemental title, no watch order')
  }
  parts.push(props.watched ? 'completed' : 'not started')
  if (props.marker) parts.push(props.marker)
  else if (props.next) parts.push('next to watch')
  return parts.join(', ')
})

// Priority sets the ring; status sets the fill; the marker and selection set outer rings. Each channel stays separate.
const ringClass = computed(
  () =>
    ({
      essential: 'border-[3px] border-doom-green-bright shadow-[0_0_18px_var(--color-doom-green)]',
      recommended: 'border-2 border-[#9fb0ff]',
      optional: 'border-2 border-dashed border-ink-subtle',
    })[item.value.priority],
)
</script>

<template>
  <div class="absolute" :style="{ left: `${node.x}px`, top: `${node.y}px`, width: `${node.w}px`, height: `${node.h}px` }">
    <span
      v-if="marker"
      class="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-control bg-relic-gold px-2 py-0.5 text-meta font-bold uppercase tracking-wider text-void"
    >
      {{ marker }}
    </span>
    <span
      v-else-if="next"
      class="pointer-events-none absolute -top-7 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-control border border-relic-gold bg-void/90 px-2 py-0.5 text-meta font-bold uppercase tracking-wider text-gold-soft"
    >
      Next
    </span>
    <button
      type="button"
      :data-node-id="node.id"
      :tabindex="tabbable ? 0 : -1"
      :aria-label="label"
      :aria-pressed="selected"
      class="absolute left-1/2 top-0 flex -translate-x-1/2 items-center justify-center rounded-full font-display text-2xl font-bold text-ink transition-[opacity,background-color] duration-150"
      :style="{ width: `${ORB}px`, height: `${ORB}px` }"
      :class="[
        ringClass,
        watched ? 'bg-doom-green' : 'bg-void/85',
        marker ? 'outline-[3px] outline-offset-4 outline-relic-gold' : '',
        selected ? 'ring-2 ring-ink ring-offset-4 ring-offset-void' : '',
        dimmed && !selected ? 'opacity-25' : '',
      ]"
      @click="$emit('select', node.id)"
    >
      <Check v-if="watched" :size="28" aria-hidden="true" />
      <span v-else-if="node.kind === 'main'" aria-hidden="true">{{ node.order }}</span>
      <component :is="typeIcon[item.type]" v-else :size="26" aria-hidden="true" />
      <Zap
        v-if="doomsday"
        :size="16"
        class="absolute -right-1 -top-1 rounded-full bg-void p-0.5 text-doom-green-bright"
        aria-hidden="true"
      />
    </button>

    <!-- The label is decoration for sighted users; the button above carries the full accessible name. -->
    <div
      class="pointer-events-none absolute inset-x-0 top-[72px] text-center group-data-[compact]/map:hidden"
      :class="dimmed && !selected ? 'opacity-25' : ''"
      aria-hidden="true"
    >
      <p class="line-clamp-2 text-[0.8125rem] font-semibold leading-tight text-ink [text-shadow:0_1px_6px_var(--color-void)]">{{ item.title }}</p>
      <p class="mt-0.5 flex items-center justify-center gap-1 text-meta text-ink-muted [text-shadow:0_1px_6px_var(--color-void)]">
        <component :is="typeIcon[item.type]" :size="12" />{{ item.release_year }}
        <span v-if="node.kind === 'supplemental'" class="text-gold-soft">· Supplemental</span>
      </p>
    </div>
  </div>
</template>
