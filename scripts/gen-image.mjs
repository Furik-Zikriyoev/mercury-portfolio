#!/usr/bin/env node
/**
 * Генерация картинок через Gemini или OpenAI.
 * Ключи берутся из .env в корне проекта (в git он не попадает).
 *
 *   node scripts/gen-image.mjs "тёмная текстура жидкого металла" -o public/og.png
 *   node scripts/gen-image.mjs "обложка для соцсетей" --provider openai --size 1536x1024
 *   node scripts/gen-image.mjs "сделай фон светлее" --ref public/og.png -o public/og-2.png
 *
 * Флаги:
 *   -o, --out       куда сохранить (по умолчанию generated/<дата>.png)
 *   --provider      gemini (по умолчанию) | openai
 *   --model         переопределить модель
 *   --size          только openai: 1024x1024 | 1536x1024 | 1024x1536
 *   --ratio         только gemini: 1:1 | 16:9 | 9:16 | 4:3 | 3:4
 *   --ref <файл>    исходная картинка, которую нужно изменить (можно несколько раз)
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, extname, resolve } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..')

/** Минимальный парсер .env: KEY=value, строки с # пропускаются */
async function loadEnv() {
  try {
    const text = await readFile(resolve(ROOT, '.env'), 'utf8')
    for (const line of text.split('\n')) {
      const match = /^\s*([\w.-]+)\s*=\s*(.*)?\s*$/.exec(line)
      if (!match || line.trim().startsWith('#')) continue
      const value = (match[2] ?? '').trim().replace(/^['"]|['"]$/g, '')
      if (!process.env[match[1]]) process.env[match[1]] = value
    }
  } catch {
    // .env может не быть — тогда ключи берутся из окружения
  }
}

function parseArgs(argv) {
  const args = { prompt: [], refs: [] }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    const next = () => argv[++i]
    if (a === '-o' || a === '--out') args.out = next()
    else if (a === '--provider') args.provider = next()
    else if (a === '--model') args.model = next()
    else if (a === '--size') args.size = next()
    else if (a === '--ratio') args.ratio = next()
    else if (a === '--ref') args.refs.push(next())
    else if (a === '--models') args.models = true
    else args.prompt.push(a)
  }
  args.prompt = args.prompt.join(' ').trim()
  return args
}

const EXT = { 'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp' }
const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' }

async function refParts(paths) {
  return Promise.all(
    paths.map(async (p) => ({
      mime: MIME[extname(p).toLowerCase()] ?? 'image/png',
      data: (await readFile(resolve(ROOT, p))).toString('base64'),
    })),
  )
}

/** Первая картинка в ответе, какой бы ни была обёртка: ищем base64 рядом с image/* */
function findImage(node) {
  if (!node || typeof node !== 'object') return null
  if (typeof node.data === 'string' && node.data.length > 256) {
    const mime = node.mime_type ?? node.mimeType ?? ''
    if (!mime || mime.startsWith('image/')) return { mime: mime || 'image/png', data: node.data }
  }
  if (typeof node.b64_json === 'string') return { mime: 'image/png', data: node.b64_json }
  for (const value of Array.isArray(node) ? node : Object.values(node)) {
    const found = findImage(value)
    if (found) return found
  }
  return null
}

async function post(url, body, headers) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  })
  const text = await res.text()
  let json
  try {
    json = JSON.parse(text)
  } catch {
    json = null
  }
  if (!res.ok) {
    const message = json?.error?.message ?? text.slice(0, 400) ?? ''
    throw new Error(`${res.status} ${res.statusText}: ${message || url}`)
  }
  return json
}

/** Список моделей, доступных этому ключу */
async function listModels() {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new Error('В .env нет GEMINI_API_KEY')
  const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=200', {
    headers: { 'x-goog-api-key': key },
  })
  const json = await res.json()
  if (!res.ok) throw new Error(`${res.status}: ${JSON.stringify(json).slice(0, 300)}`)
  const models = (json.models ?? []).map((m) => m.name.replace('models/', ''))
  const images = models.filter((n) => /image|imagen|banana/i.test(n))
  console.log('Модели с картинками:')
  for (const n of images) console.log('  ' + n)
  console.log(`\nВсего моделей у ключа: ${models.length}`)
  if (!images.length) console.log('Ни одной картиночной модели — возможно, ключ без доступа к ним.')
}

