---
title: "BSB Monorepo 全面重构设计文档"
status: approved
created: 2026-04-13
category: design
---

# BSB Monorepo 全面重构设计文档

## 1. 背景与目标

### 背景

项目当前状态：
- 工作区命名为 `biological-storage-box-*`，前缀冗长，影响日常开发效率
- 后端仅实现 `auth` 模块 + `User` Prisma Model，其余 53 个目标 API 端点未实现
- 前端使用旧技术栈（Vuetify + VueRouter + 无类型 API），与团队长期愿景不符
- 设计语言不统一

### 目标

| 目标 | 验收标准 |
|------|---------|
| 工作区重命名 | 三个目录均以 `BSB-` 前缀，所有配置文件路径引用无错误 |
| 后端 API 完整性 | 100% 实现 `default_OpenAPI.json` 中的 53 个端点 |
| 测试覆盖 | 每模块 Service 单元测试 + 全端点 E2E 测试通过 |
| 前端重写完成 | 基于 shadcn-vue + alova + Pinia + zod 的完整前端，符合 DESIGN.md 规范 |
| CI/CD 通过 | format、lint、build、test 全通过；Docker 镜像正常构建 |

---

## 2. 架构决策记录（ADR）

### ADR-001：工作区重命名策略

**决策**：原子一次性提交，git mv + 配置文件同步更新。

**理由**：重命名影响路径引用的文件超过 15 处。分步重命名会在中间状态产生路径不一致，导致 lint/build 失败。原子提交可通过 CI 验证整体一致性。

**受影响文件清单**：

| 文件 | 变更类型 |
|------|---------|
| `pnpm-workspace.yaml` | glob 模式 |
| `BSB-Backend/package.json` | name 字段 |
| `BSB-Docsite/package.json` | name 字段 |
| `BSB-Frontend/package.json` | name 字段 |
| `docker-compose.yml` | volumes、build.context |
| `BSB-Backend/Dockerfile` | WORKDIR、COPY 路径 |
| `.github/workflows/ci.yml` | filter.paths、--filter 参数 |
| `.github/workflows/release.yml` | --filter 参数 |
| `.github/copilot-instructions.md` | 所有路径引用 |
| `.husky/pre-commit` | grep 路径前缀 |
| 根 `package.json` | scripts --filter 参数 |
| `BSB-Docsite` VitePress config | srcDir 路径 |
| `AGENTS.md`（根目录） | 路径引用 |
| `biological-storage-box-service/AGENTS.md` | related 文档路径 |

---

### ADR-002：后端 auth 模块与 user 模块的边界

**决策**：
- `auth` 模块保留现有职责：`/auth/login`（密码登录）、`/auth/register`、`/auth/refresh`、`/auth/logout`
- 新增 `user` 模块：`/user/info`、`/user/update/info`、`/user/update/email`、`/user/update/password`、`/user/search`、`/user/email/code`、`/user/email/login`、`/user/email/update/password`
- 原始 OpenAPI 中 `/user/login` 和 `/user/register` 映射到 `auth` 模块的已有端点

**理由**：
- 保持现有 JWT ES256 双令牌架构不变，降低回归风险
- `user` 模块专注用户信息管理（SRP），与认证流程解耦（SoC）

---

### ADR-003：后端实现顺序（依赖树排序）

**顺序**：

```
① prisma-schema   — 一次性添加所有 Model，迁移数据库
② user            — 无依赖，复用 User model
③ file            — 无依赖，复用 StorageService
④ org             — 依赖 User
⑤ org/user        — 依赖 Org + User
⑥ root            — 依赖 Org
⑦ box             — 依赖 Org + Root
⑧ box/alias       — 依赖 Box
⑨ box/image       — 依赖 Box + StorageService
⑩ reagent         — 依赖 Box + Org
⑪ box/log         — 依赖 Box + Reagent
⑫ feedback        — 独立
```

