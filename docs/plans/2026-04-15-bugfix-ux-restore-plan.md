# Bug Fix & UX Restore — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix 7 frontend regressions (missing room nav, SelectItem crash, missing reagent creation, Vue Flow height, Alova cache, missing org switcher, wrong dashboard greeting).

**Architecture:** Pure frontend changes across 6 files. No backend changes required. All APIs already exist.

**Tech Stack:** Vue 3, TypeScript, shadcn-vue (Tabs, Select, Dialog, DropdownMenu), Alova v3, Vue Flow

---

### Task 1: Fix AppLayout — Room Nav + Org Switcher

**Files:**
- Modify: `BSB-Frontend/src/layouts/AppLayout.vue`

**Step 1: Add `Home` and `Check`, `ChevronDown` to imports**

In the `<script setup>` imports at the top:
```ts
import { LayoutDashboard, Box, Building2, User, FlaskConical, LogOut, PanelLeftClose, PanelLeft, MapPin, Home, Check, ChevronDown } from 'lucide-vue-next';
```

**Step 2: Add room to navItems**

Change `navItems` array — insert room between box and node:
```ts
const navItems = [
    { path: '/dashboard', label: '仪表盘', icon: LayoutDashboard },
    { path: '/box', label: '储存盒', icon: Box },
    { path: '/room', label: '房间', icon: Home },
    { path: '/node', label: '节点管理', icon: MapPin },
    { path: '/reagent', label: '试剂', icon: FlaskConical },
    { path: '/org', label: '组织', icon: Building2 },
    { path: '/user', label: '个人', icon: User }
];
```

**Step 3: Replace static org span in header with DropdownMenu**

Find the header section with the static org name span and replace it with:
```html
<!-- Current org selector -->
<DropdownMenu>
    <DropdownMenuTrigger as-child>
        <Button variant="ghost" size="sm" class="gap-1.5 rounded-md px-2 hover:bg-bsb-bg-surface">
            <span class="text-sm font-medium text-bsb-text-secondary">
                {{ org.currentOrg?.name ?? '未选择组织' }}
            </span>
            <ChevronDown class="size-3.5 text-bsb-text-quaternary" />
        </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start" class="w-48">
        <DropdownMenuItem
            v-for="o in org.orgs"
            :key="o.id"
            class="flex items-center justify-between"
            @click="org.selectOrg(o.id)">
            <span>{{ o.name }}</span>
            <Check v-if="o.id === org.currentOrgId" class="size-3.5 text-bsb-accent-brand" />
        </DropdownMenuItem>
    </DropdownMenuContent>
</DropdownMenu>
```

