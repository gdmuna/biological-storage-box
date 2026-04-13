---
title: CI/CD 与部署
inherits: docs/03-architecture/STANDARD.md
status: active
version: "0.7.3"
last-updated: 2026-04-07
category: architecture
related:
  - docs/03-architecture/STANDARD.md
  - docs/03-architecture/project-architecture-overview.md
---

# CI/CD 与部署

代码从提交到生产容器的完整流水线。

## 1. 分支策略与 Workflow 触发关系

```mermaid
flowchart LR
    FT["push → feature/**"] --> CF["ci-feature\nlint + test（via ci-reusable）"]
    DV["push → dev"] --> CIDEV["ci-dev\nlint + test（via ci-reusable）"]
    CIDEV -- "成功" --> CDDEV["cd-dev\n构建 + 开发环境部署"]
    RL["push → release/**"] --> CR["ci-release\nlint + test + 版本检查（via ci-reusable）"]
    MN["push → main"] --> CP["ci-prod\nlint + test（via ci-reusable）"]
    PRD["PR 合并 → main\n（from release/*）"] --> AT["auto-tag-release\n版本提取 + tag 创建"]
    AT -- "tag 创建" --> CDP["cd-prod\n生产部署"]
```

## 2. Workflow 清单

| 文件 | 触发条件 | 核心步骤 | 含 DB 服务 |
|------|---------|---------|-----------|
| `ci-reusable.yaml` | workflow_call（被其他 CI 复用）| lint + build + test + E2E | 是 |
| `ci-feature.yaml` | push → `feature/**`, `fix/**`, `refactor/**` | lint + test（via ci-reusable）| 是（via ci-reusable）|
| `ci-dev.yaml` | push → `dev` | lint + test（via ci-reusable）| 是（via ci-reusable）|
| `cd-dev.yaml` | ci-dev 成功完成 | 构建后端镜像 → 导出 OpenAPI JSON → 构建文档镜像（`Dockerfile.dev`）→ 同步 Apifox → 部署至开发环境 | 否（export job 含 DB 服务容器）|
| `ci-release.yaml` | push → `release/**` | lint + test + 版本号校验（via ci-reusable）| 是（via ci-reusable）|
| `ci-prod.yaml` | push → `main` | lint + test（via ci-reusable）| 是（via ci-reusable）|
| `auto-tag-release.yaml` | PR 合并至 `main`（from `release/*`）| 版本提取 + 创建 tag | 否 |
| `cd-prod.yaml` | tag 创建事件 | 构建后端镜像 → 导出 OpenAPI JSON → 构建文档镜像（`Dockerfile.prod`，含内嵌 Scalar）→ 部署至生产环境 | 否（export job 含 DB 服务容器）|
| `pr-check-dev.yaml` | PR → `dev` | 规范性检查 | — |
| `pr-check-prod.yaml` | PR → `main` | 规范性检查 + 版本号检查 | — |

**公共配置**：Node.js 22、pnpm 10、Runner: `ubuntu-latest`

## 3. 含 DB 服务的 CI 环境

`ci-release` 和 `ci-prod` 中启动 PostgreSQL 服务容器供 E2E 测试使用：

| 配置项 | 值 |
|--------|-----|
| 镜像 | `postgres:18` |
| `POSTGRES_USER` | `ci_test` |
| `POSTGRES_PASSWORD` | `ci_test_password` |
| `POSTGRES_DB` | `nestjs_demo_basic_test` |
| 映射端口 | `5432` |
| 健康检查 | `pg_isready -U ci_test -d nestjs_demo_basic_test`，间隔 10s，超时 5s，start-period 10s，重试 5 次 |

注入到 CI Job 的 `DATABASE_URL`：

```
postgresql://ci_test:ci_test_password@localhost:5432/nestjs_demo_basic_test?schema=public
```

## 4. 自动版本标签（auto-tag-release）

当 `release/*` 分支的 PR 被合并到 `main` 时自动触发：

```mermaid
flowchart TD
    A["PR merged: release/X.Y → main"] --> B["从 package.json 提取版本号"]
    B --> C["node scripts/create-release-tag.cjs"]
    C --> D{tag 已存在?}
    D -- 是 --> E["跳过，幂等退出"]
    D -- 否 --> F["git tag vX.Y.Z 目标 commit"]
    F --> G{有 PAT 可用?}
    G -- 是 --> H["使用 PAT push tag（触发 cd-prod）"]
    G -- 否 --> I["使用 GITHUB_TOKEN push tag"]
    H & I --> J["输出 tag 短 SHA（7 位）"]
```

> `create-release-tag.cjs` 做幂等保护：tag 已存在时直接退出，不报错。

## 5. Docker 多阶段构建

### 阶段示意

