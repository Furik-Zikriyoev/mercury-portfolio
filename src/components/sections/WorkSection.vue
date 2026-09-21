<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  Activity,
  Braces,
  Clock,
  Database,
  Server,
  ShieldCheck,
  Sparkles,
  Swords,
} from 'lucide-vue-next'
import CountUp from '@/components/CountUp.vue'
import MercuryText from '@/components/MercuryText.vue'
import { useI18n } from '@/content/i18n'
import { onSection } from '@/composables/useSections'
import { scrollToY } from '@/composables/useSmoothScroll'
import { vReveal } from '@/directives/reveal'
import dashboard from '@/assets/works/dotai/dashboard.webp'
import match from '@/assets/works/dotai/match.webp'
import compare from '@/assets/works/dotai/compare.webp'
import chat from '@/assets/works/dotai/chat.webp'

const { t } = useI18n()

const SHOTS = [dashboard, match, compare, chat]
const STACK = [
  { name: 'JavaScript', icon: Braces },
  { name: 'Node.js + Express', icon: Server },
  { name: 'SQLite', icon: Database },
  { name: 'OpenAI API', icon: Sparkles },
  { name: 'OpenDota API', icon: Swords },
  { name: 'Chart.js', icon: Activity },
  { name: 'JWT', icon: ShieldCheck },
]
/** Скрин, листание которого идёт автоматически на телефоне */
const AUTO_MS = 4200

const screens = computed(() =>
  SHOTS.map((src, i) => ({ src, caption: t.value.work.screens[i] ?? '' })),
)

const section = ref<HTMLElement | null>(null)
const title = ref<InstanceType<typeof MercuryText> | null>(null)
const current = ref(0)

let trigger: ScrollTrigger | null = null
let timer = 0
let observer: IntersectionObserver | null = null
let unregister: (() => void) | null = null
const desktop = window.matchMedia('(min-width: 1024px)')

/** На десктопе экран sticky: скролл внутри секции листает скрины */
function buildTrigger() {
  trigger?.kill()
  trigger = null
  if (!desktop.matches || !section.value) return
  trigger = ScrollTrigger.create({
    trigger: section.value,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => {
      current.value = Math.min(SHOTS.length - 1, Math.floor(self.progress * SHOTS.length))
    },
  })
}

function stopAuto() {
  window.clearInterval(timer)
  timer = 0
}

function startAuto() {
  stopAuto()
  if (desktop.matches) return
  timer = window.setInterval(() => {
    current.value = (current.value + 1) % SHOTS.length
  }, AUTO_MS)
}

function select(i: number) {
  if (trigger) {
    // середина отрезка скролла, который отвечает за этот скрин
    const y = trigger.start + ((i + 0.5) / SHOTS.length) * (trigger.end - trigger.start)
    scrollToY(y)
    return
  }
  current.value = i
  startAuto()
}

function onMedia() {
  buildTrigger()
  if (desktop.matches) stopAuto()
  ScrollTrigger.refresh()
}

onMounted(() => {
  buildTrigger()
  desktop.addEventListener('change', onMedia)

  // на телефоне листаем только пока секция на экране
  observer = new IntersectionObserver(([entry]) => {
    if (entry?.isIntersecting) startAuto()
    else stopAuto()
  })
  if (section.value) observer.observe(section.value)

  unregister = onSection('work', {
    enter: () => void title.value?.form({ from: 'home', duration: 1.4 }),
  })
})

onBeforeUnmount(() => {
  trigger?.kill()
  stopAuto()
  observer?.disconnect()
  desktop.removeEventListener('change', onMedia)
  unregister?.()
})
</script>

<template>
  <section id="work" ref="section" class="work">
    <div class="work__stage">
      <div class="work__grid container">
        <div class="work__info">
          <h2 class="section-index">06 · {{ t.nav.sections.work }}</h2>
          <p class="work__label mono">{{ t.work.label }}</p>
          <h3 class="work__title">
            <MercuryText ref="title" :text="t.work.title" :auto="false" class="chrome-text" />
          </h3>
          <p v-reveal class="work__lead">{{ t.work.lead }}</p>

          <dl class="stats">
            <div v-for="(stat, i) in t.work.stats" :key="stat.label" v-reveal="i * 80" class="stat">
              <dt class="stat__value"><CountUp :value="stat.value" /></dt>
              <dd class="stat__label">{{ stat.label }}</dd>
            </div>
          </dl>

          <p class="work__stack-label mono">{{ t.work.stackLabel }}</p>
          <ul class="stack">
            <li v-for="item in STACK" :key="item.name" class="chip">
              <component :is="item.icon" :size="15" :stroke-width="1.8" aria-hidden="true" />
              {{ item.name }}
            </li>
          </ul>

          <div class="work__actions">
            <span class="demo" aria-disabled="true">
              <Clock :size="16" :stroke-width="1.8" aria-hidden="true" />
              {{ t.work.demo }}
            </span>
          </div>

          <div class="work__drop" data-drop-home data-drop-size="36" data-drop-count="3" aria-hidden="true" />
        </div>

        <div class="work__visual">
          <div class="browser">
            <div class="browser__bar" aria-hidden="true">
              <span class="browser__dots"><i /><i /><i /></span>
              <span class="browser__url mono">dotai · {{ screens[current]?.caption }}</span>
            </div>
            <div class="browser__screen">
              <img
                v-for="(shot, i) in screens"
                :key="shot.src"
                :src="shot.src"
                :alt="`${t.work.screenAlt} ${shot.caption}`"
                :class="{ 'is-active': i === current }"
                :aria-hidden="i !== current"
                width="1600"
                height="933"
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>

          <ol class="captions">
            <li v-for="(shot, i) in screens" :key="shot.caption">
              <button
                type="button"
                class="caption"
                :class="{ 'is-active': i === current }"
                :aria-current="i === current"
                @click="select(i)"
              >
                <span class="caption__num mono">0{{ i + 1 }}</span>
                <span class="caption__text">{{ shot.caption }}</span>
                <span class="caption__bar" />
              </button>
            </li>
          </ol>
        </div>
      </div>
    </div>

    <p class="work__more container mono">{{ t.work.more }}</p>
  </section>
