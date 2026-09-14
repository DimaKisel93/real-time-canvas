import { config } from 'dotenv';
import { defineConfig, env } from 'prisma/config';
import { resolve } from 'node:path';

// Prefer repo-root .env, fall back to api/.env
config({ path: resolve(import.meta.dirname, '../.env') });
config({ path: resolve(import.meta.dirname, '.env') });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
