import type { Mercury } from '@/engine'
import type { Locale } from '@/content/i18n'
import type { Messages } from '@/content/i18n/ru'
import { profile } from '@/content/profile'
import { SECTIONS, type SectionId } from '@/content/sections'

export type LineKind = 'out' | 'muted' | 'accent' | 'err' | 'cmd'

export interface Line {
  text: string
  kind?: LineKind
  href?: string
}

/** Всё, что команды могут трогать на странице */
export interface TerminalContext {
  /** геттер: всегда тексты текущего языка */
  readonly t: Messages
  engine: Mercury | null
  time: string
  soundSupported: boolean
  setLocale: (locale: Locale) => void
  setSound: (on: boolean) => void
  scrollTo: (id: SectionId) => void
  copy: (text: string) => Promise<boolean>
  clear: () => void
  close: () => void
  melt: () => void
}

type Result = Line[] | Promise<Line[]>
type Command = (args: string[], ctx: TerminalContext) => Result

const fmt = (s: string, vars: Record<string, string | number>) =>
  s.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ''))

const SECTION_IDS = SECTIONS.map((s) => s.id) as SectionId[]
const isSection = (v: string | undefined): v is SectionId => SECTION_IDS.includes(v as SectionId)

const contactLines = (ctx: TerminalContext): Line[] => [
  { text: `${ctx.t.contact.phone.padEnd(10)} ${profile.phoneDisplay}`, href: `tel:${profile.phone}` },
  { text: `${ctx.t.contact.email.padEnd(10)} ${profile.email}`, href: `mailto:${profile.email}` },
  ...profile.socials.map((s) => ({ text: `${s.label.padEnd(10)} ${s.handle}`, href: s.href })),
]

const commands: Record<string, Command> = {
  help: (_, { t }) => {
    const width = Math.max(...t.terminal.help.map((h) => h.cmd.length)) + 3
    return t.terminal.help.map((h) => ({
      text: h.desc ? `${h.cmd.padEnd(width)}${h.desc}` : h.cmd,
      kind: h.desc ? 'out' : 'muted',
    }))
  },

  about: (_, { t }) => t.terminal.about.map((text) => ({ text })),

  skills: (_, { t }) =>
    t.specs.rows.flatMap((row) => [
      { text: row.label, kind: 'accent' as const },
      { text: `  ${row.main}` },
    ]),

  work: (_, ctx) => {
    ctx.scrollTo('work')
    return [{ text: ctx.t.terminal.work }]
  },

  contact: (_, ctx) => contactLines(ctx),

  goto: ([target], ctx) => {
    const { t } = ctx
    if (!isSection(target)) {
      return [{ text: fmt(t.terminal.goto.usage, { list: SECTION_IDS.join(', ') }), kind: 'muted' }]
    }
    ctx.scrollTo(target)
    return [{ text: fmt(t.terminal.goto.done, { name: t.nav.sections[target] }) }]
  },

  lang: ([code], ctx) => {
    if (code !== 'ru' && code !== 'en') return [{ text: ctx.t.terminal.lang.usage, kind: 'muted' }]
    ctx.setLocale(code)
    // ctx.t — геттер, после смены языка он уже отдаёт новые тексты
    return [{ text: ctx.t.terminal.lang.done }]
  },

  copy: async ([what], ctx) => {
    const value = what === 'phone' ? profile.phone : what === 'email' ? profile.email : null
    if (!value) return [{ text: ctx.t.terminal.copy.usage, kind: 'muted' }]
    const ok = await ctx.copy(value)
    return ok
      ? [{ text: fmt(ctx.t.terminal.copy.done, { value }), kind: 'accent' }]
      : [{ text: ctx.t.terminal.copy.fail, kind: 'err' }]
  },

  mercury: ([action], { t, engine }) => {
    const m = t.terminal.mercury
    if (!engine) return [{ text: m.off, kind: 'err' }]
    if (action === 'shake') {
      engine.shake(1100)
      engine.shakeArena()
      return [{ text: m.shake }]
    }
    if (action === 'splash') {
      engine.splash(window.innerWidth / 2, window.innerHeight * 0.75, 14)
      return [{ text: m.splash }]
    }
    if (action === 'stats') {
      const s = engine.stats
      return [
        {
          text: fmt(m.stats, { fps: Math.round(s.fps), drops: s.drops, quality: s.quality, pr: s.pixelRatio.toFixed(2) }),
          kind: 'accent',
        },
      ]
    }
    return [{ text: m.usage, kind: 'muted' }]
  },

  sound: ([state], ctx) => {
    const s = ctx.t.terminal.sound
    if (!ctx.soundSupported) return [{ text: s.unsupported, kind: 'err' }]
    if (state !== 'on' && state !== 'off') return [{ text: s.usage, kind: 'muted' }]
    ctx.setSound(state === 'on')
    return [{ text: state === 'on' ? s.on : s.off }]
  },

  ls: () => [{ text: SECTION_IDS.map((id) => `${id}/`).join('  ') }],

  cd: ([target], ctx) => commands.goto!([(target ?? '').replace(/\/$/, '')], ctx),

  date: (_, { t, time }) => [{ text: fmt(t.terminal.date, { time }) }],

  whoami: (_, { t }) => [{ text: t.terminal.whoami }],

  echo: (args) => [{ text: args.join(' ') }],

  hello: (_, { t }) => [{ text: t.terminal.hello }],

  sudo: (args, ctx) => {
    if (args[0] === 'hire') {
      window.setTimeout(() => {
        ctx.close()
        ctx.scrollTo('contact')
      }, 1200)
      return ctx.t.terminal.sudoHire.map((text) => ({ text, kind: 'accent' as const }))
    }
    return [{ text: ctx.t.terminal.sudoDenied, kind: 'err' }]
  },

  // секрет: то же, что набрать Z F F на странице
  zff: (_, ctx) => {
    ctx.close()
    window.setTimeout(ctx.melt, 450)
    return []
  },

  rm: (_, { t }) => [{ text: t.terminal.rm, kind: 'err' }],

  clear: (_, ctx) => {
    ctx.clear()
    return []
  },

  exit: (_, ctx) => {
    ctx.close()
    return []
  },
}

