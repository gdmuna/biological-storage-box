# BSB Backend-Frontend 接口对齐与业务修复 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 全量对齐 BSB-Backend 已暴露接口与 BSB-Frontend 业务实现，补齐未实现功能并修复现有业务缺陷，保证关键用户流可测且可回归。

**Architecture:** 采用“契约先行 + 前端分层落地”策略：先补 schema/API contract，再接入 store/page，最后以 Vitest + Playwright 验证。遵循 Page -> Store(Pinia) -> API(Alova) 单向链路，避免页面直接拼接请求；每个功能按 TDD 小步提交，先写失败测试再最小实现。

**Tech Stack:** Vue 3 + TypeScript + Pinia + Alova + Zod + Vitest + Playwright

---

## 范围基线（已核对）

后端已实现但前端未完整覆盖的接口族：

- `root/*`（房间/位置）
- `box/image/*`（储存盒图片）
- `box/log/*` 与 `feedback/add`（日志与反馈）
- `errors/*`（错误目录）
- `user/email/*` 与 `user/update/email`（邮箱验证码相关）

已确认前端业务缺陷（当前代码可见）：

- `BoxListPage` 点击“新建”跳转 `/box/new`，但路由未注册。
- `DashboardPage` 仅 `onMounted` 拉取 box 统计，切换组织后统计不刷新。
- `OrgManagePage` 在成员/待处理 tab 下切换组织不会自动重载列表。
- E2E 测试仍使用 `/boxes` 路径，和当前路由 `/box` 不一致。

---

### Task 1: 建立接口覆盖基线测试（红灯）

**Files:**
- Create: `BSB-Frontend/test/unit/api/backend-parity.spec.ts`
- Modify: `BSB-Frontend/test/unit/api/box.spec.ts`
- Test: `BSB-Frontend/test/unit/api/backend-parity.spec.ts`

**Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { backendRoutes, frontendRoutes } from '../fixtures/route-parity.fixture';

