# 更新日志

本文件记录了项目的所有重要变更。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
版本遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [0.7.4] - 2026-04-09

### ✨ 新功能 / 改进

#### 项目重命名

- **`chore`**：项目正式更名为 **NestJS Scaffold**（原名 NestJS Demo Basic）
  - `package.json` `name` 由 `nestjs-demo-basic` 改为 `nestjs-scaffold`
  - `docker-compose.yml` compose project name 及 `APP_NAME` 默认值同步更新
  - `src/main.ts` Swagger 标题、figlet 启动 Banner 同步更新
  - 全局文档中所有展示名称同步替换

#### 文档站全面重构

- **`docs`**：文档目录编号重整，所有原有目录上移一级，腾出前置位给入门文档：
  - `02-architecture/` → `03-architecture/`
  - `03-reference/` → `04-reference/`
  - `04-planning/` → `05-releases/`（目录职责同步调整为"发布文档"）
  - `05-audits/` → `06-audits/`
- **`docs`**：新增 `docs/00-getting-started/`（introduction、philosophy、quick-start）
- **`docs`**：新增 `docs/02-harness/`（overview、feedback、feedforward、STANDARD）— Harness Engineering 专项文档区
- **`docs`**：新增 `docs/index.md`（VitePress 首页）、`docs/changelog.md`、`docs/public/`（站点静态资源）
- **`docs`**：新增 `docs/01-guides/`（development-workflow、docker-deployment、environment-setup、testing，原有 contributing.md 同步更新）
- **`docs`**：删除 `docs/03-reference/api-reference.md`（内容整合至 `04-reference/`），删除 `04-planning/STANDARD.md` 和 `roadmap.md`
- **`docs`**：全局将中文"驾驭工程"替换为英文"Harness Engineering"
- **`docs`**：`docs/03-architecture/` 三份文档（exception-system、route-decorator、openapi-enrichment）去除"规划期"视角，全面对齐实现现状
- **`docs`**：`README.md` 重写，新增功能特性、Harness Engineering 介绍、目录结构速览

#### 容器安全

- **`feat(dockerfile)`**：后端容器改为非 root 用户运行
  - 新增 `RUN chown -R node:node /app` 和 `USER node`，使用 `node:22-slim` 内置的 node 用户（uid=1000）
  - 遵循最小权限原则，符合容器安全最佳实践

#### VitePress 站点升级

- **`chore(website)`**：新增 `@mdit/plugin-tasklist` 实现任务列表渲染
- **`chore(website)`**：侧边栏新增 Harness Engineering、Getting Started 等新节；更新导航项文案
- **`chore(website)`**：Dockerfile.dev/prod、nginx.dev/prod.conf 对齐最新配置

#### 文档站路由与导航重构（后续增补）

- **`docs(vitepress)`**：新增 `rewrites` 配置，将编号目录路径映射为语义化 URL，文件路径不变：
  - `00-getting-started/:page` / `01-guides/:page` → `/guide/:page`
  - `02-harness/:page` / `03-architecture/:page` / `04-reference/:page` → `/reference/:page`
  - `05-releases/:page` → `/reference/:page`
- **`docs(vitepress)`**：侧边栏拆分为 `/guide/` 与 `/reference/` 两个独立分区；nav 条目重命名（"指南"→"上手"，"参考"→"深入"），新增 `activeMatch` 属性，避免落地页 404 的同时保持整段路径高亮
- **`docs(vitepress)`**：`srcExclude` 新增 `**/STANDARD.md`、`**/AGENTS.md`，修复 rewrites 后多个子目录同名文件映射至相同路由导致 MiniSearch 重复 ID 报错；`ignoreDeadLinks` 由 `true` 改为精确正则，仅忽略 localhost 链接
- **`assets(docs)`**：新增 hero logo 图片（`logo-default.png`、`logo-default-2x-cut.webp`、`logo-shadowed-cut.png`）
- **`style(vitepress)`**：hero 图片响应式尺寸（`< 640px`：192px；`≥ 640px`：256px；`≥ 960px`：500px）
- **`docs(home)`**：hero 图片切换为 `logo-shadowed-cut.png`；`text` 字段精简；`actions` 新增"什么是 NestJS Scaffold？"入口；GitHub 链接改为 `_blank` 外链
- **`docs`**：新增 `docs/00-getting-started/about.md`（Maintainers + 致谢合并页，路由 `/guide/about`）
- **`docs`**：更新日志文档迁移为 `docs/04-reference/CHANGELOG.md`，通过 `@include` 导入根目录 `CHANGELOG.md`；删除原 `docs/changelog.md`

### 🔧 构建 / 工具链

- **`build`**：`pnpm update -r` 升级 minor 依赖
  - `@dotenvx/dotenvx-ops`: `^0.37.4` → `^0.37.8`
  - `@nestjs/config`: `^4.0.3` → `^4.0.4`
  - `@nestjs/swagger`: `^11.2.6` → `^11.2.7`
  - `@prisma/adapter-pg`、`@prisma/client`、`prisma`: `^7.6.0` → `^7.7.0`
  - `@nestjs/cli`: `^11.0.17` → `^11.0.19`
  - `@typescript-eslint/eslint-plugin`、`parser`: `^8.58.0` → `^8.58.1`
- **`chore`**：`AGENTS.md` 版本号更新至 0.7.4，删除 YAGNI / 防御性编程章节，新增 `pnpm format` 验证步骤
- **`fix(scripts)`**：`scripts/generate-error-reference.ts` 输出路径更新（`03-reference` → `04-reference`）
- **`fix`**：`src/constants/observability.constant.ts` `ERROR_REFERENCE_URL` 默认值更新（`03-reference` → `04-reference`）

### 🐛 修复（后续增补）

- **`fix(docker)`**：`Dockerfile.dev` / `Dockerfile.prod` 补加 `COPY CHANGELOG.md ./`，修复 `@include` 导入在生产镜像构建时因文件缺失导致内容为空的问题
- **`fix(docker)`**：更新 `VITE_API_REFERENCE_URL` 默认值及 nginx 路由路径（`/reference/api/` → `/api-reference/`），对齐实际部署结构
- **`fix(docs)`**：修复 `docs/04-reference/external-resources.md` 重复节标题
- **`docs(readme)`**：补全文档站访问链接（main / dev 分支）；移除 README 中与文档站重复的快速开始、常用命令、依赖章节

