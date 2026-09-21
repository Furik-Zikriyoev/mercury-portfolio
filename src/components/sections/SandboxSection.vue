<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from '@/content/i18n'
import { useMercury } from '@/composables/useMercury'
import { onSection } from '@/composables/useSections'

const { t } = useI18n()
const { engine, status } = useMercury()

const tank = ref<HTMLElement | null>(null)
const count = ref(0)
const gravityIndex = ref(0)
const tilting = ref(false)

const touch = window.matchMedia('(pointer: coarse)').matches
const canTilt = touch && 'DeviceOrientationEvent' in window
const tips = computed(() => (touch ? t.value.sandbox.tipsTouch : t.value.sandbox.tips))

const G = 1600
const GRAVITY = [
  { x: 0, y: G, icon: '↓' },
  { x: -G, y: 0, icon: '←' },
  { x: 0, y: -G, icon: '↑' },
  { x: G, y: 0, icon: '→' },
  { x: 0, y: 0, icon: '○' },
] as const
const gravity = computed(() => GRAVITY[gravityIndex.value] ?? GRAVITY[0])

let timer = 0
let visible = false
let topUp = 0

/** Вход в секцию: капля с предыдущего экрана падает в аквариум */
function enter() {
  const m = engine.value
  if (!m || !tank.value) return
  visible = true
  m.setArena(tank.value)
  m.setGravity(gravity.value.x, gravity.value.y)
  m.pourIntoArena()
  // при первом заходе металла мало — докапываем сверху
  window.clearTimeout(topUp)
  topUp = window.setTimeout(() => {
    if (visible && (engine.value?.arenaCount ?? 0) < 3) engine.value?.spawnArena(8)
  }, 700)
  window.clearInterval(timer)
  timer = window.setInterval(() => (count.value = engine.value?.arenaCount ?? 0), 250)
}

/** Выход: из аквариума вытекает одна капля, остальной металл остаётся внутри */
function leave() {
  if (!visible) return
  visible = false
  window.clearInterval(timer)
  window.clearTimeout(topUp)
  onUp()
  stopTilt()
  engine.value?.setGravity(0, G)
  engine.value?.leakFromArena()
}

// ---------- притяжение к курсору / пальцу ----------
let dragging = false

function onDown(e: PointerEvent) {
  if (!visible) return
  dragging = true
  tank.value?.setPointerCapture(e.pointerId)
  engine.value?.attract(e.clientX, e.clientY)
}

function onMove(e: PointerEvent) {
  if (dragging) engine.value?.attract(e.clientX, e.clientY)
}

function onUp() {
  dragging = false
  engine.value?.releaseAttract()
}

// ---------- кнопки ----------
function nextGravity() {
  gravityIndex.value = (gravityIndex.value + 1) % GRAVITY.length
  stopTilt()
  engine.value?.setGravity(gravity.value.x, gravity.value.y)
}

const actions = {
  shake: () => engine.value?.shakeArena(),
  split: () => engine.value?.splitArena(),
  gather: () => engine.value?.gatherArena(),
  add: () => engine.value?.spawnArena(6),
}

// ---------- наклон телефона ----------
function onOrientation(e: DeviceOrientationEvent) {
  const rad = Math.PI / 180
  const gx = Math.sin((e.gamma ?? 0) * rad) * G
  const gy = Math.sin((e.beta ?? 0) * rad) * G
  engine.value?.setGravity(gx, gy)
}

async function toggleTilt() {
  if (tilting.value) {
    stopTilt()
    engine.value?.setGravity(gravity.value.x, gravity.value.y)
    return
  }
  // iOS требует явного разрешения по нажатию
  const DOE = DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> }
  if (typeof DOE.requestPermission === 'function') {
    const result = await DOE.requestPermission().catch(() => 'denied')
    if (result !== 'granted') return
  }
  window.addEventListener('deviceorientation', onOrientation)
  tilting.value = true
}

function stopTilt() {
  window.removeEventListener('deviceorientation', onOrientation)
  tilting.value = false
}

let unregister: (() => void) | null = null

onMounted(() => {
  unregister = onSection('sandbox', { enter, leave })
})

onBeforeUnmount(() => {
  unregister?.()
  leave()
  engine.value?.setArena(null)
})
</script>

