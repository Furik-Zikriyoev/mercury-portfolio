import { ref, watch } from 'vue'

/**
 * Звуки без аудиофайлов: всё собирается из осцилляторов Web Audio.
 * По умолчанию выключены, выбор хранится в localStorage.
 * На сенсорных устройствах недоступны.
 */

export type SoundName = 'drop' | 'hover' | 'open' | 'close' | 'key' | 'error' | 'copy'

const KEY = 'sound'
const supported =
  typeof window !== 'undefined' &&
  'AudioContext' in window &&
  window.matchMedia('(pointer: fine)').matches

function readSaved(): boolean {
  try {
    return localStorage.getItem(KEY) === 'on'
  } catch {
    return false
  }
}

const enabled = ref(supported && readSaved())
watch(enabled, (on) => {
  try {
    localStorage.setItem(KEY, on ? 'on' : 'off')
  } catch {
    /* ignore */
  }
})

// браузер разрешает звук только после жеста пользователя — до первого клика или клавиши молчим
let unlocked = false
if (supported) {
  const unlock = () => {
    unlocked = true
    window.removeEventListener('pointerdown', unlock, true)
    window.removeEventListener('keydown', unlock, true)
  }
  window.addEventListener('pointerdown', unlock, true)
  window.addEventListener('keydown', unlock, true)
}

let ctx: AudioContext | null = null
let master: GainNode | null = null
const lastPlayed: Partial<Record<SoundName, number>> = {}
/** минимальный интервал между одинаковыми звуками, мс */
const GAP: Record<SoundName, number> = {
  drop: 70,
  hover: 60,
  open: 150,
  close: 150,
  key: 25,
  error: 150,
  copy: 150,
}

function audio(): { ctx: AudioContext; out: GainNode } | null {
  if (!supported || !unlocked) return null
  if (!ctx) {
    ctx = new AudioContext()
    master = ctx.createGain()
    master.gain.value = 0.6
    master.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return master ? { ctx, out: master } : null
}

interface Tone {
  type?: OscillatorType
  from: number
  to?: number
  /** длительность, с */
  dur: number
  gain: number
  delay?: number
}

function tone({ type = 'sine', from, to = from, dur, gain, delay = 0 }: Tone): void {
  const a = audio()
  if (!a) return
  const t0 = a.ctx.currentTime + delay
  const osc = a.ctx.createOscillator()
  const env = a.ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(from, t0)
  if (to !== from) osc.frequency.exponentialRampToValueAtTime(to, t0 + dur)
  env.gain.setValueAtTime(0.0001, t0)
  env.gain.exponentialRampToValueAtTime(gain, t0 + 0.008)
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  osc.connect(env).connect(a.out)
  osc.start(t0)
  osc.stop(t0 + dur + 0.02)
}

/** size 0..1 — чем крупнее капля, тем ниже звук */
function drop(size = 0.5): void {
  const base = 900 - size * 500
  tone({ from: base, to: base * 0.45, dur: 0.12, gain: 0.07 })
}

const sounds: Record<SoundName, () => void> = {
  drop: () => drop(Math.random()),
  hover: () => tone({ type: 'triangle', from: 2200, to: 1800, dur: 0.035, gain: 0.018 }),
  open: () => {
    tone({ from: 520, dur: 0.18, gain: 0.04 })
    tone({ from: 780, dur: 0.22, gain: 0.035, delay: 0.06 })
  },
  close: () => {
    tone({ from: 780, dur: 0.14, gain: 0.03 })
    tone({ from: 520, dur: 0.18, gain: 0.03, delay: 0.05 })
  },
  key: () => tone({ type: 'square', from: 1400 + Math.random() * 300, dur: 0.018, gain: 0.012 }),
  error: () => tone({ type: 'triangle', from: 220, to: 160, dur: 0.16, gain: 0.05 }),
  copy: () => {
    tone({ from: 880, dur: 0.08, gain: 0.04 })
    tone({ from: 1320, dur: 0.12, gain: 0.035, delay: 0.07 })
  },
}

export function play(name: SoundName): void {
  if (!enabled.value) return
  const now = performance.now()
  if (now - (lastPlayed[name] ?? 0) < GAP[name]) return
  lastPlayed[name] = now
  sounds[name]()
}

/** Звук слияния капель с учётом размера (r — радиус, px) */
export function playDrop(r: number): void {
  if (!enabled.value) return
  const now = performance.now()
  if (now - (lastPlayed.drop ?? 0) < GAP.drop) return
  lastPlayed.drop = now
  drop(Math.min(1, r / 80))
}

export function setSound(on: boolean): void {
  if (!supported) return
  enabled.value = on
  // включение — это клик или команда, то есть жест пользователя: можно создать AudioContext
  if (on) play('open')
}

export function useSound() {
  return { enabled, supported, setSound, play }
}