### 📁 文档重构（后续增补）

- **`refactor(docs)`**：`docs/04-reference/` 目录重命名为 `docs/04-appendix/`，与目录实际定位（附录）一致
  - 同步更新全部引用：`website/.vitepress/config.ts` rewrites 规则、`scripts/generate-error-reference.ts` 输出路径、`src/constants/observability.constant.ts` `ERROR_REFERENCE_URL` 默认值、`docs/README.md`、`docs/STANDARD.md`、`AGENTS.md`、`docs/04-appendix/STANDARD.md` 自引用
- **`docs(harness)`**：`docs/02-harness/overview.md` 末尾新增 `:::warning` 说明块，诚实披露 Harness Engineering 当前实现局限（架构依赖检查尚未强制执行、推理型 AI 代码审查 Agent 未实现、突变测试等高级机制暂缺）
- **`docs`**：`README.md` 与 `docs/00-getting-started/introduction.md` 新增“尚未发布首个稳定大版本”说明块，明确告知项目尚未发布 `1.0.0`（首个 Major 版本升级），接口契约在此之前不保证向后兼容，建议锁定至特定 commit 或 tag 而非直接跟踪 `main` 分支

---

## [0.7.3] - 2026-04-07

### ✨ 新功能 / 改进

#### 文档站

- **`feat(docs)`**：文档站 Docker 配置拆分为 `Dockerfile.dev` / `Dockerfile.prod` 两套，nginx 配置同步拆分为 `nginx.dev.conf` / `nginx.prod.conf`
  - `Dockerfile.dev`：API Reference 指向 Apifox 外链，不打包 Scalar 页，镜像精简
  - `Dockerfile.prod`：内嵌 Scalar API Reference 静态页（`/reference/api/`）和 `openapi.json`，无外部服务依赖
- **`feat(docs)`**：`nginx.prod.conf` 新增 gzip 压缩、安全 headers、`/reference/api` 静态位置（=404 fallback）、`/assets/` 长效强缓存（`Cache-Control: public, immutable`）
- **`feat(docs)`**：VitePress API Reference 导航链接改由 `VITE_API_REFERENCE_URL` 环境变量控制；dev server 端口改由 `VITE_API_DOCS_PORT` 控制（默认 5173）
- **`feat(docs)`**：`docs:gen-openapi` / `docs:dev` 脚本改用 `dotenvx run -f .env.development --` 注入环境变量，移除硬编码端口
- **`feat(docs)`**：VitePress 侧边栏「规划」分组新增 PR 0.7.0–0.7.3 条目；移除已废弃的「Docusaurus 配置指南」条目

#### CI/CD 流水线

- **`feat(ci)`**：Apifox OpenAPI 同步 Job（`sync-apifox`）从 `cd-prod.yaml` 迁移至 `cd-dev.yaml`，避免 prod 流程受第三方服务影响

#### API 文档

- **`feat(src)`**：`src/main.ts` 移除 Swagger 描述中的静态链接段落，由文档站统一承载

### 🐛 修复

- **`fix(ci)`**：修复 `cd-prod.yaml` 中 OpenAPI 导出容器因 `--env-file` 不支持多行 EC 私钥值而导致启动失败的问题
  - 移除 "Decrypt .env.test" 步骤（不再生成中间临时文件 `/tmp/.env.cd_export`）
  - 改为 `docker run -e DOTENV_PRIVATE_KEY_TEST=...`，容器内 dotenvx 解密 `.env.test`
  - `NODE_ENV=production` 改为 `NODE_ENV=test`，与 `.env.test` 文件及私钥名 `DOTENV_PRIVATE_KEY_TEST` 保持一致
- **`fix(ci)`**：`cd-dev.yaml` 文档镜像构建更新 Dockerfile 引用为 `website/Dockerfile.dev`
- **`fix(ci)`**：修复 `cd-dev.yaml` artifact 上传路径错误（`path: assets` → `path: openapi.json`）；下载路径错误（`path: assets/openapi.json` → `path: assets`）；`build-docs` 和 `sync-apifox` 两处同步修正
- **`fix(ci)`**：修复 `cd-prod.yaml` `build-docs` job 缺少 `export-openapi` 依赖及 `OPENAPI_JSON_PATH` build-arg，确保 prod 镜像构建时能正确注入最新导出的 `openapi.json`

### 🔧 构建 / 工具链

- **`chore(env)`**：重新加密 `.env.development`、`.env.production`、`.env.test`，新增 `VITE_API_DOCS_PORT` 条目
- **`chore(docs)`**：`scripts/generate-openapi.ts` 输出路径改为 `website/api-reference/openapi.json`；`BACKEND_URL` 改为读取 `PORT` 环境变量

---

## [0.7.2] - 2026-04-07

###  构建 / 工具链

- **`fix(ci)`**：补缺 `cd-dev.yaml` 和 `cd-prod.yaml` 中 Postgres 服务端口映射 `- 5432:5432`，修复 E2E 测试无法连接数据库的问题

---

## [0.7.1] - 2026-04-06

### 🐛 修复

#### CI/CD 流水线

- **`fix(ci)`**：修复 `ci-reusable.yaml`、`cd-dev.yaml`、`cd-prod.yaml` 中 `pg_isready` 未指定用户/数据库参数，导致 PostgreSQL 容器尚未就绪时健康检查即已通过，后续步骤连接失败
  - `--health-cmd` 改为 `pg_isready -U ci_test -d nestjs_demo_basic_test`
  - 新增 `--health-start-period 30s`；检查间隔 10s→5s；重试 5→10 次
  - 连接 URL 从 `localhost` 改为 `127.0.0.1`，绕开 IPv6 优先解析导致的连接失败
  - test job 中新增显式等待步骤确认 `127.0.0.1:5432` 端口可达

