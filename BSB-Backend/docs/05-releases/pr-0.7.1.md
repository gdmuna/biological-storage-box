---
title: "发布 PR：v0.7.1"
version: "0.7.1"
base: main
branch: release/0.7
date: 2026-04-06
---

# 发布 v0.7.1

## 概述

本 PR 将 `release/0.7` 分支合并至 `main`，发布 v0.7.1 补丁版本。本版本包含三类主要工作：

1. **CI/CD 缺陷修复**：修复 v0.7.0 上线后暴露的 PostgreSQL 健康检查、分支匹配规则、脚本验证问题
2. **文档构建修复**：解决 VitePress 保留字段冲突导致的文档镜像构建失败
3. **架构文档同步**：完整同步所有 `docs/03-architecture/` 文档与 v0.7.0 + v0.7.1 实现完全对齐，确保文档的准确性

## 变更内容

### 🐛 缺陷修复

#### CI/CD 流水线

- **PostgreSQL 健康检查失效**（`fix(ci)`）— `ci-reusable.yaml`、`cd-dev.yaml`、`cd-prod.yaml` 中 `pg_isready` 未指定用户和数据库参数，导致容器尚未初始化完成时健康检查即已通过，后续 Job 连接数据库失败
  - `--health-cmd` 从 `pg_isready` 改为 `pg_isready -U ci_test -d nestjs_demo_basic_test`
  - 新增 `--health-start-period 30s`，为 postgres:18 初始化留足缓冲
  - 检查间隔从 10s 收紧至 5s，重试次数从 5 次提升至 10 次
  - 在 test job 中新增显式等待步骤，主机侧确认 `127.0.0.1:5432` 端口可达
  - 全部连接 URL 从 `localhost` 改为 `127.0.0.1`，绕开 IPv6 (`::1`) 优先解析导致的连接失败

- **CI Release 分支匹配模式过窄**（`fix(ci)`）— `ci-release.yaml` 触发器使用 `release-[0-9]*`，无法匹配斜杠分隔的 `release/X.Y` 命名规范，导致 release 分支推送时 CI 未被触发
  - 改为 `release/**`，兼容任意子路径命名

#### 脚本

- **版本前缀提取正则错误**（`fix(scripts)`）— `scripts/validate-release-version.cjs` 中正则使用 `release-X.Y` 格式（连字符），与实际分支名 `release/X.Y`（斜杠）不符，导致版本验证步骤始终抛出异常
  - 正则从 `release-(\d+\.\d+)` 改为 `release\/(\d+\.\d+)`

#### 文档构建

- **VitePress 构建崩溃**（`fix(docs)`）— `docs/05-releases/pr-0.7.0.md` frontmatter 使用 `head: dev`，与 VitePress 保留字段 `head`（类型必须为数组，用于注入 `<head>` 标签）冲突，导致文档镜像构建时抛出 `head.find is not a function`
  - 将字段重命名为 `branch: dev`

### 📚 架构文档同步（v0.7.0 + v0.7.1 实现完全对齐）

本版本包含对所有架构文档的完整审计和同步，确保每个文档的内容、API 示例、Mermaid 图表都准确反映当前代码实现：

#### 顶级文档

- **project-architecture-overview.md**
  - 更新技术栈版本：Node.js ≥22.0.0（从 ≥20）、PostgreSQL ≥18（从 ≥16）
  - 修复 Mermaid 中控制器引用：`ErrorCatalogController` → `ExceptionCatalogController`
  - Head 版本字段从 v0.5.3 升至 v0.7.1
  - 更新 JWT 算法说明和设计决策中的 ES256 优势论述

- **docs/README.md**
  - 更新各文档的描述、核心主题、关键特性
  - 同步所有文档的版本信息至 v0.7.1
  - 补完索引表中的最新文档（`error-reference.md`、`pr-0.7.1.md` 等）

#### 安全与认证

- **auth-module.md**
  - 修复 Mermaid TokenService 节点的 JWT 算法标注（RS256 → ES256）
  - 更新密钥生成说明（基于 ES256）

#### 部署与工程化

