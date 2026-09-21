<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Terminal, Volume2, VolumeX } from 'lucide-vue-next'
import LangSwitch from '@/components/LangSwitch.vue'
import { useI18n } from '@/content/i18n'
import { profile } from '@/content/profile'
import { SECTIONS, type SectionId } from '@/content/sections'
import { useClock } from '@/composables/useClock'
import { useSections } from '@/composables/useSections'
import { useMercury } from '@/composables/useMercury'
import { scrollToTarget } from '@/composables/useSmoothScroll'
import { play, useSound } from '@/composables/useSound'
import { useTerminal } from '@/composables/useTerminal'

const { t } = useI18n()
const { active, progress } = useSections()
const { time } = useClock(profile.timeZone)

const { engine } = useMercury()
const { enabled: sound, supported: soundSupported, setSound } = useSound()
const terminal = useTerminal()

const open = ref(false)
const orb = ref<HTMLElement | null>(null)
const copied = ref(false)
let closeTimer = 0
let copiedTimer = 0

const label = computed(() => t.value.nav.sections[active.value])
const ring = computed(() => 2 * Math.PI * 9 * (1 - progress.value))
const percent = computed(() => Math.round(progress.value * 100))

function show() {
  window.clearTimeout(closeTimer)
  open.value = true
}

function hide(delay = 180) {
  window.clearTimeout(closeTimer)
  closeTimer = window.setTimeout(() => (open.value = false), delay)
}

/** Тройной клик по капле в капсуле — брызги */
function onBarClick(e: MouseEvent) {
  if (e.detail === 3 && orb.value) {
    const r = orb.value.getBoundingClientRect()
    engine.value?.splash(r.left + r.width / 2, r.top + r.height / 2, 12)
    play('drop')
    return
  }
  if (e.detail > 1) return
  if (open.value) hide(0)
  else show()
}

function openTerminal() {
  hide(0)
  terminal.toggle(true)
}

function go(id: SectionId) {
  hide(0)
  scrollToTarget(`#${id}`)
}

async function copyPhone() {
  try {
    await navigator.clipboard.writeText(profile.phone)
    copied.value = true
    play('copy')
    window.clearTimeout(copiedTimer)
    copiedTimer = window.setTimeout(() => (copied.value = false), 1800)
  } catch {
    window.location.href = `tel:${profile.phone}`
  }
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape' && open.value) hide(0)
}

// пока меню открыто, холст с металлом уходит под затемнение и не перекрывает панель
watch(open, (value) => {
  document.documentElement.classList.toggle('menu-open', value)
  play(value ? 'open' : 'close')
})

onMounted(() => window.addEventListener('keydown', onKey))

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  document.documentElement.classList.remove('menu-open')
  window.clearTimeout(closeTimer)
  window.clearTimeout(copiedTimer)
})
</script>

