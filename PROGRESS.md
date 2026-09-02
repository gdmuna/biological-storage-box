# Progress — AI 协助者进度追踪文档

本文件是 ROADMAP.md 的**执行层配套文档**，专为 AI 助手设计。
每项功能开发前必须查阅本文件，开发完成后必须更新本文件。

> **关联文档**：[ROADMAP.md](./ROADMAP.md) · [apps/backend/AGENTS.md](./apps/backend/AGENTS.md) · [apps/frontend/AGENTS.md](./apps/frontend/AGENTS.md)

---

## ⛔ 铁律（违反即驳回）

1. **禁止 Mock 数据上生产**：所有标记为「已完成」的功能，前端必须对接真实后端 API，后端必须读写真实数据库。测试文件中的 mock/stub 仅限单元测试作用域，E2E 测试必须使用真实服务。
2. **测试先行**：实现代码与测试代码必须同一批次提交，不允许「先上功能后补测试」。
3. **全通过才算完成**：功能模块标记为 ✅ 的唯一标准是通过 §1 中定义的完整验证流水线。不得跳过任何一步。
4. **Docker 镜像纳入验收**：本地构建通过不等于完成，Docker 镜像必须能成功 build。

---

## §1 完成定义（Definition of Done）

每个功能模块完成开发后，**必须按顺序**执行以下所有步骤，全部通过后方可将模块状态改为 ✅。

```
步骤  命令                                                    作用域
────  ──────────────────────────────────────────────────────  ──────
 1    pnpm run format:check                                   根工作区
 2    pnpm --filter @talos-ark/backend lint                          后端
 3    pnpm --filter @talos-ark/frontend lint                        前端
 4    pnpm --filter @talos-ark/backend test                          后端（单元 + E2E，Vitest）
 5    pnpm --filter @talos-ark/frontend test                         前端（Vitest 单元）
 6    pnpm --filter @talos-ark/frontend test:e2e                     前端（Playwright E2E）
 7    pnpm --filter @talos-ark/backend build                         后端 TypeScript 编译
 8    pnpm --filter @talos-ark/frontend build                        前端 Vite 构建
 9    docker build -f apps/backend/Dockerfile .                后端 Docker 镜像
10    docker build -f apps/frontend/Dockerfile .               前端 Docker 镜像
11    pnpm --filter @talos-ark/backend start:dev                     冒烟测试（启动无 crash）
```

> 步骤 9、10 使用 `--no-cache` 时的 build 参数见各 Dockerfile 的 ARG 声明，需传入测试用占位 URL。

---

## §2 测试文件索引

### 后端测试（Vitest，`pnpm --filter @talos-ark/backend test`）

后端 `vitest.config.ts` 的 `include` 规则：`src/**/*.spec.ts` + `test/**/*.spec.ts` + `test/**/*.e2e-spec.ts`

| 模块 | 单元测试路径 | E2E 测试路径 | 状态 |
|------|------------|------------|------|
| App | `test/unit/app.controller.spec.ts` `test/unit/app.service.spec.ts` | `test/e2e/app.e2e-spec.ts` | ✅ 已有 |
| Auth | `test/unit/auth.controller.spec.ts` `test/unit/auth.guard.spec.ts` `test/unit/auth.service.spec.ts` | `test/e2e/auth.e2e-spec.ts` | ✅ 已有 |
| Org | `test/unit/org.controller.spec.ts` `test/unit/org.service.spec.ts` | `test/e2e/org.e2e-spec.ts` | ✅ 已有 |
| OrgUser | `test/unit/org-user.service.spec.ts` | （含于 org E2E） | ✅ 已有 |
| Node | `test/unit/node.controller.spec.ts` `test/unit/node.service.spec.ts` | `test/e2e/node-extensions.e2e-spec.ts` | ✅ 已有 |
| Reagent | `test/unit/reagent.service.spec.ts` | `test/e2e/reagent.e2e-spec.ts` | ✅ 已有 |
| ReagentType | （含于 reagent 单元） | `test/e2e/reagent-type.e2e-spec.ts` | ✅ 已有 |
| Share | — | `test/e2e/share.e2e-spec.ts` | ✅ 已有 |
| User | `test/unit/user.service.spec.ts` | — | ✅ 已有 |
| Feedback | `test/unit/feedback.service.spec.ts` | — | ✅ 已有 |
| **NodeImage** | ❌ `test/unit/node-image.service.spec.ts` | ❌ `test/e2e/node-image.e2e-spec.ts` | ❌ 待创建 |
| **ReagentRequest** | ❌ `test/unit/reagent-request.service.spec.ts` | ❌ `test/e2e/reagent-request.e2e-spec.ts` | ❌ 待创建 |
| **Alert / Notification** | ❌ `test/unit/alert.service.spec.ts` | ❌ `test/e2e/alert.e2e-spec.ts` | ❌ 待创建 |
| **ProcurementRequest** | ❌ `test/unit/procurement.service.spec.ts` | ❌ `test/e2e/procurement.e2e-spec.ts` | ❌ 待创建 |

