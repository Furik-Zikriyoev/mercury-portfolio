<script setup lang="ts">
import { defineAsyncComponent, onBeforeUnmount, onMounted } from 'vue'
import { RouterView } from 'vue-router'
import CapsuleNav from '@/components/CapsuleNav.vue'
import CursorDrop from '@/components/CursorDrop.vue'
import MercuryCanvas from '@/components/MercuryCanvas.vue'
import TerminalPanel from '@/components/TerminalPanel.vue'
import { installEasterEggs, removeEasterEggs } from '@/composables/useEasterEggs'
import { destroySmoothScroll, initSmoothScroll } from '@/composables/useSmoothScroll'

const EngineLab = defineAsyncComponent(() => import('@/lab/EngineLab.vue'))
const isLab = new URLSearchParams(window.location.search).has('lab')

onMounted(() => {
  if (isLab) return
  installEasterEggs()
  initSmoothScroll()
})

onBeforeUnmount(() => {
  removeEasterEggs()
  destroySmoothScroll()
})
</script>

<template>
  <MercuryCanvas />
  <CursorDrop />

  <EngineLab v-if="isLab" />

  <template v-else>
    <CapsuleNav />
    <TerminalPanel />
    <RouterView />
  </template>
</template>