- **`fix(ci)`**：修复 `ci-release.yaml` 分支匹配模式 `release-[0-9]*` 无法匹配实际斜杠命名 `release/X.Y` 导致 release 分支 CI 未被触发

- **`fix(scripts)`**：修复 `scripts/validate-release-version.cjs` 版本前缀提取正则由 `release-X.Y` 改为 `release/X.Y` 格式，消除版本验证始终抛出异常的问题

- **`fix(docs)`**：修复 `docs/05-releases/pr-0.7.0.md` frontmatter `head: dev` 与 VitePress 保留字段冲突导致 `head.find is not a function` 错误，将字段重命名为 `branch: dev`

### 📚 文档

- **`docs`**：所有架构文档同步至 v0.7.1，完全对齐 v0.7.0 + v0.7.1 实现
  - 所有 `docs/03-architecture/` 文档升至 v0.7.1，frontmatter 和内容完全对齐实现
  - **auth-module.md**：修复 Mermaid 中 TokenService JWT 算法表示（RS256 → ES256）
  - **project-architecture-overview.md**：更新技术栈版本（Node.js ≥22、PostgreSQL ≥18）、Mermaid 控制器引用（ErrorCatalogController → ExceptionCatalogController）、Header 版本字段
  - **contributing.md**：更新分支命名约定（`release-X.Y` → `release/X.Y`）；重写 CI/CD 触发条件表（移除已删除工作流 `ci-cd-dev.yaml`、`release-snapshot.yaml` 等；修正触发规范）
  - **cicd-deployment.md**：完整重写工作流拓扑 Mermaid（正确映射 10 个实际工作流）；更新工作流配置表（新增 health check 参数说明、DB URL 改用 `localhost`）；自动标签流程改为从 package.json 提取版本
  - **request-pipeline.md**：修复 ThrottlerGuard/AuthGuard 错误码映射；重写 AuthGuard 部分（ES256 算法、新的三策略系统、新错误码 AUTH_TOKEN_MISSING/INVALID）；完整重写异常过滤器分层架构与错误码表
  - **exception-system.md**：修正异常文件路径（singular 格式验证：`auth.exception.ts`、`database.exception.ts` 等）；替换 Result<T,E> 伪代码为实际 `to()` 元组结果模式；更新异常注册机制（通过 `src/common/exceptions/index.ts` 直接 import）；完整重写异常目录结构清单
  - **database.md**：重写 Prisma 错误处理部分（DatabaseService 内 try/catch 而非 AllExceptionsFilter 统一处理）；更新错误码前缀与映射（DB_* 格式）
  - **route-decorator.md**：完整重写（`ApiRouteOptions.errors` 类型改为 `string[]`；元数据键从 `ROUTE_AUTH_KEY` 改为 `AUTH_STRATEGY_KEY`；移除 `IS_PUBLIC_KEY` 兼容层说明；更新装饰器展开逻辑与消费层文档）
  - **openapi-enrichment.md**：移除 `IS_PUBLIC_KEY` 引用；安全方案推断改为基于 `auth='public'` 判断；版本升至 v0.7.1
  - **observability.md**、**docs/AGENTS.md**：版本升至 v0.7.1（内容无变化）
  - **docs/README.md**：更新索引条目中各文档的描述与版本信息、技术栈特征标注

### 🔧 构建 / 工具链

- **`chore`**：`website/public/reference/openapi.json` 移出 git 追踪，添加至 `.gitignore`，避免每次 OpenAPI 导出产生 6000+ 行无意义 diff

---

## [0.7.0] - 2026-04-06

### ✨ 新功能

#### API 文档

- **`@ApiRoute` 装饰器**：整合认证声明、OpenAPI 文档注解、错误码注册于单一装饰器，消除 Controller 层的重复样板代码
- **OpenAPI 标准响应封装**：新增 `wrapSuccessResponses()`，将所有 2xx 响应自动包裹为标准 envelope 格式（`success / data / timestamp / context`）
- **`@Cookie()` 装饰器**：新增用于提取并验证 Cookie 参数的装饰器

#### 文档站

- **VitePress 文档站**：新增 `website/` 子包，集成 VitePress + Scalar 构建文档站，可在 `/reference` 访问交互式 OpenAPI 文档
- **OpenAPI 导出脚本**：新增 `scripts/generate-openapi.ts`，从运行中的后端 `/api-doc-json` 自动导出 `openapi.json`（通过 `pnpm docs:gen-openapi` 调用，支持 `BACKEND_URL` 环境变量覆盖）

#### CI/CD 流水线

- **可复用 CI 工作流**：将 lint/format/test 三个阶段抽取为 `ci-reusable.yaml`，由 `ci-dev`、`ci-prod`、`ci-feature`、`ci-release`、`pr-check-dev`、`pr-check-prod` 六个触发流程统一复用
- **CD-dev 工作流**：新增 `cd-dev.yaml`，在 CI 成功后自动构建并推送后端镜像与文档镜像（`:dev-latest`），并通过 Watchtower HTTP API 通知服务器拉取新镜像
- **CD 流程重构**：统一后端镜像构建 → OpenAPI 导出 → 文档镜像构建（内嵌最新 `openapi.json`）的三段式 CD 模式

### ♻️ 重构

- **`refactor(src)`**：CorsMiddleware、TimeoutInterceptor、ThrottlerModule 等模块改为通过 ConfigService 注入 HTTP 配置，不再直接读取 `process.env`；新增 `src/constants/http.constant.ts` 汇聚 CORS / 限流 / 超时配置
- **`refactor(api-doc)`**：`error-catalog` 路径重命名为 `error-reference`；`route.decorator.ts` 与 `openapi-envelope.ts` 重构，增强错误响应格式化；删除已合并至 exception-registry 的 `error.constant.ts`
- **`refactor(infra)`**：`prisma.config.ts` 改为按 `process.env.NODE_ENV` 动态选择 `.env.*` 文件，不再硬编码 `development`

### 🐛 修复

