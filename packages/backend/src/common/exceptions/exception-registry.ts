import { AppException } from './app.exception.js';

/**
 * 异常类的静态元数据——装饰器写入、启动时注册、运行时查询。
 *
 * 字段说明：
 * - code        错误码字符串，格式 {DOMAIN}_{NOUN}_{CONDITION}，全局唯一
 * - statusCode  HTTP 状态码
 * - message     面向用户的简短描述（可国际化）
 * - description 面向开发者的详细说明，出现在 GET /errors/:code 文档页
 * - retryable   客户端是否可以重试（true = 临时性故障）
 * - logLevel    Filter 记录日志时使用的级别，由异常类自身声明，消除 if-else 链
 * - docsPath    覆盖默认文档 URL（可选，默认 {API_DOCS_BASE_URL}/{code}）
 * - detailsSchema details 字段的 OpenAPI JSON Schema（可选）
 *               填写后，enricher 自动补全 Swagger 文档，/errors/:code 端点也将返回此字段
 * - hint         排查 / 解决建议（面向开发者），出现在错误码参考文档中
 * - causes       常见触发原因列表，出现在错误码参考文档中
 */
export interface StaticMeta<TCode extends string = string> {
    code: TCode;
    statusCode: number;
    message: string;
    description: string;
    retryable: boolean;
    logLevel: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
    docsPath?: string;
    detailsSchema?: Record<string, unknown>;
    /** 排查 / 解决建议（面向开发者），出现在错误码参考文档中 */
    hint?: string;
    /** 常见触发原因列表，出现在错误码参考文档中 */
    causes?: string[];
}

const _registry = new Map<string, StaticMeta>();

export const EXCEPTION_META_KEY = Symbol('exception:meta');

/**
 * 双职装饰器：
 *   1. 把 meta 写入全局 ErrorRegistry Map（供 Filter / error-catalog 端点运行时查询）
 *   2. 把 meta 挂在类构造函数上（供 AppException 基类通过 new.target 自动解析，消除重复声明）
 *
 * 必须标注在每个**可实例化的叶节点异常类**上。
 * 中间 abstract 基类不应标注此装饰器。
 *
 * @example
 * \@RegisterException({
 *   code: AuthCode.USER_DUPLICATE,
 *   statusCode: 409,
 *   message: '用户已存在',
 *   description: '该邮箱或用户名已被注册',
 *   retryable: false,
 *   logLevel: 'info',
 * })
 * export class DuplicateUserException extends ResourceException {}
 */
export function RegisterException<TCode extends string>(meta: StaticMeta<TCode>): ClassDecorator {
    return (target: any) => {
        if (_registry.has(meta.code)) {
            throw new Error(
                `重复注册错误码 "${meta.code}"` + `，请检查 ${target.name} 与已注册类是否命名冲突`
            );
        }
        target.code = meta.code;
        _registry.set(meta.code, meta);
        Reflect.defineMetadata(EXCEPTION_META_KEY, meta, target);
    };
}

/**
 * 全局错误码注册表。
 *
 * 数据源：各域 `*.exception.ts` 中的 `@RegisterException` 装饰器在文件被 import 时自动填充。
 * 注册时机：NestJS 构建 DI 容器之前（模块 import 阶段），可安全在 Filter 初始化时查询。
 */
class _errorRegistry {
    /** 按错误码查询完整 meta，未注册返回 undefined */
    get(code: string): StaticMeta | undefined;
    get(exception: AppException): StaticMeta | undefined;
    get(arg: string | AppException): StaticMeta | undefined {
        const code = typeof arg === 'string' ? arg : arg.code;
        return _registry.get(code);
    }

    /** 判断错误码是否已注册 */
    has(code: string) {
        return _registry.has(code);
    }

    /** 返回只读的全量注册表（用于 GET /errors 端点） */
    getAll(): ReadonlyMap<string, StaticMeta> {
        return _registry;
    }
}

export const ErrorRegistry = new _errorRegistry();
