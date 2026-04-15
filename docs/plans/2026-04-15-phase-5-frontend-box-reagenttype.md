# P5：前端 Box 重构 + ReagentType 管理

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:**
1. BoxDetailPage：移除图片比对 UI，修复 slot 动画（逐行 0.1s 延迟，translateY 8%→0），添加删除/元数据编辑，确保 staggerListIn 动画运行在页面自身而非 AppLayout 触发。
2. BoxListPage：切换组织后自动刷新（已有 watch 但需验证绑定问题）。
3. 新增 ReagentTypePage（`/reagent-type`）：试剂类型管理表格 + 色标选择器。
4. BoxDetailPage Slot Drawer 扩展：试剂类型下拉、放置时间 DatePicker、环境 JSON 编辑器、责任人搜索。
5. BoxCreatePage：解耦 RootManager 组件，改为选择 ROOM 类型 Node。

**Architecture:** 同 P3/P4：Page → Store → API；Slot Drawer 使用 shadcn-vue `Sheet` 组件，DatePicker 使用 shadcn-vue `Calendar` + `Popover`。

---

## 规范速查

实施前必读：
- [BSB-Frontend/AGENTS.md](../../BSB-Frontend/AGENTS.md)
- [BSB-Frontend/DESIGN.md](../../BSB-Frontend/DESIGN.md)
- [docs/plans/2026-04-15-full-system-redesign.md](./2026-04-15-full-system-redesign.md)
- [BSB-Backend/docs/01-guides/testing.md](../../BSB-Backend/docs/01-guides/testing.md)

---

## 前置规范阅读

```
1. 读取 BSB-Frontend/DESIGN.md — 确认 slot 动画规格（translateY 8%→0, per-row stagger 0.1s）
2. 调用 ui-ux-pro-max skill — 获取网格卡片动画方案、Drawer 布局建议
```

**前置条件验证：**

```bash
pnpm --filter BSB-Frontend type-check   # 必须通过（P4 无遗留错误）
```

---

## Task 1：修复 BoxListPage 自动刷新

**Files:**
- Read + Modify: `BSB-Frontend/src/pages/box/BoxListPage.vue`

### 问题分析

BoxListPage 已有 `watch(() => org.currentOrgId, fetchBoxes)`，但可能因为 `onMounted` 时 `org.currentOrgId` 尚未就绪（AppLayout `onMounted` 调用 `fetchOrgs` 是异步的）而导致首次加载拿不到数据。

### Fix：使用 watchEffect 或 immediate watch

将 `onMounted(fetchBoxes)` + `watch(() => org.currentOrgId, fetchBoxes)` 替换为单个 `watchEffect`：

```typescript
// 移除 onMounted(fetchBoxes)
// 移除 watch(() => org.currentOrgId, fetchBoxes)

// 替换为：
watch(
    () => org.currentOrgId,
    (newId) => {
        if (newId) fetchBoxes();
    },
    { immediate: true }
);
```

这样当 `currentOrgId` 从 `null` 变为实际值时，`fetchBoxes` 也会被调用。

### 验证

```bash
pnpm --filter BSB-Frontend type-check
```

---

## Task 2：修复 slot 动画 + 移除图片比对 UI（BoxDetailPage）

**Files:**
- Read + Modify: `BSB-Frontend/src/pages/box/BoxDetailPage.vue`

### Step 1：修复 slot 动画

当前问题：`onMounted` 中直接调用 `staggerListIn('.grid-cell')`，但由于 AppLayout 的全局路由动画已被 P3 移除，stagger 应改为逐行延迟方式。

**修改 `staggerListIn` 调用**（在 `onMounted` 中）：

找到：

```typescript
setTimeout(() => staggerListIn('.grid-cell'), 50);
```

替换为：

