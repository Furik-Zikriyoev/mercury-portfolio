import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)
// ScrollTrigger при регистрации запоминает history.scrollRestoration ('auto', потому что импорт
// срабатывает раньше строки в main.ts) и возвращает его при каждом refresh.
// Без этого браузер после перезагрузки восстанавливает позицию скролла.
ScrollTrigger.clearScrollMemory('manual')

let lenis: Lenis | null = null
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

const tick = (time: number) => lenis?.raf(time * 1000)

/** Плавный скролл (Lenis), синхронизированный с ScrollTrigger */
export function initSmoothScroll(): void {
  if (lenis || reduced()) return
  lenis = new Lenis({ lerp: 0.1, smoothWheel: true })
  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add(tick)
  gsap.ticker.lagSmoothing(0)
}

export function destroySmoothScroll(): void {
  gsap.ticker.remove(tick)
  lenis?.destroy()
  lenis = null
}

export function scrollToTarget(target: string | HTMLElement): void {
  if (lenis) {
    lenis.scrollTo(target, { duration: 1.4 })
    return
  }
  const el = typeof target === 'string' ? document.querySelector(target) : target
  el?.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth' })
}

export function lockScroll(locked: boolean): void {
  document.documentElement.classList.toggle('is-locked', locked)
  if (locked) lenis?.stop()
  else lenis?.start()
}

/** Переход между страницами: в начало и пересчёт триггеров */
export function resetScroll(): void {
  lenis?.scrollTo(0, { immediate: true })
  window.scrollTo(0, 0)
  requestAnimationFrame(() => requestAnimationFrame(() => ScrollTrigger.refresh()))
}

/** Прокрутка к координате страницы (нужна секциям со sticky-сценой) */
export function scrollToY(y: number): void {
  if (lenis) {
    lenis.scrollTo(y, { duration: 1 })
    return
  }
  window.scrollTo({ top: y, behavior: reduced() ? 'auto' : 'smooth' })
}
