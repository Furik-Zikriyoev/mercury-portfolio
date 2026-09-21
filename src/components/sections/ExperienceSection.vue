<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useI18n } from '@/content/i18n'

const { t, locale } = useI18n()

const pin = ref<HTMLElement | null>(null)
const viewport = ref<HTMLElement | null>(null)
const track = ref<HTMLElement | null>(null)
const current = ref(0)

let mm: gsap.MatchMedia | null = null

const count = () => t.value.experience.chapters.length
const nodeLeft = (i: number) => `${(i / Math.max(1, count() - 1)) * 100}%`

/**
 * Компьютер: секция закрепляется, скролл вниз двигает ленту глав влево.
 * Телефон: лента листается свайпом (scroll-snap).
 */
function setup() {
  mm?.revert()
  mm = gsap.matchMedia()
  mm.add('(min-width: 800px) and (prefers-reduced-motion: no-preference)', () => {
    const el = track.value
    if (!el || !pin.value) return
    const distance = () => el.scrollWidth - window.innerWidth
    gsap.to(el, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: pin.value,
        start: 'top top',
        end: () => `+=${distance()}`,
        pin: true,
        scrub: 0.6,
        invalidateOnRefresh: true,
        onUpdate: (self) => (current.value = Math.round(self.progress * (count() - 1))),
      },
    })
  })
  ScrollTrigger.refresh()
}

function onSwipe() {
  const el = viewport.value
  const first = track.value?.firstElementChild as HTMLElement | null
  if (!el || !first) return
  current.value = Math.min(count() - 1, Math.round(el.scrollLeft / first.offsetWidth))
}

onMounted(setup)
// при смене языка меняется ширина карточек — достаточно пересчитать размеры
watch(locale, () => nextTick(() => ScrollTrigger.refresh()))
onBeforeUnmount(() => mm?.revert())
</script>

<template>
  <section id="experience" class="xp">
    <div ref="pin" class="xp__pin">
      <header class="xp__head container">
        <h2 class="section-index">04 · {{ t.nav.sections.experience }}</h2>
        <p class="xp__hint mono">{{ t.experience.hint }} →</p>
      </header>

      <div ref="viewport" class="xp__viewport" @scroll.passive="onSwipe">
        <ol ref="track" class="xp__track">
          <li
            v-for="(c, i) in t.experience.chapters"
            :key="`${locale}-${i}`"
            class="chapter"
            :class="{ 'is-active': i === current }"
          >
            <p class="chapter__year">{{ c.year }}</p>
            <p class="chapter__city mono">{{ String(i + 1).padStart(2, '0') }} · {{ c.city }}</p>
            <h3 class="chapter__role">{{ c.role }}</h3>
            <p class="chapter__place">{{ c.place }}</p>
            <p class="chapter__text">{{ c.text }}</p>
            <ul class="chapter__tags">
              <li v-for="tag in c.tags" :key="tag">{{ tag }}</li>
            </ul>
          </li>
        </ol>
      </div>

      <div class="route container">
        <div class="route__rail">
          <span class="route__fill" :style="{ transform: `scaleX(${current / Math.max(1, count() - 1)})` }" />
          <ol class="route__nodes">
            <li
              v-for="(c, i) in t.experience.chapters"
              :key="i"
              class="route__node"
              :class="{ 'is-passed': i <= current }"
              :style="{ left: nodeLeft(i) }"
            >
              <span class="route__dot" />
              <span class="route__label mono">{{ c.city }}</span>
            </li>
          </ol>
          <!-- капля живёт внутри кружка текущей главы и перетекает по линии к следующему -->
          <div
            class="route__marker"
            :style="{ left: nodeLeft(current) }"
            data-drop-home
            data-drop-size="9"
            data-drop-count="1"
            aria-hidden="true"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.xp__pin {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: clamp(1.5rem, 4vh, 3rem);
  min-height: 100svh;
  padding-block: 6rem 3rem;
  overflow: hidden;
}

.xp__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
}

.xp__hint {
  color: var(--text-faint);
}

/* ---------- лента ---------- */
.xp__track {
  display: flex;
  gap: clamp(1rem, 3vw, 3rem);
  width: max-content;
  padding-inline: max(var(--gutter), calc((100vw - var(--container)) / 2 + var(--gutter)));
  will-change: transform;
}

.chapter {
  display: flex;
  flex-direction: column;
  width: min(560px, 42vw);
  padding: clamp(1.5rem, 2.5vw, 2.5rem);
  border-radius: var(--radius-lg);
  background: linear-gradient(160deg, rgb(255 255 255 / 0.04), rgb(255 255 255 / 0.01));
  box-shadow: inset 0 0 0 1px var(--line);
  opacity: 0.35;
  transform: scale(0.96);
  transition:
    opacity 0.6s var(--ease-out),
    transform 0.6s var(--ease-out),
    box-shadow 0.6s;
}

.chapter.is-active {
  opacity: 1;
  transform: none;
  box-shadow:
    inset 0 0 0 1px var(--line-strong),
    0 30px 80px -40px rgb(255 106 43 / 0.35);
}

.chapter__year {
  font-family: var(--font-display);
  font-size: clamp(2.25rem, 1.2rem + 3vw, 4.25rem);
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.03em;
  background: var(--chrome);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.chapter__city {
  margin-top: 1.25rem;
  color: var(--accent);
}

.chapter__role {
  margin-top: 0.75rem;
  font-size: var(--fs-xl);
  line-height: 1.2;
}

.chapter__place {
  margin-top: 0.4rem;
  color: var(--text-muted);
  font-weight: 600;
}

.chapter__text {
  margin-top: 1.25rem;
  color: var(--text-muted);
}

.chapter__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: auto;
  padding-top: 1.5rem;
}

.chapter__tags li {
  padding: 0.3rem 0.75rem;
  border-radius: var(--radius-pill);
  box-shadow: inset 0 0 0 1px var(--line-strong);
  font-size: var(--fs-xs);
  color: var(--text-muted);
}

/* ---------- маршрут ---------- */
.route {
  padding-top: 1.5rem;
}

.route__rail {
  position: relative;
  height: 2px;
  margin: 0 2rem 3.5rem;
  background: var(--line-strong);
}

.route__fill {
  position: absolute;
  inset: 0;
  background: var(--accent);
  transform-origin: left;
  transition: transform 0.6s var(--ease-out);
}

.route__node {
  position: absolute;
  top: 50%;
  translate: -50% -50%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.route__dot {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--bg);
  box-shadow: inset 0 0 0 2px var(--line-strong);
  transition: box-shadow 0.4s;
}

/* пройденные кружки — оранжевая обводка, капля сидит внутри текущего */
.route__node.is-passed .route__dot {
  box-shadow: inset 0 0 0 2px var(--accent);
}

.route__label {
  position: absolute;
  top: 30px;
  white-space: nowrap;
  color: var(--text-faint);
  transition: color 0.4s;
}

.route__node.is-passed .route__label {
  color: var(--text-muted);
}

.route__marker {
  position: absolute;
  top: 50%;
  width: 1px;
  height: 1px;
  translate: -50% -50%;
  transition: left 0.8s var(--ease-in-out);
}

/* ---------- телефон: свайп ---------- */
@media (max-width: 799px) {
  .xp__viewport {
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    scrollbar-width: none;
  }

  .xp__viewport::-webkit-scrollbar {
    display: none;
  }

  .chapter {
    width: 82vw;
    scroll-snap-align: center;
  }

  .route__label {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .xp__viewport {
    overflow-x: auto;
  }
}
</style>