### 前端测试

#### Vitest 单元（`pnpm --filter @talos-ark/frontend test`）

| 测试文件 | 对应模块 | 状态 |
|---------|---------|------|
| `test/unit/api/` | API 模块调用契约 | ⚠️ 目录存在，内容待核查 |
| `test/unit/pages/` | 页面组件渲染 | ⚠️ 目录存在，内容待核查 |
| `test/unit/stores/` | Pinia Store 逻辑 | ⚠️ 目录存在，内容待核查 |
| `test/unit/schemas/` | Zod Schema 校验 | ⚠️ 目录存在，内容待核查 |

#### Playwright E2E（`pnpm --filter @talos-ark/frontend test:e2e`）

Playwright 配置：`playwright.config.ts`，基础 URL `http://localhost:8081`，测试目录 `test/e2e/`。
分三个 project 运行：`setup`（全局登录） → `public`（未认证页面） → `app`（认证后页面）

| E2E 文件 | 覆盖功能 | 状态 |
|---------|---------|------|
| `test/e2e/global.setup.ts` | 全局登录态初始化 | ✅ 已有 |
| `test/e2e/auth.spec.ts` | 登录流程 | ✅ 已有 |
| `test/e2e/email-auth.spec.ts` | 邮箱登录 | ✅ 已有 |
| `test/e2e/register.spec.ts` | 注册流程 | ✅ 已有 |
| `test/e2e/dashboard.spec.ts` | 仪表盘渲染 | ✅ 已有 |
| `test/e2e/box-create.spec.ts` | 储存盒创建 | ✅ 已有 |
| `test/e2e/room.spec.ts` | 库室列表与详情 | ❌ 待创建 |
| `test/e2e/reagent.spec.ts` | 试剂增删改查 | ❌ 待创建 |
| `test/e2e/reagent-type.spec.ts` | 试剂类型管理 | ✅ 已有 |
| `test/e2e/share.spec.ts` | 资源共享管理 | ❌ 待创建 |
| `test/e2e/logs.spec.ts` | 操作日志查看 | ✅ 已有 |
| `test/e2e/reagent-request.spec.ts` | 出库申请流程 | ❌ 待创建 |
| `test/e2e/notifications.spec.ts` | 通知中心 | ❌ 待创建 |

---

## §3 模块进度状态表

> 状态码：✅ 完成（通过 DoD）· 🚧 进行中 · ❌ 未开始 · ⚠️ 部分完成

### 既有模块

