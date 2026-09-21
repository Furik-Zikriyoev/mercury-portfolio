<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { Mercury } from '@/engine'
import { setMercury } from '@/composables/useMercury'

const canvas = ref<HTMLCanvasElement | null>(null)
let instance: Mercury | null = null

const onPointerMove = (e: PointerEvent) => instance?.setPointer(e.clientX, e.clientY)
const onPointerLeave = () => instance?.releasePointer()
const onTouchEnd = (e: PointerEvent) => {
  if (e.pointerType !== 'mouse') instance?.releasePointer()
}

onMounted(() => {
  if (!canvas.value) return
  instance = Mercury.create(canvas.value, {
    onContextLost: () => {
      document.documentElement.classList.remove('has-mercury')
      setMercury(null, 'unsupported')
    },
  })
  if (!instance) {
    setMercury(null, 'unsupported')
    return
  }
  instance.start()
  document.documentElement.classList.add('has-mercury')
  window.addEventListener('pointermove', onPointerMove, { passive: true })
  window.addEventListener('pointerup', onTouchEnd, { passive: true })
  document.documentElement.addEventListener('pointerleave', onPointerLeave)
  setMercury(instance, 'ready')
})

onBeforeUnmount(() => {
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onTouchEnd)
  document.documentElement.removeEventListener('pointerleave', onPointerLeave)
  document.documentElement.classList.remove('has-mercury')
  instance?.destroy()
  instance = null
  setMercury(null, 'pending')
})
</script>

<template>
  <canvas ref="canvas" class="mercury" aria-hidden="true" />
</template>

<style scoped>
.mercury {
  position: fixed;
  inset: 0;
  z-index: 55;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
