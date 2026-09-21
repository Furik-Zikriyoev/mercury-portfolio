// Основная локаль. en.ts должен совпадать по структуре (проверяется через satisfies).
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
    text: 'Полная версия скоро. Пока можно написать мне напрямую.',
  },
  contact: {
    email: 'Почта',
  },
}

export type Messages = typeof ru
export default ru
