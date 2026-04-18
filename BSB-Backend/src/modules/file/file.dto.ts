import { createZodDto } from 'nestjs-zod';
import { z } from 'zod/v4';

// ── 响应 VO ───────────────────────────────────────────────

const FileUploadVoSchema = z
    .object({
        url: z.string().meta({ title: '访问 URL' }),
        filename: z.string().meta({ title: '服务端文件名（含扩展名）' }),
        key: z.string().meta({ title: '对象存储 Key' }),
        bucket: z.string().meta({ title: '存储桶名称' }),
        size: z.number().int().meta({ title: '文件大小（字节）' }),
        etag: z.string().optional().meta({ title: 'ETag' }),
    })
    .meta({ description: '文件上传结果' });

export class FileUploadVo extends createZodDto(FileUploadVoSchema) {}
