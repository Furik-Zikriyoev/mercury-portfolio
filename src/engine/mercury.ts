import { createProgram, getUniforms, supportsWebGL2 } from './gl'
import { buildTextField, type TextField } from './textField'
import { MAX_BLOBS, fragmentShader, vertexShader } from './shader'
import { Tweens, easeOutCubic } from './tween'

export type Quality = 'high' | 'medium' | 'low'

/** Точка во вьюпорте (CSS px) или элемент — тогда берётся его центр на каждом кадре */
export type Target = HTMLElement | { x: number; y: number }

type Role = 'idle' | 'text' | 'frame' | 'pointer' | 'free' | 'arena'

interface Drop {
  x: number
  y: number
  vx: number
  vy: number
  /** текущий и целевой радиус, CSS px */
  r: number
  tr: number
  role: Role
  /** индекс точки для ролей text / frame. У роли arena координаты x/y — внутри арены */
  slot: number
  tx: number
  ty: number
  /** жёсткость и демпфирование пружины */
  k: number
  c: number
  /** секунд до возврата в idle (для брызг) */
  life: number
  seed: number
  /** капля арены ещё падает в неё сверху — стенки и потолок пока не действуют */
  entering?: boolean
  /** секунд, пока капля не может слиться с другими (после деления) */
  cooldown?: number
}

export interface MercuryOptions {
  quality?: Quality | 'auto'
  reducedMotion?: boolean
  /** цвет отблеска по краю, hex */
  accent?: string
  onContextLost?: () => void
}

export interface MercuryStats {
  fps: number
  pixelRatio: number
  drops: number
  quality: Quality
}

const UNIFORMS = [
  'uRes',
  'uPR',
  'uBlobs',
  'uBlobCount',
  'uText',
  'uTextRect',
  'uTextAmount',
  'uFrameRect',
  'uFrameParams',
  'uArenaRect',
  'uArenaRadius',
  'uBevel',
  'uLight',
  'uAccent',
] as const

const QUALITY: Record<Quality, { maxPR: number; maxDrops: number; textScale: number }> = {
  high: { maxPR: 2, maxDrops: MAX_BLOBS, textScale: 1 },
  medium: { maxPR: 1.5, maxDrops: 36, textScale: 0.75 },
  low: { maxPR: 1, maxDrops: 24, textScale: 0.5 },
}

const BEVEL = 60
/** максимум капель в песочнице, чтобы хватило на каплю-курсор и основную */
const ARENA_MAX = 30

function detectQuality(): Quality {
  const coarse = window.matchMedia('(pointer: coarse)').matches
  const cores = navigator.hardwareConcurrency || 4
  if (coarse) return cores >= 8 ? 'medium' : 'low'
  return cores >= 4 ? 'high' : 'medium'
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

const rand = (min: number, max: number) => min + Math.random() * (max - min)

function shuffle<T>(list: T[]): T[] {
  const a = list.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j] as T, a[i] as T]
  }
  return a
}

function resolveTarget(t: Target): { x: number; y: number } {
  if (t instanceof HTMLElement) {
    const r = t.getBoundingClientRect()
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
  }
  return t
}

/** Точка на периметре прямоугольника, t ∈ [0, 1) */
function perimeterPoint(r: DOMRect, t: number): { x: number; y: number } {
  const p = 2 * (r.width + r.height)
  let d = (t % 1) * p
  if (d < r.width) return { x: r.left + d, y: r.top }
  d -= r.width
  if (d < r.height) return { x: r.right, y: r.top + d }
  d -= r.height
  if (d < r.width) return { x: r.right - d, y: r.bottom }
  d -= r.width
  return { x: r.left, y: r.bottom - d }
}

export class Mercury {
  static isSupported = supportsWebGL2

  /** null — если WebGL2 недоступен или шейдер не собрался */
  static create(canvas: HTMLCanvasElement, options: MercuryOptions = {}): Mercury | null {
    if (!supportsWebGL2()) return null
    try {
      return new Mercury(canvas, options)
    } catch (error) {
      console.warn('[mercury]', error)
      return null
    }
  }

  private readonly canvas: HTMLCanvasElement
  private readonly gl: WebGL2RenderingContext
  private readonly program: WebGLProgram
  private readonly vao: WebGLVertexArrayObject
  private readonly buffer: WebGLBuffer
  private readonly textTexture: WebGLTexture
  private readonly u: Record<(typeof UNIFORMS)[number], WebGLUniformLocation | null>
  private readonly blobData = new Float32Array(MAX_BLOBS * 4)
  private readonly tweens = new Tweens()
  private readonly options: MercuryOptions

  private drops: Drop[] = []
  private quality: Quality
  private pr = 1
  private prScale = 1
  private width = 0
  private height = 0

  private running = false
  private raf = 0
  private last = 0
  private time = 0
  private fps = 60
  private slowFrames = 0

