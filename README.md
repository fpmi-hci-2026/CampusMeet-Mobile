# CampusMeet-Mobile

## Project Name

**CampusMeet-Mobile** — мобильное приложение CampusMeet для участников и волонтёров ФПМИ БГУ (iOS, Android, web-превью). Лабораторная работа №8 по ПЧМИ, 2026–2027.

## Description

Expo SDK 58, React Native 0.88, Expo Router, TypeScript.

| Вкладка | Экран | Мобильные сценарии |
|:--|:--|:--|
| Афиша | список, карточка мероприятия | pull-to-refresh, локальный поиск и фильтры (работают офлайн), запись в 1 касание с haptic-откликом, звёздочки докладов |
| Билеты | список, полноэкранный «AMOLED-пропуск» | QR-код рисуется из кэша и показывается без сети, чёрный фон для яркости и контраста на сканере |
| Программа | личная программа по дням | пересечения подсвечены, удаление по касанию |
| Профиль | вход/регистрация, профиль, сканер | токены в Keychain/Keystore (SecureStore), сканер QR для волонтёров |

**Офлайн-режим.** Ответы API кэшируются в AsyncStorage (stale-while-revalidate); при отсутствии сети показывается баннер «Нет сети — данные от HH:MM». Волонтёр заранее загружает офлайн-манифест подписанных билетов. Без сети скан проверяется по манифесту, повторный проход блокируется локально, а сканы ставятся в очередь и отправляются одним пакетом (`POST /check-in-batches`), когда связь вернётся.

Навигация: нативные вкладки (`NativeTabs`: UITabBarController / BottomNavigationView) и стеки с модальным пропуском; в web-сборке — нижняя панель с учётом safe-area. Тач-цели ≥ 44–48 pt, светлая и тёмная тема, подписи для скринридеров (`accessibilityRole`, `accessibilityLabel`, live-регионы).

## Installation

Node.js 20+, Expo Go на телефоне (SDK 58) или эмулятор. API — [CampusMeet-Server](https://github.com/fpmi-hci-2026/CampusMeet-Server).

```bash
git clone git@github.com:fpmi-hci-2026/CampusMeet-Mobile.git
cd CampusMeet-Mobile
npm ci
cp .env.example .env    # EXPO_PUBLIC_API_BASE_URL=http://<IP компьютера>:8000/api/v1
npx expo start          # QR-код для Expo Go; a — Android, i — iOS, w — web
```

Android-эмулятор обращается к API на хосте через `10.0.2.2` (по умолчанию). Для телефона запустите сервер с `--host 0.0.0.0` и добавьте адрес в `CAMPUSMEET_CORS_ORIGINS` для web-сборки.

## Usage

Демо: `artem@example.invalid` (участник), `daria@example.invalid` (волонтёр, доступен сканер), пароль `campusmeet2026`.

| Команда | Что делает |
|:--|:--|
| `npm run lint`, `npm run typecheck`, `npm test` | ESLint (expo), TypeScript, Vitest (правила офлайн-чекина, валидация, форматирование) |
| `npx expo-doctor` | совместимость зависимостей с SDK |
| `npx expo export --platform ios --platform android` | Hermes-бандлы |
| `npm run export:web` | web-сборка в `dist/` |
| `PLAYWRIGHT_PATH=../CampusMeet-Web/node_modules/playwright node scripts/screenshots.mjs out` | скриншоты iPhone 15 Pro / Pixel 7 |
| `npx eas-cli build -p android --profile preview` | APK через EAS ([eas.json](eas.json)) |

## CI

[.github/workflows/ci.yml](.github/workflows/ci.yml): `quality` (ESLint, tsc, Vitest, expo-doctor, Semgrep, SonarCloud при `SONAR_TOKEN`) → `bundle` (iOS/Android Hermes + web-артефакт) → `eas` (APK из `main`, если задан `EXPO_TOKEN`).

## Sub modules

- [CampusMeet](https://github.com/fpmi-hci-2026/CampusMeet) — документация и отчёты.
- [CampusMeet-Server](https://github.com/fpmi-hci-2026/CampusMeet-Server) — API и MCP.
- [CampusMeet-Web](https://github.com/fpmi-hci-2026/CampusMeet-Web) — веб-приложение.

## Contributing

Команда: Минчук Станислав, Иванова Виктория, Шварцман Дидар. Пакеты ставятся через `npx expo install` (версии под SDK). Перед PR: `npm run lint && npm run typecheck && npm test`.
