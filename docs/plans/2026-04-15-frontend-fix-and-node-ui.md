# 前端错误修复与 Node UI 适配实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 修复前端所有已知 Bug（邮箱登录 Token 缺失、路由顺序冲突、E2E 认证失效），并适配后端新增的 Node 模型，提供完整的节点浏览与选择功能。

**Architecture:** 修复采用最小变更原则——先修后端 `emailLogin` 使其返回 Token Pair，再同步修复前端 API 类型与路由配置；Node UI 遵循"Schema → API → Store（如需）→ Page → Router"的正向分层；E2E 改用全等待策略确保 storageState 完整性。

**Tech Stack:** NestJS 11 (Backend) · Vue 3 + Pinia 3 + Alova 3 + Zod v4 + Playwright (Frontend)

---

## 背景与根因分析

通过代码检查（不运行测试）已确认以下 Bug：

| # | 位置 | 问题描述 | 影响 |
|---|------|--------|------|
| B1 | `BSB-Backend/src/modules/user/user.service.ts` | `emailLogin` 返回 `safeUser`，不颁发 Token Pair，也不设置 Refresh Cookie | 邮箱验证码登录后前端无法持有有效 Token，所有后续请求均 401 |
| B2 | `BSB-Frontend/src/router/index.ts` | `box/:id` 路由排在 `box/new` **之前**，`/box/new` 被 Vue Router 匹配为 BoxDetailPage（`id='new'`） | "新建储存盒"按钮点击后打开错误页面 |
| B3 | `BSB-Frontend/src/api/modules/user.ts` | `EmailLoginResponse` 类型定义与 B1 修复后的 API 契约不一致（旧定义缺少 `user` 字段或字段不对齐） | TypeScript 类型错误 |
| B4 | `BSB-Frontend/src/schemas/box.schema.ts` | `BoxSchema` 缺少 `nodeId` / `node` 字段，后端已返回此数据 | 盒子详情、创建时类型不完整 |
| B5 | `BSB-Frontend/test/e2e/global.setup.ts` | `storageState` 在登录成功后立即保存，可能早于 Refresh Cookie 真正写入浏览器上下文；`app` 项目测试全部重定向到 `/login` | 5 个 E2E 测试失败 |

---

## Task 1：后端模块间依赖打通（为 emailLogin 注入 TokenService）

**Files:**
- Modify: `BSB-Backend/src/modules/auth/auth.module.ts`
- Modify: `BSB-Backend/src/modules/user/user.module.ts`

**Background:** `TokenService` 目前仅在 `AuthModule` 内部使用，未对外导出。`UserModule` 无法直接注入它。需要先建立模块间依赖。

**Step 1：导出 TokenService**

编辑 `BSB-Backend/src/modules/auth/auth.module.ts`，在 `@Module` 中添加 `exports`:

```ts
@Module({
    controllers: [AuthController],
    providers: [
        { provide: APP_GUARD, useClass: AuthGuard },
        AuthService,
        TokenService,
    ],
    exports: [TokenService],  // ← 添加这一行
})
export class AuthModule {}
```

**Step 2：在 UserModule 中导入 AuthModule**

编辑 `BSB-Backend/src/modules/user/user.module.ts`：

```ts
import { AuthModule } from '@/modules/auth/auth.module.js';
import { Module } from '@nestjs/common';
import { UserController } from './user.controller.js';
import { UserService } from './user.service.js';
import { UserRepository } from './user.repository.js';
import { EmailVerificationRepository } from './email-verification.repository.js';

@Module({
    imports: [AuthModule],   // ← 添加这一行
    controllers: [UserController],
    providers: [UserService, UserRepository, EmailVerificationRepository],
    exports: [UserService, UserRepository],
})
export class UserModule {}
```

**Step 3：验证编译无报错**

```powershell
pnpm --filter BSB-Backend build
```

预期：`dist/` 生成，无 TypeScript 错误。

---

## Task 2：后端 emailLogin 颁发 Token Pair

