<script setup lang="ts">
import { Menu, X } from 'lucide-vue-next'
import { navLinks } from '../../utils/navigation.ts'

const route = useRoute()
const open = ref(false)
const toggle = ref<HTMLButtonElement | null>(null)

// The panel closes when navigation happens, so it never stays open over the next page.
watch(() => route.fullPath, () => (open.value = false))

function onEscape() {
  if (!open.value) return
  open.value = false
  toggle.value?.focus()
}

const linkClass =
  'inline-flex min-h-11 items-center border-b-2 border-transparent text-control font-semibold uppercase tracking-[0.06em] text-ink-muted transition-colors duration-150 hover:text-ink aria-[current=page]:border-relic-gold aria-[current=page]:text-ink'
</script>

<template>
  <header class="relative z-30" @keydown.esc="onEscape">
    <LayoutPageContainer>
      <div class="flex h-16 items-center justify-between md:h-20">
        <LayoutBrandWordmark />

        <nav aria-label="Primary" class="hidden items-center gap-8 md:flex">
          <NuxtLink v-for="link in navLinks" :key="link.to" :to="link.to" exact-active-class="" :class="linkClass">
            {{ link.label }}
          </NuxtLink>
        </nav>

        <button
          ref="toggle"
          type="button"
          class="-mr-2 inline-flex size-11 items-center justify-center rounded-control text-ink transition-colors duration-150 hover:bg-surface-soft md:hidden"
          :aria-expanded="open"
          aria-controls="mobile-nav"
          :aria-label="open ? 'Close menu' : 'Open menu'"
          @click="open = !open"
        >
          <X v-if="open" :size="22" aria-hidden="true" />
          <Menu v-else :size="22" aria-hidden="true" />
        </button>
      </div>
    </LayoutPageContainer>

    <!-- Mobile: a disclosure panel under the bar. -->
    <nav
      v-show="open"
      id="mobile-nav"
      aria-label="Primary"
      class="absolute inset-x-0 top-full border-y border-line bg-surface-raised md:hidden"
    >
      <LayoutPageContainer>
        <ul class="flex flex-col py-2">
          <li v-for="link in navLinks" :key="link.to">
            <NuxtLink :to="link.to" exact-active-class="" :class="[linkClass, 'w-full py-1']">
              {{ link.label }}
            </NuxtLink>
          </li>
        </ul>
      </LayoutPageContainer>
    </nav>
  </header>
</template>
