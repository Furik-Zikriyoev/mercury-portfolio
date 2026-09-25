<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import {
  Activity,
  ArrowUpRight,
  Braces,
  Clock,
  Database,
  Github,
  Mail,
  Palette,
  PlayCircle,
  Server,
  ShieldCheck,
  Sparkles,
  Swords,
  Globe,
} from 'lucide-vue-next'
import { useI18n } from '@/content/i18n'
import { useMercury } from '@/composables/useMercury'
import { vReveal } from '@/directives/reveal'
import type { StackIcon, Work } from '@/content/works/types'

const props = defineProps<{ work: Work; index: number }>()

const ICONS: Record<StackIcon, typeof Braces> = {
  code: Braces,
  server: Server,
  database: Database,
  shield: ShieldCheck,
  ai: Sparkles,
  game: Swords,
  chart: Activity,
  mail: Mail,
  design: Palette,
  web: Globe,
}
/** сколько секунд держится один скриншот */
const SHOT_MS = 4200

const { t, locale } = useI18n()
const { engine } = useMercury()

const section = ref<HTMLElement | null>(null)
const anchor = ref<HTMLElement | null>(null)
const current = ref(0)
const visible = ref(false)

let timer = 0
let observer: IntersectionObserver | null = null

const shots = computed(() =>
  props.work.shots.map((s) => ({ src: s.src, caption: s.caption[locale.value] })),
)
const number = computed(() => String(props.index + 1).padStart(2, '0'))
/** чётные баннеры — тёмные со скриншотом справа, нечётные — светлые и зеркальные */
const mirrored = computed(() => props.index % 2 === 1)
const light = computed(() => props.index % 2 === 1)

function startAuto() {
  window.clearInterval(timer)
  if (props.work.shots.length < 2) return
  timer = window.setInterval(() => {
    current.value = (current.value + 1) % props.work.shots.length
  }, SHOT_MS)
}

function select(i: number) {
  current.value = i
  startAuto()
}

onMounted(() => {
  observer = new IntersectionObserver(
    ([entry]) => {
      const on = !!entry?.isIntersecting
      visible.value = on
      if (on) {
        startAuto()
        // капля переезжает к баннеру, который сейчас на экране
        if (anchor.value) engine.value?.setHome(anchor.value, { size: 34, count: 3 })
      } else {
        window.clearInterval(timer)
      }
    },
    { threshold: 0.4 },
  )
  if (section.value) observer.observe(section.value)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  window.clearInterval(timer)
})
</script>

<template>
  <section
    :id="work.slug"
    ref="section"
    class="banner"
    :class="{ 'is-mirrored': mirrored, 'is-light': light }"
    :data-surface="light ? 'light' : 'dark'"
  >
    <div class="banner__grid container">
      <div class="banner__info">
        <p class="banner__meta mono">
          <span class="banner__num">{{ number }}</span>
          <span>{{ work.kind[locale] }}</span>
          <span aria-hidden="true">·</span>
          <span>{{ work.year }}</span>
        </p>

        <h2 v-reveal class="banner__title">{{ work.title }}</h2>
        <p v-reveal="60" class="banner__lead">{{ work.lead[locale] }}</p>

        <dl class="stat">
          <div v-for="s in work.stat" :key="s.label.ru" class="stat__item">
            <dt class="stat__value">{{ s.value }}</dt>
            <dd class="stat__label">{{ s.label[locale] }}</dd>
          </div>
        </dl>

        <div class="actions">
          <a v-if="work.demo" class="btn" :href="work.demo" target="_blank" rel="noopener">
            <PlayCircle :size="18" :stroke-width="1.8" aria-hidden="true" />
            {{ t.works.openDemo }}
          </a>
          <span v-else class="btn btn--soon" aria-disabled="true">
            <Clock :size="18" :stroke-width="1.8" aria-hidden="true" />
            {{ t.works.demoSoon }}
          </span>

          <a v-if="work.repo" class="ghost" :href="work.repo" target="_blank" rel="noopener">
            <Github :size="17" :stroke-width="1.8" aria-hidden="true" />
            {{ t.works.sources }}
            <ArrowUpRight :size="15" :stroke-width="1.8" aria-hidden="true" />
          </a>
        </div>

        <div ref="anchor" class="banner__drop" aria-hidden="true" />
      </div>

      <div class="banner__visual">
        <div class="browser" :class="{ 'is-visible': visible }">
          <div class="browser__bar" aria-hidden="true">
            <span class="browser__dots"><i /><i /><i /></span>
            <span class="browser__url mono">{{ work.slug }} · {{ shots[current]?.caption }}</span>
          </div>
          <div class="browser__screen">
            <img
              v-for="(shot, i) in shots"
              :key="shot.src"
              :src="shot.src"
              :alt="`${work.title} — ${shot.caption}`"
              :class="{ 'is-active': i === current }"
              :aria-hidden="i !== current"
              width="1600"
              height="933"
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>

        <ol v-if="shots.length > 1" class="tabs">
          <li v-for="(shot, i) in shots" :key="shot.caption">
            <button
              type="button"
              class="tab"
              :class="{ 'is-active': i === current }"
              :aria-current="i === current"
              @click="select(i)"
            >
              <span class="tab__text">{{ shot.caption }}</span>
              <span class="tab__bar"><i :style="{ animationDuration: `${SHOT_MS}ms` }" /></span>
            </button>
          </li>
        </ol>
      </div>
    </div>

    <div class="details container">
      <article v-for="(d, i) in work.details" :key="d.title.ru" v-reveal="i * 70" class="detail">
        <p class="detail__num mono">{{ String(i + 1).padStart(2, '0') }}</p>
        <h3 class="detail__title">{{ d.title[locale] }}</h3>
        <p class="detail__text">{{ d.text[locale] }}</p>
      </article>
    </div>

    <div class="stack container">
      <p class="stack__label mono">{{ t.works.stack }}</p>
      <ul class="stack__list">
        <li v-for="item in work.stack" :key="item.name" class="chip">
          <component :is="ICONS[item.icon]" :size="15" :stroke-width="1.8" aria-hidden="true" />
          {{ item.name }}
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.banner {
  position: relative;
  padding-block: clamp(4rem, 10vh, 8rem);
  border-top: 1px solid var(--line);
}

