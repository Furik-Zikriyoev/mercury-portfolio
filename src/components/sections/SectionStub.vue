<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '@/content/i18n'
import { SECTIONS, type SectionId } from '@/content/sections'

/** Временная секция: наполняется на этапе 4 */
const props = defineProps<{ id: SectionId }>()
const { t } = useI18n()

const index = computed(() => SECTIONS.findIndex((s) => s.id === props.id))
const surface = computed(() => SECTIONS[index.value]?.surface ?? 'dark')
</script>

<template>
  <section :id="id" class="stub" :data-surface="surface">
    <div class="container">
      <p class="section-index">{{ String(index).padStart(2, '0') }}</p>
      <h2 class="stub__title">{{ t.nav.sections[id] }}</h2>
    </div>
    <div class="stub__drop" data-drop-home data-drop-size="46" data-drop-count="4" aria-hidden="true" />
  </section>
</template>

<style scoped>
.stub {
  position: relative;
  display: flex;
  align-items: center;
  min-height: 100svh;
  border-top: 1px solid var(--line);
}

.stub__title {
  margin-top: 1rem;
  font-size: var(--fs-3xl);
}
</style>

<style scoped>
.stub__drop {
  position: absolute;
  top: 50%;
  right: 14vw;
  width: 1px;
  height: 1px;
}
</style>