<template>
  <section id="sandbox" class="sandbox">
    <div class="sandbox__grid container">
      <header class="sandbox__head">
        <p class="section-index">01</p>
        <h2 class="sandbox__title">{{ t.sandbox.title }}</h2>
        <p class="sandbox__lead">{{ t.sandbox.lead }}</p>
        <ul class="sandbox__tips">
          <li v-for="tip in tips" :key="tip">{{ tip }}</li>
        </ul>
        <p class="sandbox__spec mono">{{ t.sandbox.spec }}</p>
      </header>

      <div class="sandbox__stage">
        <div
          ref="tank"
          class="tank"
          @pointerdown="onDown"
          @pointermove="onMove"
          @pointerup="onUp"
          @pointercancel="onUp"
        >
          <span class="tank__count mono">{{ count }} {{ t.sandbox.drops }}</span>
          <span class="tank__g mono">g {{ gravity.icon }}</span>
          <p v-if="status === 'unsupported'" class="tank__fallback">{{ t.sandbox.fallback }}</p>
        </div>

        <div class="controls">
          <button type="button" class="control" @click="nextGravity">
            {{ t.sandbox.gravity }} <span class="control__icon">{{ gravity.icon }}</span>
          </button>
          <button type="button" class="control" @click="actions.shake">{{ t.sandbox.shake }}</button>
          <button type="button" class="control" @click="actions.split">{{ t.sandbox.split }}</button>
          <button type="button" class="control" @click="actions.gather">{{ t.sandbox.gather }}</button>
          <button type="button" class="control" @click="actions.add">+ {{ t.sandbox.add }}</button>
          <button
            v-if="canTilt"
            type="button"
            class="control"
            :class="{ 'is-on': tilting }"
            @click="toggleTilt"
          >
            {{ t.sandbox.tilt }}
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.sandbox {
  display: flex;
  align-items: center;
  min-height: 100svh;
  padding-block: var(--section-space);
}

.sandbox__grid {
  display: grid;
  grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.4fr);
  gap: clamp(2rem, 4vw, 5rem);
  align-items: center;
}

.sandbox__title {
  margin-top: 1rem;
  font-size: var(--fs-2xl);
}

.sandbox__lead {
  margin-top: 1.25rem;
  font-size: var(--fs-lg);
  color: var(--text-muted);
}

.sandbox__tips {
  display: grid;
  gap: 0.6rem;
  margin-top: 1.75rem;
}

.sandbox__tips li {
  position: relative;
  padding-left: 1.25rem;
}

.sandbox__tips li::before {
  content: '';
  position: absolute;
  top: 0.62em;
  left: 0;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent);
}

.sandbox__spec {
  margin-top: 2rem;
  color: var(--text-faint);
}

/* ---------- аквариум ---------- */
.tank {
  position: relative;
  height: clamp(340px, 62vh, 620px);
  border-radius: var(--radius-lg);
  background:
    radial-gradient(120% 70% at 50% 0%, rgb(255 255 255 / 0.05), transparent 60%),
    linear-gradient(180deg, rgb(255 255 255 / 0.015), rgb(255 255 255 / 0.03));
  box-shadow:
    inset 0 0 0 1px var(--line),
    inset 0 -40px 80px -40px rgb(255 106 43 / 0.08);
  touch-action: none;
  user-select: none;
  overflow: hidden;
}

/* блик на стекле */
.tank::before {
  content: '';
  position: absolute;
  top: 12px;
  left: 18px;
  right: 40%;
  height: 1px;
  background: linear-gradient(90deg, rgb(255 255 255 / 0.25), transparent);
}

.tank__count,
.tank__g {
  position: absolute;
  top: 1rem;
  color: var(--text-faint);
  font-variant-numeric: tabular-nums;
}

.tank__count {
  right: 1.25rem;
}

.tank__g {
  left: 1.25rem;
  top: auto;
  bottom: 1rem;
}

.tank__fallback {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 2rem;
  text-align: center;
  color: var(--text-muted);
}

.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
}

.control {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 1.1rem;
  border-radius: var(--radius-pill);
  box-shadow: inset 0 0 0 1px var(--line-strong);
  font-size: var(--fs-sm);
  font-weight: 600;
  transition:
    background-color var(--dur-fast),
    box-shadow var(--dur-fast),
    color var(--dur-fast);
}

.control:hover,
.control.is-on {
  box-shadow: inset 0 0 0 1px var(--accent);
  color: var(--accent);
}

.control:active {
  background: var(--accent-soft);
}

.control__icon {
  display: inline-grid;
  place-items: center;
  width: 1.4em;
  height: 1.4em;
  border-radius: 50%;
  background: var(--surface-2);
  color: var(--text);
  font-size: 0.85em;
}

@media (max-width: 900px) {
  .sandbox__grid {
    grid-template-columns: 1fr;
  }

  .tank {
    height: 52vh;
  }
}
</style>
