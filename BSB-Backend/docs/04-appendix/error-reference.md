---
title: 错误码参考
# 此文件由 scripts/generate-error-reference.ts 自动生成，请勿手动修改
# 重新生成：pnpm docs:gen-reference
---
# 错误码参考

所有错误响应均包含 `code` 字段，可在本页按错误码查阅完整说明。

每个错误码标题均可作为锚点直接访问，例如 [`AUTH_TOKEN_INVALID`](#auth-token-invalid)。

`retryable: true` 表示该错误由临时性故障引起，客户端可在等待后重试。

## 400 — 参数验证 / 请求格式错误

### `CLIENT_PARAMS_VALIDATION_FAILED`

**HTTP 400** · 不可重试

**请求参数验证失败**

请求参数不符合 Schema 约束，details 字段包含各字段的具体错误信息

**排查建议**

参考响应中 `details` 字段的字段级错误列表，逐项修正参数后重试

## 401 — 认证失败

### `AUTH_CREDENTIALS_INVALID`

**HTTP 401** · 不可重试

**用户名或密码错误**

提供的账号或密码不匹配任何已知账户，请检查后重试

**排查建议**

检查用户名/邮箱拼写及大小写是否正确，并确认密码与注册时一致

### `AUTH_TOKEN_INVALID`

**HTTP 401** · 不可重试

**Token 无效或已过期**

提供的 Token 格式不正确、签名验证失败或已过期，请重新登录

**常见触发原因**

- Token 已超过有效期
- Token 签名与服务器密钥不匹配
- Token 格式不符合 JWT 规范

**排查建议**

调用 `POST /auth/refresh-token` 使用刷新令牌换取新的访问令牌，或重新登录

### `AUTH_TOKEN_MISSING`

**HTTP 401** · 不可重试

**缺少访问令牌**

请求头中未提供有效的 Bearer Token，请先登录

**排查建议**

在请求头中添加 `Authorization: Bearer <accessToken>`，令牌可通过 `POST /auth/login` 或 `POST /auth/register` 获取

## 404 — 资源不存在

### `DB_RECORD_NOT_FOUND`

**HTTP 404** · 不可重试

**记录不存在**

数据库查询目标记录不存在或已被删除

### `EXCEPTION_CATALOG_CODE_NOT_FOUND`

**HTTP 404** · 不可重试

**该错误码不存在**

请求的错误代码在目录中不存在，请检查后重试

## 409 — 资源冲突

### `AUTH_USER_DUPLICATE`

**HTTP 409** · 不可重试

**用户已存在**

该邮箱或用户名已被注册，请更换后重试

**常见触发原因**

- 该用户名已被其他账户使用
- 该邮箱已被其他账户注册

**排查建议**

使用不同的用户名和邮箱重新注册，或通过登录接口找回已有账户

### `DB_UNIQUE_VIOLATION`

**HTTP 409** · 不可重试

**数据唯一性约束冲突**

数据库写入/更新失败：唯一性约束（如主键、唯一索引）已被违反

## 429 — 请求频率限制

### `CLIENT_REQUEST_RATE_LIMIT_EXCEEDED`

**HTTP 429** · ✅ 可重试

**请求过于频繁，请稍后重试**

客户端请求频率超过服务端设定的速率限制，请遵循响应头 Retry-After 等待后重试

**常见触发原因**

- 短时间内发送了超过服务端限流阈值的请求

**排查建议**

遵循响应头 `Retry-After` 字段指示的等待时间后重试

## 500 — 服务器内部错误

### `DB_QUERY_FAILED`

**HTTP 500** · ✅ 可重试

**数据库查询失败**

数据库查询执行失败，可能由连接超时、语法错误或事务冲突引起

### `SYS_HTTP_UNEXPECTED_ERROR`

**HTTP 500** · 不可重试

**未预期的 HTTP 异常**

包装未预期的 HTTP 异常，提供对 NestJS 框架抛出的内置 HttpException 异常类型的统一包装，状态码与日志级别由运行时决定

### `SYS_SERIALIZATION_ERROR`

**HTTP 500** · 不可重试

**响应序列化失败**

服务器在序列化响应数据时失败，通常是 Response DTO 定义与 Service 返回值不一致

### `SYS_UNEXPECTED_ERROR`

**HTTP 500** · 不可重试

**未预期的服务器内部异常**

服务器遭遇未预期的异常，该异常不由客户端行为引起，请联系开发团队
