import { RegisterException } from './exception-registry.js';
import { ClientException } from './app.exception.js';

/**
 * ValidationException 的 details 字段结构：字段级别的验证错误列表。
 */
export interface FieldError {
    /** 发生错误的字段路径（支持嵌套，如 "address.city"） */
    field: string;
    /** 面向用户的错误描述 */
    message: string;
    /** 错误类型码（如 "invalid_string"、"too_small"） */
    code: string;
}

/**
 * 输入验证失败。400 Bad Request。
 * details 为字段错误列表，由 Zod / 自定义校验逻辑填充。
 */
export abstract class ValidationException extends ClientException<FieldError[]> {}

/**
 * 认证/授权失败。401 / 403。
 * Token 缺失、无效、过期，或身份核验不通过时使用。
 */
export abstract class AuthException extends ClientException {}

/**
 * 资源状态冲突或不存在。404 / 409。
 * 唯一性约束冲突、资源已存在、目标资源不存在时使用。
 */
export abstract class ResourceException extends ClientException {}

// ─── 框架异常的叶节点包装类 ────────────────────────────────────────────────────
// 这些类由对应的专用 Filter 实例化，不应在业务代码中 throw。

export const ClientExceptionCode = {
    PARAMS_VALIDATION_FAILED: 'CLIENT_PARAMS_VALIDATION_FAILED',
    REQUEST_RATE_LIMIT_EXCEEDED: 'CLIENT_REQUEST_RATE_LIMIT_EXCEEDED',
} as const;

/**
 * Zod 请求参数验证失败（由 ZodValidationPipe 抛出，ZodExceptionFilter 包装）。
 * details 为字段级别的验证错误列表。
 */
@RegisterException({
    code: ClientExceptionCode.PARAMS_VALIDATION_FAILED,
    statusCode: 400,
    message: '请求参数验证失败',
    description: '请求参数不符合 Schema 约束，details 字段包含各字段的具体错误信息',
    retryable: false,
    logLevel: 'info',
    hint: '参考响应中 `details` 字段的字段级错误列表，逐项修正参数后重试',
    detailsSchema: {
        type: 'array',
        items: {
            type: 'object',
            required: ['field', 'message', 'code'],
            properties: {
                field: { type: 'string', description: '发生错误的字段路径' },
                message: { type: 'string', description: '面向用户的错误描述' },
                code: { type: 'string', description: 'Zod 错误类型码' },
            },
        },
    },
})
export class ValidationFailedException extends ValidationException {}

/**
 * 请求频率超过限流阈值（由 ThrottlerGuard 抛出，ThrottlerExceptionFilter 包装）。
 */
@RegisterException({
    code: ClientExceptionCode.REQUEST_RATE_LIMIT_EXCEEDED,
    statusCode: 429,
    message: '请求过于频繁，请稍后重试',
    description: '客户端请求频率超过服务端设定的速率限制，请遵循响应头 Retry-After 等待后重试',
    retryable: true,
    logLevel: 'warn',
    causes: ['短时间内发送了超过服务端限流阈值的请求'],
    hint: '遵循响应头 `Retry-After` 字段指示的等待时间后重试',
})
export class RateLimitException extends ClientException {}

export default {
    ValidationFailedException,
    RateLimitException,
};
