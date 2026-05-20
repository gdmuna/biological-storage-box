---
title: AI 协助者操作手册（前端）
status: active
version: "0.1.0"
last-updated: 2026-04-14
category: meta
inherits: AGENTS.md
related:
  - apps/backend/AGENTS.md
  - src/router/index.ts
  - src/stores/
---

# AI 协助者操作手册（前端）

本文档是 **apps/frontend** 工作区的 AI 助手操作手册，继承根目录 `AGENTS.md` 的通用规范，在此基础上扩展前端专属的核心原则、上下文获取路径与验证流程。

> 首先阅读根目录 [AGENTS.md](../AGENTS.md) 获取 GitNexus 工具用法与通用约束，再阅读本文件。

---

## 1. 技术栈速查

| 层次 | 工具 / 库 | 关键点 |
|------|-----------|-------|
| 框架 | Vue 3 + TypeScript | `<script setup>` + Composition API，禁用 Options API |
| 构建 | Vite 8 + vue-tsc | 路径别名 `@/` → `src/` |
| 样式 | Tailwind CSS v4 | 设计 token 存放于 CSS 变量（`bsb-*` 前缀） |
| 组件库 | shadcn-vue（基于 reka-ui） | 组件位于 `src/components/ui/`，不直接修改 |
| 状态管理 | Pinia 3 | Setup Store 风格，三个核心 store：`auth`、`org`、`ui` |
| HTTP 客户端 | Alova 3 | 封装在 `src/api/`，响应拦截统一处理 401/token 刷新 |
| 表单校验 | Zod v4 | Schema 定义在 `src/schemas/`，组件内用 `safeParse` |
| 路由 | Vue Router 5 | 路由守卫负责鉴权，公开页面需标注 `meta: { public: true }` |
| 动画 | GSAP 3 | 封装在 `src/utils/animation.ts` |
| 单元测试 | Vitest 4 + @vue/test-utils | `pnpm test` |
| E2E 测试 | Playwright | `pnpm test:e2e`；全局配置在 `test/e2e/global.setup.ts` |

---

## 2. 核心设计原则

### 响应式单向数据流

状态只从 Pinia Store 向下流向组件，组件通过调用 store 方法触发状态变更：

```
用户行为 → 组件调用 store action
         → action 调用 API（src/api/modules/）
         → API 返回后更新 store 响应式状态
         → 组件模板自动重渲染
```

**必须在任何 API 写操作之后刷新对应 store**（如 `createOrg` 后调 `org.fetchOrgs()`）。不要在组件内维护与 store 重复的本地状态副本。

### 组件分层

| 层次 | 位置 | 职责 |
|------|------|------|
| 页面组件 | `src/pages/**/*.vue` | 路由占位，组合 UI 块、持有页面级状态 |
| 布局组件 | `src/layouts/` | 导航骨架、侧边栏、顶栏 |
| 通用 UI | `src/components/ui/` | shadcn-vue 生成的原子组件，不得直接修改 |
| 业务组件 | `src/components/`（未来扩展） | 可跨页面复用的业务 Widget |

页面组件不应直接构造原始 HTTP 请求，一律通过 `src/api/modules/` 中的函数调用。

### API 接入规范

所有接口调用通过 Alova 实例（`src/api/client.ts`）发出：

- 调用示例：`await someRequest(params).send()`
- 错误捕获：Alova 拦截器已统一处理 `success: false` → `throw Error(message)`；组件内只需 `try/catch` 展示用户提示
- Token 刷新：拦截器自动处理 401，组件无需关心

### Schema 即契约

`src/schemas/` 是前后端之间的类型契约层：

- 新增接口前，先在对应 schema 文件添加 Zod 定义
- 表单校验用 `schema.safeParse()`，不要手动 `if` 校验字段
- API 响应类型从 schema `infer` 派生，不重复声明 interface

---

## 3. 上下文获取路径

人类下发任务时，AI 助手按以下顺序主动补全上下文，而非猜测。

### 3.1 阅读顺序