**Files:**
- Modify: `BSB-Backend/src/modules/user/user.service.ts`
- Modify: `BSB-Backend/src/modules/user/user.controller.ts`

### Step 1：修改 UserService.emailLogin 返回 Token Pair

在 `user.service.ts` 中：

1. 在构造函数注入 `TokenService`：

```ts
import { TokenService } from '@/modules/auth/services/index.js';
// ... 已有 import

@Injectable()
export class UserService {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly emailVerificationRepository: EmailVerificationRepository,
        private readonly mailService: MailService,
        private readonly configService: ConfigService<AllConfig, true>,
        private readonly tokenService: TokenService,    // ← 添加
    ) {}
```

2. 修改 `emailLogin` 方法，在末尾颁发 Token Pair 并返回完整结构：

```ts
async emailLogin(email: string, code: string) {
    const normalizedEmail = email.trim().toLowerCase();
    await this.verifyEmailCode(normalizedEmail, code);

    const user = await this.userRepository.findByEmail(normalizedEmail);
    if (!user) throw new UserNotFoundException();

    await this.emailVerificationRepository.deleteByEmail(normalizedEmail);

    const { passwordHash: _, ...safeUser } = user;
    const tokenPair = this.tokenService.issueTokenPair({
        userId: user.id,
        username: user.username,
    });
    return { ...tokenPair, user: safeUser };
}
```

### Step 2：修改 UserController.emailLogin 设置 Refresh Cookie

在 `user.controller.ts` 中修改 `emailLogin` 端点：

```ts
import {
    Controller, Get, Put, Post, Body, Query, Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { REFRESH_TOKEN_COOKIE } from '@/constants/auth.constant.js';
// ... 其余 import 不变

// 端点改为：
@Post('email/login')
@ApiRoute({
    auth: 'public',
    summary: '邮箱验证码登录',
    responseType: UserInfoDto,  // 若有对应 DTO 则使用，否则保持原样
    errors: [
        USER_EXCEPTION.UserNotFoundException.code,
        USER_EXCEPTION.VerificationCodeInvalidException.code,
        USER_EXCEPTION.VerificationCodeExpiredException.code,
    ],
})
async emailLogin(
    @Body() body: EmailLoginDto,
    @Res({ passthrough: true }) response: Response,
) {
    const result = await this.userService.emailLogin(body.email, body.code);
    response.cookie(REFRESH_TOKEN_COOKIE.NAME, result.refreshToken, {
        httpOnly: REFRESH_TOKEN_COOKIE.HTTP_ONLY,
        sameSite: REFRESH_TOKEN_COOKIE.SAME_SITE,
        secure: REFRESH_TOKEN_COOKIE.SECURE,
        path: REFRESH_TOKEN_COOKIE.PATH,
        maxAge: REFRESH_TOKEN_COOKIE.MAX_AGE_MS,
    });
    return { accessToken: result.accessToken, user: result.user };
}
```

### Step 3：后端编译验证

```powershell
pnpm --filter BSB-Backend build
```

预期：无编译报错。

---

## Task 3：后端 emailLogin 单元测试

**Files:**
- Modify: `BSB-Backend/test/unit/modules/user/user.service.spec.ts`（若不存在则创建）
- Modify: `BSB-Backend/test/e2e/user.e2e-spec.ts`（若不存在则创建）

> 先找到已有的 user.service 测试文件路径，在其中添加测试用例。

### Step 1：确认测试文件路径

```powershell
Get-ChildItem -Recurse BSB-Backend/test -Filter "user*.spec.ts"
```

### Step 2：添加 emailLogin 单元测试

在 `user.service.spec.ts` 中添加 `emailLogin` 测试块（假设已 mock UserRepository、EmailVerificationRepository、TokenService）：

