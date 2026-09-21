import { ref } from 'vue'
import { supportsWebGL2 } from '@/engine/gl'
import { lockScroll } from '@/composables/useSmoothScroll'

const KEY = 'mercury-intro-seen'
const running = ref(false)
let safety = 0

function readSeen(): boolean {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

/** Было ли интро показано раньше — тогда показываем короткую версию */
export const introSeen = readSeen()

/**
 * Вызывается до монтирования приложения: прячет интерфейс, пока капли собираются в имя.
 * Без WebGL2 или при «уменьшить движение» интро не запускается.
 */
export function startIntroGate(): void {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduced || !supportsWebGL2()) return
  running.value = true
  document.documentElement.classList.add('is-intro')
  safety = window.setTimeout(finishIntro, 8000)
}

export function finishIntro(): void {
  if (!running.value) return
  running.value = false
  window.clearTimeout(safety)
  document.documentElement.classList.remove('is-intro')
  lockScroll(false)
  try {
    localStorage.setItem(KEY, '1')
  } catch {
    /* ignore */
  }
}

export function useIntro() {
  return { running }
}
