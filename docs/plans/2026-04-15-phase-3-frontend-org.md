# P3：前端 Org 重构 — OrgStore / 侧边栏切换器 / OrgDetailPage / OrgExplorePage

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将 Org 功能从单一管理页拆分为完整 SPA 体验：顶栏显示 Org 切换器，新增独立的 OrgDetailPage（成员/共享/设置 Tab）和 OrgExplorePage（浏览公开组织），修复创建/删除后自动刷新问题，整体遵循 Notion 设计规范。

**Architecture:** Page → Store（Pinia）→ API（Alova）；新路由 `/org/explore`、`/org/:id` 以懒加载子路由形式挂载到 AppLayout 下。组件层级：AppLayout 顶栏 → orgSwitcher（inline）→ OrgDetailPage / OrgExplorePage。

---

## 规范速查

实施前必读：
- [BSB-Frontend/AGENTS.md](../../BSB-Frontend/AGENTS.md)
- [BSB-Frontend/DESIGN.md](../../BSB-Frontend/DESIGN.md)
- [BSB-Backend/AGENTS.md](../../BSB-Backend/AGENTS.md)（了解对应 API 契约）
- [docs/plans/2026-04-15-full-system-redesign.md](./2026-04-15-full-system-redesign.md)

---

## 前置规范阅读

```
1. 读取 BSB-Frontend/DESIGN.md — 确认 bsb-* CSS 变量、Notion 设计语言、字重体系
2. 调用 ui-ux-pro-max skill — 获取 Notion 风格组件方案与间距方案
```

**运行 P2 验证：**

```bash
pnpm --filter BSB-Backend start:dev  # 后端 API 可用
```

---

## Task 1：扩展 OrgStore

**Files:**
- Modify: `BSB-Frontend/src/stores/org.ts`

### Step 1：添加 `createAndSwitch`、`exploreOrgs`、`searchOrgMembers` 方法，以及相应 API 函数

先在 `BSB-Frontend/src/api/modules/org.ts` 末尾追加新 API 函数：

```typescript
// 追加到 org.ts 末尾
export const updateOrgFull = (data: {
    orgId: string;
    name?: string;
    description?: string;
    isPublic?: boolean;
    avatarUrl?: string;
}) => alovaInstance.Put<Org>('/org/update', data);

export const exploreOrgs = (params?: { keyword?: string; limit?: number; offset?: number }) =>
    alovaInstance.Get<{ id: string; name: string; description: string; avatarUrl: string | null; _count: { members: number } }[]>('/org/explore', { params });

export const searchOrgMembers = (params: { orgId: string; keyword: string }) =>
    alovaInstance.Get<{ user: { id: string; username: string; nickname: string; email: string }; role: string }[]>('/org/members/search', { params });
```

### Step 2：修改 `BSB-Frontend/src/stores/org.ts`

将整个 store 替换为（保留现有 state/方法，仅追加新方法）：

```typescript
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Org } from '@/schemas/org.schema';
import { listOrgs, createOrg, exploreOrgs, searchOrgMembers } from '@/api/modules/org';
import type { CreateOrgForm } from '@/schemas/org.schema';

export const useOrgStore = defineStore('org', () => {
    const orgs = ref<Org[]>([]);
    const currentOrgId = ref<string | null>(null);

    const currentOrg = computed(() => orgs.value.find((o) => o.id === currentOrgId.value) ?? null);

    async function fetchOrgs() {
        orgs.value = await listOrgs().send();
        if (!currentOrgId.value && orgs.value.length > 0) {
            currentOrgId.value = orgs.value[0].id;
        }
    }

    function selectOrg(id: string) {
        currentOrgId.value = id;
    }

    /** 创建组织后立即切换到该组织 */
    async function createAndSwitch(form: CreateOrgForm) {
        const created = await createOrg(form).send();
        await fetchOrgs();
        currentOrgId.value = created.id;
        return created;
    }

    /** 搜索公开组织（供 OrgExplorePage 使用） */
    async function explore(keyword?: string) {
        return exploreOrgs({ keyword, limit: 20 }).send();
    }

    /** 组织内搜索成员（供 OrgDetailPage 使用） */
    async function searchMembers(orgId: string, keyword: string) {
        return searchOrgMembers({ orgId, keyword }).send();
    }

    return {
        orgs,
        currentOrgId,
        currentOrg,
        fetchOrgs,
        selectOrg,
        createAndSwitch,
        explore,
        searchMembers,
    };
});
```