| 模块 | 后端实现 | 前端页面 | 后端测试 | 前端单测 | 前端 E2E | DoD 通过 | 备注 |
|------|---------|---------|---------|---------|---------|---------|------|
| 认证（Auth） | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ | DoD 未正式执行过 |
| 组织（Org） | ✅ | ✅ | ✅ | ✅ | ⚠️ | ⚠️ | |
| 节点树（Node） | ✅ | ✅ | ✅ | ⚠️ | ⚠️ | ⚠️ | |
| 试剂（Reagent） | ✅ | ✅ | ✅ | ⚠️ | ❌ | ❌ | P0 字段扩展完成后端 E2E 已补 |
| 试剂类型（ReagentType） | ✅ | ✅ 独立页面 | ✅ | ⚠️ | ✅ | ❌ | 已创建独立管理页 |
| 操作日志（Logs） | ✅ | ✅ | ✅ | — | ✅ | ❌ | 已添加日志查看页 |
| 资源共享（Share） | ✅ | ❌ | ⚠️ | — | ❌ | ❌ | 后端已含 E2E，缺单元测试；前端无页面 |
| 节点图（NodeCanvas） | ✅ | ✅ 内嵌于Dashboard+Node页 | ⚠️ | ⚠️ | ⚠️ | ⚠️ | 非独立模块，为 Node 的可视化特性 |
| 仪表盘（Dashboard） | — | ✅ | — | ⚠️ | ✅ | ⚠️ | |

### ROADMAP 新增模块

| 模块 | 后端实现 | 前端页面 | 后端测试 | 前端单测 | 前端 E2E | DoD 通过 |
|------|---------|---------|---------|---------|---------|---------|
| **P0** Reagent 字段扩展 | ✅ | ✅ | ⚠️ | ❌ | ❌ | ❌ |
| **P1** 节点图片信息存储 | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **P2** 页面排版优化 | — | ❌ | — | ❌ | ❌ | ❌ |
| **P2** 操作日志查看器 | ✅（已有） | ✅ | ✅（已有） | ❌ | ✅ | ❌ |
| **P2** 试剂类型独立管理 | ✅（已有） | ✅ | ✅（已有） | ❌ | ✅ | ❌ |
| **P3** 全局搜索 | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **P3** 数据导出 | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **P3** 危险品合规 | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **P3** 批量操作 | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **P1** 出库申请（ReagentRequest） | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **P1** 通知 / 预警（Alert） | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **P1** 采购申请（Procurement） | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **P2** 资源共享管理页 | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |


---

## §4 各功能模块实现指引

以下各节描述每个 ROADMAP 功能的**开发范围**、**必须创建/修改的文件**和**测试覆盖要求**。

---

### P0 · Reagent 模型字段扩展

**目标**：为 `Reagent` 补充生物样本管理系统必需的字段，所有后续功能依赖此基础。

#### 后端变更范围

| 文件 | 操作 |
|------|------|
| `apps/backend/prisma/schema.prisma` | ✅ 已新增字段：`quantity`、`unit`、`expiryDate`、`manufactureDate`、`batchNo`、`catalogNo`、`manufacturer`、`casNumber`、`storageCondition`、`hazardLevel`、`minStockThreshold` |
| 新建 Prisma migration | ✅ 已执行 `pnpm --filter @talos-ark/backend db:migrate` |
| `apps/backend/src/modules/reagent/reagent.dto.ts` | ✅ 已更新 CreateDto / UpdateDto / ResponseDto |
| `apps/backend/src/modules/reagent/reagent.service.ts` | ✅ 已更新 create/update 逻辑 |

#### 前端变更范围

| 文件 | 操作 |
|------|------|
| `apps/frontend/src/schemas/reagent.schema.ts` | ✅ 已更新 Zod Schema，包含所有 P0 字段 |
| `apps/frontend/src/api/modules/reagent.ts` | ✅ 已更新请求/响应类型 |
| `apps/frontend/src/pages/reagent/ReagentPage.vue` | 表单仍需扩展 P0 字段展示和输入控件 |

#### 测试要求

- **后端**：✅ 已更新 `test/unit/reagent.service.spec.ts`（已含 P0 字段的 CRUD 测试）
- **后端 E2E**：✅ 已存在 `test/e2e/reagent.e2e-spec.ts`（可扩展 P0 字段的校验断言）
- **前端**：更新 `test/unit/schemas/` 中的 reagent schema 测试（验证新字段的 Zod 校验规则）
- **前端**：**新建** `test/e2e/reagent.spec.ts`（通过 Playwright 验证含新字段的创建表单和列表展示）

