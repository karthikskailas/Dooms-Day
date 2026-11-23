<script setup lang="ts">
import tree from '../../assets/images/yggdrasil-tree.webp'
import { TREE } from '../../utils/roadmap-map.ts'

// The Yggdrasil artwork. The route lines and orbs are placed over its branches by BRANCHES in roadmap-map.ts, so size and
// position here must match TREE. Decorative.
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