- **`fix(ci)`**：修复 `workflow_call` 调用方未声明 `secrets: inherit` 导致 `DOTENV_PRIVATE_KEY_TEST` 在 reusable workflow 内为空的问题
- **`fix(ci)`**：修复 dotenvx 私钥缺失时 `PORT` 被注入密文字符串、解析为 `NaN` 导致 Zod 校验失败的问题，在 CI env override 步骤中显式设置 `PORT=3000`
- **`fix(workflow)`**：修复 CI/CD 中 Shadow Database URL 与主库 URL 相同导致 Prisma 迁移失败的问题，分别创建独立 shadow DB
- **`fix(workflow)`**：修复 CD 工作流缺少 `SHADOW_DATABASE_URL` 环境变量的问题

### 🔧 构建 / 工具链

- **dotenvx 集成至 CI**：CI test job 通过 dotenvx 解密 `.env.test` 注入环境变量
- **shellcheck 合规**：多行 `>> "$GITHUB_ENV"` 改为分组写法，消除 SC2129 警告
- **工具链**：`pnpm-lock.yaml` 纳入版本追踪，ESLint ignore 规则与 pnpm-workspace 配置同步更新
- **脚本清理**：移除已废弃的 `deploy-server.sh`、`validate-version.cjs`、`generate-snapshot-info.cjs`

### 📚 文档

- 更新错误参考文档，对齐重命名后的 `error-reference` 路径
- 移除 Docusaurus 相关配置指南（已被 VitePress 替代）

---

## [0.6.2] - 2026-04-04

### ⚠️ 破坏性变更

- **异常系统重构**：`BusinessException` 已删除，改为基于 `@RegisterException` 装饰器模式的分层异常体系（`ClientException` / `SystemException`）；所有抛出异常的代码需通过新的异常类或 `CLIENT_EXCEPTION` / `SYS_EXCEPTION` 默认导出替换

### ✨ 新功能

#### 异常系统

- **分层异常架构**：建立 `AppException → ClientException / SystemException` 继承体系，通过 `@RegisterException` 装饰器集中注册错误码与元数据
- **Exception Registry**：新增 `ErrorRegistry` 单例，统一管理所有错误码、HTTP 状态码、日志级别等静态元数据
- **按业务模块声明异常**：Auth 模块和数据库基础设施分别拥有独立的 `auth.exception.ts` / `database.exception.ts`

#### 配置系统

- **`refactor(config) → feat`**：新增 `config/` 目录，按命名空间（`app`、`auth`、`database`、`observability`、`error-catalog`）分别创建 `registerAs` 工厂函数，通过 `z.infer<>` 派生类型，导出 `AllConfig` 供 `ConfigService<AllConfig, true>` 严格模式注入
- **常量层整合**：随后将 `config/` 目录整合进 `src/constants/`，消除跨目录依赖；新增 `app.constant.ts`（`IS_DEV / IS_TEST / IS_PROD / GIT_COMMIT`）、`database.constant.ts`、JWT 懒加载缓存等

#### 基础设施

- **结果处理模式**：引入 Go 风格 `(data, err)` 元组结果模式用于异步操作，替代 try/catch 模板代码
- **`exception-catalog` 模块**：将 `error-catalog` 重命名为 `exception-catalog`，控制器使用新结果组合器简化
- **`NODE_ENV` 与 `APP_AUTHOR` 常量**：新增至 `app.constant.ts`；支持可配置 JWT 算法（`JWT_ACCESS_ALGORITHM` / `JWT_REFRESH_ALGORITHM`）

#### Docker / 部署

- **Docker Compose 编排**：新增 `docker-compose.yml` 服务编排，服务名规范化（`database` / `backend`），增加健康检查与 SHADOW_DATABASE_URL 支持
- **镜像优化**：Dockerfile 升级至 Node.js 22.22，runner 阶段集成 dotenvx，调整健康检查间隔

### ♻️ 重构

- **`refactor(infra)`**：将 ALS（AsyncLocalStorage）抽取为独立 `AlsModule`，将数据库上下文分离为 `DatabaseModule`；`RequestContextService` 重命名为 `AlsService` 并迁移至 `infra/als/`
- **`refactor(exceptions)`**：删除 `BusinessException`；`AllExceptionsFilter` 重命名并拆分为专项 Filter（Zod / Throttler / 兜底）；`RuntimeContext` 字段重排并新增 `causeDescription`
- **`refactor(modules)`**：异步操作结果模式对齐，`exception-catalog` 控制器使用新结果组合器
- **`refactor(config)`**：`ThrottlerModule` / `LoggerModule` 改为 `forRootAsync` 消费 ConfigService；移除所有测试文件中的 `loadEnv()` 直接调用；`DatabaseService.handleQueryEvent` 简化，移除参数解析与 sanitization

### 🐛 修复

- **`fix(script)`**：修正 dotenvx 命令中错误的参数标志

### 🔧 构建 / 工具链

- **工具链升级**：以 `dotenvx` 替换 `cross-env`；Node.js 最低版本要求从 20 升至 22；PostgreSQL 最低版本要求从 15 升至 18
- **TypeScript 配置**：移除 `baseUrl`，修正路径别名；Jest 模块解析改为 `nodenext`
- **Pre-commit 钩子**：优化执行性能，新增条件式 env 加密逻辑

---

## [0.6.1] - 2026-03-28

### ✨ 新功能

- **Prisma Schema 更新**：`schema.prisma` 新增字段定义，完善数据模型

### 🐛 修复

- **`fix(middleware)`**：`AppMiddleware` 补充请求上下文字段处理逻辑

### 📚 文档

- 更新 `README.md`，补充项目使用说明
- 更新 `AGENTS.md`，完善 AI 协助者操作手册描述

---

## [0.6.0] - 2026-03-27

### ⚠️ 破坏性变更

- **JWT 签名算法迁移**：从 RS256 切换至 ES256，密钥文件须存放于 `config/keys/`（`jwt-private.pem` / `jwt-public.pem`），旧 RS256 密钥不再兼容

### ✨ 新功能

#### 认证系统（JWT + Cookie）

