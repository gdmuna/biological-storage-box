# BSB 系统全面重设计 — 架构设计文档

> **状态**: 已批准，待实施
> **日期**: 2026-04-15
> **作者**: AI 架构助手（GitHub Copilot / Claude Sonnet 4.6）
> **实施策略**: 分阶段迁移（P1–P5），每阶段独立产出生产级计划书

---

## 规范引用索引

> 所有实施批次的 AGENT 在开始工作前，**必须**完整读取以下文件：

### 通用规范（所有批次）
| 文件 | 用途 |
|------|------|
| [AGENTS.md](../../AGENTS.md) | GitNexus 工具用法、通用硬性约束 |
| [.github/copilot-instructions.md](../../.github/copilot-instructions.md) | 包管理、架构分层、提交规范底线 |

### 后端规范（P1、P2 批次）
| 文件 | 用途 |
|------|------|
| [BSB-Backend/AGENTS.md](../../BSB-Backend/AGENTS.md) | 核心设计原则（AOP/TDD/SoC/SRP/OCP）、工作流程 |
| [BSB-Backend/docs/AGENTS.md](../../BSB-Backend/docs/AGENTS.md) | 文档操作专项流程 |
| [BSB-Backend/docs/STANDARD.md](../../BSB-Backend/docs/STANDARD.md) | 文档写作规范、frontmatter 要求 |
| [BSB-Backend/docs/03-architecture/project-architecture-overview.md](../../BSB-Backend/docs/03-architecture/project-architecture-overview.md) | 模块职责全貌 |
| [BSB-Backend/docs/03-architecture/request-pipeline.md](../../BSB-Backend/docs/03-architecture/request-pipeline.md) | 请求处理链 |
| [BSB-Backend/docs/03-architecture/database.md](../../BSB-Backend/docs/03-architecture/database.md) | Prisma 使用规范 |
| [BSB-Backend/docs/03-architecture/exception-system.md](../../BSB-Backend/docs/03-architecture/exception-system.md) | 异常与错误码体系 |
| [BSB-Backend/docs/01-guides/development-workflow.md](../../BSB-Backend/docs/01-guides/development-workflow.md) | 开发工作流 |
| [BSB-Backend/docs/01-guides/testing.md](../../BSB-Backend/docs/01-guides/testing.md) | 测试规范 |

### 前端规范（P3、P4、P5 批次）
| 文件 | 用途 |
|------|------|
| [BSB-Frontend/AGENTS.md](../../BSB-Frontend/AGENTS.md) | 前端核心原则、响应式数据流、API 接入规范 |
| [BSB-Frontend/DESIGN.md](../../BSB-Frontend/DESIGN.md) | **视觉设计系统**（Notion 风格体系，颜色/排版/组件规范）|

### Skill 引用（前端批次强制执行）
| Skill | 触发时机 |
|-------|---------|
| `ui-ux-pro-max` skill（见 `.agents/skills/ui-ux-pro-max/SKILL.md`） | **前端任何批次开始前**，AGENT 必须读取并应用设计规范 |
| `agent-browser` skill（见 `.agents/skills/agent-browser/SKILL.md`） | **前端任何批次实施完成后**，AGENT 必须自主启动浏览器审计实现质量与 Bug |

---

## 背景与问题诊断

### 触发原因

当前实现存在 6 个领域的系统性问题，无法通过局部修补解决，需要架构层面的统一重设计。

### 问题汇总

| 领域 | 核心问题 | 根因 |
|------|---------|------|
| 资源层级 | `Root`/`Box`/`Node` 三模型并立，语义混乱，无跨组织共享机制 | 初始设计未考虑多组织资源复用 |
| 组织 | 创建不自动刷新、无删除入口、无探索页、无可见性设置、无切换器 | 后端 API 已有但前端未接入；Store 更新逻辑缺失 |
| 房间 | 耦合在样本盒创建流程中，无独立页面、无详情、无删除 | UI 设计时将 Root 作为辅助概念而非一等公民 |
| 节点 | 仅树形列表，无可视化；无 Vue Flow 资源关系图 | 未引入图形化库 |
| 样本盒 | 不自动刷新、无删除、无属性编辑、无移动、动画时序冲突、图片比对残留 | 状态管理不规范；动画作用域未隔离 |
| 试剂 | 无类型预设库；槽位无结构化属性 | 初始设计仅支持最简模型 |

