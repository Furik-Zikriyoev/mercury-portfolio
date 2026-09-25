import type { Localized } from '@/content/i18n'

/** Иконка чипа стека. Имена соответствуют карте в WorkBanner.vue */
export type StackIcon =
  | 'code'
  | 'server'
  | 'database'
  | 'shield'
  | 'ai'
  | 'game'
  | 'chart'
  | 'mail'
  | 'design'
  | 'web'

export interface WorkShot {
  src: string
  caption: Localized
}

export interface WorkDetail {
  title: Localized
  text: Localized
}

export interface WorkStat {
  value: string
  label: Localized
}

/**
 * Одна работа = один файл в content/works/items.
 * Скопировать dotai.ts, заменить поля, добавить в content/works/index.ts.
 */
export interface Work {
  /** адрес и якорь на странице работ */
  slug: string
  title: string
  year: string
  /** «Дипломный проект», «Тестовое задание», «Коммерческий проект» */
  kind: Localized
  /** одно предложение: что это и для кого */
  lead: Localized
  /** 2–4 блока: что внутри, данные, ИИ, аккаунты… */
  details: WorkDetail[]
  stat: WorkStat[]
  stack: { name: string; icon: StackIcon }[]
  shots: WorkShot[]
  /** пустая строка — кнопка показывает «Демо скоро» */
  demo: string
  /** пустая строка — кнопка исходников не показывается */
  repo: string
}