- **完整 JWT 认证流程**：实现 Access Token 签发/验证、Refresh Token Cookie 轮转机制
- **认证守卫**：`AuthGuard` 接管路由保护，统一鉴权逻辑
- **IAM 边界划定**：搭建 Auth 模块骨架，明确 IAM 集成接入点

#### 访问频率限制

- **分层限流策略**：基于 `@nestjs/throttler`，支持按路由粒度配置请求速率上限

#### 基础设施

- **加密环境变量**：集成 `dotenvx`，支持 `.env` 文件加密存储敏感配置
- **Prisma 数据层**：添加 seed 配置与初始数据填充脚本

#### 开发体验

- **OpenAPI/Swagger 文档**：自动生成 API 文档，访问路径 `/api-doc`
- **CORS 中间件**：细粒度跨域配置，支持多来源白名单
- **密码哈希工具**：`bcrypt` 封装 + 密码校验；密码学安全随机整数生成

### ♻️ 重构

#### 架构层级整理

- **应用结构重组**：`infra/`、`modules/`、`common/` 三层边界明确划分
- **公共服务目录**：将共享服务迁移至 `src/common/services/` 独立子目录
- **工具函数重组**：`utils/` 按 `helpers/`、`formatters/`、`validators/`、`errors/` 分类，移除旧 `src/utils/`

#### 配置与环境

- **环境变量 schema 集中化**：Zod 校验 schema 提取至 `src/common/utils/validation-schema.ts`
- **环境特定 `.env` 加载**：按 `NODE_ENV` 自动选择对应 `.env.*` 文件

#### 请求上下文与响应

- **Request Context API 更新**：`RequestContextService` 接口对齐新字段结构
- **响应 metadata 自动化**：统一注入 `requestId`、`version` 至响应上下文
- **错误文档自动化**：错误码目录接入自动路由注册

#### 认证

- **ES256 密钥加载**：改为从文件系统读取 PEM 密钥，移除环境变量内联密钥做法

### 🐛 修复

- **`fix(types)`**：统一 Express Request 类型扩展，收紧 `jwtClaim` 类型定义，防止运行时字段访问错误
- **`fix(utils)`**：修复取模偏差（modulo bias）导致的随机分布不均问题；修复原型污染（prototype pollution）漏洞

### 🔧 构建 / CI

- **Docker 镜像优化**：精简多阶段构建，按环境分离依赖安装与 env 加载逻辑
- **依赖升级**：全量更新至最新兼容版本，`package.json` 版本号升至 `0.6.0`
- **CI/CD 流水线**：更新 GitHub Actions workflow，对齐新环境变量注入方式

### 📚 文档

- **AGENTS.md 体系**：引入 AI 协助者操作手册及结构化文档层级（`docs/` 多级 STANDARD）

---

## [0.5.3] - 2026-02-16

### ♻️ 重构

#### Docker 镜像优化与版本管理改进

- **精简生产镜像**：移除不必要的生产依赖（pnpm 本体、package.json 拷贝）
- **devDependencies 归位**：`@nestjs/cli`、`prisma`、`tsc-alias` 移至 devDependencies，不再打入最终镜像
- **版本号注入方式调整**：改用环境变量 `APP_VERSION`、`APP_NAME` 替代读取 package.json
- **健康检查简化**：移除 `/health` 响应中的 `timestamp` 字段
- **测试 import 路径修复**：补全 `.js` 扩展名，符合 ESM/NodeNext 模块解析规范
- **Dockerfile CMD 修正**：修复入口文件路径至正确编译产物位置

#### 路径别名与模块加载整理

- **统一 `@` 路径别名**：将分散的相对路径 import 改为 `@/` 前缀，提升可读性
- **package.json 直读**：移除 `APP_NAME` 环境变量依赖，改为直接从 package.json 读取应用名
- **移除冗余中间件**：删除 express body-parser 中间件，改用 NestJS 内置解析器
- **代码清理**：移除 `app.module.ts` 中的注释代码
- **ESLint 规则收紧**：启用 `no-console` 规则并为必要场景添加 override

### 🔧 技术细节

#### 修改文件

- `Dockerfile`
- `src/main.ts`
- `src/app.module.ts`
- `src/constants/app.constant.ts`
- `package.json`（版本号：0.5.2 → 0.5.3）

---

## [0.5.2] - 2026-02-16

### 🐛 修复

#### Docker 镜像构建：pnpm prune 参数修复

- **问题**：镜像构建阶段 `pnpm prune --prod` 缺少 `--ignore-scripts` 参数，导致 prune 时触发不必要的生命周期脚本，引发构建失败
- **修复**：`RUN pnpm prune --prod` 改为 `RUN pnpm prune --prod --ignore-scripts`

### 🔧 技术细节

#### 修改文件

- `Dockerfile`
- `package.json`（版本号：0.5.1 → 0.5.2）

---

## [0.5.1] - 2026-02-16

### 🐛 修复

#### Docker 构建阶段缺少类型定义

- **问题**：构建阶段使用 `pnpm install --prod` 导致 `@types/express`、`@types/compression` 等类型定义缺失，TypeScript 编译失败
- **修复**：构建阶段改为完整安装所有依赖（移除 `--prod` 参数），编译完成后再执行 `pnpm prune --prod` 清理 devDependencies，确保最终镜像仅含生产依赖

- **`main.ts` 健壮性增强**：添加顶层 `.catch()` 捕获 bootstrap 异步错误，防止未处理的 Promise 拒绝静默退出

> ⚠️ **破坏性变更**：Docker 构建流程调整，需要完整依赖进行编译阶段。

### 🔧 技术细节

#### 修改文件

- `Dockerfile`
- `src/main.ts`
- `package.json`（版本号：0.5.0 → 0.5.1）

---

## [0.5.0] - 2026-02-16

### ✨ 新增

#### 请求生命周期架构全面重构

