import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

@Injectable()
export class FileService {
    // TODO: connect real storage (e.g., S3, MinIO)
    async upload(file: { originalname: string; size: number; buffer: Buffer }) {
        const filename = `${randomUUID()}-${file.originalname}`;
        const url = `/uploads/${filename}`;
        return { url, filename, size: file.size };
    }
}
