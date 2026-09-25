<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ArrowLeft, ArrowRight } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
import MercuryText from '@/components/MercuryText.vue'
import WorkBanner from '@/components/works/WorkBanner.vue'
import { useI18n } from '@/content/i18n'
import { profile } from '@/content/profile'
import { WORKS } from '@/content/works'
import { useMercury } from '@/composables/useMercury'
import { vReveal } from '@/directives/reveal'

const { t } = useI18n()
const { engine, textOwner } = useMercury()

const title = ref<InstanceType<typeof MercuryText> | null>(null)
const anchor = ref<HTMLElement | null>(null)
const telegram = profile.socials.find((s) => s.id === 'telegram')

// заголовок вкладки и адрес страницы работ
watch(
  t,
  (messages) => (document.title = messages.works.metaTitle),
  { immediate: true },
)

onMounted(() => {
  document.body.style.backgroundColor = '#0b0b0c'
  document.documentElement.dataset.surface = 'dark'
  if (anchor.value) engine.value?.setHome(anchor.value, { size: 46, count: 4 })
  void title.value?.form({ from: 'home', duration: 1.4 })
})

onBeforeUnmount(() => {
  document.title = t.value.meta.title
  // металл отдаёт заголовок странице, на которую уходим
  if (textOwner.value) void title.value?.release('collect')
})
</script>

<template>
  <main class="works">
    <header class="head container">
      <RouterLink to="/" class="back mono">
        <ArrowLeft :size="15" :stroke-width="1.8" aria-hidden="true" />
        {{ t.works.back }}
      </RouterLink>

      <h1 class="head__title">
        <MercuryText ref="title" :text="t.works.title" :auto="false" class="chrome-text" />
      </h1>
      <p v-reveal class="head__lead">{{ t.works.lead }}</p>
      <div ref="anchor" class="head__drop" aria-hidden="true" />
    </header>

    <WorkBanner v-for="(work, i) in WORKS" :key="work.slug" :work="work" :index="i" />

    <section class="outro" data-surface="dark">
      <div class="container">
        <p v-reveal class="outro__label mono">{{ t.works.outroLabel }}</p>
        <p class="outro__big chrome-text">{{ t.works.outroTitle }}</p>
        <p v-reveal="60" class="outro__sub">{{ t.works.outroSub }}</p>

        <div class="outro__actions">
          <a class="btn" :href="`mailto:${profile.email}`">
            {{ t.hero.cta }}
            <ArrowRight :size="17" :stroke-width="1.8" aria-hidden="true" />
          </a>
          <a v-if="telegram" class="outro__link mono" :href="telegram.href" target="_blank" rel="noopener">
            {{ telegram.label }} ↗
          </a>
          <RouterLink to="/" class="outro__link mono">{{ t.works.home }}</RouterLink>
        </div>

        <p class="outro__note mono">{{ t.works.note }}</p>
      </div>
    </section>

  </main>
</template>

<style scoped>
.works {
  padding-top: clamp(6rem, 14vh, 9rem);
}

/* ---------- шапка ---------- */
.head {
  position: relative;
  padding-bottom: clamp(3rem, 8vh, 5rem);
}

.back {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: var(--fs-xs);
  color: var(--text-muted);
  transition: color var(--dur-fast);
}

.back:hover {
  color: var(--accent);
}

.head__title {
  margin-top: 1.5rem;
  font-family: var(--font-display);
  font-size: var(--fs-3xl);
  font-weight: 700;
  letter-spacing: -0.04em;
  line-height: 1;
}

.head__lead {
  margin-top: 1.5rem;
  max-width: 32em;
  font-size: var(--fs-lg);
  line-height: 1.55;
  color: var(--text-muted);
}

.head__drop {
  position: absolute;
  top: 2rem;
  right: 8%;
  width: 1px;
  height: 1px;
}

/* ---------- конец страницы ---------- */
.outro {
  padding-block: clamp(5rem, 14vh, 9rem);
  border-top: 1px solid var(--line);
  background: var(--bg);
  text-align: center;
}

.outro__label {
  font-size: var(--fs-xs);
  color: var(--text-faint);
}

.outro__big {
  margin-top: 1rem;
  font-family: var(--font-display);
  font-size: clamp(2rem, 0.8rem + 5.4vw, 5.5rem);
  font-weight: 800;
  letter-spacing: -0.045em;
  line-height: 0.95;
  text-transform: uppercase;
  text-wrap: balance;
}

.outro__sub {
  margin: 1.5rem auto 0;
  max-width: 26em;
  font-size: var(--fs-lg);
  color: var(--text-muted);
}

.outro__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 1.25rem;
  margin-top: 2.25rem;
}

.outro__link {
  font-size: var(--fs-xs);
  color: var(--text-muted);
  transition: color var(--dur-fast);
}

.outro__link:hover {
  color: var(--accent);
}

.outro__note {
  margin-top: 2.5rem;
  font-size: var(--fs-xs);
  color: var(--text-faint);
}

</style>