- **请求预处理中间件**：新增 `RequestPreprocessingMiddleware`，使用 ULID 生成可排序请求 ID，支持分布式追踪（读取 `X-Request-ID` header）
- **响应格式标准化拦截器**：新增 `ResponseFormatInterceptor`，统一所有 API 响应为 `{ success, data, timestamp, requestId }` 格式
- **请求超时拦截器**：新增 `TimeoutInterceptor`，支持通过 `REQUEST_TIMEOUT_MS` 环境变量配置，超时后抛出 `RequestTimeoutException` 并记录详细上下文日志
- **AsyncLocalStorage 请求上下文**：新增 `RequestContextService`，实现 HTTP → Service → Database 全链路 `requestId` 透传，无需逐层传参

> ⚠️ **破坏性变更**：API 响应格式已标准化，所有原始响应体现在包裹于 `data` 字段中。

#### 可观测性系统

- **慢查询监控**：`DatabaseService` 集成查询耗时检测，慢查询阈值触发 `warn`/`error` 级别日志（阈值定义见 `src/constants/observability.constant.ts`）
- **慢请求监控**：`PerformanceInterceptor` 重构，使用 `finish` 事件获取准确 HTTP 状态码，慢请求分级告警
- **requestId 日志顶层字段**：将 `requestId` 从 `http` 对象内部提升至日志顶层，便于日志系统检索
- **Logger 降级机制**：`Logger` 继承 NestJS 原生 Logger 并新增降级机制，pino 初始化失败时自动切换至结构化 console 输出，新增 `ConsoleFormatter` 保持格式一致
- **LOG_LEVEL 动态配置**：支持通过 `LOG_LEVEL` 环境变量设置最低输出级别，并新增运行时接口端点 `PATCH /log-level` 动态调整

#### 安全加固

- **请求中间件栈**：统一注册安全中间件层
  - Helmet（安全响应头）
  - CORS 策略（基于 `ALLOWED_ORIGINS` 环境变量）
  - 请求体大小限制
  - 响应压缩（compression）
  - 三档限流：全局 `100r/60s`、严格 `20r/60s`、公开 `1000r/5min`

#### 环境变量与配置

- **基于 Zod 的启动时环境变量验证**：
  - `NODE_ENV` 枚举值（含默认值）
  - `PORT` 端口范围（1–65535）
  - `DB_URL` URL 格式
  - `ALLOWED_ORIGINS` 逗号分隔的合法 URL 列表
  - `LOG_LEVEL` 枚举值
  - 超时配置非负整数约束
- **数据库连接池配置**：最大连接数 12，最小 2，空闲超时 30s，连接超时 2s

#### 启动体验

- **ASCII Art 启动 Banner**：引入 `figlet` + `gradient-string`，启动时展示渐变色项目名称
- **生产端口统一**：默认端口改为 `3000`，移除 Dockerfile 中无意义默认值

### 🐛 修复

- **Bootstrap banner 时序问题**：增加 NestJS 启动日志等待时间，确保 banner 在最底部完整输出；修复 package version 为空字符串时角落版本号显示异常
- **Pino 错误序列化器**：禁用 `err` serializer（原为重复赋值），避免异常堆栈被 pino 与 `AllExceptionsFilter` 双重记录

### ⚡ CI/CD 改进

- **部署脚本**：新增 `scripts/deploy-server.sh`，更新 `ci-cd-dev.yaml` 集成自动部署流程

### 📦 依赖变更

- 新增 `ulid`（替代 `crypto.randomUUID`，生成可排序 ID）
- 新增 `figlet` + `gradient-string`（启动 Banner）
- 新增 `@nestjs/throttler`（限流）
- 更新多项依赖至最新版本

### 🔧 技术细节

#### 新增文件

- `src/app.middleware.ts`（CorsMiddleware + RequestPreprocessingMiddleware）
- `src/app.interceptor.ts`（ResponseFormatInterceptor + PerformanceInterceptor + TimeoutInterceptor）
- `src/common/services/request-context.service.ts`
- `src/constants/observability.constant.ts`

#### 修改文件（主要）

- `src/main.ts`
- `src/app.module.ts`
- `src/app.filter.ts`（AllExceptionsFilter）
- `src/infra/database/database.service.ts`
- `src/common/services/logger.service.ts`
- `package.json`（版本号：0.4.3 → 0.5.0）

---

## [0.4.3] - 2025-12-23

### ⚡ CI/CD 改进

#### 发布脚本重构与测试支持

- **`scripts/version-utils.cjs` 重构**：将 `setGitHubOutput` 函数从内联定义提取为模块导出，供多个脚本复用
- **发布脚本测试化**：重构 `generate-snapshot-info.cjs`、`validate-release-version.cjs`，使核心逻辑可在测试环境独立运行
- **并发组优化**：更新所有 workflow 的 `concurrency` 组名称，防止同分支不同触发类型互相取消
- **Secret 名称规范化**：将 `PAT_TOKEN` 统一重命名为 `PAT`，与仓库 Secrets 配置对齐

### 🎨 代码风格

- **`.prettierignore` 新增**：排除 `.md` 文件的 Prettier 格式化，避免中文文档被意外改动
- **代码风格修复**：修正 release 脚本中若干格式问题

### 🔧 技术细节

#### 修改文件

- `scripts/version-utils.cjs`
- `scripts/generate-snapshot-info.cjs`
- `scripts/validate-release-version.cjs`
- `.github/workflows/` 多个 YAML 文件（concurrency 组更新）
- `.prettierignore`（新增）
- `package.json`（版本号：0.4.2 → 0.4.3）

---

## [0.4.2] - 2025-12-23


### ⚡ CI/CD 改进

#### PAT Token 支持跨工作流触发

- **auto-tag-release.yaml 增强**：添加 Personal Access Token (PAT) 支持，以触发 cd-prod.yaml 工作流
    - 添加详细的文档注释，说明 GitHub Actions 安全限制
    - 配置使用仓库 Secrets 中的 `PAT_TOKEN`（如未配置则回退到 `GITHUB_TOKEN`）
    - 更新 checkout 步骤使用 PAT token
    - 更新 Git 凭证配置使用 PAT token
    - **背景说明**：GitHub Actions 默认的 `GITHUB_TOKEN` 推送标签/代码时不会触发其他工作流（防止无限递归）

### 📚 文档更新

#### PAT 配置指南

