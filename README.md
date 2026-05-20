<div align="center">

<h1>Biological Storage Box</h1>

<p align="center">
  生物样本储存管理系统——树形节点、试剂位置追踪、多组织协作，全栈 Monorepo
</p>

<p align="center">
  <img src="https://img.shields.io/badge/NestJS-11.x-E0234E?logo=nestjs&logoColor=white" alt="NestJS" />
  <img src="https://img.shields.io/badge/Vue-3.x-4FC08D?logo=vuedotjs&logoColor=white" alt="Vue 3" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Prisma-7.x-2D3748?logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/pnpm-workspace-F69220?logo=pnpm&logoColor=white" alt="pnpm workspace" />
  <img src="https://img.shields.io/badge/License-AGPL--3.0-blue?logo=gnu&logoColor=white" alt="License" />
</p>

</div>

**Biological Storage Box（BSB）** 是一套面向实验室场景的生物样本储存管理系统，用于管理冰箱、储存柜、样本盒等层级结构，追踪试剂在具体位置槽的存入/取出记录，并支持多组织协作与权限隔离。

项目以 **pnpm monorepo** 组织，包含后端服务、前端 SPA 和文档站三个工作区。

> **⚠️ 当前处于积极开发阶段（0.x）**
>
> 所有接口契约、数据模型和目录结构在版本间可能发生较大变动，不保证向后兼容。

## 仓库结构

```
biological-storage-box/
├── apps/
│   ├── backend/     # NestJS 后端服务（API + 数据库）
│   ├── frontend/    # Vue 3 前端 SPA
│   └── docsite/     # VitePress 文档站
└── docs/            # Monorepo 级规划文档
```

## 工作区概览

| 工作区 | 技术栈 | 职责 |
|--------|--------|------|
| **apps/backend** | NestJS · Prisma · PostgreSQL · Zod | REST API、认证、业务逻辑、数据持久化 |
| **apps/frontend** | Vue 3 · Pinia · Alova · shadcn-vue · Tailwind | 用户界面、路由、状态管理 |
| **apps/docsite** | VitePress · Nginx | 项目文档站、OpenAPI 参考文档 |

## 核心功能

- **树形节点管理**：ROOT → CONTAINER → BOX → BOX_SLOT 四级层次，支持任意深度嵌套
- **网格位置系统**：为 BOX 节点配置行列网格，每个槽位（BOX_SLOT）精确追踪试剂位置
- **试剂全生命周期**：存入、取出、移动、更新记录，附带操作日志与责任人归属
- **试剂类型管理**：可配置试剂类别（颜色、单位、描述），关联至具体试剂
- **多组织协作**：组织级数据隔离，支持成员角色（OWNER / ADMIN / MEMBER）与资源共享
- **邮箱验证**：注册与安全操作的邮箱验证码流程

## 快速开始

### 前置要求

- Node.js ≥ 22
- pnpm ≥ 8
- PostgreSQL

### 安装依赖

```bash
pnpm install
```

### 启动开发环境

```bash
# 后端（热重载，:3000）
pnpm --filter @talos-ark/backend start:dev

# 前端（:8081）
pnpm --filter @talos-ark/frontend dev
```

### 常用命令

```bash
# 格式化（全工作区）
pnpm run format

# 数据库迁移
pnpm --filter @talos-ark/backend db:migrate

# 重新生成 Prisma Client
pnpm --filter @talos-ark/backend db:gen-client

# 前端类型检查
pnpm --filter @talos-ark/frontend type-check

# 单元测试
pnpm --filter @talos-ark/backend test
pnpm --filter @talos-ark/frontend test

# E2E 测试
pnpm --filter @talos-ark/frontend test:e2e
```

## 文档

- [后端文档](apps/backend/docs/) — 架构设计、API 规范、开发指南
- [后端 AGENTS.md](apps/backend/AGENTS.md) — AI 协作操作手册
- [前端 AGENTS.md](apps/frontend/AGENTS.md) — 前端 AI 协作操作手册

## License

本项目基于 [GNU Affero General Public License v3.0](LICENSE) 开源。
