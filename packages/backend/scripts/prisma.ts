import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { relative } from 'node:path';

import {
    createPrismaProcessEnvironment,
    loadPrismaEnvironment,
    parsePrismaCommand,
    redactDatabaseUrl,
} from './prisma-environment.js';

/**
 * Prisma CLI entrypoint.
 *
 *   pnpm prisma migrate status --env test
 *   pnpm prisma migrate status --env=production
 *   pnpm prisma migrate status --env-file ./ops/prisma/env/.env.staging
 */
const requireFromHere = createRequire(import.meta.url);
const prismaCliPath = requireFromHere.resolve('prisma/build/index.js');

try {
    const command = parsePrismaCommand(process.argv.slice(2));
    const environment = loadPrismaEnvironment(command.source);
    const displayPath = relative(process.cwd(), environment.filePath) || '.';
    const sourceLabel =
        environment.source.kind === 'profile'
            ? `profile "${environment.source.name}"`
            : 'explicit env file';

    console.info(`[prisma] Using ${sourceLabel}: ${displayPath}`);
    console.info(
        `[prisma] Injected DATABASE_URL=${redactDatabaseUrl(environment.values.DATABASE_URL)}`
    );
    console.info(
        `[prisma] Injected SHADOW_DATABASE_URL=${redactDatabaseUrl(environment.values.SHADOW_DATABASE_URL)}`
    );

    const child = spawn(process.execPath, [prismaCliPath, ...command.prismaArguments], {
        env: createPrismaProcessEnvironment(process.env, environment.values),
        stdio: 'inherit',
    });

    child.on('error', (error) => {
        console.error(`[prisma] Unable to start Prisma CLI: ${error.message}`);
        process.exit(1);
    });

    child.on('exit', (code) => process.exit(code ?? 1));
} catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[prisma] ${message}`);
    process.exit(1);
}
