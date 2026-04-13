import EXCEPTION from './exception-catalog.exception.js';

import { ErrorRegistry } from '@/common/exceptions/index.js';

import { ok, fail } from '@/common/utils/index.js';

import { AllConfig } from '@/constants/index.js';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * 获取错误类型 URL
 * 支持自定义基础 URL，用于在不同环境使用不同的文档链接
 */
@Injectable()
export class ExceptionCatalogService {
    constructor(private readonly configService: ConfigService<AllConfig, true>) {}

    getAllExceptionsMeta() {
        return [...ErrorRegistry.getAll()];
    }

    getExceptionMetaByCode(exceptionCode: string) {
        const exception = ErrorRegistry.get(exceptionCode);
        if (!exception) {
            return fail(
                new EXCEPTION.ExceptionCodeNotFoundException({
                    message: `错误码 ${exceptionCode} 不存在`,
                })
            );
        }
        return ok(exception);
    }
}
