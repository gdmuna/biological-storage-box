import { Injectable } from '@nestjs/common';
import { FileInvalidTypeException } from '../file.exception.js';
import type { UploadStrategy } from '../file.interface.js';
import { v7 as uuidv7 } from 'uuid';

const ALLOWED_MIME = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo'];

const PART_SIZE = 50 * 1024 * 1024; // 50MB

@Injectable()
export class VideoStrategy implements UploadStrategy {
    validate(dto: { contentType: string }): void {
        if (!ALLOWED_MIME.includes(dto.contentType)) {
            throw new FileInvalidTypeException({
                message: `视频文件不支持 ${dto.contentType} 类型，支持：${ALLOWED_MIME.join(', ')}`,
            });
        }
    }

    resolveKey(): string {
        return `videos/${uuidv7()}`;
    }

    getBucket(): string {
        return 'public';
    }

    getPartCount(fileSize: number): number {
        return Math.ceil(fileSize / PART_SIZE);
    }
}
