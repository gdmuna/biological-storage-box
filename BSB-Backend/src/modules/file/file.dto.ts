import { createZodDto } from 'nestjs-zod';
import { z } from 'zod/v4';
import { FileDomain } from '@root/prisma/generated/enums.js';

// ─── 上传预签名（客户端直传） ───────────────────────────────────────────────────

export const PresignUploadDtoSchema = z
    .object({
        domain: z.enum(FileDomain).meta({ title: '文件领域', example: 'AVATAR' }),
        contentType: z
            .string()
            .meta({ title: '文件类型，必须是合法的MIME类型', example: 'image/png' }),
        filename: z.string().meta({ title: '原始文件名', example: 'profile.png' }),
        fileSize: z
            .number({ message: '文件大小必须是数字' })
            .int({ message: '文件大小必须是整数' })
            .positive({ message: '文件大小必须是正整数' })
            .max(10 * 1024 * 1024, { message: '文件大小不能超过10MB' })
            .meta({
                title: '文件大小（字节），必须是正整数且不超过10MB',
                example: 204800,
            }),
        // sha256: z
        //     .string()
        //     .regex(/^[0-9a-f]{64}$/, 'sha256 必须是 64 位小写十六进制字符串')
        //     .optional()
        //     .meta({
        //         title: '文件内容的 SHA-256',
        //         example: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        //     }),
    })
    .meta({ description: '获取文件上传预签名 URL 的请求 Dto' });

export class PresignUploadDto extends createZodDto(PresignUploadDtoSchema) {}

// ─── 确认上传完成 ────────────────────────────────────────────────────────────

export const ConfirmUploadDtoSchema = z
    .object({
        fileId: z.string().min(1).meta({ title: '文件记录 ID', example: 'cm8k...' }),
    })
    .meta({ description: '通知服务端客户端直传已完成，激活文件记录' });

export class ConfirmUploadDto extends createZodDto(ConfirmUploadDtoSchema) {}

// ─── 下载预签名（私有文件） ────────────────────────────────────────────────────

export const PresignDownloadDtoSchema = z
    .object({
        fileId: z.string().min(1).meta({ title: '文件记录 ID', example: 'cm8k...' }),
        expiresIn: z
            .number()
            .int()
            .positive()
            .default(3600)
            .meta({ title: '预签名 URL 有效期（秒）', example: 3600 }),
    })
    .meta({ description: '获取私有文件下载预签名 URL 的请求 Dto' });

export class PresignDownloadDto extends createZodDto(PresignDownloadDtoSchema) {}

// ─── 分片上传 ──────────────────────────────────────────────────────────────────

export const MultipartInitDtoSchema = z
    .object({
        domain: z.enum(FileDomain).meta({ title: '文件领域', example: 'VIDEO' }),
        contentType: z
            .string()
            .meta({ title: '文件类型，必须是合法的MIME类型', example: 'video/mp4' }),
        filename: z.string().meta({ title: '原始文件名', example: 'movie.mp4' }),
        fileSize: z
            .number()
            .int()
            .positive()
            .max(5 * 1024 * 1024 * 1024)
            .meta({
                title: '文件大小（字节），必须是正整数且不超过5GB',
                example: 104857600,
            }),
    })
    .meta({ description: '初始化分片上传的请求 Dto' });

export class MultipartInitDto extends createZodDto(MultipartInitDtoSchema) {}

export const ResumablePartUrlsDtoSchema = z
    .object({
        fileId: z.string().min(1).meta({ title: '文件记录 ID', example: 'cm8k...' }),
        totalParts: z.number().int().positive().meta({ title: '总分片数量', example: 5 }),
        completedPartNumbers: z
            .array(z.number().int().positive())
            .default([])
            .meta({ title: '已完成的分片编号列表', example: [1, 2] }),
        expiresIn: z
            .number()
            .int()
            .positive()
            .default(3600)
            .meta({ title: '每个分片 URL 有效期（秒）', example: 3600 }),
    })
    .meta({ description: '获取断点续传分片预签名 URL 的请求 Dto' });

export class ResumablePartUrlsDto extends createZodDto(ResumablePartUrlsDtoSchema) {}

export const CompleteMultipartDtoSchema = z
    .object({
        fileId: z.string().min(1).meta({ title: '文件记录 ID', example: 'cm8k...' }),
        parts: z
            .array(
                z.object({
                    PartNumber: z.number().int().positive().meta({ title: '分片编号', example: 1 }),
                    ETag: z.string().min(1).meta({ title: '分片 ETag', example: '"etag1"' }),
                })
            )
            .min(1)
            .meta({ title: '已上传分片列表' }),
    })
    .meta({ description: '完成分片上传（合并分片）的请求 Dto' });

export class CompleteMultipartDto extends createZodDto(CompleteMultipartDtoSchema) {}

export const AbortMultipartDtoSchema = z
    .object({
        fileId: z.string().min(1).meta({ title: '文件记录 ID', example: 'cm8k...' }),
    })
    .meta({ description: '取消分片上传的请求 Dto' });

export class AbortMultipartDto extends createZodDto(AbortMultipartDtoSchema) {}

// ─── 对象操作 ──────────────────────────────────────────────────────────────────

export const DeleteFilesDtoSchema = z
    .object({
        fileIds: z
            .array(z.string().min(1))
            .min(1)
            .max(1000)
            .meta({ title: '文件记录 ID 列表，最多 1000 个', example: ['cm8k...', 'cm9x...'] }),
    })
    .meta({ description: '删除文件（单个或批量）的请求 Dto' });

export class DeleteFilesDto extends createZodDto(DeleteFilesDtoSchema) {}

export const CopyFileDtoSchema = z
    .object({
        fileId: z.string().min(1).meta({ title: '源文件记录 ID', example: 'cm8k...' }),
        destDomain: z.enum(FileDomain).meta({ title: '目标文件领域', example: 'AVATAR' }),
        destFilename: z.string().optional().meta({ title: '目标文件名', example: 'final.jpg' }),
    })
    .meta({ description: '服务端复制文件的请求 Dto' });

export class CopyFileDto extends createZodDto(CopyFileDtoSchema) {}

export const ServerUploadDtoSchema = z
    .object({
        domain: z.enum(FileDomain).meta({ title: '文件领域', example: 'AVATAR' }),
        filename: z.string().meta({ title: '原始文件名', example: 'photo.jpg' }),
        file: z
            .file()
            .optional()
            .meta({ title: '上传的文件', description: '通过 multipart/form-data 上传，大小 ≤5MB' }),
    })
    .meta({ description: '服务端直接上传文件（小文件 ≤5MB）的请求 Dto' });

export class ServerUploadDto extends createZodDto(ServerUploadDtoSchema) {}