describe('backend/frontend route parity', () => {
  it('frontend should cover all required backend business routes', () => {
    const requiredMissing = backendRoutes.filter((r) => !frontendRoutes.includes(r));
    expect(requiredMissing).toEqual([]);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter BSB-Frontend test -- test/unit/api/backend-parity.spec.ts`
Expected: FAIL with missing route list containing `root/*`, `box/image/*`, `feedback/add` 等。

**Step 3: Write minimal implementation**

```ts
// test/unit/fixtures/route-parity.fixture.ts
export const backendRoutes = [
  '/root/add', '/root/del', '/root/one', '/root/list', '/root/update',
  '/box/image/add', '/box/image/list', '/box/image/compare', '/box/image/del',
  '/box/log/list', '/box/log/reagent/list', '/feedback/add',
  '/errors', '/errors/:exceptionCode',
  '/user/email/code', '/user/email/login', '/user/update/email', '/user/email/update/password'
];

export const frontendRoutes = [];
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter BSB-Frontend test -- test/unit/api/backend-parity.spec.ts`
Expected: PASS（此时仅基线存在，后续任务逐步填满 `frontendRoutes`）。

**Step 5: Commit**

```bash
git add BSB-Frontend/test/unit/api/backend-parity.spec.ts BSB-Frontend/test/unit/fixtures/route-parity.fixture.ts BSB-Frontend/test/unit/api/box.spec.ts
git commit -m "test(frontend): add backend-frontend route parity baseline"
```

### Task 2: 补齐缺失 schema 契约

**Files:**
- Create: `BSB-Frontend/src/schemas/root.schema.ts`
- Create: `BSB-Frontend/src/schemas/feedback.schema.ts`
- Modify: `BSB-Frontend/src/schemas/box.schema.ts`
- Modify: `BSB-Frontend/src/schemas/user.schema.ts`
- Test: `BSB-Frontend/test/unit/schemas/root.spec.ts`

**Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { RootSchema } from '@/schemas/root.schema';

describe('RootSchema', () => {
  it('parses root payload from backend', () => {
    const parsed = RootSchema.safeParse({ id: 'r1', orgId: 'o1', name: 'A区', description: null, createdAt: '2026-01-01' });
    expect(parsed.success).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter BSB-Frontend test -- test/unit/schemas/root.spec.ts`
Expected: FAIL with module not found (`root.schema.ts`).

**Step 3: Write minimal implementation**

```ts
// src/schemas/root.schema.ts
import { z } from 'zod/v4';

export const RootSchema = z.object({
  id: z.string(),
  orgId: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  createdAt: z.string(),
});

export type Root = z.infer<typeof RootSchema>;
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter BSB-Frontend test -- test/unit/schemas/root.spec.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add BSB-Frontend/src/schemas/root.schema.ts BSB-Frontend/src/schemas/feedback.schema.ts BSB-Frontend/src/schemas/box.schema.ts BSB-Frontend/src/schemas/user.schema.ts BSB-Frontend/test/unit/schemas/root.spec.ts
git commit -m "feat(frontend): add missing schemas for root feedback box-image and email flows"
```

### Task 3: 新增 root / box-image / feedback / errors API 模块

**Files:**
- Create: `BSB-Frontend/src/api/modules/root.ts`
- Create: `BSB-Frontend/src/api/modules/box-image.ts`
- Create: `BSB-Frontend/src/api/modules/feedback.ts`
- Create: `BSB-Frontend/src/api/modules/errors.ts`
- Modify: `BSB-Frontend/test/unit/fixtures/route-parity.fixture.ts`
- Test: `BSB-Frontend/test/unit/api/root.spec.ts`

**Step 1: Write the failing test**

```ts
import { describe, it, expect, vi } from 'vitest';
import { alovaInstance } from '@/api/client';
import { listRoots } from '@/api/modules/root';

vi.mock('@/api/client', () => ({
  alovaInstance: { Get: vi.fn(), Post: vi.fn(), Put: vi.fn(), Delete: vi.fn() }
}));

describe('root API', () => {
  it('calls Get /root/list', () => {
    listRoots('org-1');
    expect(alovaInstance.Get).toHaveBeenCalledWith('/root/list', { params: { orgId: 'org-1' } });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter BSB-Frontend test -- test/unit/api/root.spec.ts`
Expected: FAIL with missing module `@/api/modules/root`。

**Step 3: Write minimal implementation**

```ts
// src/api/modules/root.ts
import { alovaInstance } from '../client';

export const listRoots = (orgId: string) => alovaInstance.Get('/root/list', { params: { orgId } });
export const getRoot = (id: string) => alovaInstance.Get('/root/one', { params: { id } });
export const createRoot = (data: { orgId: string; name: string; description?: string }) => alovaInstance.Post('/root/add', data);
export const updateRoot = (data: { id: string; name?: string; description?: string }) => alovaInstance.Put('/root/update', data);
export const deleteRoot = (id: string) => alovaInstance.Delete('/root/del', { data: { id } });
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter BSB-Frontend test -- test/unit/api/root.spec.ts test/unit/api/backend-parity.spec.ts`
Expected: PASS（parity 缺口减少）。

**Step 5: Commit**

```bash
git add BSB-Frontend/src/api/modules/root.ts BSB-Frontend/src/api/modules/box-image.ts BSB-Frontend/src/api/modules/feedback.ts BSB-Frontend/src/api/modules/errors.ts BSB-Frontend/test/unit/api/root.spec.ts BSB-Frontend/test/unit/fixtures/route-parity.fixture.ts
git commit -m "feat(frontend): add API modules for root box-image feedback and errors"
```

### Task 4: 扩展 user API 支持邮箱验证码流程

**Files:**
- Modify: `BSB-Frontend/src/api/modules/user.ts`
- Modify: `BSB-Frontend/test/unit/api/user.spec.ts`
- Modify: `BSB-Frontend/test/unit/fixtures/route-parity.fixture.ts`
- Test: `BSB-Frontend/test/unit/api/user.spec.ts`

**Step 1: Write the failing test**

```ts
it('calls Get /user/email/code with email param', () => {
  sendEmailCode('a@b.com');
  expect(alovaInstance.Get).toHaveBeenCalledWith('/user/email/code', { params: { email: 'a@b.com' } });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter BSB-Frontend test -- test/unit/api/user.spec.ts`
Expected: FAIL with `sendEmailCode is not defined`。

**Step 3: Write minimal implementation**

```ts
export const sendEmailCode = (email: string) =>
  alovaInstance.Get<void>('/user/email/code', { params: { email } });

export const emailLogin = (data: { email: string; code: string }) =>
  alovaInstance.Post<{ accessToken: string; user: { id: string; username: string; email: string } }>(
    '/user/email/login',
    data
  );

export const updateEmail = (data: { email: string; code: string }) =>
  alovaInstance.Put('/user/update/email', data);

export const emailUpdatePassword = (data: { email: string; code: string; newPassword: string }) =>
  alovaInstance.Put('/user/email/update/password', data);
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter BSB-Frontend test -- test/unit/api/user.spec.ts test/unit/api/backend-parity.spec.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add BSB-Frontend/src/api/modules/user.ts BSB-Frontend/test/unit/api/user.spec.ts BSB-Frontend/test/unit/fixtures/route-parity.fixture.ts
git commit -m "feat(frontend): add email verification user APIs"
```

### Task 5: 修复 Box 新建路由缺失（业务 Bug）

**Files:**
- Create: `BSB-Frontend/src/pages/box/BoxCreatePage.vue`
- Modify: `BSB-Frontend/src/router/index.ts`
- Modify: `BSB-Frontend/src/pages/box/BoxListPage.vue`
- Test: `BSB-Frontend/test/e2e/box-create.spec.ts`

**Step 1: Write the failing test**

```ts
import { test, expect } from '@playwright/test';

test('open create box page from box list', async ({ page }) => {
  await page.goto('/box');
  await page.getByRole('button', { name: '新建' }).click();
  await expect(page).toHaveURL(/\/box\/new/);
  await expect(page.getByRole('heading', { name: '新建储存盒' })).toBeVisible();
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter BSB-Frontend test:e2e -- test/e2e/box-create.spec.ts`
Expected: FAIL with navigation 404 / no matching route。

**Step 3: Write minimal implementation**

```ts
// router
{ path: 'box/new', component: () => import('@/pages/box/BoxCreatePage.vue') }
```

```vue
<!-- BoxCreatePage.vue: 使用 createBox + listRoots，创建成功后 router.push('/box') -->
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter BSB-Frontend test:e2e -- test/e2e/box-create.spec.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add BSB-Frontend/src/pages/box/BoxCreatePage.vue BSB-Frontend/src/router/index.ts BSB-Frontend/src/pages/box/BoxListPage.vue BSB-Frontend/test/e2e/box-create.spec.ts
git commit -m "fix(frontend): add missing box creation route and page"
```

### Task 6: 修复 Dashboard 组织切换后统计不刷新（业务 Bug）

**Files:**
- Modify: `BSB-Frontend/src/pages/dashboard/DashboardPage.vue`
- Create: `BSB-Frontend/test/unit/pages/dashboard.spec.ts`
- Test: `BSB-Frontend/test/unit/pages/dashboard.spec.ts`

**Step 1: Write the failing test**

```ts
it('refetches box count when org.currentOrgId changes', async () => {
  // mock store + listBoxes
  // expect listBoxes called twice after org switch
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter BSB-Frontend test -- test/unit/pages/dashboard.spec.ts`
Expected: FAIL with expected call count mismatch (only called once)。

**Step 3: Write minimal implementation**

```ts
watch(
  () => org.currentOrgId,
  async (id) => {
    if (!id) return;
    const boxes = await listBoxes(id).send();
    boxCount.value = Array.isArray(boxes) ? boxes.length : 0;
  },
  { immediate: true }
);
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter BSB-Frontend test -- test/unit/pages/dashboard.spec.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add BSB-Frontend/src/pages/dashboard/DashboardPage.vue BSB-Frontend/test/unit/pages/dashboard.spec.ts
git commit -m "fix(frontend): refresh dashboard metrics on org switch"
```

### Task 7: 修复 Org 管理页组织切换不重载成员/待处理（业务 Bug）

**Files:**
- Modify: `BSB-Frontend/src/pages/org/OrgManagePage.vue`
- Create: `BSB-Frontend/test/unit/pages/org-manage.spec.ts`
- Test: `BSB-Frontend/test/unit/pages/org-manage.spec.ts`

**Step 1: Write the failing test**

```ts
it('reloads members and pending list when currentOrgId changes in members tab', async () => {
  // set activeTab=members; switch org; expect loadMembers invoked
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter BSB-Frontend test -- test/unit/pages/org-manage.spec.ts`
Expected: FAIL because watcher missing。

**Step 3: Write minimal implementation**

```ts
watch(
  () => org.currentOrgId,
  () => {
    if ((activeTab.value === 'members' || activeTab.value === 'pending') && org.currentOrgId) {
      loadMembers();
    }
  }
);
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter BSB-Frontend test -- test/unit/pages/org-manage.spec.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add BSB-Frontend/src/pages/org/OrgManagePage.vue BSB-Frontend/test/unit/pages/org-manage.spec.ts
git commit -m "fix(frontend): reload org member data after organization switch"
```

### Task 8: 落地 Root（房间/位置）管理 UI 与业务链路

**Files:**
- Create: `BSB-Frontend/src/components/root/RootManager.vue`
- Modify: `BSB-Frontend/src/pages/box/BoxCreatePage.vue`
- Modify: `BSB-Frontend/src/pages/box/BoxListPage.vue`
- Create: `BSB-Frontend/test/unit/components/root-manager.spec.ts`
- Test: `BSB-Frontend/test/e2e/root-management.spec.ts`

**Step 1: Write the failing test**

```ts
test('can create root and select it when creating box', async ({ page }) => {
  await page.goto('/box/new');
  await page.getByRole('button', { name: '新建房间' }).click();
  await page.getByLabel('名称').fill('冷冻区A');
  await page.getByRole('button', { name: '创建' }).click();
  await expect(page.getByText('冷冻区A')).toBeVisible();
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter BSB-Frontend test:e2e -- test/e2e/root-management.spec.ts`
Expected: FAIL (UI/接口未接入)。

**Step 3: Write minimal implementation**

```ts
// RootManager.vue: listRoots/createRoot/updateRoot/deleteRoot
// 对外 emits: created/updated/deleted/select
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter BSB-Frontend test:e2e -- test/e2e/root-management.spec.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add BSB-Frontend/src/components/root/RootManager.vue BSB-Frontend/src/pages/box/BoxCreatePage.vue BSB-Frontend/src/pages/box/BoxListPage.vue BSB-Frontend/test/unit/components/root-manager.spec.ts BSB-Frontend/test/e2e/root-management.spec.ts
git commit -m "feat(frontend): implement root management and box root binding"
```

### Task 9: 落地 Box Image（上传/列表/比对/删除）

**Files:**
- Modify: `BSB-Frontend/src/pages/box/BoxDetailPage.vue`
- Modify: `BSB-Frontend/src/api/modules/box-image.ts`
- Create: `BSB-Frontend/test/unit/api/box-image.spec.ts`
- Create: `BSB-Frontend/test/e2e/box-image.spec.ts`
- Test: `BSB-Frontend/test/e2e/box-image.spec.ts`

**Step 1: Write the failing test**

```ts
test('can upload and compare box image', async ({ page }) => {
  await page.goto('/box/box-1');
  await page.setInputFiles('input[type="file"]', 'test/fixtures/box.png');
  await page.getByRole('button', { name: '开始比对' }).click();
  await expect(page.getByText('比对结果')).toBeVisible();
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter BSB-Frontend test:e2e -- test/e2e/box-image.spec.ts`
Expected: FAIL（无图片区域与比对流程）。

**Step 3: Write minimal implementation**

```ts
// BoxDetailPage 新增：
// 1) uploadFile(file) -> imageUrl
// 2) createBoxImage({ boxId, imageUrl })
// 3) compareBoxImage({ boxId, imageUrl })
// 4) listBoxImages(boxId), deleteBoxImage(id)
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter BSB-Frontend test:e2e -- test/e2e/box-image.spec.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add BSB-Frontend/src/pages/box/BoxDetailPage.vue BSB-Frontend/src/api/modules/box-image.ts BSB-Frontend/test/unit/api/box-image.spec.ts BSB-Frontend/test/e2e/box-image.spec.ts
git commit -m "feat(frontend): add box image upload list compare and delete flows"
```

### Task 10: 落地日志与反馈业务（box log / reagent log / feedback）

**Files:**
- Create: `BSB-Frontend/src/components/feedback/FeedbackPanel.vue`
- Modify: `BSB-Frontend/src/pages/box/BoxDetailPage.vue`
- Modify: `BSB-Frontend/src/pages/reagent/ReagentPage.vue`
- Create: `BSB-Frontend/test/unit/api/feedback.spec.ts`
- Create: `BSB-Frontend/test/e2e/feedback.spec.ts`
- Test: `BSB-Frontend/test/e2e/feedback.spec.ts`

**Step 1: Write the failing test**

```ts
test('can submit feedback from box detail', async ({ page }) => {
  await page.goto('/box/box-1');
  await page.getByPlaceholder('输入反馈内容').fill('比对结果有偏差');
  await page.getByRole('button', { name: '提交反馈' }).click();
  await expect(page.getByText('提交成功')).toBeVisible();
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter BSB-Frontend test:e2e -- test/e2e/feedback.spec.ts`
Expected: FAIL（无反馈组件与调用）。

**Step 3: Write minimal implementation**

```ts
// feedback.ts API
export const listBoxLogs = (params: { boxId: string; limit?: number; offset?: number }) =>
  alovaInstance.Get('/box/log/list', { params });

export const listReagentLogs = (params: { reagentId: string; limit?: number; offset?: number }) =>
  alovaInstance.Get('/box/log/reagent/list', { params });

export const createFeedback = (content: string) =>
  alovaInstance.Post('/feedback/add', { content });
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter BSB-Frontend test:e2e -- test/e2e/feedback.spec.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add BSB-Frontend/src/components/feedback/FeedbackPanel.vue BSB-Frontend/src/pages/box/BoxDetailPage.vue BSB-Frontend/src/pages/reagent/ReagentPage.vue BSB-Frontend/src/api/modules/feedback.ts BSB-Frontend/test/unit/api/feedback.spec.ts BSB-Frontend/test/e2e/feedback.spec.ts
git commit -m "feat(frontend): implement logs and feedback workflows"
```

### Task 11: 落地邮箱验证码登录/改密/改邮箱流程

**Files:**
- Create: `BSB-Frontend/src/pages/auth/EmailLoginPage.vue`
- Create: `BSB-Frontend/src/components/user/EmailSecurityPanel.vue`
- Modify: `BSB-Frontend/src/router/index.ts`
- Modify: `BSB-Frontend/src/pages/user/ProfilePage.vue`
- Modify: `BSB-Frontend/src/stores/auth.ts`
- Create: `BSB-Frontend/test/e2e/email-auth.spec.ts`
- Test: `BSB-Frontend/test/e2e/email-auth.spec.ts`

**Step 1: Write the failing test**

```ts
test('email code login works', async ({ page }) => {
  await page.goto('/login/email');
  await page.fill('input[name="email"]', 'user@example.com');
  await page.getByRole('button', { name: '发送验证码' }).click();
  await page.fill('input[name="code"]', '123456');
  await page.getByRole('button', { name: '登录' }).click();
  await expect(page).toHaveURL(/\/dashboard/);
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter BSB-Frontend test:e2e -- test/e2e/email-auth.spec.ts`
Expected: FAIL (路由/页面/API未连通)。

**Step 3: Write minimal implementation**

```ts
// auth store
async function doEmailLogin(payload: { email: string; code: string }) {
  const result = await emailLogin(payload).send();
  setAccessToken(result.accessToken);
  user.value = await getMyInfo().send();
  initialized.value = true;
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter BSB-Frontend test:e2e -- test/e2e/email-auth.spec.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add BSB-Frontend/src/pages/auth/EmailLoginPage.vue BSB-Frontend/src/components/user/EmailSecurityPanel.vue BSB-Frontend/src/router/index.ts BSB-Frontend/src/pages/user/ProfilePage.vue BSB-Frontend/src/stores/auth.ts BSB-Frontend/test/e2e/email-auth.spec.ts
git commit -m "feat(frontend): add email code auth and security flows"
```

### Task 12: 修复 E2E 路由回归并完成全量验证

**Files:**
- Modify: `BSB-Frontend/test/e2e/dashboard.spec.ts`
- Modify: `BSB-Frontend/test/e2e/auth.spec.ts`
- Modify: `BSB-Frontend/test/e2e/register.spec.ts`
- Test: `BSB-Frontend/test/e2e/*.spec.ts`

**Step 1: Write the failing test**

```ts
test('navigating to /box does not redirect to login', async ({ page }) => {
  await page.goto('/box');
  await expect(page).not.toHaveURL(/\/login/);
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter BSB-Frontend test:e2e -- test/e2e/dashboard.spec.ts`
Expected: FAIL（旧用例仍访问 `/boxes`）。

**Step 3: Write minimal implementation**

```ts
// 将 dashboard.spec.ts 中 `/boxes` 全部替换为 `/box`
// 并校正 URL 断言中的路径集合
```

**Step 4: Run test to verify it passes**

Run:
- `pnpm --filter BSB-Frontend type-check`
- `pnpm --filter BSB-Frontend test`
- `pnpm --filter BSB-Frontend build`
- `pnpm --filter BSB-Frontend test:e2e`

Expected: ALL PASS

**Step 5: Commit**

```bash
git add BSB-Frontend/test/e2e/dashboard.spec.ts BSB-Frontend/test/e2e/auth.spec.ts BSB-Frontend/test/e2e/register.spec.ts
git commit -m "test(frontend): align e2e routes with current router and stabilize regressions"
```

---

## 执行顺序与约束

1. 严格按 Task 1 -> Task 12 顺序执行，不跳步。
2. 每个 Task 必须先红后绿，未看到 FAIL -> PASS 证据不得进入下一 Task。
3. 每个 Task 独立提交，提交前运行最小必要测试；Task 12 前必须跑全量校验。
4. API 变更必须同步更新 schema 和对应 unit test，避免隐式契约漂移。
5. 页面业务逻辑禁止直接调用裸 fetch，全部通过 `src/api/modules/*`。

## 回归验收清单

- `pnpm --filter BSB-Frontend type-check` 通过
- `pnpm --filter BSB-Frontend test` 通过
- `pnpm --filter BSB-Frontend build` 通过
- `pnpm --filter BSB-Frontend test:e2e` 通过
- 手工验证：登录 -> 组织切换 -> 新建 Root -> 新建 Box -> Box 图片比对 -> 提交反馈 -> 邮箱安全流程
