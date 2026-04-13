---
title: AI 协助者操作手册
status: active
version: "0.7.4"
last-updated: 2026-04-09
category: meta
related:
  - docs/AGENTS.md
  - docs/STANDARD.md
  - docs/03-architecture/project-architecture-overview.md
---

# AI 协助者操作手册

本文档是项目级 AI 协助者操作手册，定义所有 AI 助手参与本项目时必须遵循的**核心设计原则**与**通用工作流程**。

> 文档操作的专项流程见 [docs/AGENTS.md](docs/AGENTS.md)。

---

## 1. 核心设计原则

以下原则适用于代码编写、架构设计、文档维护的全场景。每条原则均附带在本项目（NestJS 后端）中的具体含义。

### AOP — 面向切面编程

横切关注点（日志、认证、性能监控、异常处理）通过 NestJS 装饰器机制统一实现，不侵入业务逻辑：

- 认证 → `AuthGuard`
- 性能监控 → `PerformanceInterceptor`
- 响应格式化 → `ResponseFormatInterceptor`
- 异常兜底 → `AllExceptionsFilter`
- 请求日志 → `AppMiddleware`

### TDD — 测试驱动开发

测试是业务功能交付的必要产出，不是可选附属品：

- 业务 Service 逻辑必须有对应的单元测试（mock Repository 层，验证逻辑独立于基础设施）
- API 端点必须有 E2E 测试（`supertest` + 真实数据库，验证接口契约）
- 测试与实现代码同步提交，不留“稍后补”失负
- `pnpm test` 通过是任务完成的门槛，与 `pnpm lint` / `pnpm format` / `pnpm build` 并列（见 §5.3）
- 优先覆盖分支逻辑、边界条件和异常路径，而非追求行覆盖率数字

### SoC — 关注点分离

每个模块、层次、文件只关注一个明确的职责维度。不同关注点通过接口边界通信：

- 请求处理 vs 业务逻辑（Controller vs Service）
- 业务逻辑 vs 数据访问（Service vs Repository）
- 基础设施 vs 业务模块（`infra/` vs `modules/`）
- 横切关注点 vs 业务关注点（AOP 机制 vs 业务代码）

### SRP — 单一职责原则

每个类、模块只有一个被修改的理由：

- Controller 只因请求接口变更而修改
- Service 只因业务规则变更而修改
- Repository 只因数据访问方式变更而修改

### OCP — 开放封闭原则

对扩展开放，对修改封闭：

- 新增业务模块不修改现有模块代码
- 新增守卫/拦截器通过 `APP_*` token 注册，不修改现有处理链
- 错误码通过目录扩展（`error-catalog.constant.ts`），不修改现有错误处理逻辑
- 错误通过 `BusinessException` + 错误码目录抛出，不返回模糊的通用错误

### LSP — 里氏替换原则

子类型必须能替换其基类而不破坏程序行为：

- 自定义异常继承 `BusinessException` 时，保持错误响应格式一致
- 替换基础设施实现（如数据库驱动）时，上层 Service 代码无需修改

### ISP — 接口隔离原则

不强迫依赖方依赖它不需要的接口：

- 模块只导出外部需要的 Service，不暴露内部实现细节
- DTO 按用途拆分（CreateDto / UpdateDto / ResponseDto），不使用巨型对象
- 工具函数按职责分目录（`helpers/`、`formatters/`、`validators/`、`errors/`），按需引入

### DIP — 依赖反转原则

高层模块不依赖低层模块的具体实现，二者都依赖抽象：

- Service 通过构造函数声明依赖，由 NestJS IoC 容器注入
- `modules/` 不直接引用 `infra/` 的具体类，通过注入 token 解耦
- 配置通过环境变量注入（`@nestjs/config`），不假设 `.env` 文件存在
- 测试中通过 mock 替换依赖，验证逻辑独立于基础设施

### 高内聚低耦合

相关功能紧密聚合在同一模块内部，不同模块通过最小化接口松散连接：

- 认证相关的 Controller、Service、Guard、DTO 聚合在 `modules/auth/`
- 横向模块依赖通过 `common/` 抽象，禁止模块间直接引用
- `infra/` 不引用 `modules/`（单向依赖）

### DRY — 不重复自己

同一事实、同一逻辑只在一个位置定义，其他位置通过引用复用：

- 常量在 `src/constants/` 集中定义，不硬编码魔法数字或字符串
- 工具函数在 `src/common/utils/` 集中维护，不重复实现
- 文档中同一信息只在一处描述，其他位置链接引用

