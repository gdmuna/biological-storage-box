---
title: 快速开始
status: active
version: "0.7.4"
last-updated: 2026-04-09
category: guide
---

# 快速开始

这篇指南帮你在 5 分钟内把项目跑起来。如果你需要更完整的环境配置说明，可以看[环境搭建](../01-guides/environment-setup)。

## 前提条件

确保你的机器上已经装好以下工具：

| 工具 | 最低版本 | 怎么装 |
|------|---------|--------|
| Node.js | ≥ 22.0.0 | [nodejs.org](https://nodejs.org/) 或 [nvm](https://github.com/nvm-sh/nvm) |
| pnpm | ≥ 8.0.0 | `npm install -g pnpm` |
| PostgreSQL | ≥ 18 | 官网，或用 Docker（推荐） |
| Git | — | [git-scm.com](https://git-scm.com/) |

::: tip 推荐用 Docker 运行 PostgreSQL
这样不会污染本地环境，用完直接停掉就行：
```bash
docker run -d --name pg-dev -p 5432:5432 \
  -e POSTGRES_USER=dev -e POSTGRES_PASSWORD=dev -e POSTGRES_DB=nestjs_demo \
  postgres:18
```
:::

## 1. 获取代码

### 方式 A：使用 GitHub 模板（推荐）

本仓库已设置为 GitHub 模板仓库。点击页面右上角的 **"Use this template"** 按钮，在你自己的账号下创建一个全新的仓库——不包含任何历史提交记录，开箱即是一个干净的起点。

### 方式 B：git clone

```bash
git clone https://github.com/gdmuna/NestJS-Scaffold.git my-project
cd my-project
```

::: warning 基于此模板开发新项目时
如果你用的是 `git clone`，需要完整重置 git 历史，然后绑定到自己的远程仓库：

```bash
# 删除原始 git 历史
rm -rf .git

# 重新初始化
git init
git add .
git commit -m "chore: init from nestjs-scaffold template"

# 绑定你自己的远程仓库并推送
git remote add origin https://github.com/your-org/your-project.git
git branch -M main
git push -u origin main
```

不做这一步，你的项目历史里会混入模板仓库的所有提交记录。
:::

```bash
# 安装依赖
pnpm install
```

## 2. 配置环境变量

本项目用 [dotenvx](https://dotenvx.com/) 管理环境变量，.env.* 文件是**加密后**存在仓库里的。

**团队成员（已有密钥）**：把团队共享的 .env.keys 放到项目根目录就好。

**独立使用（从零开始）**：

```bash
# 删掉旧的加密文件
rm .env.development .env.production .env.test .env.keys

# 初始化开发环境（会自动生成密钥对）
npx @dotenvx/dotenvx set PORT 3000 -f .env.development
npx @dotenvx/dotenvx set DATABASE_URL "postgresql://dev:dev@localhost:5432/nestjs_demo?schema=public" -f .env.development
# JWT 密钥见下一步
```

### 生成 JWT ES256 密钥对

```bash
openssl genpkey -algorithm EC -pkeyopt ec_paramgen_curve:P-256 -out private.pem
openssl pkey -in private.pem -pubout -out public.pem

# 写入密钥（Access 和 Refresh 默认共用同一密钥对）
npx @dotenvx/dotenvx set JWT_ACCESS_PRIVATE_KEY "$(cat private.pem)" -f .env.development
npx @dotenvx/dotenvx set JWT_ACCESS_PUBLIC_KEY "$(cat public.pem)" -f .env.development

rm private.pem public.pem
```

::: tip config/keys/ 目录有开发用示例密钥
`config/keys/` 存有开发专用密钥对，未设置环境变量时自动读取。**生产环境必须替换成自己生成的密钥。**
:::

## 3. 初始化数据库

```bash
# 生成 Prisma Client
pnpm db:gen-client

# 运行数据库迁移
pnpm db:migrate

# 填充种子数据（可选）
pnpm db:seed
```

## 4. 启动！

```bash
pnpm start:dev
```

看到 Pino 格式化日志滚动输出，就说明启动成功了。打开浏览器验证一下：

- **健康检查**：[http://localhost:3000/health](http://localhost:3000/health)
- **Scalar API 文档**：[http://localhost:3000/reference](http://localhost:3000/reference)
- **Swagger UI**：[http://localhost:3000/api-doc](http://localhost:3000/api-doc)

## 常用命令

```bash
# 开发
pnpm start:dev          # 热重载开发服务器
pnpm build              # 编译（tsc + tsc-alias）

# 质量检查
pnpm lint               # ESLint 检查
pnpm lint:fix           # ESLint 自动修复
pnpm format             # Prettier 格式化
pnpm test               # 单元测试 + E2E 测试

# 数据库
pnpm db:migrate         # 数据库迁移
pnpm db:gen-client      # 重新生成 Prisma Client
pnpm db:studio          # Prisma Studio 可视化界面

# 文档站
pnpm docs:dev           # 启动文档开发服务器
pnpm docs:build         # 构建文档站静态文件
```

## 接下来做什么？

项目跑起来了！根据你的目标选择下一步：

- 🔨 **想开始开发**：[开发工作流](../01-guides/development-workflow)
- 🔧 **需要搭建完整环境**：[环境搭建](../01-guides/environment-setup)
- 🧪 **想跑测试**：[测试指南](../01-guides/testing)
- 🏗️ **想了解架构**：[项目架构全览](../03-architecture/project-architecture-overview)
- 🤔 **想理解设计思路**：[核心理念](./philosophy)
