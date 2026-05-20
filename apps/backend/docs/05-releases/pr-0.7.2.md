---
title: "发布 PR：v0.7.2"
version: "0.7.2"
base: main
branch: release/0.7
date: 2026-04-07
---

# 发布 v0.7.2

## 概述

本 PR 将 `release/0.7` 分支合并至 `main`，发布 v0.7.2 补丁版本。本版本为针对 CD 工作流的快速修复，补缺 Postgres 服务端口映射，确保 E2E 测试环节的数据库连接可用性。

## 变更内容

### 🐛 缺陷修复

#### CI/CD 工作流

- **CD 工作流 Postgres 端口映射缺失**（`fix(ci)`）— `cd-dev.yaml` 和 `cd-prod.yaml` 中 Postgres 服务容器配置未暴露 `5432` 端口，导致 E2E 测试阶段无法连接数据库
  - 增加 `ports: [5432:5432]` 配置块
  - 无其他功能性变更

## 文件变更

```
.github/workflows/
  cd-dev.yaml    ← 增加 ports: [5432:5432]
  cd-prod.yaml   ← 增加 ports: [5432:5432]
```

## 测试

- `pnpm lint` — 零错误
- `pnpm build` — 编译通过
- `pnpm test` — 无新增变更

## 检查清单

- [x] `pnpm lint` — 零错误
- [x] `pnpm build` — 编译通过
- [x] 无应用代码变更，无需测试
- [x] CHANGELOG 已更新（`CHANGELOG.md`）
- [x] 无功能性变更，无需更新 API 文档
