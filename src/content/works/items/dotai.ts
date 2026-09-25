import type { Work } from '@/content/works/types'
import dashboard from '@/assets/works/dotai/dashboard.webp'
import match from '@/assets/works/dotai/match.webp'
import compare from '@/assets/works/dotai/compare.webp'
import chat from '@/assets/works/dotai/chat.webp'

const dotai: Work = {
  slug: 'dotai',
  title: 'Mercury DotAi',
  year: '2026',
  kind: { ru: 'Дипломный проект', en: 'Thesis project' },
  lead: {
    ru: 'Веб-приложение для игроков Dota 2: собирает статистику по Steam ID из открытого API OpenDota, показывает её в наглядных графиках и объясняет ошибки в игре через ИИ.',
    en: 'A web app for Dota 2 players: it pulls stats by Steam ID from the open OpenDota API, shows them as readable charts and explains in-game mistakes with AI.',
  },
  details: [
    {
      title: { ru: 'Что внутри', en: 'What is inside' },
      text: {
        ru: 'Шесть разделов: вход и регистрация, дашборд игрока, список матчей с разбором, сравнение двух игроков, справочник героев и чат с ИИ по своей статистике.',
        en: 'Six sections: sign-in and sign-up, a player dashboard, a match list with breakdowns, a two-player comparison, a hero reference and an AI chat about your own stats.',
      },
    },
    {
      title: { ru: 'Данные', en: 'Data' },
      text: {
        ru: 'Матчи и профили приходят из OpenDota по Steam ID. Сервер на Express приводит ответы к своему формату, считает показатели и сохраняет их в SQLite, чтобы не дёргать чужой API на каждый клик.',
        en: 'Matches and profiles come from OpenDota by Steam ID. The Express server maps the responses to its own format, computes the metrics and stores them in SQLite so it does not hit the external API on every click.',
      },
    },
    {
      title: { ru: 'Разбор через ИИ', en: 'AI breakdown' },
      text: {
        ru: 'Два сценария: разбор конкретного матча и свободный чат. Промпт собирается из реальных цифр игрока — фарм, урон, участие в боях, — поэтому ответ говорит о его игре, а не общими словами.',
        en: 'Two flows: a breakdown of one match and a free-form chat. The prompt is built from the player’s real numbers — farm, damage, fight participation — so the answer is about their game, not generic advice.',
      },
    },
    {
      title: { ru: 'Аккаунты', en: 'Accounts' },
      text: {
        ru: 'Регистрация с подтверждением почты, вход по токену, пароли хранятся хешами, есть восстановление пароля письмом.',
        en: 'Sign-up with email confirmation, token-based login, hashed passwords and password recovery by email.',
      },
    },
  ],
  stat: [
    { value: '6', label: { ru: 'разделов приложения', en: 'app sections' } },
    { value: '4', label: { ru: 'радар-диаграммы в сравнении', en: 'radar charts in comparison' } },
    { value: '2', label: { ru: 'модели OpenAI', en: 'OpenAI models' } },
  ],
  stack: [
    { name: 'JavaScript', icon: 'code' },
    { name: 'Node.js + Express', icon: 'server' },
    { name: 'SQLite', icon: 'database' },
    { name: 'JWT + bcrypt', icon: 'shield' },
    { name: 'OpenAI API', icon: 'ai' },
    { name: 'OpenDota API', icon: 'game' },
    { name: 'Chart.js', icon: 'chart' },
    { name: 'Nodemailer', icon: 'mail' },
  ],
  shots: [
    { src: dashboard, caption: { ru: 'Дашборд игрока', en: 'Player dashboard' } },
    { src: match, caption: { ru: 'Разбор матча', en: 'Match breakdown' } },
    { src: compare, caption: { ru: 'Сравнение игроков', en: 'Player comparison' } },
    { src: chat, caption: { ru: 'Чат с ИИ', en: 'AI chat' } },
  ],
  demo: '',
  repo: '',
}

export default dotai
