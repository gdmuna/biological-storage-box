# P4：前端 Room 页 + Node Canvas（Vue Flow）

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 新增独立的 `/room` RoomListPage 与 `/room/:id` RoomDetailPage，彻底解耦当前嵌入 BoxCreatePage 的 Root/Room 管理逻辑；将 `/node` 路由替换为基于 Vue Flow 的交互式资源关系图 NodeCanvasPage，支持 ROOM/BOX/CONTAINER 三色节点、过滤面板、右键菜单、详情 Drawer。

**Architecture:** 新增 Vue Flow 依赖（`@vue-flow/core`），RoomListPage/RoomDetailPage 直接调用 Node API（type=ROOM），NodeCanvasPage 以 `useVueFlow` 管理节点与边，使用 Pinia store 管理节点树状态。

---

## 规范速查

实施前必读：
- [BSB-Frontend/AGENTS.md](../../BSB-Frontend/AGENTS.md)
- [BSB-Frontend/DESIGN.md](../../BSB-Frontend/DESIGN.md)
- [docs/plans/2026-04-15-full-system-redesign.md](./2026-04-15-full-system-redesign.md)

---

## 前置规范阅读

```
1. 读取 BSB-Frontend/DESIGN.md — 确认 bsb-* CSS 变量、节点颜色方案
2. 调用 ui-ux-pro-max skill — 获取 Vue Flow 样式集成建议、节点卡片设计方案
```

**前置条件验证：**

```bash
pnpm --filter BSB-Frontend type-check   # 必须通过（P3 无遗留错误）
```

---

## Task 1：安装 Vue Flow 依赖

**Goal:** 添加 `@vue-flow/core` 以支持 Node Canvas。

```bash
pnpm --filter BSB-Frontend add @vue-flow/core
```

**验证：**

```bash
pnpm --filter BSB-Frontend type-check
```

**预期**：无错误，`@vue-flow/core` 类型可用。

---

## Task 2：新建 Node API 扩展

**Files:**
- Modify: `BSB-Frontend/src/api/modules/node.ts`（若已存在则追加，不存在则新建）

### Step 1：检查是否存在

```bash
# 检查文件是否存在
Test-Path BSB-Frontend/src/api/modules/node.ts
```

### Step 2：创建/扩展 node.ts

若文件不存在，创建完整文件；若存在则在末尾追加缺失函数。最终文件包含：

```typescript
// BSB-Frontend/src/api/modules/node.ts
import { alovaInstance } from '../client';

export interface NodeItem {
    id: string;
    orgId: string;
    parentId: string | null;
    name: string;
    description: string | null;
    type: 'ROOM' | 'BOX' | 'CONTAINER';
    metadata: Record<string, unknown> | null;
    createdAt: string;
    updatedAt: string;
    gridConfig: { rows: number; cols: number } | null;
    _count?: { children: number };
}

export const createNode = (data: {
    orgId: string;
    parentId?: string;
    name: string;
    description?: string;
    type?: 'ROOM' | 'BOX' | 'CONTAINER';
    metadata?: Record<string, unknown>;
}) => alovaInstance.Post<NodeItem>('/node/add', data);

export const getNode = (nodeId: string) =>
    alovaInstance.Get<NodeItem>('/node/one', { params: { nodeId } });

export const listNodes = (orgId: string) =>
    alovaInstance.Get<NodeItem[]>('/node/list', { params: { orgId } });

export const getNodeTree = (orgId: string) =>
    alovaInstance.Get<NodeItem & { children: NodeItem[] }>('/node/tree', { params: { orgId } });

export const updateNode = (data: {
    id: string;
    parentId?: string | null;
    name?: string;
    description?: string;
    type?: 'ROOM' | 'BOX' | 'CONTAINER';
    metadata?: Record<string, unknown>;
}) => alovaInstance.Put<NodeItem>('/node/update', data);

export const deleteNode = (nodeId: string) =>
    alovaInstance.Delete<void>('/node/del', { data: { nodeId } });

export const setGridConfig = (data: { nodeId: string; rows: number; cols: number }) =>
    alovaInstance.Post<{ nodeId: string; rows: number; cols: number }>('/node/grid/set', data);

export const removeGridConfig = (nodeId: string) =>
    alovaInstance.Delete<void>('/node/grid/remove', { data: { nodeId } });

export const filterNodes = (params: {
    orgId: string;
    type?: 'ROOM' | 'BOX' | 'CONTAINER';
    hasGrid?: boolean;
    parentId?: string | null;
}) => alovaInstance.Get<NodeItem[]>('/node/filter', { params });
```

