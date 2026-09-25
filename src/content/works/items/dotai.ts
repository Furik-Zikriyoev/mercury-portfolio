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
        ru: 'Шесть разделов: профиль игрока с графиками, герои с винрейтом по каждому, список матчей с разбором, ИИ-анализ статистики, сравнение двух игроков и чат с ИИ-коучем.',
        en: 'Six sections: a player profile with charts, heroes with a win rate for each, a match list with breakdowns, AI stats analysis, a two-player comparison and a chat with an AI coach.',
      },
    },
    {
      title: { ru: 'Данные', en: 'Data' },
      text: {
        ru: 'Матчи и профили приходят из открытого API OpenDota по Steam ID. Браузер запрашивает их напрямую и кэширует на 30 минут, чтобы не дёргать API на каждый клик. Сервер на Express отвечает за аккаунты и запросы к ИИ.',
        en: 'Matches and profiles come from the open OpenDota API by Steam ID. The browser requests them directly and caches them for 30 minutes so it does not hit the API on every click. The Express server handles accounts and AI requests.',
      },
    },
    {
      title: { ru: 'Разбор через ИИ', en: 'AI breakdown' },
      text: {
        ru: 'Три вида разбора — общая статистика, пул героев и конкретный матч — и свободный чат. Промпт собирается на сервере из реальных цифр игрока: винрейт, KDA, GPM и XPM, урон, нетворс, — поэтому ответ говорит о его игре, а не общими словами.',
        en: 'Three kinds of breakdown — overall stats, hero pool and a single match — plus a free-form chat. The prompt is built on the server from the player’s real numbers: win rate, KDA, GPM and XPM, damage, net worth — so the answer is about their game, not generic advice.',
      },
    },
    {
      title: { ru: 'Аккаунты и демо', en: 'Accounts and demo' },
      text: {
        ru: 'Регистрация по почте и Steam ID, вход по JWT, пароли хранятся хешами bcrypt, сброс пароля по одноразовой ссылке. Для гостей есть демо-вход без регистрации. Запросы к ИИ ограничены суточными лимитами на пользователя и на весь сервис.',
        en: 'Sign-up with email and Steam ID, JWT login, passwords stored as bcrypt hashes, password reset via a one-time link. Guests can use a demo login without signing up. AI requests are capped by daily limits per user and for the whole service.',
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
    { name: 'SQLite · Turso', icon: 'database' },
    { name: 'JWT + bcrypt', icon: 'shield' },
    { name: 'OpenAI API', icon: 'ai' },
    { name: 'OpenDota API', icon: 'game' },
    { name: 'Chart.js', icon: 'chart' },
    { name: 'Nodemailer', icon: 'mail' },
    { name: 'Vercel', icon: 'web' },
  ],
  shots: [
    { src: dashboard, caption: { ru: 'Дашборд игрока', en: 'Player dashboard' } },
    { src: match, caption: { ru: 'Разбор матча', en: 'Match breakdown' } },
    { src: compare, caption: { ru: 'Сравнение игроков', en: 'Player comparison' } },
    { src: chat, caption: { ru: 'Чат с ИИ', en: 'AI chat' } },
  ],
  demo: 'https://mercury-dotai.vercel.app/?demo=1',
  repo: 'https://github.com/Furik-Zikriyoev/mercury-dotai',
}

export default dotai