  private reduced: boolean
  private accent: [number, number, number]
  private light = { x: 0, y: 0 }
  private gravity = { x: 0, y: 1600 }

  private home: Target | null = null
  private homeSize = 80
  private homeCount = 6
  private homeTight = false

  private text: { el: HTMLElement | null; field: TextField | null; amount: number; slots: { x: number; y: number }[] } =
    { el: null, field: null, amount: 0, slots: [] }

  private frame: { el: HTMLElement | null; amount: number; radius: number; thickness: number; slots: number } = {
    el: null,
    amount: 0,
    radius: 24,
    thickness: 10,
    slots: 16,
  }

  private pointer = {
    x: -9999,
    y: -9999,
    active: false,
    radius: 0,
    hoverRadius: 0,
    magnet: null as HTMLElement | null,
    strength: 0.35,
  }

  /** Арена песочницы: капли живут в координатах элемента и едут вместе с ним при скролле */
  private arena = {
    el: null as HTMLElement | null,
    rect: null as DOMRect | null,
    radius: 0,
    attract: null as { x: number; y: number } | null,
    gathering: false,
  }

  private resizeTimer = 0

  private constructor(canvas: HTMLCanvasElement, options: MercuryOptions) {
    this.canvas = canvas
    this.options = options
    this.reduced =
      options.reducedMotion ?? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    this.quality = !options.quality || options.quality === 'auto' ? detectQuality() : options.quality
    this.accent = hexToRgb(options.accent ?? '#ff6a2b')

    const gl = canvas.getContext('webgl2', {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: 'high-performance',
    })
    if (!gl) throw new Error('WebGL2 context unavailable')
    this.gl = gl

    this.program = createProgram(gl, vertexShader, fragmentShader)
    this.u = getUniforms(gl, this.program, UNIFORMS)

    const vao = gl.createVertexArray()
    const buffer = gl.createBuffer()
    const texture = gl.createTexture()
    if (!vao || !buffer || !texture) throw new Error('WebGL resources unavailable')
    this.vao = vao
    this.buffer = buffer
    this.textTexture = texture
    gl.bindVertexArray(this.vao)
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(this.program, 'aPosition')
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

    gl.bindTexture(gl.TEXTURE_2D, this.textTexture)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R16F, 1, 1, 0, gl.RED, gl.FLOAT, new Float32Array([0]))

    gl.useProgram(this.program)
    gl.uniform1i(this.u.uText, 0)
    gl.clearColor(0, 0, 0, 0)

    window.addEventListener('resize', this.onResize)
    document.addEventListener('visibilitychange', this.onVisibility)
    canvas.addEventListener('webglcontextlost', this.onContextLost)