### Step 3：验证类型

```bash
pnpm --filter BSB-Frontend type-check
```

**预期**：无新增类型错误。

---

## Task 2：TopBar Org 切换器（AppLayout 修改）

**Files:**
- Modify: `BSB-Frontend/src/layouts/AppLayout.vue`

### Step 1：替换顶栏当前组织显示区域为 Org 切换器下拉选单

找到 AppLayout.vue 顶栏 `<header>` 中的组织名称 `<span>` 段落，将其替换为交互式切换器：

```vue
<!-- 替换原有 <div class="flex items-center gap-2"> 区域（含 org.currentOrg?.name span） -->
<div class="flex items-center gap-2">
    <DropdownMenu>
        <DropdownMenuTrigger as-child>
            <Button variant="ghost" size="sm" class="gap-1.5 rounded-md px-2 text-sm font-medium text-bsb-text-primary hover:bg-bsb-bg-surface">
                <Building2 class="size-4 shrink-0 text-bsb-text-tertiary" />
                <span class="max-w-[140px] truncate">{{ org.currentOrg?.name ?? '选择组织' }}</span>
                <ChevronDown class="size-3.5 text-bsb-text-quaternary" />
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" class="w-52">
            <DropdownMenuLabel class="text-xs text-bsb-text-tertiary">切换组织</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
                v-for="o in org.orgs"
                :key="o.id"
                class="gap-2"
                :class="o.id === org.currentOrgId ? 'bg-bsb-bg-surface font-medium' : ''"
                @click="org.selectOrg(o.id)"
            >
                <Check v-if="o.id === org.currentOrgId" class="size-4 text-bsb-accent-brand" />
                <span v-else class="size-4" />
                {{ o.name }}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem @click="router.push('/org')">
                <Settings class="mr-2 size-4" />
                管理组织
            </DropdownMenuItem>
            <DropdownMenuItem @click="router.push('/org/explore')">
                <Compass class="mr-2 size-4" />
                探索组织
            </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
</div>
```

> 新增的 lucide-vue-next 图标：`ChevronDown`、`Check`、`Settings`、`Compass`——全部追加到顶部 import。

### Step 2：移除全局路由监听动画

删除 `watch(() => route.path, ...)` 整个代码块（避免与各页面私有动画冲突）：

```diff
- watch(
-     () => route.path,
-     () => {
-         const main = document.getElementById('main-content');
-         if (main) pageTransitionIn(main);
-     }
- );
```

同时移除 `import { pageTransitionIn } from '@/utils/animation'`（如无其他使用）。

### Step 3：类型检查

```bash
pnpm --filter BSB-Frontend type-check
```

---

## Task 3：新建 OrgDetailPage（`/org/:id`）

**Files:**
- Create: `BSB-Frontend/src/pages/org/OrgDetailPage.vue`
- Modify: `BSB-Frontend/src/router/index.ts`
- Modify: `BSB-Frontend/src/api/modules/org-user.ts`（若需补充成员操作 API）

### Step 1：在 router/index.ts 新增路由

```typescript
// 在 'org' 路由 children 中追加（或在顶层 children 后追加）：
{
    path: 'org',
    component: () => import('@/pages/org/OrgManagePage.vue'),
},
{
    path: 'org/explore',
    component: () => import('@/pages/org/OrgExplorePage.vue'),
},
{
    path: 'org/:id',
    component: () => import('@/pages/org/OrgDetailPage.vue'),
},
```

> 注意：路由顺序 — `/org/explore` 必须**先于** `/org/:id`，否则 `explore` 会被 `:id` 捕获。

### Step 2：创建 OrgDetailPage.vue - 完整代码