```ts
describe('emailLogin', () => {
    it('验证码合法时返回 accessToken、refreshToken 和 user', async () => {
        // Arrange
        const email = 'test@example.com';
        const code = '123456';
        const now = new Date();
        const fakeRecord = { code, expiresAt: new Date(now.getTime() + 60_000), email };
        const fakeUser = {
            id: 'uid',
            username: 'alice',
            email,
            passwordHash: 'hash',
            nickname: null,
            realname: null,
            createdAt: now,
            updatedAt: now,
        };

        emailVerificationRepo.findLatestByEmail.mockResolvedValueOnce(fakeRecord);
        userRepo.findByEmail.mockResolvedValueOnce(fakeUser);
        emailVerificationRepo.deleteByEmail.mockResolvedValueOnce(undefined);
        tokenService.issueTokenPair.mockReturnValueOnce({
            accessToken: 'at',
            refreshToken: 'rt',
        });

        // Act
        const result = await service.emailLogin(email, code);

        // Assert
        expect(result.accessToken).toBe('at');
        expect(result.refreshToken).toBe('rt');
        expect(result.user.id).toBe('uid');
        expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('验证码无效时抛出 VerificationCodeInvalidException', async () => {
        emailVerificationRepo.findLatestByEmail.mockResolvedValueOnce(null);
        await expect(service.emailLogin('test@example.com', 'badcode')).rejects.toThrow();
    });

    it('验证码过期时抛出 VerificationCodeExpiredException', async () => {
        const expired = { code: '123456', expiresAt: new Date(Date.now() - 1000), email: 'test@example.com' };
        emailVerificationRepo.findLatestByEmail.mockResolvedValueOnce(expired);
        await expect(service.emailLogin('test@example.com', '123456')).rejects.toThrow();
    });
});
```

### Step 3：运行单元测试验证

```powershell
pnpm --filter BSB-Backend test
```

预期：所有测试套件通过（绿勾）。

---

## Task 4：修复前端路由顺序

**Files:**
- Modify: `BSB-Frontend/src/router/index.ts`

**Problem:** 当前路由配置中 `box/:id` 排在 `box/new` 之前，导致 `/box/new` 被 Vue Router 优先匹配为带参数 `id='new'` 的 BoxDetailPage。

### Step 1：调整路由定义顺序

将 `box/new` 移到 `box/:id` **之前**：

```ts
// 调整后顺序：
{
    path: 'box',
    component: () => import('@/pages/box/BoxListPage.vue'),
},
{
    path: 'box/new',           // ← 必须在 box/:id 之前
    component: () => import('@/pages/box/BoxCreatePage.vue'),
},
{
    path: 'box/:id',
    component: () => import('@/pages/box/BoxDetailPage.vue'),
},
```

### Step 2：类型检查

```powershell
pnpm --filter BSB-Frontend type-check
```

预期：无报错。

---

## Task 5：前端 API 类型修复（EmailLoginResponse）

**Files:**
- Modify: `BSB-Frontend/src/api/modules/user.ts`
- Modify: `BSB-Frontend/src/stores/auth.ts`（如有必要）

### Step 1：阅读当前 user.ts 中 emailLogin 相关类型

```
src/api/modules/user.ts
src/stores/auth.ts
```

确认 `EmailLoginResponse` 和 `doEmailLogin` 的当前定义。

### Step 2：更新 API 类型（对齐修复后的后端）

后端修复后，`POST /user/email/login` 返回：
```json
{ "success": true, "data": { "accessToken": "...", "user": { "id": "...", "username": "...", "email": "...", ... } } }
```

Alova 拦截器解包后，`result` = `{ accessToken: string, user: UserInfo }`.

在 `user.ts` 确认或修改：

```ts
interface EmailLoginResponse {
    accessToken: string;
    user: {
        id: string;
        username: string;
        email: string;
        nickname: string | null;
        realname: string | null;
    };
}

export const emailLogin = (data: { email: string; code: string }) =>
    alovaInstance.Post<EmailLoginResponse>('/user/email/login', data);
```

### Step 3：对齐 auth store 中 doEmailLogin

