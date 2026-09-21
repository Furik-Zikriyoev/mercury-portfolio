<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import {
  ArrowUp,
  ArrowUpRight,
  Check,
  Copy,
  FileText,
  Github,
  Instagram,
  Linkedin,
  Mail,
  Phone,
  Send,
} from 'lucide-vue-next'
import MercuryText from '@/components/MercuryText.vue'
import { useI18n } from '@/content/i18n'
import { profile } from '@/content/profile'
import { useClock } from '@/composables/useClock'
import { onSection } from '@/composables/useSections'
import { scrollToTarget } from '@/composables/useSmoothScroll'
import { vMagnetic } from '@/directives/magnetic'
import { vReveal } from '@/directives/reveal'

const { t } = useI18n()
const { time } = useClock(profile.timeZone)

const ICONS = {
  telegram: Send,
  github: Github,
  linkedin: Linkedin,
  instagram: Instagram,
  hh: ArrowUpRight,
}

interface Row {
  id: string
  label: string
  value: string
  href: string
  icon: typeof Phone
  /** что копировать по кнопке; пусто — кнопки нет */
  copy: string
  external: boolean
}

const rows = computed<Row[]>(() => [
  {
    id: 'phone',
    label: t.value.contact.phone,
    value: profile.phoneDisplay,
    href: `tel:${profile.phone}`,
    icon: Phone,
    copy: profile.phone,
    external: false,
  },
  {
    id: 'email',
    label: t.value.contact.email,
    value: profile.email,
    href: `mailto:${profile.email}`,
    icon: Mail,
    copy: profile.email,
    external: false,
  },
  ...profile.socials.map((s) => ({
    id: s.id,
    label: s.label,
    value: s.handle,
    href: s.href,
    icon: ICONS[s.id],
    copy: '',
    external: true,
  })),
])

const title = ref<InstanceType<typeof MercuryText> | null>(null)
const copiedId = ref<string | null>(null)
const year = new Date().getFullYear()
let copiedTimer = 0
let unregister: (() => void) | null = null

async function copy(row: Row) {
  try {
    await navigator.clipboard.writeText(row.copy)
    copiedId.value = row.id
    window.clearTimeout(copiedTimer)
    copiedTimer = window.setTimeout(() => (copiedId.value = null), 1800)
  } catch {
    // без доступа к буферу остаётся обычная ссылка
  }
}

onMounted(() => {
  // металл возвращается к последнему заголовку страницы
  unregister = onSection('contact', {
    enter: () => void title.value?.form({ from: 'home', duration: 1.4 }),
  })
})

onBeforeUnmount(() => {
  unregister?.()
  window.clearTimeout(copiedTimer)
})
</script>

<template>
  <section id="contact" class="contact">
    <div class="contact__main container">
      <header class="contact__head">
        <h2 class="section-index">07 · {{ t.nav.sections.contact }}</h2>
        <p class="contact__title">
          <MercuryText ref="title" :text="t.contact.title" :auto="false" class="chrome-text" />
        </p>
        <div class="contact__drop" data-drop-home data-drop-size="40" data-drop-count="3" aria-hidden="true" />
      </header>

      <div class="contact__info">
        <p v-reveal class="contact__lead">{{ t.contact.lead }}</p>

        <div v-reveal="100" class="contact__status mono">
          <span class="contact__pulse" aria-hidden="true" />
          <span>{{ t.hero.status }}</span>
          <span class="contact__sep" aria-hidden="true">·</span>
          <span>{{ t.hero.localTime }} <span class="contact__time">{{ time }}</span></span>
        </div>

        <a
          v-if="profile.resumeUrl"
          v-reveal="160"
          v-magnetic
          class="btn contact__resume"
          :href="profile.resumeUrl"
          target="_blank"
          rel="noopener"
        >
          <FileText :size="18" :stroke-width="1.8" aria-hidden="true" />
          {{ t.contact.resume }}
        </a>
      </div>

      <ul class="rows">
        <li v-for="(row, i) in rows" :key="row.id" v-reveal="i * 70" class="row">
          <a
            class="row__link"
            :href="row.href"
            :target="row.external ? '_blank' : undefined"
            :rel="row.external ? 'noopener' : undefined"
          >
            <span class="row__icon"><component :is="row.icon" :size="18" :stroke-width="1.8" aria-hidden="true" /></span>
            <span class="row__label mono">{{ row.label }}</span>
            <span class="row__value">{{ row.value }}</span>
            <ArrowUpRight class="row__arrow" :size="20" :stroke-width="1.6" aria-hidden="true" />
          </a>
          <button
            v-if="row.copy"
            type="button"
            class="row__copy"
            :class="{ 'is-done': copiedId === row.id }"
            :aria-label="`${copiedId === row.id ? t.contact.copied : t.contact.copy}: ${row.value}`"
            :title="copiedId === row.id ? t.contact.copied : t.contact.copy"
            @click="copy(row)"
          >
            <component
              :is="copiedId === row.id ? Check : Copy"
              :size="16"
              :stroke-width="1.8"
              aria-hidden="true"
            />
          </button>
        </li>
      </ul>
    </div>

    <footer class="footer container">
      <span>© {{ year }} {{ t.contact.footer.name }}</span>
      <span class="footer__built">{{ t.contact.footer.built }}</span>
      <button type="button" class="footer__top" @click="scrollToTarget('#hero')">
        {{ t.contact.footer.top }}
        <ArrowUp :size="15" :stroke-width="1.8" aria-hidden="true" />
      </button>
    </footer>
  </section>
