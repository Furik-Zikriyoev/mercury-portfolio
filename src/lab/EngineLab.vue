<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import MercuryText from '@/components/MercuryText.vue'
import { useMercury } from '@/composables/useMercury'
import type { MercuryStats, Quality } from '@/engine'
import portrait from '@/assets/images/portrait.webp'

/** Тестовая страница движка: /?lab */
const { engine, status } = useMercury()

const title = ref<InstanceType<typeof MercuryText> | null>(null)
const photo = ref<HTMLElement | null>(null)
const card = ref<HTMLElement | null>(null)
const home = ref<HTMLElement | null>(null)

const QUALITIES: readonly (Quality | 'auto')[] = ['auto', 'high', 'medium', 'low']

const stats = ref<MercuryStats | null>(null)
const free = ref(false)
const framed = ref(false)
const quality = ref<Quality | 'auto'>('auto')
let timer = 0

watch(engine, (m) => {
  if (!m || !home.value) return
  m.setHome(home.value, { size: 60 })
  m.setPointerRadius(20)
}, { immediate: true })

onMounted(() => {
  if (engine.value && home.value) {
    engine.value.setHome(home.value, { size: 60 })
    engine.value.setPointerRadius(20)
  }
  timer = window.setInterval(() => (stats.value = engine.value?.stats ?? null), 500)
})
onBeforeUnmount(() => window.clearInterval(timer))

const act = {
  form: () => title.value?.form(),
  scatter: () => title.value?.release('scatter'),
  collect: () => title.value?.release('collect'),
  frame: async () => {
    if (!engine.value || !photo.value) return
    if (framed.value) await engine.value.clearFrame()
    else await engine.value.setFrame(photo.value, { thickness: 10 })
    framed.value = !framed.value
  },
  homeDefault: () => home.value && engine.value?.setHome(home.value, { size: 60, tight: false }),
  homeCard: () => card.value && engine.value?.setHome(card.value, { size: 46, tight: true }),
  free: () => {
    free.value = !free.value
    engine.value?.setFree(free.value)
  },
  shake: () => engine.value?.shake(),
  gravity: (x: number, y: number) => engine.value?.setGravity(x, y),
  quality: (q: Quality | 'auto') => {
    quality.value = q
    engine.value?.setQuality(q)
  },
}

function onStageClick(e: MouseEvent) {
  if ((e.target as HTMLElement).closest('button')) return
  engine.value?.splash(e.clientX, e.clientY)
}
</script>

<template>
  <div class="lab" @click="onStageClick">
    <aside class="panel">
      <p class="mono">Mercury lab · {{ status }}</p>
      <dl v-if="stats" class="stats mono">
        <div><dt>fps</dt><dd>{{ stats.fps }}</dd></div>
        <div><dt>pr</dt><dd>{{ stats.pixelRatio }}</dd></div>
        <div><dt>drops</dt><dd>{{ stats.drops }}</dd></div>
        <div><dt>quality</dt><dd>{{ stats.quality }}</dd></div>
      </dl>

      <fieldset>
        <legend class="mono">Текст</legend>
        <button type="button" @click="act.form">Собрать</button>
        <button type="button" @click="act.scatter">Рассыпать</button>
        <button type="button" @click="act.collect">Стечь</button>
      </fieldset>
      <fieldset>
        <legend class="mono">Рамка</legend>
        <button type="button" @click="act.frame">{{ framed ? 'Убрать' : 'Вокруг фото' }}</button>
      </fieldset>
      <fieldset>
        <legend class="mono">Капля</legend>
        <button type="button" @click="act.homeDefault">Домой</button>
        <button type="button" @click="act.homeCard">К карточке</button>
      </fieldset>
      <fieldset>
        <legend class="mono">Физика</legend>
        <button type="button" @click="act.free">{{ free ? 'Собрать обратно' : 'Отпустить' }}</button>
        <button type="button" @click="act.shake">Встряхнуть</button>
        <button type="button" @click="act.gravity(0, 1600)">g ↓</button>
        <button type="button" @click="act.gravity(0, -1600)">g ↑</button>
        <button type="button" @click="act.gravity(0, 0)">g 0</button>
      </fieldset>
      <fieldset>
        <legend class="mono">Качество</legend>
        <button
          v-for="q in QUALITIES"
          :key="q"
          type="button"
          :class="{ on: quality === q }"
          @click="act.quality(q)"
        >
          {{ q }}
        </button>
      </fieldset>
      <p class="hint">Клик по пустому месту — брызги.</p>
    </aside>

    <main class="stage">
      <h1 class="title"><MercuryText ref="title" text="Фурузонфар" /></h1>
      <div ref="home" class="home" />
      <div ref="card" class="card">Карточка</div>
      <div ref="photo" class="photo"><img :src="portrait" alt="" /></div>
    </main>
  </div>
</template>

<style scoped>
.lab {
  display: grid;
  grid-template-columns: 280px 1fr;
  min-height: 100dvh;
}

.panel {
  position: relative;
  z-index: 20;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
  border-right: 1px solid var(--line);
  background: var(--bg-soft);
}

.stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.25rem 1rem;
  color: var(--text-muted);
}

.stats div {
  display: flex;
  justify-content: space-between;
}

.stats dd {
  color: var(--text);
}

fieldset {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  border: 0;
}

legend {
  width: 100%;
  margin-bottom: 0.4rem;
  color: var(--text-muted);
}

button {
  padding: 0.45rem 0.75rem;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-pill);
  font-size: var(--fs-sm);
}

button:hover,
button.on {
  border-color: var(--accent);
  color: var(--accent);
}

.hint {
  margin-top: auto;
  color: var(--text-muted);
  font-size: var(--fs-sm);
}

.stage {
  position: relative;
  min-height: 100dvh;
}

.title {
  position: absolute;
  top: 12vh;
  left: 6vw;
  font-size: clamp(3rem, 8vw, 8rem);
  font-weight: 700;
}

.home {
  position: absolute;
  top: 58%;
  left: 18%;
  width: 1px;
  height: 1px;
}

.card {
  position: absolute;
  top: 55%;
  left: 42%;
  display: grid;
  place-items: center;
  width: 180px;
  height: 110px;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-md);
  color: var(--text-muted);
}

.photo {
  position: absolute;
  top: 42%;
  right: 8vw;
  width: min(260px, 22vw);
  aspect-ratio: 4 / 5;
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
