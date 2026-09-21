<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { X } from 'lucide-vue-next'
import { useI18n } from '@/content/i18n'
import { profile } from '@/content/profile'
import { useClock } from '@/composables/useClock'
import { meltAll } from '@/composables/useEasterEggs'
import { useMercury } from '@/composables/useMercury'
import { scrollToTarget } from '@/composables/useSmoothScroll'
import { play, useSound } from '@/composables/useSound'
import { useTerminal } from '@/composables/useTerminal'
import { complete, run, type Line, type TerminalContext } from '@/terminal/commands'

const PROMPT = 'guest@mercury:~$'
const HISTORY_MAX = 50

const { t, setLocale } = useI18n()
const { engine } = useMercury()
const { time } = useClock(profile.timeZone)
const { supported: soundSupported, setSound } = useSound()
const { open, supported, toggle } = useTerminal()

const lines = ref<Line[]>([])
const input = ref('')
const field = ref<HTMLInputElement | null>(null)
const output = ref<HTMLElement | null>(null)
const history: string[] = []
let historyIndex = -1
let greeted = false
let lastFocus: HTMLElement | null = null

async function copy(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    play('copy')
    return true
  } catch {
    return false
  }
}

const ctx: TerminalContext = {
  get t() {
    return t.value
  },
  get engine() {
    return engine.value
  },
  get time() {
    return time.value
  },
  soundSupported,
  setLocale,
  setSound,
  scrollTo: (id) => scrollToTarget(`#${id}`),
  copy,
  clear: () => (lines.value = []),
  close: () => toggle(false),
  melt: () => void meltAll(),
}

async function scrollDown() {
  await nextTick()
  if (output.value) output.value.scrollTop = output.value.scrollHeight
}

async function submit() {
  const value = input.value.trim()
  input.value = ''
  historyIndex = -1
  lines.value.push({ text: `${PROMPT} ${value}`, kind: 'cmd' })
  if (value) {
    if (history[0] !== value) history.unshift(value)
    history.length = Math.min(history.length, HISTORY_MAX)
    const result = await run(value, ctx)
    if (result.some((l) => l.kind === 'err')) play('error')
    lines.value.push(...result)
  }
  await scrollDown()
}

function onFieldKey(e: KeyboardEvent) {
  if (e.key === 'Tab') {
    e.preventDefault()
    input.value = complete(input.value)
    return
  }
  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
    e.preventDefault()
    const next = historyIndex + (e.key === 'ArrowUp' ? 1 : -1)
    historyIndex = Math.max(-1, Math.min(history.length - 1, next))
    input.value = historyIndex === -1 ? '' : (history[historyIndex] ?? '')
    return
  }
  if (e.key === 'l' && e.ctrlKey) {
    e.preventDefault()
    lines.value = []
    return
  }
  if (e.key.length === 1) play('key')
}

/** ` ~ ё Ё — одна и та же клавиша слева от единицы */
function isToggleKey(e: KeyboardEvent): boolean {
  return e.code === 'Backquote' || ['`', '~', 'ё', 'Ё'].includes(e.key)
}

function onWindowKey(e: KeyboardEvent) {
  if (e.metaKey || e.ctrlKey || e.altKey) return
  if (e.key === 'Escape' && open.value) {
    toggle(false)
    return
  }
  if (!isToggleKey(e)) return
  const target = e.target as HTMLElement | null
  const typing = target?.closest('input, textarea, [contenteditable="true"]')
  if (typing && typing !== field.value) return
  e.preventDefault()
  toggle()
}

watch(open, async (value) => {
  play(value ? 'open' : 'close')
  if (value) {
    lastFocus = document.activeElement as HTMLElement | null
    if (!greeted) {
      greeted = true
      lines.value.push({ text: t.value.terminal.welcome, kind: 'muted' })
    }
    await nextTick()
    field.value?.focus({ preventScroll: true })
    await scrollDown()
  } else {
    lastFocus?.focus?.({ preventScroll: true })
  }
})

onMounted(() => {
  if (supported) window.addEventListener('keydown', onWindowKey)
})

onBeforeUnmount(() => window.removeEventListener('keydown', onWindowKey))
</script>

