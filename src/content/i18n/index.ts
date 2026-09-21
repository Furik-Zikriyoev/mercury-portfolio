import { computed, readonly, ref, watchEffect } from 'vue'
import ru, { type Messages } from './ru'
import en from './en'

export type Locale = 'ru' | 'en'
export const LOCALES: readonly Locale[] = ['ru', 'en']

/** Строка на двух языках — для данных вне ru.ts/en.ts (например, работ в портфолио) */
export type Localized<T = string> = Record<Locale, T>

const messages: Record<Locale, Messages> = { ru, en }
const STORAGE_KEY = 'locale'

export function isLocale(value: unknown): value is Locale {
  return value === 'ru' || value === 'en'
}

function detectLocale(): Locale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (isLocale(saved)) return saved
  } catch {
    /* localStorage недоступен (приватный режим) */
  }
  return navigator.language.toLowerCase().startsWith('en') ? 'en' : 'ru'
}

const locale = ref<Locale>(detectLocale())

// Синхронизируем <html lang>, заголовок, description и сохранённый выбор
watchEffect(() => {
  const m = messages[locale.value]
  document.documentElement.lang = locale.value
  document.title = m.meta.title
  document.querySelector('meta[name="description"]')?.setAttribute('content', m.meta.description)
  try {
    localStorage.setItem(STORAGE_KEY, locale.value)
  } catch {
    /* ignore */
  }
})

/**
 * Типобезопасный i18n без библиотек: `t.value.hero.role`.
 * Опечатка в ключе или непереведённая строка — ошибка компиляции.
 */
export function useI18n() {
  const t = computed(() => messages[locale.value])
  const setLocale = (next: Locale) => (locale.value = next)
  return { t, locale: readonly(locale), setLocale }
}
