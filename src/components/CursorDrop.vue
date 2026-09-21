<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useMercury } from '@/composables/useMercury'

/**
 * Курсор: точная точка + капля металла из движка, которая тянется следом.
 * Над ссылками и кнопками капля растёт и притягивается к их центру.
 * Внутри [data-cursor="plain"] (меню) капля маленькая и не притягивается.
 * Только для мыши и при работающем WebGL.
 */
const { engine } = useMercury()
const dot = ref<HTMLElement | null>(null)
const hovering = ref(false)
const fine = window.matchMedia('(pointer: fine)').matches

const INTERACTIVE = 'a, button, [data-cursor]'
const RADIUS = { base: 14, hover: 30, plain: 7 }
let frame = 0
let x = -100
let y = -100

function render() {
  frame = 0
  if (dot.value) dot.value.style.transform = `translate3d(${x}px, ${y}px, 0)`
}

function onMove(e: PointerEvent) {
  if (e.pointerType !== 'mouse') return
  x = e.clientX
  y = e.clientY
  if (!frame) frame = requestAnimationFrame(render)
}

function onOver(e: PointerEvent) {
  const el = e.target as Element | null
  const target = el?.closest<HTMLElement>(INTERACTIVE) ?? null
  const plain = !!el?.closest('[data-cursor="plain"]')
  hovering.value = !!target
  const m = engine.value
  if (!m) return
  if (plain) {
    m.setPointerRadius(RADIUS.plain, RADIUS.plain)
    m.setPointerMagnet(null)
  } else {
    m.setPointerRadius(RADIUS.base, RADIUS.hover)
    m.setPointerMagnet(target, 0.4)
  }
}

function enable(on: boolean) {
  document.documentElement.classList.toggle('has-cursor', on)
  engine.value?.setPointerRadius(on ? RADIUS.base : 0, RADIUS.hover)
}

watch(engine, (m) => enable(fine && !!m), { immediate: true })

onMounted(() => {
  if (!fine) return
  window.addEventListener('pointermove', onMove, { passive: true })
  window.addEventListener('pointerover', onOver, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('pointermove', onMove)
  window.removeEventListener('pointerover', onOver)
  cancelAnimationFrame(frame)
  enable(false)
})
</script>

<template>
  <!-- позиция и масштаб на разных элементах: иначе scale уменьшает и координаты -->
  <div v-if="fine" ref="dot" class="cursor" aria-hidden="true">
    <span class="cursor__dot" :class="{ 'is-hover': hovering }" />
  </div>
</template>

<style scoped>
.cursor {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 100;
  pointer-events: none;
}

.cursor__dot {
  position: absolute;
  top: -3px;
  left: -3px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 0 1.5px rgb(0 0 0 / 0.5);
  transition: transform 0.3s var(--ease-out);
}

.cursor__dot.is-hover {
  transform: scale(0.6);
}

:global(html:not(.has-cursor)) .cursor {
  display: none;
}
</style>