**理由**：依赖树顺序确保每一步的依赖均已就绪，避免 mock 跨模块依赖，使 E2E 测试从第一步起即可真实运行。

---

### ADR-004：Prisma Schema 扩展

新增模型（相对于现有 `User`）：

```prisma
// 组织体系
model Organization { ... }          // id, name, description, ownerId, ...
model OrganizationUser { ... }       // orgId, userId, role, status(pending/active)

// 房间/位置体系
model Root { ... }                   // id, orgId, name, description, ...

// 储存盒体系
model Box { ... }                    // id, orgId, rootId, name, rows, cols, ...
model BoxAlias { ... }               // id, boxId, alias
model BoxImage { ... }               // id, boxId, imageUrl, ...
model BoxLog { ... }                 // id, boxId, userId, operationType, ...

// 试剂（原称 ReagentLocation）
model Reagent { ... }                // id, boxId, position, name, ...

// 文件与反馈
model UploadedFile { ... }           // id, userId, url, ...（可选，按需）
model Feedback { ... }               // id, userId, content, ...
```

---

### ADR-005：前端技术栈

| 层 | 选型 | 版本 | 理由 |
|----|------|------|------|
| UI 组件库 | shadcn-vue (shadcn-vue.com) | latest | Radix Vue 驱动，可完全定制，与 Tailwind 原生集成 |
| 样式 | Tailwind CSS | v3 (稳定) | shadcn-vue 默认支持；v4 尚处 alpha |
| 状态管理 | Pinia | v2 | Vue 官方推荐；模块化 store |
| HTTP 客户端 | alova | v3 | 策略级请求管理（自动缓存、状态驱动）|
| 表单验证 | zod | v3 | 运行时类型安全，与后端 DTO 对齐 |
| 动效 | gsap | v3 | 页面过渡、列表 stagger、微交互 |
| 路由 | Vue Router | v4 | 官方路由，与 Pinia 配合使用 |

---

### ADR-006：前端设计系统实现

基于 `DESIGN.md`（Linear 风格）：

**颜色 Token（Tailwind extend）**：
```js
// tailwind.config.js extend.colors
bsb: {
  bg: {
    marketing: '#08090a',
    panel: '#0f1011',
    surface: '#191a1b',
    secondary: '#28282c',
  },
  text: {
    primary: '#f7f8f8',
    secondary: '#d0d6e0',
    tertiary: '#8a8f98',
    quaternary: '#62666d',
  },
  accent: {
    brand: '#5e6ad2',
    violet: '#7170ff',
    hover: '#828fff',
  },
  border: {
    subtle: 'rgba(255,255,255,0.05)',
    standard: 'rgba(255,255,255,0.08)',
  },
  status: {
    green: '#27a644',
    emerald: '#10b981',
  }
}
```

**字体系统**：
- Inter Variable：通过 `@fontsource/inter` 引入，权重 300/400/500/590
- 510 权重通过 `font-variation-settings: 'wght' 510` 实现
- Berkeley Mono：代码块专用，通过本地字体文件或自托管引入

**shadcn-vue 主题定制**：
- 覆写 CSS 变量（`--background`、`--foreground`、`--primary` 等）以对应 DESIGN.md
- 默认强制 dark mode

**动效设计**：
- 路由切换：gsap fade + slide（100ms ease-out）
- 列表项：stagger-in（每项延迟 30ms）
- 卡片 hover：subtle 上移 2px + 背景不透明度 +0.02
- 加载状态：shimmer skeleton

---

### ADR-007：前端目录结构