### KISS — 保持简单

最简单的解决方案往往是最好的：

- 单次使用的逻辑不必抽出帮助函数
- 能用简单条件判断解决的不用设计模式
- 目录结构不超出实际需要的层级

---

## 2. 上下文获取路径

人类下发任务时，往往不会主动提供所有必要信息。AI 助手按以下顺序主动补全上下文，而非在信息不足时猜测。

### 2.1 文档导航入口

| 需要了解 | 去哪里找 | 何时触发 |
|---------|---------|---------|
| 项目整体架构、技术栈、模块职责 | [项目架构全览](docs/03-architecture/project-architecture-overview.md) | 涉及架构层级的任务开始前 |
| 文档的设计规范与写作标准 | [docs/STANDARD.md](docs/STANDARD.md) | 需要创建或修改文档时 |
| AI 文档操作的专项流程 | [docs/AGENTS.md](docs/AGENTS.md) | 涉及文档变更时 |

### 2.2 代码级上下文

在动手修改代码之前，先确认以下信息是否已知：

**工具函数** — `src/common/utils/` 下按职责分类，避免重复实现：
- `helpers/` — 数据操作（array、object、string、json、crypto）
- `formatters/` — 格式化（date、number、console）
- `validators/` — 验证（email、phone、common）
- `errors/` — 异步结果封装（async-result、async-operations）

**常量定义** — `src/constants/` — 修改阈值/配置值前先查，不硬编码

**类型扩展** — `src/types/express.d.ts` — Express Request 上已挂载 `id`, `version`, `jwtClaim`

**错误码目录** — `src/constants/error-catalog.constant.ts` — 抛出 `BusinessException` 前先查是否已有对应错误码

### 2.3 在线资源

| 资源 | 访问方式 | 说明 |
|------|---------|------|
| Swagger API 文档 | `GET http://localhost:{PORT}/api-doc` | 开发环境可用，列出所有端点及 DTO |
| 健康检查 | `GET http://localhost:{PORT}/health` | 返回 DB 连接状态和应用版本 |
| Prisma Studio | `pnpm db:studio` | 数据库可视化 UI |

---

## 3. 可观测性反馈循环

AI 助手执行修改后，必须**主动验证结果**，而非交由人类反馈后才发现问题。

### 3.1 代码变更后的标准验证序列

```
修改代码
  → 0. 格式化：pnpm format
  → 1. 静态检查：pnpm lint
  → 2. 类型检查：pnpm build（tsc 编译）
  → 3. 测试：pnpm test（含单元测试与 E2E 测试，需要数据库连接）
  → 4. 运行时验证：pnpm start:dev + 观察日志输出
```

不要跳过步骤，除非任务明确只变更了非代码内容（如文档、配置注释）。

### 3.2 日志可观测性

本项目使用 Pino 结构化日志，所有日志为 JSON 格式，关键字段：

| 字段 | 含义 |
|------|------|
| `req.id` | 请求 ID（ULID），贯穿完整请求链路 |
| `responseTime` | 请求耗时（ms） |
| `level` | 日志级别：`trace`/`debug`/`info`/`warn`/`error`/`fatal` |
| `context` | 日志来源模块名称 |

**慢请求/慢查询阈值**（定义在 `src/constants/observability.constant.ts`）：
- 请求 ≥1000ms → `warn`；≥3000ms → `error`
- 查询 ≥100ms → `warn`；≥500ms → `error`

### 3.3 测试反馈解读

**单元测试失败**：先检查是 mock 配置问题还是逻辑问题。Auth 相关测试注入了 `PinoLogger` mock，修改认证逻辑时注意同步更新 mock。

**E2E 测试失败**：E2E 使用真实数据库，需要 `.env.test` 中的 `DATABASE_URL` 有效。测试设计为无状态，不要误判为 Bug。

**编译失败**：路径别名问题是常见原因。`@/` 映射到 `src/`，`@root/` 映射到项目根目录。Prisma 生成的类型在 `prisma/generated/`。

### 3.4 异常响应解读

所有错误响应格式统一为：

```json
{
  "success": false,
  "code": "ERROR_CODE",
  "message": "人类可读描述",
  "type": "https://api.example.com/errors/ERROR_CODE",
  "timestamp": "...",
  "context": { "requestId": "...", "version": "..." }
}
```

`code` 字段对应 `src/constants/error-catalog.constant.ts` 中的定义。

---

## 4. 任务执行规范

### 开始任务前的检查清单