Note: `DropdownMenu`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuTrigger` are already imported in the existing file.

**Step 4: Verify and commit**

Run: `pnpm --filter BSB-Frontend type-check`
Expected: No errors.

```bash
git add BSB-Frontend/src/layouts/AppLayout.vue
git commit -m "fix(frontend/layout): restore room nav link and org switcher dropdown"
```

---

### Task 2: Fix SelectItem Empty String Crash in BoxDetailPage

**Files:**
- Modify: `BSB-Frontend/src/pages/box/BoxDetailPage.vue`

**Step 1: Change initial value sentinel**

Line 41 — change:
```ts
const slotTypeId = ref('');
```
to:
```ts
const slotTypeId = ref('__none__');
```

**Step 2: Fix openSlotDrawer initialization**

Line 118 — change:
```ts
slotTypeId.value = reagent?.reagentTypeId ?? '';
```
to:
```ts
slotTypeId.value = reagent?.reagentTypeId ?? '__none__';
```

**Step 3: Fix API calls to strip the sentinel**

In `handleCreateSlot` (line ~152):
```ts
reagentTypeId: slotTypeId.value !== '__none__' ? slotTypeId.value : undefined
```

In `handleSaveSlot`, add the same treatment if reagentTypeId is ever sent.

**Step 4: Fix SelectItem in template**

Find:
```html
<SelectItem value="">无</SelectItem>
```
Replace with:
```html
<SelectItem value="__none__">无</SelectItem>
```

**Step 5: Verify and commit**

Run: `pnpm --filter BSB-Frontend type-check`
Expected: No errors.

Run: `pnpm --filter BSB-Frontend eslint`
Expected: 0 errors.

```bash
git add BSB-Frontend/src/pages/box/BoxDetailPage.vue
git commit -m "fix(frontend/box): replace empty SelectItem value with __none__ sentinel"
```

---

### Task 3: Fix Dashboard Welcome Message

**Files:**
- Modify: `BSB-Frontend/src/pages/dashboard/DashboardPage.vue`

**Step 1: Import auth store**

Add to imports:
```ts
import { useAuthStore } from '@/stores/auth';
```

**Step 2: Instantiate auth store**

After `const org = useOrgStore();` add:
```ts
const auth = useAuthStore();
```

**Step 3: Fix welcome h1 in template**

Find:
```html
<h1 class="font-display text-2xl font-bold tracking-tight text-bsb-text-primary">欢迎回来，{{ org.currentOrg?.name ?? '未选择组织' }}</h1>
```
Replace with:
```html
<h1 class="font-display text-2xl font-bold tracking-tight text-bsb-text-primary">欢迎回来，{{ auth.user?.nickname ?? auth.user?.username ?? '用户' }}</h1>
```

**Step 4: Verify and commit**

```bash
git add BSB-Frontend/src/pages/dashboard/DashboardPage.vue
git commit -m "fix(frontend/dashboard): show username in welcome message instead of org name"
```

---

### Task 4: Fix Vue Flow Container Height

**Files:**
- Modify: `BSB-Frontend/src/components/node/NodeCanvas.vue`

**Step 1: Fix outer wrapper to use `height` instead of `minHeight`**

In the template, find:
```html
<div class="flex flex-col" :style="{ minHeight: height }">
```
Replace with:
```html
<div class="flex flex-col overflow-hidden" :style="{ height: height }">
```

**Step 2: Ensure the canvas flex-1 div has `relative` class**

Find the canvas container div:
```html
<div class="flex-1 bg-bsb-bg-secondary">
```
Replace with:
```html
<div class="relative flex-1 bg-bsb-bg-secondary">
```

Vue Flow internally uses `position: absolute` for its canvas and requires a `position: relative` parent.

**Step 3: Verify no console height warnings and commit**

Start dev server and open `/node` — no `[Vue Flow]: The Vue Flow parent container needs a width and a height` warning in console.

```bash
git add BSB-Frontend/src/components/node/NodeCanvas.vue
git commit -m "fix(frontend/node): set explicit height on NodeCanvas container for Vue Flow"
```

---

### Task 5: Disable Alova Caching on listOrgs

**Files:**
- Modify: `BSB-Frontend/src/api/modules/org.ts`

**Step 1: Add `cacheFor: 0` to listOrgs**

Find:
```ts
export const listOrgs = () => alovaInstance.Get<Org[]>('/org/list');
```
Replace with:
```ts
export const listOrgs = () => alovaInstance.Get<Org[]>('/org/list', { cacheFor: 0 });
```

This disables the Alova GET response cache for this endpoint. All callers of `listOrgs().send()` (including `org.fetchOrgs()`) will always hit the network.

**Step 2: Verify and commit**

Run: `pnpm --filter BSB-Frontend type-check`
Expected: No errors.

```bash
git add BSB-Frontend/src/api/modules/org.ts
git commit -m "fix(frontend/api): disable alova cache for listOrgs to prevent stale data"
```

---

### Task 6: Redesign ReagentPage with Tabs (Reagent List + Reagent Types)

**Files:**
- Modify: `BSB-Frontend/src/pages/reagent/ReagentPage.vue`

This is the largest task. Replace the entire file content.

**Step 1: Understand existing structure**

Current: Simple list, no creation. Fetches reagents across all boxes.

**Step 2: New imports needed**

```ts
import { computed, onMounted, ref, watch } from 'vue';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus, FlaskConical, Tag } from 'lucide-vue-next';
import { useOrgStore } from '@/stores/org';
import { listReagents, listBoxes, createReagent } from '@/api/modules/box';
import { listReagentLogs } from '@/api/modules/feedback';
import { listReagentTypes, createReagentType, deleteReagentType } from '@/api/modules/reagent-type';
import type { ReagentTypeItem } from '@/api/modules/reagent-type';
import { staggerListIn } from '@/utils/animation';
import type { Reagent, Box } from '@/schemas/box.schema';
```

**Step 3: New script setup state**

```ts
const org = useOrgStore();