在 `src/stores/auth.ts` 中，`doEmailLogin` 应与 `doLogin` 结构一致：

```ts
async function doEmailLogin(form: { email: string; code: string }) {
    const result = await emailLogin(form).send();
    setAccessToken(result.accessToken);
    user.value = result.user;      // 直接使用 response 中的 user（无需再次请求）
    initialized.value = true;
}
```

若 `user.value` 类型与 `result.user` 不完全匹配，可在 `doEmailLogin` 末尾补调 `user.value = await getMyInfo().send()` 保证同步，与 `doLogin` 保持一致。

### Step 4：类型检查

```powershell
pnpm --filter BSB-Frontend type-check
```

预期：无报错。

---

## Task 6：前端 BoxSchema 补充 nodeId 字段

**Files:**
- Modify: `BSB-Frontend/src/schemas/box.schema.ts`

### Step 1：阅读当前 BoxSchema 定义

先查看 `src/schemas/box.schema.ts` 当前全部内容。

### Step 2：添加 nodeId 和 node 字段

在 `BoxSchema`（储存盒详情 Schema）中添加可选字段：

```ts
// 在 BoxSchema 适当位置添加：
nodeId: z.string().nullable().optional(),
node: z.object({
    id: z.string(),
    name: z.string(),
}).nullable().optional(),
```

### Step 3：类型检查

```powershell
pnpm --filter BSB-Frontend type-check
```

---

## Task 7：前端 Node Schema 与 API 模块

**Files:**
- Create: `BSB-Frontend/src/schemas/node.schema.ts`
- Create: `BSB-Frontend/src/api/modules/node.ts`

### Step 1：先确认后端 Node API 返回结构

查看 `BSB-Backend/src/modules/node/node.controller.ts` 和 `node.dto.ts`，了解返回的 DTO 字段。

### Step 2：创建 NodeSchema

`src/schemas/node.schema.ts`：

```ts
import { z } from 'zod';

export const NodeSchema = z.object({
    id: z.string(),
    name: z.string(),
    parentId: z.string().nullable(),
    orgId: z.string(),
    description: z.string().nullable().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
});

export const NodeListItemSchema = z.object({
    id: z.string(),
    name: z.string(),
    parentId: z.string().nullable(),
    children: z.array(z.lazy((): z.ZodTypeAny => NodeListItemSchema)).optional(),
});

export type Node = z.infer<typeof NodeSchema>;
export type NodeListItem = z.infer<typeof NodeListItemSchema>;
```

### Step 3：确认后端 Node API 端点

查看 `node.controller.ts` 确认以下端点：
- `GET /node/list` - 列出节点（可选支持树形）
- `GET /node/:id` - 获取单个节点详情
- `POST /node` - 创建节点
- `PUT /node/:id` - 更新节点
- `DELETE /node/:id` - 删除节点

根据实际端点调整以下 API 模块。

### Step 4：创建 Node API 模块

`src/api/modules/node.ts`：

```ts
import { alovaInstance } from '@/api/client';
import type { Node, NodeListItem } from '@/schemas/node.schema';

// 列出当前组织的所有节点（平铺）
export const listNodes = () =>
    alovaInstance.Get<NodeListItem[]>('/node/list');

// 获取单个节点详情
export const getNode = (id: string) =>
    alovaInstance.Get<Node>(`/node/${id}`);

// 创建节点
export const createNode = (data: { name: string; parentId?: string | null; description?: string }) =>
    alovaInstance.Post<Node>('/node', data);

// 更新节点
export const updateNode = (id: string, data: { name?: string; description?: string }) =>
    alovaInstance.Put<Node>(`/node/${id}`, data);

// 删除节点
export const deleteNode = (id: string) =>
    alovaInstance.Delete<void>(`/node/${id}`);
```

> **注意：** 端点路径需与 `node.controller.ts` 中实际定义一致，创建前务必核对。

### Step 5：类型检查

```powershell
pnpm --filter BSB-Frontend type-check
```

---