---

## 核心架构决策

### ADR-1：统一 Node 树模型（废弃 Root + Box）

**决策**：将 `Root`（房间）、`Box`（储存盒）、中间层容器全部统一为 `Node`，通过 `type` 枚举和 `gridConfig` 扩展表区分语义与能力。

**理由**：
- 现实中物理层级无固定深度（房间→冰箱→层架→储存盒→内层→槽位），任何固化的模型层数都是错误的假设
- 统一模型后，移动节点、嵌套节点、共享节点均在同一 CRUD 接口内完成
- `gridConfig` 的存在与否决定节点是否可以承载试剂，比 `isLeaf` 布尔值语义更正确

**`NodeType` 枚举**：
```
ROOM       — 特殊：房间（专属页面、顶层物理空间锚点）
BOX        — 特殊：储存盒（专属详情页、可附 gridConfig）
CONTAINER  — 通用物理层级（冰箱/机架/层架/任意中间容器）
```

**能否承载试剂**：由 `NodeGridConfig` 是否存在决定，与 `type` 无关。

### ADR-2：软共享（引用授权）资源共享模型

**决策**：资源归属于单一"主人"组织，其他组织通过 `ResourceShare` 表获得授权访问权，主人可随时撤销。

**数据模型**：
```
ResourceShare {
  resourceType: Enum { NODE }
  resourceId, ownerOrgId, granteeOrgId
  permission: Enum { READ, WRITE }
  status: Enum { PENDING, ACTIVE, REVOKED }
}
```

### ADR-3：组织半公开可发现

**决策**：`Organization` 新增 `isPublic: Boolean`，`isPublic=true` 的组织可在探索页被搜索；`isPublic=false` 的组织仅限邀请。

### ADR-4：分阶段迁移策略

**决策**：P1→P5 分批交付，每批次系统保持可运行状态。不采用大爆炸式重构。

---

## 数据模型设计（Schema）

### 变更概览

#### 新增模型

```prisma
// 统一节点树（替代 Root + Box）
model Node {
  id          String    @id @default(ulid())
  orgId       String
  parentId    String?
  name        String
  description String?
  type        NodeType
  metadata    Json?     // 用户自定义属性（温度、颜色标签等）
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  org        Organization    @relation(fields: [orgId], references: [id], onDelete: Cascade)
  parent     Node?           @relation("NodeTree", fields: [parentId], references: [id], onDelete: SetNull)
  children   Node[]          @relation("NodeTree")
  gridConfig NodeGridConfig?
  reagents   Reagent[]
  aliases    NodeAlias[]
  images     NodeImage[]
  logs       NodeLog[]
  sharedTo   ResourceShare[] @relation("SharedResource")

  @@index([orgId])
  @@index([parentId])
}

enum NodeType {
  ROOM
  BOX
  CONTAINER
}

// 节点网格配置（存在 = 该节点可承载试剂槽位）
model NodeGridConfig {
  id     String @id @default(ulid())
  nodeId String @unique
  rows   Int
  cols   Int

  node Node @relation(fields: [nodeId], references: [id], onDelete: Cascade)
}

// 资源共享授权表
model ResourceShare {
  id            String              @id @default(ulid())
  resourceType  ShareResourceType
  resourceId    String
  ownerOrgId    String
  granteeOrgId  String
  permission    SharePermission     @default(READ)
  status        ShareStatus         @default(PENDING)
  createdAt     DateTime            @default(now())
  updatedAt     DateTime            @updatedAt

  ownerOrg   Organization @relation("OwnedShares", fields: [ownerOrgId], references: [id])
  granteeOrg Organization @relation("ReceivedShares", fields: [granteeOrgId], references: [id])
  node       Node?        @relation("SharedResource", fields: [resourceId], references: [id])

  @@index([ownerOrgId])
  @@index([granteeOrgId])
  @@index([resourceId])
}

enum ShareResourceType { NODE }
enum SharePermission   { READ, WRITE }
enum ShareStatus       { PENDING, ACTIVE, REVOKED }

// 试剂类型预设库
model ReagentType {
  id          String   @id @default(ulid())
  orgId       String
  name        String
  description String?
  colorHex    String?
  unit        String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  org      Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)
  reagents Reagent[]

  @@index([orgId])
}
```

