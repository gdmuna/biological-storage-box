import { registerAs, ConfigType } from '@nestjs/config';
import { z } from 'zod/v4';

// http

export const THROTTLE_TTL_MS = Number(process.env.THROTTLE_TTL_MS || 300000);

export const THROTTLE_LIMIT =
    process.env.THROTTLE_LIMIT === 'Infinity'
        ? Infinity
        : Number(process.env.THROTTLE_LIMIT || 1000);

export const REQUEST_TIMEOUT_MS = Number(process.env.REQUEST_TIMEOUT_MS || 30000);

/** 请求 ID header 名称，贯穿完整请求链路 */
export const REQUEST_ID_HEADER = process.env.REQUEST_ID_HEADER?.toLowerCase() || 'x-request-id';

/** CORS 预检缓存时间（秒），对应 Access-Control-Max-Age */
export const CORS_PREFLIGHT_MAX_AGE_SECONDS = Number(
    process.env.CORS_PREFLIGHT_MAX_AGE_SECONDS || 86400
);

/** 允许的 CORS 请求方法 */
export const CORS_ALLOWED_METHODS = process.env.CORS_ALLOWED_METHODS?.split(',')
    .map((m) => m.trim())
    .filter(Boolean) || ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'];

/** 允许的 CORS 请求头 */
export const CORS_ALLOWED_HEADERS = process.env.CORS_ALLOWED_HEADERS?.split(',')
    .map((h) => h.trim())
    .filter(Boolean) || ['Content-Type', 'Authorization'];

/** 允许的 CORS 请求源列表，空数组表示不限制 */
export const CORS_ALLOWED_ORIGIN =
    process.env.CORS_ALLOWED_ORIGIN?.split(',')
        .map((o) => o.trim())
        .filter(Boolean) || [];

export const httpConfigValidateSchema = z
    .object({
        THROTTLE_TTL_MS: z.coerce.number().int().min(1000).default(300000),
        THROTTLE_LIMIT: z
            .union([z.literal('Infinity'), z.coerce.number().int().min(1)])
            .transform((val) => (val === 'Infinity' ? Infinity : val))
            .default(1000),
        REQUEST_TIMEOUT_MS: z.coerce.number().int().min(1000).max(120000).default(30000),
        REQUEST_ID_HEADER: z
            .string()
            .default('x-request-id')
            .transform((h) => h.toLowerCase()),
        CORS_PREFLIGHT_MAX_AGE_SECONDS: z.coerce.number().int().min(0).default(86400),
        CORS_ALLOWED_METHODS: z
            .string()
            .transform((s) => {
                if (s) {
                    return s
                        .split(',')
                        .map((m) => m.trim())
                        .filter(Boolean);
                } else return ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'];
            })
            .default(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']),
        CORS_ALLOWED_HEADERS: z
            .string()
            .transform((s) => {
                if (s) {
                    return s
                        .split(',')
                        .map((h) => h.trim())
                        .filter(Boolean);
                } else return ['Content-Type', 'Authorization'];
            })
            .default(['Content-Type', 'Authorization']),
        CORS_ALLOWED_ORIGIN: z
            .string()
            .transform((s) => {
                if (s) {
                    return s
                        .split(',')
                        .map((o) => o.trim())
                        .filter(Boolean);
                } else return [];
            })
            .default([]),
    })
    .transform((env) => ({
        throttleTtlMs: env.THROTTLE_TTL_MS,
        throttleLimit: env.THROTTLE_LIMIT,
        requestTimeoutMs: env.REQUEST_TIMEOUT_MS,
        requestIdHeader: env.REQUEST_ID_HEADER,
        corsPreflightMaxAgeSeconds: env.CORS_PREFLIGHT_MAX_AGE_SECONDS,
        corsAllowedMethods: env.CORS_ALLOWED_METHODS,
        corsAllowedHeaders: env.CORS_ALLOWED_HEADERS,
        corsAllowedOrigin: env.CORS_ALLOWED_ORIGIN,
    }));

export const httpConfig = registerAs('http', () => httpConfigValidateSchema.parse(process.env));

export type HttpConfig = ConfigType<typeof httpConfig>;
