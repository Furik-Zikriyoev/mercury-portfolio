import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

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
