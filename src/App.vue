<script setup lang="ts">
import { defineAsyncComponent, nextTick, onBeforeUnmount, onMounted } from 'vue'
import CapsuleNav from '@/components/CapsuleNav.vue'
import CursorDrop from '@/components/CursorDrop.vue'
import MercuryCanvas from '@/components/MercuryCanvas.vue'
import HeroSection from '@/components/sections/HeroSection.vue'
import SectionStub from '@/components/sections/SectionStub.vue'
import { SECTIONS } from '@/content/sections'
import { useIntro } from '@/composables/useIntro'
import { initSections, killSections } from '@/composables/useSections'
import { destroySmoothScroll, initSmoothScroll, lockScroll } from '@/composables/useSmoothScroll'

const EngineLab = defineAsyncComponent(() => import('@/lab/EngineLab.vue'))
const isLab = new URLSearchParams(window.location.search).has('lab')

const { running } = useIntro()
const stubs = SECTIONS.filter((s) => s.id !== 'hero').map((s) => s.id)

onMounted(async () => {
  if (isLab) return
  initSmoothScroll()
  if (running.value) lockScroll(true)
  await nextTick()
  initSections()
})

onBeforeUnmount(() => {
  killSections()
  destroySmoothScroll()
})
</script>

<template>
  <MercuryCanvas />
  <CursorDrop />

  <EngineLab v-if="isLab" />

  <template v-else>
    <CapsuleNav />
    <main>
      <HeroSection />
      <SectionStub v-for="id in stubs" :id="id" :key="id" />
    </main>
  </template>
</template>
