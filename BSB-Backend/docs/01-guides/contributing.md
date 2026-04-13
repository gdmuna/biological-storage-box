---
title: 贡献指南
status: active
version: "0.7.1"
last-updated: 2026-04-06
category: guide
---

# 贡献指南

欢迎参与贡献！在开始之前，确认你已完成本地开发环境搭建，`pnpm install` 通过，数据库连接正常。

## 分支策略

本项目遵循分支保护模型，不允许直接向 `main` 或 `dev` 提交：

| 分支类型 | 命名格式 | 说明 |
|---------|---------|------|
| 主干 | `main` | 生产就绪，只接受来自 `release/*` 的 PR |
| 开发 | `dev` | 日常集成，接受来自 `feature/**` 的 PR |
| 特性 | `feature/<描述>` | 新功能开发，从 `dev` 创建，PR 目标为 `dev` |
| 发布 | `release/<major>.<minor>` | 预发布，如 `release/0.7`，从 `dev` 创建，PR 目标为 `main` |

**每种分支对应的 CI 工作流**：

| 分支/操作 | 触发工作流 |
|----------|-----------|
| `feature/**` push | `ci-feature.yaml`（lint + test）|
| `dev` push | `ci-dev.yaml` + `cd-dev.yaml`（部署开发环境）|
| PR → `dev` | `pr-check-dev.yaml` |
| PR → `main` | `pr-check-prod.yaml`（含版本号验证）|
| `release/**` push | `ci-release.yaml`（含版本号校验）|
| PR 合并至 `main` | `auto-tag-release.yaml` → `cd-prod.yaml`（自动打 tag + 构建镜像）|

## 提交规范

本项目遵循 [Conventional Commits](https://www.conventionalcommits.org/zh-hans/v1.0.0/) 规范。

### 格式

```
<type>(<scope>): <subject>

[可选正文]

[可选 footer]
```

### 提交类型

| type | 用途 |
|------|------|
| `feat` | 新功能 |
| `fix` | Bug 修复 |
| `docs` | 仅文档变更 |
| `style` | 格式调整（不影响逻辑）|
| `refactor` | 代码重构（无新功能/修复）|
| `perf` | 性能优化 |
| `test` | 添加或修改测试 |
| `build` | 构建系统或依赖变更 |
| `ci` | CI 配置变更 |
| `chore` | 杂项维护 |
| `revert` | 回滚提交 |

**Scope** 与涉及的模块或目录对应，如 `auth`、`logging`、`docker`、`deps`、`config`。

### 破坏性变更

在 type/scope 后加 `!`，并在 footer 中说明：

```
feat!: 标准化 API 响应格式

BREAKING CHANGE: 所有响应体现在包裹于 data 字段中
```

### 典型示例

```
feat(auth): add refresh token rotation
fix(docker): add --ignore-scripts to pnpm prune
docs(contributing): add branch strategy section
ci: update concurrency groups in workflows
```

## 发布流程

发布由 release 分支负责人执行：

1. 从 `dev` 创建 `release/<major>.<minor>` 分支
2. 更新 `package.json` 中的版本号至目标版本（如 `0.7.0`）
3. 推送分支，`ci-release.yaml` 自动运行 lint + test
4. 测试通过后，向 `main` 发起 PR（`pr-check-prod.yaml` 会验证版本号格式）
5. PR 合并后，`auto-tag-release.yaml` 自动创建 tag，`cd-prod.yaml` 自动构建并发布 Docker 镜像