```vue
<!-- BSB-Frontend/src/pages/org/OrgDetailPage.vue -->
<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ArrowLeft, Users, Share2, Settings, Trash2, Search, UserPlus, Check, X } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useOrgStore } from '@/stores/org';
import { useAuthStore } from '@/stores/auth';
import { getOrg, deleteOrg, updateOrgFull } from '@/api/modules/org';
import { listOrgMembers, inviteUser, removeMember } from '@/api/modules/org-user';
import { listOutboundShares, listInboundShares } from '@/api/modules/share';
import type { Org, OrgMember } from '@/schemas/org.schema';
import { pageTransitionIn } from '@/utils/animation';

const route = useRoute();
const router = useRouter();
const org = useOrgStore();
const auth = useAuthStore();

const orgId = computed(() => route.params.id as string);

type TabKey = 'members' | 'shares' | 'settings';
const activeTab = ref<TabKey>('members');

const orgData = ref<Org | null>(null);
const members = ref<OrgMember[]>([]);
const outboundShares = ref<{ id: string; resourceId: string; granteeOrg: { id: string; name: string }; permission: string; status: string; createdAt: string }[]>([]);
const inboundShares = ref<typeof outboundShares.value>([]);

const memberSearch = ref('');
const memberSearchResults = ref<{ user: { id: string; username: string; nickname: string; email: string }; role: string }[]>([]);
const inviteId = ref('');
const inviteLoading = ref(false);
const inviteError = ref('');

const settingsName = ref('');
const settingsDesc = ref('');
const settingsPublic = ref(false);
const settingsSaving = ref(false);

const deleteDialogOpen = ref(false);

const isAdminOrOwner = computed(() => {
    const m = members.value.find((m: any) => m.userId === auth.user?.id || m.user?.id === auth.user?.id);
    return m?.role === 'OWNER' || m?.role === 'ADMIN';
});

onMounted(async () => {
    const main = document.getElementById('main-content');
    if (main) pageTransitionIn(main);

    try {
        [orgData.value, members.value] = await Promise.all([
            getOrg(orgId.value).send(),
            listOrgMembers(orgId.value).send(),
        ]);
        settingsName.value = orgData.value.name;
        settingsDesc.value = orgData.value.description ?? '';
        settingsPublic.value = (orgData.value as any).isPublic ?? false;

        [outboundShares.value, inboundShares.value] = await Promise.all([
            listOutboundShares(orgId.value).send(),
            listInboundShares(orgId.value).send(),
        ]);
    } catch {
        /* empty */
    }
});

async function handleMemberSearch() {
    if (!memberSearch.value.trim()) return;
    memberSearchResults.value = await org.searchMembers(orgId.value, memberSearch.value.trim());
}

async function handleInvite() {
    if (!inviteId.value.trim()) return;
    inviteLoading.value = true;
    inviteError.value = '';
    try {
        await inviteUser({ orgId: orgId.value, userId: inviteId.value.trim() }).send();
        inviteId.value = '';
    } catch (e: unknown) {
        inviteError.value = e instanceof Error ? e.message : '邀请失败';
    } finally {
        inviteLoading.value = false;
    }
}

async function handleRemoveMember(userId: string) {
    try {
        await removeMember({ orgId: orgId.value, userId }).send();
        members.value = await listOrgMembers(orgId.value).send();
    } catch {
        /* empty */
    }
}

async function handleSaveSettings() {
    settingsSaving.value = true;
    try {
        await updateOrgFull({
            orgId: orgId.value,
            name: settingsName.value,
            description: settingsDesc.value || undefined,
            isPublic: settingsPublic.value,
        }).send();
        if (orgData.value) orgData.value.name = settingsName.value;
        await org.fetchOrgs();
    } catch {
        /* empty */
    } finally {
        settingsSaving.value = false;
    }
}

async function handleDelete() {
    try {
        await deleteOrg(orgId.value).send();
        await org.fetchOrgs();
        router.push('/org');
    } catch {
        /* empty */
    }
}
</script>

<template>
    <div class="space-y-6">
        <!-- Header -->
        <div class="flex items-center gap-3">
            <Button variant="ghost" size="icon" class="shrink-0 text-bsb-text-tertiary hover:text-bsb-text-primary" @click="router.push('/org')">
                <ArrowLeft class="size-4" />
            </Button>
            <div>
                <h1 class="text-2xl font-[590] text-bsb-text-primary">{{ orgData?.name ?? '加载中…' }}</h1>
                <p v-if="orgData?.description" class="mt-0.5 text-sm text-bsb-text-tertiary">{{ orgData.description }}</p>
            </div>
            <Badge v-if="(orgData as any)?.isPublic" variant="outline" class="ml-auto text-xs text-bsb-accent-brand border-bsb-accent-brand/30">
                公开
            </Badge>
        </div>

        <!-- Tabs -->
        <div class="flex items-center gap-1 border-b border-bsb-border-standard">
            <button
                v-for="tab in ([{ key: 'members', label: '成员', icon: Users }, { key: 'shares', label: '共享', icon: Share2 }, { key: 'settings', label: '设置', icon: Settings }] as const)"
                :key="tab.key"
                class="flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors"
                :class="activeTab === tab.key
                    ? 'border-bsb-text-primary text-bsb-text-primary'
                    : 'border-transparent text-bsb-text-tertiary hover:text-bsb-text-secondary'"
                @click="activeTab = tab.key"
            >
                <component :is="tab.icon" class="size-3.5" />
                {{ tab.label }}
            </button>
        </div>

        <!-- Members Tab -->
        <template v-if="activeTab === 'members'">
            <div class="space-y-4">
                <!-- Search within org -->
                <div class="flex gap-2">
                    <div class="relative flex-1 max-w-sm">
                        <Search class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-bsb-text-quaternary" />
                        <Input v-model="memberSearch" placeholder="搜索成员…" class="border-bsb-border-standard bg-bsb-bg-surface pl-10" @keyup.enter="handleMemberSearch" />
                    </div>
                    <Button variant="outline" size="sm" class="border-bsb-border-standard text-bsb-text-secondary" @click="handleMemberSearch">
                        搜索
                    </Button>
                    <!-- Invite dialog -->
                    <Dialog v-if="isAdminOrOwner">
                        <DialogTrigger as-child>
                            <Button size="sm" class="gap-1.5 bg-bsb-accent-brand text-white hover:bg-bsb-accent-hover">
                                <UserPlus class="size-4" />
                                邀请
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>邀请成员</DialogTitle>
                            </DialogHeader>
                            <div class="space-y-3">
                                <Label>用户 ID</Label>
                                <Input v-model="inviteId" placeholder="输入用户 ID…" />
                                <p v-if="inviteError" class="text-xs text-red-500">{{ inviteError }}</p>
                            </div>
                            <DialogFooter>
                                <Button :disabled="inviteLoading" class="bg-bsb-accent-brand text-white hover:bg-bsb-accent-hover" @click="handleInvite">
                                    {{ inviteLoading ? '邀请中…' : '发送邀请' }}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                <!-- Search results -->
                <div v-if="memberSearchResults.length > 0" class="rounded-lg border border-bsb-border-standard bg-bsb-bg-surface p-3 space-y-2">
                    <p class="text-xs text-bsb-text-tertiary">搜索结果</p>
                    <div v-for="r in memberSearchResults" :key="r.user.id" class="flex items-center justify-between py-1">
                        <div>
                            <span class="text-sm font-medium text-bsb-text-primary">{{ r.user.nickname || r.user.username }}</span>
                            <span class="ml-2 text-xs text-bsb-text-tertiary">{{ r.user.email }}</span>
                        </div>
                        <Badge variant="outline" class="text-xs">{{ r.role }}</Badge>
                    </div>
                </div>

                <!-- Members list -->
                <div class="divide-y divide-bsb-border-standard rounded-lg border border-bsb-border-standard bg-white">
                    <div v-for="m in members" :key="(m as any).userId ?? (m as any).user?.id" class="flex items-center justify-between px-4 py-3">
                        <div class="flex items-center gap-3">
                            <div class="flex size-8 items-center justify-center rounded-full bg-[#f2f9ff] text-xs font-semibold text-[#097fe8]">
                                {{ ((m as any).user?.nickname || (m as any).user?.username || '?').slice(0, 2).toUpperCase() }}
                            </div>
                            <div>
                                <p class="text-sm font-medium text-bsb-text-primary">{{ (m as any).user?.nickname || (m as any).user?.username }}</p>
                                <p class="text-xs text-bsb-text-tertiary">{{ (m as any).user?.email }}</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-2">
                            <Badge variant="outline" class="text-xs">{{ m.role }}</Badge>
                            <Button v-if="isAdminOrOwner && m.role !== 'OWNER'" variant="ghost" size="icon" class="size-7 text-bsb-text-quaternary hover:text-red-500" @click="handleRemoveMember((m as any).userId ?? (m as any).user?.id)">
                                <X class="size-3.5" />
                            </Button>
                        </div>
                    </div>
                    <p v-if="members.length === 0" class="px-4 py-6 text-center text-sm text-bsb-text-quaternary">暂无成员</p>
                </div>
            </div>
        </template>

        <!-- Shares Tab -->
        <template v-else-if="activeTab === 'shares'">
            <div class="space-y-6">
                <div>
                    <h3 class="mb-3 text-sm font-[510] text-bsb-text-secondary">已共享给他人</h3>
                    <div class="divide-y divide-bsb-border-standard rounded-lg border border-bsb-border-standard bg-white">
                        <div v-for="s in outboundShares" :key="s.id" class="flex items-center justify-between px-4 py-3">
                            <div>
                                <p class="text-sm font-medium text-bsb-text-primary">资源 {{ s.resourceId.slice(0, 8) }}…</p>
                                <p class="text-xs text-bsb-text-tertiary">→ {{ s.granteeOrg.name }}</p>
                            </div>
                            <div class="flex items-center gap-2">
                                <Badge variant="outline" class="text-xs">{{ s.permission }}</Badge>
                                <Badge variant="outline" :class="s.status === 'ACTIVE' ? 'border-green-200 text-green-700' : 'text-bsb-text-quaternary'">{{ s.status }}</Badge>
                            </div>
                        </div>
                        <p v-if="outboundShares.length === 0" class="px-4 py-6 text-center text-sm text-bsb-text-quaternary">暂未向其他组织共享资源</p>
                    </div>
                </div>
                <div>
                    <h3 class="mb-3 text-sm font-[510] text-bsb-text-secondary">获得的共享</h3>
                    <div class="divide-y divide-bsb-border-standard rounded-lg border border-bsb-border-standard bg-white">
                        <div v-for="s in inboundShares" :key="s.id" class="flex items-center justify-between px-4 py-3">
                            <div>
                                <p class="text-sm font-medium text-bsb-text-primary">资源 {{ s.resourceId.slice(0, 8) }}…</p>
                                <p class="text-xs text-bsb-text-tertiary">← {{ (s as any).ownerOrg?.name }}</p>
                            </div>
                            <Badge variant="outline" class="text-xs">{{ s.permission }}</Badge>
                        </div>
                        <p v-if="inboundShares.length === 0" class="px-4 py-6 text-center text-sm text-bsb-text-quaternary">暂无获得的共享资源</p>
                    </div>
                </div>
            </div>
        </template>

        <!-- Settings Tab -->
        <template v-else-if="activeTab === 'settings'">
            <div class="max-w-md space-y-5">
                <div class="space-y-1.5">
                    <Label for="settings-name" class="text-sm font-medium text-bsb-text-primary">组织名称</Label>
                    <Input id="settings-name" v-model="settingsName" class="border-bsb-border-standard" />
                </div>
                <div class="space-y-1.5">
                    <Label for="settings-desc" class="text-sm font-medium text-bsb-text-primary">描述</Label>
                    <Input id="settings-desc" v-model="settingsDesc" class="border-bsb-border-standard" />
                </div>
                <div class="flex items-center justify-between rounded-lg border border-bsb-border-standard bg-bsb-bg-surface px-4 py-3">
                    <div>
                        <p class="text-sm font-medium text-bsb-text-primary">公开可发现</p>
                        <p class="text-xs text-bsb-text-tertiary">允许其他用户在探索页面找到此组织</p>
                    </div>
                    <Switch v-model:checked="settingsPublic" />
                </div>
                <Button :disabled="settingsSaving" class="bg-bsb-accent-brand text-white hover:bg-bsb-accent-hover" @click="handleSaveSettings">
                    {{ settingsSaving ? '保存中…' : '保存设置' }}
                </Button>

                <Separator class="bg-bsb-border-standard" />

                <!-- Danger zone -->
                <div class="rounded-lg border border-red-100 bg-red-50/50 p-4 space-y-3">
                    <p class="text-sm font-medium text-red-700">危险区域</p>
                    <p class="text-xs text-red-500">删除组织将永久移除所有数据，此操作不可逆。</p>
                    <Dialog v-model:open="deleteDialogOpen">
                        <DialogTrigger as-child>
                            <Button variant="outline" size="sm" class="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700">
                                <Trash2 class="mr-2 size-4" />
                                删除组织
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>确认删除组织？</DialogTitle>
                            </DialogHeader>
                            <p class="text-sm text-bsb-text-secondary">此操作不可撤销。组织下所有数据将被永久删除。</p>
                            <DialogFooter>
                                <Button variant="outline" @click="deleteDialogOpen = false">取消</Button>
                                <Button class="bg-red-600 text-white hover:bg-red-700" @click="handleDelete">确认删除</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
        </template>
    </div>
</template>
```

