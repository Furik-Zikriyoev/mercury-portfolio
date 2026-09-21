/**
 * Русские тексты — эталон формы. Английская версия (en.ts) обязана совпадать по структуре:
 * TypeScript проверит это через `satisfies Messages`.
 */
const ru = {
  meta: {
    title: 'Фурузонфар Зикриёев — Frontend-разработчик и UI-дизайнер',
    description:
      'Фурузонфар Зикриёев — Frontend-разработчик и UI-дизайнер из Ташкента. Vue, TypeScript, WebGL, Figma.',
  },
  a11y: {
    switchLang: 'Сменить язык',
  },
  hero: {
    firstName: 'Фурузонфар',
    lastName: 'Зикриёев',
    role: 'Frontend-разработчик и UI-дизайнер',
    status: 'Открыт к предложениям',
    location: 'Ташкент',
    localTime: 'Сейчас в Ташкенте',
  },
  soon: {
    label: 'Сайт в разработке',
    text: 'Новое портфолио собирается из жидкого металла. А пока — напишите мне напрямую.',
  },
  contact: {
    email: 'Почта',
  },
}

export type Messages = typeof ru
export default ru
