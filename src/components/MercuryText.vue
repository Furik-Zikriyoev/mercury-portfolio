<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useMercury } from '@/composables/useMercury'

/**
 * Текст, который рисуется жидким металлом.
 * В DOM он остаётся (для доступности и SEO), но становится прозрачным.
 * Движок держит один такой текст за раз: когда металл забирает другой MercuryText,
 * этот показывается обычным хромовым текстом, пока снова не вызовут form().
 */
const props = withDefaults(defineProps<{ text: string; tag?: string; auto?: boolean }>(), {
  tag: 'span',
  auto: true,
})

const id = Symbol('mercury-text')
const el = ref<HTMLElement | null>(null)
const liquid = ref(false)
const { engine, textOwner } = useMercury()
let formed = false

async function form(
  opts: { from?: 'home' | 'scatter'; duration?: number } = {},
  force = false,
): Promise<void> {
  const m = engine.value
  if (!m || !el.value) return
  if (formed && textOwner.value === id && !force) return
  const busy = m.hasText
  textOwner.value = id
  formed = true
  if (busy) await m.releaseText('collect')
  await nextTick()
  liquid.value = true
  await m.formText(el.value, opts)
}

async function release(mode: 'scatter' | 'collect' = 'scatter'): Promise<void> {
  const m = engine.value
  if (!m || !formed || textOwner.value !== id) return
  formed = false
  textOwner.value = null
  await m.releaseText(mode)
  liquid.value = false
}

// металл ушёл к другому тексту — показываем обычный текст
watch(textOwner, (owner) => {
  if (owner !== id && formed) {
    formed = false
    liquid.value = false
  }
})

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
    if (formed) void form({}, true)
  },
)

onBeforeUnmount(() => {
  if (formed && textOwner.value === id) {
    textOwner.value = null
    void engine.value?.releaseText('collect')
  }
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
