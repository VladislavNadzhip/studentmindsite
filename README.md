# Student Mind — Landing Page

Маркетинговый сайт для desktop-приложения Student Mind.

## Быстрый запуск

### Вариант 1: Python (рекомендуется)

```bash
cd "C:\Users\Владислав\student-mind-website"
python -m http.server 8080
```

Открой в браузере: **http://localhost:8080**

### Вариант 2: Node.js (npx)

```bash
cd "C:\Users\Владислав\student-mind-website"
npx serve -p 8080
```

### Вариант 3: Live Server в VS Code / Cursor

1. Установи расширение **Live Server**
2. Открой `index.html` → правый клик → **Open with Live Server**

### Вариант 4: Просто открыть файл

Двойной клик на `index.html` — Three.js и ES-модули **не загрузятся** без локального сервера.
Обязательно используй один из вариантов выше.

## Структура

```
student-mind-website/
├── index.html          — главная страница
├── styles.css          — стили, градиенты, анимации
├── three-bg.js         — Three.js фон (mind-map частицы)
├── presentation.js     — автопрезентация (canvas-слайды)
├── main.js             — scroll-анимации, tilt-эффекты
└── assets/             — иконка, промо-изображения
```

## Ссылки на скачивание

Кнопка «Скачать» ведёт на GitHub Releases:
https://github.com/VladislavNadzhip/student-mind/releases/latest