    this.resize()
  }

  // ---------------------------------------------------------------- жизненный цикл

  start(): void {
    if (this.running) return
    this.running = true
    this.last = performance.now()
    this.raf = requestAnimationFrame(this.loop)
  }

  stop(): void {
    this.running = false
    cancelAnimationFrame(this.raf)
  }

  destroy(): void {
    this.stop()
    this.tweens.clear()
    window.clearTimeout(this.resizeTimer)
    window.removeEventListener('resize', this.onResize)
    document.removeEventListener('visibilitychange', this.onVisibility)
    this.canvas.removeEventListener('webglcontextlost', this.onContextLost)
    const gl = this.gl
    gl.deleteTexture(this.textTexture)
    gl.deleteBuffer(this.buffer)
    gl.deleteVertexArray(this.vao)
    gl.deleteProgram(this.program)
  }

  get stats(): MercuryStats {
    return {
      fps: Math.round(this.fps),
      pixelRatio: Math.round(this.pr * 100) / 100,
      drops: this.drops.length,
      quality: this.quality,
    }
  }

  setQuality(quality: Quality | 'auto'): void {
    this.quality = quality === 'auto' ? detectQuality() : quality
    this.prScale = 1
    this.resize()
    this.rebuildText()
  }

  // ---------------------------------------------------------------- дом (капля в покое)

  /**
   * Где живёт капля, когда не занята текстом или рамкой.
   * tight — все капли собираются в одну (например, у кнопки).
   */
  setHome(target: Target, opts: { size?: number; count?: number; tight?: boolean } = {}): void {
    this.home = target
    this.homeSize = opts.size ?? this.homeSize
    this.homeCount = opts.count ?? this.homeCount
    this.homeTight = opts.tight ?? false
    // капли, пришедшие из прошлого дома, принимают размер нового
    this.drops
      .filter((d) => d.role === 'idle' && d.tr > 0)
      .forEach((d, i) => {
        if (i === 0) d.tr = this.homeSize
        else if (i < this.homeCount) d.tr = this.homeSize * rand(0.32, 0.45)
      })
    this.fillHome()
  }

  // ---------------------------------------------------------------- текст

  /** Капли слетаются в буквы элемента, затем буквы становятся сплошным металлом */
  async formText(
    el: HTMLElement,
    opts: { duration?: number; from?: 'home' | 'scatter' } = {},
  ): Promise<void> {
    await document.fonts?.ready
    const field = buildTextField(el, QUALITY[this.quality].textScale)
    if (!field) return

    this.uploadText(field)
    this.text.el = el
    this.text.field = field

    const duration = this.reduced ? 0 : (opts.duration ?? 1.8)
    const count = Math.min(field.samples.length, this.maxDrops - this.homeCount - 2, 30)
    this.text.slots = shuffle(field.samples).slice(0, count)

    if (duration === 0) {
      this.text.amount = 1
      return
    }

    const scatter = opts.from === 'scatter'
    const sources = scatter ? [] : this.drops.filter((d) => d.role === 'idle')
    const origin = this.homePoint()
    this.text.slots.forEach((_, i) => {
      const src = sources[i]
      let drop: Drop | null
      if (src) {
        drop = src
      } else if (scatter) {
        // капли вылетают снизу экрана по дуге
        drop = this.addDrop(rand(0, this.width), this.height + rand(20, 180), field.halfStroke * rand(0.8, 1.6))
        if (drop) {
          drop.vx = rand(-300, 300)
          drop.vy = -rand(500, 1300)
        }
      } else {
        drop = this.addDrop(origin.x + rand(-40, 40), origin.y + rand(-40, 40), 0)
      }
      if (!drop) return
      drop.role = 'text'
      drop.slot = i
      drop.tr = field.halfStroke * 1.35
      drop.k = rand(28, 70)
      drop.c = 2 * Math.sqrt(drop.k) * 0.75
    })

    const absorbAt = duration * 0.72
    const fill = this.tweens.to('text', this.text.amount, 1, duration * 0.5, (v) => (this.text.amount = v), {
      delay: duration * 0.45,
      ease: easeOutCubic,
    })
    await this.tweens.to('text-absorb', 0, 1, 0, () => {}, { delay: absorbAt })
    for (const d of this.drops) if (d.role === 'text') d.tr = 0
    await fill
    this.fillHome()
  }

  /** Мгновенно завершить сборку текста (кнопка «Пропустить») */
  completeText(): void {
    if (!this.text.el) return
    this.tweens.to('text', this.text.amount, 1, 0, (v) => (this.text.amount = v))
    this.tweens.to('text-absorb', 0, 1, 0, () => {})
    for (const d of this.drops) {
      if (d.role !== 'text') continue
      d.tr = 0
      d.r = 0
    }
  }

  /** Металл букв распадается на капли: scatter — разлетаются, collect — стекают домой */
  async releaseText(mode: 'scatter' | 'collect' = 'scatter'): Promise<void> {
    const { el, field } = this.text
    if (!el || !field) return

    if (!this.reduced) {
      const rect = el.getBoundingClientRect()
      const ox = rect.left - field.pad
      const oy = rect.top - field.pad
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      for (const p of shuffle(field.samples).slice(0, 18)) {
        const drop = this.addDrop(ox + p.x, oy + p.y, field.halfStroke * 1.2)
        if (!drop) break
        if (mode === 'scatter') {
          const dx = drop.x - cx
          const dy = drop.y - cy
          const len = Math.hypot(dx, dy) || 1
          drop.role = 'free'
          drop.vx = (dx / len) * rand(300, 700)
          drop.vy = (dy / len) * rand(300, 700) - rand(300, 700)
          drop.life = rand(0.7, 1.3)
        }
      }
    }

    await this.tweens.to('text', this.text.amount, 0, this.reduced ? 0 : 0.35, (v) => (this.text.amount = v))
    this.text.el = null
    this.text.field = null
    this.text.slots = []
  }

  // ---------------------------------------------------------------- рамка

  /** Металл обтекает элемент рамкой (например, фото) */
  async setFrame(el: HTMLElement, opts: { thickness?: number; duration?: number } = {}): Promise<void> {
    const radius = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 24
    this.frame.el = el
    this.frame.radius = radius
    this.frame.thickness = opts.thickness ?? 10

    const duration = this.reduced ? 0 : (opts.duration ?? 1.4)
    if (duration === 0) {
      this.frame.amount = 1
      return
    }

    const sources = this.drops.filter((d) => d.role === 'idle')
    const origin = this.homePoint()
    for (let i = 0; i < this.frame.slots; i++) {
      const drop = sources[i] ?? this.addDrop(origin.x + rand(-30, 30), origin.y + rand(-30, 30), 0)
      if (!drop) break
      drop.role = 'frame'
      drop.slot = i
      drop.tr = this.frame.thickness * 1.6
      drop.k = rand(35, 70)
      drop.c = 2 * Math.sqrt(drop.k) * 0.8
    }

    const fill = this.tweens.to('frame', this.frame.amount, 1, duration * 0.5, (v) => (this.frame.amount = v), {
      delay: duration * 0.45,
      ease: easeOutCubic,
    })
    await this.tweens.to('frame-absorb', 0, 1, 0, () => {}, { delay: duration * 0.75 })
    for (const d of this.drops) if (d.role === 'frame') d.tr = 0
    await fill
    this.fillHome()
  }

  async clearFrame(): Promise<void> {
    const el = this.frame.el
    if (!el) return
    if (!this.reduced) {
      const rect = el.getBoundingClientRect()
      for (let i = 0; i < 10; i++) {
        const p = perimeterPoint(rect, i / 10)
        this.addDrop(p.x, p.y, this.frame.thickness * 1.4)
      }
    }
    await this.tweens.to('frame', this.frame.amount, 0, this.reduced ? 0 : 0.35, (v) => (this.frame.amount = v))
    this.frame.el = null
  }

  // ---------------------------------------------------------------- взаимодействие

  /** Капля под курсором. radius = 0 — выключена, hoverRadius — над элементом-магнитом */
  setPointerRadius(radius: number, hoverRadius = radius): void {
    this.pointer.radius = radius
    this.pointer.hoverRadius = hoverRadius
    if (radius > 0 && !this.drops.some((d) => d.role === 'pointer')) {
      const drop = this.addDrop(this.pointer.x, this.pointer.y, 0)
      if (drop) {
        drop.role = 'pointer'
        drop.k = 320
        drop.c = 30
      }
    }
  }

  setPointer(x: number, y: number): void {
    if (!this.pointer.active) {
      // первый вход курсора: не тянем каплю через весь экран
      for (const d of this.drops) {
        if (d.role === 'pointer') {
          d.x = x
          d.y = y
          d.vx = 0
          d.vy = 0
        }
      }
    }
    this.pointer.x = x
    this.pointer.y = y
    this.pointer.active = true
  }

  /** Капля притягивается к центру элемента (кнопка, ссылка) */
  setPointerMagnet(el: HTMLElement | null, strength = 0.35): void {
    this.pointer.magnet = el
    this.pointer.strength = strength
  }

  releasePointer(): void {
    this.pointer.active = false
  }

  /** Брызги из точки. Через секунду капли возвращаются домой */
  splash(x: number, y: number, count = 7): void {
    if (this.reduced) return
    for (let i = 0; i < count; i++) {
      const drop = this.addDrop(x, y, rand(8, 18))
      if (!drop) break
      const angle = rand(-Math.PI * 0.95, -Math.PI * 0.05)
      const speed = rand(350, 900)
      drop.role = 'free'
      drop.vx = Math.cos(angle) * speed
      drop.vy = Math.sin(angle) * speed
      drop.life = rand(0.9, 1.5)
    }
  }

  /** Свободный режим: капли падают под гравитацией и отскакивают от краёв экрана */
  setFree(enabled: boolean): void {
    for (const d of this.drops) {
      if (enabled && d.role === 'idle') {
        d.role = 'free'
        d.life = Infinity
      } else if (!enabled && d.role === 'free') {
        d.role = 'idle'
      }
    }
  }

  setGravity(x: number, y: number): void {
    this.gravity.x = x
    this.gravity.y = y
  }

  shake(force = 900): void {
    for (const d of this.drops) {
      if (d.role === 'pointer' || d.role === 'arena') continue
      d.vx += rand(-force, force)
      d.vy += rand(-force, force * 0.4) - force * 0.3
    }
  }

  // ---------------------------------------------------------------- песочница

  /** Элемент-арена песочницы */
  setArena(el: HTMLElement | null): void {
    if (!el) this.releaseArena()
    this.arena.el = el
    this.arena.radius = el ? parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0 : 0
  }

  /** Свободные капли дома падают в арену сверху */
  /** Основная капля дома падает в арену сверху, мелкие растворяются в ней */
  pourIntoArena(): void {
    const el = this.arena.el
    if (!el) return
    const rect = el.getBoundingClientRect()
    const idle = this.drops.filter((d) => d.role === 'idle' && d.tr > 0)
    const main = idle.reduce<Drop | null>((best, d) => (!best || d.tr > best.tr ? d : best), null)
    if (!main) return
    for (const d of idle) if (d !== main) d.tr = 0
    main.role = 'arena'
    main.entering = true
    main.x -= rect.left
    main.y -= rect.top
    main.vy = Math.max(main.vy, 0)
  }

  /** Из арены вытекает одна капля размером с дом — она поплывёт к следующей секции */
  leakFromArena(): void {
    const rect = this.arena.rect ?? this.arena.el?.getBoundingClientRect()
    if (!rect) return
    this.arena.attract = null
    this.arena.gathering = false
    const source = this.drops
      .filter((d) => d.role === 'arena' && d.tr > 0)
      .reduce<Drop | null>((best, d) => (!best || d.tr > best.tr ? d : best), null)
    if (!source) return
    const size = Math.min(this.homeSize * 0.9, source.tr * 0.85)
    const drop = this.addDrop(rect.left + source.x, rect.top + source.y - source.r * 0.4, size * 0.7)
    if (!drop) return
    drop.tr = size
    drop.vy = -500
    source.tr = Math.sqrt(Math.max(source.tr * source.tr - size * size, (source.tr * 0.45) ** 2))
  }

  /** Металл выходит из арены и течёт к текущему дому */
  releaseArena(): void {
    const rect = this.arena.rect ?? this.arena.el?.getBoundingClientRect() ?? null
    for (const d of this.drops) {
      if (d.role !== 'arena') continue
      d.role = 'idle'
      d.entering = false
      if (rect) {
        d.x += rect.left
        d.y += rect.top
      }
    }
    this.arena.attract = null
    this.arena.gathering = false
    this.arena.el = null
    this.arena.rect = null
  }

  /** Добавить капли в арену (падают сверху) */
  spawnArena(count = 12): void {
    const el = this.arena.el
    if (!el) return
    const rect = el.getBoundingClientRect()
    const scale = Math.min(1.2, Math.max(0.55, rect.width / 700))
    const n = Math.min(count, ARENA_MAX - this.arenaDrops.length)
    for (let i = 0; i < n; i++) {
      const drop = this.addDrop(rand(0.2, 0.8) * rect.width, rand(0.05, 0.4) * rect.height, 0)
      if (!drop) break
      drop.role = 'arena'
      drop.tr = rand(14, 26) * scale
      drop.vx = rand(-250, 250)
    }
  }

  private get arenaDrops(): Drop[] {
    return this.drops.filter((d) => d.role === 'arena' && d.tr > 0)
  }

  /** Сколько капель видно в арене: касающиеся друг друга считаются одной */
  get arenaCount(): number {
    const list = this.arenaDrops
    const parent = list.map((_, i) => i)
    const find = (i: number): number => {
      while (parent[i] !== i) i = parent[i] = parent[parent[i]!]!
      return i
    }
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i]!
        const b = list[j]!
        if (Math.hypot(a.x - b.x, a.y - b.y) < (a.r + b.r) * 0.95) parent[find(i)] = find(j)
      }
    }
    return new Set(list.map((_, i) => find(i))).size
  }

  /** Капли арены тянутся к точке (координаты вьюпорта) */
  attract(x: number, y: number): void {
    this.arena.attract = { x, y }
  }

  releaseAttract(): void {
    this.arena.attract = null
  }

  /** Собрать все капли арены в одну */
  async gatherArena(): Promise<void> {
    this.arena.gathering = true
    await this.tweens.to('arena-gather', 0, 1, 0, () => {}, { delay: 1.2 })
    this.arena.gathering = false
  }

  /** Разбить крупные капли на мелкие */
  splitArena(): void {
    let budget = ARENA_MAX - this.arenaDrops.length
    const parents = this.drops.filter((d) => d.role === 'arena' && d.tr > 12)
    for (const parent of parents) {
      const pieces = parent.tr > 34 ? 4 : parent.tr > 22 ? 3 : 2
      const size = parent.tr / Math.sqrt(pieces)
      for (let i = 1; i < pieces; i++) {
        if (budget-- <= 0) break
        const drop = this.addDrop(parent.x, parent.y, size * 0.6)
        if (!drop) return
        drop.role = 'arena'
        drop.tr = size
        drop.vx = rand(-700, 700)
        drop.vy = -rand(300, 900)
        drop.cooldown = 0.6
      }
      parent.tr = size
      parent.vy -= 400
      parent.cooldown = 0.6
    }
  }

  shakeArena(force = 1100): void {
    for (const d of this.drops) {
      if (d.role !== 'arena') continue
      d.vx += rand(-force, force)
      d.vy -= rand(force * 0.4, force * 1.1)
    }
  }

  // ---------------------------------------------------------------- внутреннее

  private get maxDrops(): number {
    return QUALITY[this.quality].maxDrops
  }

  /** Точка дома, прижатая к экрану: при скролле капля не уходит за край, а едет вдоль него */
  private homePoint(): { x: number; y: number } {
    const p = this.home ? resolveTarget(this.home) : { x: this.width / 2, y: this.height / 2 }
    const m = Math.min(this.homeSize * 1.6, this.height / 4)
    return {
      x: Math.min(this.width - m, Math.max(m, p.x)),
      y: Math.min(this.height - m, Math.max(m * 0.8, p.y)),
    }
  }

  private addDrop(x: number, y: number, r: number): Drop | null {
    if (this.drops.length >= this.maxDrops) return null
    const drop: Drop = {
      x,
      y,
      vx: 0,
      vy: 0,
      r,
      tr: r,
      role: 'idle',
      slot: 0,
      tx: x,
      ty: y,
      k: 70,
      c: 12,
      life: Infinity,
      seed: Math.random() * 100,
    }
    this.drops.push(drop)
    return drop
  }

  /** Добирает каплю до нужного числа частей */
  private fillHome(): void {
    if (!this.home) return
    const idle = this.drops.filter((d) => d.role === 'idle' && d.tr > 0).length
    const p = this.homePoint()
    for (let i = idle; i < this.homeCount; i++) {
      const drop = this.addDrop(p.x + rand(-10, 10), p.y + rand(-10, 10), 0)
      if (!drop) break
      drop.tr = i === 0 ? this.homeSize : this.homeSize * rand(0.32, 0.45)
    }
  }

  private uploadText(field: TextField): void {
    const gl = this.gl
    gl.bindTexture(gl.TEXTURE_2D, this.textTexture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R16F, field.width, field.height, 0, gl.RED, gl.FLOAT, field.data)
  }

  private rebuildText(): void {
    const el = this.text.el
    if (!el || this.text.amount <= 0) return
    const field = buildTextField(el, QUALITY[this.quality].textScale)
    if (!field) return
    this.text.field = field
    this.uploadText(field)
  }

  private resize(): void {
    const dpr = window.devicePixelRatio || 1
    this.width = this.canvas.clientWidth || window.innerWidth
    this.height = this.canvas.clientHeight || window.innerHeight
    this.pr = Math.min(dpr, QUALITY[this.quality].maxPR) * this.prScale
    this.canvas.width = Math.round(this.width * this.pr)
    this.canvas.height = Math.round(this.height * this.pr)
  }

  private onResize = (): void => {
    this.resize()
    window.clearTimeout(this.resizeTimer)
    this.resizeTimer = window.setTimeout(() => this.rebuildText(), 200)
  }

  private onVisibility = (): void => {
    if (document.hidden) {
      cancelAnimationFrame(this.raf)
    } else if (this.running) {
      this.last = performance.now()
      this.raf = requestAnimationFrame(this.loop)
    }
  }

  private onContextLost = (event: Event): void => {
    event.preventDefault()
    this.stop()
    this.options.onContextLost?.()
  }

  private loop = (now: number): void => {
    if (!this.running) return
    this.raf = requestAnimationFrame(this.loop)
    const dt = Math.min((now - this.last) / 1000, 1 / 30)
    this.last = now
    if (dt <= 0) return
    this.time += dt

    this.governor(dt)
    this.arena.rect = this.arena.el?.getBoundingClientRect() ?? null
    this.tweens.update(dt)
    this.updateTargets()
    this.integrate(dt / 2)
    this.integrate(dt / 2)
    this.mergeArena(dt)
    this.render()
  }

  /** Если FPS долго ниже 45 — снижаем разрешение рендера */
  private governor(dt: number): void {
    this.fps += (1 / dt - this.fps) * 0.05
    if (this.fps < 45) this.slowFrames++
    else this.slowFrames = Math.max(0, this.slowFrames - 2)
    if (this.slowFrames > 90 && this.prScale > 0.5) {
      this.prScale = Math.max(0.5, this.prScale - 0.15)
      this.slowFrames = 0
      this.resize()
    }
  }

  private updateTargets(): void {
    const t = this.reduced ? 0 : this.time
    const home = this.homePoint()
    const idle = this.drops.filter((d) => d.role === 'idle')

    this.light.x += ((this.pointer.active ? (this.pointer.x / this.width) * 2 - 1 : 0) - this.light.x) * 0.05
    this.light.y += ((this.pointer.active ? 1 - (this.pointer.y / this.height) * 2 : 0) - this.light.y) * 0.05

    idle.forEach((d, i) => {
      if (i >= this.homeCount) {
        // лишние капли долетают до основной и сливаются с ней
        d.tx = home.x
        d.ty = home.y
        if (Math.hypot(d.x - home.x, d.y - home.y) < this.homeSize * 1.2) d.tr = 0
        return
      }
      if (i === 0 || this.homeTight) {
        // у маленькой капли покачивание меньше, чтобы она не выходила из своего места
        const wobble = Math.min(6, this.homeSize * 0.1)
        d.tx = home.x + Math.sin(t * 0.7 + d.seed) * wobble
        d.ty = home.y + Math.cos(t * 0.6 + d.seed) * wobble
        return
      }
      const angle = t * 0.35 + (i / Math.max(1, this.homeCount - 1)) * Math.PI * 2 + Math.sin(t * 0.4 + i) * 0.3
      const dist = this.homeSize * (1.05 + Math.sin(t * 0.9 + d.seed) * 0.18)
      d.tx = home.x + Math.cos(angle) * dist * 1.2
      d.ty = home.y + Math.sin(angle) * dist
    })

    const textEl = this.text.el
    const field = this.text.field
    if (textEl && field) {
      const rect = textEl.getBoundingClientRect()
      for (const d of this.drops) {
        if (d.role !== 'text') continue
        const slot = this.text.slots[d.slot]
        if (!slot) continue
        d.tx = rect.left - field.pad + slot.x
        d.ty = rect.top - field.pad + slot.y
      }
    }

    const frameEl = this.frame.el
    if (frameEl) {
      const rect = frameEl.getBoundingClientRect()
      for (const d of this.drops) {
        if (d.role !== 'frame') continue
        const p = perimeterPoint(rect, d.slot / this.frame.slots)
        d.tx = p.x
        d.ty = p.y
      }
    }

    const { magnet } = this.pointer
    const center = magnet?.isConnected ? resolveTarget(magnet) : null
    for (const d of this.drops) {
      if (d.role !== 'pointer') continue
      const k = center ? this.pointer.strength : 0
      d.tx = this.pointer.x + ((center?.x ?? 0) - this.pointer.x) * k
      d.ty = this.pointer.y + ((center?.y ?? 0) - this.pointer.y) * k
      d.tr = this.pointer.active ? (center ? this.pointer.hoverRadius : this.pointer.radius) : 0
    }
  }

  private integrateArena(d: Drop, dt: number): void {
    const a = this.arena.rect
    if (!a) {
      d.tr = 0
      return
    }
    const { gravity, pointer } = this
    let ax = gravity.x
    let ay = gravity.y

    const attract = this.arena.gathering
      ? { x: a.width / 2, y: a.height / 2 }
      : this.arena.attract
        ? { x: this.arena.attract.x - a.left, y: this.arena.attract.y - a.top }
        : null

    if (attract) {
      ax += (attract.x - d.x) * 45 - d.vx * 5
      ay += (attract.y - d.y) * 45 - d.vy * 5
    } else if (pointer.active) {
      const dx = d.x - (pointer.x - a.left)
      const dy = d.y - (pointer.y - a.top)
      const dist2 = dx * dx + dy * dy
      if (dist2 < 120 * 120 && dist2 > 1) {
        const len = Math.sqrt(dist2)
        const push = (1 - len / 120) * 5000
        ax += (dx / len) * push
        ay += (dy / len) * push
      }
    }

    d.vx = (d.vx + ax * dt) * 0.998
    d.vy = (d.vy + ay * dt) * 0.998
    d.x += d.vx * dt
    d.y += d.vy * dt

    const r = d.r * 0.6
    if (d.entering) {
      // пока капля над ареной: тянем по горизонтали внутрь, стенки не трогаем
      const inside = Math.min(a.width - r, Math.max(r, d.x))
      d.vx += (inside - d.x) * 6 * dt
      if (d.y > r && d.x >= r && d.x <= a.width - r) d.entering = false
      return
    }
    if (d.x < r) {
      d.x = r
      d.vx = Math.abs(d.vx) * 0.35
    } else if (d.x > a.width - r) {
      d.x = a.width - r
      d.vx = -Math.abs(d.vx) * 0.35
    }
    if (d.y < r) {
      d.y = r
      d.vy = Math.abs(d.vy) * 0.35
    } else if (d.y > a.height - r) {
      d.y = a.height - r
      d.vy = -Math.abs(d.vy) * 0.3
      d.vx *= 0.97
    }
  }

  /**
   * Сильно перекрывшиеся капли арены сливаются в одну (площадь сохраняется),
   * поэтому счётчик показывает реальное число капель. Только что разделённые
   * капли (cooldown > 0) не сливаются, чтобы успели разлететься.
   */
  private mergeArena(dt: number): void {
    const list = this.drops.filter((d) => d.role === 'arena' && d.tr > 0 && !d.entering)
    const maxR = 80
    for (const d of list) if (d.cooldown) d.cooldown = Math.max(0, d.cooldown - dt)
    for (let i = 0; i < list.length; i++) {
      const a = list[i]!
      if (a.tr <= 0 || a.cooldown) continue
      for (let j = i + 1; j < list.length; j++) {
        const b = list[j]!
        if (b.tr <= 0 || b.cooldown) continue
        const dist = Math.hypot(a.x - b.x, a.y - b.y)
        if (dist > (a.r + b.r) * 0.4) continue
        const tr = Math.sqrt(a.tr * a.tr + b.tr * b.tr)
        if (tr > maxR) continue
        const wa = a.tr * a.tr
        const wb = b.tr * b.tr
        a.x = (a.x * wa + b.x * wb) / (wa + wb)
        a.y = (a.y * wa + b.y * wb) / (wa + wb)
        a.vx = (a.vx * wa + b.vx * wb) / (wa + wb)
        a.vy = (a.vy * wa + b.vy * wb) / (wa + wb)
        a.tr = tr
        a.r = Math.max(a.r, tr * 0.9)
        b.tr = 0
        b.r = 0
      }
    }
  }

  private integrate(dt: number): void {
    const { width, height, gravity, pointer } = this
    for (const d of this.drops) {
      if (d.role === 'arena') {
        this.integrateArena(d, dt)
      } else if (d.role === 'free') {
        d.vx += gravity.x * dt
        d.vy += gravity.y * dt
        if (pointer.active) {
          const dx = d.x - pointer.x
          const dy = d.y - pointer.y
          const dist2 = dx * dx + dy * dy
          if (dist2 < 140 * 140 && dist2 > 1) {
            const push = (1 - Math.sqrt(dist2) / 140) * 4000 * dt
            const len = Math.sqrt(dist2)
            d.vx += (dx / len) * push
            d.vy += (dy / len) * push
          }
        }
        d.vx *= 0.998
        d.vy *= 0.998
        d.x += d.vx * dt
        d.y += d.vy * dt
        const r = d.r * 0.85
        if (d.x < r) {
          d.x = r
          d.vx = Math.abs(d.vx) * 0.4
        } else if (d.x > width - r) {
          d.x = width - r
          d.vx = -Math.abs(d.vx) * 0.4
        }
        if (d.y < r) {
          d.y = r
          d.vy = Math.abs(d.vy) * 0.4
        } else if (d.y > height - r) {
          d.y = height - r
          d.vy = -Math.abs(d.vy) * 0.35
          d.vx *= 0.96
        }
        d.life -= dt
        if (d.life <= 0) d.role = 'idle'
      } else {
        const ax = d.k * (d.tx - d.x) - d.c * d.vx
        const ay = d.k * (d.ty - d.y) - d.c * d.vy
        d.vx += ax * dt
        d.vy += ay * dt
        d.x += d.vx * dt
        d.y += d.vy * dt
      }
      d.r += (d.tr - d.r) * Math.min(1, dt * 7)
    }
    this.drops = this.drops.filter((d) => d.role === 'pointer' || d.tr > 0 || d.r > 0.5)
  }

  private render(): void {
    const gl = this.gl
    gl.viewport(0, 0, this.canvas.width, this.canvas.height)
    gl.clear(gl.COLOR_BUFFER_BIT)

    let count = 0
    const arena = this.arena.rect
    for (const d of this.drops) {
      if (d.r < 0.5 || count >= MAX_BLOBS) continue
      let x = d.x
      let y = d.y
      if (d.role === 'arena') {
        if (!arena) continue
        x += arena.left
        y += arena.top
      }
      if (x < -d.r * 3 || y < -d.r * 3 || x > this.width + d.r * 3 || y > this.height + d.r * 3) {
        continue
      }
      this.blobData[count * 4] = x
      this.blobData[count * 4 + 1] = y
      this.blobData[count * 4 + 2] = d.r
      this.blobData[count * 4 + 3] = d.role === 'arena' && !d.entering ? 1 : 0
      count++
    }

    const textActive = this.text.amount > 0.001 && this.text.el && this.text.field
    const frameActive = this.frame.amount > 0.001 && this.frame.el
    if (count === 0 && !textActive && !frameActive) return

    gl.useProgram(this.program)
    gl.bindVertexArray(this.vao)
    gl.uniform2f(this.u.uRes, this.canvas.width, this.canvas.height)
    gl.uniform1f(this.u.uPR, this.pr)
    gl.uniform4fv(this.u.uBlobs, this.blobData)
    gl.uniform1i(this.u.uBlobCount, count)
    gl.uniform1f(this.u.uBevel, BEVEL)
    gl.uniform2f(this.u.uLight, this.light.x, this.light.y)
    gl.uniform3f(this.u.uAccent, ...this.accent)

    if (textActive && this.text.el && this.text.field) {
      const rect = this.text.el.getBoundingClientRect()
      const { pad, width, height, scale } = this.text.field
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, this.textTexture)
      gl.uniform4f(this.u.uTextRect, rect.left - pad, rect.top - pad, width / scale, height / scale)
      gl.uniform1f(this.u.uTextAmount, this.text.amount)
    } else {
      gl.uniform1f(this.u.uTextAmount, 0)
    }

    if (arena) {
      gl.uniform4f(this.u.uArenaRect, arena.left, arena.top, arena.width, arena.height)
      gl.uniform1f(this.u.uArenaRadius, this.arena.radius)
    } else {
      gl.uniform4f(this.u.uArenaRect, 0, 0, 0, 0)
    }

    if (frameActive && this.frame.el) {
      const rect = this.frame.el.getBoundingClientRect()
      gl.uniform4f(this.u.uFrameRect, rect.left, rect.top, rect.width, rect.height)
      gl.uniform3f(this.u.uFrameParams, this.frame.radius, this.frame.thickness, this.frame.amount)
    } else {
      gl.uniform3f(this.u.uFrameParams, 0, 0, 0)
    }

    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }
}
