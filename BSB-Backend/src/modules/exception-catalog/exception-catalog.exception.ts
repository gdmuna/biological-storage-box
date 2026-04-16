import { RegisterException, ResourceException } from '@/common/exceptions/index.js';

export const ExceptionCatalogExceptionCode = {
    CODE_NOT_FOUND: 'EXCEPTION_CATALOG_CODE_NOT_FOUND',
} as const;

@RegisterException({
    code: ExceptionCatalogExceptionCode.CODE_NOT_FOUND,
    statusCode: 404,
    message: '该错误码不存在',
    description: '请求的错误代码在目录中不存在，请检查后重试',
    retryable: false,
    logLevel: 'debug',
})
export class ExceptionCodeNotFoundException extends ResourceException {}

export default {
    ExceptionCodeNotFoundException,
};
