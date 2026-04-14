# 前端 Notion 主题迁移 + 测试完善 实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将 BSB-Frontend 的 UI 从深色 Linear 风格完整迁移到 DESIGN.md 定义的 Notion 暖色亮色主题，并补全前端单元测试与端到端测试覆盖。

**Architecture:** Token-First 渐进迁移——首先修改 `style.css` 中的 CSS 变量值，shadcn 语义 token 同步修正；其后逐模块更新页面，最后补全测试。整个过程保持组件 API 不变，仅改视觉层。

**Tech Stack:** Vue 3, shadcn-vue (reka-nova style), Tailwind CSS v4, Vitest, Vue Test Utils, Playwright, Plus Jakarta Sans (Bunny Fonts), Inter Variable

---

## Task 1：修复现有 E2E 测试失败（P0）

> 现有 `test/e2e/auth.spec.ts` 使用 `input[name="account"]` 选择器，但登录页只有 `id="account"`，导致测试失败。

**Files:**
- Modify: `BSB-Frontend/test/e2e/auth.spec.ts`

**Step 1: 确认选择器问题**

查看登录页源码，确认 input 上只有 `id` 属性而无 `name` 属性。

```bash
grep -n 'name="account"' BSB-Frontend/src/pages/auth/LoginPage.vue
# 应该无输出，确认缺少 name 属性
```

**Step 2: 有两个修复选项**

**选项 A（推荐）**：在 LoginPage.vue 的 input 上补加 `name` 属性（更好的语义 HTML）：
```vue
<Input id="account" name="account" v-model="account" ... />
<Input id="password" name="password" v-model="password" ... />
```

**选项 B**：在 E2E 测试里改用 `#account` 选择器。

用选项 A，同时修改 E2E 测试：

```typescript
// test/e2e/auth.spec.ts  登录页测试改用 name 属性（选项 A 后已存在）
await expect(page.locator('input[name="account"]')).toBeVisible();
```

**Step 3: 修改 LoginPage.vue**

在 `<Input id="account" ...>` 和 `<Input id="password" ...>` 添加对应的 `name` 属性。同样处理 `RegisterPage.vue`。

**Step 4: 运行 E2E 测试**

```bash
pnpm --filter BSB-Frontend test:e2e
```
预期：`login page loads` PASS，`invalid login shows error` 需后端运行中才能测（可先 skip 或标记 `test.skip` 如无后端）。

**Step 5: 提交**

```bash
git add BSB-Frontend/src/pages/auth/LoginPage.vue BSB-Frontend/src/pages/auth/RegisterPage.vue BSB-Frontend/test/e2e/auth.spec.ts
git commit -m "fix(frontend): add name attributes to auth inputs, fix E2E selector"
```

---

## Task 2：引入 Plus Jakarta Sans 字体（P2）

**Files:**
- Modify: `BSB-Frontend/src/style.css`

**Step 1: 在 style.css 顶部添加字体引入**

在 `@import 'tailwindcss';` 后添加：

```css
@import url('https://fonts.bunny.net/css?family=plus-jakarta-sans:400,500,600,700&display=swap');
```

**Step 2: 在 `@theme inline` 块内更新字体变量**

```css
--font-display: 'Plus Jakarta Sans', 'Inter Variable', -apple-system, system-ui, sans-serif;
--font-sans: 'Inter Variable', -apple-system, system-ui, 'Segoe UI', sans-serif;
--font-heading: var(--font-display);
```

**Step 3: 验证字体加载**

运行 `pnpm --filter BSB-Frontend dev`，打开浏览器，检查标题文字字体是否显示为 Plus Jakarta Sans。

**Step 4: 提交**

```bash
git add BSB-Frontend/src/style.css
git commit -m "feat(frontend): add Plus Jakarta Sans display font via Bunny Fonts CDN"
```

---

## Task 3：CSS Token 全局重映射（P1 — 核心）

> 这是最关键的一步，修改后全部页面颜色将从深色翻转为 Notion 暖色亮色。

**Files:**
- Modify: `BSB-Frontend/src/style.css`

**Step 1: 修改 `:root` 中的 shadcn 语义 token**

用 Notion 暖色亮色替换：

```css
:root {
    /* Notion Blue 对应 oklch */
    --primary: oklch(42.8% 0.188 259.6);
    --primary-foreground: oklch(1 0 0);
    /* 暖白表面 */
    --muted: oklch(97.2% 0.005 80);
    --muted-foreground: oklch(41.8% 0.012 60);
    /* whisper 边框 */
    --border: oklch(0 0 0 / 10%);
    --input: oklch(0 0 0 / 8%);
    --ring: oklch(42.8% 0.188 259.6);
    /* 卡片白色 */
    --card: oklch(1 0 0);
    --card-foreground: oklch(0 0 0 / 95%);
    /* popover */
    --popover: oklch(1 0 0);
    --popover-foreground: oklch(0 0 0 / 95%);
    /* 前景 */
    --foreground: oklch(0 0 0 / 95%);
    --background: oklch(1 0 0);
}
```