> `listOutboundShares` 和 `listInboundShares` 需在 Task 4（新建 share API）中创建。

---

## Task 4：新建 Share API 模块

**Files:**
- Create: `BSB-Frontend/src/api/modules/share.ts`

```typescript
// BSB-Frontend/src/api/modules/share.ts
import { alovaInstance } from '../client';

interface ShareRecord {
    id: string;
    resourceType: string;
    resourceId: string;
    ownerOrgId: string;
    granteeOrgId: string;
    permission: string;
    status: string;
    createdAt: string;
    ownerOrg?: { id: string; name: string };
    granteeOrg?: { id: string; name: string };
}

export const grantShare = (data: {
    resourceType: string;
    resourceId: string;
    ownerOrgId: string;
    granteeOrgId: string;
    permission: 'READ' | 'WRITE';
}) => alovaInstance.Post<ShareRecord>('/share/grant', data);

export const respondShare = (data: { shareId: string; approve: boolean }) =>
    alovaInstance.Put<ShareRecord>('/share/respond', data);

export const revokeShare = (shareId: string) =>
    alovaInstance.Delete<void>('/share/revoke', { data: { shareId } });

export const listOutboundShares = (orgId: string) =>
    alovaInstance.Get<ShareRecord[]>('/share/outbound', { params: { orgId } });

export const listInboundShares = (orgId: string) =>
    alovaInstance.Get<ShareRecord[]>('/share/inbound', { params: { orgId } });
```