---

### P1 · 出库申请与审批（ReagentRequest）

**目标**：在 `ReagentLog` 事后记录之上，增加前置的「申请 → 审批 → 取用」流程。

#### 后端变更范围

| 文件 | 操作 |
|------|------|
| `apps/backend/prisma/schema.prisma` | 新增 `ReagentRequest` 模型与 `ReagentRequestStatus` Enum |
| `apps/backend/src/modules/reagent-request/` | **新建**完整 NestJS 模块（controller / service / dto / module） |
| `apps/backend/src/app.module.ts` | 注册新模块 |

#### 前端变更范围

| 文件 | 操作 |
|------|------|
| `apps/frontend/src/api/modules/reagent-request.ts` | **新建** Alova 请求函数 |
| `apps/frontend/src/schemas/reagent-request.ts` | **新建** Zod Schema |
| `apps/frontend/src/stores/reagent-request.ts` | **新建** Pinia Store |
| `apps/frontend/src/pages/reagent-request/` | **新建** 页面组件（申请列表、审批操作） |
| `apps/frontend/src/router/index.ts` | 注册新路由 |
| `apps/frontend/src/components/AppSidebar.vue` | 视情况添加导航入口 |

#### 测试要求

- **后端单元**：**新建** `test/unit/reagent-request.service.spec.ts`
- **后端 E2E**：**新建** `test/e2e/reagent-request.e2e-spec.ts`（覆盖申请创建、审批通过、拒绝三条路径）
- **前端 E2E**：**新建** `test/e2e/reagent-request.spec.ts`（覆盖发起申请和审批操作的完整 UI 流程）

---

### P1 · 库存预警与通知中心（Alert）

**目标**：定时检测过期和低库存，推送系统内通知。

> ⚠️ **依赖 P0**：`Reagent.expiryDate` 和 `Reagent.minStockThreshold` 字段必须已完成迁移。

#### 后端变更范围

| 文件 | 操作 |
|------|------|
| `apps/backend/prisma/schema.prisma` | 新增 `Alert` 模型（type、severity、orgId、reagentId?、isRead、message） |
| `apps/backend/src/modules/alert/` | **新建** NestJS 模块（含定时任务 `@nestjs/schedule`） |

#### 前端变更范围

| 文件 | 操作 |
|------|------|
| `apps/frontend/src/api/modules/alert.ts` | **新建** |
| `apps/frontend/src/stores/alert.ts` | **新建** |
| `apps/frontend/src/pages/dashboard/DashboardPage.vue` | 集成「即将过期」和「低库存」卡片（真实 API 数据，禁止 mock） |
| `apps/frontend/src/layouts/newLayout.vue` | 顶栏添加通知陵铃图标与已读/未读计数 |

#### 测试要求

- **后端单元**：**新建** `test/unit/alert.service.spec.ts`（验证过期检测和阈值判断逻辑）
- **后端 E2E**：**新建** `test/e2e/alert.e2e-spec.ts`
- **前端 E2E**：**新建** `test/e2e/notifications.spec.ts`（检查通知铃铛渲染，不测试定时触发）

---

### P1 · 采购申请（ProcurementRequest）

**目标**：支持从试剂详情发起补货申请，并追踪申请状态。

#### 后端变更范围

| 文件 | 操作 |
|------|------|
| `apps/backend/prisma/schema.prisma` | 新增 `ProcurementRequest` 模型 |
| `apps/backend/src/modules/procurement/` | **新建** NestJS 模块 |

#### 前端变更范围

| 文件 | 操作 |
|------|------|
| `apps/frontend/src/api/modules/procurement.ts` | **新建** |
| `apps/frontend/src/schemas/procurement.ts` | **新建** |
| `apps/frontend/src/stores/procurement.ts` | **新建** |
| `apps/frontend/src/pages/procurement/` | **新建** |

#### 测试要求