```
BSB-Frontend/src/
  api/
    client.js          # alova 实例配置（baseURL, token注入, 响应拦截）
    modules/
      auth.js          # /auth/* API 方法
      user.js          # /user/* API 方法
      org.js           # /org/* API 方法
      box.js           # /box/* API 方法
      root.js          # /root/* API 方法
      reagent.js       # /reagent/* API 方法
      file.js          # /file/* API 方法
  components/
    ui/                # shadcn-vue 安装的原始组件
    app/               # 业务组合组件（OrgSelector, BoxGrid, UserAvatar...）
  composables/
    useAuth.js
    useOrg.js
    useBox.js
  layouts/
    AppLayout.vue      # 侧边栏 + 顶栏（主应用布局）
    AuthLayout.vue     # 居中卡片（登录/注册）
  pages/
    auth/
      LoginPage.vue
      RegisterPage.vue
    dashboard/
      DashboardPage.vue
    box/
      BoxListPage.vue
      BoxDetailPage.vue
    org/
      OrgManagePage.vue
      OrgMembersPage.vue
    user/
      ProfilePage.vue
    reagent/
      ReagentPage.vue
    search/
      SearchPage.vue
  router/
    index.js           # 路由配置 + JWT 守卫
  stores/
    auth.js
    ui.js              # 主题、侧边栏折叠状态
    org.js             # 当前选中组织
    box.js
  schemas/             # zod schemas（与后端 DTO 一一对应）
    auth.schema.js
    user.schema.js
    org.schema.js
    box.schema.js
    reagent.schema.js
  utils/
    format.js          # 日期/文件大小格式化
    animation.js       # gsap 预设动效函数
  style.css            # CSS 变量 + Inter Variable 字体引入
```

---

## 3. 实现计划概览

### Phase 1：工作区重命名（~1h）

- 单一 commit：`chore(monorepo): rename workspaces to BSB-* prefix`
- 验证：`pnpm install && pnpm run format:check` 在根目录通过

### Phase 2：后端 API 实现（严格 TDD，~12 commits）

每个模块 commit 消息格式：`feat(backend): implement <module> module with tests`

1. `chore(backend): expand prisma schema for all business models`
2. `feat(backend): implement user profile and search endpoints`
3. `feat(backend): implement file upload endpoint`
4. `feat(backend): implement org CRUD endpoints`
5. `feat(backend): implement org user management endpoints`
6. `feat(backend): implement root location CRUD endpoints`
7. `feat(backend): implement box CRUD endpoints`
8. `feat(backend): implement box alias management`
9. `feat(backend): implement box image management`
10. `feat(backend): implement reagent endpoints`
11. `feat(backend): implement box operation log endpoints`
12. `feat(backend): implement feedback endpoint`

### Phase 3：前端重写（~5 commits）

1. `chore(frontend): setup shadcn-vue, alova, pinia, zod, gsap stack`
2. `feat(frontend): implement design system tokens and base components`
3. `feat(frontend): implement auth flow and routing`
4. `feat(frontend): implement box/org/reagent management pages`
5. `feat(frontend): add animations, transitions, and polish`

---

## 4. 风险与缓解

| 风险 | 可能性 | 缓解措施 |
|------|--------|---------|
| Prisma migration 与现有 User 数据冲突 | 低（dev 环境无生产数据） | 执行 `db:migrate reset` 重建 |
| shadcn-vue 与当前 Tailwind 版本不兼容 | 低 | 使用 shadcn-vue 官方推荐的 Tailwind v3 |
| alova v3 API 与旧代码混用 | 低（全量重写） | 删除旧 api/ 目录，从零开始 |
| 53 个端点 E2E 测试运行时间过长 | 中 | 按模块拆分 test suite，CI 并行执行 |
| Inter Variable 510 权重在浏览器中的精确渲染 | 低 | `font-variation-settings` 确保精确权重 |

---

## 5. 定义完成的标准

- [ ] `pnpm -r run build` 在 monorepo 根目录通过（三个工作区）
- [ ] `pnpm --filter BSB-Backend test` 全量通过（单元 + E2E）
- [ ] `pnpm run format:check` 通过
- [ ] Docker `docker compose up --build` 成功，健康检查通过
- [ ] 前端本地 `pnpm --filter BSB-Frontend dev` 可访问所有页面，无控制台错误