```typescript
setTimeout(() => {
    const rows = document.querySelectorAll<HTMLElement>('.grid-row');
    rows.forEach((row, i) => {
        const cells = row.querySelectorAll<HTMLElement>('.grid-cell');
        cells.forEach((cell) => {
            cell.style.opacity = '0';
            cell.style.transform = 'translateY(8%)';
            cell.style.transition = `opacity 0.22s ease ${i * 0.1}s, transform 0.22s ease ${i * 0.1}s`;
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    cell.style.opacity = '1';
                    cell.style.transform = 'translateY(0)';
                });
            });
        });
    });
}, 50);
```

> 在 `<template>` 中，给每个 `<tr>` 或外层 row div 添加 `grid-row` class，每个 cell 保持 `grid-cell` class。

### Step 2：移除图片比对 UI

**删除以下 script 变量**（不再需要 image compare）：

```typescript
// 删除：
const compareImageUrl = ref('');
const compareResult = ref('');
```

**删除以下函数**：

```typescript
// 删除：
async function handleCompareImage() { ... }
```

**删除 template 中的比对 UI 区块**（包含 `compareBoxImage` 相关的输入框和结果展示）。

**从 import 行删除**：

```typescript
// 移除：
import { createBoxImage, listBoxImages, compareBoxImage, deleteBoxImage } from '@/api/modules/box-image';
// 改为：
import { createBoxImage, listBoxImages, deleteBoxImage } from '@/api/modules/box-image';
```

也可考虑整体移除图片功能（若 P2 设计中 box image 已归 Node 管理），但本计划仅移除**比对**功能，保留图片列表和上传。

### Step 3：页面自身触发 pageTransitionIn

在 `onMounted` 开头添加：

```typescript
import { pageTransitionIn } from '@/utils/animation';
// ...
onMounted(async () => {
    const main = document.getElementById('main-content');
    if (main) pageTransitionIn(main);
    // ... 其余逻辑不变 ...
});
```

### Step 4：编译验证

```bash
pnpm --filter BSB-Frontend type-check
```

---

## Task 3：BoxDetailPage — 添加删除 Box + 元数据编辑

**Files:**
- Modify: `BSB-Frontend/src/pages/box/BoxDetailPage.vue`
- Check: `BSB-Frontend/src/api/modules/box.ts`（确认是否有 deleteBox API）

### Step 1：检查/添加 deleteBox API

查看 `BSB-Frontend/src/api/modules/box.ts`，若无 `deleteBox`，追加：

```typescript
export const deleteBox = (boxId: string) =>
    alovaInstance.Delete<void>('/box/del', { data: { boxId } });
```

若无 `updateBox`，追加：

```typescript
export const updateBox = (data: { boxId: string; name?: string; description?: string }) =>
    alovaInstance.Put<Box>('/box/update', data);
```

### Step 2：在 BoxDetailPage script 中添加删除逻辑

```typescript
import { useRouter } from 'vue-router';
import { deleteBox } from '@/api/modules/box';

const router = useRouter();
const deleteDialogOpen = ref(false);

async function handleDeleteBox() {
    try {
        await deleteBox(boxId.value).send();
        router.push('/box');
    } catch {
        /* empty */
    }
}
```

### Step 3：在模板 header 区域追加删除按钮 + Dialog

在 box 名称旁的操作区域添加：

```vue
<Dialog v-model:open="deleteDialogOpen">
    <DialogTrigger as-child>
        <Button variant="ghost" size="icon" class="text-bsb-text-quaternary hover:text-red-500">
            <Trash2 class="size-4" />
        </Button>
    </DialogTrigger>
    <DialogContent>
        <DialogHeader><DialogTitle>确认删除储存盒？</DialogTitle></DialogHeader>
        <p class="text-sm text-bsb-text-secondary">删除后所有槽位数据将永久丢失，此操作不可逆。</p>
        <DialogFooter>
            <Button variant="outline" @click="deleteDialogOpen = false">取消</Button>
            <Button class="bg-red-600 text-white hover:bg-red-700" @click="handleDeleteBox">确认删除</Button>
        </DialogFooter>
    </DialogContent>
</Dialog>
```

