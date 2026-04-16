---
title: Docker 与部署
status: active
version: "0.7.4"
last-updated: 2026-04-09
category: guide
---

# Docker 与部署

本文档介绍如何在本地使用 Docker 进行开发、构建生产镜像，以及 CI/CD 自动部署流程。

## 本地 Docker 开发环境

项目根目录的 `docker-compose.yml` 提供开箱即用的本地容器编排：

```bash
# 启动所有服务（应用 + PostgreSQL）
docker compose up -d

# 查看日志
docker compose logs -f app

# 停止
docker compose down
```

::: tip
首次启动会自动构建应用镜像。应用容器会等待数据库健康检查通过后再启动。
:::

## 应用镜像（后端）

`Dockerfile` 位于项目根目录，采用**多阶段构建**降低生产镜像体积：

```
阶段 1（builder）：node:22-slim
  ├── pnpm install（包含 devDependencies）
  ├── pnpm build（tsc 编译 + tsc-alias 路径替换）
  └── pnpm prune --prod（移除 devDependencies）

阶段 2（runner）：node:22-slim
  └── 仅复制编译产物 + 生产依赖，最小化镜像
```

```bash
# 手动构建后端镜像
docker build -t nestjs-scaffold:latest .

# 本地运行（注意需要传入环境变量）
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e DOTENV_PRIVATE_KEY_PRODUCTION="your-private-key" \
  nestjs-scaffold:latest
```

## 文档站镜像

文档站分为两个独立 Dockerfile（位于 `website/`）：

### Development 镜像

`website/Dockerfile.dev` — 轻量镜像，API Reference 由外部 Apifox URL 提供：

```bash
docker build \
  --build-arg VITE_API_REFERENCE_URL=https://your-apifox-url \
  --build-arg VITE_BASE_PATH=/dev/ \
  -f website/Dockerfile.dev \
  -t nestjs-demo-docs:dev .
```

### Production 镜像

`website/Dockerfile.prod` — 内嵌 Scalar API Reference，离线可用：

```bash
# 先生成 openapi.json
pnpm docs:gen-openapi

docker build \
  --build-arg VITE_BASE_PATH=/prod/ \
  -f website/Dockerfile.prod \
  -t nestjs-demo-docs:prod .
```

**nginx 路由规则：**

| URL 路径 | 内容 | 配置文件 |
|---------|------|---------|
| `/dev/*` | VitePress 文档站（SPA fallback）| `nginx.dev.conf` |
| `/prod/*` | VitePress 文档站（SPA fallback）| `nginx.prod.conf` |
| `/prod/reference/api/` | Scalar API Reference 静态页 | `nginx.prod.conf` |

### 本地测试文档站镜像

```bash
# 构建并运行（容器内 nginx 监听 8080）
docker run -p 8080:8080 nestjs-demo-docs:dev

# 访问
open http://localhost:8080/dev/
```

## CI/CD 流水线

本项目有 10 个 GitHub Actions 工作流（位于 `.github/workflows/`）：

| 工作流 | 触发条件 | 职责 |
|--------|---------|------|
| `ci-feature.yaml` | `feature/**` push | lint + build |
| `ci-dev.yaml` | `dev` push | lint + build + test |
| `cd-dev.yaml` | `dev` push（依赖 ci-dev）| 部署至开发环境 + 同步 Apifox |
| `pr-check-dev.yaml` | PR → `dev` | lint + build + test |
| `ci-release.yaml` | `release/**` push | lint + build + test + 版本号校验 |
| `pr-check-prod.yaml` | PR → `main` | lint + build + test + 版本号校验 |
| `ci-prod.yaml` | `main` push | lint + build + test |
| `auto-tag-release.yaml` | PR 合并至 `main` | 自动创建版本 Tag |
| `cd-prod.yaml` | `auto-tag-release` 完成 | 构建并发布 Docker 镜像 |
| `ci-reusable.yaml` | 被其他工作流调用 | 可复用的 CI 核心步骤 |

### 版本发布流程

1. 从 `dev` 创建 `release/<major>.<minor>` 分支
2. 更新 `package.json` 中的版本号至目标版本
3. 推送分支 → `ci-release.yaml` 自动运行验证
4. 通过后向 `main` 发起 PR → `pr-check-prod.yaml` 验证版本格式
5. PR 合并 → `auto-tag-release.yaml` 打 Tag → `cd-prod.yaml` 构建部署

详细流程见[贡献指南](./contributing)。

## 环境变量注入（生产）

生产镜像通过 `DOTENV_PRIVATE_KEY_PRODUCTION` 环境变量注入解密私钥：

```yaml
# docker-compose 示例
environment:
  NODE_ENV: production
  DOTENV_PRIVATE_KEY_PRODUCTION: "${DOTENV_PRIVATE_KEY_PRODUCTION}"  # 来自宿主机环境或 secret
```

私钥从不写入镜像，仅在容器运行时注入。

## 接下来做什么？

- [架构设计——CI/CD 常规流水线](../03-architecture/cicd-deployment) — 详细了解各工作流的触发条件和职责
- [贡献指南](./contributing) — 分支策略与发布流程
- [架构全览](../03-architecture/project-architecture-overview) — 了解项目整体架构
