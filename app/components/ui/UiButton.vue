<script setup lang="ts">
import { computed } from 'vue'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'

const props = withDefaults(
  defineProps<{
    variant?: ButtonVariant
    /** When set, renders a router link instead of a button. */
    to?: string
    type?: 'button' | 'submit' | 'reset'
    disabled?: boolean
  }>(),
  { variant: 'primary', to: undefined, type: 'button', disabled: false },
)

const base =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-control px-5 py-2.5 text-control font-semibold uppercase tracking-[0.06em] transition-[transform,background-color,border-color,color] duration-150 ease-out active:translate-y-px'

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-doom-green text-ink hover:bg-doom-green-bright hover:text-void',
  secondary: 'border border-line-strong bg-surface-raised text-ink hover:border-relic-gold hover:bg-surface-soft',
  ghost: 'text-ink-muted hover:bg-surface-soft hover:text-ink',
}

const disabledClasses = 'cursor-not-allowed bg-surface-soft text-ink-muted border border-line-strong hover:bg-surface-soft hover:text-ink-muted'

const classes = computed(() => [base, props.disabled ? disabledClasses : variants[props.variant]])
</script>

<template>
  <NuxtLink v-if="to" :to="to" :class="classes">
    <slot />
  </NuxtLink>
  <button v-else :type="type" :disabled="disabled" :class="classes">
    <slot />
  </button>
</template>