// Reagent tab state
const reagents = ref<Reagent[]>([]);
const boxes = ref<Box[]>([]);
const reagentLogs = ref<Record<string, Array<{ id: string; action?: string; createdAt?: string }>>>({});

// Create reagent dialog
const createReagentOpen = ref(false);
const newReagentBoxId = ref('__none__');
const newReagentPosition = ref('');
const newReagentName = ref('');
const newReagentDesc = ref('');
const newReagentTypeId = ref('__none__');
const creatingReagent = ref(false);

// Reagent type tab state
const reagentTypes = ref<ReagentTypeItem[]>([]);

// Create type dialog
const createTypeOpen = ref(false);
const newTypeName = ref('');
const newTypeDesc = ref('');
const newTypeColor = ref('');
const newTypeUnit = ref('');
const creatingType = ref(false);

async function fetchData() {
    if (!org.currentOrgId) return;
    try {
        const [boxList, typeList] = await Promise.all([
            listBoxes(org.currentOrgId).send(),
            listReagentTypes(org.currentOrgId).send()
        ]);
        boxes.value = Array.isArray(boxList) ? boxList : [];
        reagentTypes.value = Array.isArray(typeList) ? typeList : [];

        const allReagents: Reagent[] = [];
        for (const box of boxes.value) {
            const r = await listReagents(box.id).send();
            if (Array.isArray(r)) allReagents.push(...r);
        }
        reagents.value = allReagents;
        setTimeout(() => staggerListIn('.reagent-card'), 50);
    } catch { /* empty */ }
}

function getBoxName(boxId: string) {
    return boxes.value.find((b) => b.id === boxId)?.name ?? boxId;
}

function getTypeName(typeId: string | null | undefined) {
    if (!typeId) return null;
    return reagentTypes.value.find((t) => t.id === typeId)?.name ?? null;
}

async function handleLoadLogs(reagentId: string) {
    try {
        const logs = await listReagentLogs({ reagentId, limit: 20, offset: 0 }).send();
        reagentLogs.value[reagentId] = logs;
    } catch {
        reagentLogs.value[reagentId] = [];
    }
}

async function handleCreateReagent() {
    if (!newReagentBoxId.value || newReagentBoxId.value === '__none__' || !newReagentPosition.value.trim() || !newReagentName.value.trim()) return;
    creatingReagent.value = true;
    try {
        await createReagent({
            boxId: newReagentBoxId.value,
            position: newReagentPosition.value.trim(),
            name: newReagentName.value.trim(),
            description: newReagentDesc.value.trim() || undefined,
            reagentTypeId: newReagentTypeId.value !== '__none__' ? newReagentTypeId.value : undefined
        }).send();
        newReagentBoxId.value = '__none__';
        newReagentPosition.value = '';
        newReagentName.value = '';
        newReagentDesc.value = '';
        newReagentTypeId.value = '__none__';
        createReagentOpen.value = false;
        await fetchData();
    } catch { /* empty */ } finally {
        creatingReagent.value = false;
    }
}

