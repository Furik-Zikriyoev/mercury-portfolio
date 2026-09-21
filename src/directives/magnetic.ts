import type { Directive } from 'vue'

/**
 * v-magnetic — элемент «притягивается» к курсору, когда тот рядом.
 *   <a v-magnetic />         — сила по умолчанию 0.3
 *   <a v-magnetic="0.5" />   — сильнее
 */
type Handlers = { move: (e: PointerEvent) => void; leave: () => void }
const handlers = new WeakMap<HTMLElement, Handlers>()

const canAnimate = () =>
  window.matchMedia('(pointer: fine)').matches &&
  !window.matchMedia('(prefers-reduced-motion: reduce)').matches

export const vMagnetic: Directive<HTMLElement, number | undefined> = {
  mounted(el, binding) {
    if (!canAnimate()) return
    const strength = binding.value ?? 0.3
    el.style.transition = 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)'

    const move = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect()
      const x = e.clientX - (rect.left + rect.width / 2)
      const y = e.clientY - (rect.top + rect.height / 2)
      el.style.transform = `translate3d(${x * strength}px, ${y * strength}px, 0)`
    }
    const leave = () => {
      el.style.transform = ''
    }

    el.addEventListener('pointermove', move)
    el.addEventListener('pointerleave', leave)
    handlers.set(el, { move, leave })
  },
  unmounted(el) {
    const h = handlers.get(el)
    if (!h) return
    el.removeEventListener('pointermove', h.move)
    el.removeEventListener('pointerleave', h.leave)
  },
}
