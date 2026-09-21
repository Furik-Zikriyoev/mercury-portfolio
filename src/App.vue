<script setup lang="ts">
import { defineAsyncComponent, onMounted, ref, watch } from 'vue'
import LangSwitch from '@/components/LangSwitch.vue'
import MercuryCanvas from '@/components/MercuryCanvas.vue'
import MercuryText from '@/components/MercuryText.vue'
import { useI18n } from '@/content/i18n'
import { profile } from '@/content/profile'
import { useClock } from '@/composables/useClock'
import { useMercury } from '@/composables/useMercury'

const EngineLab = defineAsyncComponent(() => import('@/lab/EngineLab.vue'))
const isLab = new URLSearchParams(window.location.search).has('lab')

const { t } = useI18n()
const { time } = useClock(profile.timeZone)
const { engine } = useMercury()

const home = ref<HTMLElement | null>(null)

function placeDrop() {
  const m = engine.value
  if (!m || !home.value || isLab) return
  const size = Math.min(90, Math.max(44, window.innerWidth * 0.055))
  m.setHome(home.value, { size, count: 6 })
  m.setPointerRadius(window.matchMedia('(pointer: fine)').matches ? 20 : 0)
}

watch(engine, placeDrop)
onMounted(placeDrop)
</script>

<template>
  <MercuryCanvas />
  <EngineLab v-if="isLab" />

  <div v-else class="page">
    <header class="top container">
      <span class="logo mono">Mercury</span>
      <LangSwitch />
    </header>

    <main class="hero container">
      <div ref="home" class="drop-home" aria-hidden="true" />

      <p class="eyebrow mono">
        <span class="dot" />
        {{ t.hero.status }} · {{ t.hero.location }}
      </p>

      <h1 class="name">
        <MercuryText class="chrome-text" :text="t.hero.firstName" />
        <span class="name__last">{{ t.hero.lastName }}</span>
      </h1>

      <p class="role">{{ t.hero.role }}</p>

      <section class="soon" aria-labelledby="soon-title">
        <h2 id="soon-title" class="mono soon__label">{{ t.soon.label }}</h2>
        <p class="soon__text">{{ t.soon.text }}</p>
        <ul class="links">
          <li>
            <a :href="`mailto:${profile.email}`">{{ t.contact.email }} ↗</a>
          </li>
          <li v-for="s in profile.socials" :key="s.id">
            <a :href="s.href" target="_blank" rel="noopener noreferrer">{{ s.label }} ↗</a>
          </li>
        </ul>
      </section>
    </main>

    <footer class="bottom container mono">
      <span>{{ t.hero.localTime }} · {{ time }}</span>
      <span>© {{ new Date().getFullYear() }}</span>
    </footer>
  </div>
</template>

<style scoped>
.page {
  display: grid;
  grid-template-rows: auto 1fr auto;
  min-height: 100dvh;
  overflow: hidden;
}

.top,
.bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-block: 1.5rem;
  color: var(--text-muted);
}

.logo {
  color: var(--text);
  letter-spacing: 0.3em;
}

.hero {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding-block: 4rem;
}

/* точка, вокруг которой живёт капля */
.drop-home {
  position: absolute;
  top: 26%;
  right: calc(var(--gutter) + 8vw);
  width: 1px;
  height: 1px;
}

.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  color: var(--text-muted);
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 0 0 var(--accent);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  70% {
    box-shadow: 0 0 0 10px transparent;
  }
  100% {
    box-shadow: 0 0 0 0 transparent;
  }
}

.name {
  margin-top: 1.5rem;
  font-size: var(--fs-hero);
  font-weight: 700;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.name__last {
  color: transparent;
  -webkit-text-stroke: 1px var(--text-faint);
}

.role {
  margin-top: 1.5rem;
  font-size: var(--fs-xl);
  font-weight: 500;
}

.soon {
  margin-top: 3.5rem;
  max-width: 34rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--line);
}

.soon__label {
  font-family: var(--font-mono);
  font-weight: 400;
  color: var(--accent);
}

.soon__text {
  margin-top: 0.75rem;
  color: var(--text-muted);
}

.links {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1.5rem;
  margin-top: 1.25rem;
}

.links a {
  position: relative;
  font-weight: 600;
}

.links a::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -2px;
  height: 1px;
  background: var(--accent);
  transform: scaleX(0);
  transform-origin: right;
  transition: transform var(--dur-med) var(--ease-out);
}

.links a:hover::after {
  transform: scaleX(1);
  transform-origin: left;
}

@media (max-width: 700px) {
  .drop-home {
    top: 14%;
    right: 18%;
  }
}
</style>
