<script setup lang="ts">
import { pad2 } from '../../utils/countdown.ts'

const props = defineProps<{
  /** YYYY-MM-DD, from the roadmap collection metadata. */
  targetDate: string
  targetTitle: string
}>()

const { state } = useCountdown(() => props.targetDate)

// While pending (server render and first paint) the cells show a placeholder of the same size, so nothing shifts.
const units = computed(() => {
  const parts = state.value.status === 'running' ? state.value.parts : null
  return [
    { key: 'days', label: 'Days', value: parts ? pad2(parts.days) : '--' },
    { key: 'hours', label: 'Hours', value: parts ? pad2(parts.hours) : '--' },
    { key: 'minutes', label: 'Minutes', value: parts ? pad2(parts.minutes) : '--' },
    { key: 'seconds', label: 'Seconds', value: parts ? pad2(parts.seconds) : '--' },
  ] as const
})

const showClock = computed(() => state.value.status === 'running' || state.value.status === 'pending')
</script>

<template>
  <div class="flex flex-col items-center gap-2">
    <p id="countdown-label" class="text-meta font-semibold uppercase tracking-[0.12em] text-ink">
      Doomsday is coming
    </p>

    <!-- role="timer" is not announced as it changes, so a ticking clock never interrupts a screen reader. -->
    <div v-if="showClock" role="timer" aria-labelledby="countdown-label" class="grid w-full grid-cols-4">
      <div v-for="unit in units" :key="unit.key" class="flex flex-col items-center gap-1">
        <span
          class="font-display text-5xl font-semibold leading-none tabular-nums text-ink"
          :aria-hidden="state.status === 'pending' ? 'true' : undefined"
        >
          {{ unit.value }}
        </span>
        <span class="text-meta uppercase tracking-[0.08em] text-ink-muted">{{ unit.label }}</span>
      </div>
    </div>

    <!-- Reached or unusable date: no clock, and nothing invented in its place. -->
    <p v-else-if="state.status === 'ended'" class="text-body text-ink">The countdown has ended.</p>
    <p v-else class="text-body text-ink-muted">Release date unavailable.</p>
  </div>
</template>
