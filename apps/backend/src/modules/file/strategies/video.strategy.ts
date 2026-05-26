import { Injectable } from '@nestjs/common';
import { FileInvalidTypeException } from '../file.exception.js';
import type { UploadStrategy } from '../file.interface.js';
import { v7 as uuidv7 } from 'uuid';
import type { FastifyRequest } from 'fastify';
import {
    Multipart,
    MultipartFile,
    MultipartValue,
    SavedMultipartFilesResult,
    FastifyMultipartBaseOptions,
} from '@fastify/multipart';

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

export type MultipartRequestHandlerResolveType = 'stream' | 'buffer' | 'file';

export type MultipartRequestHandlerCreateOptions = {
    resolveType: MultipartRequestHandlerResolveType;
} & FastifyMultipartBaseOptions;

/** resolveType 字面量 → HandlerState 具体成员，用于 getHandler 泛型返回值收紧 */
type HandlerStateFor<T extends MultipartRequestHandlerResolveType> = T extends 'stream'
    ? { type: 'stream'; data: Multipart[] }
    : T extends 'buffer'
      ? { type: 'buffer'; data: MultipartBuffer[] }
      : { type: 'file'; data: SavedMultipartFilesResult };

@Injectable()
export class NewVideoStrategy {
    getHandler<T extends MultipartRequestHandlerResolveType>(
        req: FastifyRequest,
        options: Omit<MultipartRequestHandlerCreateOptions, 'resolveType'> & { resolveType: T }
    ): Promise<MultipartRequestHandler<HandlerStateFor<T>>> {
        return MultipartRequestHandler.init(req, options, this) as any;
    }
}

export type MultipartBuffer =
    | (Omit<MultipartFile, 'toBuffer'> & { buffer: Buffer })
    | MultipartValue;

type HandlerState =
    | { type: 'stream'; data: Multipart[] }
    | { type: 'buffer'; data: MultipartBuffer[] }
    | { type: 'file'; data: SavedMultipartFilesResult };

@Injectable()
export class MultipartRequestHandler<T extends HandlerState = HandlerState> {
    private constructor(
        private readonly state: T,
        private readonly strategy: NewVideoStrategy
    ) {}

    get type(): T['type'] {
        return this.state.type;
    }

    getData(): T['data'] {
        return this.state.data;
    }

    getStrategy() {
        return this.strategy;
    }

    getFiles() {
        if (this.state.type !== 'file') {
            return (this.state.data as Multipart[] | MultipartBuffer[]).filter(
                (item): item is MultipartFile => item.type === 'file'
            );
        }
        return (this.state.data as SavedMultipartFilesResult).files;
    }

    /** 内部工厂：让 TypeScript 从 state 参数推断出具体的 S */
    private static create<T extends HandlerState>(state: T, strategy: NewVideoStrategy) {
        return new MultipartRequestHandler(state, strategy);
    }

    static init(
        req: FastifyRequest,
        options: MultipartRequestHandlerCreateOptions & { resolveType: 'stream' },
        strategy: NewVideoStrategy
    ): Promise<MultipartRequestHandler<{ type: 'stream'; data: Multipart[] }>>;

    static init(
        req: FastifyRequest,
        options: MultipartRequestHandlerCreateOptions & { resolveType: 'buffer' },
        strategy: NewVideoStrategy
    ): Promise<MultipartRequestHandler<{ type: 'buffer'; data: MultipartBuffer[] }>>;

    static init(
        req: FastifyRequest,
        options: MultipartRequestHandlerCreateOptions & { resolveType: 'file' },
        strategy: NewVideoStrategy
    ): Promise<MultipartRequestHandler<{ type: 'file'; data: SavedMultipartFilesResult }>>;

    static init(
        req: FastifyRequest,
        options: MultipartRequestHandlerCreateOptions,
        strategy: NewVideoStrategy
    ): Promise<MultipartRequestHandler<HandlerState>>;

