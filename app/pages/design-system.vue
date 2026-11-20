<script setup lang="ts">
// Style guide for the Sanctum foundation. Not a product page; excluded from search indexes.
useSeoMeta({
  title: 'Design system — Marvel: Road to Doomsday',
  description: 'Internal style guide for the Sanctum design foundation.',
  robots: 'noindex, nofollow',
})

const swatches = [
  { name: 'void', hex: '#0B0E0C', role: 'Page background', cls: 'bg-void' },
  { name: 'surface', hex: '#131916', role: 'Primary panels', cls: 'bg-surface' },
  { name: 'surface-raised', hex: '#1B231E', role: 'Detail panels, menus', cls: 'bg-surface-raised' },
  { name: 'surface-soft', hex: '#242D27', role: 'Hover and selected neutral', cls: 'bg-surface-soft' },
  { name: 'ink', hex: '#F2F0E8', role: 'Primary text', cls: 'bg-ink' },
  { name: 'ink-muted', hex: '#B7BDB5', role: 'Secondary text', cls: 'bg-ink-muted' },
  { name: 'ink-subtle', hex: '#858E86', role: 'Metadata (not on surface-soft)', cls: 'bg-ink-subtle' },
  { name: 'line', hex: '#354039', role: 'Decorative dividers only', cls: 'bg-line' },
  { name: 'line-strong', hex: '#667369', role: 'Control boundaries (≥3:1)', cls: 'bg-line-strong' },
  { name: 'doom-green', hex: '#456B50', role: 'Primary action fill, identity', cls: 'bg-doom-green' },
  { name: 'doom-green-bright', hex: '#78966D', role: 'Hover, watching, map path', cls: 'bg-doom-green-bright' },
  { name: 'relic-gold', hex: '#C6A15B', role: 'Current position, focus ring', cls: 'bg-relic-gold' },
  { name: 'gold-soft', hex: '#E0C98E', role: 'Achievement text', cls: 'bg-gold-soft' },
  { name: 'success', hex: '#83A98A', role: 'Completed', cls: 'bg-success' },
  { name: 'danger', hex: '#C66B61', role: 'Icons, fills (errors)', cls: 'bg-danger' },
  { name: 'danger-text', hex: '#D98278', role: 'Error text on dark surfaces', cls: 'bg-danger-text' },
]

const contrast = [
  ['Primary text (ink)', 'void, surface, raised', '17.0 / 15.6 / 14.1', 'AAA'],
  ['Secondary text (ink-muted)', 'void, surface, raised', '10.1 / 9.3 / 8.4', 'AAA'],
  ['Metadata (ink-subtle)', 'void, surface, raised', '5.7 / 5.3 / 4.8', 'AA'],
  ['Primary button text', 'ink on doom-green', '5.3', 'AA'],
  ['Hover button text', 'void on doom-green-bright', '5.9', 'AA'],
  ['Current position (gold-soft)', 'raised', '9.9', 'AAA'],
  ['Error text (danger-text)', 'void, surface, raised, soft', '6.3 / 5.8 / 5.3 / 5.0', 'AA'],
  ['Control boundary (line-strong)', 'void, surface, raised', '3.5 / 3.2 / 2.9', 'non-text ≥3:1 on void/surface'],
]
</script>

