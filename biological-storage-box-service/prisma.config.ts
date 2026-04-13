import { config } from '@dotenvx/dotenvx-ops';
import { resolve } from 'path';
import { defineConfig, env } from 'prisma/config';

const suffix = process.env.NODE_ENV ?? 'development';
const path = resolve(process.cwd(), `.env.${suffix}`);
config({ path });

export default defineConfig({
    schema: 'prisma/schema.prisma',
    migrations: {
        path: 'prisma/migrations',
        seed: 'tsx prisma/seed.ts',
    },
    datasource: {
        url: env('DATABASE_URL'),
        shadowDatabaseUrl: env('SHADOW_DATABASE_URL'),
    },
});