async function handleCreateType() {
    if (!newTypeName.value.trim() || !org.currentOrgId) return;
    creatingType.value = true;
    try {
        await createReagentType({
            orgId: org.currentOrgId,
            name: newTypeName.value.trim(),
            description: newTypeDesc.value.trim() || undefined,
            colorHex: newTypeColor.value.trim() || undefined,
            unit: newTypeUnit.value.trim() || undefined
        }).send();
        newTypeName.value = '';
        newTypeDesc.value = '';
        newTypeColor.value = '';
        newTypeUnit.value = '';
        createTypeOpen.value = false;
        reagentTypes.value = await listReagentTypes(org.currentOrgId).send();
    } catch { /* empty */ } finally {
        creatingType.value = false;
    }
}

async function handleDeleteType(id: string) {
    try {
        await deleteReagentType(id).send();
        if (org.currentOrgId) {
            reagentTypes.value = await listReagentTypes(org.currentOrgId).send();
        }
    } catch { /* empty */ }
}

onMounted(fetchData);
watch(() => org.currentOrgId, fetchData);
```

**Step 4: New template**

```html
<template>
    <div class="space-y-6">
        <h1 class="text-2xl font-[590] text-bsb-text-primary">试剂管理</h1>

        <Tabs default-value="reagents">
            <TabsList class="border-b border-bsb-border-standard bg-transparent p-0 w-full justify-start rounded-none gap-0">
                <TabsTrigger value="reagents" class="rounded-none border-b-2 border-transparent px-4 py-2 text-sm font-medium text-bsb-text-tertiary data-[state=active]:border-bsb-accent-brand data-[state=active]:text-bsb-text-primary data-[state=active]:bg-transparent">
                    <FlaskConical class="mr-2 size-4" />
                    试剂列表
                </TabsTrigger>
                <TabsTrigger value="types" class="rounded-none border-b-2 border-transparent px-4 py-2 text-sm font-medium text-bsb-text-tertiary data-[state=active]:border-bsb-accent-brand data-[state=active]:text-bsb-text-primary data-[state=active]:bg-transparent">
                    <Tag class="mr-2 size-4" />
                    试剂类型
                </TabsTrigger>
            </TabsList>

            <!-- ── Tab 1: Reagent List ── -->
            <TabsContent value="reagents" class="mt-4 space-y-4">
                <div class="flex items-center justify-between">
                    <p class="text-sm text-bsb-text-tertiary">当前组织下所有试剂</p>
                    <Dialog v-model:open="createReagentOpen">
                        <DialogTrigger as-child>
                            <Button size="sm" class="gap-2 bg-bsb-accent-brand text-white hover:bg-bsb-accent-hover">
                                <Plus class="size-4" />新建试剂
                            </Button>
                        </DialogTrigger>
                        <DialogContent class="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>新建试剂</DialogTitle>
                            </DialogHeader>
                            <div class="space-y-4 py-2">
                                <div class="space-y-1.5">
                                    <Label>储存盒 <span class="text-red-500">*</span></Label>
                                    <Select v-model="newReagentBoxId">
                                        <SelectTrigger class="border-bsb-border-standard">
                                            <SelectValue placeholder="选择储存盒" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="__none__" disabled>请选择储存盒</SelectItem>
                                            <SelectItem v-for="box in boxes" :key="box.id" :value="box.id">
                                                {{ box.name }}
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div class="space-y-1.5">
                                    <Label>位置 <span class="text-red-500">*</span></Label>
                                    <Input v-model="newReagentPosition" placeholder="格式：行-列，例如 1-1" class="border-bsb-border-standard" />
                                </div>
                                <div class="space-y-1.5">
                                    <Label>试剂名称 <span class="text-red-500">*</span></Label>
                                    <Input v-model="newReagentName" placeholder="输入试剂名称" class="border-bsb-border-standard" />
                                </div>
                                <div class="space-y-1.5">
                                    <Label>备注</Label>
                                    <Input v-model="newReagentDesc" placeholder="可选" class="border-bsb-border-standard" />
                                </div>
                                <div class="space-y-1.5">
                                    <Label>试剂类型</Label>
                                    <Select v-model="newReagentTypeId">
                                        <SelectTrigger class="border-bsb-border-standard">
                                            <SelectValue placeholder="选择类型（可选）" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="__none__">无</SelectItem>
                                            <SelectItem v-for="rt in reagentTypes" :key="rt.id" :value="rt.id">
                                                <div class="flex items-center gap-2">
                                                    <span v-if="rt.colorHex" class="inline-block size-3 rounded-full" :style="{ background: rt.colorHex }" />
                                                    {{ rt.name }}
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" @click="createReagentOpen = false">取消</Button>
                                <Button
                                    :disabled="creatingReagent || newReagentBoxId === '__none__' || !newReagentPosition.trim() || !newReagentName.trim()"
                                    class="bg-bsb-accent-brand text-white hover:bg-bsb-accent-hover"
                                    @click="handleCreateReagent">
                                    {{ creatingReagent ? '创建中…' : '确认创建' }}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                <div v-if="reagents.length > 0" class="space-y-3">
                    <Card v-for="reagent in reagents" :key="reagent.id" class="reagent-card border-bsb-border-standard bg-bsb-bg-panel">
                        <CardHeader class="flex flex-row items-center justify-between py-3">
                            <CardTitle class="text-sm text-bsb-text-primary">{{ reagent.name }}</CardTitle>
                            <div class="flex items-center gap-2">
                                <Badge variant="outline" class="text-bsb-text-tertiary">
                                    {{ reagent.position }}
                                </Badge>
                                <Badge class="bg-bsb-bg-surface text-bsb-text-quaternary">
                                    {{ getBoxName(reagent.boxId) }}
                                </Badge>
                                <Badge v-if="getTypeName(reagent.reagentTypeId)" variant="outline" class="text-bsb-accent-brand border-bsb-accent-brand/30">
                                    {{ getTypeName(reagent.reagentTypeId) }}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent v-if="reagent.description" class="pt-0">
                            <p class="text-xs text-bsb-text-quaternary">{{ reagent.description }}</p>
                        </CardContent>
                        <CardContent class="pt-0">
                            <Button size="sm" variant="outline" @click="handleLoadLogs(reagent.id)">查看日志</Button>
                            <div v-if="reagentLogs[reagent.id]?.length" class="mt-2 space-y-1">
                                <p v-for="log in reagentLogs[reagent.id]" :key="log.id" class="text-xs text-bsb-text-quaternary">{{ log.action || '操作' }} {{ log.createdAt }}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <p v-else class="text-sm text-bsb-text-quaternary">暂无试剂数据</p>
            </TabsContent>

            <!-- ── Tab 2: Reagent Types ── -->
            <TabsContent value="types" class="mt-4 space-y-4">
                <div class="flex items-center justify-between">
                    <p class="text-sm text-bsb-text-tertiary">管理组织的试剂类型</p>
                    <Dialog v-model:open="createTypeOpen">
                        <DialogTrigger as-child>
                            <Button size="sm" class="gap-2 bg-bsb-accent-brand text-white hover:bg-bsb-accent-hover">
                                <Plus class="size-4" />新建类型
                            </Button>
                        </DialogTrigger>
                        <DialogContent class="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>新建试剂类型</DialogTitle>
                            </DialogHeader>
                            <div class="space-y-4 py-2">
                                <div class="space-y-1.5">
                                    <Label>类型名称 <span class="text-red-500">*</span></Label>
                                    <Input v-model="newTypeName" placeholder="例如：DNA、蛋白质" class="border-bsb-border-standard" />
                                </div>
                                <div class="space-y-1.5">
                                    <Label>描述</Label>
                                    <Input v-model="newTypeDesc" placeholder="可选" class="border-bsb-border-standard" />
                                </div>
                                <div class="space-y-1.5">
                                    <Label>颜色标识</Label>
                                    <div class="flex items-center gap-2">
                                        <input type="color" v-model="newTypeColor" class="size-9 cursor-pointer rounded border border-bsb-border-standard p-0.5" />
                                        <Input v-model="newTypeColor" placeholder="#hex（可选）" class="flex-1 border-bsb-border-standard" />
                                    </div>
                                </div>
                                <div class="space-y-1.5">
                                    <Label>单位</Label>
                                    <Input v-model="newTypeUnit" placeholder="例如：μL、mg（可选）" class="border-bsb-border-standard" />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" @click="createTypeOpen = false">取消</Button>
                                <Button
                                    :disabled="creatingType || !newTypeName.trim()"
                                    class="bg-bsb-accent-brand text-white hover:bg-bsb-accent-hover"
                                    @click="handleCreateType">
                                    {{ creatingType ? '创建中…' : '确认创建' }}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                <div v-if="reagentTypes.length > 0" class="space-y-2">
                    <Card v-for="rt in reagentTypes" :key="rt.id" class="border-bsb-border-standard bg-bsb-bg-panel">
                        <CardHeader class="flex flex-row items-center justify-between py-3">
                            <div class="flex items-center gap-3">
                                <span v-if="rt.colorHex" class="inline-block size-4 rounded-full border border-bsb-border-standard" :style="{ background: rt.colorHex }" />
                                <CardTitle class="text-sm text-bsb-text-primary">{{ rt.name }}</CardTitle>
                                <Badge v-if="rt.unit" variant="outline" class="text-xs text-bsb-text-tertiary">{{ rt.unit }}</Badge>
                            </div>
                            <Button variant="ghost" size="icon" class="size-7 text-bsb-text-quaternary hover:text-red-500" @click="handleDeleteType(rt.id)">
                                <Trash2 class="size-3.5" />
                            </Button>
                        </CardHeader>
                        <CardContent v-if="rt.description" class="pt-0">
                            <p class="text-xs text-bsb-text-quaternary">{{ rt.description }}</p>
                        </CardContent>
                    </Card>
                </div>
                <p v-else class="text-sm text-bsb-text-quaternary">暂无试剂类型，点击右上角新建</p>
            </TabsContent>
        </Tabs>
    </div>
