<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import MercuryText from '@/components/MercuryText.vue'
import { useI18n } from '@/content/i18n'
import { profile } from '@/content/profile'
import { useClock } from '@/composables/useClock'
import { finishIntro, introSeen, useIntro } from '@/composables/useIntro'
import { useMercury } from '@/composables/useMercury'
import { scrollToTarget } from '@/composables/useSmoothScroll'
import { vMagnetic } from '@/directives/magnetic'

const { t } = useI18n()
const { time } = useClock(profile.timeZone)
const { engine, status } = useMercury()
const { running } = useIntro()

const home = ref<HTMLElement | null>(null)
const name = ref<InstanceType<typeof MercuryText> | null>(null)
let started = false

function dropSize() {
  return Math.min(90, Math.max(44, window.innerWidth * 0.055))
}

function placeDrop() {
  if (engine.value && home.value) engine.value.setHome(home.value, { size: dropSize(), count: 6 })
}

async function start() {
  if (started || !engine.value || !name.value) return
  started = true
  placeDrop()
  if (running.value) {
    await name.value.form({ from: 'scatter', duration: introSeen ? 1.4 : 2.8 })
    finishIntro()
  } else {
    await name.value.form()
  }
}

function skip() {
  engine.value?.completeText()
  finishIntro()
}

onMounted(() => {
  watch(engine, () => void start(), { immediate: true })
  watch(
    status,
    (s) => {
      if (s === 'unsupported') finishIntro()
    },
    { immediate: true },
  )
  window.addEventListener('resize', placeDrop)
})

onBeforeUnmount(() => window.removeEventListener('resize', placeDrop))
</script>

<template>
  <section id="hero" class="hero">
    <div ref="home" class="hero__home" aria-hidden="true" />

    <div class="hero__content container">
      <p class="hero__status mono" data-reveal style="--i: 0">
        <span class="hero__dot" />
        {{ t.hero.status }} · {{ t.hero.location }}
      </p>

      <h1 class="hero__name">
        <MercuryText ref="name" class="chrome-text" :text="t.hero.firstName" :auto="false" />
        <span class="hero__last" data-reveal style="--i: 1">{{ t.hero.lastName }}</span>
      </h1>

      <p class="hero__role" data-reveal style="--i: 2">{{ t.hero.role }}</p>

      <div class="hero__actions" data-reveal style="--i: 3">
        <a v-magnetic class="btn" href="#contact" @click.prevent="scrollToTarget('#contact')">
          {{ t.hero.cta }}
          <span aria-hidden="true">↗</span>
        </a>
      </div>
    </div>

    <div class="hero__meta container mono" data-reveal style="--i: 4">
      <span>{{ t.hero.localTime }} · <span class="hero__time">{{ time }}</span></span>
      <span class="hero__scroll">
        {{ t.hero.scroll }}
        <i aria-hidden="true" />
      </span>
    </div>

    <button v-if="running" type="button" class="skip mono" @click="skip">
      {{ t.intro.skip }}
    </button>
  </section>
</template>

<style scoped>
.hero {
  position: relative;
  display: grid;
  grid-template-rows: 1fr auto;
  min-height: 100svh;
  padding-top: 6rem;
}

.hero__home {
  position: absolute;
  top: 30%;
  right: calc(var(--gutter) + 9vw);
  width: 1px;
  height: 1px;
}

.hero__content {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.hero__status {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  color: var(--text-muted);
}

.hero__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 var(--accent);
  }
  70%,
  100% {
    box-shadow: 0 0 0 10px transparent;
  }
}

.hero__name {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-top: 1.5rem;
  font-size: var(--fs-hero);
  font-weight: 700;
}

.hero__last {
  color: transparent;
  -webkit-text-stroke: 1px var(--text-faint);
}

.hero__role {
  margin-top: 1.75rem;
  font-size: var(--fs-xl);
  font-weight: 500;
}

.hero__actions {
  margin-top: 2.25rem;
}

.hero__meta {
  display: flex;
  justify-content: space-between;
  padding-block: 1.5rem;
  color: var(--text-muted);
}

.hero__time {
  color: var(--accent);
  font-variant-numeric: tabular-nums;
}

.hero__scroll {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
}

.hero__scroll i {
  position: relative;
  width: 40px;
  height: 1px;
  overflow: hidden;
  background: var(--line-strong);
}

.hero__scroll i::after {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--text);
  animation: scan 2s var(--ease-in-out) infinite;
}

@keyframes scan {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(100%);
  }
}

.skip {
  position: fixed;
  right: var(--gutter);
  bottom: 1.5rem;
  z-index: 60;
  padding: 0.6rem 1rem;
  border-radius: var(--radius-pill);
  border: 1px solid var(--line-strong);
  color: var(--text-muted);
  transition:
    color var(--dur-fast),
    border-color var(--dur-fast);
}

.skip:hover {
  color: var(--text);
  border-color: var(--accent);
}

@media (max-width: 700px) {
  .hero__home {
    top: 16%;
    right: 16%;
  }
}
</style>
