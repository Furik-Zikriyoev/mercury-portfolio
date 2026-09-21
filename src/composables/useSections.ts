import { ref } from 'vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SECTIONS, type SectionId } from '@/content/sections'

const active = ref<SectionId>('hero')
const progress = ref(0)
let triggers: ScrollTrigger[] = []

function activate(index: number): void {
  const section = SECTIONS[index]
  if (!section) return
  active.value = section.id
  document.documentElement.dataset.surface = section.surface
  gsap.to(document.body, { backgroundColor: section.bg, duration: 0.8, ease: 'power2.out' })
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
    triggers.push(
      ScrollTrigger.create({
        trigger: el,
        start: 'top 55%',
        end: 'bottom 55%',
        onToggle: (self) => {
          if (self.isActive) activate(index)
        },
      }),
    )
  })

  triggers.push(
    ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => (progress.value = self.progress),
    }),
  )
}

export function killSections(): void {
  for (const t of triggers) t.kill()
  triggers = []
}
