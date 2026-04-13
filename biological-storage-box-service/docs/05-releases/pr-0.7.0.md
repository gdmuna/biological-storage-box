---
title: "发布 PR：v0.7.0"
version: "0.7.0"
base: main
branch: dev
date: 2026-04-06
---

# 发布 v0.7.0

## 概述

本 PR 将 `dev` 分支合并至 `main`，发布 v0.7.0 版本。自上次发布 v0.6.1 以来经历两个增量里程碑（v0.6.2 和 v0.7.0），涵盖异常系统、配置架构、CI/CD 流水线和 API 文档基础设施的全面重构。

## 变更内容

### ⚠️ 破坏性变更

- **`BusinessException` 已删除** — 被基于装饰器的异常体系（`@RegisterException` + `ClientException` / `SystemException`）替代。所有实例化 `BusinessException` 的代码必须迁移至新模式
- **`config/` 目录已移除** — 所有 `registerAs` 工厂函数和 Zod 验证 schema 已整合至 `src/constants/`。来自 `@root/config/*` 的导入不再生效
- **`RequestContextService` 重命名为 `AlsService`** — 已迁移至 `src/infra/als/`。所有消费者必须更新其注入令牌

### ✨ 新功能

#### 异常系统（v0.6.2）

- **分层异常架构**（`feat(exception-system)`）— `AppException → ClientException / SystemException`，每个异常通过 `@RegisterException` 装饰器声明以进行集中元数据管理
- **`ErrorRegistry` 单例** — 错误码、HTTP 状态码和日志级别的中央注册表，由 `AllExceptionsFilter` 和 `@ApiRoute` 消费
- **按模块异常文件** — `src/modules/auth/auth.exception.ts`、`src/infra/database/database.exception.ts`

#### API 文档（v0.6.2 – v0.7.0）

- **`@ApiRoute` 装饰器**（`feat(api)`）— 整合 `@Auth()`、Swagger 注解和错误码声明于单一装饰器，消除控制器中的样板代码
- **OpenAPI 标准 envelope** — `wrapSuccessResponses()` 将所有 2xx 响应包裹为 `{ success, data, timestamp, context }` 格式，反映至生成的 `openapi.json`
- **`@Cookie()` 装饰器** — 验证并提取类型化的 Cookie 参数

#### 文档站（v0.7.0）

- **VitePress 文档站**（`feat(docs)`）— `website/` 子包配置 VitePress；`/reference` 页面由 Scalar 提供交互式 OpenAPI 浏览体验
- **OpenAPI 导出脚本**（`feat(scripts)`）— `scripts/generate-openapi.ts` 从运行中的后端 `/api-doc-json` 拉取并保存至 `website/public/reference/openapi.json`，通过 `pnpm docs:gen-openapi` 调用，支持 `BACKEND_URL` 环境变量覆盖

#### CI/CD 流水线（v0.7.0）

- **可复用 CI 工作流**（`feat(workflow)`）— lint / format / test 阶段提取至 `ci-reusable.yaml`，由六个调用方工作流引用（`ci-dev`、`ci-prod`、`ci-feature`、`ci-release`、`pr-check-dev`、`pr-check-prod`）
- **CD-dev 工作流**（`feat(workflow)`）— 在 CI 成功后触发；构建并推送 `:dev-latest` 后端 + 文档镜像；通过 Watchtower HTTP API 通知服务器
- **文档镜像内嵌 OpenAPI** — CD 流水线通过 `--build-arg` 将最新导出的 `openapi.json` 注入文档镜像构建，保持 API 参考与每次发布同步

#### 配置与基础设施（v0.6.2）

- **`feat(config)`** — `NODE_ENV`、`APP_AUTHOR`、`IS_DEV/IS_TEST/IS_PROD`、`GIT_COMMIT` 标志暴露为 `app.constant.ts` 中的类型化常量
- **`feat(docker)`** — `docker-compose.yml` 服务编排，包含重命名的服务（`database` / `backend`）、健康检查和 `SHADOW_DATABASE_URL` 支持

### ♻️ 重构

