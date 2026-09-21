export type Easing = (t: number) => number

export const easeOutCubic: Easing = (t) => 1 - Math.pow(1 - t, 3)
export const easeInOutCubic: Easing = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

interface Tween {
  from: number
  to: number
  duration: number
  delay: number
  elapsed: number
  ease: Easing
  apply: (value: number) => void
  resolve: () => void
  key: string
}

/** Минимальные твины внутри движка: время идёт вместе с его кадрами */
export class Tweens {
  private list: Tween[] = []

  to(
    key: string,
    from: number,
    to: number,
    duration: number,
    apply: (value: number) => void,
    opts: { delay?: number; ease?: Easing } = {},
  ): Promise<void> {
    // новый твин с тем же ключом отменяет старый
    this.list = this.list.filter((t) => {
      if (t.key !== key) return true
      t.resolve()
      return false
    })
    if (duration <= 0 && !opts.delay) {
      apply(to)
      return Promise.resolve()
    }
    return new Promise((resolve) => {
      this.list.push({
        key,
        from,
        to,
        duration: Math.max(duration, 1e-4),
        delay: opts.delay ?? 0,
        elapsed: 0,
        ease: opts.ease ?? easeInOutCubic,
        apply,
        resolve,
      })
    })
  }

  update(dt: number): void {
    if (this.list.length === 0) return
    const done: Tween[] = []
    for (const t of this.list) {
      t.elapsed += dt
      const local = t.elapsed - t.delay
      if (local < 0) continue
      const p = Math.min(1, local / t.duration)
      t.apply(t.from + (t.to - t.from) * t.ease(p))
      if (p >= 1) done.push(t)
    }
    if (done.length) {
      this.list = this.list.filter((t) => !done.includes(t))
      for (const t of done) t.resolve()
    }
  }

  clear(): void {
    for (const t of this.list) t.resolve()
    this.list = []
  }
}

export const wait = (tweens: Tweens, key: string, seconds: number) =>
  tweens.to(key, 0, 1, 0, () => {}, { delay: seconds })
