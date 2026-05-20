---
title: 发布文档规范
inherits: docs/STANDARD.md
status: active
version: "0.7.3"
last-updated: 2026-04-09
category: standard
---

# 发布文档规范

本文档继承 [docs/STANDARD.md](../STANDARD.md)，定义 `docs/05-releases/` 目录的专项约束。

`docs/05-releases/` 目录存放每个正式版本的 **PR Description 文档**，每份文档对应一次合并至 `main` 的发布 PR。

## frontmatter 字段规范

每份发布文档必须包含以下 frontmatter：

```yaml
---
title: "发布 PR：v<version>"
version: "<semver>"        # 如 "0.7.3"
base: main                 # 目标分支（固定为 main）
branch: release/<major>.<minor>   # 来源分支
date: <YYYY-MM-DD>         # 实际合并日期
---
```

## 文档结构规范

每份发布文档以**一级标题**开头，后跟标准章节，**章节之间不使用 `---` 分隔符**（VitePress 会自动添加）：

```markdown
# 发布 v<version>

## 概述

[1-3 句话的版本摘要，描述本次发布的核心目标与改动类型]

## 变更内容

### ✨ 新功能 / 改进

[按 scope 分组，每条变更格式：
- **说明**（`type(scope)`）— 详细描述，包含技术要点]

### 🐛 缺陷修复

[同上]

### 📚 文档变更

[同上]

### 🔧 杂项 / 工程化

[同上]

## 文件变更统计

[
  变更的文件路径列表，每行格式：
  路径/文件名    ← 说明（一行一个文件或目录）
]

## 测试验证

[列出本次发布前执行的验证项]

## 检查清单

- [ ] `pnpm lint` — 零错误
- [ ] `pnpm build` — 编译通过
- [ ] `pnpm test` — 通过（或说明为何跳过）
- [ ] CHANGELOG 已更新
- [ ] 无功能性变更相关的文档同步状态
```

## 变更条目书写规范

每条变更遵循以下格式：

```
- **[简短描述]**（`type(scope)`）— [详细说明，必要时包含原因、行为变更对比]
  - [子要点：具体的技术细节]
  - [子要点：如有更多细节]
```

示例：

```
- **PostgreSQL 健康检查参数完善**（`fix(ci)`）— `pg_isready` 未指定用户和数据库
  参数，导致容器初始化期间健康检查即已通过，后续 Job 连接失败
  - `--health-cmd` 改为 `pg_isready -U ci_test -d nestjs_demo_basic_test`
  - 新增 `--health-start-period 30s`
```

## 分组与 emoji 对照

| 分组标题 | 适用场景 |
|---------|---------|
| `✨ 新功能 / 改进` | `feat` 类型的变更 |
| `🐛 缺陷修复` | `fix` 类型的变更 |
| `📚 文档变更` | `docs` 类型的变更（大量文档更新）|
| `🔧 杂项 / 工程化` | `chore`、`ci`、`build`、`refactor` |
| `⚠️ 破坏性变更` | 含有 `BREAKING CHANGE` 的提交（必须单独列出）|

## 引用

- [Docs 设计规范与约束](../STANDARD.md)