</template>

<style scoped>
.work {
  position: relative;
  padding-block: var(--section-space);
}

.work__grid {
  display: grid;
  gap: clamp(2.5rem, 6vw, 4rem);
}

.work__info {
  position: relative;
}

.work__label {
  margin-top: 1.5rem;
  font-size: var(--fs-xs);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.work__title {
  margin-top: 0.75rem;
  font-family: var(--font-display);
  font-size: var(--fs-2xl);
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.05;
}

.work__lead {
  margin-top: 1.25rem;
  max-width: 34em;
  font-size: var(--fs-lg);
  line-height: 1.55;
  color: var(--text-muted);
}

/* ---------- цифры ---------- */
.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--line);
}

.stat__value {
  font-family: var(--font-display);
  font-size: var(--fs-xl);
  font-weight: 700;
  color: var(--text);
}

.stat__label {
  margin-top: 0.35rem;
  font-size: var(--fs-sm);
  line-height: 1.4;
  color: var(--text-muted);
}

/* ---------- стек ---------- */
.work__stack-label {
  margin-top: 2rem;
  font-size: var(--fs-xs);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-faint);
}

.stack {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.45rem 0.8rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-pill);
  background: var(--surface);
  font-size: var(--fs-sm);
  color: var(--text);
  transition:
    border-color var(--dur-fast),
    color var(--dur-fast);
}

.chip svg {
  color: var(--text-muted);
  transition: color var(--dur-fast);
}

.chip:hover {
  border-color: var(--line-strong);
}

.chip:hover svg {
  color: var(--accent);
}

/* ---------- демо ---------- */
.work__actions {
  margin-top: 2rem;
}

.demo {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.8rem 1.3rem;
  border: 1px dashed var(--line-strong);
  border-radius: var(--radius-pill);
  font-weight: 600;
  color: var(--text-muted);
  cursor: default;
}

.demo svg {
  color: var(--accent);
}

.work__drop {
  position: absolute;
  top: 0.4rem;
  right: 10%;
  width: 1px;
  height: 1px;
}

/* ---------- окно браузера ---------- */
.browser {
  overflow: hidden;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-md);
  background: var(--surface);
  box-shadow:
    0 40px 80px -30px rgb(0 0 0 / 0.8),
    0 0 0 1px rgb(255 255 255 / 0.02) inset;
}

.browser__bar {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.7rem 1rem;
  border-bottom: 1px solid var(--line);
  background: var(--surface-2);
}

.browser__dots {
  display: flex;
  gap: 6px;
}

.browser__dots i {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--line-strong);
}

.browser__url {
  flex: 1;
  overflow: hidden;
  padding: 0.3rem 0.8rem;
  border-radius: var(--radius-pill);
  background: var(--bg);
  font-size: var(--fs-xs);
  color: var(--text-muted);
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.browser__screen {
  position: relative;
  aspect-ratio: 1600 / 933;
  background: var(--bg);
}

.browser__screen img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transform: scale(1.03);
  transition:
    opacity 0.6s var(--ease-out),
    transform 1.2s var(--ease-out);
}

.browser__screen img.is-active {
  opacity: 1;
  transform: none;
}

/* ---------- подписи ---------- */
.captions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.25rem 1rem;
  margin-top: 1.25rem;
}

.caption {
  position: relative;
  display: flex;
  align-items: baseline;
  gap: 0.6rem;
  width: 100%;
  padding: 0.75rem 0 0.9rem;
  text-align: left;
  color: var(--text-faint);
  transition: color var(--dur-fast);
}

.caption:hover {
  color: var(--text-muted);
}

.caption.is-active {
  color: var(--text);
}

.caption__num {
  font-size: var(--fs-xs);
}

.caption.is-active .caption__num {
  color: var(--accent);
}

.caption__text {
  font-size: var(--fs-sm);
  font-weight: 600;
}

.caption__bar {
  position: absolute;
  inset: auto 0 0;
  height: 1px;
  background: var(--line);
}

.caption__bar::after {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--accent);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.6s var(--ease-out);
}

.caption.is-active .caption__bar::after {
  transform: scaleX(1);
}

.work__more {
  margin-top: clamp(3rem, 8vh, 5rem);
  font-size: var(--fs-sm);
  color: var(--text-faint);
}

/* ---------- десктоп: sticky-сцена, скролл листает скрины ---------- */
@media (min-width: 1024px) {
  .work {
    padding-block: 0 var(--section-space);
  }

  .work__stage {
    height: 320vh;
  }

  .work__grid {
    position: sticky;
    top: 0;
    min-height: 100vh;
    grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
    align-items: center;
    padding-block: 5rem 3rem;
  }

  .captions {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 480px) {
  .stats {
    grid-template-columns: 1fr;
  }

  .stat {
    display: flex;
    align-items: baseline;
    gap: 0.75rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .browser__screen img {
    transform: none;
    transition: opacity 0.2s;
  }
}
</style>
