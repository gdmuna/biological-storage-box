---
title: AI 文档操作手册
inherits: AGENTS.md
status: active
version: "0.7.4"
last-updated: 2026-04-09
category: meta
related:
  - docs/STANDARD.md
  - docs/README.md
  - docs/03-architecture/STANDARD.md
  - docs/03-architecture/project-architecture-overview.md
  - docs/03-architecture/request-pipeline.md
  - docs/03-architecture/auth-module.md
  - docs/03-architecture/database.md
  - docs/03-architecture/observability.md
  - docs/03-architecture/cicd-deployment.md
---

# AI 文档操作手册

本文档继承 [根 AGENTS.md](../AGENTS.md) 的核心原则与通用工作流程，定义 `docs/` 目录下**文档操作的专项触发条件与工作流程**。

---

## 1. 文档变更工作流

### 1.1 创建或修改文档时

1. 阅读 [docs/STANDARD.md](STANDARD.md) 确认写作规范与 frontmatter 要求
2. 检查目标文档所在目录的 `STANDARD.md`（如 [03-architecture/STANDARD.md](03-architecture/STANDARD.md)），获取领域专项约束
3. 编写/修改内容
4. 确保 frontmatter 完整：`inherits`、`related`、`status`、`version`、`last-updated` 字段均已正确填写
5. 同步更新 [docs/README.md](README.md) 索引（如新增/删除文档）
6. 文档末尾维护 `## 引用` 区域，列出所有外部链接

### 1.2 删除或归档文档时

1. 将 `status` 改为 `archived`（归档）或删除文件
2. 更新 [docs/README.md](README.md) 索引
3. 全局搜索该文档路径，修复或移除所有指向它的链接
4. 当目录内所有文档被移除后，删除空目录

---

## 2. 漂移防护触发矩阵

任何 PR 合并前，对照下表检查是否遗漏文档更新：

| 代码变更类型 | 必须同步更新 |
|------------|------------|
| 新增/删除模块、修改模块职责 | [project-architecture-overview.md](03-architecture/project-architecture-overview.md) |
| 修改全局中间件/守卫/拦截器的顺序或行为 | [request-pipeline.md](03-architecture/request-pipeline.md) |
| 修改 DTO 接口契约、响应格式 | Swagger 注解（内联于代码） |
| 修改可观测性常量（慢请求/慢查询阈值等） | [observability.md](03-architecture/observability.md) |
| 修改 JWT / Cookie / bcrypt 配置 | [auth-module.md](03-architecture/auth-module.md) |
| 修改连接池参数、Prisma schema | [database.md](03-architecture/database.md) |
| 新增/删除 CI/CD workflow 或 Docker 构建步骤 | [cicd-deployment.md](03-architecture/cicd-deployment.md) |
| 变更 `package.json` scripts | `.github/copilot-instructions.md` 命令速查 |
| 新增/删除文档文件 | [docs/README.md](README.md) 索引 |

---

## 3. 版本节点全量同步

触发条件：`package.json` 中 `version` 字段升级时。

操作清单：

1. 将所有 `status: active` 文档的 `version` 字段更新至新版本号
2. 将不再适用的文档从 `active` 改为 `archived`
3. 检查 `.github/copilot-instructions.md` 命令速查是否与当前 `package.json scripts` 保持一致
