# Читаем мысли 🧠❤️

Мультиплеерная игра для пар — каждый отвечает на своём телефоне!

## Быстрый старт

### 1. Настройка Firebase

1. Перейди на [firebase.google.com](https://firebase.google.com) и создай новый проект
2. В консоли Firebase выбери **Realtime Database** → **Создать базу данных**
3. Выбери регион (Europe-West рекомендован для России)
4. Установи правила безопасности — для теста используй открытые правила:
   ```json
   {
     "rules": {
       ".read": true,
       ".write": true
     }
   }
   ```
   > Для продакшена настрой более строгие правила!
5. Перейди в **Настройки проекта** → **Твои приложения** → добавь Web App
6. Скопируй конфигурацию Firebase

### 2. Настройка окружения

```bash
cp .env.example .env
```

Заполни `.env` своими значениями из Firebase:

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=my-project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://my-project-default-rtdb.europe-west1.firebasedatabase.app
VITE_FIREBASE_PROJECT_ID=my-project
VITE_FIREBASE_STORAGE_BUCKET=my-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

### 3. Запуск

```bash
npm install
npm run dev
```

Открой `http://localhost:5173` в браузере.

## Как играть

1. **Игрок 1** открывает игру и нажимает «Создать комнату», вводит своё имя
2. **Игрок 1** получает 6-символьный код комнаты — показывает его партнёру
3. **Игрок 2** нажимает «Войти в комнату», вводит имя и код
4. Игра начинается автоматически!
5. Каждый отвечает на вопросы A или Б на своём телефоне
6. После ответа обоих — видите результат и получаете +2 очка за совпадение
7. 10 раундов → итоговый результат с процентом совпадений

## Технологии

- **React 18** + **Vite** — быстрый фронтенд
- **Firebase Realtime Database** — синхронизация в реальном времени
- **canvas-confetti** — анимация конфетти при совпадении
- **Google Fonts** (Nunito + Paytone One) — типографика

## Сборка для продакшена

```bash
npm run build
```

Файлы появятся в папке `dist/` — можно деплоить на любой хостинг статики (Vercel, Netlify, Firebase Hosting и т.д.).