---

## Task 3：新建 NodeStore（Pinia）

**Files:**
- Create: `BSB-Frontend/src/stores/node.ts`

```typescript
// BSB-Frontend/src/stores/node.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { getNodeTree, filterNodes, deleteNode, createNode, updateNode } from '@/api/modules/node';
import type { NodeItem } from '@/api/modules/node';

export const useNodeStore = defineStore('node', () => {
    const nodes = ref<NodeItem[]>([]);
    const loading = ref(false);

    async function fetchByOrg(orgId: string) {
        loading.value = true;
        try {
            nodes.value = await filterNodes({ orgId }).send();
        } finally {
            loading.value = false;
        }
    }

    async function fetchRooms(orgId: string) {
        loading.value = true;
        try {
            nodes.value = await filterNodes({ orgId, type: 'ROOM' }).send();
        } finally {
            loading.value = false;
        }
    }

    async function addNode(data: Parameters<typeof createNode>[0]) {
        const created = await createNode(data).send();
        nodes.value.push(created);
        return created;
    }

    async function removeNode(nodeId: string) {
        await deleteNode(nodeId).send();
        nodes.value = nodes.value.filter((n) => n.id !== nodeId);
    }

    async function editNode(data: Parameters<typeof updateNode>[0]) {
        const updated = await updateNode(data).send();
        const idx = nodes.value.findIndex((n) => n.id === updated.id);
        if (idx >= 0) nodes.value[idx] = updated;
        return updated;
    }

    return { nodes, loading, fetchByOrg, fetchRooms, addNode, removeNode, editNode };
});
```

---

## Task 4：新建 RoomListPage（`/room`）

**Files:**
- Create: `BSB-Frontend/src/pages/room/RoomListPage.vue`
- Modify: `BSB-Frontend/src/router/index.ts`
- Modify: `BSB-Frontend/src/layouts/AppLayout.vue`（更新 navItems）

### Step 1：更新 router/index.ts

在 `/org/:id` 路由后追加：

```typescript
{
    path: 'room',
    component: () => import('@/pages/room/RoomListPage.vue'),
},
{
    path: 'room/:id',
    component: () => import('@/pages/room/RoomDetailPage.vue'),
},
```

### Step 2：更新 AppLayout.vue navItems

将 `{ path: '/node', label: '节点管理', icon: MapPin }` 改为：

```typescript
{ path: '/room', label: '房间', icon: Home },
{ path: '/node', label: '节点图', icon: Network },
```

新增 import：`Home`, `Network`（来自 `lucide-vue-next`）

### Step 3：创建 RoomListPage.vue