#### Organization 扩展字段

```prisma
isPublic   Boolean  @default(false)
avatarUrl  String?
settings   Json?
```

#### Reagent 扩展字段

```prisma
nodeId            String   // 替代 boxId（迁移后）
reagentTypeId     String?
placedAt          DateTime?
lastTakenAt       DateTime?
environment       Json?    // { temperature, humidity, ... }
responsibleUserId String?
```

#### 迁移映射表

| 旧模型 | 迁移目标 | 说明 |
|--------|---------|------|
| `Root` | `Node` (type=ROOM) | 全量数据迁移 |
| `Box` | `Node` (type=BOX) + `NodeGridConfig` | rows/cols → gridConfig |
| `BoxAlias` | `NodeAlias` | boxId → nodeId |
| `BoxImage` | `NodeImage` | boxId → nodeId |
| `BoxLog` | `NodeLog` | boxId → nodeId |
| `Reagent.boxId` | `Reagent.nodeId` | 字段重命名 |

---

## 后端 API 设计

### 变更原则

- 现有功能完整保留语义，通过统一化简化接口数量
- 废弃接口在迁移完成后的独立 PR 中删除（不在功能 PR 中删除）
- 所有新接口遵循 Controller → Service → Repository 分层，配套单元测试 + E2E 测试

### 新增接口

#### 组织扩展 (`/org`)

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/org/explore` | 公开组织列表，支持 `keyword`/`limit`/`offset` 分页搜索 |
| `GET` | `/org/members/search` | 在组织内按 username/email 搜索成员 |

> `PUT /org/update` 扩展接受 `isPublic`、`avatarUrl`、`settings` 字段（已有接口扩展，无需新增路由）

#### 节点扩展 (`/node`)

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/node/add` | 扩展：接受 `type: NodeType`、`metadata?: Json` |
| `PUT` | `/node/update` | 扩展：可修改 `type`、`metadata`、`parentId`（移动节点）|
| `POST` | `/node/grid/set` | 为节点设置/更新 gridConfig（rows, cols）|
| `DELETE` | `/node/grid/remove` | 移除节点的 gridConfig |
| `GET` | `/node/filter` | 按 `type`/`orgId`/`hasGrid`/`parentId` 过滤节点列表 |

#### 资源共享 (`/share`) — 全新模块

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/share/grant` | ownerOrg 主动授权 granteeOrg 访问某节点 |
| `POST` | `/share/request` | granteeOrg 申请访问某节点 |
| `PUT` | `/share/respond` | ownerOrg 批准/拒绝申请（`status: ACTIVE/REVOKED`）|
| `DELETE` | `/share/revoke` | ownerOrg 撤销共享 |
| `GET` | `/share/outbound` | 我的组织已共享出去的资源列表 |
| `GET` | `/share/inbound` | 我的组织获得的共享资源列表 |

#### 试剂类型 (`/reagent-type`) — 全新模块

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/reagent-type/add` | 创建试剂类型预设 |
| `GET` | `/reagent-type/list` | 获取组织内所有试剂类型，`?orgId=` |
| `PUT` | `/reagent-type/update` | 更新名称/颜色/单位/描述 |
| `DELETE` | `/reagent-type/del` | 删除预设类型 |

#### 废弃（迁移完成后独立 PR 删除）

- `/root/*` → 由 `/node/*` (type=ROOM) 承接
- `/box/*` → 由 `/node/*` (type=BOX) 承接

---

## 前端页面与交互设计

> **前端 AGENT 必读规范**（实施前）：
> 1. 读取 [BSB-Frontend/DESIGN.md](../../BSB-Frontend/DESIGN.md) — 视觉设计系统
> 2. 调用 `ui-ux-pro-max` skill — 获取通用 UI/UX 最佳实践
> 3. 完成实施后调用 `agent-browser` skill — 自主审计实现质量与 Bug

### 路由变更

