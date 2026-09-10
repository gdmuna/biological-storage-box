import { RegisterException } from './exception-registry.js';
import { SystemException } from './app.exception.js';
import { HttpException } from '@nestjs/common';

/**
 * 系统初始化异常的抽象基类。系统启动过程中发生的异常（如配置加载失败、依赖服务连接失败等）应继承此类。
 */
export abstract class SystemInitializedException extends SystemException {}

export const SystemExceptionCode = {
    SERIALIZATION_ERROR: 'SYS_SERIALIZATION_ERROR',
    HTTP_UNEXPECTED_ERROR: 'SYS_HTTP_UNEXPECTED_ERROR',
    UNEXPECTED_ERROR: 'SYS_UNEXPECTED_ERROR',
} as const;

/**
 * 响应序列化失败。
 * ZodSerializerInterceptor 序列化 Response DTO 时校验不通过，
 * 通常表示 DTO 定义与 Service 返回值不匹配，属于开发期 bug。
 * logLevel: error — 运维关注，不对客户端暴露内部细节。
 */
@RegisterException({
    code: SystemExceptionCode.SERIALIZATION_ERROR,
    statusCode: 500,
    message: '响应序列化失败',
    description: '服务器在序列化响应数据时失败，通常是 Response DTO 定义与 Service 返回值不一致',
    retryable: false,
    logLevel: 'error',
})
export class SysSerializationException extends SystemException {}

/**
 * NestJS 框架内置 HttpException 的统一包装。
 * AllExceptionsFilter 用此类将非 AppException 的 HttpException（如 NotFoundException）
 * 转换为可走统一 handle() 路径的 AppException，避免在 Filter 中维护平行的响应逻辑。
 *
 * statusCode 和 logLevel 由构造时依据被包装异常的实际状态码决定，不受装饰器默认值约束。
 */
@RegisterException({
    code: SystemExceptionCode.HTTP_UNEXPECTED_ERROR,
    statusCode: 500, // 占位；实际值由 RuntimeContext.statusCode 覆盖
    message: '未预期的 HTTP 异常',
    description:
        '包装未预期的 HTTP 异常，提供对 NestJS 框架抛出的内置 HttpException 异常类型的统一包装，状态码与日志级别由运行时决定',
    retryable: false,
    logLevel: 'fatal', // 占位；实际值由 RuntimeContext.logLevel 覆盖
})
export class SysHttpException extends SystemException {
    constructor(exception: HttpException) {
        const status = exception.getStatus();
        const res = exception.getResponse();
        // prettier-ignore
        const message =
            typeof res === 'string'
                ? res
                : (((res as Record<string, unknown>).message as string | undefined) ?? 'UNEXPECTED HTTP Exception');
        super({
            message,
            statusCode: status,
            logLevel: status >= 500 ? 'fatal' : 'error',
            cause: exception,
        });
    }
}

/**
 * 未预期的系统异常（兜底）。
 * AllExceptionsFilter 在无法识别异常类型时包装为此类。
 * logLevel: fatal — 需要开发者立即关注。
 */
@RegisterException({
    code: SystemExceptionCode.UNEXPECTED_ERROR,
    statusCode: 500,
    message: '未预期的服务器内部异常',
    description: '服务器遭遇未预期的异常，该异常不由客户端行为引起，请联系开发团队',
    retryable: false,
    logLevel: 'fatal',
})
export class SysUnknownException extends SystemException {}

export default {
    SysSerializationException,
    SysHttpException,
    SysUnknownException,
};
