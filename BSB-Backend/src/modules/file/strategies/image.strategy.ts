import { FileInvalidTypeException } from '../file.exception.js';
import type { UploadStrategy } from '../file.interface.js';

import { Injectable } from '@nestjs/common';
import { v7 as uuidv7 } from 'uuid';

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const PART_SIZE = 5 * 1024 * 1024; // 5MB

@Injectable()
export class ImageStrategy implements UploadStrategy {
    validate(dto: { contentType: string }): void {
        if (!ALLOWED_MIME.includes(dto.contentType)) {
            throw new FileInvalidTypeException({
                message: `头像文件不支持 ${dto.contentType} 类型，支持：${ALLOWED_MIME.join(', ')}`,
            });
        }
    }

    resolveKey(): string {
        return `images/${uuidv7()}`;
    }

    getBucket(): string {
        return 'public';
    }

    getPartCount(fileSize: number): number {
        return Math.ceil(fileSize / PART_SIZE); // 头像文件默认分成1个分片上传
    }
}