```vue
<!-- BSB-Frontend/src/pages/room/RoomListPage.vue -->
<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { Plus, Home, ChevronRight } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useOrgStore } from '@/stores/org';
import { useNodeStore } from '@/stores/node';
import { staggerListIn, pageTransitionIn } from '@/utils/animation';

const router = useRouter();
const org = useOrgStore();
const nodeStore = useNodeStore();

const createDialogOpen = ref(false);
const newName = ref('');
const newDesc = ref('');
const creating = ref(false);
const createError = ref('');

async function fetchRooms() {
    if (!org.currentOrgId) return;
    await nodeStore.fetchRooms(org.currentOrgId);
    setTimeout(() => staggerListIn('.room-card'), 50);
}

async function handleCreate() {
    if (!newName.value.trim() || !org.currentOrgId) return;
    creating.value = true;
    createError.value = '';
    try {
        await nodeStore.addNode({
            orgId: org.currentOrgId,
            name: newName.value.trim(),
            description: newDesc.value.trim() || undefined,
            type: 'ROOM',
        });
        newName.value = '';
        newDesc.value = '';
        createDialogOpen.value = false;
        setTimeout(() => staggerListIn('.room-card'), 50);
    } catch (e: unknown) {
        createError.value = e instanceof Error ? e.message : '创建失败';
    } finally {
        creating.value = false;
    }
}

onMounted(fetchRooms);
watch(() => org.currentOrgId, fetchRooms);
</script>

<template>
    <div class="space-y-6">
        <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
                <Home class="size-5 text-bsb-text-tertiary" />
                <h1 class="text-2xl font-[590] text-bsb-text-primary">房间</h1>
            </div>
            <Dialog v-model:open="createDialogOpen">
                <DialogTrigger as-child>
                    <Button class="gap-2 bg-bsb-accent-brand text-white hover:bg-bsb-accent-hover">
                        <Plus class="size-4" />
                        新建房间
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>新建房间</DialogTitle>
                    </DialogHeader>
                    <div class="space-y-3">
                        <div class="space-y-1.5">
                            <Label>名称 <span class="text-red-500">*</span></Label>
                            <Input v-model="newName" placeholder="例：4°C 冷藏间" class="border-bsb-border-standard" />
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

        <!-- Room grid -->
        <div v-if="nodeStore.nodes.length > 0" class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Card
                v-for="room in nodeStore.nodes"
                :key="room.id"
                class="room-card cursor-pointer border-bsb-border-standard bg-white transition-all hover:border-[#0075de]/30 hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
                @click="router.push(`/room/${room.id}`)"
            >
                <CardHeader class="pb-2">
                    <div class="flex items-start justify-between">
                        <div class="flex items-center gap-2.5">
                            <div class="flex size-8 items-center justify-center rounded-lg bg-[#f2f9ff] text-bsb-accent-brand">
                                <Home class="size-4" />
                            </div>
                            <CardTitle class="text-sm text-bsb-text-primary">{{ room.name }}</CardTitle>
                        </div>
                        <ChevronRight class="size-4 text-bsb-text-quaternary" />
                    </div>
                </CardHeader>
                <CardContent>
                    <p v-if="room.description" class="line-clamp-2 text-xs text-bsb-text-tertiary">{{ room.description }}</p>
                    <p v-else class="text-xs text-bsb-text-quaternary">暂无描述</p>
                    <div class="mt-2 flex items-center gap-1">
                        <Badge variant="outline" class="text-xs text-bsb-text-quaternary">
                            {{ room._count?.children ?? 0 }} 个子节点
                        </Badge>
                    </div>
                </CardContent>
            </Card>
        </div>

        <div v-else-if="!nodeStore.loading" class="flex flex-col items-center justify-center py-16 text-center">
            <Home class="mb-3 size-10 text-bsb-text-quaternary" />
            <p class="text-sm font-medium text-bsb-text-secondary">暂无房间</p>
            <p class="mt-1 text-xs text-bsb-text-quaternary">点击"新建房间"创建第一个储存空间</p>
        </div>

        <div v-if="nodeStore.loading" class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div v-for="i in 3" :key="i" class="h-24 animate-pulse rounded-xl bg-bsb-bg-surface" />
        </div>
    </div>
</template>
```

---

## Task 5：新建 RoomDetailPage（`/room/:id`）

**Files:**
- Create: `BSB-Frontend/src/pages/room/RoomDetailPage.vue`