**Step 2: 修改 `html` 全局背景和文字颜色**

```css
html {
    background-color: #ffffff;
    color: rgba(0, 0, 0, 0.95);
}
```

**Step 3: 修改 `@theme inline` 中的 `bsb-*` 自定义 token 值**

```css
@theme inline {
    /* 字体（保留已有 --font-sans，新增 --font-display）*/
    --font-display: 'Plus Jakarta Sans', 'Inter Variable', -apple-system, system-ui, sans-serif;
    --font-sans: 'Inter Variable', -apple-system, system-ui, 'Segoe UI', sans-serif;
    --font-heading: var(--font-display);

    /* BSB 自定义颜色 token —— Notion 暖色亮色 */
    --color-bsb-bg-marketing: #ffffff;
    --color-bsb-bg-panel: #ffffff;
    --color-bsb-bg-surface: #f6f5f4;
    --color-bsb-bg-secondary: #ede9e4;
    --color-bsb-text-primary: rgba(0, 0, 0, 0.95);
    --color-bsb-text-secondary: #615d59;
    --color-bsb-text-tertiary: #a39e98;
    --color-bsb-text-quaternary: #c0bbb5;
    --color-bsb-accent-brand: #0075de;
    --color-bsb-accent-hover: #005bab;
    --color-bsb-accent-violet: #0075de;   /* 统一到 Notion Blue */
    --color-bsb-border-subtle: rgba(0, 0, 0, 0.06);
    --color-bsb-border-standard: rgba(0, 0, 0, 0.1);
    --color-bsb-status-green: #1aae39;
    --color-bsb-status-emerald: #10b981;

    /* 字重 token 保持不变 */
    --font-weight-emphasis: 510;
    --font-weight-semibold: 590;
}
```

**Step 4: 修改滚动条样式（反色处理）**

```css
::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.12);
    border-radius: 3px;
}
```

**Step 5: 保留 `.dark` 类中的旧深色 token（不删除，供后续 dark mode 使用）**

`.dark` section 暂不修改，保留原有深色值。

**Step 6: 启动开发服务器查看效果**

```bash
pnpm --filter BSB-Frontend dev
```

预期：页面整体从黑色变为白色背景，蓝色强调色从紫蓝变为 Notion Blue。

**Step 7: 提交**

```bash
git add BSB-Frontend/src/style.css
git commit -m "refactor(frontend): remap all bsb-* tokens to Notion warm light theme"
```

---

## Task 4：AppLayout 亮色重构（P2）

**Files:**
- Modify: `BSB-Frontend/src/layouts/AppLayout.vue`

**Step 1: 侧边栏背景改为暖白**

将 `aside` 元素的类从 `bg-bsb-bg-panel` 改为 `bg-bsb-bg-surface`。边框 `border-bsb-border-standard` 保持（已在 Task 3 重映射为浅色值）。

**Step 2: 导航项激活态重设计**

激活态由 `bg-bsb-bg-surface` 改为 `bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-[rgba(0,0,0,0.09)]`：

```vue
:class="route.path.startsWith(item.path)
    ? 'bg-white border border-[rgba(0,0,0,0.09)] shadow-sm text-bsb-text-primary'
    : 'text-bsb-text-tertiary hover:bg-[rgba(0,0,0,0.04)] hover:text-bsb-text-secondary'"
```

**Step 3: Logo 区改为品牌字体**

```vue
<div class="flex h-12 items-center gap-2 px-4">
    <img src="/icons/logo.svg" class="size-5 shrink-0" alt="BSB" />
    <span v-if="!ui.sidebarCollapsed" 
          class="truncate font-display text-sm font-bold tracking-tight text-bsb-text-primary">
        BSB
    </span>
</div>
```

**Step 4: 顶栏背景改为纯白**

`header` 元素确保使用 `bg-white`（或 `bg-bsb-bg-marketing`，已映射为白色）。

**Step 5: 用户 Avatar 的 fallback 颜色更新**

```vue
<AvatarFallback class="bg-[#f2f9ff] text-xs text-[#097fe8]">
```

**Step 6: 运行并对照 DESIGN.md 侧边栏规范检查**

**Step 7: 提交**

