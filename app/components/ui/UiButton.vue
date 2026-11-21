<script setup lang="ts">
import { computed } from 'vue'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'
type ButtonSize = 'md' | 'lg'

const props = withDefaults(
  defineProps<{
    variant?: ButtonVariant
    /** `lg` is for hero-level actions. */
    size?: ButtonSize
    /** When set, renders a router link instead of a button. */
    to?: string
    type?: 'button' | 'submit' | 'reset'
    disabled?: boolean
  }>(),
  { variant: 'primary', size: 'md', to: undefined, type: 'button', disabled: false },
)

const base =
  'inline-flex items-center justify-center gap-2 rounded-control text-control font-semibold uppercase tracking-[0.06em] transition-[transform,background-color,border-color,color] duration-150 ease-out active:translate-y-px'

const sizes: Record<ButtonSize, string> = {
  md: 'min-h-11 px-5 py-2.5',
  lg: 'min-h-12 px-7 py-3 text-[0.9375rem]',
}

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-doom-green text-ink hover:bg-doom-green-bright hover:text-void',
  secondary: 'border border-line-strong bg-surface-raised text-ink hover:border-relic-gold hover:bg-surface-soft',
  ghost: 'text-ink-muted hover:bg-surface-soft hover:text-ink',
}

const disabledClasses = 'cursor-not-allowed bg-surface-soft text-ink-muted border border-line-strong hover:bg-surface-soft hover:text-ink-muted'

const classes = computed(() => [base, sizes[props.size], props.disabled ? disabledClasses : variants[props.variant]])
</script>

<template>
  <NuxtLink v-if="to" :to="to" :class="classes">
    <slot />
  </NuxtLink>
  <button v-else :type="type" :disabled="disabled" :class="classes">
    <slot />
  </button>
</template>
