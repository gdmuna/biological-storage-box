---
title: OpenAPI 增强
inherits: docs/03-architecture/STANDARD.md
status: active
version: "0.7.4"
last-updated: 2026-04-09
category: architecture
related:
  - docs/03-architecture/STANDARD.md
  - docs/03-architecture/route-decorator.md
  - docs/03-architecture/exception-system.md
  - docs/03-architecture/request-pipeline.md
---

# OpenAPI 增强

本文档描述 `openapi-envelope` 的完整设计，涵盖富化流水线、成功/失败响应 Schema 自动注入、错误示例构造规范，以及与 `@ApiRoute` 的协作边界。

## 1. 设计背景

引入 `openapi-envelope` 之前，Swagger 文档存在以下不足，当前架构已全部解决：

| 缺陷 | 具体表现 |
|------|---------|
| 成功响应包络缺失 | 运行时 `ResponseFormatInterceptor` 将所有成功响应包裹为 `{success, data, timestamp, context}`，但 Swagger 直接展示裸 DTO，客户端无法从文档学习真实结构 |
| 失败响应无示例 | 错误响应只有状态码，没有 `code`/`message`/`type` 字段，与 `AllExceptionsFilter` 的实际输出完全脱节 |
| 错误码孤立 | `ErrorRegistry` 含完整元数据（描述、statusCode），但这些信息未流向 Swagger 文档 |
| 安全声明人工维护 | `@ApiBearerAuth` 需开发者手工判断是否添加，漏写不会报错 |
| 全局 Schema 不一致 | 没有统一的 `ApiSuccessResponse<T>` / `ApiErrorResponse` 组件，各接口的响应描述格式不统一 |

## 2. 富化流水线

`main.ts` 中文档生成的完整四步链路：

```
① SwaggerModule.createDocument(app, docConfig)
      ↓ 生成基础 OpenAPI 文档（含 Zod DTO 的 JSON Schema，但有 zod 产物噪声）

② cleanupOpenApiDoc(document)                    ← 来自 nestjs-zod
      ↓ 清理 zod 特有的格式冗余，规范化 Schema 引用

③ wrapSuccessResponses(document)                 ← 富化器①：包裹成功响应
      ↓ 注入成功包络、注册全局失败 Schema

④ enrichErrorResponses(document)                 ← 富化器②：补充错误响应 Schema
      ↓ 为所有 4xx/5xx 响应注入标准错误体 Schema

⑤ enrichTagDescriptions(document)               ← 富化器③：补充 Tag 描述
      ↓ 为 OpenAPI Tags 注入模块级说明

⑥ SwaggerModule.setup('api-doc', app, enrichedDoc)
      ↓ 挂载 Swagger UI / Scalar
```

富化函数均是纯函数：`(OpenAPIObject) => OpenAPIObject`，无副作用，便于单元测试。

## 3. 全局 Schema 注册

富化器首先向 `components.schemas` 注入两个全局组件，供所有路由的响应引用：

### 3.1 `ApiSuccessResponse`

运行时 `ResponseFormatInterceptor` 输出的统一成功包络结构：

```yaml
ApiSuccessResponse:
  type: object
  required: [success, data, timestamp, context]
  properties:
    success:
      type: boolean
      example: true
    data:
      description: 业务数据（类型因接口而异，由 allOf 在各接口覆盖）
    timestamp:
      type: string
      format: date-time
      example: "2026-03-31T12:00:00.000Z"
    context:
      $ref: '#/components/schemas/RequestContext'
      nullable: true
```

各接口的成功响应 Schema 通过 `allOf` 扩展 `ApiSuccessResponse`，仅覆盖 `data` 字段的 `$ref`：

```yaml
# POST /auth/login 的 200 响应 Schema（富化后）
allOf:
  - $ref: '#/components/schemas/ApiSuccessResponse'
  - properties:
      data:
        $ref: '#/components/schemas/AuthResponseDto'
```

### 3.2 `ApiErrorResponse`

运行时 `AllExceptionsFilter` 输出的统一失败包络结构：

```yaml
ApiErrorResponse:
  type: object
  required: [success, code, message, type, timestamp, context]
  properties:
    success:
      type: boolean
      example: false
    code:
      type: string
      description: 错误码，对应 ErrorRegistry 中的 code 字段
      example: UNAUTHORIZED
    message:
      type: string
      description: 面向用户的简短描述
    type:
      type: string
      format: uri
      description: 错误文档完整 URL
      example: "https://api.example.com/errors/UNAUTHORIZED"
    timestamp:
      type: string
      format: date-time
    context:
      $ref: '#/components/schemas/RequestContext'
      nullable: true
    details:
      nullable: true
      description: 错误详情，根据错误类型结构不同（如 VALIDATION_FAILED 时为字段错误列表）
```

### 3.3 `RequestContext`

```yaml
RequestContext:
  type: object
  nullable: true
  properties:
    requestId:
      type: string
      description: ULID 格式的请求追踪 ID
      example: "01ARZ3NDEKTSV4RRFFQ69G5FAV"
    version:
      type: string
      example: "0.6.1"
    time:
      type: number
      description: 请求开始时间戳（Unix ms）
    metadata:
      type: object
      nullable: true
```

## 4. 成功响应包络处理

富化器遍历文档中所有操作（`paths.*.*`），对每个 **2xx 响应** 执行以下转换：

