/**
 * Текст элемента → поле для шейдера.
 *
 * Символы рисуются в canvas по их реальным позициям из DOM (Range.getClientRects),
 * поэтому перенос строк, кернинг и letter-spacing совпадают с вёрсткой.
 *
 * В текстуру идёт размытая маска букв (0..1): край буквы ≈ 0.5, середина штриха ≈ 1.
 * Из неё шейдер берёт и силуэт, и гладкую нормаль.
 * Distance transform (Felzenszwalb–Huttenlocher) нужен только чтобы узнать толщину
 * штриха и выбрать точки внутри букв, куда слетаются капли.
 */

export interface TextField {
  /** размытая маска, одно значение на пиксель */
  data: Float32Array
  width: number
  height: number
  /** отступ вокруг элемента, CSS px */
  pad: number
  /** пикселей текстуры на CSS px */
  scale: number
  /** точки внутри букв, CSS px от левого верхнего угла текстуры */
  samples: { x: number; y: number }[]
  /** половина толщины штриха, CSS px */
  halfStroke: number
}

const INF = 1e20

function edt1d(f: Float64Array, n: number, v: Int32Array, z: Float64Array, out: Float64Array): void {
  let k = 0
  v[0] = 0
  z[0] = -INF
  z[1] = INF
  for (let q = 1; q < n; q++) {
    let vk = v[k] as number
    let s = (f[q]! + q * q - (f[vk]! + vk * vk)) / (2 * q - 2 * vk)
    while (s <= z[k]!) {
      k--
      vk = v[k] as number
      s = (f[q]! + q * q - (f[vk]! + vk * vk)) / (2 * q - 2 * vk)
    }
    k++
    v[k] = q
    z[k] = s
    z[k + 1] = INF
  }
  k = 0
  for (let q = 0; q < n; q++) {
    while (z[k + 1]! < q) k++
    const vk = v[k] as number
    out[q] = (q - vk) * (q - vk) + f[vk]!
  }
}

/** Квадрат расстояния до ближайшего нуля, на месте */
function edt2d(grid: Float64Array, w: number, h: number): void {
  const n = Math.max(w, h)
  const f = new Float64Array(n)
  const out = new Float64Array(n)
  const v = new Int32Array(n)
  const z = new Float64Array(n + 1)

  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) f[y] = grid[y * w + x]!
    edt1d(f, h, v, z, out)
    for (let y = 0; y < h; y++) grid[y * w + x] = out[y]!
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) f[x] = grid[y * w + x]!
    edt1d(f, w, v, z, out)
    for (let x = 0; x < w; x++) grid[y * w + x] = out[x]!
  }
}

/** Один проход box blur по строкам или по столбцам */
function boxPass(
  src: Float32Array,
  dst: Float32Array,
  w: number,
  h: number,
  r: number,
  horizontal: boolean,
): void {
  const len = horizontal ? w : h
  const lines = horizontal ? h : w
  const norm = 1 / (2 * r + 1)
  for (let line = 0; line < lines; line++) {
    const at = (i: number) => {
      const c = Math.min(len - 1, Math.max(0, i))
      return horizontal ? line * w + c : c * w + line
    }
    let acc = 0
    for (let i = -r; i <= r; i++) acc += src[at(i)]!
    for (let i = 0; i < len; i++) {
      dst[at(i)] = acc * norm
      acc += src[at(i + r + 1)]! - src[at(i - r)]!
    }
  }
}

/** Три box blur подряд ≈ гауссово размытие */
function blur(data: Float32Array, w: number, h: number, sigma: number): Float32Array {
  const boxWidth = Math.sqrt(4 * sigma * sigma + 1)
  const r = Math.max(1, Math.round((boxWidth - 1) / 2))
  let a: Float32Array = data
  let b: Float32Array = new Float32Array(data.length)
  for (let pass = 0; pass < 3; pass++) {
    boxPass(a, b, w, h, r, true)
    ;[a, b] = [b, a]
    boxPass(a, b, w, h, r, false)
    ;[a, b] = [b, a]
  }
  return a
}

function drawElementText(ctx: CanvasRenderingContext2D, el: HTMLElement): number {
  const style = getComputedStyle(el)
  ctx.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = '#fff'
  const upper = style.textTransform === 'uppercase'
  const lower = style.textTransform === 'lowercase'

  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
  const range = document.createRange()
  let drawn = 0

  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.textContent ?? ''
    for (let i = 0; i < text.length; i++) {
      let ch = text.charAt(i)
      if (/\s/.test(ch)) continue
      range.setStart(node, i)
      range.setEnd(node, i + 1)
      const rect = range.getClientRects()[0]
      if (!rect) continue
      if (upper) ch = ch.toUpperCase()
      if (lower) ch = ch.toLowerCase()
      const m = ctx.measureText(ch)
      const ascent = m.fontBoundingBoxAscent
      const descent = m.fontBoundingBoxDescent
      const baseline = rect.top + (rect.height - (ascent + descent)) / 2 + ascent
      ctx.fillText(ch, rect.left, baseline)
      drawn++
    }
  }
  return drawn
}

export function buildTextField(el: HTMLElement, scale = 1): TextField | null {
  const rect = el.getBoundingClientRect()
  if (rect.width < 1 || rect.height < 1) return null

  const fontSize = parseFloat(getComputedStyle(el).fontSize) || 64
  const pad = Math.max(24, Math.round(fontSize * 0.3))
  const width = Math.ceil((rect.width + pad * 2) * scale)
  const height = Math.ceil((rect.height + pad * 2) * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return null

  ctx.scale(scale, scale)
  ctx.translate(pad - rect.left, pad - rect.top)
  if (drawElementText(ctx, el) === 0) return null

  const pixels = ctx.getImageData(0, 0, width, height).data
  const size = width * height
  const mask = new Float32Array(size)
  const inside = new Float64Array(size)
  for (let i = 0; i < size; i++) {
    const a = pixels[i * 4 + 3]! / 255
    mask[i] = a
    inside[i] = a >= 0.5 ? INF : 0
  }

  edt2d(inside, width, height)
  let maxInside = 0
  for (let i = 0; i < size; i++) {
    const d = Math.sqrt(inside[i]!) / scale
    inside[i] = d
    if (d > maxInside) maxInside = d
  }
  const halfStroke = Math.max(2, maxInside)

  const step = Math.max(6, halfStroke * 1.5) * scale
  const samples: { x: number; y: number }[] = []
  for (let y = step / 2; y < height; y += step) {
    for (let x = step / 2; x < width; x += step) {
      if (inside[Math.floor(y) * width + Math.floor(x)]! > halfStroke * 0.35) {
        samples.push({ x: x / scale, y: y / scale })
      }
    }
  }

  const data = blur(mask, width, height, halfStroke * 0.32 * scale)
  return { data, width, height, pad, scale, samples, halfStroke }
}
