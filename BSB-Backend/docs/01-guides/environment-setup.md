---
title: 环境搭建
status: active
version: "0.7.4"
last-updated: 2026-04-09
category: guide
---

# 环境搭建

这篇指南带你从零开始把本地环境搭好，预计耗时 15 分钟。

## Node.js

本项目要求 Node.js **≥ 22.0.0**（使用了 `import.meta`、`structuredClone` 等较新 API）。

**推荐使用 nvm 管理多版本：**

```bash
# 安装 nvm（macOS/Linux）
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Windows 使用 nvm-windows
# https://github.com/coreybutler/nvm-windows

# 安装并使用 Node.js 22
nvm install 22
nvm use 22

# 验证
node --version   # v22.x.x
```

## pnpm

本项目**只使用 pnpm**，禁止使用 npm 或 yarn（会破坏 workspace 依赖解析）。

```bash
# 通过 npm 全局安装
npm install -g pnpm

# 或通过 Corepack（Node.js 内置）
corepack enable
corepack prepare pnpm@latest --activate

# 验证
pnpm --version   # 8.x 或更高
```

## PostgreSQL

::: tip 推荐用 Docker
直接运行 Docker 容器，无需安装原生 PostgreSQL，也不会污染系统环境。
:::

### 方式 A：Docker（推荐）

```bash
# 启动 PostgreSQL 18 容器
docker run -d \
  --name pg-nestjs-demo \
  -p 5432:5432 \
  -e POSTGRES_USER=dev \
  -e POSTGRES_PASSWORD=dev \
  -e POSTGRES_DB=nestjs_demo \
  postgres:18

# 验证连接
docker exec -it pg-nestjs-demo psql -U dev -d nestjs_demo -c "SELECT version();"
```

### 方式 B：本机安装