## Task 8：BoxCreatePage 添加节点选择器

**Files:**
- Modify: `BSB-Frontend/src/pages/box/BoxCreatePage.vue`

### Step 1：阅读当前 BoxCreatePage 的完整代码

确认当前表单字段、提交逻辑、Create API 调用方式。

### Step 2：添加 NodeId 选择器

在表单中增加一个可选的节点下拉选择器（非必填）。示例结构：

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { listNodes } from '@/api/modules/node';
import type { NodeListItem } from '@/schemas/node.schema';

// ... 已有代码保持不变 ...

const nodes = ref<NodeListItem[]>([]);
const selectedNodeId = ref<string | null>(null);

onMounted(async () => {
    try {
        nodes.value = await listNodes().send();
    } catch {
        // 节点加载失败时继续，节点选择为非必填
    }
});

// 在 handleSubmit 中将 selectedNodeId 传入 createBox：
// createBox({ ..., nodeId: selectedNodeId.value || undefined })
</script>

<template>
    <!-- 在其他表单字段之后添加 -->
    <div class="form-group">
        <label>存放位置（可选）</label>
        <select v-model="selectedNodeId">
            <option :value="null">— 不指定 —</option>
            <option v-for="n in nodes" :key="n.id" :value="n.id">{{ n.name }}</option>
        </select>
    </div>
</template>
```

> 若 shadcn-vue 已有 `Select` 组件，优先使用它。执行时先检查 `src/components/ui/select.vue` 是否存在。

### Step 3：确认 createBox API 已接受 nodeId

查看 `src/api/modules/box.ts`（或类似文件），确认 `createBox` 函数的参数类型包含 `nodeId?: string | null`。若不包含则添加。

### Step 4：类型检查

```powershell
pnpm --filter BSB-Frontend type-check
```

---

## Task 9：添加 Node 浏览页面与路由

**Files:**
- Create: `BSB-Frontend/src/pages/node/NodePage.vue`
- Modify: `BSB-Frontend/src/router/index.ts`
- Modify: `BSB-Frontend/src/layouts/AppLayout.vue`（或侧边栏组件）

### Step 1：查看侧边栏 / 布局组件结构

```
src/layouts/AppLayout.vue
src/components/  （查找 Sidebar 或 Nav 组件）
```

确认侧边栏如何定义导航链接。

### Step 2：创建 NodePage.vue（最小实现）

`src/pages/node/NodePage.vue`：

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { listNodes } from '@/api/modules/node';
import type { NodeListItem } from '@/schemas/node.schema';

const nodes = ref<NodeListItem[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

onMounted(async () => {
    loading.value = true;
    try {
        nodes.value = await listNodes().send();
    } catch (e: unknown) {
        error.value = e instanceof Error ? e.message : '加载失败';
    } finally {
        loading.value = false;
    }
});
</script>

<template>
    <main class="p-6">
        <h1 class="text-2xl font-semibold mb-4">节点管理</h1>
        <p v-if="loading" class="text-muted-foreground">加载中…</p>
        <p v-else-if="error" class="text-destructive">{{ error }}</p>
        <ul v-else class="space-y-2">
            <li
                v-for="node in nodes"
                :key="node.id"
                class="rounded-lg border px-4 py-2"
            >
                {{ node.name }}
                <span v-if="node.parentId" class="text-xs text-muted-foreground ml-2">
                    (父节点: {{ node.parentId }})
                </span>
            </li>
            <li v-if="nodes.length === 0" class="text-muted-foreground">暂无节点</li>
        </ul>
    </main>
</template>
```

### Step 3：添加路由

在 `src/router/index.ts` 的 `children` 里添加：

```ts
{
    path: 'node',
    component: () => import('@/pages/node/NodePage.vue'),
},
```

### Step 4：在侧边栏添加导航入口

在侧边栏/布局组件中，仿照现有 `box`、`dashboard` 等导航项的写法，添加：

```html
<RouterLink to="/node">节点管理</RouterLink>
```