<template>
  <div class="scrim" :class="{ 'is-on': open }" aria-hidden="true" />

  <nav
    class="capsule"
    :class="{ 'is-open': open }"
    :aria-label="t.a11y.nav"
    data-cursor="plain"
    data-reveal
    style="--i: 5"
    @mouseenter="show"
    @mouseleave="hide()"
  >
    <button
      type="button"
      class="capsule__bar"
      :aria-expanded="open"
      aria-controls="capsule-panel"
      @click="onBarClick"
    >
      <span ref="orb" class="capsule__orb" aria-hidden="true">
        <svg viewBox="0 0 22 22">
          <circle class="capsule__track" cx="11" cy="11" r="9" />
          <circle class="capsule__progress" cx="11" cy="11" r="9" :style="{ strokeDashoffset: ring }" />
        </svg>
      </span>
      <span class="capsule__label">
        <Transition name="swap" mode="out-in">
          <span :key="label">{{ label }}</span>
        </Transition>
      </span>
    </button>

    <div id="capsule-panel" class="capsule__panel">
      <div class="capsule__clip">
        <div class="capsule__body">
          <ul class="links">
            <li v-for="(s, i) in SECTIONS" :key="s.id" :style="{ '--d': i }">
              <a
                :href="`#${s.id}`"
                class="link"
                :class="{ 'is-active': active === s.id }"
                @click.prevent="go(s.id)"
              >
                <span class="link__num mono">{{ String(i).padStart(2, '0') }}</span>
                <span class="link__name">{{ t.nav.sections[s.id] }}</span>
                <span class="link__arrow" aria-hidden="true">→</span>
              </a>
            </li>
          </ul>

          <aside class="card" :style="{ '--d': 8 }">
            <p class="card__status">
              <span class="card__pulse" />
              {{ t.hero.status }}
            </p>
            <p class="card__time">{{ time }}</p>
            <p class="card__tz mono">{{ t.nav.timezone }}</p>

            <button type="button" class="card__phone" @click="copyPhone">
              <span class="card__phone-number">{{ profile.phoneDisplay }}</span>
              <span class="card__phone-action mono">{{ copied ? t.nav.copied : t.nav.copy }}</span>
            </button>

            <ul class="card__socials">
              <li>
                <a :href="`mailto:${profile.email}`">{{ t.contact.email }} ↗</a>
              </li>
              <li v-for="s in profile.socials" :key="s.id">
                <a :href="s.href" target="_blank" rel="noopener noreferrer">{{ s.label }} ↗</a>
              </li>
            </ul>
          </aside>
        </div>

        <footer class="capsule__footer">
          <div class="tools">
            <LangSwitch />
            <button
              v-if="soundSupported"
              type="button"
              class="tool"
              :class="{ 'is-on': sound }"
              :aria-label="sound ? t.nav.soundOff : t.nav.soundOn"
              :title="sound ? t.nav.soundOff : t.nav.soundOn"
              :aria-pressed="sound"
              @click="setSound(!sound)"
            >
              <component :is="sound ? Volume2 : VolumeX" :size="16" :stroke-width="1.8" aria-hidden="true" />
            </button>
            <button
              v-if="terminal.supported"
              type="button"
              class="tool tool--wide"
              :title="t.nav.terminal"
              @click="openTerminal"
            >
              <Terminal :size="16" :stroke-width="1.8" aria-hidden="true" />
              <span class="mono">{{ t.nav.terminal }}</span>
              <kbd class="mono">~</kbd>
            </button>
          </div>
          <span class="mono capsule__read">{{ t.nav.scrolled }} · {{ percent }}%</span>
        </footer>
      </div>
    </div>
  </nav>
</template>

<style scoped>
/* затемнение страницы за открытым меню */
.scrim {
  position: fixed;
  inset: 0;
  z-index: 49;
  background: rgb(0 0 0 / 0.45);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.5s var(--ease-out);
}

.scrim.is-on {
  opacity: 1;
}

.capsule {
  /* капсула всегда тёмная, независимо от фона секции */
  --text: #ededee;
  --text-muted: #8e8e98;
  --line: rgb(255 255 255 / 0.08);
  --line-strong: rgb(255 255 255 / 0.16);
  --w: 230px;
  position: fixed;
  top: 14px;
  left: 50%;
  z-index: 50;
  width: var(--w);
  translate: -50% 0;
  border-radius: 26px;
  background: rgb(8 8 9 / 0.86);
  backdrop-filter: blur(24px) saturate(1.4);
  -webkit-backdrop-filter: blur(24px) saturate(1.4);
  box-shadow:
    inset 0 0 0 1px rgb(255 255 255 / 0.08),
    0 24px 60px -24px rgb(0 0 0 / 0.7);
  color: #ededee;
  transition:
    width 0.6s var(--ease-spring),
    border-radius 0.6s var(--ease-out);
}

.capsule.is-open {
  --w: min(760px, calc(100vw - 24px));
  border-radius: 30px;
}

/* ---------- полоса ---------- */
.capsule__bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.7rem;
  width: 100%;
  height: 46px;
  padding: 0 0.55rem;
}

