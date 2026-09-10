# Real-Time Collaboration Canvas

FigJam-подобная доска: стикеры, стрелки и комментарии на бесконечном холсте. Несколько пользователей правят одну доску одновременно.

Стек: **NestJS (TypeScript)** · **PostgreSQL** · **Redis** · **Socket.io** · **Prisma** · **BullMQ**.

## Запуск инфраструктуры

```bash
docker compose up -d
```

## API (этап 1)

```bash
cd api
pnpm install
pnpm start:dev
```

Проверка: `GET http://localhost:3000/health`
