import { watch } from 'vue'
import { useI18n } from '@/content/i18n'
import { useMercury } from '@/composables/useMercury'
import { play, playDrop } from '@/composables/useSound'

/**
 * Мелочи для тех, кто копается:
 *  - сообщение в консоли DevTools;
 *  - набрать Z F F на странице — весь металл осыпается и собирается обратно;
 *  - звуки: наведение на ссылки и кнопки, слияние капель в песочнице.
 */

/** Z F F — по кодам клавиш, поэтому работает и на русской раскладке (Я А А) */
const SECRET = ['KeyZ', 'KeyF', 'KeyF']

let installed = false

/** Металл осыпается и собирается обратно (Z F F на странице или команда zff в терминале) */
export async function meltAll(): Promise<void> {
  const { engine, textOwner } = useMercury()
  const m = engine.value
  if (!m) return
  play('drop')
  await m.melt()
  // металл не вернулся в текст (он уже за экраном) — MercuryText снова показывает обычный текст
  if (!m.hasText) textOwner.value = null
}
let cleanup: (() => void) | null = null

function greet(lines: string[]): void {
  console.log(
    '%cMercury',
    'font: 800 32px/1.2 Unbounded, system-ui, sans-serif; color: #ff6a2b; letter-spacing: -1px;',
  )
  for (const line of lines) console.log(`%c${line}`, 'font: 13px/1.6 system-ui, sans-serif; color: #8e8e98;')
}

export function installEasterEggs(): void {
  if (installed) return
  installed = true

  const { t } = useI18n()
  const { engine } = useMercury()

  greet(t.value.console)

  // Z F F
  let step = 0
  const onKey = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement | null
    if (target?.closest('input, textarea') || e.metaKey || e.ctrlKey || e.altKey) return
    step = e.code === SECRET[step] ? step + 1 : e.code === SECRET[0] ? 1 : 0
    if (step === SECRET.length) {
      step = 0
      void meltAll()
    }
  }
  window.addEventListener('keydown', onKey)

  // звук при наведении на интерактивные элементы
  let hovered: Element | null = null
  const onOver = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return
    const el = (e.target as Element | null)?.closest('a, button')
    if (el && el !== hovered) play('hover')
    hovered = el ?? null
  }
  document.addEventListener('pointerover', onOver, { passive: true })

  // звук слияния капель
  const stop = watch(
    engine,
    (m) => {
      if (m) m.onMerge = playDrop
    },
    { immediate: true },
  )

  cleanup = () => {
    window.removeEventListener('keydown', onKey)
    document.removeEventListener('pointerover', onOver)
    stop()
    if (engine.value) engine.value.onMerge = null
    installed = false
  }
}

export function removeEasterEggs(): void {
  cleanup?.()
  cleanup = null
}