> 需在 import 中添加：`Trash2`、`Dialog`、`DialogContent`、`DialogFooter`、`DialogHeader`、`DialogTitle`、`DialogTrigger`（部分可能已存在）。

---

## Task 4：BoxDetailPage Slot Drawer 扩展

**Files:**
- Modify: `BSB-Frontend/src/pages/box/BoxDetailPage.vue`

当前：点击 grid cell 无 Drawer。
目标：点击有试剂的 cell → 打开 Drawer，显示试剂详情（名称、类型、放置时间、环境描述、责任人）；点击空 cell → 打开 Drawer，允许摆放新试剂（选类型、填名称）。

### Step 1：添加 Slot Drawer script 逻辑

```typescript
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { listReagentTypes } from '@/api/modules/reagent-type';
import { updateReagent, createReagent } from '@/api/modules/reagent';

interface ReagentType {
    id: string;
    name: string;
    colorHex: string | null;
    unit: string | null;
}

const drawerOpen = ref(false);
const drawerCell = ref<{ row: number; col: number; reagent: typeof reagents.value[0] | null } | null>(null);
const reagentTypes = ref<ReagentType[]>([]);

// Form state for slot drawer
const slotName = ref('');
const slotTypeId = ref('');
const slotDesc = ref('');
const slotSaving = ref(false);

async function openSlotDrawer(row: number, col: number) {
    const reagent = grid.value[row]?.[col] ?? null;
    drawerCell.value = { row: row + 1, col: col + 1, reagent };
    slotName.value = reagent?.name ?? '';
    slotTypeId.value = (reagent as any)?.reagentTypeId ?? '';
    slotDesc.value = reagent?.description ?? '';
    drawerOpen.value = true;

    if (reagentTypes.value.length === 0 && box.value?.orgId) {
        try {
            reagentTypes.value = await listReagentTypes(box.value.orgId).send();
        } catch {
            /* empty */
        }
    }
}

async function handleSaveSlot() {
    if (!drawerCell.value || !box.value) return;
    slotSaving.value = true;
    const position = `${drawerCell.value.row}-${drawerCell.value.col}`;
    try {
        if (drawerCell.value.reagent) {
            // Update existing
            await updateReagent({
                reagentId: drawerCell.value.reagent.id,
                name: slotName.value || undefined,
                description: slotDesc.value || undefined,
                reagentTypeId: slotTypeId.value || undefined,
            }).send();
        } else {
            // Create new
            await createReagent({
                boxId: box.value.id,
                name: slotName.value,
                position,
                reagentTypeId: slotTypeId.value || undefined,
                description: slotDesc.value || undefined,
            }).send();
        }
        // Refresh reagents
        reagents.value = await listReagents(boxId.value).send();
        drawerOpen.value = false;
    } catch {
        /* empty */
    } finally {
        slotSaving.value = false;
    }
}
```

### Step 2：在 template grid cell 添加点击事件

```vue
<!-- 将 grid cell 点击事件从空改为打开 drawer -->
<td
    v-for="(cell, colIdx) in row"
    :key="colIdx"
    class="grid-cell w-12 h-12 border border-bsb-border-standard cursor-pointer transition-colors hover:bg-bsb-bg-surface"
    :class="cell ? 'bg-[#f2f9ff]' : 'bg-white'"
    @click="openSlotDrawer(rowIdx, colIdx)"
>
    <!-- cell content unchanged -->
</td>
```

### Step 3：在 template 末尾添加 Slot Drawer

