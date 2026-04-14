# 前端 Notion 主题迁移 + 测试完善 设计文档

**日期**：2026-04-14  
**作者**：AI 设计协作  
**范围**：BSB-Frontend（全量页面）  
**状态**：待实施

---

## 1. 背景与目标

`DESIGN.md` 定义了以 Notion 为灵感的**暖色调亮色设计系统**，核心特征为白底暖灰色阶、Notion Blue 强调色、whisper-weight 边框、多层低不透明度阴影。

当前实现采用的是深色 Linear 风格 UI（`#08090a` 黑底、冷灰色阶、`#5e6ad2` 品牌蓝），与规范存在根本性分歧。

**目标**：
1. 将前端 UI 完全迁移到 DESIGN.md 所定义的 Notion 风格亮色主题
2. 补全前端单元测试与端到端测试覆盖

---

## 2. 设计决策

### 2.1 方案选择

采用 **方案 A：Token-First 渐进迁移**：

- 以 `style.css` 中的 `--color-bsb-*` CSS 变量为切入点，重映射全部颜色 token 值
- 同步修正 shadcn 语义 token（`--primary`、`--border` 等）
- 逐页替换 Tailwind 类名中受 token 影响的颜色引用
- 保留 `bsb-*` 变量名体系，仅改变值（最小化 diff 范围）

### 2.2 字体方案

使用 **Plus Jakarta Sans**（展示/标题层）+ **Inter Variable**（正文/UI 层）替代 NotionInter：

- 两者均完全开源，无版权风险
- Plus Jakarta Sans 在大字号下具有与 NotionInter 接近的视觉紧致感
- 通过 `@font-face` 声明（Bunny Fonts CDN），不引入额外依赖

### 2.3 测试策略

- **单元测试**（Vitest + Vue Test Utils）：补全所有 store、schema、工具函数的单元覆盖
- **E2E 测试**（Playwright）：修复现有失败测试，新增核心用户流程
- E2E 使用**真实后端**，通过 `storageState` 复用登录 session

---

## 3. 颜色 Token 映射表

| Token | 当前值（深色） | 新值（Notion 暖色） | 语义说明 |
|---|---|---|---|
| `bsb-bg-marketing` | `#08090a` | `#ffffff` | 页面底色（纯白） |
| `bsb-bg-panel` | `#0f1011` | `#ffffff` | 卡片/面板背景 |
| `bsb-bg-surface` | `#191a1b` | `#f6f5f4` | 次级表面，暖白色 |
| `bsb-bg-secondary` | `#28282c` | `#ede9e4` | 深次级表面，更暖 |
| `bsb-text-primary` | `#f7f8f8` | `rgba(0,0,0,0.95)` | 主文字（近黑，保留微暖） |
| `bsb-text-secondary` | `#d0d6e0` | `#615d59` | 次要文字（暖灰 500） |
| `bsb-text-tertiary` | `#8a8f98` | `#a39e98` | 辅助文字（暖灰 300） |
| `bsb-text-quaternary` | `#62666d` | `#c0bbb5` | 占位/禁用文字 |
| `bsb-accent-brand` | `#5e6ad2` | `#0075de` | Notion Blue 主强调色 |
| `bsb-accent-hover` | `#828fff` | `#005bab` | 强调色悬停/激活态 |
| `bsb-border-subtle` | `rgba(255,255,255,0.05)` | `rgba(0,0,0,0.06)` | 极细边框 |
| `bsb-border-standard` | `rgba(255,255,255,0.08)` | `rgba(0,0,0,0.1)` | 标准 whisper 边框 |

**shadcn 语义 token 同步修正**（`:root` 亮色模式）：

```css
--primary: oklch(42% 0.19 260);    /* Notion Blue #0075de */
--primary-foreground: oklch(1 0 0); /* 白色 */
--border: oklch(0 0 0 / 10%);      /* rgba(0,0,0,0.1) */
--input: oklch(0 0 0 / 8%);
--ring: oklch(42% 0.19 260);
--muted: oklch(0.97 0.005 80);     /* #f6f5f4 暖白 */
--muted-foreground: oklch(0.42 0.01 60); /* #615d59 */
```

---

## 4. 字体规范

### 字体引入

```css
/* Bunny Fonts CDN */
@import url('https://fonts.bunny.net/css?family=plus-jakarta-sans:400,500,600,700&display=swap');
/* Inter Variable 已通过 @fontsource-variable/inter 引入 */
```

### 字体层级

| 用途 | 字体 | 字号 | 字重 | 字间距 | 行高 |
|---|---|---|---|---|---|
| 页面主标题 | Plus Jakarta Sans | 48px | 700 | -1.5px | 1.00 |
| 模块标题 | Plus Jakarta Sans | 32px | 700 | -0.8px | 1.10 |
| 卡片标题 | Plus Jakarta Sans | 22px | 700 | -0.25px | 1.27 |
| 子标题 | Plus Jakarta Sans | 18px | 600 | -0.1px | 1.30 |
| 正文 | Inter Variable | 16px | 400 | normal | 1.50 |
| UI 标签 | Inter Variable | 15px | 600 | normal | 1.33 |
| 辅助说明 | Inter Variable | 14px | 400 | normal | 1.43 |
| Badge/微标签 | Inter Variable | 12px | 600 | 0.125px | 1.33 |

