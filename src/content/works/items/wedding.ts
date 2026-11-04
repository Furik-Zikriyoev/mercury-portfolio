import type { Work } from '@/content/works/types'
import classic from '@/assets/works/wedding/classic.webp'
import east from '@/assets/works/wedding/east.webp'
import pastel from '@/assets/works/wedding/pastel.webp'
import seating from '@/assets/works/wedding/seating.webp'

const wedding: Work = {
  slug: 'wedding',
  title: 'Свадебный сайт',
  year: '2026',
  kind: { ru: 'Шаблон для заказчиков', en: 'Template for clients' },
  lead: {
    ru: 'Сайт-приглашение на свадьбу и админка для молодожёнов: гости отвечают на приглашение, а пара рассаживает их по столам и отправляет каждому номер стола. Сначала сделал его для свадьбы друзей, потом превратил в шаблон с тремя стилями.',
    en: 'A wedding invitation site with an admin panel for the couple: guests reply to the invitation, and the couple seats them at tables and sends each guest their table number. I first built it for a friends’ wedding, then turned it into a template with three styles.',
  },
  details: [
    {
      title: { ru: 'Сайт для гостей', en: 'Site for guests' },
      text: {
        ru: 'Приглашение с анимированной монограммой, обратный отсчёт, история пары, программа дня, место с картой и кнопками Яндекс и Google Карт, дресс-код отдельно для женщин и мужчин. Форма ответа со спутниками; ответ привязан к устройству, поэтому при повторном заходе гость видит «Вы записаны». Напоминание — файлом в календарь телефона за 7, 3 и 1 день или push-уведомлением. Номер стола гость видит только после того, как пара его отправит. Русский и узбекский языки.',
        en: 'An invitation with an animated monogram, a countdown, the couple’s story, the day’s schedule, the venue with a map and Yandex and Google Maps buttons, and a dress code for women and men. A reply form with companions; the reply is tied to the device, so a returning guest sees “You are registered”. Reminders come as a phone calendar file 7, 3 and 1 day before, or as push notifications. Guests see their table number only after the couple sends it. Russian and Uzbek.',
      },
    },
    {
      title: { ru: 'Админка для пары', en: 'Admin for the couple' },
      text: {
        ru: 'Обзор: сколько людей придёт, кто без стола, хватает ли мест. Гости по группам (кто записал + спутники) с поиском, фильтрами, подсветкой возможных дублей и выгрузкой в Excel. Конструктор столов. Рассадка перетаскиванием, на телефоне — выбором стола из списка. У каждого гостя свой статус: не рассажен, готов к отправке, стол изменён, отправлено.',
        en: 'Overview: how many people are coming, who has no table, whether there are enough seats. Guests by group (the one who replied + companions) with search, filters, possible duplicate hints and Excel export. A table builder. Seating by drag and drop, on a phone by picking a table from a list. Every guest has a status: not seated, ready to send, table changed, sent.',
      },
    },
    {
      title: { ru: 'Три стиля', en: 'Three styles' },
      text: {
        ru: '«Классика» — белый, чёрный и золото; «Восток» — изумруд, золото и узбекский орнамент гирих с аркой; «Пастель» — пудровый, шалфей и ботанические ветки. У каждого стиля свои цвета, шрифты, монограмма, анимированный первый экран, таймер и палитра дресс-кода. Стиль переключается мгновенно, без перезагрузки: всё построено на CSS-переменных. Для заказчика стиль подбирается под пару.',
        en: '“Classic” — white, black and gold; “East” — emerald, gold and the Uzbek girih ornament with an arch; “Pastel” — powder, sage and botanical sprigs. Each style has its own colors, fonts, monogram, animated first screen, countdown and dress code palette. The style switches instantly, without a reload: it is all built on CSS variables. For a client, the style is chosen to fit the couple.',
      },
    },
    {
      title: { ru: 'Рабочая версия и демо', en: 'Production and demo' },
      text: {
        ru: 'В рабочей версии — база Supabase (Postgres) с защитой строк RLS, вход молодожёнов по логину и паролю, push-уведомления через Service Worker и напоминания по расписанию через Vercel Cron. В демо данные хранятся в браузере, а хранилище повторяет правила базы, поэтому можно зайти и как гость, и в админку. Кнопка «Сбросить демо» возвращает исходных гостей.',
        en: 'The production version uses a Supabase (Postgres) database with row-level security, a login and password for the couple, push notifications through a Service Worker and scheduled reminders with Vercel Cron. In the demo the data lives in the browser, and the store repeats the database rules, so you can try it both as a guest and in the admin. “Reset demo” brings back the original guests.',
      },
    },
  ],
  stat: [
    { value: '3', label: { ru: 'стиля оформления', en: 'design styles' } },
    { value: '2', label: { ru: 'языка: русский и узбекский', en: 'languages: Russian and Uzbek' } },
    { value: '6', label: { ru: 'статусов рассадки у каждого гостя', en: 'seating statuses per guest' } },
  ],
  stack: [
    { name: 'Next.js + TypeScript', icon: 'code' },
    { name: 'Tailwind CSS + shadcn/ui', icon: 'design' },
    { name: 'Motion', icon: 'design' },
    { name: 'next-intl', icon: 'web' },
    { name: 'React Hook Form + Zod', icon: 'shield' },
    { name: 'dnd-kit', icon: 'chart' },
    { name: 'Supabase · RLS', icon: 'database' },
    { name: 'Web Push', icon: 'mail' },
    { name: 'Vercel', icon: 'server' },
  ],
  shots: [
    { src: classic, caption: { ru: 'Стиль «Классика»', en: 'Classic style' } },
    { src: east, caption: { ru: 'Стиль «Восток»', en: 'East style' } },
    { src: pastel, caption: { ru: 'Стиль «Пастель»', en: 'Pastel style' } },
    { src: seating, caption: { ru: 'Рассадка в админке', en: 'Seating in the admin' } },
  ],
  demo: 'https://wedding-template-silk.vercel.app',
  repo: 'https://github.com/Furik-Zikriyoev/wedding-template',
}

export default wedding