```
新增:
  /org/explore         → OrgExplorePage.vue      (公开组织发现页)
  /org/:id             → OrgDetailPage.vue        (组织详情+设置)
  /room                → RoomListPage.vue          (房间独立列表页)
  /room/:id            → RoomDetailPage.vue        (房间详情)
  /node                → NodeCanvasPage.vue        (Vue Flow 资源图，替换原 NodePage)
  /reagent-type        → ReagentTypePage.vue       (试剂类型管理)

保留重构:
  /box/:id             → BoxDetailPage.vue         (重构：删除/移动/属性/动画)

移除:
  /box/new             → 迁移为节点创建 Dialog（type=BOX）
```

### 新增 Store

| Store 文件 | 职责 |
|-----------|------|
| `src/stores/node.ts` | 节点树缓存；`fetchTree(orgId)`；创建/删除后自动刷新 |
| `src/stores/reagentType.ts` | 组织试剂类型列表缓存；供槽位 Drawer 下拉使用 |

`org` store 新增：`createAndSwitch(data)` — 创建后自动切换到新组织

### 页面详细规范

#### 侧边栏组织切换器

- 位于侧边栏顶部，替换当前静态组织名显示
- 触发区 hover：`bg-[rgba(0,0,0,0.04)]`，radius 4px
- 下拉菜单：白色背景，`1px solid rgba(0,0,0,0.1)` 边框，card shadow，radius 8px
- 当前组织前加 `#0075de` 圆点，其余 `#a39e98`
- 底部"+ 新建组织"：Ghost 按钮，hover 变蓝，点击弹出 Dialog，**创建成功后 `createAndSwitch()` 自动切换**

#### OrgExplorePage (`/org/explore`)

- 搜索框：`1px solid #dddddd`，radius 4px，placeholder `#a39e98`
- 组织卡片：radius 12px，card shadow，whisper border，hover 加深阴影
- "申请加入"按钮：Primary Blue `#0075de`，8px 16px padding，radius 4px

#### OrgDetailPage (`/org/:id`)

- Tabs：`概览` / `成员` / `共享资源` / `设置`
- 成员 Tab：搜索框（`GET /org/members/search`）+ 待审批列表 + 邀请输入框
- 设置 Tab：`isPublic` Toggle + 名称/描述编辑 + 危险区（删除组织，二次确认 Dialog）

#### RoomListPage (`/room`)

- 房间卡片：右上角 Pill Badge 显示"X 个容器"（`#f2f9ff` 背景，`#097fe8` 文字，12px badge 字体）
- 新建房间按钮独立 Dialog（**与样本盒创建完全解耦**）

#### RoomDetailPage (`/room/:id`)

- 顶部：房间名 + 所属组织 Badge + 编辑/删除按钮
- 属性面板：`metadata` 键值对编辑器；key Caption 14px weight 500，value Body 16px weight 400
- 删除按钮：Ghost 样式，hover 变 `#dd5b00`，二次确认 Dialog

#### NodeCanvasPage (`/node`) — Vue Flow 画布

- 画布背景：`#f6f5f4` + 细点状网格 `rgba(0,0,0,0.06)`
- 节点卡片：白色背景，radius 8px，whisper border，card shadow
  - ROOM：左侧 3px solid `#0075de`
  - BOX：左侧 3px solid `#2a9d99`（teal）
  - CONTAINER：左侧 3px solid `#a39e98`
  - 共享节点：右上角 Pill Badge "外部"（orange `#dd5b00` 色系）
- 左侧过滤器面板：宽 220px，白色背景，card shadow，按 `type`/`orgId`/`hasGrid` 过滤
- 右侧详情 Drawer：宽 360px，从右滑入，白色背景，deep shadow，展示节点详情 + metadata 编辑 + 子节点列表
- 右键菜单：添加子节点 / 设置 gridConfig / 删除

#### BoxDetailPage (`/box/:id`) — 重构

**动画时序修复**：
- 移除 `AppLayout.vue` 中 `watch(route.path)` 全局 `pageTransitionIn`（改为各页面自管）
- 槽位动画规范：
  - 触发：`onMounted` 后延迟 50ms
  - 单位：**以行为单位**，行间延迟 0.1s，行内所有格同步
  - 初始态：`opacity: 0; transform: translateY(8%)`
  - 终态：`opacity: 1; transform: translateY(0)`
  - Duration 0.35s，easing `cubic-bezier(0.16, 1, 0.3, 1)`

