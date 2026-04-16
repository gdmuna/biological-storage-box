import { registerAs, ConfigType } from '@nestjs/config';
import { z } from 'zod/v4';

function normalizeS3Endpoint(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return trimmed;
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `http://${trimmed}`;
}

const StorageConfigValidateSchema = z
    .object({
        S3_ENDPOINT: z
            .string()
            .min(1)
            .transform((v) => normalizeS3Endpoint(v))
            .pipe(z.url()),
        S3_REGION: z.string().min(1).default('us-east-1'),
        S3_ACCESS_KEY_ID: z.string().min(1),
        S3_SECRET_ACCESS_KEY: z.string().min(1),
        S3_BUCKET_IMG: z.string().min(1).default('img'),
        S3_BUCKET_SHARE: z.string().min(1).default('share'),
        S3_FORCE_PATH_STYLE: z
            .enum(['true', 'false'])
            .transform((v) => v === 'true')
            .default(true),
        S3_PUBLIC_BASE_URL: z
            .string()
            .optional()
            .transform((v) => (v ? normalizeS3Endpoint(v) : undefined)),
    })
    .transform((env) => ({
        endpoint: env.S3_ENDPOINT,
        region: env.S3_REGION,
        accessKeyId: env.S3_ACCESS_KEY_ID,
        secretAccessKey: env.S3_SECRET_ACCESS_KEY,
        bucketImg: env.S3_BUCKET_IMG,
        bucketShare: env.S3_BUCKET_SHARE,
        forcePathStyle: env.S3_FORCE_PATH_STYLE,
        publicBaseUrl: env.S3_PUBLIC_BASE_URL,
    }));

export const storageConfig = registerAs('storage', () =>
    StorageConfigValidateSchema.parse(process.env)
);

export type StorageConfig = ConfigType<typeof storageConfig>;
