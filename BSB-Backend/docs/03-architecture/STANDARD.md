---
title: 架构设计规范与约束
inherits: docs/STANDARD.md
status: active
version: "0.7.4"
last-updated: 2026-04-09
category: standard
related:
  - docs/STANDARD.md
  - docs/AGENTS.md
  - docs/03-architecture/project-architecture-overview.md
  - docs/03-architecture/request-pipeline.md
  - docs/03-architecture/auth-module.md
  - docs/03-architecture/database.md
  - docs/03-architecture/observability.md
  - docs/03-architecture/cicd-deployment.md
---

# 架构设计规范与约束

本文档继承 [docs/STANDARD.md](../STANDARD.md)，定义 `docs/03-architecture/` 目录的设计基准：

- **架构约束**：分层规则、模块依赖方向、禁止事项
- **文档规范**：子文档职责边界、图示要求、维护责任

---

## 1. 架构分层规则

### 强制分层

```
Controller → Service → Repository（通过 DatabaseService）
```

| 层次 | 职责 | 禁止 |
|------|------|------|
| Controller | 请求解析、权限声明（`@Public`）、序列化 | 不得包含业务判断逻辑 |
| Service | 业务逻辑、事务协调、异常抛出 | 不得直接操作 HTTP 对象 |
| Repository（via `DatabaseService`）| 数据库 CRUD | 不得包含业务规则 |
| Infrastructure（`infra/`）| 基础设施（DB 连接、存储）| 不得引用 `modules/` |

### 模块依赖方向

允许的依赖方向（单向，不循环）：

```
modules/auth  ──→  infra/database
modules/auth  ──→  common/utils
modules/auth  ──→  common/services
modules/auth  ──→  constants/
infra/        ──→  common/utils
infra/        ──→  constants/
common/       ──→  constants/
```

禁止：
- `infra/` 引用 `modules/` 中任何内容
- 横向模块依赖（如 `auth` 直接引用 `error-catalog`），通过 `common/` 抽象
- 循环依赖

### 全局注册顺序

以下组件通过 `APP_*` token 全局注册，**顺序有意义，不得随意调整**：

| 类型 | 令牌 | 注册顺序 |
|------|------|---------|
| `ThrottlerGuard` | `APP_GUARD` | 守卫阶段最先执行 |
| `PerformanceInterceptor` | `APP_INTERCEPTOR` | 拦截器最外层 |
| `ResponseFormatInterceptor` | `APP_INTERCEPTOR` | 拦截器第 2 层 |
| `TimeoutInterceptor` | `APP_INTERCEPTOR` | 拦截器第 3 层 |
| `ZodSerializerInterceptor` | `APP_INTERCEPTOR` | 拦截器最内层 |
| `ZodValidationPipe` | `APP_PIPE` | 管道阶段 |
| `AllExceptionsFilter` | `APP_FILTER` | 异常兜底处理 |

修改上述顺序时，须同步更新 [request-pipeline.md](request-pipeline.md)。

---

## 2. 架构约束

### 禁止事项

- 禁止 Controller 直接调用 `DatabaseService`（跨层）
- 禁止多处硬编码相同阈值或配置值，使用 `src/constants/` 集中定义
- 禁止 Service 中构造 HTTP 响应对象（保持 HTTP 层无关性）
- 禁止直接 `throw new Error()`，必须通过 `@RegisterException` 注册的叶节点异常类抛出
- 禁止 `infra/` 引入 `modules/` 的任何类

### 依赖注入规则

优先使用 NestJS IoC 容器构造函数注入。手动 `new` 仅允许：
- DTO / VO 等值对象的创建
- 第三方库要求直接实例化的情况

### 常量管理

阈值、配置值在 `src/constants/` 中定义后引用。文档中引用**符号名称**，不硬编码数值（防漂移）。

---

## 3. 主从节点文档模型

`docs/03-architecture/` 采用主从节点组织模式：

```
project-architecture-overview.md  ← 主节点（系统全貌，导航中心）
  ├── request-pipeline.md          ← 子节点（请求生命周期）
  ├── auth-module.md               ← 子节点（认证系统）
  ├── database.md                  ← 子节点（数据库层）
  ├── observability.md             ← 子节点（可观测性）
  └── cicd-deployment.md           ← 子节点（CI/CD 与部署）
```

**主节点职责**：
- 在 `related` frontmatter 中列出所有子节点路径
- 维护各子节点的单句摘要（用于导航）
- 子节点修改后，评估主节点摘要是否需同步

**子节点约束**：
- 必须在 `related` 中引用本文档和主节点
- 子节点之间禁止互相引用实现细节（通过主节点中转）
- 每篇只回答一个核心问题（见 §4 职责边界表）

---

## 4. 子文档职责边界

| 文档 | 核心问题 | 不应包含 |
|------|---------|---------|
| `project-architecture-overview.md` | 系统由哪些部分组成？它们如何协作？ | 各层的实现细节 |
| `request-pipeline.md` | 一个 HTTP 请求经历了哪些阶段？ | 业务模块内部逻辑 |
| `auth-module.md` | 认证系统如何工作？ | 通用请求处理逻辑 |
| `database.md` | 数据库层如何连接、监控、保障安全？ | 认证或业务逻辑 |
| `observability.md` | 日志、追踪、告警如何串联？ | 具体业务模块的实现 |
| `cicd-deployment.md` | 代码如何从提交走到生产容器？ | 应用内部架构 |

---

## 5. 图示要求

继承 [docs/STANDARD.md §9](../STANDARD.md#9-写作风格) 图示选型规则。架构文档的 Mermaid 优先选型：

| 场景 | Mermaid 类型 |
|------|-------------|
| 请求处理链路（顺序交互）| `sequenceDiagram` |
| 分层架构（拓扑关系）| `flowchart TD` / `flowchart LR` |
| 令牌或状态生命周期 | `stateDiagram-v2` |
| 部署流水线（有向流）| `flowchart LR` |

---

## 6. 架构漂移防护

在 [docs/AGENTS.md §2](../AGENTS.md#2-漂移防护触发矩阵) 的通用触发矩阵基础上，架构子文档的额外规则：

| 代码变更 | 受影响的架构文档 |
|---------|----------------|
| 修改中间件顺序或核心逻辑 | [request-pipeline.md](request-pipeline.md)（序列图须同步）|
| 修改守卫/拦截器/过滤器注册顺序 | [request-pipeline.md](request-pipeline.md)（顺序表须同步）|
| 修改 JWT 配置（算法/过期时间/Cookie）| [auth-module.md](auth-module.md) |
| 修改连接池参数或查询监控阈值 | [database.md](database.md) + [observability.md](observability.md) |
| 新增/删除 CI/CD workflow 文件 | [cicd-deployment.md](cicd-deployment.md) |
| 修改 Docker 基础镜像或构建步骤 | [cicd-deployment.md](cicd-deployment.md) |
| 新增业务模块 | [project-architecture-overview.md](project-architecture-overview.md)（模块职责表）|

---

## 引用

- [Docs 设计规范与约束](../STANDARD.md)
- [AI 文档操作手册](../AGENTS.md)
- [项目架构全览](project-architecture-overview.md)
- [请求处理链路](request-pipeline.md)
- [认证模块](auth-module.md)
- [数据库](database.md)
- [可观测性](observability.md)
- [CI/CD 部署](cicd-deployment.md)
