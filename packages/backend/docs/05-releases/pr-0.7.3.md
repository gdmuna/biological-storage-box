---
title: "发布 PR：v0.7.3"
version: "0.7.3"
base: main
branch: release/0.7
date: 2026-04-07
---

# 发布 v0.7.3

## 概述

本 PR 将 `release/0.7` 分支合并至 `main`，发布 v0.7.3 版本。主要内容：文档站 Docker 配置拆分为 dev/prod 两套；prod 镜像内嵌 Scalar API Reference；VitePress 开发配置改用环境变量注入；CI/CD 同步更新（cd-dev 新增 Apifox 同步 Job，cd-prod 移除）；环境变量文件重新加密；修复 cd-prod OpenAPI 导出容器启动问题。

## 变更内容

### ✨ 新功能 / 改进

#### 文档站 Docker 配置

- **`feat(docs)`**：Dockerfile 拆分为 `Dockerfile.dev` / `Dockerfile.prod`，nginx 配置对应拆分为 `nginx.dev.conf` / `nginx.prod.conf`
  - `Dockerfile.dev`：API Reference 由 Apifox 外链提供，不打包 Scalar 页和 `openapi.json`，镜像精简
  - `Dockerfile.prod`：内嵌 Scalar 静态页（`/reference/api/`）和 `openapi.json`，离线可用，无外部服务依赖
- **`feat(docs)`**：`nginx.prod.conf` 对齐 `nginx.dev.conf` 结构，新增：
  - gzip 压缩及 `gzip_vary` 响应头
  - 安全 headers（`X-Content-Type-Options`、`X-Frame-Options`、`Referrer-Policy`、`X-XSS-Protection`）
  - `location /reference/api`（静态 404 fallback，不回退至 SPA）
  - `location ~* ^/assets/`（1 年强缓存 + `Cache-Control: public, immutable`）
- **`feat(docs)`**：`scripts/generate-openapi.ts` 输出路径由 `website/public/reference/openapi.json` 改为 `website/api-reference/openapi.json`；`BACKEND_URL` 回落值改为读取 `PORT` 环境变量

#### VitePress 配置

- **`feat(docs)`**：API Reference 导航链接改由 `VITE_API_REFERENCE_URL` 环境变量控制（本地开发默认 `http://localhost:3000/reference`；prod 镜像构建时通过 `ARG` 注入 `/reference/api/`）
- **`feat(docs)`**：VitePress dev server 端口改由 `VITE_API_DOCS_PORT` 环境变量控制（默认 5173）
- **`feat(docs)`**：`package.json` 脚本 `docs:gen-openapi`、`docs:dev` 改用 `dotenvx run -f .env.development --` 注入环境变量，移除硬编码端口
- **`feat(docs)`**：侧边栏「规划」分组新增 PR 0.7.0–0.7.3 条目；移除已废弃的「Docusaurus 配置指南」条目

#### API 文档

- **`feat(src)`**：`src/main.ts` 移除 Swagger 描述中的静态链接段落，由文档站统一承载

#### CI/CD 流水线

- **`feat(ci)`**：Apifox OpenAPI 同步 Job（`sync-apifox`）从 `cd-prod.yaml` 迁移至 `cd-dev.yaml`，Dev 环境 CD 完成后同步，避免 prod 流程受第三方服务影响

### 🐛 缺陷修复

#### CI/CD 流水线

- **CD-prod OpenAPI 导出容器启动失败**（`fix(ci)`）— `cd-prod.yaml` 中"Start backend container for OpenAPI export"步骤先通过 `dotenvx decrypt --stdout > /tmp/.env.cd_export` 将解密后的环境变量写入临时文件，再以 `--env-file` 挂载到 Docker 容器。但 `.env.test` 中的 EC 私钥（`-----BEGIN EC PRIVATE KEY-----` 格式）包含换行符，而 Docker `--env-file` 要求每行为单一 `KEY=value` 格式，无法处理多行变量值，导致报错：
  ```
  docker: invalid env file (/tmp/.env.cd_export): variable '-----END EC PRIVATE KEY-----"' contains whitespaces
  ```

  **修复方案**：移除中间解密步骤，直接传入私钥让容器内 dotenvx 解密：
  - 删除 "Decrypt .env.test" 步骤及 `/tmp/.env.cd_export` 临时文件
  - 删除 `--env-file /tmp/.env.cd_export` 参数
  - 新增 `-e DOTENV_PRIVATE_KEY_TEST=` + GitHub Actions secret ref，容器内 dotenvx 自动解密 `.env.test`
  - `NODE_ENV=production` 改为 `NODE_ENV=test`（dotenvx 按 `NODE_ENV` 匹配解密文件；`production` 对应 `DOTENV_PRIVATE_KEY_PRODUCTION`，`test` 对应 `DOTENV_PRIVATE_KEY_TEST`）