    static async init(
        req: FastifyRequest,
        options: MultipartRequestHandlerCreateOptions,
        strategy: NewVideoStrategy
    ) {
        const { resolveType, ...multipartOptions } = options;

        /**
         * 注意：'stream' resolveType 需要逐个处理 multipart 流中的每个 part
         * 这适用于需要边上传边处理的场景，如大文件上传或实时处理
         * 使用时应注意流的正确关闭和错误处理，以避免资源泄漏
         */
        if (resolveType === 'stream') {
            const parts = req.parts(multipartOptions);
            const data: Multipart[] = [];
            for await (const part of parts) {
                if (part.type === 'file') {
                    // 必须消费文件流，否则 busboy 产生背压死锁
                    // 返回值只含元数据（filename/mimetype），文件内容已丢弃
                    // 若需要保留内容 → 改用 'buffer' 模式
                    // 若需要流式直传 S3 → 改用 processStream()
                    part.file.resume();
                }
                data.push(part);
            }
            return MultipartRequestHandler.create({ type: 'stream' as const, data }, strategy);
        } else if (resolveType === 'buffer') {
            /**
             * 'buffer' resolveType 需要将上传的文件内容读取到内存中
             * 这可能会导致内存占用过高，尤其是对于大文件
             * 因此，在实际使用中应谨慎使用，并考虑文件大小限制和错误处理
             */
            const parts = req.parts(multipartOptions);
            const data: MultipartBuffer[] = [];
            for await (const part of parts) {
                if (part.type === 'file') {
                    const buffer = await part.toBuffer();
                    data.push({ ...part, buffer });
                } else data.push(part);
            }
            return MultipartRequestHandler.create({ type: 'buffer' as const, data }, strategy);
        } else if (resolveType === 'file') {
            /**
             * 'file' resolveType 适用于需要将上传的文件保存到服务器磁盘上的场景，特别是当文件较大时，可以避免内存占用过高。
             * 使用时需要确保服务器有足够的磁盘空间，并且正确处理文件的清理和安全性问题，以防止潜在的安全风险。
             */
            const data = await req.saveRequestFiles({ tmpdir: './data/temp/uploads' });
            return MultipartRequestHandler.create({ type: 'file' as const, data }, strategy);
        }

        // 如果接受了未知的 resolveType，抛出错误
        throw new Error('Unsupported resolveType');
    }

    /**
     * 流式直传模式 —— 适用于 S3 流式直传等需要边读边传的场景。
     *
     * 每个 file part 的 `Readable` stream 在 `processor` 回调内立即消费：
     * - 不缓冲到内存，天然支持大文件
     * - 不产生 busboy 背压死锁
     * - 非文件字段（fields）自动收集到 `fields` 返回值中
     *
     * @example S3 直传（@aws-sdk/lib-storage）
     * ```ts
     * const { results, fields } = await MultipartRequestHandler.processStream(
     *   req,
     *   { limits: { fileSize: 500 * 1024 * 1024 } },
     *   async (part) => {
     *     const upload = new Upload({
     *       client: s3Client,
     *       params: {
     *         Bucket: 'my-bucket',
     *         Key: `uploads/${part.filename}`,
     *         Body: part.file,          // ← Readable stream 直接传入，无内存缓冲
     *         ContentType: part.mimetype,
     *       },
     *     });
     *     return upload.done();         // Upload 内部处理背压，await 完成后流已消费
     *   }
     * );
     * ```
     */
    static async processStream<T>(
        req: FastifyRequest,
        options: FastifyMultipartBaseOptions,
        processor: (part: MultipartFile) => Promise<T>
    ): Promise<{ results: T[]; fields: MultipartValue[] }> {
        const parts = req.parts(options);
        const results: T[] = [];
        const fields: MultipartValue[] = [];
        for await (const part of parts) {
            if (part.type === 'file') {
                results.push(await processor(part));
            } else {
                fields.push(part);
            }
        }
        return { results, fields };
    }
}