```mermaid
flowchart LR
    subgraph builder["Stage: builder（node:22-slim）"]
        direction TB
        B1["apt-get install openssl"] --> B2["COPY package.json + pnpm files"]
        B2 --> B3["pnpm install（全量 deps）"]
        B3 --> B4["pnpm prisma generate"]
        B4 --> B5["pnpm build\n(tsc + tsc-alias)"]
        B5 --> B6["pnpm prune --prod\n移除 devDependencies"]
    end

    subgraph runner["Stage: runner（node:22-slim）"]
        direction TB
        R1["COPY node_modules（已裁剪）"] --> R2["COPY dist/"]
        R2 --> R3["COPY .env.*"]
        R3 --> R4["apt-get install openssl curl"]
        R4 --> R5["EXPOSE ${PORT}"]
        R5 --> R6["HEALTHCHECK /health"]
        R6 --> R7["CMD node dist/src/main"]
    end

    builder --> runner
```

### 构建 ARG

| 参数 | 默认值 | 用途 |
|------|--------|------|
| `DATABASE_URL` | postgresql 占位符 | Prisma generate 所需 |
| `SHADOW_DATABASE_URL` | postgresql 占位符 | Prisma migrate 所需 |
| `APP_VERSION` | — | 注入应用版本 |
| `APP_NAME` | — | 注入应用名 |
| `GIT_COMMIT` | — | 注入 Git 提交哈希 |
| `NODE_ENV` | `production` | 环境标识 |
| `PORT` | `3000` | 服务监听端口 |

### 健康检查配置

```dockerfile
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD curl --fail http://localhost:${PORT}/health || exit 1
```

健康检查端点 `GET /health` 返回 DB 连接状态与应用版本，由 `AppController` 提供。

## 6. 文档站镜像构建

### 6.1 Dockerfile 拆分

文档站镜像分为两套，分别服务于开发环境和生产环境：

| 文件 | 定位 | API Reference 来源 |
|------|------|-------------------|
| `website/Dockerfile.dev` | 开发镜像，体积精简 | 外链 Apifox 文档站（由 `VITE_API_REFERENCE_URL` ARG 注入） |
| `website/Dockerfile.prod` | 生产镜像，离线可用 | 内嵌 Scalar 静态页（`/reference/api/`）+ `openapi.json` |

两套都采用多阶段构建：`builder`（node:22.22-slim）执行 VitePress 构建，`runner`（nginx:alpine）托管静态文件。

**`Dockerfile.prod` 构建时注入 `openapi.json`**：

```dockerfile
ARG OPENAPI_JSON_PATH=website/api-reference/openapi.json
COPY ${OPENAPI_JSON_PATH} /usr/share/nginx/html/reference/api/openapi.json
```

CI 通过 `--build-arg OPENAPI_JSON_PATH=assets/openapi.json` 覆盖默认路径，从上游 artifact 注入最新导出的 JSON。

### 6.2 nginx 配置差异

| 配置项 | `nginx.dev.conf` | `nginx.prod.conf` |
|--------|-----------------|------------------|
| gzip 压缩 | ✅ | ✅ |
| 安全 headers | ✅ | ✅ |
| `location /` | SPA fallback（`/index.html`）| SPA fallback（`/index.html`）|
| `location /reference/api` | — | `try_files … =404`（静态文件，不回退 SPA）|
| `location ~* ^/assets/` | 1 年强缓存 + `immutable` | 1 年强缓存 + `immutable` |

`nginx.prod.conf` 的 `/reference/api` 使用 `=404` fallback 而非 SPA 兜底，避免文件不存在时静默返回 200。

### 6.3 CD 文档镜像构建流程（以 cd-dev 为例）

```mermaid
flowchart TD
    A["export-openapi job"] --> B["curl /api-doc-json → openapi.json"]
    B --> C["upload-artifact: path=openapi.json"]
    C --> D["build-docs job / sync-apifox job"]
    D --> E["download-artifact: path=assets"]
    E --> F["文件落点: assets/openapi.json"]
    F --> G["docker build\n--build-arg OPENAPI_JSON_PATH=assets/openapi.json"]
    F --> H["jq --slurpfile spec assets/openapi.json\ncurl → Apifox"]
```

> **artifact 路径规则**：`upload-artifact` 的 `path` 指定**文件**；`download-artifact` 的 `path` 指定**目标目录**，文件会自动放入该目录下，最终路径为 `assets/openapi.json`。

### 6.4 cd-prod OpenAPI 导出容器环境变量注入

导出步骤临时启动后端镜像以采集 OpenAPI JSON，环境变量注入方式经历了如下修复（v0.7.3）：

| 方式 | 问题 |
|------|------|
| ~~`dotenvx decrypt --stdout > /tmp/.env.cd_export` + `--env-file`~~ | Docker `--env-file` 不支持多行值，EC 私钥含换行符导致容器启动失败 |
| `-e DOTENV_PRIVATE_KEY_TEST=…`（当前）| 容器内 dotenvx 自动解密 `.env.test`，无中间文件 |

当前 `docker run` 关键参数：

```yaml
docker run -d \
  -e DOTENV_PRIVATE_KEY_TEST=${{ secrets.DOTENV_PRIVATE_KEY_TEST }} \
  -e NODE_ENV=test \
  -e DATABASE_URL="postgresql://…" \
  -e PORT=3000 \
  ${{ env.BACKEND_IMAGE }}:latest
```

`NODE_ENV=test` 使 dotenvx 匹配解密 `.env.test`，对应私钥名为 `DOTENV_PRIVATE_KEY_TEST`。