- **`fix(ci)`**：`cd-dev.yaml` 文档镜像构建更新 Dockerfile 引用路径，由 `website/Dockerfile` 改为 `website/Dockerfile.dev`
- **`fix(ci)`**：修复 `cd-dev.yaml` artifact 上传/下载路径错误
  - upload `path: assets` → `path: openapi.json`（原来上传了不含文件的目录）
  - download `path: assets/openapi.json` → `path: assets`（`path` 为目标目录，不是文件路径）
  - `build-docs` 和 `sync-apifox` 两处同步修正；移除 `OPENAPI_JSON_PATH` 和 `--slurpfile` 中多余的 `./` 前缀
- **`fix(ci)`**：`cd-prod.yaml` `build-docs` job 补全缺失依赖和参数
  - `needs` 增加 `export-openapi`
  - 增加 `download-artifact` 步骤
  - `build-args` 传入 `OPENAPI_JSON_PATH=assets/openapi.json`

### 🔧 构建 / 工具链

- **`chore(env)`**：重新加密 `.env.development`、`.env.production`、`.env.test`，新增 `VITE_API_DOCS_PORT` 条目

## 文件变更

```
.env.development / .env.production / .env.test
    ← 重新加密，新增 VITE_API_DOCS_PORT
.github/workflows/
  cd-dev.yaml     ← 文档镜像构建 Dockerfile 路径改为 website/Dockerfile.dev
                  ← 迁入 sync-apifox job
                  ← 修复 artifact upload path: assets → openapi.json
                  ← 修复 artifact download path: assets/openapi.json → assets
  cd-prod.yaml    ← 移除 "Decrypt .env.test" 步骤
                  ← docker run 改为 -e DOTENV_PRIVATE_KEY_TEST
                  ← NODE_ENV=production → NODE_ENV=test
                  ← 移除 sync-apifox job
                  ← build-docs 增加 export-openapi 依赖 + download-artifact + OPENAPI_JSON_PATH
package.json      ← docs:gen-openapi / docs:dev 改用 dotenvx
scripts/
  generate-openapi.ts  ← 输出路径改为 website/api-reference/openapi.json
                       ← BACKEND_URL 改为读取 PORT 环境变量
src/
  main.ts         ← 移除 Swagger 描述中的静态链接段落
website/
  .vitepress/config.ts  ← 动态 VITE_API_REFERENCE_URL / VITE_API_DOCS_PORT、侧边栏更新
  Dockerfile            ← 重命名为 Dockerfile.dev
  Dockerfile.dev        ← 新增
  Dockerfile.prod       ← 内嵌 Scalar 静态页 + openapi.json
  nginx.conf            ← 重命名为 nginx.dev.conf
  nginx.dev.conf        ← 新增
  nginx.prod.conf       ← 新增 gzip / 安全 headers / /reference/api / assets 缓存规则
  package.json          ← 移除硬编码端口
  api-reference/        ← 新增目录（Scalar index.html + openapi.json 构建产物）
  public/reference/
    index.html          ← 删除
```

## 测试

- `pnpm lint` — 零错误
- `pnpm build` — 编译通过
- 无应用核心逻辑变更，无需执行 E2E / 单元测试套件

## 检查清单

- [x] `pnpm lint` — 零错误
- [x] `pnpm build` — 编译通过
- [x] 无核心逻辑变更，无需测试
- [x] CHANGELOG 已更新（`CHANGELOG.md`）
- [x] Roadmap 已更新（`docs/05-releases/roadmap.md`）
- [x] 无 API 接口变更，无需更新 Swagger 注解