```bash
git add BSB-Frontend/src/layouts/AppLayout.vue
git commit -m "refactor(frontend): migrate AppLayout to Notion light sidebar style"
```

---

## Task 5：登录/注册页面改版（P3）

**Files:**
- Modify: `BSB-Frontend/src/pages/auth/LoginPage.vue`
- Modify: `BSB-Frontend/src/pages/auth/RegisterPage.vue`

**Step 1: 背景改为 `#f6f5f4`**

外层 div 的 `bg-bsb-bg-marketing` 保持（已映射为 `#ffffff`）。改为暖白：`bg-bsb-bg-surface`。

**Step 2: 卡片增加 Notion 多层阴影**

在 Card 上添加自定义 shadow（Notion 4层soft shadow）：

```vue
<Card class="w-full max-w-sm border-bsb-border-standard bg-white
    shadow-[rgba(0,0,0,0.04)_0px_4px_18px,rgba(0,0,0,0.027)_0px_2.025px_7.85px,rgba(0,0,0,0.02)_0px_0.8px_2.93px,rgba(0,0,0,0.01)_0px_0.175px_1.04px]">
```

**Step 3: 品牌区增加副标题**

```vue
<CardHeader class="space-y-1 text-center">
    <div class="mx-auto mb-2 flex size-10 items-center justify-center rounded-lg bg-[#f2f9ff]">
        <Box class="size-5 text-[#0075de]" />
    </div>
    <CardTitle class="font-display text-xl font-bold tracking-tight text-bsb-text-primary">登录</CardTitle>
    <CardDescription class="text-sm text-bsb-text-tertiary">生物样本储存管理系统</CardDescription>
</CardHeader>
```

**Step 4: 提交按钮样式修正**

确认 Button 使用 `bg-bsb-accent-brand`（已映射为 Notion Blue）。

**Step 5: RegisterPage.vue 做同样处理**

**Step 6: 提交**

```bash
git add BSB-Frontend/src/pages/auth/LoginPage.vue BSB-Frontend/src/pages/auth/RegisterPage.vue
git commit -m "refactor(frontend): restyle auth pages with Notion warm white background"
```

---

## Task 6：仪表盘升级（P3）

**Files:**
- Modify: `BSB-Frontend/src/pages/dashboard/DashboardPage.vue`

**Step 1: 添加欢迎消息区**

```vue
<div class="mb-6">
    <h1 class="font-display text-3xl font-bold tracking-tight text-bsb-text-primary">
        你好，{{ auth.user?.nickname || auth.user?.username }}
    </h1>
    <p class="mt-1 text-sm text-bsb-text-tertiary">欢迎回到 BSB 生物样本储存管理系统</p>
</div>
```

**Step 2: 指标数字改用 36px**

```vue
<div class="text-4xl font-display font-bold tracking-tight text-bsb-text-primary">
    {{ boxCount }}
</div>
<p class="mt-1 text-xs text-bsb-text-tertiary">个储存盒</p>
```

**Step 3: 卡片图标区增加色块**

```vue
<CardHeader class="pb-2">
    <div class="flex items-center justify-between">
        <CardTitle class="text-sm font-medium text-bsb-text-secondary">储存盒</CardTitle>
        <div class="flex size-8 items-center justify-center rounded-lg bg-[#f2f9ff]">
            <Box class="size-4 text-[#0075de]" />
        </div>
    </div>
</CardHeader>
```

**Step 4: 引入 auth store**（用于获取用户名）

```vue
import { useAuthStore } from '@/stores/auth';
const auth = useAuthStore();
```

**Step 5: 提交**

```bash
git add BSB-Frontend/src/pages/dashboard/DashboardPage.vue
git commit -m "refactor(frontend): enhance dashboard with welcome message and icon accents"
```

---

## Task 7：储存盒详情格子优化（P4）

**Files:**
- Modify: `BSB-Frontend/src/pages/box/BoxDetailPage.vue`

**Step 1: 格子尺寸从 `size-16` 改为 `size-20`**

**Step 2: 试剂名字号从 `text-[10px]` 改为 `text-xs`（12px）**

**Step 3: 占用格子样式改为 accent 条纹**

```vue
:class="cell
    ? 'border-[#0075de]/30 bg-[#f2f9ff] border-l-[3px] border-l-[#0075de] hover:border-[#0075de]/50'
    : 'border-bsb-border-subtle bg-bsb-bg-surface hover:bg-bsb-bg-secondary'"
```

**Step 4: 提交**

```bash
git add BSB-Frontend/src/pages/box/BoxDetailPage.vue
git commit -m "refactor(frontend): improve storage box grid cell sizing and reagent accent style"
```