/** Команды, которые видно в help и в автодополнении */
export const PUBLIC_COMMANDS = [
  'help',
  'about',
  'skills',
  'work',
  'contact',
  'goto',
  'copy',
  'lang',
  'mercury',
  'sound',
  'ls',
  'date',
  'whoami',
  'clear',
  'exit',
]

const ARGS: Record<string, string[]> = {
  goto: SECTION_IDS,
  cd: SECTION_IDS,
  copy: ['phone', 'email'],
  lang: ['ru', 'en'],
  mercury: ['shake', 'splash', 'stats'],
  sound: ['on', 'off'],
}

function distance(a: string, b: string): number {
  const dp = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0]!
    dp[0] = i
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j]!
      dp[j] = Math.min(dp[j]! + 1, dp[j - 1]! + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1))
      prev = tmp
    }
  }
  return dp[b.length]!
}

export async function run(input: string, ctx: TerminalContext): Promise<Line[]> {
  const [name = '', ...args] = input.trim().split(/\s+/)
  // на русской раскладке zff набирается как яаа
  const key = name.toLowerCase() === 'яаа' ? 'zff' : name.toLowerCase()
  const cmd = commands[key]
  if (cmd) return cmd(args, ctx)

  const out: Line[] = [{ text: fmt(ctx.t.terminal.notFound, { cmd: name }), kind: 'err' }]
  const best = PUBLIC_COMMANDS.map((c) => ({ c, d: distance(name.toLowerCase(), c) })).sort((a, b) => a.d - b.d)[0]
  if (best && best.d <= 2) out.push({ text: fmt(ctx.t.terminal.didYouMean, { cmd: best.c }), kind: 'muted' })
  return out
}

/** Дополнение по Tab: команда или её аргумент */
export function complete(input: string): string {
  const parts = input.replace(/^\s+/, '').split(/\s+/)
  if (parts.length === 1) {
    const hits = PUBLIC_COMMANDS.filter((c) => c.startsWith(parts[0]!.toLowerCase()))
    return hits.length === 1 ? `${hits[0]} ` : input
  }
  const [name, ...rest] = parts
  const options = ARGS[name!.toLowerCase()]
  const last = rest[rest.length - 1] ?? ''
  if (!options || rest.length > 1) return input
  const hits = options.filter((o) => o.startsWith(last))
  return hits.length === 1 ? `${name} ${hits[0]}` : input
}
