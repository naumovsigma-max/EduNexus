# EduNexus

EduNexus — образовательная веб-платформа для учеников, учителей, администраторов и гостей.

## Стек

- Frontend: HTML5, CSS3, TypeScript (без фреймворков)
- Backend: Node.js + Express
- База данных: SQLite (better-sqlite3)

## Основной функционал

- Регистрация/вход (email + пароль)
- Профиль пользователя с XP, уровнем и аватаром
- Загрузка материалов (гость/авторизованный пользователь)
- Модерация материалов администратором
- Каталог одобренных материалов
- Создание и прохождение тестов
- Лидерборд учеников
- Daily tasks API

## Безопасность

- Валидация MIME типов файлов
- Ограничение размера загрузок до 50MB
- Заголовки безопасности (helmet)
- Базовая защита от XSS в клиентском рендеринге

## Структура проекта

- `frontend/`:
  - `index.html`
  - `login.html`
  - `register.html`
  - `dashboard.html`
  - `profile.html`
  - `styles.css`
  - `app.ts`
  - `app.js`
- `server.js`
- `routes/`
- `controllers/`
- `models/`
- `uploads/`

## Запуск

```bash
npm install
npm run start
```

Откройте `http://localhost:3000/index.html`.