- [ ] 已阅读架构全景文档，了解涉及模块的职责边界
- [ ] 已确认工具函数是否已在 `src/common/utils/` 中存在
- [ ] 已确认错误码是否已在 `src/constants/error-catalog.constant.ts` 中定义
- [ ] 已知晓相关 API 的 DTO 结构（查阅 Swagger 或 `*.dto.ts`）

### 涉及数据库变更时

1. 修改 `prisma/schema.prisma`
2. 运行 `pnpm db:migrate` 生成迁移文件
3. 运行 `pnpm db:gen-client` 更新客户端类型
4. 验证受影响的 Service 和 DTO 与新 schema 一致

### 涉及文档变更时

参见 [docs/AGENTS.md](docs/AGENTS.md) 中的文档操作专项流程。

---

## 5. 任务完成后的自我审查

### 5.1 需求对齐检查

- [ ] 原始要求的每一点是否都已实现？（不遗漏）
- [ ] 实现范围是否超出任务边界？（不过度）
- [ ] 任务中途若做了决策或取舍，是否已向人类说明？

### 5.2 架构合规检查

- [ ] 遵守 Controller → Service → Repository 分层
- [ ] 使用构造函数注入（优先 DI/IoC）
- [ ] 无硬编码的配置值或敏感信息
- [ ] 无重复实现已有工具函数

### 5.3 可观测性验证

- [ ] `pnpm format` — 格式化通过
- [ ] `pnpm lint` — 零报错
- [ ] `pnpm build` — 编译通过
- [ ] `pnpm test` — 测试通过（涉及业务逻辑变更时必须执行）

### 5.4 文档与代码同步

| 变更类型 | 需同步文档 |
|---------|---------|
| 新增/修改接口契约 | Swagger 注解（内联于代码） |
| 新增/删除模块，修改模块职责 | [项目架构全览](docs/03-architecture/project-architecture-overview.md) |
| 变更 `package.json` scripts | `.github/copilot-instructions.md` 命令速查 |
| 新增/删除文档文件 | `docs/README.md` 索引 |

### 5.5 完成报告格式

```
已完成：[具体实现描述]
验证：format ✅ / lint ✅ / build ✅ / test ✅（或说明跳过原因）
决策说明：[若任务中有非显式要求的选择，否则省略]
遗留问题：[若有，否则省略]
```

---

## 6. 元文档体系

本项目以 AGENTS.md 为共同根，形成两个不同性质的继承分支，分别管理 **AI 行为约束**与**文档写作规范**。

### 6.1 继承链

**AGENTS 分支**（行为约束扩展，叶节点）：

```
AGENTS.md
└── docs/AGENTS.md
```

**STANDARD 分支**（写作规范逐层下探）：

```
AGENTS.md
└── docs/STANDARD.md
    ├── docs/01-guides/STANDARD.md
    │   └── docs/01-guides/*.md
    ├── docs/02-harness/STANDARD.md
    │   └── docs/02-harness/*.md
    ├── docs/03-architecture/STANDARD.md
    │   └── docs/03-architecture/*.md
    ├── docs/04-appendix/STANDARD.md
    │   └── docs/04-appendix/*.md
    ├── docs/05-releases/STANDARD.md
    │   └── docs/05-releases/*.md
    └── docs/06-audits/STANDARD.md
        └── docs/06-audits/*.md
```

两个分支的 `inherits:` 语义有所不同：AGENTS 分支表示"操作流程的专项扩展"，STANDARD 分支表示"写作规范的逐层下探"。共同点是：子文档只包含增量约束，不重复父文档内容。

### 6.2 frontmatter 规则

| 字段 | 含义 |
|---------|------|
| `inherits: 路径` | 父规范文件路径（相对项目根）。子文档自动继承父文档全部规则，无需重复。 |
| `overrides: [路径#锤点]` | 显式禁用指定父规则。值为父文档路径 + Markdown 标题锤点。 |

### 6.3 读取顺序建议

1. 首先读本文件（AGENTS.md）获取核心原则与通用工作流
2. 涉及文档操作时，再读 [docs/AGENTS.md](docs/AGENTS.md)
3. 涉及特定文档目录时，再读对应子目录的 `STANDARD.md`
4. 子规范只包含增量约束，父规范的内容不再重复

---

## 引用

- [AI 文档操作手册](docs/AGENTS.md)
- [Docs 设计规范与约束](docs/STANDARD.md)
- [项目架构全览](docs/03-architecture/project-architecture-overview.md)