<template>
  <section
    v-if="supported"
    class="term"
    :class="{ 'is-open': open }"
    role="dialog"
    :aria-label="t.terminal.title"
    :aria-hidden="!open"
    :inert="!open"
    data-cursor="plain"
    @click="field?.focus({ preventScroll: true })"
  >
    <header class="term__bar">
      <span class="term__dots" aria-hidden="true"><i /><i /><i /></span>
      <span class="term__title mono">{{ PROMPT.replace('$', '') }}</span>
      <span class="term__hint mono">{{ t.terminal.hint }}</span>
      <button type="button" class="term__close" :aria-label="t.a11y.close" @click.stop="toggle(false)">
        <X :size="16" :stroke-width="1.8" aria-hidden="true" />
      </button>
    </header>

    <div ref="output" class="term__out mono" data-lenis-prevent aria-live="polite">
      <p v-for="(line, i) in lines" :key="i" class="line" :class="`line--${line.kind ?? 'out'}`">
        <a v-if="line.href" :href="line.href" target="_blank" rel="noopener noreferrer">{{ line.text }}</a>
        <template v-else>{{ line.text }}</template>
      </p>

      <form class="term__input" @submit.prevent="submit">
        <label for="term-field" class="term__prompt">{{ PROMPT }}</label>
        <input
          id="term-field"
          ref="field"
          v-model="input"
          class="mono"
          type="text"
          autocomplete="off"
          autocapitalize="off"
          spellcheck="false"
          @keydown="onFieldKey"
        />
      </form>
    </div>
  </section>
</template>

<style scoped>
.term {
  position: fixed;
  top: 12px;
  left: 50%;
  z-index: 60;
  display: flex;
  flex-direction: column;
  width: min(780px, calc(100vw - 24px));
  height: min(460px, 64vh);
  overflow: hidden;
  border-radius: 18px;
  background: rgb(9 9 10 / 0.9);
  backdrop-filter: blur(22px) saturate(1.3);
  -webkit-backdrop-filter: blur(22px) saturate(1.3);
  box-shadow:
    inset 0 0 0 1px rgb(255 255 255 / 0.1),
    0 40px 90px -30px rgb(0 0 0 / 0.85);
  color: #ededee;
  opacity: 0;
  transform: translate(-50%, calc(-100% - 24px));
  transition:
    transform 0.55s var(--ease-out),
    opacity 0.3s;
}

.term.is-open {
  opacity: 1;
  transform: translate(-50%, 0);
}

.term__bar {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  padding: 0.65rem 0.8rem 0.65rem 1rem;
  border-bottom: 1px solid rgb(255 255 255 / 0.08);
}

.term__dots {
  display: flex;
  gap: 6px;
}

.term__dots i {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgb(255 255 255 / 0.16);
}

.term__dots i:first-child {
  background: var(--accent);
}

.term .mono {
  text-transform: none;
  letter-spacing: 0;
}

.term__title {
  font-size: var(--fs-xs);
  color: #8e8e98;
}

.term__hint {
  margin-left: auto;
  font-size: 0.6875rem;
  color: #55555d;
}

.term__close {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  color: #8e8e98;
  transition:
    background var(--dur-fast),
    color var(--dur-fast);
}

.term__close:hover {
  background: rgb(255 255 255 / 0.08);
  color: #ededee;
}

.term__out {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 1.1rem 1.2rem;
  font-size: 0.8125rem;
  line-height: 1.65;
  overscroll-behavior: contain;
  cursor: text;
}

.line {
  white-space: pre-wrap;
  word-break: break-word;
}

.line--muted {
  color: #6f6f78;
}

.line--accent {
  color: var(--accent);
}

.line--err {
  color: #ff8a6b;
}

.line--cmd {
  margin-top: 0.6rem;
  color: #ededee;
}

.line--cmd:first-child {
  margin-top: 0;
}

.line a {
  text-decoration: underline;
  text-decoration-color: rgb(255 255 255 / 0.2);
  text-underline-offset: 3px;
  transition: text-decoration-color var(--dur-fast);
}

.line a:hover {
  text-decoration-color: var(--accent);
}

.term__input {
  display: flex;
  gap: 0.6rem;
  margin-top: 0.6rem;
}

.term__prompt {
  flex-shrink: 0;
  color: var(--accent);
}

.term__input input {
  flex: 1;
  min-width: 0;
  padding: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: #ededee;
  font-size: inherit;
  line-height: inherit;
  caret-color: var(--accent);
}

@media (max-width: 640px) {
  .term__hint {
    display: none;
  }
}
</style>