</template>
```

**Step 5: Verify Tabs component is available**

Check if `Tabs` exists: `BSB-Frontend/src/components/ui/tabs/`. If not, install via shadcn-vue:
```bash
npx shadcn-vue@latest add tabs --yes
```

**Step 6: Verify and commit**

Run: `pnpm --filter BSB-Frontend type-check`
Run: `pnpm --filter BSB-Frontend eslint`
Expected: No errors.

```bash
git add BSB-Frontend/src/pages/reagent/ReagentPage.vue
git commit -m "feat(frontend/reagent): add tabs for reagent list and reagent type management"
```

---

### Task 7: Final Validation

**Step 1: Run all checks**

```bash
pnpm --filter BSB-Frontend type-check
pnpm --filter BSB-Frontend eslint
pnpm --filter BSB-Frontend test
pnpm run format:check
```
Expected: All pass.

**Step 2: Quick browser smoke test**

With dev server running (`pnpm --filter BSB-Frontend dev`):
- `/dashboard` — welcome message shows username (not org name)
- Navigate to `/room` via sidebar — RoomListPage loads
- `/node` — Vue Flow canvas renders without height warnings
- `/box/:id` → click empty slot → Select for reagent type opens without error
- `/org` — org switcher dropdown in header works; switching shows correct name
- `/reagent` — Tab 1 shows reagent list with "新建试剂" button; Tab 2 shows reagent types with "新建类型" button

**Step 3: Commit if any final fixes were needed**