---

## 5. 组件规范

### 5.1 按钮

**Primary（Notion Blue）**
```
背景: #0075de
文字: #ffffff
内边距: 8px 16px
圆角: 4px
悬停: 背景 #005bab
激活: scale(0.97)
```

**Secondary**
```
背景: rgba(0,0,0,0.05)
文字: rgba(0,0,0,0.95)
圆角: 4px
悬停: 背景加深 rgba(0,0,0,0.08)
```

**Ghost**：透明背景，悬停时底色 `rgba(0,0,0,0.04)`

### 5.2 卡片

```
背景: #ffffff
边框: 1px solid rgba(0,0,0,0.1)
圆角: 12px
阴影: rgba(0,0,0,0.04) 0px 4px 18px,
      rgba(0,0,0,0.027) 0px 2.025px 7.85px,
      rgba(0,0,0,0.02) 0px 0.8px 2.93px,
      rgba(0,0,0,0.01) 0px 0.175px 1.04px
悬停: shadow 轻微增强
```

### 5.3 输入框

```
背景: #ffffff
文字: rgba(0,0,0,0.9)
边框: 1px solid #dddddd
圆角: 4px
占位符: #a39e98
聚焦: 2px solid #0075de 外框
```

### 5.4 Badge

```
背景: #f2f9ff
文字: #097fe8
内边距: 4px 8px
圆角: 9999px（full pill）
字重: 600，12px，间距 0.125px
```

---

## 6. 布局规范

### AppLayout 侧边栏

- 宽度：展开 `240px`，折叠 `64px`（保留现有逻辑）
- 背景：`#f6f5f4`（暖白），右边框：`1px solid rgba(0,0,0,0.1)`
- 导航项激活态：白色背景 + `1px solid rgba(0,0,0,0.09)` 边框 + soft shadow
- 导航项默认态：透明，文字 `#a39e98`，悬停文字 `#615d59` + `#f6f5f4` 背景（注：侧边栏本身已是 `#f6f5f4`，故悬停用 `rgba(0,0,0,0.04)`）

### AppLayout 顶栏

- 背景：`#ffffff`，底部边框：`1px solid rgba(0,0,0,0.1)`
- 高度：`48px`（保持不变）
- 左侧：breadcrumb（`当前模块名` > `子页面名`，如有）替代单一 org 名

### 页面内容区

- 内边距：`24px`（保持 `p-6` 不变）
- 页面标题：Plus Jakarta Sans 32px 700 -0.8px，`rgba(0,0,0,0.95)`

---

## 7. 页面级改进点

### 7.1 登录页（`LoginPage.vue`）/ 注册页（`RegisterPage.vue`）

**当前问题**：卡片在纯黑背景上，品牌识别弱，Logo 区仅图标无文字

**改进**：
- 页面背景：`#f6f5f4`
- 卡片：白色，12px 圆角，whisper 边框，4 层 soft shadow
- 品牌区：BSB Logo SVG + `Plus Jakarta Sans` 24px 700 `BSB` 字样
- 增加副标题"生物样本储存管理系统"，14px，`#a39e98`

### 7.2 仪表盘（`DashboardPage.vue`）

**当前问题**：3 个数字卡片，信息密度极低，无欢迎信息

**改进**：
- 页面顶部增加欢迎信息："你好，{nickname}"，32px 标题
- 指标数字改为 36px Plus Jakarta Sans 700，下加灰色说明标签
- 卡片左侧增加 icon 色块（蓝/绿/橙，与功能语义对应）
- 增加"快速操作"入口区（新建储存盒、查看试剂）

### 7.3 储存盒列表（`BoxListPage.vue`）

**当前问题**：搜索框紧贴标题，无呼吸感

**改进**：
- 页面顶部：标题 + 描述文字"管理组织内的储存盒"，行间距规范
- 搜索框最大宽度 `400px`（现为 `max-w-sm`，约 384px，可保留）
- 卡片 hover：shadow 从 card level 升至 deep level（视觉浮起效果）
- 卡片增加"上次更新"日期戳显示（若接口返回 `updatedAt`）

### 7.4 储存盒详情（`BoxDetailPage.vue`）

**当前问题**：网格格子 `size-16`（64px），试剂名称 10px 几乎不可读

**改进**：
- 格子尺寸改为 `size-20`（80px），最大容 10×10
- 试剂名称字号提至 `12px`（Notion micro label），行溢出改为 tooltip
- 空格子：`#f6f5f4` 背景，位置标签 `rgba(0,0,0,0.3)`
- 占用格子：`#f2f9ff` 背景 + `#0075de` 左边框 3px（accent 条纹）