- **新增文档文件**：创建 `docs/github-pat-setup.md`，详细说明 PAT 配置步骤
    - 创建 Fine-grained Personal Access Token 的分步指南
    - 仓库 Secrets 配置说明
    - 安全最佳实践和 token 管理指南
    - 故障排查和常见问题解答

- **README.md 增强**：在 CI/CD 工作流文档中添加 PAT 配置章节
    - 添加关于 GitHub Actions 安全限制的警告说明
    - 快速配置指南（3 分钟配置）
    - 未配置 PAT 的影响说明
    - 链接到详细配置文档

### 🔧 技术细节

#### 文件变更统计

```
3 个文件变更，52 行新增(+)，2 行删除(-)
```

#### 修改的文件

- `.github/workflows/auto-tag-release.yaml` (+19 行)
- `README.md` (+33 行)
- `package.json` (版本号：0.4.1 → 0.4.2)

---

## [0.4.1] - 2025-12-23

### ⚡ CI/CD 改进

#### 生产部署工作流增强

- **cd-prod.yaml 增强**：添加手动触发功能，支持自定义标签输入
    - 添加 `workflow_dispatch` 触发器，允许手动部署
    - 添加 `tag` 输入参数（如 v0.4.0），用于指定部署目标
    - 更新 checkout 步骤，同时支持自动触发（标签推送）和手动触发（workflow_dispatch）
    - 增强标签提取逻辑，处理两种触发类型
    - **使用场景**：PAT 未配置时的手动部署，或紧急部署场景

#### CI 工作流数据库测试支持

- **ci-prod.yaml 增强**：添加 PostgreSQL 服务容器用于测试
    - 配置 PostgreSQL 18.1-alpine 服务容器
    - 设置容器健康检查以确保就绪
    - 通过环境变量配置测试数据库凭证
    - 端口映射：5432:5432 用于本地访问
    - **用途**：在 CI 环境中运行需要数据库连接的测试

### 🔧 技术细节

#### 文件变更统计

```
3 个文件变更，32 行新增(+)，2 行删除(-)
```

#### 修改的文件

- `.github/workflows/cd-prod.yaml` (+14 行)
- `.github/workflows/ci-prod.yaml` (+18 行)
- `package.json` (版本号：0.4.0 → 0.4.1)

---

## [0.4.0] - 2025-12-23

### 🔒 安全修复

#### 命令注入漏洞修复

- **version-utils.cjs 命令注入防护**：使用 `execFileSync` 代替 `execSync`，通过参数数组传递避免 shell 注入
    - 添加 `validateVersionPrefixFormat()` 函数，严格验证版本前缀格式（只允许 `X.Y`）
    - 新增 `execGit()` 函数，安全地执行 git 命令
    - 修复 `getExistingTags()` 使用不安全的 shell 命令拼接问题

#### Workflow 脚本注入防护

- **用户输入转义**：所有 workflow 中的用户可控输入添加转义处理
    - PR 标题、分支名、提交信息等通过环境变量传递，避免直接插值
    - 移除换行符并转义反引号，防止破坏 Markdown 格式
    - 影响文件：`auto-tag-release.yaml`、`pr-check-dev.yaml`、`pr-check-prod.yaml`、`ci-release.yaml`、`release-snapshot.yaml`

#### 变量引用规范化

- **统一 git 命令变量引用**：`auto-tag-release.yaml` 中所有 `git rev-list` 命令的 `TAG_NAME` 变量统一加引号（`"${TAG_NAME}"`）

### ⚡ CI/CD 改进

#### Workflow 架构重构

- **并行 Job 执行**：所有 workflow 重构为独立并行 job，提升执行效率
    - `pr-check-dev.yaml`：拆分为 `lint-and-format` + `test`
    - `pr-check-prod.yaml`：拆分为 `lint-and-format` + `test` + `check-version`（条件执行）
    - `ci-feature.yaml`：拆分为 `lint-and-format` + `test`
    - `ci-release.yaml`：拆分为 `lint-and-format` + `test` + `check-version`
    - `ci-cd-dev.yaml`：拆分为 `lint-and-format` + `test` + `build-and-publish`

#### 生产环境 CI/CD 分离

- **ci-cd-prod.yaml 拆分**：
    - `ci-prod.yaml`：CI 流程（main 分支 push 触发，仅 lint + test）
    - `cd-prod.yaml`：CD 流程（v\* tag 触发，负责 Docker 构建和发布）

#### Docker 镜像标签策略简化

- **标签数量优化**：从 5+ 个标签简化为 3 个
    - 开发环境：`dev-latest`、`dev-YYYYMMDD-hash`、版本号
    - 生产环境：`prod-latest`、`prod-YYYYMMDD-hash`、版本号
- **移除冗余标签**：删除 `image-tag-version` 输出和相关生成逻辑

#### 版本管理脚本

- **scripts/validate-version.cjs**：PR 版本验证脚本
    - 检查 package.json 版本是否匹配 release 分支
    - 生成中英双语验证结果评论
    - 支持 `BRANCH_NAME` 环境变量传参（防止命令注入）

- **scripts/validate-release-version.cjs**：Release 分支版本验证
    - 提取 release 分支版本前缀（如 `release-0.4` → `0.4`）
    - 验证 package.json 版本是否为 `X.Y` 格式

- **scripts/generate-snapshot-info.cjs**：快照版本信息生成
    - 替换原 bash 脚本，使用 JavaScript 实现
    - 输出：version、sha7、timestamp、snapshot_tag、docker_image_snapshot_tag

- **scripts/create-release-tag.cjs**：自动创建 Release 标签
    - 验证版本号有效性
    - 计算下一个 patch 版本
    - 创建 tag（不推送，由 workflow 推送）
    - 支持 `RELEASE_BRANCH`/`BRANCH_NAME` 环境变量

- **scripts/version-utils.cjs**：版本管理通用工具库
    - `extractVersionPrefix()`：提取版本前缀并验证
    - `getExistingTags()`：安全获取现有 tag 列表
    - `calculateNextPatch()`：计算下一个 patch 号
    - `validatePackageVersion()`：验证 package.json 版本