```vue
<Sheet v-model:open="drawerOpen">
    <SheetContent side="right" class="w-80 border-l border-bsb-border-standard bg-white">
        <SheetHeader>
            <SheetTitle class="text-sm font-[590]">
                槽位 {{ drawerCell?.row }}-{{ drawerCell?.col }}
                <span v-if="drawerCell?.reagent" class="ml-2 text-xs font-normal text-bsb-text-tertiary">（编辑试剂）</span>
                <span v-else class="ml-2 text-xs font-normal text-bsb-text-tertiary">（空槽）</span>
            </SheetTitle>
        </SheetHeader>

        <div class="mt-4 space-y-4">
            <div class="space-y-1.5">
                <Label>试剂名称</Label>
                <Input v-model="slotName" placeholder="输入试剂名称…" class="border-bsb-border-standard" />
            </div>

            <div class="space-y-1.5">
                <Label>试剂类型</Label>
                <Select v-model="slotTypeId">
                    <SelectTrigger class="border-bsb-border-standard">
                        <SelectValue placeholder="选择类型（可选）" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem v-for="rt in reagentTypes" :key="rt.id" :value="rt.id">
                            <div class="flex items-center gap-2">
                                <div v-if="rt.colorHex" class="size-3 rounded-sm" :style="{ background: rt.colorHex }" />
                                {{ rt.name }}
                                <span v-if="rt.unit" class="text-bsb-text-quaternary text-xs">（{{ rt.unit }}）</span>
                            </div>
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div class="space-y-1.5">
                <Label>备注</Label>
                <Input v-model="slotDesc" placeholder="可选" class="border-bsb-border-standard" />
            </div>

            <Button
                :disabled="slotSaving || !slotName.trim()"
                class="w-full bg-bsb-accent-brand text-white hover:bg-bsb-accent-hover"
                @click="handleSaveSlot"
            >
                {{ slotSaving ? '保存中…' : (drawerCell?.reagent ? '更新试剂' : '放置试剂') }}
            </Button>
        </div>
    </SheetContent>
</Sheet>
```

> `createReagent`、`updateReagent` 需在 `BSB-Frontend/src/api/modules/reagent.ts` 中确认或添加。

### Step 4：添加/确认 Reagent API

检查 `BSB-Frontend/src/api/modules/reagent.ts`（若已有则追加缺失函数）：

```typescript
// 若无 createReagent，追加：
export const createReagent = (data: {
    boxId: string;
    name: string;
    position: string;
    description?: string;
    reagentTypeId?: string;
}) => alovaInstance.Post<Reagent>('/reagent/create', data);

// 若无 updateReagent，追加（注意 API 路由与后端一致）：
export const updateReagent = (data: {
    reagentId: string;
    name?: string;
    description?: string;
    reagentTypeId?: string;
}) => alovaInstance.Put<Reagent>('/reagent/update', data);
```

---

## Task 5：新建 ReagentType API 模块

**Files:**
- Create: `BSB-Frontend/src/api/modules/reagent-type.ts`

```typescript
// BSB-Frontend/src/api/modules/reagent-type.ts
import { alovaInstance } from '../client';

export interface ReagentTypeItem {
    id: string;
    orgId: string;
    name: string;
    description: string | null;
    colorHex: string | null;
    unit: string | null;
    createdAt: string;
}

export const createReagentType = (data: {
    orgId: string;
    name: string;
    description?: string;
    colorHex?: string;
    unit?: string;
}) => alovaInstance.Post<ReagentTypeItem>('/reagent-type/add', data);

export const listReagentTypes = (orgId: string) =>
    alovaInstance.Get<ReagentTypeItem[]>('/reagent-type/list', { params: { orgId } });

export const updateReagentType = (data: {
    id: string;
    name?: string;
    description?: string;
    colorHex?: string;
    unit?: string;
}) => alovaInstance.Put<ReagentTypeItem>('/reagent-type/update', data);

export const deleteReagentType = (id: string) =>
    alovaInstance.Delete<void>('/reagent-type/del', { data: { id } });
```

---

## Task 6：新建 ReagentTypePage（`/reagent-type`）

**Files:**
- Create: `BSB-Frontend/src/pages/reagent-type/ReagentTypePage.vue`
- Modify: `BSB-Frontend/src/router/index.ts`
- Modify: `BSB-Frontend/src/layouts/AppLayout.vue`（更新 navItems）

### Step 1：更新 router/index.ts

追加：

