import { FileInvalidTypeException } from '../file.exception.js';
import type { UploadStrategy } from '../file.interface.js';

import { Injectable } from '@nestjs/common';
import { v7 as uuidv7 } from 'uuid';

const ALLOWED_MIME = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
];

const PART_SIZE = 10 * 1024 * 1024; // 10MB

@Injectable()
export class DocumentStrategy implements UploadStrategy {
    validate(dto: { contentType: string }): void {
        if (!ALLOWED_MIME.includes(dto.contentType)) {
            throw new FileInvalidTypeException({
                message: `文档文件不支持 ${dto.contentType} 类型，支持：${ALLOWED_MIME.join(', ')}`,
            });
        }
    }

    resolveKey(): string {
        return `documents/${uuidv7()}`;
    }

    getBucket(): string {
        return 'public';
    }

    getPartCount(fileSize: number): number {
        return Math.ceil(fileSize / PART_SIZE);
    }
}