---

## Task 5：新建 OrgExplorePage（`/org/explore`）

**Files:**
- Create: `BSB-Frontend/src/pages/org/OrgExplorePage.vue`

```vue
<!-- BSB-Frontend/src/pages/org/OrgExplorePage.vue -->
<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { Search, Users, Globe, Compass } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'vue-router';
import { useOrgStore } from '@/stores/org';
import { staggerListIn, pageTransitionIn } from '@/utils/animation';

const org = useOrgStore();
const router = useRouter();

interface PublicOrg {
    id: string;
    name: string;
    description: string;
    avatarUrl: string | null;
    _count: { members: number };
}

const results = ref<PublicOrg[]>([]);
const keyword = ref('');
const loading = ref(false);
const searched = ref(false);

async function handleSearch() {
    loading.value = true;
    searched.value = true;
    try {
        results.value = await org.explore(keyword.value.trim() || undefined);
        setTimeout(() => staggerListIn('.explore-card'), 50);
    } catch {
        /* empty */
    } finally {
        loading.value = false;
    }
}

onMounted(async () => {
    const main = document.getElementById('main-content');
    if (main) pageTransitionIn(main);
    await handleSearch();
});
</script>

<template>
    <div class="space-y-6">
        <div>
            <div class="flex items-center gap-2">
                <Compass class="size-5 text-bsb-accent-brand" />
                <h1 class="text-2xl font-[590] text-bsb-text-primary">探索组织</h1>
            </div>
            <p class="mt-1 text-sm text-bsb-text-tertiary">发现公开组织并申请加入</p>
        </div>

        <!-- Search -->
        <div class="flex gap-2 max-w-md">
            <div class="relative flex-1">
                <Search class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-bsb-text-quaternary" />
                <Input v-model="keyword" placeholder="搜索组织名称…" class="border-bsb-border-standard bg-bsb-bg-surface pl-10" @keyup.enter="handleSearch" />
            </div>
            <Button :disabled="loading" class="bg-bsb-accent-brand text-white hover:bg-bsb-accent-hover" @click="handleSearch">
                {{ loading ? '搜索中…' : '搜索' }}
            </Button>
        </div>

        <!-- Results -->
        <div v-if="results.length > 0" class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Card
                v-for="o in results"
                :key="o.id"
                class="explore-card cursor-pointer border-bsb-border-standard bg-white transition-shadow hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
                @click="router.push(`/org/${o.id}`)"
            >
                <CardHeader class="pb-2">
                    <div class="flex items-start justify-between">
                        <div class="flex items-center gap-2.5">
                            <div class="flex size-9 items-center justify-center rounded-lg bg-[#f2f9ff] text-sm font-bold text-[#097fe8]">
                                {{ o.name.slice(0, 2).toUpperCase() }}
                            </div>
                            <div>
                                <CardTitle class="text-sm text-bsb-text-primary">{{ o.name }}</CardTitle>
                            </div>
                        </div>
                        <Badge variant="outline" class="text-xs border-bsb-accent-brand/30 text-bsb-accent-brand">
                            <Globe class="mr-1 size-3" />
                            公开
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent class="space-y-2">
                    <p class="line-clamp-2 text-xs text-bsb-text-tertiary">{{ o.description || '暂无描述' }}</p>
                    <div class="flex items-center gap-1 text-xs text-bsb-text-quaternary">
                        <Users class="size-3" />
                        {{ o._count.members }} 位成员
                    </div>
                </CardContent>
            </Card>
        </div>

        <p v-else-if="searched && !loading" class="text-sm text-bsb-text-quaternary">
            未找到公开组织{{ keyword ? `「${keyword}」` : '' }}
        </p>
    </div>
</template>
```

