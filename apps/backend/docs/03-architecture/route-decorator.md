---
title: 路由装饰器
inherits: docs/03-architecture/STANDARD.md
status: active
version: "0.7.4"
last-updated: 2026-04-09
category: architecture
related:
  - docs/03-architecture/STANDARD.md
  - docs/03-architecture/exception-system.md
  - docs/03-architecture/openapi-enrichment.md
  - docs/03-architecture/request-pipeline.md
  - docs/03-architecture/auth-module.md
---

# 路由装饰器

本文档描述 `@ApiRoute()` 复合装饰器的完整设计，涵盖元数据键体系、认证策略声明、错误码绑定，以及行为消费层分工。

## 1. 设计背景

在引入 `@ApiRoute()` 之前，每个控制器方法需要手工组合多个独立装饰器：

```typescript
@Post('login')
@Public()                            // 认证策略
@Throttle({ strict: {} })            // 限流级别
@ApiOperation({ summary: '...' })    // Swagger 操作说明
@ApiResponse({ status: 200, ... })   // 成功响应
@ApiResponse({ status: 401, ... })   // 失败响应（手工维护，与运行时无关联）
@ApiResponse({ status: 429, ... })   // 失败响应（与 ThrottlerGuard 不关联）
```

这套组合存在三个结构性问题：

| 问题 | 具体表现 |
|------|---------|
| 声明分散 | 认证策略、限流、文档、错误分散在 4–6 个独立装饰器中，无法作为整体阅读 |
| 运行时与文档脱节 | `@ApiResponse({ status: 401 })` 是死字符串，与 Guard 实际抛出的异常没有类型约束关系 |
| 重复维护 | 新增路由时需要人工叠加每个装饰器，漏写某个不会有编译期报错 |

`@ApiRoute()` 将"路由的契约意图"收归一处：一次声明，在 Guard、Swagger 富化器、运行时追踪等消费层各自分发。

## 2. 核心概念：路由契约

**路由契约** = 一个路由对外承诺的完整约定，包括：

1. **认证策略**：谁能访问？需要什么身份？
2. **成功响应**：正常情况下返回什么结构、什么状态码？
3. **失败集合**：该路由可能抛出哪些已知业务错误？
4. **元信息**：操作名、描述、是否废弃（供 Swagger 展示）

装饰器只负责声明契约，不执行任何业务逻辑。各消费层独立读取元数据，按自己的职责处理。

## 3. 认证策略

```typescript
/**
 * - 'public'   无需 Token，完全公开（注册、登录等）
 * - 'optional' 有 Token 则解析挂载，无 Token 也放行（游客可用的展示接口）
 * - 'required' 必须携带有效 Token，否则 401（默认值）
 */
type AUTH_STRATEGY_TYPE = 'public' | 'optional' | 'required';
```

`AuthGuard` 通过 `Reflector.getAllAndOverride(AUTH_STRATEGY_KEY, ...)` 读取策略后执行不同分支。

## 4. 装饰器选项接口

```typescript
interface ApiRouteOptions {
    /** 接口摘要，在 Swagger 操作标题展示（必填） */
    summary: string;

    /** 接口详细描述，支持 Markdown */
    description?: string;

    /**
     * 成功响应的 DTO 类型。
     * openapi-envelope 读取后自动将其包裹进统一成功包络：
     * { success: true, data: <responseType>, timestamp, context }
     */
    responseType?: Type<unknown> | Record<string, unknown>;

    /** 成功响应的 HTTP 状态码（默认 200） */
    successStatus?: number;

    /**
     * 该路由可能抛出的业务错误码列表（ErrorRegistry 中已注册的 code 字符串）。
     *
     * 以下错误码无需声明，装饰器自动追加：
     * - 所有 ClientExceptionCode 和 SystemExceptionCode 定义的错误码（全部路由）
     *
     * auth='required' 路由的认证失败错误（AUTH_TOKEN_MISSING、AUTH_TOKEN_INVALID）
     * 由各路由按需在此处手动声明。
     */
    errors?: string[];

    /** 认证策略（必填） */
    auth: AUTH_STRATEGY_TYPE;

    /** 标记接口为已废弃 */
    deprecated?: boolean;
}
```

## 5. 元数据键体系

| 键常量 | 值 | 消费方 |
|-------|----|--------|
| `AUTH_STRATEGY_KEY` | `'auth:strategy'` | `AuthGuard`（通过 Reflector 读取策略值） |
| `ROUTE_ERRORS_KEY` | `'route:errors'` | `openapi-envelope`（文档生成阶段） |

## 6. 装饰器的展开规则

`@ApiRoute(options)` 在编译期展开为以下装饰器的等价组合（展开顺序不得依赖副作用）：

```
SetMetadata(AUTH_STRATEGY_KEY, auth)
SetMetadata(ROUTE_ERRORS_KEY, allErrors)       ← 含自动追加的基础错误码

ApiOperation({ summary, description, deprecated })

// 按状态码分组，每组一个 @ApiResponse 条目，多个错误以 examples 区分
ApiResponse({ status: 401, ... })
ApiResponse({ status: 429, ... })
ApiResponse({ status: 408, ... })
ApiResponse({ status: 500, ... })

// 有成功响应类型时
ApiResponse({ status: successStatus ?? 200, type: responseType })

// 需要认证时（auth !== 'public'）
ApiBearerAuth('access-token')
```

装饰器自动追加所有 `ClientExceptionCode` 和 `SystemExceptionCode` 值为基础错误码。手工声明的错误码不重复添加。

## 7. 消费层分工

`@ApiRoute()` 只写入元数据，以下各层独立消费，职责不交叉：

| 消费层 | 读取的元数据键 | 职责 |
|--------|-------------|------|
| `AuthGuard` | `AUTH_STRATEGY_KEY` | 决定是否放行请求 |
| `openapi-envelope`（文档生成阶段）| `ROUTE_ERRORS_KEY` + 已有 `ApiResponse` | 生成错误文档示例、包裹成功包络 |
| 启动期校验器（可选扩展）| `ROUTE_ERRORS_KEY` | 验证声明的错误码均已在 `ErrorRegistry` 注册 |
| 运行时追踪（可选扩展） | `ROUTE_ERRORS_KEY` | 在响应中附加路由契约版本，方便调试 |

> `ResponseFormatInterceptor` 和 `AllExceptionsFilter` **不**消费路由元数据，它们处理的是运行时结果，与声明无关。

## 8. 与 `exception-system` 的集成点

`@ApiRoute` 的 `errors` 字段与 [exception-system.md](exception-system.md) 的错误码体系共享同一类型来源：

```
                  错误码注册表（ErrorRegistry）
                         │
          ┌──────────────┼────────────────────┐
          ▼              ▼                    ▼
    @ApiRoute.errors   Filter 运行时       ExceptionCatalogController
    （类型提示）        （匹配已知错误）     （文档 URL 生成）
```

当 `exception-system` 中新增错误码时，`@ApiRoute` 的 `errors` 字段可直接引用新增的错误码字符串。

## 9. 迁移历史

`@ApiRoute()` 装饰器已完成全项目迁移，所有路由统一使用 `auth: AUTH_STRATEGY_TYPE` 指定认证策略。旧有的 `@Public()` / `IS_PUBLIC_KEY` 兼容层已随迁移完成一并移除。

## 10. 目录结构

```
src/
└── common/
    └── decorators/
        ├── cookie.decorator.ts  ← @Cookie() 参数装饰器
        ├── route.decorator.ts   ← @ApiRoute + AUTH_STRATEGY_KEY + ROUTE_ERRORS_KEY
        └── index.ts             ← re-export 两者
```
