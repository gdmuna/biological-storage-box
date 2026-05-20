/**
 * Prisma CLI wrapper
 *
 * 在真正调用 Prisma 之前拦截 --env / --env-file 参数，将其转换为
 * PRISMA_ENV 环境变量后再透传给 Prisma，从而避免 Prisma 报 unknown option。
 *
 * 用法（与直接用 prisma 完全相同，额外支持 --env / --env-file）：
 *   pnpm prisma migrate status --env test
 *   pnpm prisma migrate status --env=production
 *   pnpm prisma migrate status --env-file ./secrets/env/.env.staging
 *   pnpm prisma migrate dev           # 无 --env 时行为不变
 */
import { spawn } from 'child_process';

const raw = process.argv.slice(2);
let prismaEnv: string | undefined;
const filtered: string[] = [];

for (let i = 0; i < raw.length; i++) {
    // --env=<value> 或 --env-file=<value>
    const inline = raw[i].match(/^--env(?:-file)?=(.+)$/);
    if (inline) {
        prismaEnv = inline[1];
        continue;
    }
    // --env <value> 或 --env-file <value>
    if ((raw[i] === '--env' || raw[i] === '--env-file') && i + 1 < raw.length) {
        prismaEnv = raw[++i];
        continue;
    }
    filtered.push(raw[i]);
}

const env = prismaEnv ? { ...process.env, PRISMA_ENV: prismaEnv } : process.env;

const child = spawn('prisma', filtered, { stdio: 'inherit', env, shell: true });
child.on('exit', (code) => process.exit(code ?? 0));
