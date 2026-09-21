# mercury-portfolio

Моё портфолио. Frontend-разработчик и UI-дизайнер, Ташкент.

**Сайт:** https://mercury-portfolio-ten.vercel.app

Пока в разработке.

## Стек

- Vue 3, TypeScript, Vite
- WebGL2 — эффект жидкого металла на своём шейдере, без three.js (в работе)
- Локализация RU/EN на TypeScript, без библиотек
- ESLint, Prettier
- Vercel

## Запуск

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # проверка типов и сборка
npm run preview    # просмотр сборки
```

Нужен Node.js 20.19+.

## Структура

```
src/
├── content/       # тексты RU/EN и контакты
│   └── i18n/      # ru.ts — основная локаль, en.ts должен совпадать по структуре
├── components/
├── composables/
└── styles/        # дизайн-токены и базовые стили
```
