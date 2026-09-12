import { config } from '@dotenvx/dotenvx-ops';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REQUIRED_PRISMA_ENVIRONMENT_KEYS = ['DATABASE_URL', 'SHADOW_DATABASE_URL'] as const;
const DEFAULT_PRISMA_PROFILE = 'dev';
const backendRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Named profiles deliberately resolve only to Prisma CLI configuration files.
 * They never read the backend runtime `secrets/env` files.
 */
export const PRISMA_ENVIRONMENT_FILES = {
    dev: resolve(backendRoot, 'ops/prisma/env/.env.development'),
    test: resolve(backendRoot, 'ops/prisma/env/.env.test'),
    prod: resolve(backendRoot, 'ops/prisma/env/.env.production'),
    'dev.local': resolve(backendRoot, 'ops/prisma/env/.env.development.local'),
    'test.local': resolve(backendRoot, 'ops/prisma/env/.env.test.local'),
    'prod.local': resolve(backendRoot, 'ops/prisma/env/.env.production.local'),
} as const;

type PrismaEnvironmentName = keyof typeof PRISMA_ENVIRONMENT_FILES;
type PrismaEnvironmentKey = (typeof REQUIRED_PRISMA_ENVIRONMENT_KEYS)[number];

export type PrismaEnvironmentSource =
    { kind: 'profile'; name: string } | { kind: 'file'; path: string };

export interface PrismaCommand {
    prismaArguments: string[];
    source: PrismaEnvironmentSource;
}

export interface PrismaEnvironment {
    source: PrismaEnvironmentSource;
    filePath: string;
    values: Record<PrismaEnvironmentKey, string>;
}

/**
 * Removes this wrapper's environment selector before Prisma receives its own
 * arguments. Prisma itself does not know about --env or --env-file.
 */
export function parsePrismaCommand(rawArguments: readonly string[]): PrismaCommand {
    const prismaArguments: string[] = [];
    let source: PrismaEnvironmentSource | undefined;

    for (let index = 0; index < rawArguments.length; index++) {
        const argument = rawArguments[index];

        if (argument === '--') {
            prismaArguments.push(...rawArguments.slice(index));
            break;
        }

        const inline = argument.match(/^(--env|--env-file)=(.*)$/);
        if (inline) {
            const option = inline[1];
            source = setPrismaEnvironmentSource(
                source,
                option === '--env' ? '--env' : '--env-file',
                inline[2]
            );
            continue;
        }

        if (argument === '--env' || argument === '--env-file') {
            const value = rawArguments[index + 1];
            source = setPrismaEnvironmentSource(source, argument, value);
            index++;
            continue;
        }

        prismaArguments.push(argument);
    }

    return {
        prismaArguments,
        source: source ?? { kind: 'profile', name: DEFAULT_PRISMA_PROFILE },
    };
}

export function loadPrismaEnvironment(source: PrismaEnvironmentSource): PrismaEnvironment {
    const filePath = resolvePrismaEnvironmentFile(source);

    if (!existsSync(filePath)) {
        throw new Error(
            `Prisma environment file was not found: ${filePath}\n` +
                'Copy ops/prisma/env/.env.example and provide DATABASE_URL plus SHADOW_DATABASE_URL.'
        );
    }

    const parsed: Record<string, string> = {};

    try {
        const result = config({
            path: filePath,
            processEnv: parsed,
            override: true,
            quiet: true,
            strict: true,
        });

        if (result.error) throw result.error;
    } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        throw new Error(`Unable to load Prisma environment file ${filePath}: ${reason}`);
    }

    const values = {} as Record<PrismaEnvironmentKey, string>;

    for (const key of REQUIRED_PRISMA_ENVIRONMENT_KEYS) {
        const value = parsed[key]?.trim();
        if (!value) {
            throw new Error(`Prisma environment file ${filePath} must define ${key}.`);
        }
        values[key] = value;
    }

    return { source, filePath, values };
}

/**
 * The selected file may contain comments or incidental variables, but Prisma
 * receives only its two connection strings. Selected values take precedence
 * over similarly named values inherited from the shell.
 */
export function createPrismaProcessEnvironment(
    baseEnvironment: NodeJS.ProcessEnv,
    values: PrismaEnvironment['values']
): NodeJS.ProcessEnv {
    return {
        ...baseEnvironment,
        DATABASE_URL: values.DATABASE_URL,
        SHADOW_DATABASE_URL: values.SHADOW_DATABASE_URL,
    };
}

export function redactDatabaseUrl(value: string): string {
    try {
        const url = new URL(value);
        const credentials = url.username ? `${url.username}${url.password ? ':***' : ''}@` : '';
        return `${url.protocol}//${credentials}${url.host}${url.pathname}${url.search}`;
    } catch {
        return '<invalid URL; value redacted>';
    }
}

function setPrismaEnvironmentSource(
    current: PrismaEnvironmentSource | undefined,
    option: '--env' | '--env-file',
    value: string | undefined
): PrismaEnvironmentSource {
    if (!value || value.startsWith('--')) {
        throw new Error(`Prisma CLI option ${option} requires a value.`);
    }

    if (current) {
        throw new Error('Prisma CLI accepts only one environment selector: --env or --env-file.');
    }

    return option === '--env'
        ? { kind: 'profile', name: value }
        : { kind: 'file', path: resolve(process.cwd(), value) };
}

function resolvePrismaEnvironmentFile(source: PrismaEnvironmentSource): string {
    if (source.kind === 'file') return source.path;

    if (!isPrismaEnvironmentName(source.name)) {
        const profiles = Object.keys(PRISMA_ENVIRONMENT_FILES).join(', ');
        throw new Error(
            `Unknown Prisma environment profile "${source.name}". Available profiles: ${profiles}.`
        );
    }

    return PRISMA_ENVIRONMENT_FILES[source.name];
}

function isPrismaEnvironmentName(value: string): value is PrismaEnvironmentName {
    return Object.hasOwn(PRISMA_ENVIRONMENT_FILES, value);
}