| 需要了解 | 去哪里找 | 何时触发 |
|---------|---------|---------|
| 路由结构、页面对应关系 | [`src/router/index.ts`](src/router/index.ts) | 涉及页面跳转、路由守卫时 |
| 全局响应式状态 | [`src/stores/`](src/stores/)（auth / org / ui） | 涉及用户信息、组织切换、侧边栏时 |
| API 接口签名 | [`src/api/modules/`](src/api/modules/) | 调用或新增接口时 |
| 表单 / 响应类型 | [`src/schemas/`](src/schemas/) | 处理表单校验或 API 响应结构时 |
| 设计 token | `style.css`（CSS 变量定义）| 修改颜色、间距、字体时 |
| shadcn 组件用法 | [shadcn-vue 文档](https://www.shadcn-vue.com/docs/components) 或使用 **shadcn skill** | 添加 / 调整 UI 组件时 |

### 3.2 运行时上下文

| 资源 | 地址 | 说明 |
|------|------|------|
| 前端开发服务器 | `http://localhost:8081` | `pnpm dev` 启动 |
| 后端 API | `http://localhost:3000` | 见 `VITE_API_BASE_URL` |
| 后端 Swagger | `http://localhost:3000/api-doc` | 查询接口 DTO 结构 |

### 3.3 探索陌生代码

优先使用 GitNexus（见 `AGENTS.md` GitNexus 章节）而非盲目 grep：
- `gitnexus_query({query: "储存盒创建"})` — 找到相关执行流
- `gitnexus_context({name: "handleCreate"})` — 看调用链全貌
- 涉及跨组件的 store 状态变更，先用 `gitnexus_impact` 评估影响范围

---

## 4. 可观测性反馈循环

### 4.1 代码变更后的标准验证序列

```
修改代码
  → 0. 格式化：pnpm prettier
  → 1. 静态检查：pnpm eslint
  → 2. 类型检查：pnpm type-check（vue-tsc --noEmit）
  → 3. 单元测试：pnpm test
  → 4. 构建验证：pnpm build
  → 5. E2E 验证：pnpm test:e2e（涉及用户流时必须）
```

不要跳过步骤；若任务仅变更样式，至少执行第 2、4 步。

### 4.2 使用 agent-browser 进行运行时验证

当修改涉及用户交互流程（表单提交、路由跳转、状态刷新）时，**必须使用 agent-browser skill** 在真实浏览器中验证：

```
操作步骤（示例）：
1. 打开 http://localhost:8081 并登录
2. 执行触发 Bug 的操作
3. 截图记录实际行为
4. 对比预期行为，确认修复有效
```

不接受"代码看起来是对的"——必须运行时验证。

### 4.3 Playwright E2E 测试规范

- E2E 测试文件位于 `test/e2e/`，全局 setup 在 `test/e2e/global.setup.ts`
- 测试应覆盖：成功路径 + 常见错误状态（表单校验失败、API 报错）
- 修复 Bug 时，**先写对应 E2E 测试再修代码**（TDD 驱动）

### 4.4 Vitest 单元测试规范

- 单元测试文件位于 `test/unit/`
- Store 逻辑（action 函数）需要单元测试，mock Alova API 调用
- 组件单元测试关注：数据渲染、用户事件响应、props/emits 契约

---

## 5. Bug 自主修复流程

当人类报告 Bug 时，AI 助手按以下步骤**独立完成从复现到修复的完整闭环**，无需人类持续介入。

### 5.1 Bug 诊断顺序

```
1. 读路由表（src/router/index.ts）
   → 确认目标路径是否存在，是否注册了对应页面组件

2. 读相关页面组件（src/pages/）
   → 确认触发逻辑（按钮点击、onMounted、watch）

3. 读相关 store（src/stores/）
   → 确认状态更新链路：action 是否调用、响应是否写回 ref

4. 读 API 模块（src/api/modules/）
   → 确认请求参数结构、响应类型是否与 schema 匹配

5. 用 agent-browser 复现（如果以上没找到明显错误）
   → 打开浏览器 → 执行操作 → 观察 Network 面板和控制台报错
```

### 5.2 常见 Bug 模式速查

| 现象 | 优先排查点 |
|------|-----------|
| 操作成功但页面不刷新 | store action 未调用 `fetchXxx()`；或组件用了 `.value` 的本地副本而非响应式引用 |
| 按钮点击无反应 / 路由跳转 404 | `src/router/index.ts` 是否注册了对应路由 |
| 表单提交后无提示 | `try/catch` 里 `catch` 块为空（`/* empty */`）吞掉了错误 |
| API 调用 401 循环 | `src/api/token.ts` 的 refresh 逻辑；`callRefreshToken` 是否有并发保护 |
| 组织切换后数据未更新 | 页面是否 `watch(() => org.currentOrgId, fetchXxx)` |
| 类型错误 / undefined | 先 `pnpm type-check`，再查 Zod schema 与实际 API 响应的字段对齐 |

### 5.3 Bug 报告标准格式

人类在任务描述或 Issue 中使用以下格式，AI 助手可直接开始工作无需追问：

```
【症状】用一句话描述异常现象
【复现步骤】1. 进入 xxx 页面 → 2. 点击 xxx → 3. 观察到 xxx
【预期行为】正确情况下应该发生什么
【疑似范围】（可选）组件名 / store 名 / API 路径
```

---

## 6. 任务执行规范

### 6.1 开始任务前的检查清单

- [ ] 已确认相关路由是否存在（`src/router/index.ts`）
- [ ] 已确认相关 store action 是否已有（避免重复实现）
- [ ] 已确认 API 函数签名（`src/api/modules/`）
- [ ] 已确认 Zod schema 是否已定义（`src/schemas/`）

### 6.2 验收清单（必须全部通过才算完成）

- [ ] `pnpm --filter @talos-ark/frontend type-check` — 零错误
- [ ] `pnpm --filter @talos-ark/frontend test` — 全绳
- [ ] `pnpm --filter @talos-ark/frontend build` — 构建成功
- [ ] 用 agent-browser 或 Playwright 在浏览器中验证功能正常

### 6.3 新增 UI 组件时

1. 优先从 `src/components/ui/` 中已有的 shadcn-vue 组件组合
2. 需要添加新 shadcn 组件时，使用 **shadcn skill**（`mcp_shadcnvue_*` 工具）而非手写
3. 样式优先使用项目设计 token（`bsb-*` CSS 变量），不硬编码颜色值
4. 涉及布局/交互设计决策时，参考 **ui-ux-pro-max skill** 获取专业建议

---

## 7. 自我审查清单（任务完成前必查）

### 7.1 需求对齐

- [ ] 原始要求的每一点都已实现？
- [ ] 没有新增未被要求的功能或重构？
- [ ] 若做了技术取舍，是否已向人类说明？

### 7.2 架构合规

- [ ] 状态变更通过 store action，没有在组件内直接操作 `store.xxx.value`（除只读引用外）
- [ ] API 调用通过 `src/api/modules/`，没有在组件内构造裸 fetch/axios
- [ ] 新增路由已在 `src/router/index.ts` 注册，非公开路由未标 `public: true`
- [ ] 表单校验通过 Zod schema，没有手写正则或 `if` 链

### 7.3 可观测性

- [ ] `pnpm type-check` — 通过
- [ ] `pnpm --filter @talos-ark/frontend test` — 通过
- [ ] `pnpm --filter @talos-ark/frontend test:e2e` — 通过
- [ ] `pnpm build` — 通过
- [ ] Browser / Playwright 验证 — 通过

### 7.4 完成报告格式

```
已完成：[具体实现描述]
验证：type-check ✅ / test ✅ / build ✅ / browser ✅（或说明跳过原因）
决策说明：[若有非显式要求的技术选择，否则省略]
遗留问题：[若有，否则省略]
```

---

## 8. 常用命令速查

```bash
# 开发
pnpm --filter @talos-ark/frontend dev           # 启动开发服务器（:8081）

# 验证
pnpm --filter @talos-ark/frontend type-check    # vue-tsc 类型检查
pnpm --filter @talos-ark/frontend test          # Vitest 单元测试
pnpm --filter @talos-ark/frontend test:e2e      # Playwright E2E 测试
pnpm --filter @talos-ark/frontend build         # 构建产物（含类型检查）

# 代码质量
pnpm --filter @talos-ark/frontend eslint        # ESLint 自动修复
pnpm --filter @talos-ark/frontend prettier      # Prettier 格式化
```

---

## 引用

- [根目录 AGENTS.md](../AGENTS.md) — GitNexus 工具、通用约束
- [apps/backend AGENTS.md](../apps/backend/AGENTS.md) — 后端操作手册（接口结构、DTO）
- [shadcn-vue 文档](https://www.shadcn-vue.com/docs/)
- [Vitest 文档](https://vitest.dev/)
- [Playwright 文档](https://playwright.dev/)