.capsule__orb {
  position: relative;
  flex: none;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background:
    radial-gradient(circle at 35% 30%, #fff 0 8%, transparent 26%),
    radial-gradient(circle at 50% 55%, #cfcfd6 0%, #7c7c85 40%, #1b1b1f 68%, #6b6b72 100%);
}

.capsule__orb svg {
  position: absolute;
  inset: -4px;
  width: calc(100% + 8px);
  height: calc(100% + 8px);
  transform: rotate(-90deg);
}

.capsule__track,
.capsule__progress {
  fill: none;
  stroke-width: 1.5;
}

.capsule__track {
  stroke: rgb(255 255 255 / 0.1);
}

.capsule__progress {
  stroke: var(--accent);
  stroke-linecap: round;
  stroke-dasharray: 56.55;
  transition: stroke-dashoffset 0.2s linear;
}

.capsule__label {
  overflow: hidden;
  font-weight: 600;
  font-size: var(--fs-sm);
  white-space: nowrap;
}

.capsule__label > span {
  display: inline-block;
}

/* ---------- раскрытие ---------- */
.capsule__panel {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.6s var(--ease-out);
}

.is-open .capsule__panel {
  grid-template-rows: 1fr;
}

.capsule__clip {
  min-height: 0;
  overflow: hidden;
}

.capsule__body {
  display: grid;
  grid-template-columns: 1.45fr 1fr;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem 0.75rem;
}

.links li,
.card {
  opacity: 0;
  transform: translateY(10px);
  transition:
    opacity 0.3s,
    transform 0.5s var(--ease-out);
}

.is-open .links li,
.is-open .card {
  opacity: 1;
  transform: none;
  transition-delay: calc(var(--d) * 35ms + 150ms);
}

/* ---------- разделы ---------- */
.links {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.25rem;
}

.link {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 0.8rem 0.9rem;
  border-radius: 16px;
  transition: background-color 0.3s;
}

.link__num {
  color: rgb(255 255 255 / 0.32);
  transition: color 0.3s;
}

.link__name {
  font-family: var(--font-display);
  font-size: 1.05rem;
  font-weight: 500;
  letter-spacing: -0.01em;
  color: rgb(255 255 255 / 0.78);
  transition:
    color 0.3s,
    transform 0.45s var(--ease-out);
}

.link__arrow {
  position: absolute;
  right: 0.9rem;
  bottom: 0.85rem;
  color: var(--accent);
  opacity: 0;
  transform: translateX(-8px);
  transition:
    opacity 0.3s,
    transform 0.45s var(--ease-out);
}

.link:hover {
  background: rgb(255 255 255 / 0.05);
}

.link:hover .link__name {
  color: #fff;
  transform: translateX(4px);
}

.link:hover .link__arrow {
  opacity: 1;
  transform: none;
}

.link.is-active .link__num {
  color: var(--accent);
}

.link.is-active .link__name {
  color: #fff;
}

.link.is-active::before {
  content: '';
  position: absolute;
  top: 0.95rem;
  right: 0.95rem;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 12px var(--accent);
}

/* ---------- карточка ---------- */
.card {
  display: flex;
  flex-direction: column;
  padding: 1.1rem;
  border-radius: 20px;
  background:
    radial-gradient(120% 90% at 100% 0%, rgb(255 106 43 / 0.16), transparent 55%),
    rgb(255 255 255 / 0.03);
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.07);
}

.card__status {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  font-size: var(--fs-sm);
  font-weight: 600;
}

.card__pulse {
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
    box-shadow: 0 0 0 9px transparent;
  }
}

.card__time {
  margin-top: 1.1rem;
  font-family: var(--font-display);
  font-size: 2rem;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
  line-height: 1;
}

.card__tz {
  margin-top: 0.4rem;
  color: rgb(255 255 255 / 0.4);
}

.card__phone {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.25rem;
  margin-top: auto;
  padding: 0.75rem 0.85rem;
  border-radius: 14px;
  background: rgb(255 255 255 / 0.05);
  text-align: left;
  transition: background-color 0.3s;
}

.card__phone:hover {
  background: rgb(255 255 255 / 0.09);
}

.card__phone-number {
  font-weight: 600;
  font-size: 1rem;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.01em;
}

.card__phone-action {
  color: var(--accent);
}

.card__socials {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem 1rem;
  margin-top: 0.85rem;
  font-size: var(--fs-sm);
  color: rgb(255 255 255 / 0.65);
}

.card__socials a:hover {
  color: #fff;
}

/* ---------- низ ---------- */
.capsule__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.7rem 1.1rem 0.9rem;
  border-top: 1px solid rgb(255 255 255 / 0.06);
}

.capsule__read {
  color: rgb(255 255 255 / 0.4);
}

.tools {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.tool {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  height: 40px;
  min-width: 40px;
  padding: 0 0.7rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-pill);
  background: rgb(255 255 255 / 0.03);
  color: var(--text-muted);
  font-size: var(--fs-xs);
  transition:
    color var(--dur-fast),
    border-color var(--dur-fast);
}

.tool:hover {
  border-color: var(--line-strong);
  color: var(--text);
}

.tool.is-on {
  color: var(--accent);
}

.tool kbd {
  padding: 0.05rem 0.4rem;
  border-radius: 6px;
  background: rgb(255 255 255 / 0.08);
  font-size: 0.6875rem;
}

@media (max-width: 560px) {
  .tool--wide span {
    display: none;
  }
}

.swap-enter-active,
.swap-leave-active {
  transition:
    opacity 0.25s,
    transform 0.35s var(--ease-out);
}

.swap-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.swap-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@media (max-width: 720px) {
  .capsule__body {
    grid-template-columns: 1fr;
  }

  .card__time {
    font-size: 1.6rem;
  }

  .card__phone {
    margin-top: 1rem;
  }
}
</style>