```vue
<!-- BSB-Frontend/src/pages/room/RoomDetailPage.vue -->
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ArrowLeft, Home, Plus, Network, Trash2 } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNodeStore } from '@/stores/node';
import { useOrgStore } from '@/stores/org';
import { getNode, filterNodes } from '@/api/modules/node';
import type { NodeItem } from '@/api/modules/node';
import { staggerListIn, pageTransitionIn } from '@/utils/animation';

const route = useRoute();
const router = useRouter();
const nodeStore = useNodeStore();
const org = useOrgStore();

const nodeId = computed(() => route.params.id as string);

const roomNode = ref<NodeItem | null>(null);
const children = ref<NodeItem[]>([]);

const createDialogOpen = ref(false);
const newName = ref('');
const newDesc = ref('');
const newType = ref<'BOX' | 'CONTAINER'>('CONTAINER');
const creating = ref(false);
const createError = ref('');

const deleteDialogOpen = ref(false);

const typeColorMap: Record<string, string> = {
    BOX: 'border-[#0075de]/30 text-[#0075de] bg-[#f2f9ff]',
    CONTAINER: 'border-[#2a9d99]/30 text-[#2a9d99] bg-[#f0fafa]',
    ROOM: 'border-[#213183]/30 text-[#213183] bg-[#f0f2ff]',
};

onMounted(async () => {
    const main = document.getElementById('main-content');
    if (main) pageTransitionIn(main);

    try {
        [roomNode.value, children.value] = await Promise.all([
            getNode(nodeId.value).send(),
            filterNodes({ orgId: org.currentOrgId!, parentId: nodeId.value }).send(),
        ]);
        setTimeout(() => staggerListIn('.child-card'), 50);
    } catch {
        /* empty */
    }
});

async function handleCreate() {
    if (!newName.value.trim() || !org.currentOrgId) return;
    creating.value = true;
    createError.value = '';
    try {
        const created = await nodeStore.addNode({
            orgId: org.currentOrgId,
            parentId: nodeId.value,
            name: newName.value.trim(),
            description: newDesc.value.trim() || undefined,
            type: newType.value,
        });
        children.value.push(created);
        newName.value = '';
        newDesc.value = '';
        createDialogOpen.value = false;
        setTimeout(() => staggerListIn('.child-card'), 50);
    } catch (e: unknown) {
        createError.value = e instanceof Error ? e.message : '创建失败';
    } finally {
        creating.value = false;
    }
}

async function handleDelete() {
    try {
        await nodeStore.removeNode(nodeId.value);
        router.push('/room');
    } catch {
        /* empty */
    }
}
</script>

<template>
    <div class="space-y-6">
        <!-- Header -->
        <div class="flex items-center gap-3">
            <Button variant="ghost" size="icon" class="shrink-0 text-bsb-text-tertiary hover:text-bsb-text-primary" @click="router.push('/room')">
                <ArrowLeft class="size-4" />
            </Button>
            <div class="flex items-center gap-2.5">
                <div class="flex size-8 items-center justify-center rounded-lg bg-[#f2f9ff] text-bsb-accent-brand">
                    <Home class="size-4" />
                </div>
                <div>
                    <h1 class="text-2xl font-[590] text-bsb-text-primary">{{ roomNode?.name ?? '加载中…' }}</h1>
                    <p v-if="roomNode?.description" class="text-xs text-bsb-text-tertiary">{{ roomNode.description }}</p>
                </div>
            </div>

            <!-- Actions -->
            <div class="ml-auto flex items-center gap-2">
                <Button variant="outline" size="sm" class="gap-1.5 border-bsb-border-standard text-bsb-text-secondary" @click="router.push('/node')">
                    <Network class="size-4" />
                    在节点图中查看
                </Button>
                <Dialog v-model:open="deleteDialogOpen">
                    <DialogTrigger as-child>
                        <Button variant="ghost" size="icon" class="text-bsb-text-quaternary hover:text-red-500">
                            <Trash2 class="size-4" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>确认删除房间？</DialogTitle></DialogHeader>
                        <p class="text-sm text-bsb-text-secondary">删除后无法恢复，且会递归删除所有子节点。</p>
                        <DialogFooter>
                            <Button variant="outline" @click="deleteDialogOpen = false">取消</Button>
                            <Button class="bg-red-600 text-white hover:bg-red-700" @click="handleDelete">确认删除</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>

        <!-- Children section -->
        <div class="space-y-3">
            <div class="flex items-center justify-between">
                <h2 class="text-sm font-[510] text-bsb-text-secondary">子节点（{{ children.length }}）</h2>
                <Dialog v-model:open="createDialogOpen">
                    <DialogTrigger as-child>
                        <Button size="sm" variant="outline" class="gap-1.5 border-bsb-border-standard text-bsb-text-secondary hover:text-bsb-text-primary">
                            <Plus class="size-4" />
                            添加子节点
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>添加子节点</DialogTitle></DialogHeader>
                        <div class="space-y-3">
                            <div class="space-y-1.5">
                                <Label>名称 <span class="text-red-500">*</span></Label>
                                <Input v-model="newName" placeholder="例：A01 货架" class="border-bsb-border-standard" />
                            </div>
                            <div class="space-y-1.5">
                                <Label>类型</Label>
                                <Select v-model="newType">
                                    <SelectTrigger class="border-bsb-border-standard">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="BOX">BOX（储存盒）</SelectItem>
                                        <SelectItem value="CONTAINER">CONTAINER（通用容器）</SelectItem>
                                    </SelectContent>
                                </Select>
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

            <div v-if="children.length > 0" class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Card
                    v-for="child in children"
                    :key="child.id"
                    class="child-card cursor-pointer border-bsb-border-standard bg-white transition-all hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
                    @click="child.type === 'BOX' ? router.push(`/box/${child.id}`) : undefined"
                >
                    <CardHeader class="pb-2">
                        <CardTitle class="text-sm text-bsb-text-primary">{{ child.name }}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Badge variant="outline" :class="typeColorMap[child.type] ?? ''">{{ child.type }}</Badge>
                        <p v-if="child.description" class="mt-1 text-xs text-bsb-text-quaternary">{{ child.description }}</p>
                    </CardContent>
                </Card>
            </div>
            <p v-else class="text-sm text-bsb-text-quaternary">暂无子节点</p>
        </div>
    </div>
</template>
```

