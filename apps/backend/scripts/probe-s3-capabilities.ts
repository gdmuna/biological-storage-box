import {
    AbortMultipartUploadCommand,
    CompleteMultipartUploadCommand,
    CopyObjectCommand,
    CreateMultipartUploadCommand,
    DeleteObjectCommand,
    GetObjectCommand,
    HeadBucketCommand,
    ListObjectsV2Command,
    PutObjectCommand,
    S3Client,
    UploadPartCommand,
} from '@aws-sdk/client-s3';
import { randomUUID } from 'node:crypto';

type ChecksumMode = 'WHEN_SUPPORTED' | 'WHEN_REQUIRED';

interface ProbeResult {
    name: string;
    supported: boolean;
    message: string;
}

interface AwsLikeError extends Error {
    code?: string;
    requestId?: string;
    $fault?: string;
    $metadata?: {
        requestId?: string;
        extendedRequestId?: string;
        cfId?: string;
        httpStatusCode?: number;
    };
}

function normalizeEndpoint(endpoint: string) {
    if (/^https?:\/\//i.test(endpoint)) return endpoint;
    return `http://${endpoint}`;
}

function requiredEnv(name: string) {
    const value = process.env[name];
    if (!value) throw new Error(`Missing env: ${name}`);
    return value;
}

function parseBool(value: string | undefined, defaultValue: boolean) {
    if (!value) return defaultValue;
    return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
}

function parseChecksumMode(value: string | undefined, fallback: ChecksumMode): ChecksumMode {
    if (!value) return fallback;
    const normalized = value.trim().toUpperCase();
    return normalized === 'WHEN_SUPPORTED' ? 'WHEN_SUPPORTED' : 'WHEN_REQUIRED';
}

function formatAwsError(error: unknown) {
    const e = error as AwsLikeError;
    const details = {
        name: e?.name,
        message: e?.message,
        code: e?.code,
        requestId: e?.requestId ?? e?.$metadata?.requestId,
        extendedRequestId: e?.$metadata?.extendedRequestId,
        cfId: e?.$metadata?.cfId,
        statusCode: e?.$metadata?.httpStatusCode,
        fault: e?.$fault,
    };
    return JSON.stringify(details);
}

function summarizeAccessKeyId(value: string) {
    if (value.length <= 8) return value;
    return `${value.slice(0, 4)}...${value.slice(-4)}(len:${value.length})`;
}

async function main() {
    const endpoint = normalizeEndpoint(requiredEnv('S3_ENDPOINT'));
    const region = process.env.S3_REGION || 'us-east-1';
    const accessKeyId = requiredEnv('S3_ACCESS_KEY_ID');
    const secretAccessKey = requiredEnv('S3_SECRET_ACCESS_KEY');
    const bucketImg = process.env.S3_BUCKET_IMG || 'img';
    const bucketShare = process.env.S3_BUCKET_SHARE || 'share';
    const forcePathStyle = parseBool(process.env.S3_FORCE_PATH_STYLE, true);
    const requestChecksumCalculation = parseChecksumMode(
        process.env.S3_REQUEST_CHECKSUM_CALCULATION,
        'WHEN_REQUIRED'
    );
    const responseChecksumValidation = parseChecksumMode(
        process.env.S3_RESPONSE_CHECKSUM_VALIDATION,
        'WHEN_REQUIRED'
    );

    const client = new S3Client({
        endpoint,
        region,
        forcePathStyle,
        requestChecksumCalculation,
        responseChecksumValidation,
        credentials: {
            accessKeyId,
            secretAccessKey,
        },
    });

    const results: ProbeResult[] = [];
    const probePrefix = `probe/${Date.now()}-${randomUUID()}`;
    const sourceKey = `${probePrefix}/source.txt`;
    const copiedKey = `${probePrefix}/copied.txt`;
    const multipartKey = `${probePrefix}/multipart.txt`;

    const run = async (name: string, fn: () => Promise<void>) => {
        try {
            await fn();
            results.push({ name, supported: true, message: 'ok' });
        } catch (error) {
            results.push({
                name,
                supported: false,
                message: formatAwsError(error),
            });
        }
    };

    await run('HeadBucket(img)', async () => {
        await client.send(new HeadBucketCommand({ Bucket: bucketImg }));
    });

    await run('HeadBucket(share)', async () => {
        await client.send(new HeadBucketCommand({ Bucket: bucketShare }));
    });

    await run('PutObject', async () => {
        await client.send(
            new PutObjectCommand({
                Bucket: bucketShare,
                Key: sourceKey,
                Body: Buffer.from('bsb-probe'),
                ContentType: 'text/plain',
            })
        );
    });

    await run('GetObject', async () => {
        const response = await client.send(
            new GetObjectCommand({
                Bucket: bucketShare,
                Key: sourceKey,
            })
        );
        if (response.Body && 'transformToString' in response.Body) {
            await response.Body.transformToString();
        }
    });

    await run('ListObjectsV2', async () => {
        await client.send(
            new ListObjectsV2Command({
                Bucket: bucketShare,
                Prefix: probePrefix,
                MaxKeys: 10,
            })
        );
    });

    await run('CopyObject', async () => {
        await client.send(
            new CopyObjectCommand({
                Bucket: bucketShare,
                Key: copiedKey,
                CopySource: `${bucketShare}/${sourceKey}`,
            })
        );
    });

    await run('MultipartUpload', async () => {
        const create = await client.send(
            new CreateMultipartUploadCommand({
                Bucket: bucketShare,
                Key: multipartKey,
            })
        );

        if (!create.UploadId) {
            throw new Error('CreateMultipartUpload did not return UploadId');
        }

        const uploadPart = await client.send(
            new UploadPartCommand({
                Bucket: bucketShare,
                Key: multipartKey,
                UploadId: create.UploadId,
                PartNumber: 1,
                Body: Buffer.from('multipart-probe-content'),
            })
        );

        await client.send(
            new CompleteMultipartUploadCommand({
                Bucket: bucketShare,
                Key: multipartKey,
                UploadId: create.UploadId,
                MultipartUpload: {
                    Parts: [
                        {
                            ETag: uploadPart.ETag,
                            PartNumber: 1,
                        },
                    ],
                },
            })
        );
    });

    await run('DeleteObject(source)', async () => {
        await client.send(new DeleteObjectCommand({ Bucket: bucketShare, Key: sourceKey }));
    });

    await run('DeleteObject(copy)', async () => {
        await client.send(new DeleteObjectCommand({ Bucket: bucketShare, Key: copiedKey }));
    });

    await run('DeleteObject(multipart)', async () => {
        await client.send(new DeleteObjectCommand({ Bucket: bucketShare, Key: multipartKey }));
    });

    await run('AbortMultipartUpload(fallback)', async () => {
        const abortKey = `${probePrefix}/abort.txt`;
        const create = await client.send(
            new CreateMultipartUploadCommand({
                Bucket: bucketShare,
                Key: abortKey,
            })
        );
        if (!create.UploadId) throw new Error('Missing UploadId for abort flow');
        await client.send(
            new AbortMultipartUploadCommand({
                Bucket: bucketShare,
                Key: abortKey,
                UploadId: create.UploadId,
            })
        );
    });

    const successCount = results.filter((item) => item.supported).length;

    console.log(
        JSON.stringify(
            {
                endpoint,
                region,
                forcePathStyle,
                requestChecksumCalculation,
                responseChecksumValidation,
                accessKeyIdPreview: summarizeAccessKeyId(accessKeyId),
                timestamp: new Date().toISOString(),
                successCount,
                totalCount: results.length,
                operations: results,
            },
            null,
            2
        )
    );
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
