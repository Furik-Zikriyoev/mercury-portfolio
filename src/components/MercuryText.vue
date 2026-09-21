<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useMercury } from '@/composables/useMercury'

/**
 * Текст, который рисуется жидким металлом.
 * В DOM он остаётся (для доступности и SEO), но становится прозрачным.
 * Без WebGL показывается как обычный текст.
 */
const props = withDefaults(defineProps<{ text: string; tag?: string; auto?: boolean }>(), {
  tag: 'span',
  auto: true,
})

const el = ref<HTMLElement | null>(null)
const liquid = ref(false)
const { engine } = useMercury()
let formed = false

async function form(opts: { from?: 'home' | 'scatter'; duration?: number } = {}): Promise<void> {
  const m = engine.value
  if (!m || !el.value) return
  if (formed) await m.releaseText('collect')
  await nextTick()
  liquid.value = true
  formed = true
  await m.formText(el.value, opts)
}

async function release(mode: 'scatter' | 'collect' = 'scatter'): Promise<void> {
  const m = engine.value
  if (!m || !formed) return
  formed = false
  await m.releaseText(mode)
}

onMounted(() => {
  watch(
    engine,
    (m) => {
      if (m && props.auto && !formed) void form()
      if (!m) liquid.value = false
    },
    { immediate: true },
  )
})

watch(
  () => props.text,
  () => {
    if (formed) void form()
  },
)

onBeforeUnmount(() => {
  if (formed) void engine.value?.releaseText('collect')
})

defineExpose({ form, release })
</script>

<template>
  <component :is="tag" ref="el" class="mercury-text" :class="{ 'is-liquid': liquid }">{{ text }}</component>
</template>

<style scoped>
.mercury-text {
  display: inline-block;
}

.mercury-text.is-liquid {
  color: transparent;
  -webkit-text-fill-color: transparent;
  background: none;
}
</style>
