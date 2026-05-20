---
title: 数据库层
inherits: docs/03-architecture/STANDARD.md
status: active
version: "0.7.1"
last-updated: 2026-04-06
category: architecture
related:
  - docs/03-architecture/STANDARD.md
  - docs/03-architecture/project-architecture-overview.md
  - docs/03-architecture/observability.md
---

# 数据库层

`DatabaseService`（`src/infra/database/`）基于 Prisma 7 + PG Adapter，封装 PostgreSQL 连接管理、查询监控与参数脱敏。

## 1. 架构关系

```
DatabaseService (extends PrismaClient)
  ├─ @prisma/adapter-pg  ←→  pg.Pool（连接池）  ←→  PostgreSQL
  └─ $on('query')         →  handleQueryEvent()  →  PinoLogger（含脱敏）
```

Prisma 通过原生 PG Adapter 替代 Prisma 自带的连接管理器，直接使用 `pg.Pool` 控制连接生命周期。

## 2. 连接池配置

| 参数 | 值 | 说明 |
|------|-----|------|
| `max` | 12 | 最大并发连接数 |
| `min` | 2 | 最小保持连接数 |
| `idleTimeoutMillis` | 30000ms | 空闲连接 30s 后断开 |
| `connectionTimeoutMillis` | 2000ms | 连接建立超时 2s |

> 连接池参数当前在 `DatabaseService` 初始化时硬编码，修改时同步更新此文档。

## 3. 数据模型

### User

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | `String` | `@id @default(ulid())` | ULID 主键，时间有序 |
| `username` | `String` | `@unique` | 用户名唯一 |
| `email` | `String` | `@unique` | 邮箱唯一 |
| `passwordHash` | `String` | — | bcryptjs 10 rounds |
| `createdAt` | `DateTime` | `@default(now())` | 创建时间 |
| `updatedAt` | `DateTime` | `@updatedAt` | 自动维护 |

索引：`@@index([createdAt])`

**ULID 选择理由**：26 位字母数字编码，前 10 位为时间戳，时间有序（有利于 B-Tree 索引性能），分布式友好，不依赖数据库序列。UUID v4 完全随机，索引碎片化严重。

## 4. 慢查询监控

`DatabaseService` 订阅 Prisma 的 `query` 事件，自动记录耗时并分级告警：

```mermaid
flowchart TD
    Q["Prisma $on('query') 事件"] --> D{查询耗时?}
    D -- "≥ SLOW_QUERY_ERROR_MS\n（默认 500ms）" --> Lerror["logger.error\n'Critical slow query detected'"]
    D -- "WARN_MS ≤ t < ERROR_MS\n（默认 100–500ms）" --> Lwarn["logger.warn\n'Slow query detected'"]
    D -- "< SLOW_QUERY_WARN_MS\n（默认 100ms）" --> Ldebug["logger.debug\n'Query executed'"]
```

阈值由 `src/constants/observability.constant.ts` 中的 `SLOW_QUERY_THRESHOLDS` 定义，可通过以下环境变量覆盖：

| 环境变量 | 默认值 | 说明 |
|---------|--------|------|
| `SLOW_QUERY_WARN_MS` | `100` | warn 级别阈值（ms）|
| `SLOW_QUERY_ERROR_MS` | `500` | error 级别阈值（ms）|

## 5. 参数脱敏规则

日志记录 SQL 参数时，按以下规则脱敏，防止敏感数据写入日志系统：

| 条件 | 处理方式 |
|------|---------|
| 参数值（字符串）含 `password` / `token` / `secret` | 替换为 `[REDACTED]` |
| 参数值长度 > 100 字符 | 截断至 100 字符并追加 `...` |
| 其他 | 原样记录 |

## 6. Prisma 错误包装

`DatabaseService` 内的 try/catch 块捕获常见 Prisma 错误，就地转换为语义化异常（不经过 Filter）：

| Prisma 错误码 | 包装异常 | 错误码 |
|------------|---------|-----|
| `P2002`（唯一约束冲突）| `UniqueViolationException` | `DB_UNIQUE_VIOLATION` |
| `P2025`（记录不存在）| `RecordNotFoundException` | `DB_RECORD_NOT_FOUND` |
| 其他查询失败 | `QueryFailedException` | `DB_QUERY_FAILED` |

> 异常包装涉及的定义见 `src/infra/database/database.exception.ts`。当前 DatabaseService 内尚未全量添加 Prisma 错误 try/catch，如有 Prisma 错误穿透，将由 AllExceptionFilter 包装为 `SYS_UNEXPECTED_ERROR`。

## 7. 服务生命周期

| 生命周期钩子 | 操作 |
|------------|------|
| `OnModuleInit` | `$connect()` + 注册 `query` / `error` / `warn` 事件监听器 |
| `OnModuleDestroy` | `$disconnect()` + 记录断开日志 |

## 8. Prisma Client 生成配置

```prisma
generator client {
  provider     = "prisma-client"
  output       = "./generated"      // 输出到 prisma/generated/
  moduleFormat = "cjs"              // CommonJS 格式
}
```

生成产物位于 `prisma/generated/`，由 `pnpm db:gen-client` 触发，**不得手动修改**。
