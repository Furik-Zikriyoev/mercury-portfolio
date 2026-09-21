// Основная локаль. en.ts должен совпадать по структуре (проверяется через satisfies).
const ru = {
  meta: {
    title: 'Фурузонфар Зикриёев — Frontend-разработчик и UI-дизайнер',
    description:
      'Фурузонфар Зикриёев — Frontend-разработчик и UI-дизайнер из Ташкента. Vue, TypeScript, WebGL, Figma.',
  },
  a11y: {
    switchLang: 'Сменить язык',
    nav: 'Навигация по разделам',
  },
  nav: {
    menu: 'Меню',
    scrolled: 'Прочитано',
    timezone: 'Ташкент · UTC+5',
    copy: 'Скопировать номер',
    copied: 'Скопировано',
    sections: {
      hero: 'Главная',
      sandbox: 'Песочница',
      manifesto: 'Подход',
      about: 'Обо мне',
      experience: 'Опыт',
      specs: 'Навыки',
      work: 'Работы',
      contact: 'Контакты',
    },
  },
  intro: {
    skip: 'Пропустить',
  },
  hero: {
    firstName: 'Фурузонфар',
    lastName: 'Зикриёев',
    role: 'Frontend-разработчик и UI-дизайнер',
    status: 'Открыт к предложениям',
    location: 'Ташкент',
    localTime: 'Сейчас в Ташкенте',
    cta: 'Связаться',
    scroll: 'Листайте',
  },
  contact: {
    email: 'Почта',
  },
}

export type Messages = typeof ru
export default ru
