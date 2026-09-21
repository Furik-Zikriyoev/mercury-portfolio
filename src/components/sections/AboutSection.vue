<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import CountUp from '@/components/CountUp.vue'
import { useI18n } from '@/content/i18n'
import { useMercury } from '@/composables/useMercury'
import { onSection } from '@/composables/useSections'
import portrait from '@/assets/images/portrait.webp'

const { t } = useI18n()
const { engine, status } = useMercury()

const photo = ref<HTMLElement | null>(null)
const revealed = ref(false)
let unregister: (() => void) | null = null
let framed = false

/** Капли стекаются к фото, обтекают его рамкой, после этого фото проявляется */
async function enter() {
  const m = engine.value
  if (!m || !photo.value || framed) {
    revealed.value = true
    return
  }
  framed = true
  await m.setFrame(photo.value, { thickness: 15, duration: 1.3 })
  revealed.value = true
}

/** Рамка распадается на капли, они текут к следующей секции */
function leave() {
  if (!framed) return
  framed = false
  void engine.value?.clearFrame()
}

watch(status, (s) => {
  if (s === 'unsupported') revealed.value = true
})

onMounted(() => {
  unregister = onSection('about', { enter, leave })
  if (status.value === 'unsupported') revealed.value = true
})

onBeforeUnmount(() => {
  unregister?.()
  leave()
})
</script>

<template>
  <section id="about" class="about">
    <div class="about__grid container">
      <div class="about__visual">
        <div ref="photo" class="photo" :class="{ 'is-revealed': revealed }">
          <img :src="portrait" :alt="t.about.photoAlt" loading="lazy" />
        </div>
      </div>

      <div class="about__content">
        <h2 class="section-index">03 · {{ t.nav.sections.about }}</h2>

        <div class="about__text">
          <p v-for="(p, i) in t.about.paragraphs" :key="i">{{ p }}</p>
        </div>

        <dl class="facts">
          <div v-for="fact in t.about.facts" :key="fact.label" class="fact">
            <dt class="fact__value">
              {{ fact.prefix }}<CountUp :value="fact.value" />{{ fact.suffix }}
            </dt>
            <dd class="fact__label">{{ fact.label }}</dd>
          </div>
        </dl>

        <p class="about__extra">
          <span class="mono">{{ t.about.extraLabel }}</span>
          {{ t.about.extra }}
        </p>

        <div class="about__drop" data-drop-home data-drop-size="40" data-drop-count="3" aria-hidden="true" />
      </div>
    </div>
  </section>
</template>

<style scoped>
.about {
  display: flex;
  align-items: center;
  min-height: 100svh;
  padding-block: var(--section-space);
}

.about__grid {
  display: grid;
  grid-template-columns: minmax(0, 0.85fr) minmax(0, 1.15fr);
  gap: clamp(2.5rem, 6vw, 7rem);
  align-items: center;
}

/* ---------- фото ---------- */
.about__visual {
  padding: 22px;
}

.photo {
  position: relative;
  aspect-ratio: 4 / 5;
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--surface);
  clip-path: inset(46% 46% 46% 46% round var(--radius-lg));
  transition: clip-path 1.3s var(--ease-in-out);
}

.photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: grayscale(1) contrast(1.1) brightness(0.8);
  transform: scale(1.18);
  transition:
    filter 1.8s var(--ease-out),
    transform 1.8s var(--ease-out);
}

.photo.is-revealed {
  clip-path: inset(0 0 0 0 round var(--radius-lg));
}

.photo.is-revealed img {
  filter: none;
  transform: scale(1);
}

/* ---------- текст ---------- */
.about__text {
  display: grid;
  gap: 1rem;
  margin-top: 1.75rem;
  max-width: 38rem;
  color: var(--text-muted);
  font-size: var(--fs-lg);
}

.about__text p:first-child {
  color: var(--text);
  font-size: var(--fs-xl);
  line-height: 1.4;
}

.facts {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
  margin-top: 2.5rem;
  padding-top: 2rem;
  border-top: 1px solid var(--line);
}

.fact__value {
  font-family: var(--font-display);
  font-size: clamp(2rem, 1.2rem + 2.4vw, 3.25rem);
  font-weight: 600;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.fact__label {
  margin-top: 0.6rem;
  font-size: var(--fs-sm);
  color: var(--text-muted);
}

.about__extra {
  margin-top: 2rem;
  color: var(--text-muted);
}

.about__extra .mono {
  display: block;
  margin-bottom: 0.4rem;
  color: var(--accent);
}

.about__content {
  position: relative;
}

.about__drop {
  position: absolute;
  top: 0;
  right: 4%;
  width: 1px;
  height: 1px;
}

@media (max-width: 900px) {
  .about__grid {
    grid-template-columns: 1fr;
  }

  .about__visual {
    max-width: 380px;
  }

  .facts {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (prefers-reduced-motion: reduce) {
  .photo {
    clip-path: none;
  }
}
</style>
