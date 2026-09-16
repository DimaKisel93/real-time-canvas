# Real-Time Collaboration Canvas

FigJam-подобная доска: стикеры, стрелки и комментарии на бесконечном холсте. Несколько пользователей правят одну доску одновременно.

Стек: **NestJS (TypeScript)** · **PostgreSQL** · **Redis** · **Socket.io** · **Prisma** · **BullMQ**.

## Быстрый старт

1. Скопируйте env и поднимите инфраструктуру:

   ```bash
   cp .env.example .env
   docker compose up -d
   ```

2. Установите зависимости API и сгенерируйте Prisma Client:

   ```bash
   cd api
   pnpm install
   pnpm prisma:generate
   ```

3. Примените миграции:

   ```bash
   pnpm prisma:migrate
   ```

4. Запустите API:

   ```bash
   pnpm start:dev
   ```

Проверка: `GET http://localhost:3000/health`

Защищённые маршруты ждут `Authorization: Bearer <token>`.

### Auth

| Метод | Путь             | Auth | Описание                                               |
| ----- | ---------------- | ---- | ------------------------------------------------------ |
| POST  | `/auth/register` | нет  | Регистрация, ответ: `{ accessToken, tokenType, user }` |
| POST  | `/auth/login`    | нет  | Логин по email/password                                |
| GET   | `/auth/me`       | JWT  | Текущий пользователь                                   |
| POST  | `/users`         | нет  | Регистрация без токена (как раньше)                    |
| GET   | `/users/:id`     | JWT  | Публичный профиль                                      |

Миграции: `api/prisma/migrations`. Схема: `api/prisma/schema.prisma`.