（具体组件和样式视布局文件而定）

### Step 5：类型检查

```powershell
pnpm --filter BSB-Frontend type-check
```

---

## Task 10：修复 E2E 认证状态

**Files:**
- Modify: `BSB-Frontend/test/e2e/global.setup.ts`

### Step 1：诊断——给 fetchMe 添加临时日志

在 `src/stores/auth.ts` 中的 `fetchMe` 函数里，临时添加 console.error：

```ts
async function fetchMe() {
    try {
        const newToken = await callRefreshToken();
        if (!newToken) {
            console.error('[fetchMe] callRefreshToken returned null – no valid cookie?');
            user.value = null;
            return;
        }
        // ...
    } catch (e) {
        console.error('[fetchMe] unexpected error:', e);
        // ...
    }
}
```

同时在 `callRefreshToken` 中添加错误日志：

```ts
export async function callRefreshToken(): Promise<string | null> {
    try {
        const resp = await fetch(`${BASE_URL}/auth/refresh-token`, {
            method: 'POST',
            credentials: 'include',
        });
        if (!resp.ok) {
            console.error(`[callRefreshToken] response not ok: ${resp.status}`);
            return null;
        }
        // ...
    } catch (e) {
        console.error('[callRefreshToken] network error:', e);
        return null;
    }
}
```

### Step 2：运行 E2E 测试并查看控制台输出

```powershell
pnpm --filter BSB-Frontend test:e2e --reporter=list 2>&1 | Select-Object -First 80
```

查看控制台输出中是否有 `[fetchMe]` 或 `[callRefreshToken]` 的错误信息，确定实际失败原因。

### Step 3：根据诊断结果修复 global.setup.ts

**方案 A（推荐）：等待 networkidle 后再保存 storageState**

`callRefreshToken` 若返回 null 是因为 Cookie 还未写入浏览器上下文，则加一个等待：

```ts
// 在 waitForURL 之后，storageState 之前添加：
await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => {});
await page.context().storageState({ path: authFile });
```

**方案 B（若 A 不够）：使用 API 请求验证 Token 可用性**

Login 成功后，直接调用一次 API 确保 Cookie 已被浏览器持有：

```ts
// waitForURL 之后
await page.evaluate(async (baseUrl) => {
    const resp = await fetch(`${baseUrl}/auth/refresh-token`, {
        method: 'POST',
        credentials: 'include',
    });
    if (!resp.ok) throw new Error(`refresh-token failed: ${resp.status}`);
}, 'http://localhost:3000');

await page.context().storageState({ path: authFile });
```

**方案 C（最可靠）：使用 Playwright request fixture 直接调 API**

完全绕过浏览器登录，直接使用 Playwright 的 `request` 调后端登录接口：

```ts
setup('authenticate as test user', async ({ page, request }) => {
    const authDir = path.dirname(authFile);
    if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true });

    // 先尝试 API 级登录获取 tokens（不依赖浏览器 UI）
    let loginSuccess = false;
    try {
        const res = await request.post('http://localhost:3000/auth/login', {
            data: {
                account: process.env.E2E_USER ?? 'user0',
                password: process.env.E2E_PASSWORD ?? 'password',
            },
        });
        if (res.ok()) {
            // 使用同一 storageState 机制，让 page context 通过 UI 登录
            // 这里仅作健康检查——确认后端可用
            loginSuccess = true;
        }
    } catch { /* backend not running */ }

    // 浏览器 UI 登录（保证 cookie 写入 page context）
    const username = process.env.E2E_USER ?? 'user0';
    const password = process.env.E2E_PASSWORD ?? 'password';
    await login(page, username, password);

    try {
        await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 8_000 });
    } catch {
        await registerAndLogin(page, password);
        await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 10_000 });
    }

    // 等待 dashboard 核心内容可见，确保 auth 完全初始化
    await page.waitForSelector('nav, main, h1', { timeout: 5_000 }).catch(() => {});
    await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => {});

    await page.context().storageState({ path: authFile });
});
```