</template>

<style scoped>
.contact {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 100svh;
  padding-top: var(--section-space);
  border-top: 1px solid var(--line);
}

.contact__main {
  display: grid;
  flex: 1;
  align-content: center;
  gap: clamp(2rem, 5vw, 4rem);
}

.contact__head {
  position: relative;
}

.contact__title {
  margin-top: 1rem;
  font-family: var(--font-display);
  font-size: var(--fs-3xl);
  font-weight: 700;
  letter-spacing: -0.04em;
  line-height: 1;
}

.contact__drop {
  position: absolute;
  top: 1rem;
  right: 6%;
  width: 1px;
  height: 1px;
}

.contact__lead {
  max-width: 30em;
  font-size: var(--fs-lg);
  line-height: 1.55;
  color: var(--text-muted);
}

.contact__status {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.6rem;
  margin-top: 1.75rem;
  font-size: var(--fs-sm);
  color: var(--text-muted);
}

.contact__pulse {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent);
  animation: pulse 2s infinite;
}

.contact__time {
  color: var(--accent);
  font-variant-numeric: tabular-nums;
}

.contact__sep {
  color: var(--text-faint);
}

.contact__resume {
  margin-top: 2rem;
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

/* ---------- строки контактов ---------- */
.rows {
  border-top: 1px solid var(--line);
}

.row {
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--line);
}

.row__link {
  position: relative;
  display: grid;
  flex: 1;
  grid-template-columns: auto 6.25rem 1fr auto;
  align-items: center;
  gap: 0.9rem;
  min-width: 0;
  padding: clamp(0.8rem, 1.6vw, 1.1rem) 0.25rem;
  isolation: isolate;
}

/* заливка, которая натекает слева при наведении */
.row__link::before {
  content: '';
  position: absolute;
  inset: 0 -0.75rem;
  z-index: -1;
  border-radius: var(--radius-sm);
  background: var(--accent-soft);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform var(--dur-med) var(--ease-out);
}

.row__icon {
  display: grid;
  place-items: center;
  width: 2.25rem;
  height: 2.25rem;
  border: 1px solid var(--line-strong);
  border-radius: 50%;
  color: var(--text-muted);
  transition:
    color var(--dur-fast),
    border-color var(--dur-fast),
    background var(--dur-fast);
}

.row__label {
  font-size: var(--fs-xs);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-faint);
}

.row__value {
  overflow: hidden;
  font-family: var(--font-display);
  font-size: clamp(1.0625rem, 0.85rem + 0.7vw, 1.4rem);
  font-weight: 600;
  letter-spacing: -0.02em;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: transform var(--dur-med) var(--ease-out);
}

.row__arrow {
  color: var(--text-faint);
  transition:
    transform var(--dur-med) var(--ease-out),
    color var(--dur-fast);
}

@media (hover: hover) {
  .row__link:hover::before {
    transform: none;
  }

  .row__link:hover .row__icon {
    border-color: var(--accent);
    background: var(--accent);
    color: var(--accent-contrast);
  }

  .row__link:hover .row__value {
    transform: translateX(0.5rem);
  }

  .row__link:hover .row__arrow {
    color: var(--accent);
    transform: rotate(45deg);
  }
}

.row__link:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 4px;
  border-radius: var(--radius-sm);
}

.row__copy {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: 2.5rem;
  height: 2.5rem;
  margin-left: 0.75rem;
  border: 1px solid var(--line-strong);
  border-radius: 50%;
  color: var(--text-muted);
  transition:
    color var(--dur-fast),
    border-color var(--dur-fast),
    transform var(--dur-fast) var(--ease-spring);
}

.row__copy:active {
  transform: scale(0.9);
}

.row__copy:hover {
  border-color: var(--text-muted);
  color: var(--text);
}

.row__copy.is-done {
  border-color: var(--accent);
  color: var(--accent);
}

/* ---------- подвал ---------- */
.footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem 2rem;
  margin-top: var(--section-space);
  padding-block: 1.75rem;
  border-top: 1px solid var(--line);
  font-size: var(--fs-sm);
  color: var(--text-faint);
}

.footer__top {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: var(--text-muted);
  transition: color var(--dur-fast);
}

.footer__top:hover {
  color: var(--accent);
}

@media (min-width: 1024px) {
  .contact__main {
    grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
    column-gap: clamp(3rem, 6vw, 6rem);
    align-items: start;
  }

  .contact__head {
    grid-column: 1 / -1;
  }
}

@media (max-width: 640px) {
  .row__link {
    grid-template-columns: auto 1fr auto;
    row-gap: 0.15rem;
  }

  .row__label {
    grid-column: 2;
    grid-row: 1;
  }

  .row__value {
    grid-column: 2;
    grid-row: 2;
  }

  .row__icon {
    grid-row: 1 / 3;
  }

  .row__arrow {
    grid-column: 3;
    grid-row: 1 / 3;
  }

  .footer {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
