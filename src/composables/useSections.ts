import { ref } from 'vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SECTIONS, type SectionId } from '@/content/sections'
import { useMercury } from '@/composables/useMercury'

const { engine } = useMercury()
const active = ref<SectionId>('hero')
const progress = ref(0)

type Hooks = { enter?: () => void; leave?: () => void }
const hooks = new Map<SectionId, Hooks>()

/** Секция может сама управлять каплей при входе и выходе (например, песочница) */
export function onSection(id: SectionId, value: Hooks): () => void {
  hooks.set(id, value)
  return () => hooks.delete(id)
}

let sectionTriggers: { index: number; st: ScrollTrigger }[] = []
let progressTrigger: ScrollTrigger | null = null

/** Фон страницы и тип поверхности — по секции */
function applyLook(index: number, instant = false): void {
  const section = SECTIONS[index]
  if (!section) return
  document.documentElement.dataset.surface = section.surface
  gsap.to(document.body, {
    backgroundColor: section.bg,
    duration: instant ? 0 : 0.8,
    ease: 'power2.out',
    overwrite: 'auto',
  })
}

function activate(index: number): void {
  const section = SECTIONS[index]
  if (!section) return
  if (active.value !== section.id) hooks.get(active.value)?.leave?.()
  active.value = section.id
  applyLook(index)
  moveDrop(section.id)
  hooks.get(section.id)?.enter?.()
}

/**
 * После пересчёта ScrollTrigger (смена языка, ресайз, закрепление секции)
 * порядок onToggle не гарантирован — заново определяем секцию по положению скролла.
 */
function sync(): void {
  const current = [...sectionTriggers].reverse().find(({ st }) => st.isActive)
  if (!current) return
  if (SECTIONS[current.index]?.id !== active.value) activate(current.index)
  else applyLook(current.index, true)
}

/**
 * Капля переезжает в секцию: к элементу [data-drop-home] внутри неё.
 * data-drop-size — размер, data-drop-count — сколько частей.
 */
function moveDrop(id: SectionId): void {
  const anchor = document.getElementById(id)?.querySelector<HTMLElement>('[data-drop-home]')
  if (!anchor || !engine.value) return
  engine.value.setHome(anchor, {
    size: Number(anchor.dataset.dropSize ?? 60),
    count: Number(anchor.dataset.dropCount ?? 6),
  })
}

/** Текущая секция, прогресс страницы и смена фона при скролле */
export function useSections() {
  return { active, progress }
}

export function initSections(): void {
  killSections()
  document.body.style.backgroundColor = SECTIONS[0].bg
  document.documentElement.dataset.surface = SECTIONS[0].surface

  SECTIONS.forEach((section, index) => {
    const el = document.getElementById(section.id)
    if (!el) return
    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top 55%',
      end: 'bottom 55%',
      onToggle: (self) => {
        if (self.isActive) activate(index)
      },
    })
    sectionTriggers.push({ index, st })
  })

  progressTrigger = ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (self) => (progress.value = self.progress),
  })

  ScrollTrigger.addEventListener('refresh', sync)
  // секции с закреплением (pin) меняют высоту страницы — пересчитываем позиции
  ScrollTrigger.refresh()
}

export function killSections(): void {
  ScrollTrigger.removeEventListener('refresh', sync)
  for (const { st } of sectionTriggers) st.kill()
  progressTrigger?.kill()
  sectionTriggers = []
  progressTrigger = null
}