---

## Task 8：个人设置页 Tabs 重构（P4）

**Files:**
- Modify: `BSB-Frontend/src/pages/user/ProfilePage.vue`
- 需安装 shadcn tabs 组件（如未安装）

**Step 1: 检查是否已有 tabs 组件**

```bash
ls BSB-Frontend/src/components/ui/tabs/
```

如无：`pnpm dlx shadcn-vue@latest add tabs`

**Step 2: 用 Tabs 包裹两个表单区**

```vue
<Tabs default-value="info" class="max-w-lg">
    <TabsList class="mb-6">
        <TabsTrigger value="info">基本信息</TabsTrigger>
        <TabsTrigger value="password">修改密码</TabsTrigger>
    </TabsList>
    <TabsContent value="info">
        <!-- 基本信息表单 -->
    </TabsContent>
    <TabsContent value="password">
        <!-- 密码修改表单 -->
    </TabsContent>
</Tabs>
```

**Step 3: 提交**

```bash
git add BSB-Frontend/src/pages/user/ProfilePage.vue BSB-Frontend/src/components/ui/tabs/
git commit -m "refactor(frontend): use Tabs layout for profile settings page"
```

---

## Task 9：单元测试补全（P4）

### 9.1 org store 单元测试

**Files:**
- Create: `BSB-Frontend/test/unit/stores/org.spec.ts`

```typescript
import { setActivePinia, createPinia } from 'pinia';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useOrgStore } from '@/stores/org';

const mockOrgs = [
    { id: 'org-1', name: 'Lab Alpha', description: null, ownerId: 'user-1', createdAt: '2024-01-01T00:00:00.000Z' },
    { id: 'org-2', name: 'Lab Beta', description: 'Beta lab', ownerId: 'user-2', createdAt: '2024-01-02T00:00:00.000Z' },
];

vi.mock('@/api/modules/org', () => ({
    listOrgs: vi.fn(() => ({ send: vi.fn().mockResolvedValue(mockOrgs) })),
}));

describe('org store', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        vi.clearAllMocks();
    });

    it('orgs is empty initially', () => {
        const org = useOrgStore();
        expect(org.orgs).toEqual([]);
    });

    it('currentOrgId is null initially', () => {
        const org = useOrgStore();
        expect(org.currentOrgId).toBeNull();
    });

    it('fetchOrgs populates orgs', async () => {
        const org = useOrgStore();
        await org.fetchOrgs();
        expect(org.orgs).toEqual(mockOrgs);
    });

    it('fetchOrgs sets currentOrgId to first org', async () => {
        const org = useOrgStore();
        await org.fetchOrgs();
        expect(org.currentOrgId).toBe('org-1');
    });

    it('currentOrg computed returns correct org', async () => {
        const org = useOrgStore();
        await org.fetchOrgs();
        org.currentOrgId = 'org-2';
        expect(org.currentOrg?.name).toBe('Lab Beta');
    });

    it('currentOrg is null when no orgs', () => {
        const org = useOrgStore();
        expect(org.currentOrg).toBeNull();
    });
});
```

**Step 2: 运行测试　**

```bash
pnpm --filter BSB-Frontend test
```

**Step 3: 提交**

```bash
git add BSB-Frontend/test/unit/stores/org.spec.ts
git commit -m "test(frontend): add org store unit tests"
```

### 9.2 ui store 单元测试

**Files:**
- Create: `BSB-Frontend/test/unit/stores/ui.spec.ts`

```typescript
import { setActivePinia, createPinia } from 'pinia';
import { describe, it, expect, beforeEach } from 'vitest';
import { useUiStore } from '@/stores/ui';

describe('ui store', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('sidebarCollapsed is false by default', () => {
        const ui = useUiStore();
        expect(ui.sidebarCollapsed).toBe(false);
    });

    it('toggleSidebar flips sidebarCollapsed', () => {
        const ui = useUiStore();
        ui.toggleSidebar();
        expect(ui.sidebarCollapsed).toBe(true);
        ui.toggleSidebar();
        expect(ui.sidebarCollapsed).toBe(false);
    });
});
```

**Step: 运行、提交**

```bash
pnpm --filter BSB-Frontend test
git add BSB-Frontend/test/unit/stores/ui.spec.ts
git commit -m "test(frontend): add ui store unit tests"
```

### 9.3 box/org schema 单元测试

**Files:**
- Create: `BSB-Frontend/test/unit/schemas/box.spec.ts`
- Create: `BSB-Frontend/test/unit/schemas/org.spec.ts`