---

## Task 6：修复 OrgManagePage 问题

**Files:**
- Modify: `BSB-Frontend/src/pages/org/OrgManagePage.vue`

### Problem 1：组织列表项需要链接到 OrgDetailPage

将列表区域的组织 `Card` 点击事件改为跳转 `/org/:id`：

找到展示 `org.orgs` 列表的循环（`v-for="orgItem in org.orgs"`），将卡片 `@click` 改为：

```typescript
// 在 script 中使用 router
const router = useRouter();
// 在 import 中添加 useRouter
```

在模板中：

```vue
<!-- 对每个 org item card，添加 cursor-pointer + 点击跳转 -->
<Card
    v-for="orgItem in org.orgs"
    :key="orgItem.id"
    class="cursor-pointer border-bsb-border-standard bg-bsb-bg-panel transition-colors hover:border-bsb-accent-brand/30"
    @click="router.push(`/org/${orgItem.id}`)"
>
```

### Problem 2：创建组织使用 `createAndSwitch` 以确保自动切换

修改 `handleCreate` 函数中的创建逻辑：

```typescript
// 替换：
await createOrg(result.data).send();
await org.fetchOrgs();
// 改为：
await org.createAndSwitch(result.data);
```

同时移除 `import { createOrg } from '@/api/modules/org'`（如 createAndSwitch 已内部处理）。

