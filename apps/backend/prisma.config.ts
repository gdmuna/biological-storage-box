import { config } from '@dotenvx/dotenvx-ops';
import { resolve } from 'path';
import { defineConfig, env } from 'prisma/config';

const DEFAULT_ENV = 'development';

/**
 * 解析要加载的 env 文件路径。优先级：
 *   1. CLI 参数 --env <name|path> 或 --env-file <path>（支持 = 和空格两种写法）
 *   2. PRISMA_ENV 环境变量（名称或路径，同上）
 *   3. NODE_ENV 环境变量，回退到 development
 *
 * 示例：
 *   pnpm prisma migrate status --env test
 *   pnpm prisma migrate status --env=production
 *   pnpm prisma migrate status --env-file ./secrets/env/.env.staging
 */
function resolveEnvPath(): string {
    const argv = process.argv;

    for (let i = 2; i < argv.length; i++) {
        // --env=<value> 或 --env-file=<value>
        const inline = argv[i].match(/^--env(?:-file)?=(.+)$/);
        if (inline) return toEnvPath(inline[1]);

        // --env <value> 或 --env-file <value>
        if ((argv[i] === '--env' || argv[i] === '--env-file') && i + 1 < argv.length) {
            return toEnvPath(argv[i + 1]);
        }
    }

    const override = process.env.PRISMA_ENV;
    if (override) return toEnvPath(override);

    return toEnvPath(process.env.NODE_ENV ?? DEFAULT_ENV);
}

function toEnvPath(value: string): string {
    const isPath = value.includes('/') || value.includes('\\') || value.startsWith('.');
    return isPath
        ? resolve(process.cwd(), value)
        : resolve(process.cwd(), `secrets/env/.env.${value}`);
}

config({ path: resolveEnvPath() });

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