- **contributing.md**
  - 分支命名规范更新：`release-<major>.<minor>` → `release/<major>.<minor>`（斜杠替代连字符）
  - 发布流程第 1 步修正：分支格式更新、版本管理脚本说明
  - CI/CD 触发条件表完整重写：
    - 移除已删除的工作流：`ci-cd-dev.yaml`、`release-snapshot.yaml`、`deploy-to-server.yaml`
    - 新增实际工作流：`ci-dev.yaml`、`cd-dev.yaml`、`cd-prod.yaml`
    - 修正分支匹配规则（`release-[0-9]*` → `release/**`）

- **cicd-deployment.md**
  - 工作流拓扑 Mermaid 完整重写：正确映射 10 个实际工作流及其依赖关系
  - 工作流配置表重写：
    - 列出 10 个实际工作流（`ci-reusable`、`ci-feature`、`ci-dev`、`cd-dev`、`ci-release`、`ci-prod`、`auto-tag-release`、`cd-prod`、`pr-check-dev`、`pr-check-prod`）
    - 移除旧工作流说明
    - 新增 Postgres health check 参数详细说明
    - DB URL 改用 `localhost`（与实际 CI 一致）
  - "自动版本标签"部分改为说明 package.json 版本提取流程（而非 branch 前缀提取）

#### 请求处理与异常

- **request-pipeline.md**
  - 第 3 节 ThrottlerGuard：错误码从 `RATE_LIMIT_EXCEEDED` 改为 `CLIENT_REQUEST_RATE_LIMIT_EXCEEDED`
  - 第 4.2 节 AuthGuard 完整重写：
    - 添加 ES256 JWT 验证说明
    - `@Public()` 装饰器说明改为 `@ApiRoute({ auth })` 描述
    - 新增三策略系统（`'public' | 'optional' | 'required'`）的流程 Mermaid
    - 错误码从 `UNAUTHORIZED` 改为 `AUTH_TOKEN_MISSING` / `AUTH_TOKEN_INVALID`
  - 第 5 节 ZodValidationPipe：错误码从 `VALIDATION_FAILED` 改为 `CLIENT_PARAMS_VALIDATION_FAILED`
  - 第 7 节"异常过滤器分层"完整重写：
    - 新增三 Filter 架构说明（AllExceptionFilter、ZodExceptionFilter、ThrottlerExceptionFilter）
    - 异常类型与错误码映射表完全重写（对应新的异常体系）
    - 更新错误码前缀统一为 `CLIENT_*` / `SYS_*` 格式

- **exception-system.md**
  - 第 3.1 节文件路径验证与修正：所有异常文件使用 singular 格式（`auth.exception.ts`、`database.exception.ts` 等）
  - 第 4 节完整重写："异常抛出与 IO 包装"替代 "Result<T,E> 类型契约"
    - 展示实际的异常抛出代码（`throw new DuplicateUserException()`）
    - 说明 `to()` 辅助函数的实际使用（返回 `[err, null] | [null, T]` 元组，而非 Result<T,E>）
  - 第 5.2 节异常注册机制：改为"在 common/exceptions/index.ts 统一 import"（而非在各模块 module.ts）
  - 第 6 节目录结构完整列出：
    - `src/common/exceptions/`：`app.exception.ts`、`client.exception.ts`、`system.exception.ts`、`exception-registry.ts`、`index.ts`
    - `src/infra/database/`：`database.exception.ts`
    - `src/modules/auth/`：`auth.exception.ts`
    - `src/modules/exception-catalog/`：控制器和服务

- **database.md**
  - 第 6 节"Prisma 错误处理"完整重写：
    - 改为说明 DatabaseService 内 try/catch 块捕获 Prisma 错误（而非 AllExceptionsFilter）
    - 错误码从旧约定改为新前缀：`DB_UNIQUE_VIOLATION`、`DB_RECORD_NOT_FOUND`、`DB_QUERY_FAILED` 等
    - 移除对 P2003（外键约束）处理的说明（未实现）

#### 装饰器与文档生成