```typescript
{
    path: 'reagent-type',
    component: () => import('@/pages/reagent-type/ReagentTypePage.vue'),
},
```

### Step 2：更新 AppLayout.vue navItems

在 navItems 中试剂后面追加（或替换为更精准的路径）：

```typescript
{ path: '/reagent-type', label: '试剂类型', icon: Tag },
```

添加 import：`Tag`（来自 `lucide-vue-next`）

### Step 3：创建 ReagentTypePage.vue

```vue
<!-- BSB-Frontend/src/pages/reagent-type/ReagentTypePage.vue -->
<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { Plus, Trash2, Edit3, Tag } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useOrgStore } from '@/stores/org';
import { createReagentType, listReagentTypes, updateReagentType, deleteReagentType } from '@/api/modules/reagent-type';
import type { ReagentTypeItem } from '@/api/modules/reagent-type';
import { pageTransitionIn, staggerListIn } from '@/utils/animation';

const org = useOrgStore();

const types = ref<ReagentTypeItem[]>([]);
const loading = ref(false);

// Create
const createDialogOpen = ref(false);
const newName = ref('');
const newDesc = ref('');
const newColor = ref('#0075de');
const newUnit = ref('');
const creating = ref(false);
const createError = ref('');

// Edit
const editDialogOpen = ref(false);
const editTarget = ref<ReagentTypeItem | null>(null);
const editName = ref('');
const editDesc = ref('');
const editColor = ref('');
const editUnit = ref('');
const editSaving = ref(false);

const COLOR_PRESETS = [
    '#0075de', '#2a9d99', '#1aae39', '#dd5b00',
    '#ff64c8', '#391c57', '#213183', '#523410',
    '#a39e98', '#615d59',
];

async function fetchTypes() {
    if (!org.currentOrgId) return;
    loading.value = true;
    try {
        types.value = await listReagentTypes(org.currentOrgId).send();
        setTimeout(() => staggerListIn('tr.reagent-type-row'), 50);
    } catch {
        /* empty */
    } finally {
        loading.value = false;
    }
}

async function handleCreate() {
    if (!newName.value.trim() || !org.currentOrgId) return;
    creating.value = true;
    createError.value = '';
    try {
        const created = await createReagentType({
            orgId: org.currentOrgId,
            name: newName.value.trim(),
            description: newDesc.value.trim() || undefined,
            colorHex: newColor.value || undefined,
            unit: newUnit.value.trim() || undefined,
        }).send();
        types.value.push(created);
        newName.value = '';
        newDesc.value = '';
        newColor.value = '#0075de';
        newUnit.value = '';
        createDialogOpen.value = false;
    } catch (e: unknown) {
        createError.value = e instanceof Error ? e.message : '创建失败';
    } finally {
        creating.value = false;
    }
}

function openEdit(item: ReagentTypeItem) {
    editTarget.value = item;
    editName.value = item.name;
    editDesc.value = item.description ?? '';
    editColor.value = item.colorHex ?? '#0075de';
    editUnit.value = item.unit ?? '';
    editDialogOpen.value = true;
}

async function handleEdit() {
    if (!editTarget.value) return;
    editSaving.value = true;
    try {
        const updated = await updateReagentType({
            id: editTarget.value.id,
            name: editName.value || undefined,
            description: editDesc.value || undefined,
            colorHex: editColor.value || undefined,
            unit: editUnit.value || undefined,
        }).send();
        const idx = types.value.findIndex((t) => t.id === updated.id);
        if (idx >= 0) types.value[idx] = updated;
        editDialogOpen.value = false;
    } catch {
        /* empty */
    } finally {
        editSaving.value = false;
    }
}

async function handleDelete(id: string) {
    try {
        await deleteReagentType(id).send();
        types.value = types.value.filter((t) => t.id !== id);
    } catch {
        /* empty */
    }
}

onMounted(async () => {
    const main = document.getElementById('main-content');
    if (main) pageTransitionIn(main);
    await fetchTypes();
});
watch(() => org.currentOrgId, fetchTypes);
</script>

<template>
    <div class="space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
                <Tag class="size-5 text-bsb-text-tertiary" />
                <h1 class="text-2xl font-[590] text-bsb-text-primary">试剂类型</h1>
            </div>
            <Dialog v-model:open="createDialogOpen">
                <DialogTrigger as-child>
                    <Button class="gap-2 bg-bsb-accent-brand text-white hover:bg-bsb-accent-hover">
                        <Plus class="size-4" />
                        新建类型
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader><DialogTitle>新建试剂类型</DialogTitle></DialogHeader>
                    <div class="space-y-3">
                        <div class="space-y-1.5">
                            <Label>名称 <span class="text-red-500">*</span></Label>
                            <Input v-model="newName" placeholder="例：青霉素" class="border-bsb-border-standard" />
                        </div>
                        <div class="space-y-1.5">
                            <Label>颜色标识</Label>
                            <div class="flex flex-wrap gap-2">
                                <button
                                    v-for="c in COLOR_PRESETS"
                                    :key="c"
                                    class="size-6 rounded-md transition-all"
                                    :style="{ background: c, outline: newColor === c ? `2px solid ${c}` : 'none', outlineOffset: '2px' }"
                                    @click="newColor = c"
                                />
                            </div>
                            <div class="flex items-center gap-2">
                                <input v-model="newColor" type="color" class="size-8 cursor-pointer rounded border border-bsb-border-standard" />
                                <code class="text-xs text-bsb-text-tertiary">{{ newColor }}</code>
                            </div>
                        </div>
                        <div class="space-y-1.5">
                            <Label>单位</Label>
                            <Input v-model="newUnit" placeholder="例：mL, mg, μg" class="border-bsb-border-standard" />
                        </div>
                        <div class="space-y-1.5">
                            <Label>描述</Label>
                            <Input v-model="newDesc" placeholder="可选" class="border-bsb-border-standard" />
                        </div>
                        <p v-if="createError" class="text-xs text-red-500">{{ createError }}</p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" @click="createDialogOpen = false">取消</Button>
                        <Button :disabled="creating || !newName.trim()" class="bg-bsb-accent-brand text-white hover:bg-bsb-accent-hover" @click="handleCreate">
                            {{ creating ? '创建中…' : '创建' }}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>

        <!-- Table -->
        <div class="rounded-lg border border-bsb-border-standard bg-white">
            <Table>
                <TableHeader>
                    <TableRow class="border-b border-bsb-border-standard hover:bg-transparent">
                        <TableHead class="text-xs font-medium text-bsb-text-tertiary">色标</TableHead>
                        <TableHead class="text-xs font-medium text-bsb-text-tertiary">名称</TableHead>
                        <TableHead class="text-xs font-medium text-bsb-text-tertiary">单位</TableHead>
                        <TableHead class="text-xs font-medium text-bsb-text-tertiary">描述</TableHead>
                        <TableHead class="w-20 text-xs font-medium text-bsb-text-tertiary">操作</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <TableRow v-if="loading">
                        <TableCell colspan="5" class="py-6 text-center text-sm text-bsb-text-quaternary">加载中…</TableCell>
                    </TableRow>
                    <TableRow v-else-if="types.length === 0">
                        <TableCell colspan="5" class="py-8 text-center text-sm text-bsb-text-quaternary">
                            暂无试剂类型，点击"新建类型"添加第一个
                        </TableCell>
                    </TableRow>
                    <TableRow
                        v-for="t in types"
                        :key="t.id"
                        class="reagent-type-row border-b border-bsb-border-standard hover:bg-bsb-bg-surface/50"
                    >
                        <TableCell>
                            <div
                                v-if="t.colorHex"
                                class="size-5 rounded"
                                :style="{ background: t.colorHex }"
                                :title="t.colorHex"
                            />
                            <div v-else class="size-5 rounded border border-bsb-border-standard bg-bsb-bg-surface" />
                        </TableCell>
                        <TableCell class="text-sm font-medium text-bsb-text-primary">{{ t.name }}</TableCell>
                        <TableCell>
                            <Badge v-if="t.unit" variant="outline" class="text-xs text-bsb-text-tertiary">{{ t.unit }}</Badge>
                            <span v-else class="text-xs text-bsb-text-quaternary">—</span>
                        </TableCell>
                        <TableCell class="max-w-48 truncate text-xs text-bsb-text-tertiary">{{ t.description ?? '—' }}</TableCell>
                        <TableCell>
                            <div class="flex items-center gap-1">
                                <Button variant="ghost" size="icon" class="size-7 text-bsb-text-quaternary hover:text-bsb-text-secondary" @click="openEdit(t)">
                                    <Edit3 class="size-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" class="size-7 text-bsb-text-quaternary hover:text-red-500" @click="handleDelete(t.id)">
                                    <Trash2 class="size-3.5" />
                                </Button>
                            </div>
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </div>
    </div>

    <!-- Edit Dialog -->
    <Dialog v-model:open="editDialogOpen">
        <DialogContent>
            <DialogHeader><DialogTitle>编辑试剂类型</DialogTitle></DialogHeader>
            <div class="space-y-3">
                <div class="space-y-1.5">
                    <Label>名称</Label>
                    <Input v-model="editName" class="border-bsb-border-standard" />
                </div>
                <div class="space-y-1.5">
                    <Label>颜色标识</Label>
                    <div class="flex flex-wrap gap-2">
                        <button
                            v-for="c in COLOR_PRESETS"
                            :key="c"
                            class="size-6 rounded-md transition-all"
                            :style="{ background: c, outline: editColor === c ? `2px solid ${c}` : 'none', outlineOffset: '2px' }"
                            @click="editColor = c"
                        />
                    </div>
                    <div class="flex items-center gap-2">
                        <input v-model="editColor" type="color" class="size-8 cursor-pointer rounded border border-bsb-border-standard" />
                        <code class="text-xs text-bsb-text-tertiary">{{ editColor }}</code>
                    </div>
                </div>
                <div class="space-y-1.5">
                    <Label>单位</Label>
                    <Input v-model="editUnit" class="border-bsb-border-standard" />
                </div>
                <div class="space-y-1.5">
                    <Label>描述</Label>
                    <Input v-model="editDesc" class="border-bsb-border-standard" />
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" @click="editDialogOpen = false">取消</Button>
                <Button :disabled="editSaving" class="bg-bsb-accent-brand text-white hover:bg-bsb-accent-hover" @click="handleEdit">
                    {{ editSaving ? '保存中…' : '保存' }}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>
```