**功能变更**：
- 图片比对区域：**完整移除**，不渲染任何图片上传/比对 UI
- 删除按钮：确认 Dialog → `DELETE /node/del` → 跳回 `/box`（实为 `/node?type=BOX`）
- "移动到"按钮：弹出房间/节点选择器 → `PUT /node/update`（修改 parentId）
- 属性面板：`metadata` Json 键值对编辑器
- 槽位有试剂：teal `#2a9d99` 填色；无试剂：`rgba(0,0,0,0.04)` 浅灰
- 槽位点击 Drawer：试剂类型下拉（`reagentType` store）+ DatePicker（放入时间）+ 环境 Json 编辑器 + 负责人搜索

#### ReagentTypePage (`/reagent-type`)

- 表格列：名称 / 颜色块（20×20px swatch，radius 4px）/ 单位 / 描述 / 操作
- 颜色选择：12 种预设色 Swatch + 自定义 hex 输入

---

## 分阶段交付计划

每个批次独立产出一份**生产级架构师计划书**，路径格式：`docs/plans/YYYY-MM-DD-phase-{N}-{topic}.md`

| 批次 | 主题 | 计划书路径 | 独立可运行 |
|------|------|-----------|-----------|
| **P1** | Schema 迁移 | `2026-04-15-phase-1-schema-migration.md` | ✅ 迁移后后端可启动 |
| **P2** | 后端新 API | `2026-04-15-phase-2-backend-new-apis.md` | ✅ 全部 API 可测试 |
| **P3** | 前端组织重构 | `2026-04-15-phase-3-frontend-org.md` | ✅ 组织功能完整 |
| **P4** | 前端房间 + Vue Flow | `2026-04-15-phase-4-frontend-room-node.md` | ✅ 位置管理可用 |
| **P5** | 前端样本盒 + 试剂类型 | `2026-04-15-phase-5-frontend-box-reagent.md` | ✅ 全功能完整 |

### 每份计划书必须包含

1. **变更范围**（文件列表、受影响模块）
2. **接口契约**（DTO、响应类型、错误码）
3. **分层任务**（Schema → Repository → Service → Controller → 前端 Schema → API → Store → Page → Router）
4. **测试要求**（单元测试覆盖点 + E2E 场景）
5. **回滚方案**（数据迁移回滚脚本 / 功能开关）
6. **自我审查清单**（参照 BSB-Backend/AGENTS.md §5.3 提交门槛）

### 前端批次额外要求

- 实施前：阅读 `BSB-Frontend/DESIGN.md` + 调用 `ui-ux-pro-max` skill
- 实施后：调用 `agent-browser` skill，自主在浏览器中验证：
  - 页面是否正常渲染（无白屏/报错）
  - 交互流程是否符合计划（创建→自动刷新、删除→确认Dialog→跳转）
  - 视觉规范是否对齐 DESIGN.md（颜色/间距/字体/动画）
  - 是否存在 Console 报错或网络请求失败

---

## 风险与依赖

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| P1 数据迁移脚本错误导致数据丢失 | 高 | 迁移前备份数据库；迁移脚本先在 staging 验证；提供回滚 SQL |
| P2 与 P1 并行导致前端临时不可用 | 中 | P1 完成后保留旧接口别名，P5 完成后统一删除 |
| Vue Flow 性能（节点过多） | 中 | 初始渲染限制深度为 3 层；过滤器默认收起；按需展开 |
| `metadata: Json` 字段无约束导致数据质量差 | 低 | 前端提供结构化编辑器；后端不做 Json schema 验证（YAGNI）|

---

## 引用

- [BSB-Frontend/DESIGN.md](../../BSB-Frontend/DESIGN.md)
- [BSB-Frontend/AGENTS.md](../../BSB-Frontend/AGENTS.md)
- [BSB-Backend/AGENTS.md](../../BSB-Backend/AGENTS.md)
- [BSB-Backend/docs/03-architecture/database.md](../../BSB-Backend/docs/03-architecture/database.md)
- [BSB-Backend/docs/03-architecture/exception-system.md](../../BSB-Backend/docs/03-architecture/exception-system.md)
- [BSB-Backend/prisma/schema.prisma](../../BSB-Backend/prisma/schema.prisma)
- [.github/copilot-instructions.md](../../.github/copilot-instructions.md)
- `.agents/skills/ui-ux-pro-max/SKILL.md`
- `.agents/skills/agent-browser/SKILL.md`
