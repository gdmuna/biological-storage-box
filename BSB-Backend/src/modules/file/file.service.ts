import { Inject, Injectable } from '@nestjs/common';
import { extname } from 'node:path';
import { randomUUID } from 'node:crypto';

import { STORAGE_SERVICE, StorageBucketKind } from '@/infra/storage/index.js';
import { StorageUploadError } from '@/infra/storage/index.js';
import type { IStorageService } from '@/infra/storage/index.js';

import { FileUploadFailedException, InvalidFileSceneException } from './file.exception.js';

export interface UploadFileInput {
    originalname: string;
    size: number;
    buffer: Buffer;
    mimetype: string;
}

@Injectable()
export class FileService {
    constructor(@Inject(STORAGE_SERVICE) private readonly storageService: IStorageService) {}

    private resolveBucketByScene(scene: string | undefined, mimeType: string): StorageBucketKind {
        if (!scene) {
            return mimeType.startsWith('image/') ? 'img' : 'share';
        }

        const normalizedScene = scene.trim().toLowerCase();
        if (normalizedScene === 'image' || normalizedScene === 'img') return 'img';
        if (normalizedScene === 'file' || normalizedScene === 'share') return 'share';

        throw new InvalidFileSceneException({
            details: [
                {
                    field: 'scene',
                    message: 'scene 仅支持 image / file / img / share',
                    code: 'invalid_enum',
                },
            ],
        });
    }

    async upload(file: UploadFileInput, scene?: string) {
        const safeExt = extname(file.originalname || '').toLowerCase();
        const filename = `${randomUUID()}${safeExt}`;
        const key = `${new Date().toISOString().slice(0, 10)}/${filename}`;

        let uploadResult;
        try {
            uploadResult = await this.storageService.upload({
                bucketKind: this.resolveBucketByScene(scene, file.mimetype || ''),
                key,
                body: file.buffer,
                size: file.size,
                contentType: file.mimetype,
            });
        } catch (error) {
            if (error instanceof StorageUploadError) {
                throw new FileUploadFailedException({
                    cause: error,
                    details: {
                        bucket: error.bucket,
                        key: error.key,
                    },
                });
            }
            throw error;
        }

        return {
            url: uploadResult.url,
            filename,
            key: uploadResult.key,
            bucket: uploadResult.bucket,
            size: uploadResult.size,
            etag: uploadResult.etag,
        };
    }
}
