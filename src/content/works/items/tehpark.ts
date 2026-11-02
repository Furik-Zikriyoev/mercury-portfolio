import type { Work } from '@/content/works/types'
import overview from '@/assets/works/tehpark/overview.webp'
import list from '@/assets/works/tehpark/list.webp'
import card from '@/assets/works/tehpark/card.webp'
import dark from '@/assets/works/tehpark/dark.webp'

const tehpark: Work = {
  slug: 'tehpark',
  title: 'Техпарк',
  year: '2026',
  kind: { ru: 'Тестовое задание, доведённое до продукта', en: 'Test task grown into a product' },
  lead: {
    ru: 'Веб-приложение для учёта строительной техники: обзор парка, список с поиском и фильтрами, карточка машины с историей обслуживания. Начинал как тестовое задание на позицию Middle Frontend, потом довёл до вида готового продукта.',
    en: 'A web app for tracking construction equipment: a fleet overview, a list with search and filters, and a unit card with service history. It started as a test task for a Middle Frontend role, and I then brought it to the level of a finished product.',
  },
  details: [
    {
      title: { ru: 'Что внутри', en: 'What is inside' },
      text: {
        ru: 'Обзор парка с готовностью в процентах, разбивкой по типам и списком машин, которым нужно ТО. Список техники с поиском, фильтрами, сортировкой и пагинацией. Карточка машины со сменой статуса и историей обслуживания. Форма создания и редактирования. Светлая и тёмная тема, на телефоне таблица превращается в карточки.',
        en: 'A fleet overview with readiness in percent, a breakdown by type and a list of units due for service. An equipment list with search, filters, sorting and pagination. A unit card with status switching and service history. A create and edit form. Light and dark themes; on a phone the table turns into cards.',
      },
    },
    {
      title: { ru: 'Состояние в адресе', en: 'State in the URL' },
      text: {
        ru: 'Поиск, фильтры, сортировка и номер страницы хранятся в URL: после перезагрузки или по ссылке открывается тот же экран. Поиск срабатывает через 300 мс после ввода, при смене фильтра страница сбрасывается на первую. TanStack Query отменяет устаревшие запросы, поэтому при быстрых кликах не мелькают чужие данные.',
        en: 'Search, filters, sorting and the page number live in the URL: a reload or a shared link opens the same screen. Search fires 300 ms after typing, and changing a filter resets the page to the first one. TanStack Query cancels stale requests, so fast clicking never flashes outdated data.',
      },
    },
    {
      title: { ru: 'Форма', en: 'The form' },
      text: {
        ru: 'React Hook Form и Zod: проверка пробега и даты ТО, асинхронная проверка уникальности гос. номера при уходе с поля, при редактировании текущая запись исключается. Кнопка сохранения неактивна, пока форма невалидна. При уходе со страницы с несохранёнными изменениями появляется предупреждение.',
        en: 'React Hook Form and Zod: mileage and service date validation, an async uniqueness check of the plate number on blur that skips the current record when editing. The save button stays disabled while the form is invalid. Leaving the page with unsaved changes shows a warning.',
      },
    },
    {
      title: { ru: 'Данные без бэкенда', en: 'Data without a backend' },
      text: {
        ru: 'API эмулируется через MSW прямо в браузере: 87 машин, фильтрация, сортировка и пагинация считаются на стороне «сервера». Если браузер не пускает Service Worker, запросы перехватываются через fetch теми же обработчиками. Тесты на Vitest покрывают валидацию формы и разбор параметров URL.',
        en: 'The API is emulated with MSW right in the browser: 87 units, with filtering, sorting and pagination done on the “server” side. If the browser blocks the Service Worker, requests are intercepted at the fetch level by the same handlers. Vitest tests cover form validation and URL parameter parsing.',
      },
    },
  ],
  stat: [
    { value: '87', label: { ru: 'единиц техники в демо', en: 'units in the demo' } },
    { value: '4', label: { ru: 'экрана: обзор, список, карточка, форма', en: 'screens: overview, list, card, form' } },
    { value: '2', label: { ru: 'темы оформления', en: 'color themes' } },
  ],
  stack: [
    { name: 'React + TypeScript', icon: 'code' },
    { name: 'TanStack Query', icon: 'server' },
    { name: 'React Hook Form + Zod', icon: 'shield' },
    { name: 'React Router', icon: 'web' },
    { name: 'Mantine', icon: 'design' },
    { name: 'MSW', icon: 'database' },
    { name: 'Vitest', icon: 'chart' },
    { name: 'Vercel', icon: 'web' },
  ],
  shots: [
    { src: overview, caption: { ru: 'Обзор парка', en: 'Fleet overview' } },
    { src: list, caption: { ru: 'Список техники', en: 'Equipment list' } },
    { src: card, caption: { ru: 'Карточка машины', en: 'Unit card' } },
    { src: dark, caption: { ru: 'Тёмная тема', en: 'Dark theme' } },
  ],
  demo: 'https://equipment-registry-two.vercel.app',
  repo: 'https://github.com/Furik-Zikriyoev/equipment-registry',
}

export default tehpark
