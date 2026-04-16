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
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';

import { AllConfig } from '@/constants/index.js';

import {
    IStorageService,
    StorageUploadError,
    StorageUploadInput,
    StorageUploadResult,
    StorageCapabilityReport,
    StorageOperationResult,
} from './storage.interface.js';

@Injectable()
export class S3StorageService implements IStorageService {
    private readonly client: S3Client;
    private readonly endpoint: string;
    private readonly bucketImg: string;
    private readonly bucketShare: string;
    private readonly publicBaseUrl: string;

    constructor(private readonly configService: ConfigService<AllConfig, true>) {
        const storageConfig = this.configService.get('storage', { infer: true });
        this.endpoint = storageConfig.endpoint;
        this.bucketImg = storageConfig.bucketImg;
        this.bucketShare = storageConfig.bucketShare;
        this.publicBaseUrl = storageConfig.publicBaseUrl ?? storageConfig.endpoint;

        this.client = new S3Client({
            endpoint: storageConfig.endpoint,
            region: storageConfig.region,
            forcePathStyle: storageConfig.forcePathStyle,
            requestChecksumCalculation: 'WHEN_REQUIRED',
            responseChecksumValidation: 'WHEN_REQUIRED',
            credentials: {
                accessKeyId: storageConfig.accessKeyId,
                secretAccessKey: storageConfig.secretAccessKey,
            },
        });
    }

    private resolveBucket(bucketKind: StorageUploadInput['bucketKind']) {
        return bucketKind === 'img' ? this.bucketImg : this.bucketShare;
    }

    private buildObjectUrl(bucket: string, key: string) {
        const encodedKey = key
            .split('/')
            .map((segment) => encodeURIComponent(segment))
            .join('/');

        return `${this.publicBaseUrl.replace(/\/$/, '')}/${bucket}/${encodedKey}`;
    }

    async upload(input: StorageUploadInput): Promise<StorageUploadResult> {
        const bucket = this.resolveBucket(input.bucketKind);

        try {
            const putResult = await this.client.send(
                new PutObjectCommand({
                    Bucket: bucket,
                    Key: input.key,
                    Body: input.body,
                    ContentType: input.contentType,
                    ContentLength: input.size,
                })
            );

            return {
                bucket,
                key: input.key,
                size: input.size,
                etag: putResult.ETag,
                url: this.buildObjectUrl(bucket, input.key),
            };
        } catch (error) {
            throw new StorageUploadError({
                cause: error,
                bucket,
                key: input.key,
                message: '文件上传到对象存储失败',
            });
        }
    }

    async probeCapabilities(): Promise<StorageCapabilityReport> {
        const results: StorageOperationResult[] = [];
        const probeBucket = this.bucketShare;
        const probePrefix = `probe/${Date.now()}-${randomUUID()}`;
        const sourceKey = `${probePrefix}/source.txt`;
        const copiedKey = `${probePrefix}/copied.txt`;
        const multipartKey = `${probePrefix}/multipart.txt`;
        const body = Buffer.from('bsb-s3-probe');

        const run = async (name: string, operation: () => Promise<void>) => {
            try {
                await operation();
                results.push({ name, supported: true, message: 'ok' });
            } catch (error) {
                const message = error instanceof Error ? error.message : 'unknown error';
                results.push({ name, supported: false, message });
            }
        };

        await run('HeadBucket(img)', async () => {
            await this.client.send(new HeadBucketCommand({ Bucket: this.bucketImg }));
        });

        await run('HeadBucket(share)', async () => {
            await this.client.send(new HeadBucketCommand({ Bucket: this.bucketShare }));
        });

        await run('PutObject', async () => {
            await this.client.send(
                new PutObjectCommand({ Bucket: probeBucket, Key: sourceKey, Body: body })
            );
        });

        await run('GetObject', async () => {
            const response = await this.client.send(
                new GetObjectCommand({ Bucket: probeBucket, Key: sourceKey })
            );
            if (response.Body && 'transformToString' in response.Body) {
                await response.Body.transformToString();
            }
        });

        await run('ListObjectsV2', async () => {
            await this.client.send(
                new ListObjectsV2Command({ Bucket: probeBucket, Prefix: probePrefix, MaxKeys: 5 })
            );
        });

        await run('CopyObject', async () => {
            await this.client.send(
                new CopyObjectCommand({
                    Bucket: probeBucket,
                    Key: copiedKey,
                    CopySource: `${probeBucket}/${sourceKey}`,
                })
            );
        });

        await run('MultipartUpload', async () => {
            const create = await this.client.send(
                new CreateMultipartUploadCommand({
                    Bucket: probeBucket,
                    Key: multipartKey,
                    ContentType: 'text/plain',
                })
            );

            if (!create.UploadId) {
                throw new Error('CreateMultipartUpload did not return UploadId');
            }

            const uploadPart = await this.client.send(
                new UploadPartCommand({
                    Bucket: probeBucket,
                    Key: multipartKey,
                    UploadId: create.UploadId,
                    PartNumber: 1,
                    Body: Buffer.from('multipart-probe-content'),
                })
            );

            await this.client.send(
                new CompleteMultipartUploadCommand({
                    Bucket: probeBucket,
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
            await this.client.send(
                new DeleteObjectCommand({ Bucket: probeBucket, Key: sourceKey })
            );
        });

        await run('DeleteObject(copy)', async () => {
            await this.client.send(
                new DeleteObjectCommand({ Bucket: probeBucket, Key: copiedKey })
            );
        });

        await run('DeleteObject(multipart)', async () => {
            await this.client.send(
                new DeleteObjectCommand({ Bucket: probeBucket, Key: multipartKey })
            );
        });

        // 兜底清理：若前序 Multipart 失败导致遗留 uploadId，尝试按常见模式中止。
        await run('AbortMultipartUpload(fallback)', async () => {
            const create = await this.client.send(
                new CreateMultipartUploadCommand({
                    Bucket: probeBucket,
                    Key: `${probePrefix}/abort.txt`,
                })
            );
            if (!create.UploadId) {
                throw new Error('CreateMultipartUpload did not return UploadId');
            }
            await this.client.send(
                new AbortMultipartUploadCommand({
                    Bucket: probeBucket,
                    Key: `${probePrefix}/abort.txt`,
                    UploadId: create.UploadId,
                })
            );
        });

        const successCount = results.filter((item) => item.supported).length;
        return {
            endpoint: this.endpoint,
            successCount,
            totalCount: results.length,
            operations: results,
        };
    }
}
