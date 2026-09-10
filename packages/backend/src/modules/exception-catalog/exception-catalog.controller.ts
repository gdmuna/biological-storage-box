import { ExceptionCatalogService } from './exception-catalog.service.js';
import { ExceptionCatalogExceptionCode } from './exception-catalog.exception.js';

import { ApiRoute } from '@/common/decorators/index.js';

import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@Controller('errors')
@ApiTags('错误目录')
export class ExceptionCatalogController {
    constructor(private readonly exceptionCatalogService: ExceptionCatalogService) {}

    @Get()
    @ApiRoute({
        auth: 'public',
        summary: '获取所有已注册的错误码',
        description: '返回系统中所有通过 `@RegisterException` 注册的错误码及其元数据列表。',
        responseType: {
            type: 'array',
            items: {
                type: 'array',
                items: {},
                description: '[errorCode, StaticMeta] 元组',
            },
        },
    })
    getAllExceptions() {
        return this.exceptionCatalogService.getAllExceptionsMeta();
    }

    @Get(':exceptionCode')
    @ApiRoute({
        auth: 'public',
        summary: '按错误码查询错误详情',
        description: '返回单个错误码的完整 `StaticMeta`，包含状态码、描述、重试策略等字段。',
        responseType: {
            type: 'object',
            properties: {
                code: { type: 'string' },
                statusCode: { type: 'integer' },
                message: { type: 'string' },
                description: { type: 'string' },
                retryable: { type: 'boolean' },
                logLevel: { type: 'string' },
                docsPath: { type: 'string' },
                hint: { type: 'string' },
                causes: { type: 'array', items: { type: 'string' } },
            },
        },
        errors: [ExceptionCatalogExceptionCode.CODE_NOT_FOUND],
    })
    getExceptionDetail(@Param('exceptionCode') exceptionCode: string) {
        const [data, err] = this.exceptionCatalogService.getExceptionMetaByCode(exceptionCode);
        if (err) throw err;
        return data;
    }
}
