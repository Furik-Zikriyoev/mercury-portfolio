<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { gsap } from 'gsap'
import { useI18n } from '@/content/i18n'

const { t, locale } = useI18n()

const section = ref<HTMLElement | null>(null)
const text = ref<HTMLElement | null>(null)

/** Текст разбивается на слова; *слово* в переводе — акцент */
const words = computed(() => {
  const out: { word: string; accent: boolean }[] = []
  let accent = false
  for (const part of t.value.manifesto.text.split(/(\*)/)) {
    if (part === '*') {
      accent = !accent
      continue
    }
    for (const word of part.split(/\s+/)) if (word) out.push({ word, accent })
  }
  return out
})

let tween: gsap.core.Tween | null = null

function build() {
  tween?.scrollTrigger?.kill()
  tween?.kill()
  const targets = text.value?.querySelectorAll('.word')
  if (!targets?.length || !section.value) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    gsap.set(targets, { opacity: 1 })
    return
  }
  tween = gsap.fromTo(
    targets,
    { opacity: 0.14 },
    {
      opacity: 1,
      ease: 'none',
      stagger: 0.1,
      scrollTrigger: {
        trigger: section.value,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.6,
      },
    },
  )
}

onMounted(build)
watch(locale, () => nextTick(build))
onBeforeUnmount(() => {
  tween?.scrollTrigger?.kill()
  tween?.kill()
})
</script>

<template>
  <section id="manifesto" ref="section" class="manifesto">
    <div class="manifesto__pin">
      <div class="container manifesto__inner">
        <p class="section-index">02 · {{ t.nav.sections.manifesto }}</p>
        <p ref="text" class="manifesto__text">
          <template v-for="(w, i) in words" :key="`${locale}-${i}`">
            <span class="word" :class="{ 'is-accent': w.accent }">{{ w.word }}</span>{{ ' ' }}
          </template>
        </p>
      </div>
      <div class="manifesto__drop" data-drop-home data-drop-size="56" data-drop-count="5" aria-hidden="true" />
    </div>
  </section>
</template>

<style scoped>
.manifesto {
  position: relative;
  height: 260vh;
}

.manifesto__pin {
  position: sticky;
  top: 0;
  display: flex;
  align-items: center;
  height: 100svh;
}

.manifesto__text {
  max-width: 21em;
  margin-top: 2rem;
  font-family: var(--font-display);
  font-size: clamp(1.75rem, 1rem + 3.2vw, 4rem);
  font-weight: 500;
  line-height: 1.18;
  letter-spacing: -0.025em;
}

.word {
  display: inline-block;
}

.word.is-accent {
  color: var(--accent);
}

.manifesto__drop {
  position: absolute;
  right: 12vw;
  bottom: 24%;
  width: 1px;
  height: 1px;
}

@media (max-width: 700px) {
  .manifesto {
    height: 220vh;
  }

  .manifesto__drop {
    right: 14vw;
    bottom: 10%;
  }
}
</style>