#### PR 评论优化

- **自动清理旧评论**：`pr-check-prod.yaml` 自动删除旧的版本检查评论
    - 通过 HTML 注释标识符 `<!-- version-check-comment -->` 识别
    - 只删除 `github-actions[bot]` 发表的评论，避免误删

#### 其他改进

- **Node.js 版本显式指定**：`release-snapshot.yaml` 添加 `setup-node` 步骤，确保使用 Node.js 22
- **修复语法错误**：移除 `release-snapshot.yaml` 中多余的 echo 语句
- **workflow 触发条件优化**：`auto-tag-release.yaml` 移除命令行参数，直接使用环境变量

### 📚 文档更新

#### Commitlint 相关清理

- **移除 Commitlint 引用**：从文档中移除已删除工具的引用
    - 更新 `README.md`：删除 5 处 Commitlint 提及
    - 更新 `.github/copilot-instructions.md`：移除技术栈中的 Commitlint
    - 说明：提交信息规范仍推荐遵循，但不再通过 Git hooks 强制验证

#### 项目说明完善

- **更新核心特性描述**：突出 CI/CD 工作流、版本管理等核心能力

### 🗑️ 移除

#### 工具链简化

- **删除 Commitlint 配置**：
    - 删除 `commitlint.config.js`
    - 删除 `.husky/commit-msg` Git 钩子
    - 从 `package.json` 移除 `@commitlint/cli` 和 `@commitlint/config-conventional` 依赖

### 📦 依赖变更

- 移除 `@commitlint/cli` (v20.2.0)
- 移除 `@commitlint/config-conventional` (v20.2.0)

### 🔧 技术细节

#### 文件变更统计

```
21 files changed, 2358 insertions(+), 449 deletions(-)
```

#### 新增文件

- `scripts/validate-version.cjs` (114 行)
- `scripts/validate-release-version.cjs` (127 行)
- `scripts/generate-snapshot-info.cjs` (85 行)
- `scripts/create-release-tag.cjs` (88 行)
- `scripts/version-utils.cjs` (185 行)
- `.github/workflows/ci-prod.yaml` (148 行)
- `.github/workflows/cd-prod.yaml` (105 行)

#### 重命名文件

- `.github/workflows/ci-cd-prod.yaml` → `.github/workflows/cd-prod.yaml`

#### 删除文件

- `commitlint.config.js`
- `.husky/commit-msg`

#### 修改文件（主要变更）

- `.github/workflows/auto-tag-release.yaml` (+/-177 行)
- `.github/workflows/pr-check-prod.yaml` (+/-193 行)
- `.github/workflows/ci-release.yaml` (+/-128 行)
- `.github/copilot-instructions.md` (+383 行)
- `README.md` (+551 行)

---

## [0.3.1] - 2025-12-21

### 变更

- 发布 0.3.1 版本

## [0.3.0] - 2025-12-20

### 新增

#### GitHub Actions 工作流

- **自动标签发布** (`auto-tag-release.yaml`)：当 release 分支合并到 main 时自动创建版本标签
- **快照版本发布** (`release-snapshot.yaml`)：发布带时间戳的快照版本用于测试
- **特性分支 CI** (`ci-feature.yaml`)：对特性分支运行 CI 检查
- **发布分支 CI** (`ci-release.yaml`)：合并前验证发布分支

#### 代码质量与规范

- **Commitlint**：强制执行提交信息规范
    - 添加 `@commitlint/cli` (v20.2.0)
    - 添加 `@commitlint/config-conventional` (v20.2.0)
    - 添加 `commitlint.config.js` 配置文件，支持以下类型：`feat`、`fix`、`docs`、`style`、`refactor`、`perf`、`test`、`chore`、`revert`、`ci`、`build`、`release`
- **Commitizen**：交互式提交信息助手
    - 添加 `commitizen` (v4.3.1)
    - 添加 `cz-conventional-changelog` (v3.3.0)
    - 新增 `pnpm commit` 命令用于引导式提交
- **Husky Git 钩子**：commit-msg 钩子在提交前验证提交信息

### 变更

#### 工作流文件重命名（`.yml` → `.yaml`）

- `ci-cd(dev).yml` → `ci-cd-dev.yaml` 并改进格式
- `ci-cd(prod).yml` → `ci-cd-prod.yaml` 并改进格式
- `PR-check(dev).yml` → `pr-check-dev.yaml`
- `PR-check(prod).yml` → `pr-check-prod.yaml`

#### 依赖更新

- **Prisma**：`7.1.0` → `7.2.0`
    - `@prisma/adapter-pg`：`7.1.0` → `7.2.0`
    - `@prisma/client`：`7.1.0` → `7.2.0`
    - `prisma`：`7.1.0` → `7.2.0`
- **ESLint 与 TypeScript**：
    - `@eslint/js`：`9.39.1` → `9.39.2`
    - `eslint`：`9.39.1` → `9.39.2`
- **类型定义**：
    - `@types/node`：`25.0.0` → `25.0.3`

#### 环境变量

- **数据库 URL 重命名**：`DATABASE_URL` → `DB_URL`，涉及文件：
    - `.env.example`
    - `Dockerfile`（ARG 参数）
    - `prisma.config.ts`
    - `src/common/prisma.service.ts`

#### 编辑器配置

- **VS Code 设置**（`.vscode/settings.json`）：
    - 添加 YAML 格式化配置（2 空格缩进）
    - 添加 JSON 格式化配置（2 空格缩进）
    - 移除多余空行，格式更清晰
    - 改进代码组织结构

### 移除

- **过时的工作流**：删除 `ci-cd.yml`（已由独立的 dev/prod 工作流替代）

## [0.2.0] - 2025-12

### 新增

- 初始化 CI/CD 工作流用于开发和生产环境
    - `ci-cd(dev).yml`：开发环境部署工作流
    - `ci-cd(prod).yml`：生产环境部署工作流
    - `PR-check(dev).yml`：开发环境 PR 验证
    - `PR-check(prod).yml`：生产环境 PR 验证
- Dockerfile 用于容器化部署
- VS Code 编辑器配置