```
Before（nestjs-zod 输出）:
  responses:
    '200':
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/AuthResponseDto'

After（富化后）:
  responses:
    '200':
      content:
        application/json:
          schema:
            allOf:
              - $ref: '#/components/schemas/ApiSuccessResponse'
              - properties:
                  data:
                    $ref: '#/components/schemas/AuthResponseDto'
```

**处理规则**：
- 只处理原有 `$ref` 形式的 Schema，不处理已经是 `allOf` 结构的
- 若 2xx 响应无 Schema（即纯 204 No Content），保持不变
- 内联 Schema（`type: object, properties: ...`）先提升为命名组件，再按上述规则处理

## 5. 失败响应示例构造

`@ApiRoute` 已通过 `@ApiResponse` 写入了按状态码分组的失败响应骨架。
富化器的任务是**补全示例内容**，使每个错误码都有一个完整、真实的响应示例。

### 5.1 示例构造规范

每个错误码的示例値从 ErrorRegistry 中实时读取，格式固定：

```json
{
  "success": false,
  "code": "UNAUTHORIZED",
  "message": "未授权",
  "type": "https://api.example.com/errors/UNAUTHORIZED",
  "timestamp": "2026-03-31T12:00:00.000Z",
  "context": null,
  "details": null
}
```

### 5.2 多错误码同状态码的处理

同一状态码下多个错误码，用 `content.examples` 区分：

```yaml
responses:
  '400':
    description: 请求参数验证失败 / 业务逻辑错误
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/ApiErrorResponse'
        examples:
          VALIDATION_FAILED:
            summary: 请求参数验证失败
            value:
              success: false
              code: VALIDATION_FAILED
              message: 请求参数验证失败
              type: "https://api.example.com/errors/VALIDATION_FAILED"
              timestamp: "2026-03-31T12:00:00.000Z"
              context: null
              details:
                - field: email
                  message: Invalid email
                  code: invalid_string
          BUSINESS_LOGIC_ERROR:
            summary: 业务逻辑错误
            value: { ... }
```

### 5.3 `details` 字段的特殊处理

`VALIDATION_FAILED` 类错误的 `details` 是字段错误列表，富化器为其注入标准示例结构，而不是 `null`。其他错误码的 `details` 默认示例为 `null`。

## 6. 错误文档 URL 注入

当前 `API_DOCS_BASE_URL` 已在 `observability.constant.ts` 中定义，`ErrorCatalogService.getErrorTypeUrl()` 已能生成完整 URL。富化器复用同一规则（不依赖 `ErrorCatalogService` 实例，只依赖常量），确保 Swagger 文档展示的 `type` URL 格式与运行时响应一致：

```
https://{API_DOCS_BASE_URL}/errors/{ERROR_CODE}
```

## 7. 安全方案推断

`@ApiRoute(auth !== 'public')` 已在装饰器展开时写入 `@ApiBearerAuth('access-token')`，Nest Swagger 会将其转换为 OpenAPI 的 `security` 字段。富化器不需要重新推断，只需：

1. 验证一致性：如果操作同时拥有 `security` 字段但 `auth='public'`，记录警告（设计上不应出现，属于装饰器配置错误）
2. 对 `auth='optional'` 的路由，在其操作描述中追加说明："Token 为可选，提供后会挂载用户信息"

## 8. 与 `@ApiRoute` 的协作边界

富化器通过**纯文档结构**获取所需信息，不访问控制器实例或 Reflector：

| 信息 | 来源 |
|------|------|
| 路由的成功响应类型 | `response['200'].content.*.schema`（由 `@ApiResponse({ type })` 写入）|
| 路由的错误码列表 | `response['4xx'/'5xx'].content.*.examples` 键名（由 `@ApiRoute` 按 `ROUTE_ERRORS_KEY` 生成）|
| 是否需要认证 | `operation.security`（由 `@ApiBearerAuth` 写入）|
| 操作摘要与描述 | `operation.summary / description`（由 `@ApiOperation` 写入）|

这意味着即使不使用 `@ApiRoute`，只要手工写了正确的 `@ApiResponse` + `@ApiOperation` + `@ApiBearerAuth`，富化器同样能正确处理。

## 9. 接入点：main.ts 配置

```typescript
const documentFactory = SwaggerModule.createDocument(app, docConfig);
const processedDoc = enrichTagDescriptions(
    enrichErrorResponses(wrapSuccessResponses(cleanupOpenApiDoc(documentFactory)))
);
SwaggerModule.setup('api-doc', app, processedDoc);
```

富化器函数均来自 `src/common/utils/openapi-envelope.ts`：

```
src/common/utils/
└── openapi-envelope.ts   ← wrapSuccessResponses / enrichErrorResponses / enrichTagDescriptions 均定义于此
```

## 10. 不在范围内

以下需求当前不在本模块的职责范围内：

| 排除项 | 原因 |
|--------|------|
| 自动生成 Swagger Tag 分组 | Tag 归属属于模块职责边界，需人工声明，不适合自动推断 |
| 响应分页包络 | 分页结构因业务而异，需独立设计 |
| WebSocket / SSE 文档 | 当前项目无此需求 |
| 运行时 Schema 验证 | 已由 `ZodValidationPipe` + `ZodSerializerInterceptor` 覆盖 |