- **route-decorator.md**
  - 第 3 节认证策略：类型改为 `AUTH_STRATEGY_TYPE`（而非 `AuthStrategy`）
  - 第 4 节 `ApiRouteOptions` 接口完全重写：
    - `responseType?: Type<unknown> | Record<string, unknown>` （允许 Record 类型）
    - `errors?: string[]`（而非 `Array<keyof typeof ERROR_CATALOG>`）
    - `auth: AUTH_STRATEGY_TYPE` （必填，而非可选）
  - 第 5 节元数据键表：移除 `ROUTE_AUTH_KEY` 与 `IS_PUBLIC_KEY` 行，仅保留 `AUTH_STRATEGY_KEY` 和 `ROUTE_ERRORS_KEY`
  - 第 6 节装饰器展开代码：
    - 移除 `SetMetadata(ROUTE_AUTH_KEY)` 行
    - 移除 `SetMetadata(IS_PUBLIC_KEY, ...)` 行
    - 改为 `SetMetadata(AUTH_STRATEGY_KEY, auth)`
    - 自动追加规则改为"所有 ClientExceptionCode 和 SystemExceptionCode"（而非旧的特定列表）
  - 第 7 节消费层表：AuthGuard 改为读标 `AUTH_STRATEGY_KEY`
  - 第 8 节错误体系说明：改为 `ErrorRegistry` 而非 `ERROR_CATALOG / ErrorRegistry`；控制器改为 `ExceptionCatalogController`
  - 第 9 节向后兼容：改为单段落说明迁移已完成（而非两阶段迁移详述）
  - 第 10 节目录列出 `cookie.decorator.ts`（而非 `auth.decorator.ts`）

- **openapi-enrichment.md**
  - 第 1 节"设计动机"的缺陷表及第 5 节"失败响应示例"中，错误码示例改为 `CLIENT_PARAMS_VALIDATION_FAILED` 等实际前缀
  - 第 7 节"安全方案推断"：
    - 移除 `IS_PUBLIC_KEY` 判断说明
    - 改为基于 `auth='public'` 的判断规则
  - 版本升至 v0.7.1

#### 可观测性与扩展

- **observability.md**：版本升至 v0.7.1（内容无变化）
- **docs/AGENTS.md**：版本升至 v0.7.1（内容无变化）

### 🔧 杂项

- **`openapi.json` 移出 git 追踪**（`chore`）— `website/public/reference/openapi.json` 从 git 追踪中移除，添加至 `.gitignore`，避免每次导出 OpenAPI 文件后产生 6000+ 行无意义 diff

## 文件变更统计

```
docs/03-architecture/
  auth-module.md                    ← RS256 → ES256 Mermaid 修复
  project-architecture-overview.md  ← Node.js/PostgreSQL 版本、ExceptionCatalogController、Header 版本
  cicd-deployment.md                ← 工作流拓扑重写、表格重写、health check、localhost
  request-pipeline.md               ← AuthGuard 完整重写、错误码更新、Filter 架构重写
  exception-system.md               ← 异常文件路径、to() 模式、注册机制、目录结构
  database.md                       ← Prisma 错误处理改写、错误码前缀
  route-decorator.md                ← 接口类型修正、元数据键更新、装饰器展开更新
  openapi-enrichment.md             ← 移除 IS_PUBLIC_KEY、auth='public' 判断
  observability.md                  ← 版本升至 v0.7.1
  openapi-enrichment.md             ← 版本升至 v0.7.1

docs/
  AGENTS.md                         ← 版本升至 v0.7.1
  README.md                         ← 文档索引和版本同步

docs/01-guides/
  contributing.md                   ← 分支命名更新、CI/CD 触发条件表重写

.github/
  ci-release.yaml                   ← 分支模式 release-[0-9]* → release/**

scripts/
  validate-release-version.cjs      ← 版本前缀正则 release- → release/

docs/05-releases/
  pr-0.7.0.md                       ← frontmatter head: dev → branch: dev

.gitignore
  +                                 ← openapi.json
```

## 测试

- `pnpm lint` — 零错误
- `pnpm build` — 编译通过
- `pnpm test` — 通过（PostgreSQL 健康检查修复后 CI 可正常建立数据库连接）
- 文档构建 — VitePress 构建通过

## 检查清单

- [x] `pnpm lint` — 零错误
- [x] `pnpm build` — 编译通过
- [x] `pnpm test` — CI 中通过
- [x] CHANGELOG 已更新（`CHANGELOG.md`）
- [x] 审计完成：所有架构文档与 v0.7.0 + v0.7.1 实现完全对齐
- [x] 无功能性变更，无需更新应用代码
- [x] 文档版本统一升至 v0.7.1