按照 [PostgreSQL 官方文档](https://www.postgresql.org/download/) 安装 PostgreSQL ≥ 18。

安装后创建数据库：

```bash
psql -U postgres
CREATE USER dev WITH PASSWORD 'dev';
CREATE DATABASE nestjs_demo OWNER dev;
\q
```

### 测试环境数据库

E2E 测试需要单独的测试数据库（`.env.test` 中的 `DATABASE_URL`）：

```bash
# Docker 方式
docker run -d \
  --name pg-nestjs-test \
  -p 5433:5432 \
  -e POSTGRES_USER=ci_test \
  -e POSTGRES_PASSWORD=ci_test \
  -e POSTGRES_DB=nestjs_demo_basic_test \
  postgres:18
```

## 环境变量配置

### 理解 dotenvx 加密机制

本项目使用 [dotenvx](https://dotenvx.com/) 对 `.env.*` 文件加密后存入仓库，私钥存储在 `.env.keys`（不提交）。

::: info 为什么加密存储？
`.env.*` 直接提交仓库意味着密钥外泄风险。dotenvx 把密文存仓库、私钥只放本地 `.env.keys` 和 CI Secret，兼顾了可追溯性和安全性。
:::

启动时 dotenvx 自动解密：
```
.env.keys  →  dotenvx  →  .env.development  →  应用获得明文变量
```

### 团队成员：获取私钥

向团队负责人获取 `.env.keys` 文件，放置到项目根目录后直接使用。

### 独立初始化新环境变量

```bash
# 安装 dotenvx CLI
npm install -g @dotenvx/dotenvx

# 设置必填变量（首次运行自动生成密钥对写入 .env.keys）
npx @dotenvx/dotenvx set PORT 3000 -f .env.development
npx @dotenvx/dotenvx set DATABASE_URL "postgresql://dev:dev@127.0.0.1:5432/nestjs_demo?schema=public" -f .env.development

# JWT 密钥见下一节，生成后写入：
# npx @dotenvx/dotenvx set JWT_ACCESS_PRIVATE_KEY "$(cat jwt_private.pem)" -f .env.development
# npx @dotenvx/dotenvx set JWT_ACCESS_PUBLIC_KEY "$(cat jwt_public.pem)" -f .env.development
```

### 完整变量清单

#### 应用级

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `PORT` | `3000` | HTTP 监听端口 |
| `NODE_ENV` | `development` | 运行环境：`development` / `production` / `test` |

#### 数据库

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `DATABASE_URL` | — | PostgreSQL 连接 URL（必填） |

#### JWT — Access Token

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `JWT_ACCESS_PRIVATE_KEY` | `config/keys/jwt-private.pem` | ES256 私钥（PKCS#8 PEM） |
| `JWT_ACCESS_PUBLIC_KEY` | `config/keys/jwt-public.pem` | ES256 公钥（SPKI PEM） |
| `JWT_ACCESS_ALGORITHM` | `ES256` | 签名算法 |
| `JWT_ACCESS_EXPIRES_IN` | `15m` | Access Token 有效期 |

#### JWT — Refresh Token & Cookie

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `JWT_REFRESH_PRIVATE_KEY` | 同 ACCESS 私钥 | Refresh Token 签名私钥 |
| `JWT_REFRESH_PUBLIC_KEY` | 同 ACCESS 公钥 | Refresh Token 验签公钥 |
| `JWT_REFRESH_ALGORITHM` | `ES256` | 签名算法 |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | Refresh Token 有效期 |
| `JWT_REFRESH_COOKIE_SAME_SITE` | `lax` | Cookie SameSite 策略 |
| `JWT_REFRESH_COOKIE_SECURE` | `false` | Cookie Secure 属性（生产建议 `true`） |
| `JWT_REFRESH_COOKIE_PATH` | `/auth` | Cookie 作用路径 |
| `JWT_REFRESH_COOKIE_MAX_AGE_MS` | `604800000`（7天） | Cookie 有效期（毫秒） |

#### CORS 与限流

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `CORS_ALLOWED_ORIGIN` | `[]`（不限制） | 允许的 CORS 来源，逗号分隔 |
| `CORS_ALLOWED_METHODS` | 常用 HTTP 方法 | 允许的 HTTP 方法，逗号分隔 |
| `CORS_ALLOWED_HEADERS` | `Content-Type,Authorization` | 允许的请求头，逗号分隔 |
| `CORS_PREFLIGHT_MAX_AGE_SECONDS` | `86400` | 预检缓存时间（秒） |
| `THROTTLE_TTL_MS` | `300000`（5分钟） | 限流时间窗口（毫秒） |
| `THROTTLE_LIMIT` | `1000` | 时间窗口内最大请求数 |
| `REQUEST_TIMEOUT_MS` | `30000` | 请求超时时间（毫秒） |
| `REQUEST_ID_HEADER` | `x-request-id` | 请求 ID HTTP 头名称 |

#### 其他

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `BCRYPT_SALT_ROUND` | `10` | bcrypt 加密轮数（8~14） |

::: tip 大多数变量有合理默认值
只有 `DATABASE_URL` 和 JWT 密钥对是必须手动设置的。其他变量不配置时自动使用默认值，生产环境按需微调。
:::

### 生成 ES256 密钥对

```bash
# 生成私钥
openssl genpkey -algorithm EC -pkeyopt ec_paramgen_curve:P-256 -out jwt_private.pem

# 提取公钥
openssl pkey -in jwt_private.pem -pubout -out jwt_public.pem

# 写入 Access Token 密钥（Access 和 Refresh 默认共用同一密钥对）
npx @dotenvx/dotenvx set JWT_ACCESS_PRIVATE_KEY "$(cat jwt_private.pem)" -f .env.development
npx @dotenvx/dotenvx set JWT_ACCESS_PUBLIC_KEY "$(cat jwt_public.pem)" -f .env.development
# 如需 Refresh Token 使用独立密钥对，额外设置：
# npx @dotenvx/dotenvx set JWT_REFRESH_PRIVATE_KEY "$(cat jwt_refresh_private.pem)" -f .env.development
# npx @dotenvx/dotenvx set JWT_REFRESH_PUBLIC_KEY "$(cat jwt_refresh_public.pem)" -f .env.development

# 删除本地密钥文件（已写入加密 .env）
rm jwt_private.pem jwt_public.pem
```

## IDE 推荐设置

### VS Code 扩展

| 扩展 | 说明 |
|------|------|
| ESLint | 实时 lint 反馈 |
| Prettier | 自动格式化 |
| Prisma | schema 语法高亮与补全 |
| REST Client | `.http` 文件直接发请求测试 |
| DotENV | `.env` 文件高亮 |

### TypeScript 配置

项目使用 `"module": "nodenext"` 和路径别名：
- `@/` → `src/`
- `@root/` → 项目根目录

VS Code 会自动识别 `tsconfig.json`，无需额外配置。

## 验证安装

```bash
# 安装依赖
pnpm install

# 生成 Prisma Client
pnpm db:gen-client

# 运行迁移
pnpm db:migrate

# 启动开发服务器
pnpm start:dev

# 健康检查（另开终端）
curl http://localhost:3000/health
```

如果看到应用启动 Banner 和 `{ status: "ok" }` 响应，环境搭建完成。

## 接下来做什么？

- [快速上手](../00-getting-started/quick-start) — 运行起来后，看看项目整体结构
- [开发工作流](./development-workflow) — 了解日常分支策略与提交规范
- [测试指南](./testing) — 学习如何编写单元测试和 E2E 测试