---

## Task 6：NodeCanvasPage（`/node`）— Vue Flow 资源关系图

**Files:**
- Modify: `BSB-Frontend/src/pages/node/NodePage.vue`（重写为 Canvas 实现）

> **策略**：保留文件路径不变（`/node` 路由不变），完整替换现有简单列表实现。

### Step 1：完整替换文件内容

```vue
<!-- BSB-Frontend/src/pages/node/NodePage.vue -->
<script setup lang="ts">
import { onMounted, ref, watch, computed } from 'vue';
import {
    VueFlow,
    useVueFlow,
    type Node as VFNode,
    type Edge as VFEdge,
    MarkerType,
    Background,
    Controls,
    MiniMap,
} from '@vue-flow/core';
import '@vue-flow/core/dist/style.css';
import '@vue-flow/core/dist/theme-default.css';
import { Home, Box, Layers, Filter, X, ChevronRight, Trash2, Edit3 } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useOrgStore } from '@/stores/org';
import { useNodeStore } from '@/stores/node';
import { filterNodes } from '@/api/modules/node';
import type { NodeItem } from '@/api/modules/node';
import { pageTransitionIn } from '@/utils/animation';

const org = useOrgStore();
const nodeStore = useNodeStore();

// Vue Flow
const { onNodeClick, onPaneClick } = useVueFlow();
const vfNodes = ref<VFNode[]>([]);
const vfEdges = ref<VFEdge[]>([]);

// Filter state
const filterType = ref<'ALL' | 'ROOM' | 'BOX' | 'CONTAINER'>('ALL');
const filterHasGrid = ref<'ALL' | 'yes' | 'no'>('ALL');

// Detail Drawer
const drawerOpen = ref(false);
const selectedNode = ref<NodeItem | null>(null);

// Context menu (right-click)
const ctxMenu = ref({ visible: false, x: 0, y: 0, nodeId: '' });

// Color coding per type
const typeStyle: Record<string, { bg: string; border: string; icon: typeof Home }> = {
    ROOM: { bg: '#f0f2ff', border: '#213183', icon: Home },
    BOX: { bg: '#f2f9ff', border: '#0075de', icon: Box },
    CONTAINER: { bg: '#f0fafa', border: '#2a9d99', icon: Layers },
};

function buildVFNodes(items: NodeItem[]): VFNode[] {
    return items.map((n, i) => ({
        id: n.id,
        type: 'default',
        label: n.name,
        data: { ...n },
        position: { x: 180 * (i % 5), y: 160 * Math.floor(i / 5) },
        style: {
            background: typeStyle[n.type]?.bg ?? '#f6f5f4',
            border: `1.5px solid ${typeStyle[n.type]?.border ?? '#a39e98'}`,
            borderRadius: '8px',
            padding: '10px 14px',
            fontSize: '13px',
            fontWeight: '500',
            minWidth: '130px',
        },
    }));
}

function buildVFEdges(items: NodeItem[]): VFEdge[] {
    return items
        .filter((n) => n.parentId)
        .map((n) => ({
            id: `${n.parentId}-${n.id}`,
            source: n.parentId!,
            target: n.id,
            markerEnd: { type: MarkerType.ArrowClosed, color: '#a39e98' },
            style: { stroke: '#a39e98', strokeWidth: 1.5 },
        }));
}

const filteredNodes = computed(() => {
    let items = nodeStore.nodes;
    if (filterType.value !== 'ALL') items = items.filter((n) => n.type === filterType.value);
    if (filterHasGrid.value === 'yes') items = items.filter((n) => n.gridConfig !== null);
    if (filterHasGrid.value === 'no') items = items.filter((n) => n.gridConfig === null);
    return items;
});

watch(filteredNodes, (items) => {
    vfNodes.value = buildVFNodes(items);
    vfEdges.value = buildVFEdges(items);
}, { immediate: true });

onNodeClick(({ node }) => {
    selectedNode.value = node.data as NodeItem;
    drawerOpen.value = true;
    ctxMenu.value.visible = false;
});

onPaneClick(() => {
    ctxMenu.value.visible = false;
});

async function fetchCanvas() {
    if (!org.currentOrgId) return;
    await nodeStore.fetchByOrg(org.currentOrgId);
}

onMounted(async () => {
    const main = document.getElementById('main-content');
    if (main) pageTransitionIn(main);
    await fetchCanvas();
});

watch(() => org.currentOrgId, fetchCanvas);

async function handleDeleteSelected() {
    if (!selectedNode.value) return;
    await nodeStore.removeNode(selectedNode.value.id);
    drawerOpen.value = false;
    selectedNode.value = null;
}

function handleContextMenu(event: MouseEvent) {
    // Delegated from VueFlow wrapper div
    const target = (event.target as HTMLElement).closest('[data-id]');
    if (!target) return;
    event.preventDefault();
    ctxMenu.value = {
        visible: true,
        x: event.clientX,
        y: event.clientY,
        nodeId: (target as HTMLElement).dataset.id ?? '',
    };
}
</script>

<template>
    <!-- Full-height canvas layout -->
    <div class="flex h-[calc(100vh-48px)] flex-col gap-0 -m-6">
        <!-- Toolbar -->
        <div class="flex items-center gap-3 border-b border-bsb-border-standard bg-white px-5 py-2.5">
            <span class="text-sm font-[510] text-bsb-text-primary">节点关系图</span>
            <Separator orientation="vertical" class="h-4 bg-bsb-border-standard" />

            <!-- Filter: Type -->
            <div class="flex items-center gap-1.5">
                <Filter class="size-3.5 text-bsb-text-quaternary" />
                <Select v-model="filterType">
                    <SelectTrigger class="h-7 w-36 border-bsb-border-standard text-xs">
                        <SelectValue placeholder="类型" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">全部类型</SelectItem>
                        <SelectItem value="ROOM">ROOM</SelectItem>
                        <SelectItem value="BOX">BOX</SelectItem>
                        <SelectItem value="CONTAINER">CONTAINER</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <!-- Filter: Grid -->
            <Select v-model="filterHasGrid">
                <SelectTrigger class="h-7 w-32 border-bsb-border-standard text-xs">
                    <SelectValue placeholder="网格" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="ALL">全部</SelectItem>
                    <SelectItem value="yes">有网格</SelectItem>
                    <SelectItem value="no">无网格</SelectItem>
                </SelectContent>
            </Select>

            <!-- Legend -->
            <div class="ml-auto flex items-center gap-3">
                <div v-for="(style, type) in typeStyle" :key="type" class="flex items-center gap-1">
                    <div class="size-3 rounded-sm" :style="{ background: style.bg, border: `1.5px solid ${style.border}` }" />
                    <span class="text-xs text-bsb-text-tertiary">{{ type }}</span>
                </div>
                <Badge variant="outline" class="text-xs text-bsb-text-quaternary">{{ filteredNodes.length }} 个节点</Badge>
            </div>
        </div>

        <!-- Vue Flow Canvas -->
        <div class="relative flex-1" @contextmenu.prevent="handleContextMenu">
            <VueFlow
                v-model:nodes="vfNodes"
                v-model:edges="vfEdges"
                :fit-view-on-init="true"
                class="h-full w-full"
            >
                <Background pattern-color="#e8e6e3" :gap="20" />
                <Controls />
                <MiniMap
                    :node-color="(n) => typeStyle[(n.data as NodeItem).type]?.border ?? '#a39e98'"
                    class="rounded-lg border border-bsb-border-standard"
                />
            </VueFlow>
        </div>

        <!-- Context Menu -->
        <div
            v-if="ctxMenu.visible"
            class="fixed z-50 min-w-[140px] rounded-lg border border-bsb-border-standard bg-white py-1 shadow-[0_4px_18px_rgba(0,0,0,0.08)]"
            :style="{ left: `${ctxMenu.x}px`, top: `${ctxMenu.y}px` }"
        >
            <button class="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-bsb-text-primary hover:bg-bsb-bg-surface" @click="() => { const n = nodeStore.nodes.find(n => n.id === ctxMenu.nodeId); if (n) { selectedNode = n; drawerOpen = true; }; ctxMenu.visible = false; }">
                <ChevronRight class="size-4" /> 查看详情
            </button>
            <button class="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-red-500 hover:bg-red-50" @click="() => { nodeStore.removeNode(ctxMenu.nodeId); ctxMenu.visible = false; }">
                <Trash2 class="size-4" /> 删除节点
            </button>
        </div>

        <!-- Detail Drawer -->
        <Sheet v-model:open="drawerOpen">
            <SheetContent side="right" class="w-80 border-l border-bsb-border-standard bg-white">
                <SheetHeader>
                    <div class="flex items-center gap-2">
                        <div
                            v-if="selectedNode"
                            class="flex size-7 items-center justify-center rounded"
                            :style="{ background: typeStyle[selectedNode.type]?.bg, border: `1.5px solid ${typeStyle[selectedNode.type]?.border}` }"
                        >
                            <component :is="typeStyle[selectedNode?.type ?? 'CONTAINER']?.icon ?? Layers" class="size-4" :style="{ color: typeStyle[selectedNode?.type ?? 'CONTAINER']?.border }" />
                        </div>
                        <SheetTitle class="text-sm font-[590] text-bsb-text-primary">{{ selectedNode?.name }}</SheetTitle>
                    </div>
                </SheetHeader>

                <div v-if="selectedNode" class="mt-4 space-y-4">
                    <div class="space-y-1">
                        <p class="text-xs font-medium text-bsb-text-tertiary uppercase tracking-wide">类型</p>
                        <Badge variant="outline" class="text-xs">{{ selectedNode.type }}</Badge>
                    </div>
                    <div v-if="selectedNode.description" class="space-y-1">
                        <p class="text-xs font-medium text-bsb-text-tertiary uppercase tracking-wide">描述</p>
                        <p class="text-sm text-bsb-text-secondary">{{ selectedNode.description }}</p>
                    </div>
                    <div v-if="selectedNode.gridConfig" class="space-y-1">
                        <p class="text-xs font-medium text-bsb-text-tertiary uppercase tracking-wide">网格配置</p>
                        <p class="text-sm text-bsb-text-secondary">{{ selectedNode.gridConfig.rows }} × {{ selectedNode.gridConfig.cols }}</p>
                    </div>
                    <div class="space-y-1">
                        <p class="text-xs font-medium text-bsb-text-tertiary uppercase tracking-wide">节点 ID</p>
                        <code class="text-xs text-bsb-text-quaternary break-all">{{ selectedNode.id }}</code>
                    </div>

                    <Separator class="bg-bsb-border-standard" />

                    <div class="flex gap-2">
                        <Button
                            v-if="selectedNode.type === 'BOX'"
                            size="sm"
                            variant="outline"
                            class="flex-1 border-bsb-border-standard text-bsb-text-secondary"
                            @click="() => { $router.push(`/box/${selectedNode!.id}`); drawerOpen = false; }"
                        >
                            打开储存盒
                        </Button>
                        <Button size="sm" variant="outline" class="flex-1 border-red-200 text-red-500 hover:bg-red-50" @click="handleDeleteSelected">
                            <Trash2 class="mr-1.5 size-3.5" />
                            删除
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    </div>
</template>
```

