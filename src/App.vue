<script setup lang="ts">
import { defineAsyncComponent, nextTick, onBeforeUnmount, onMounted } from 'vue'
import CapsuleNav from '@/components/CapsuleNav.vue'
import CursorDrop from '@/components/CursorDrop.vue'
import MercuryCanvas from '@/components/MercuryCanvas.vue'
import TerminalPanel from '@/components/TerminalPanel.vue'
import AboutSection from '@/components/sections/AboutSection.vue'
import ExperienceSection from '@/components/sections/ExperienceSection.vue'
import HeroSection from '@/components/sections/HeroSection.vue'
import ManifestoSection from '@/components/sections/ManifestoSection.vue'
import SandboxSection from '@/components/sections/SandboxSection.vue'
import SpecsSection from '@/components/sections/SpecsSection.vue'
import ContactSection from '@/components/sections/ContactSection.vue'
import WorkSection from '@/components/sections/WorkSection.vue'
import { installEasterEggs, removeEasterEggs } from '@/composables/useEasterEggs'
import { useIntro } from '@/composables/useIntro'
import { initSections, killSections } from '@/composables/useSections'
import { destroySmoothScroll, initSmoothScroll, lockScroll } from '@/composables/useSmoothScroll'

const EngineLab = defineAsyncComponent(() => import('@/lab/EngineLab.vue'))
const isLab = new URLSearchParams(window.location.search).has('lab')

const { running } = useIntro()

onMounted(async () => {
  if (isLab) return
  installEasterEggs()
  initSmoothScroll()
  if (running.value) lockScroll(true)
  await nextTick()
  initSections()
})

onBeforeUnmount(() => {
  removeEasterEggs()
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
    <TerminalPanel />
    <main>
      <HeroSection />
      <SandboxSection />
      <ManifestoSection />
      <AboutSection />
      <ExperienceSection />
      <SpecsSection />
      <WorkSection />
      <ContactSection />
    </main>
  </template>
</template>