<template>
  <div class="mx-auto flex w-full max-w-(--container-content) flex-col gap-16 px-4 py-12 md:px-10 md:py-16">
    <header class="flex flex-col gap-3">
      <p class="text-meta font-semibold uppercase tracking-wider text-ink-subtle">Internal · Sanctum foundation</p>
      <h1 class="font-display text-page font-bold uppercase text-ink">Design system</h1>
      <p class="max-w-prose text-body text-ink-muted">
        Tokens, type and primitives for the Doom-forward direction. Source of truth:
        <span class="font-semibold text-ink">docs/DESIGN.md</span>. This page is for review only.
      </p>
    </header>

    <section aria-labelledby="colour" class="flex flex-col gap-6">
      <h2 id="colour" class="font-display text-heading font-semibold uppercase text-ink">Colour</h2>
      <ul class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <li v-for="s in swatches" :key="s.name" class="flex flex-col overflow-hidden rounded-panel border border-line bg-surface">
          <span :class="s.cls" class="block h-16 w-full" aria-hidden="true" />
          <span class="flex flex-col gap-0.5 p-3">
            <span class="text-control font-semibold text-ink">{{ s.name }}</span>
            <span class="text-meta text-ink-subtle">{{ s.hex }}</span>
            <span class="text-meta text-ink-muted">{{ s.role }}</span>
          </span>
        </li>
      </ul>
    </section>

    <section aria-labelledby="contrast" class="flex flex-col gap-6">
      <h2 id="contrast" class="font-display text-heading font-semibold uppercase text-ink">Contrast (WCAG 2.2)</h2>
      <div class="overflow-x-auto rounded-panel border border-line">
        <table class="w-full text-left text-meta">
          <thead class="bg-surface-raised text-ink-muted">
            <tr>
              <th scope="col" class="px-4 py-3 font-semibold">Pairing</th>
              <th scope="col" class="px-4 py-3 font-semibold">Surfaces</th>
              <th scope="col" class="px-4 py-3 font-semibold">Ratio</th>
              <th scope="col" class="px-4 py-3 font-semibold">Result</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-line">
            <tr v-for="row in contrast" :key="row[0]">
              <th scope="row" class="px-4 py-3 font-medium text-ink">{{ row[0] }}</th>
              <td class="px-4 py-3 text-ink-muted">{{ row[1] }}</td>
              <td class="px-4 py-3 text-ink-muted tabular-nums">{{ row[2] }}</td>
              <td class="px-4 py-3 text-ink">{{ row[3] }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section aria-labelledby="type" class="flex flex-col gap-6">
      <h2 id="type" class="font-display text-heading font-semibold uppercase text-ink">Typography</h2>
      <div class="flex flex-col gap-6 border-t border-line pt-6">
        <p class="font-display text-hero font-bold uppercase text-ink">Road to Doomsday</p>
        <p class="text-meta text-ink-subtle">Hero · Barlow Condensed 700 · fluid 42–88px</p>
        <p class="font-display text-page font-semibold uppercase text-ink">Page title</p>
        <p class="text-meta text-ink-subtle">Page · Barlow Condensed 600 · fluid 34–60px</p>
        <p class="font-display text-heading font-semibold text-ink">Section heading</p>
        <p class="text-meta text-ink-subtle">Heading · Barlow Condensed 600 · fluid 22–32px</p>
        <p class="max-w-prose text-body text-ink-muted">
          Body copy in DM Sans at a comfortable measure. The Doomsday countdown uses tabular numerals:
          <span class="font-semibold text-ink tabular-nums">12 : 04 : 37</span>.
        </p>
        <p class="text-meta text-ink-subtle">Body · DM Sans · 15–18px, line height 1.6 · Meta · 13px min 12px</p>
      </div>
    </section>

    <section aria-labelledby="controls" class="flex flex-col gap-6">
      <h2 id="controls" class="font-display text-heading font-semibold uppercase text-ink">Buttons</h2>
      <div class="flex flex-wrap items-center gap-4 border-t border-line pt-6">
        <UiButton>Doomsday journey</UiButton>
        <UiButton variant="secondary">Whole universe</UiButton>
        <UiButton variant="ghost">Cancel</UiButton>
        <UiButton disabled>Unavailable</UiButton>
        <UiButton to="/">Link button</UiButton>
      </div>
      <p class="text-meta text-ink-subtle">
        Every state uses a text label. Focus shows a 2px relic-gold outline. Targets are at least 44px tall.
      </p>
    </section>

    <section aria-labelledby="status" class="flex flex-col gap-6">
      <h2 id="status" class="font-display text-heading font-semibold uppercase text-ink">Status and priority</h2>
      <div class="flex flex-wrap gap-3 border-t border-line pt-6">
        <UiBadge tone="essential" />
        <UiBadge tone="recommended" />
        <UiBadge tone="optional" />
        <UiBadge tone="current" />
        <UiBadge tone="watching" />
        <UiBadge tone="completed" />
        <UiBadge tone="not-started" />
        <UiBadge tone="error" />
      </div>
    </section>

    <section aria-labelledby="motion" class="flex flex-col gap-6">
      <h2 id="motion" class="font-display text-heading font-semibold uppercase text-ink">Motion</h2>
      <p class="max-w-prose border-t border-line pt-6 text-body text-ink-muted">
        Motion explains state: map movement, node selection, panel entry, achievement unlock. Nothing autoplays.
        <span class="font-semibold text-ink">prefers-reduced-motion: reduce</span> shortens all transitions to effectively instant.
      </p>
    </section>
  </div>
</template>