.banner.is-light {
  /* светлый баннер: поверхности и фон перекрашиваются, текст берёт цвета из data-surface */
  --surface: #ffffff;
  --surface-2: #edece7;
  --bg: #f6f5f2;
  background: var(--light-bg);
}

.banner.is-light .browser {
  box-shadow: 0 40px 80px -34px rgb(14 14 16 / 0.35);
}

.banner__grid {
  display: grid;
  gap: clamp(2.5rem, 6vw, 4.5rem);
  align-items: center;
}

.banner__info {
  position: relative;
}

.banner__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.6rem;
  font-size: var(--fs-xs);
  color: var(--text-muted);
}

.banner__num {
  color: var(--accent);
  font-weight: 600;
}

.banner__title {
  margin-top: 0.9rem;
  font-family: var(--font-display);
  font-size: var(--fs-2xl);
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.05;
}

.banner__lead {
  margin-top: 1.1rem;
  max-width: 36em;
  font-size: var(--fs-lg);
  line-height: 1.55;
  color: var(--text-muted);
}

.banner__drop {
  position: absolute;
  top: -1.5rem;
  right: 12%;
  width: 1px;
  height: 1px;
}

/* ---------- цифры ---------- */
.stat {
  display: flex;
  flex-wrap: wrap;
  gap: 1.75rem;
  margin-top: 1.75rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--line);
}

.stat__value {
  font-family: var(--font-display);
  font-size: var(--fs-xl);
  font-weight: 700;
}

.stat__label {
  margin-top: 0.2rem;
  max-width: 12em;
  font-size: var(--fs-sm);
  line-height: 1.35;
  color: var(--text-muted);
}

/* ---------- кнопки ---------- */
.actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
}

.btn--soon {
  background: transparent;
  border: 1px dashed var(--line-strong);
  color: var(--text-muted);
  cursor: default;
}

.btn--soon::before {
  display: none;
}

.btn--soon svg {
  color: var(--accent);
}

.ghost {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.9rem 1.2rem;
  border-radius: var(--radius-pill);
  color: var(--text-muted);
  transition: color var(--dur-fast);
}

.ghost:hover {
  color: var(--text);
}

/* ---------- окно браузера ---------- */
.browser {
  overflow: hidden;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-md);
  background: var(--surface);
  box-shadow: 0 40px 80px -30px rgb(0 0 0 / 0.8);
  opacity: 0;
  transform: translateY(28px) scale(0.98);
  transition:
    opacity 0.7s var(--ease-out),
    transform 0.9s var(--ease-out);
}

.browser.is-visible {
  opacity: 1;
  transform: none;
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
  transition: opacity 0.6s var(--ease-out);
}

.browser__screen img.is-active {
  opacity: 1;
}

/* ---------- вкладки скриншотов ---------- */
.tabs {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.75rem;
  margin-top: 1rem;
}

.tab {
  width: 100%;
  text-align: left;
  color: var(--text-faint);
  transition: color var(--dur-fast);
}

.tab:hover {
  color: var(--text-muted);
}

.tab.is-active {
  color: var(--text);
}

.tab__text {
  display: block;
  padding-bottom: 0.6rem;
  font-size: var(--fs-sm);
  font-weight: 600;
}

.tab__bar {
  display: block;
  height: 2px;
  background: var(--line);
  border-radius: 2px;
}

.tab__bar i {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--accent);
  transform-origin: left;
  transform: scaleX(0);
}

/* полоса заполняется, пока показан этот скриншот */
.tab.is-active .tab__bar i {
  animation: fill linear forwards;
}

@keyframes fill {
  from {
    transform: scaleX(0);
  }
  to {
    transform: scaleX(1);
  }
}

/* ---------- детали ---------- */
.details {
  display: grid;
  gap: 1rem;
  margin-top: clamp(3rem, 7vh, 5rem);
}

.detail {
  padding: 1.5rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--surface);
  transition:
    border-color var(--dur-fast),
    transform var(--dur-med) var(--ease-out);
}

.detail:hover {
  border-color: var(--line-strong);
  transform: translateY(-3px);
}

.detail__num {
  font-size: var(--fs-xs);
  color: var(--accent);
}

.detail__title {
  margin-top: 0.75rem;
  font-size: var(--fs-md);
  font-weight: 700;
}

.detail__text {
  margin-top: 0.5rem;
  font-size: var(--fs-sm);
  line-height: 1.6;
  color: var(--text-muted);
  text-wrap: pretty;
}

/* ---------- стек ---------- */
.stack {
  margin-top: 2rem;
}

.stack__label {
  font-size: var(--fs-xs);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-faint);
}

.stack__list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.85rem;
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
  transition: border-color var(--dur-fast);
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

@media (min-width: 900px) {
  .banner__grid {
    grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
  }

  .banner.is-mirrored .banner__info {
    order: 2;
  }

  .details {
    grid-template-columns: repeat(2, 1fr);
    gap: 1.25rem;
  }

  .detail {
    padding: 1.75rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .browser {
    opacity: 1;
    transform: none;
  }

  .tab.is-active .tab__bar i {
    animation: none;
    transform: scaleX(1);
  }
}
</style>