---

## Task 7：BoxCreatePage — 解耦 RootManager，改为 Room Node 选择

**Files:**
- Read + Modify: `BSB-Frontend/src/pages/box/BoxCreatePage.vue`

### 问题

当前 BoxCreatePage 内嵌 `RootManager` 组件（管理 Root），P1/P2 迁移后 Root 变成 `type=ROOM` 的 Node，`RootManager` 组件需要配套更新或替换。

### Solution：使用 Select 组件让用户选择父 Room Node

**Step 1：在 script 中添加 Room 列表**

```typescript
import { filterNodes } from '@/api/modules/node';
import type { NodeItem } from '@/api/modules/node';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const rooms = ref<NodeItem[]>([]);
const selectedRoomId = ref<string>('');

onMounted(async () => {
    if (org.currentOrgId) {
        rooms.value = await filterNodes({ orgId: org.currentOrgId, type: 'ROOM' }).send();
    }
});
watch(() => org.currentOrgId, async (id) => {
    if (id) rooms.value = await filterNodes({ orgId: id, type: 'ROOM' }).send();
});
```

**Step 2：在表单中替换 RootManager**

找到现有的 `<RootManager ... />` 组件，替换为：

```vue
<div class="space-y-1.5">
    <Label>父 Room（可选）</Label>
    <Select v-model="selectedRoomId">
        <SelectTrigger class="border-bsb-border-standard">
            <SelectValue placeholder="选择所属 Room（可不选）" />
        </SelectTrigger>
        <SelectContent>
            <SelectItem v-for="room in rooms" :key="room.id" :value="room.id">
                {{ room.name }}
            </SelectItem>
        </SelectContent>
    </Select>
</div>
```