| 提交 | 范围 | 描述 |
|------|------|------|
| `fee0449` | `config` | 引入 `registerAs` 工厂函数 + `z.infer<>` 类型化配置；导出 `AllConfig` 供严格模式 `ConfigService` 注入 |
| `6d539e8` | `config` | 将 `config/` 整合进 `src/constants/`；添加 JWT token 懒加载缓存；添加 `database.constant.ts` |
| `7d3496a`+`b128b2c` | `exceptions` | 建立并现代化分层异常系统；删除 `BusinessException` |
| `31f4da7`+`a18d147` | `exceptions` | 重命名 `AllExceptionsFilter`；`ErrorRegistry` 转换为单例 |
| `043b926` | `modules` | 重命名 `error-catalog` → `exception-catalog`；采用 `(data, err)` 结果元组模式 |
| `22d899f` | `infra` | 提取 `AlsModule` 和 `DatabaseModule`；重命名 `RequestContextService` → `AlsService` |
| `d868677` | `api-doc` | 重命名 `error-catalog` 路径为 `error-reference`；重构 `openapi-envelope.ts`；添加 `string.operation.ts` |
| `663fba1` | `src` | 迁移 `CorsMiddleware`、`TimeoutInterceptor`、`ThrottlerModule` 以从 `ConfigService` 读取；添加 `http.constant.ts` |
| `02fca4c` | `auth` | 重命名内部 `ALGORITHMS` 常量 |

### 🐛  缺陷修复

| 提交 | 描述 |
|------|------|
| `06e6bfd` / `64a5f5f` | `workflow_call` 调用方缺少 `secrets: inherit`；`DOTENV_PRIVATE_KEY_TEST` 在可复用工作流内为空 |
| `addd39a` | 当 dotenvx 私钥缺失时 `PORT` 解析为 `NaN`（密文被注入而非明文） |
| `287771f` / `5b90210` / `ab772f0` | Shadow DB URL 与主 DB URL 相同导致 Prisma 迁移失败；现在在所有三条流水线中创建独立的 `nestjs_demo_basic_shadow` / `nestjs_cd_export_shadow` DB |
| `a5aeb65` | `env:encrypt/decrypt` 脚本中 dotenvx CLI 标志组合错误 |

### 🔧 构建 / 工具链

- **CI 中的 dotenvx** — CI 测试 job 通过 dotenvx 解密 `.env.test`；移除对 GitHub Actions 明文 secret 的依赖
- **shellcheck SC2129** — 多个 `>> "$GITHUB_ENV"` 重定向合并为 `{ } >>` 形式
- **工具链**（`2425149`）— 以 `dotenvx` 替代 `cross-env`；Node.js 最低版本 ≥ 22，PostgreSQL 最低版本 ≥ 18；Jest `moduleResolution: nodenext`
- **Docker**（`fdd58bd`）— Dockerfile 中 Node.js 22.22；runner 阶段集成 dotenvx；更新健康检查间隔
- **锁文件追踪**（`1f76718`）— `pnpm-lock.yaml` 现已纳入 git 追踪；ESLint 忽略规则与工作区配置同步
- **脚本清理**（`04d2464`）— 移除 `deploy-server.sh`、`validate-version.cjs`、`generate-snapshot-info.cjs`

## 变更的文件（关键路径）

```
src/
  common/
    decorators/cookie.decorator.ts          ← 新增
    decorators/route.decorator.ts           ← 新增（@ApiRoute）
    exceptions/app.exception.ts             ← 重构
    exceptions/client.exception.ts          ← 新增
    exceptions/system.exception.ts          ← 新增
    exceptions/exception-registry.ts        ← 重命名 + 单例
    utils/openapi-envelope.ts               ← 新增
  constants/
    http.constant.ts                        ← 新增
    app.constant.ts                         ← 扩展
    auth.constant.ts                        ← 扩展 + JWT 懒加载getter
    database.constant.ts                    ← 新增
  infra/
    als/als.module.ts                       ← 新增（提取）
    als/als.service.ts                      ← 从 RequestContextService 重命名
    database/database.module.ts             ← 新增
  modules/
    auth/auth.exception.ts                  ← 新增
    exception-catalog/                      ← 从 error-catalog 重命名
  app.interceptor.ts                        ← ConfigService 注入
  app.middleware.ts                         ← ConfigService 注入
.github/workflows/
  ci-reusable.yaml                          ← 新增（提取）
  ci-dev.yaml / ci-prod.yaml / …           ← 添加 secrets: inherit
  cd-dev.yaml                               ← 新增
website/                                    ← 新增 VitePress 子包
scripts/generate-openapi.ts                 ← 新增
```

## 测试

- 所有单元测试已更新以符合重构的异常系统和重命名的服务
- E2E 测试已更新以使用 `ConfigService` 注入的配置；移除 `loadEnv()` 调用
- `pnpm test` 必须在合并前通过

## 检查清单

- [x] `pnpm lint` — 零错误
- [x] `pnpm build` — 编译通过
- [x] `pnpm test` — CI 中通过（需配置 `DOTENV_PRIVATE_KEY_TEST` secret）
- [x] CHANGELOG 已更新（`CHANGELOG.md`）
- [x] 无硬编码 secret 或配置值
- [x] 为所有 `workflow_call` 调用方添加 `secrets: inherit`