async function gemini({ prompt, model, ratio, refs }) {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new Error('В .env нет GEMINI_API_KEY. Ключ: https://aistudio.google.com/apikey')
  const headers = { 'x-goog-api-key': key }
  const images = await refParts(refs)
  const picked = model ?? process.env.GEMINI_IMAGE_MODEL
  // модели пробуем по очереди: своя → новые → проверенная старая
  const candidates = [picked, 'gemini-3.1-flash-image', 'gemini-2.5-flash-image'].filter(
    (name, i, all) => name && all.indexOf(name) === i,
  )

  const viaInteractions = (name) => ({
    url: 'https://generativelanguage.googleapis.com/v1beta/interactions',
    body: {
      model: name,
      input: [
        { type: 'text', text: prompt },
        ...images.map((img) => ({ type: 'image', mime_type: img.mime, data: img.data })),
      ],
      // этот эндпоинт отдаёт только jpeg
      response_format: { type: 'image', mime_type: 'image/jpeg', ...(ratio ? { aspect_ratio: ratio } : {}) },
    },
  })

  const viaGenerateContent = (name) => ({
    url: `https://generativelanguage.googleapis.com/v1beta/models/${name}:generateContent`,
    body: {
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            ...images.map((img) => ({ inline_data: { mime_type: img.mime, data: img.data } })),
          ],
        },
      ],
      generationConfig: { responseModalities: ['IMAGE'] },
    },
  })

  const problems = []
  for (const name of candidates) {
    for (const make of [viaInteractions, viaGenerateContent]) {
      const { url, body } = make(name)
      const where = `${name} · ${url.includes('interactions') ? 'interactions' : 'generateContent'}`
      try {
        const json = await post(url, body, headers)
        const image = findImage(json)
        if (image) {
          console.log(`  модель: ${where}`)
          return image
        }
        problems.push(`${where}: ответ без картинки`)
      } catch (error) {
        problems.push(`${where}: ${error.message}`)
      }
    }
  }
  throw new Error('ни одна модель не вернула картинку:\n  ' + problems.join('\n  '))
}

async function openai({ prompt, model, size }) {
  const key = process.env.OPENAI_API_KEY
  if (!key) throw new Error('В .env нет OPENAI_API_KEY. Ключ: https://platform.openai.com/api-keys')
  const json = await post(
    'https://api.openai.com/v1/images/generations',
    {
      model: model ?? process.env.OPENAI_IMAGE_MODEL ?? 'gpt-image-1',
      prompt,
      size: size ?? '1024x1024',
      n: 1,
    },
    { Authorization: `Bearer ${key}` },
  )
  const image = findImage(json)
  if (!image) throw new Error('OpenAI не вернул картинку. Ответ: ' + JSON.stringify(json).slice(0, 400))
  return image
}

async function main() {
  await loadEnv()
  const args = parseArgs(process.argv.slice(2))
  if (args.models) {
    await listModels()
    return
  }
  if (!args.prompt) {
    console.error('Нужен промпт: node scripts/gen-image.mjs "описание картинки" -o public/og.png')
    process.exit(1)
  }

  const provider = args.provider ?? 'gemini'
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const requested = resolve(ROOT, args.out ?? `generated/${provider}-${stamp}.png`)

  console.log(`${provider}: рисую…`)
  const image = provider === 'openai' ? await openai(args) : await gemini(args)

  // расширение файла — по тому, что реально вернула модель
  const ext = EXT[image.mime] ?? '.png'
  const out = extname(requested).toLowerCase() === ext ? requested : requested.replace(/\.[^.]+$/, '') + ext
  await mkdir(dirname(out), { recursive: true })
  await writeFile(out, Buffer.from(image.data, 'base64'))
  console.log(`готово: ${out}`)
}

main().catch((error) => {
  console.error('Ошибка:', error.message)
  process.exit(1)
})