### 7.5 试剂管理（`ReagentPage.vue`）

**当前问题**：单列 list，视觉单调；多箱逐个请求效率低

**改进**：
- ≥ md 屏改为 2 列 grid 卡片布局
- 卡片展示：试剂名（主）+ 储存盒名（副，badge）+ 位置（pill）
- 页面级 Loading skeleton 替代突然渲染

### 7.6 组织管理（`OrgManagePage.vue`）

**当前问题**：成员操作区较拥挤，删除按钮暴露风险

**改进**：
- 组织列表改为 table，操作收入 `...` 下拉菜单（DropdownMenu）
- 删除操作在 Dialog 内二次确认（保留现有 Dialog 逻辑，改为统一 confirm 组件）

### 7.7 个人设置（`ProfilePage.vue`）

**当前问题**：两个独立表单区视觉割裂

**改进**：
- 使用 shadcn `Tabs`（基本信息 / 修改密码）包裹两个表单
- max-width 保持 `max-w-lg`，tabs trigger 使用 Notion pill 风格

---

## 8. 测试覆盖方案

### 8.1 单元测试（Vitest + Vue Test Utils）

**新增文件**：

| 文件 | 测试内容 | 测试重点 |
|---|---|---|
| `test/unit/stores/org.spec.ts` | org store | fetchOrgs、currentOrgId 切换、currentOrg computed |
| `test/unit/stores/ui.spec.ts` | ui store | toggleSidebar、sidebarCollapsed 初始值 |
| `test/unit/schemas/box.spec.ts` | box/reagent schema | 必填字段校验、位置格式（`1-1` 模式）、rows/cols 范围 |
| `test/unit/schemas/org.spec.ts` | CreateOrgFormSchema | 名称校验、可选 description |
| `test/unit/utils/animation.spec.ts` | GSAP 动画函数 | mock gsap 验证参数调用 |

**修复**：`test/unit/stores/auth.spec.ts` 中 `doLogout` 测试边界。

### 8.2 E2E 测试（Playwright + 真实后端）

**修复现有失败**：`test/e2e/auth.spec.ts` 使用 `id` 选择器（`#account`，`#password`）替代 `name` 属性。

**新增文件**：

| 文件 | 关键场景 |
|---|---|
| `test/e2e/auth.spec.ts`（扩展） | 登录成功跳转 `/dashboard`、注册新用户、退出登录 |
| `test/e2e/navigation.spec.ts` | 未登录访问 `/dashboard` → 重定向 `/login`；已登录访问 `/login` → 重定向 `/dashboard` |
| `test/e2e/dashboard.spec.ts` | 登录后仪表盘加载、3 个指标卡可见、欢迎信息包含用户名 |
| `test/e2e/box.spec.ts` | 新建储存盒 → 列表出现 → 进入详情 → 删除 |
| `test/e2e/org.spec.ts` | 创建组织 → 顶栏 org 名更新 → 删除组织 |

**Session 复用策略**：

```typescript
// test/e2e/fixtures.ts
export const test = base.extend({
    authedPage: async ({ browser }, use) => {
        const ctx = await browser.newContext({ storageState: 'test/e2e/.auth.json' });
        await use(await ctx.newPage());
        await ctx.close();
    }
});
```

`playwright.config.ts` 增加 `globalSetup` 脚本执行一次登录并保存 `storageState`。

---

## 9. 实施优先级

| 优先级 | 任务 | 理由 |
|---|---|---|
| P0 | 修复 E2E 失败测试（选择器问题） | CI 阻塞 |
| P1 | style.css Token 重映射 | 影响全部页面，需先行 |
| P1 | shadcn 语义 token 同步 | 组件颜色正确性依赖 |
| P2 | AppLayout 亮色重构 | 全局可见，优先级高 |
| P2 | 字体体系引入（Plus Jakarta Sans） | 视觉升级核心 |
| P3 | 登录/注册页面改版 | 首次印象页 |
| P3 | 仪表盘欢迎信息 + 卡片升级 | 用户进入后首屏 |
| P4 | 各功能页精细调整 | 细节打磨 |
| P4 | 单元测试补全 | 代码质量 |
| P5 | 新增 E2E 场景 | 验收coverage |

---

## 10. 约束与注意事项

- **不改变组件 API**：仅调整视觉样式，保持所有现有 props、事件、slot 不变
- **禁止内联颜色**：所有颜色通过 `bsb-*` token 或 shadcn 语义 token 引用，不写裸 hex
- **shadcn-vue 组件不直接编辑**：`src/components/ui/` 下通过 token 覆盖，不修改源码
- **响应式保持**：现有 `sm:` / `lg:` 断点逻辑保留
- **Dark mode**：本次迁移聚焦亮色主题，`.dark` 类下的变量暂时保留（第二阶段再做 dark 模式适配）
