<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted } from 'vue'
import AboutSection from '@/components/sections/AboutSection.vue'
import ContactSection from '@/components/sections/ContactSection.vue'
import ExperienceSection from '@/components/sections/ExperienceSection.vue'
import HeroSection from '@/components/sections/HeroSection.vue'
import ManifestoSection from '@/components/sections/ManifestoSection.vue'
import SandboxSection from '@/components/sections/SandboxSection.vue'
import SpecsSection from '@/components/sections/SpecsSection.vue'
import WorkSection from '@/components/sections/WorkSection.vue'
import { useIntro } from '@/composables/useIntro'
import { initSections, killSections } from '@/composables/useSections'
import { lockScroll } from '@/composables/useSmoothScroll'

const { running } = useIntro()

onMounted(async () => {
  if (running.value) lockScroll(true)
  await nextTick()
  initSections()
})

onBeforeUnmount(() => killSections())
</script>

<template>
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