**Step 3：在 createBox 调用中传入 parentId**

找到提交函数，确保传递 `parentId: selectedRoomId.value || undefined`。

如果 `createBox` API 当前不接受 `parentId`，追加到 API 函数签名：

```typescript
export const createBox = (data: {
    orgId: string;
    name: string;
    rows: number;
    cols: number;
    description?: string;
    parentId?: string;  // Node parentId
}) => alovaInstance.Post<Box>('/box/create', data);
```

> **注意**：确认后端 `/box/create` 是否接受 `parentId`——若 P1/P2 中 Box 已迁移为 Node，则此字段直接传到 Node 层。若尚未迁移，此字段目前无效，可留作占位待 P1 完成。

---

## Task 8：类型检查 + Vitest + ESLint + 提交

### Step 1：类型检查

```bash
pnpm --filter BSB-Frontend type-check
```

**预期**：无错误。

### Step 2：ESLint

```bash
pnpm --filter BSB-Frontend eslint
```

### Step 3：单元测试

新建 `BSB-Frontend/test/unit/pages/reagent-type.spec.ts`：

```typescript
import { setActivePinia, createPinia } from 'pinia';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent } from 'vue';

// Minimal smoke test: ReagentTypePage 中的试剂类型列表数据绑定
vi.mock('@/api/modules/reagent-type', () => ({
    listReagentTypes: () => ({ send: () => Promise.resolve([
        { id: 'rt-1', orgId: 'org-1', name: '青霉素', colorHex: '#0075de', unit: 'mL', description: null, createdAt: '' },
    ]) }),
    createReagentType: () => ({ send: () => Promise.resolve({ id: 'rt-2', orgId: 'org-1', name: '新类型', colorHex: null, unit: null, description: null, createdAt: '' }) }),
    updateReagentType: () => ({ send: () => Promise.resolve({}) }),
    deleteReagentType: () => ({ send: () => Promise.resolve() }),
}));

vi.mock('@/stores/org', () => ({
    useOrgStore: () => ({ currentOrgId: 'org-1' }),
}));

describe('ReagentType API Integration', () => {
    it('listReagentTypes resolves with items', async () => {
        const { listReagentTypes } = await import('@/api/modules/reagent-type');
        const result = await listReagentTypes('org-1').send();
        expect(result[0].name).toBe('青霉素');
    });
});
```

```bash
pnpm --filter BSB-Frontend test
```

### Step 4：提交

```bash
git add BSB-Frontend/
git commit -m "feat(frontend/box+reagent-type): slot drawer, reagent type page, delete box, fix animations"
```

---

## Task 9：实施后审计

```
调用 agent-browser skill，验证以下流程：
1. /reagent-type 页面列表渲染与颜色色标显示
2. 创建试剂类型 Dialog 流程（色标选择器 → 提交 → 表格刷新）
3. 编辑/删除试剂类型
4. /box/:id 页面 slot 动画（逐行 0.1s 延迟 + translateY 8%→0）
5. 点击 cell 打开 Slot Drawer，试剂类型下拉正确加载
6. BoxDetailPage 删除按钮 + Dialog 确认流程
7. BoxCreatePage Room 选择下拉
8. Console 无错误
```

---

## P5 完成 = 全部 5 个阶段完成

验收标准：

```bash
# 后端
pnpm --filter BSB-Backend build    # 无错误
pnpm --filter BSB-Backend test     # 全部通过

# 前端
pnpm --filter BSB-Frontend type-check   # 无错误
pnpm --filter BSB-Frontend test          # 全部通过
pnpm --filter BSB-Frontend build         # 构建成功
```
