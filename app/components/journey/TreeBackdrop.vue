<script setup lang="ts">
import tree from '../../assets/images/yggdrasil-tree.webp'
import { TREE } from '../../utils/roadmap-map.ts'

// Temporary still backdrop (owner-supplied reference image) until the Yggdrasil video replaces it.
// Decorative; node position comes from the layout alone.
const style = {
  left: `${-TREE.imgW / 2}px`,
  top: '0px',
  width: `${TREE.imgW}px`,
  height: `${TREE.imgH}px`,
  maskImage: 'radial-gradient(closest-side, #000 70%, transparent 100%)',
}
</script>

<template>
  <img :src="tree" alt="" class="pointer-events-none absolute max-w-none select-none object-cover opacity-80" :style="style" draggable="false">
</template>