### Step 2：添加 CSS（在 style.css 或 vite.config 中引入 Vue Flow 样式）

在 `BSB-Frontend/src/style.css` 末尾追加（或在 main.ts 中 import）：

```css
/* Vue Flow — 确保 marker 路径可见 */
.vue-flow__edge-path {
    stroke-width: 1.5;
}
.vue-flow__controls {
    background: #fff;
    border: 1px solid rgba(0,0,0,0.1);
    border-radius: 6px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
```

---

## Task 7：类型检查 + ESLint + Vitest + 提交

### Step 1：类型检查

```bash
pnpm --filter BSB-Frontend type-check
```

**预期**：无错误（Vue Flow 类型需 `@vue-flow/core` package 提供）。

### Step 2：ESLint

```bash
pnpm --filter BSB-Frontend eslint
```

### Step 3：单元测试（NodeStore）

在 `BSB-Frontend/test/unit/stores/node.spec.ts`：

```typescript
import { setActivePinia, createPinia } from 'pinia';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useNodeStore } from '@/stores/node';

vi.mock('@/api/modules/node', () => ({
    filterNodes: () => ({ send: () => Promise.resolve([
        { id: 'n1', name: 'Room A', type: 'ROOM', parentId: null, orgId: 'org-1', metadata: null, gridConfig: null, description: null, createdAt: '', updatedAt: '' },
    ]) }),
    createNode: () => ({ send: () => Promise.resolve({ id: 'n2', name: 'Box 1', type: 'BOX', parentId: 'n1', orgId: 'org-1', metadata: null, gridConfig: null, description: null, createdAt: '', updatedAt: '' }) }),
    deleteNode: () => ({ send: () => Promise.resolve() }),
    updateNode: () => ({ send: () => Promise.resolve({ id: 'n1', name: 'Room A Updated', type: 'ROOM', parentId: null, orgId: 'org-1', metadata: null, gridConfig: null, description: null, createdAt: '', updatedAt: '' }) }),
    getNodeTree: () => ({ send: () => Promise.resolve([]) }),
}));

describe('useNodeStore', () => {
    beforeEach(() => setActivePinia(createPinia()));

    it('fetchByOrg loads nodes', async () => {
        const store = useNodeStore();
        await store.fetchByOrg('org-1');
        expect(store.nodes.length).toBe(1);
        expect(store.nodes[0].type).toBe('ROOM');
    });

    it('addNode appends to list', async () => {
        const store = useNodeStore();
        await store.fetchByOrg('org-1');
        await store.addNode({ orgId: 'org-1', name: 'Box 1', type: 'BOX', parentId: 'n1' });
        expect(store.nodes.length).toBe(2);
    });

    it('removeNode removes from list', async () => {
        const store = useNodeStore();
        await store.fetchByOrg('org-1');
        await store.removeNode('n1');
        expect(store.nodes.length).toBe(0);
    });
});
```

```bash
pnpm --filter BSB-Frontend test
```

### Step 4：提交

```bash
git add BSB-Frontend/
git commit -m "feat(frontend/room+node): add RoomListPage, RoomDetailPage, NodeCanvasPage with Vue Flow"
```

---

## Task 8：实施后审计

```
调用 agent-browser skill，验证以下流程：
1. /room 页面房间卡片列表渲染
2. 新建房间 Dialog 交互（填写 + 提交 + 列表刷新）
3. /room/:id 子节点列表渲染
4. /node Vue Flow 画布加载、节点显示（三色区分）
5. 点击节点打开 Detail Drawer
6. 过滤器按 type 过滤节点
7. MiniMap 及 Controls 正常显示
8. Console 无错误
```

---

## P4 完成后

移交 P5：[docs/plans/2026-04-15-phase-5-frontend-box-reagenttype.md](./2026-04-15-phase-5-frontend-box-reagenttype.md)