- **后端单元**：**新建** `test/unit/procurement.service.spec.ts`
- **后端 E2E**：**新建** `test/e2e/procurement.e2e-spec.ts`
- **前端 E2E**：**新建** `test/e2e/procurement.spec.ts`

---

### P2 · 资源共享管理页面

**目标**：为已完成的 `ResourceShare` 后端功能创建前端页面。

> 后端 API（`src/modules/share/`）和前端 API 封装（`src/api/modules/share.ts`）均已存在，**不得重复实现或 mock**。

#### 前端变更范围

| 文件 | 操作 |
|------|------|
| `apps/frontend/src/stores/share.ts` | **新建** Pinia Store（如不存在） |
| `apps/frontend/src/pages/share/` 或集成到 `org/` | **新建** 共享申请/列表/撤销页面组件 |
| `apps/frontend/src/router/index.ts` | 注册路由（如独立页面） |

#### 测试要求

- **前端 E2E**：**新建** `test/e2e/share.spec.ts`（覆盖发起共享请求、接受/拒绝）

---

### P2 · 操作日志查看器

**目标**：为 `ReagentLog` 和 `NodeLog` 创建前端展示层。

> 后端查询接口已实现。

#### 前端变更范围

| 文件 | 操作 |
|------|------|
| `apps/frontend/src/pages/reagent/` | 在试剂详情中嵌入操作时间轴 |
| `apps/frontend/src/pages/logs/LogsPage.vue` | ✅ 已创建 全局日志页面 |
| `apps/frontend/src/router/index.ts` | ✅ 已注册路由 `/logs` |

#### 测试要求

- **前端 E2E**：更新 `test/e2e/logs.spec.ts`（已存在，覆盖日志列表加载和筛选功能，可按需扩展）

---

### P2 · 试剂类型独立管理页面

**目标**：将试剂类型从试剂页内的嵌入管理提升为独立页面。

> `src/api/modules/reagent-type.ts` 和前端页面均已存在。

#### 前端变更范围

| 文件 | 操作 |
|------|------|
| `apps/frontend/src/pages/reagent-type/ReagentTypePage.vue` | ✅ 已创建 |
| `apps/frontend/src/router/index.ts` | ✅ 已注册路由 `/reagent-type` |
| `apps/frontend/src/pages/reagent/ReagentPage.vue` | 移除内嵌的类型管理 UI |

#### 测试要求

- **前端 E2E**：更新 `test/e2e/reagent-type.spec.ts`（已存在，覆盖类型 CRUD 完整 UI 流程，可按需扩展）

---

## §5 PR / 提交检查规程

每次提交涉及功能变更时，AI 助手应自行完成以下核查，并在 PR 描述中附上结果：

```
- [ ] §1 DoD 流水线全部步骤已执行并通过
- [ ] 本次变更涉及的所有测试文件已更新（见 §2）
- [ ] §3 状态表已更新为当前实际状态
- [ ] 未引入任何 mock 数据（生产代码和 E2E 测试均对接真实服务）
- [ ] Prisma Schema 变更已同步 migration 并重新生成 Client
- [ ] 新模块已注册到 AppModule / Router（视情况）
- [ ] Docker 镜像本地 build 通过（步骤 9、10）
```

---

## §6 环境与配置说明

| 环境 | 配置文件 | 启动方式 |
|------|---------|---------|
| 后端开发 | `.env.development`（加密，需 `pnpm env:decrypt` 解密） | `pnpm --filter @talos-ark/backend start:dev` |
| 后端测试 | `.env.test`（加密） | `pnpm --filter @talos-ark/backend test` |
| 前端开发 | 无 `.env`，通过 Vite 代理转发 | `pnpm --filter @talos-ark/frontend dev`（端口 8081） |
| 前端 E2E | 依赖前端开发服务器运行中 | `pnpm --filter @talos-ark/frontend test:e2e` |

> `.env.*` 文件使用 `@dotenvx/dotenvx-ops` 加密存储，**禁止明文提交**。新开发环境需先执行 `pnpm --filter @talos-ark/backend env:decrypt`。
