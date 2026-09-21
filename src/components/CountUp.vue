<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

/** Число, которое досчитывает до значения, когда появляется на экране */
const props = withDefaults(defineProps<{ value: number; duration?: number }>(), { duration: 1400 })

const el = ref<HTMLElement | null>(null)
const shown = ref(0)
let observer: IntersectionObserver | null = null
let frame = 0

function run() {
  const start = performance.now()
  const tick = (now: number) => {
    const p = Math.min(1, (now - start) / props.duration)
    shown.value = Math.round(props.value * (1 - Math.pow(1 - p, 3)))
    if (p < 1) frame = requestAnimationFrame(tick)
  }
  frame = requestAnimationFrame(tick)
}

onMounted(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    shown.value = props.value
    return
  }
  observer = new IntersectionObserver(([entry]) => {
    if (!entry?.isIntersecting) return
    observer?.disconnect()
    run()
  })
  if (el.value) observer.observe(el.value)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  cancelAnimationFrame(frame)
})
</script>

<template>
  <span ref="el">{{ shown }}</span>
</template>