**box.spec.ts 核心测试点**：
- `BoxSchema`：`rows`/`cols` 必须为正整数（> 0）
- `Reagent` position 格式：`"1-1"` 合法，`"0-1"` / `"abc"` 不合法（按 schema 实际校验逻辑）

**org.spec.ts 核心测试点**：
- `CreateOrgFormSchema`：name 必填，description 可选

**Step: 写完后运行、提交**

```bash
pnpm --filter BSB-Frontend test
git add BSB-Frontend/test/unit/schemas/box.spec.ts BSB-Frontend/test/unit/schemas/org.spec.ts
git commit -m "test(frontend): add box and org schema unit tests"
```

---

## Task 10：E2E 测试扩展（P5）

**前提：后端服务在本地运行（`http://localhost:3000`），dev server 在 `http://localhost:8081`**

### 10.1 Playwright 配置增加 globalSetup

**Files:**
- Create: `BSB-Frontend/test/e2e/global-setup.ts`
- Modify: `BSB-Frontend/playwright.config.ts`

**global-setup.ts：**

```typescript
import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
    const { baseURL } = config.projects[0].use;
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto(`${baseURL}/login`);
    await page.fill('input[name="account"]', process.env.E2E_USER ?? 'testuser');
    await page.fill('input[name="password"]', process.env.E2E_PASSWORD ?? 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    await page.context().storageState({ path: 'test/e2e/.auth.json' });
    await browser.close();
}

export default globalSetup;
```

**playwright.config.ts 增加：**

```typescript
globalSetup: './test/e2e/global-setup.ts',
```

### 10.2 auth.spec.ts 扩展

在现有 2 个测试后追加：

```typescript
test('successful login redirects to dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="account"]', process.env.E2E_USER ?? 'testuser');
    await page.fill('input[name="password"]', process.env.E2E_PASSWORD ?? 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);
});
```

### 10.3 navigation.spec.ts

**Files:**
- Create: `BSB-Frontend/test/e2e/navigation.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test('unauthenticated access to /dashboard redirects to /login', async ({ page }) => {
    // 不携带 session，访问受保护页面
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
});
```

### 10.4 dashboard.spec.ts

**Files:**
- Create: `BSB-Frontend/test/e2e/dashboard.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.use({ storageState: 'test/e2e/.auth.json' });

test('dashboard loads with metric cards', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('text=储存盒')).toBeVisible();
    await expect(page.locator('text=组织')).toBeVisible();
});
```

### 10.5 运行 E2E 并提交

```bash
pnpm --filter BSB-Frontend test:e2e
git add BSB-Frontend/test/e2e/ BSB-Frontend/playwright.config.ts
git commit -m "test(frontend): add E2E tests for navigation, dashboard, and auth flows"
```

---

## 变更总览

| 文件 | 变更类型 | 任务 |
|---|---|---|
| `src/style.css` | 修改（Token 重映射 + 字体引入） | T2, T3 |
| `src/layouts/AppLayout.vue` | 修改（侧边栏/顶栏亮色样式） | T4 |
| `src/pages/auth/LoginPage.vue` | 修改（name 属性 + 视觉改版） | T1, T5 |
| `src/pages/auth/RegisterPage.vue` | 修改（name 属性 + 视觉改版） | T1, T5 |
| `src/pages/dashboard/DashboardPage.vue` | 修改（欢迎信息 + 卡片升级） | T6 |
| `src/pages/box/BoxDetailPage.vue` | 修改（格子大小 + 试剂样式） | T7 |
| `src/pages/user/ProfilePage.vue` | 修改（Tabs 布局） | T8 |
| `test/e2e/auth.spec.ts` | 修改 + 扩展 | T1, T10 |
| `test/e2e/global-setup.ts` | 新建 | T10 |
| `test/e2e/navigation.spec.ts` | 新建 | T10 |
| `test/e2e/dashboard.spec.ts` | 新建 | T10 |
| `test/unit/stores/org.spec.ts` | 新建 | T9 |
| `test/unit/stores/ui.spec.ts` | 新建 | T9 |
| `test/unit/schemas/box.spec.ts` | 新建 | T9 |
| `test/unit/schemas/org.spec.ts` | 新建 | T9 |
| `playwright.config.ts` | 修改（增加 globalSetup） | T10 |

---

## 执行选项

**计划已保存。两种执行方式：**

**1. 在本会话中逐任务实施（Subagent-Driven）**
- 本会话中调用子 agent 逐任务执行
- 每个任务完成后可人工检查

**2. 在新会话中执行（Parallel Session）**
- 打开新会话，加载此 plan 文件
- 按 Task 顺序批量执行

**请选择执行方式，或直接说"开始执行 Task 1"。**