---

## Task 7：类型检查 + 单元测试 + 提交

### Step 1：类型检查

```bash
pnpm --filter BSB-Frontend type-check
```

### Step 2：Vitest 单元测试（OrgStore）

在 `BSB-Frontend/test/unit/stores/org.spec.ts` 创建（若不存在）：

```typescript
import { setActivePinia, createPinia } from 'pinia';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useOrgStore } from '@/stores/org';

vi.mock('@/api/modules/org', () => ({
    listOrgs: () => ({ send: () => Promise.resolve([{ id: 'org-1', name: 'Test' }]) }),
    createOrg: () => ({ send: () => Promise.resolve({ id: 'org-new', name: 'New Org' }) }),
    exploreOrgs: () => ({ send: () => Promise.resolve([]) }),
    searchOrgMembers: () => ({ send: () => Promise.resolve([]) }),
}));

describe('useOrgStore', () => {
    beforeEach(() => setActivePinia(createPinia()));

    it('fetchOrgs sets currentOrgId on first load', async () => {
        const store = useOrgStore();
        await store.fetchOrgs();
        expect(store.currentOrgId).toBe('org-1');
    });

    it('createAndSwitch switches to created org', async () => {
        const store = useOrgStore();
        const created = await store.createAndSwitch({ name: 'New Org' } as any);
        expect(store.currentOrgId).toBe('org-new');
        expect(created.id).toBe('org-new');
    });
});
```

```bash
pnpm --filter BSB-Frontend test
```

### Step 3：ESLint

```bash
pnpm --filter BSB-Frontend eslint
```

### Step 4：提交

```bash
git add BSB-Frontend/src/
git commit -m "feat(frontend/org): add OrgDetailPage, OrgExplorePage, org switcher, createAndSwitch"
```

---

## Task 8：实施后审计

```
调用 agent-browser skill，验证以下流程：
1. 顶栏 Org 切换器下拉渲染与切换
2. /org 页面点击组织跳转到 /org/:id
3. OrgDetailPage 三个 Tab 渲染
4. /org/explore 页面搜索与卡片渲染
5. 创建组织后自动切换 + 列表刷新
6. 删除组织后跳转回 /org
7. Console 无错误
```

---

## P3 完成后

移交 P4：[docs/plans/2026-04-15-phase-4-frontend-room-node-canvas.md](./2026-04-15-phase-4-frontend-room-node-canvas.md)