> **执行时先用方案 A**，如果仍失败再用方案 B，最后再用方案 C。

### Step 4：移除诊断日志

修复确认后，删除在 Step 1 中添加的 `console.error` 日志。

### Step 5：运行 E2E 测试

```powershell
pnpm --filter BSB-Frontend test:e2e 2>&1 | Select-Object -Last 30
```

预期：所有测试通过（或至少之前的 5 个失败测试现在通过）。

---

## Task 11：前端 Lint / Format / Build 全量验证

**Step 1：ESLint 自动修复**

```powershell
pnpm --filter BSB-Frontend eslint
```

**Step 2：类型检查**

```powershell
pnpm --filter BSB-Frontend type-check
```

**Step 3：Vitest 单元测试**

```powershell
pnpm --filter BSB-Frontend test
```

预期：所有测试通过。

**Step 4：构建**

```powershell
pnpm --filter BSB-Frontend build
```

预期：`dist/` 生成，无构建报错。

---

## Task 12：后端 Lint / Format / Test / Build 全量验证

**Step 1：ESLint 自动修复**

```powershell
pnpm --filter BSB-Backend lint:fix
```

**Step 2：所有测试**

```powershell
pnpm --filter BSB-Backend test
```

预期：所有套件通过。

**Step 3：构建**

```powershell
pnpm --filter BSB-Backend build
```

---

## Task 13：全工作区格式化与提交

**Step 1：全工作区 Prettier**

```powershell
pnpm run format
```

**Step 2：格式检查**

```powershell
pnpm run format:check
```

预期：`All matched files use Prettier formatting.`

**Step 3：提交 Backend 修复**

```powershell
cd BSB-Backend
git add -A
git commit -m "fix(user): emailLogin now issues token pair and sets refresh cookie"
```

**Step 4：提交 Frontend 修复与 Node UI**

```powershell
cd BSB-Frontend
git add -A
git commit -m "fix(router): move box/new before box/:id to fix route matching

fix(auth): align EmailLoginResponse type with fixed backend
fix(schema): add nodeId and node fields to BoxSchema
feat(node): add NodeSchema, nodeApi, NodePage and sidebar nav entry
fix(e2e): improve global.setup.ts to wait for networkidle before saving storageState"
```

---

## 验收标准

| 检查项 | 命令 | 预期结果 |
|--------|------|---------|
| 后端编译 | `pnpm --filter BSB-Backend build` | 无报错 |
| 后端测试 | `pnpm --filter BSB-Backend test` | 全部通过 |
| 前端类型检查 | `pnpm --filter BSB-Frontend type-check` | 无报错 |
| 前端单元测试 | `pnpm --filter BSB-Frontend test` | 全部通过 |
| 前端 E2E 测试 | `pnpm --filter BSB-Frontend test:e2e` | ≥15/15 通过 |
| 前端构建 | `pnpm --filter BSB-Frontend build` | `dist/` 生成 |
| 全局格式 | `pnpm run format:check` | 全部文件已格式化 |

---

## 执行注意事项

1. **E2E 测试需要后端先启动**：运行 `pnpm --filter BSB-Backend start:dev` 后再执行 E2E。
2. **Token 有效期**：开发环境 `JWT_REFRESH_EXPIRES_IN=7d`，测试用户登录后 7 天内有效，不需要担心过期。
3. **NodeAPI 端点**：Task 7 中的端点路径（`/node/list` 等）须与后端 `node.controller.ts` 中实际定义一致，执行时先读取后端文件确认。
4. **shadcn Select 组件**：Task 8 使用下拉选择器时，优先复用 `src/components/ui/` 中已有的 shadcn-vue Select 组件。
5. **E2E 修复优先级**：先试方案 A（networkidle），再试方案 B，最后才用方案 C。

---

*计划保存于 `docs/plans/2026-04-15-frontend-fix-and-node-ui.md`*
