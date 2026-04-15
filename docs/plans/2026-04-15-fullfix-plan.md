# 全量修复实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 修复所有资源的删除失败问题，补全空槽新增试剂、Box 分组、房间层级导航、节点画布 UX 等功能缺漏。

**Architecture:** 后端新增两个端点（`POST /reagent/add`、`GET /box/node/list`），前端修复 Alova v3 Delete body wrapping 并重构多个页面组件。节点画布提取为可复用的 `NodeCanvas.vue`，嵌入仪表盘缩略版。

**Tech Stack:** NestJS + Prisma（后端），Vue3 + Alova v3 + shadcn-vue + Vue Flow（前端）

> **关键约束：**
> - 包管理：只用 `pnpm`
> - 后端分层：Controller → Service → Repository（Prisma）
> - 前端分层：Page → Store（Pinia）→ API（Alova）
> - Delete body 正确写法：`alovaInstance.Delete(url, { field: value })` — 第二参数直接是请求体对象

---

## Task 1：修复全局 Delete API body wrapping 错误

**背景：** Alova v3 `Delete(url, body)` 第二参数直接作为请求体。现有代码错误地把 `{ data: { ... } }` 作为 body，导致后端收到 `{"data":{"id":"..."}}` 而期望 `{"id":"…"}`。

**Files:**
- Modify: `BSB-Frontend/src/api/modules/box.ts`
- Modify: `BSB-Frontend/src/api/modules/box-image.ts`
- Modify: `BSB-Frontend/src/api/modules/node.ts`
- Modify: `BSB-Frontend/src/api/modules/org.ts`
- Modify: `BSB-Frontend/src/api/modules/org-user.ts`
- Modify: `BSB-Frontend/src/api/modules/reagent-type.ts`
- Modify: `BSB-Frontend/src/api/modules/root.ts`
- Modify: `BSB-Frontend/src/api/modules/share.ts`

**Step 1: 修复 box.ts**

将两处 Delete 调用：
```typescript
// 原来（错误）
export const deleteBox = (id: string) => alovaInstance.Delete<void>('/box/del', { data: { id } });

export const deleteBoxAlias = (id: string) =>
    alovaInstance.Delete<void>('/box/alias/del', { data: { id } });
```
改为：
```typescript
// 修复后
export const deleteBox = (id: string) => alovaInstance.Delete<void>('/box/del', { id });

export const deleteBoxAlias = (id: string) =>
    alovaInstance.Delete<void>('/box/alias/del', { id });
```

**Step 2: 修复 box-image.ts**

```typescript
// 原来
alovaInstance.Delete<void>('/box/image/del', { data: { id } });
// 修复后
alovaInstance.Delete<void>('/box/image/del', { id });
```

**Step 3: 修复 node.ts（注意两处，且 deleteNode 有额外字段名错误）**

```typescript
// 原来（错误）— nodeId 字段名错误，后端 NodeIdDto 期望 id
export const deleteNode = (nodeId: string) => alovaInstance.Delete<void>('/node/del', { data: { nodeId } });
// 修复后
export const deleteNode = (nodeId: string) => alovaInstance.Delete<void>('/node/del', { id: nodeId });

// 原来
export const removeGridConfig = (nodeId: string) =>
    alovaInstance.Delete<void>('/node/grid/remove', { data: { nodeId } });
// 修复后
export const removeGridConfig = (nodeId: string) =>
    alovaInstance.Delete<void>('/node/grid/remove', { nodeId });
```

**Step 4: 修复 org.ts**

```typescript
// 原来
export const deleteOrg = (orgId: string) =>
    alovaInstance.Delete<void>('/org/del', { data: { orgId } });
// 修复后
export const deleteOrg = (orgId: string) =>
    alovaInstance.Delete<void>('/org/del', { orgId });
```

**Step 5: 修复 org-user.ts（两处）**

```typescript
// 原来
export const removeMember = (data: { orgId: string; userId: string }) =>
    alovaInstance.Delete<void>('/org/user/del', { data });

export const quitOrg = (orgId: string) =>
    alovaInstance.Delete<void>('/org/user/quit', { data: { orgId } });
// 修复后
export const removeMember = (data: { orgId: string; userId: string }) =>
    alovaInstance.Delete<void>('/org/user/del', data);

export const quitOrg = (orgId: string) =>
    alovaInstance.Delete<void>('/org/user/quit', { orgId });
```

**Step 6: 修复 reagent-type.ts**

```typescript
// 原来
alovaInstance.Delete<void>('/reagent-type/del', { data: { id } });
// 修复后
alovaInstance.Delete<void>('/reagent-type/del', { id });
```

**Step 7: 修复 root.ts**

```typescript
// 原来
alovaInstance.Delete<void>('/root/del', { data: { id } });
// 修复后
alovaInstance.Delete<void>('/root/del', { id });
```

**Step 8: 修复 share.ts**

```typescript
// 原来: Delete('/share/revoke', { data: { shareId } })
// 修复后:
alovaInstance.Delete<void>('/share/revoke', { shareId });
```

**Step 9: 类型检查验证**

```bash
pnpm --filter BSB-Frontend type-check
```
预期：无错误输出。

**Step 10: ESLint**

```bash
pnpm --filter BSB-Frontend eslint
```
预期：0 errors。

**Step 11: 提交**

```bash
git add BSB-Frontend/src/api/
git commit -m "fix(frontend/api): correct alova delete request body wrapping"
```

---

## Task 2：后端新增 POST /reagent/add 端点

**背景：** `reagent.controller.ts` 目前只有 `GET one`、`GET list`、`PUT update`，缺少创建端点。

**Files:**
- Modify: `BSB-Backend/src/modules/reagent/reagent.dto.ts`
- Modify: `BSB-Backend/src/modules/reagent/reagent.repository.ts`
- Modify: `BSB-Backend/src/modules/reagent/reagent.service.ts`
- Modify: `BSB-Backend/src/modules/reagent/reagent.controller.ts`
- Test: `BSB-Backend/test/e2e/reagent.e2e.spec.ts`（如有）或 `test/unit/modules/reagent.spec.ts`

**Step 1: 在 reagent.dto.ts 末尾追加 CreateReagentDtoSchema**

```typescript
// 追加到 reagent.dto.ts 末尾
const CreateReagentDtoSchema = z
    .object({
        boxId: z.string().min(1).meta({ title: 'Box ID' }),
        position: z
            .string()
            .min(1)
            .max(10)
            .regex(/^\d+-\d+$/, '位置格式应为 row-col，例如 1-3')
            .meta({ title: '位置', example: '1-3' }),
        name: z.string().min(1).max(128).meta({ title: '试剂名称' }),
        description: z.string().max(512).optional().meta({ title: '描述' }),
        reagentTypeId: z.string().optional().meta({ title: '试剂类型 ID' }),
    })
    .meta({ description: '新增试剂请求体' });

export class CreateReagentDto extends createZodDto(CreateReagentDtoSchema) {}
```

**Step 2: 在 reagent.repository.ts 末尾追加 create 方法**

```typescript
// 在 update 方法之后追加
async create(data: {
    boxId: string;
    position: string;
    name: string;
    description?: string;
    reagentTypeId?: string;
}) {
    // 从 box 获取 orgId
    const box = await this.db.box.findUnique({ where: { id: data.boxId }, select: { orgId: true } });
    if (!box) return null;
    return this.db.reagent.create({
        data: {
            boxId: data.boxId,
            orgId: box.orgId,
            position: data.position,
            name: data.name,
            ...(data.description !== undefined && { description: data.description }),
            ...(data.reagentTypeId !== undefined && { reagentTypeId: data.reagentTypeId }),
        },
    });
}
```

**Step 3: 在 reagent.service.ts 引入并添加 create 方法**

在文件顶部 import 中追加 `CreateReagentDto`，然后添加：
```typescript
// 在 update 方法之后追加
async create(dto: CreateReagentDto) {
    const created = await this.reagentRepository.create({
        boxId: dto.boxId,
        position: dto.position,
        name: dto.name,
        description: dto.description,
        reagentTypeId: dto.reagentTypeId,
    });
    if (!created) throw new Error('Box not found');
    return created;
}
```

**Step 4: 在 reagent.controller.ts 添加 POST add 路由**

在 import 中追加 `CreateReagentDto`，然后在 getOne 前插入：
```typescript
@Post('add')
@ApiRoute({
    auth: 'required',
    summary: '在储存盒指定槽位新增试剂',
    errors: [],
})
async create(@Body() body: CreateReagentDto) {
    return this.reagentService.create(body);
}
```

同时在文件顶部 import `Post` from `@nestjs/common`（已有的 import 中只需添加 Post）。

**Step 5: 后端构建验证**

```bash
pnpm --filter BSB-Backend build
```
预期：无 TypeScript 错误。

**Step 6: 后端测试（基本烟测）**

```bash
pnpm --filter BSB-Backend test
```
预期：全部通过（如有 reagent 相关测试文件需补充）。

**Step 7: 提交**

```bash
git add BSB-Backend/src/modules/reagent/
git commit -m "feat(backend/reagent): add POST /reagent/add endpoint"
```

---

## Task 3：后端新增 GET /box/node/list 端点

**背景：** 当前 `/box/root/list` 仅按 Root 分组，Node 架构下的 Box 落入 null 组，前端展示为空标题。

**Files:**
- Modify: `BSB-Backend/src/modules/box/box.repository.ts`
- Modify: `BSB-Backend/src/modules/box/box.service.ts`
- Modify: `BSB-Backend/src/modules/box/box.controller.ts`

**Step 1: 在 box.repository.ts 末尾追加 listGroupedByNode 方法**

```typescript
// 在 listGroupedByRoot 方法之后追加
async listGroupedByNode(orgId: string) {
    // 查询该 org 下所有 ROOM 类型的节点，并 include 关联 Box
    const rooms = await this.db.node.findMany({
        where: { orgId, type: 'ROOM' },
        include: {
            boxes: {
                include: { _count: { select: { reagents: true } } },
            },
        },
        orderBy: { createdAt: 'asc' },
    });

    // 无节点归属的 Box（nodeId: null AND rootId: null 或仅 nodeId: null）
    const unassigned = await this.db.box.findMany({
        where: { orgId, nodeId: null },
        include: { _count: { select: { reagents: true } } },
    });

    const result: Array<{ nodeId: string | null; nodeName: string | null; boxes: unknown[] }> =
        rooms.map((room) => ({
            nodeId: room.id,
            nodeName: room.name,
            boxes: room.boxes,
        }));

    if (unassigned.length > 0) {
        result.push({ nodeId: null, nodeName: null, boxes: unassigned });
    }

    return result;
}
```

**Step 2: 在 box.service.ts 追加 listGroupedByNode**

```typescript
// 在 listGroupedByRoot 方法之后追加
async listGroupedByNode(orgId: string) {
    return this.boxRepository.listGroupedByNode(orgId);
}
```

**Step 3: 在 box.controller.ts 追加 GET node/list 路由**

在 `listGroupedByRoot` 路由之后追加：
```typescript
@Get('node/list')
@ApiRoute({
    auth: 'required',
    summary: '按 ROOM 节点分组获取储存盒列表',
})
async listGroupedByNode(@Query() query: BoxRootListDto) {
    return this.boxService.listGroupedByNode(query.orgId);
}
```

注意：`BoxRootListDto` 已有 `orgId` 字段，可复用。

**Step 4: 构建验证**

```bash
pnpm --filter BSB-Backend build
```
预期：无错误。

**Step 5: 提交**

```bash
git add BSB-Backend/src/modules/box/
git commit -m "feat(backend/box): add GET /box/node/list grouped by room node"
```

---

## Task 4：前端 BoxListPage 切换到 node/list API

**Files:**
- Modify: `BSB-Frontend/src/api/modules/box.ts`
- Modify: `BSB-Frontend/src/pages/box/BoxListPage.vue`

**Step 1: 在 box.ts 末尾追加新 API 函数**

```typescript
// 追加到 box.ts 末尾
export const listBoxesGroupedByNode = (orgId: string) =>
    alovaInstance.Get<{ nodeId: string | null; nodeName: string | null; boxes: Box[] }[]>(
        '/box/node/list',
        { params: { orgId } }
    );
```

**Step 2: 修改 BoxListPage.vue script**

将 script 顶部导入中的 `listBoxesGroupedByRoot` 替换为 `listBoxesGroupedByNode`：

```typescript
// 替换
import { listBoxesGroupedByNode, searchBoxes } from '@/api/modules/box';
// groups 类型改为
const groups = ref<{ nodeId: string | null; nodeName: string | null; boxes: Box[] }[]>([]);
// fetchBoxes 函数
async function fetchBoxes() {
    if (!org.currentOrgId) return;
    try {
        const data = await listBoxesGroupedByNode(org.currentOrgId).send();
        groups.value = data;
        setTimeout(() => staggerListIn('.box-card'), 50);
    } catch {
        /* empty */
    }
}
```

**Step 3: 修改 BoxListPage.vue template**

将 `:key="group.rootId ?? 'unassigned'"` 改为 `:key="group.nodeId ?? 'unassigned'"`，
将 `{{ group.rootName }}` 改为 `{{ group.nodeName ?? '未分配房间' }}`：

```html
<div v-for="group in groups" :key="group.nodeId ?? 'unassigned'" class="space-y-3">
    <h2 class="text-sm font-[510] text-bsb-text-secondary">
        {{ group.nodeName ?? '未分配房间' }}
    </h2>
    <!-- 其余不变 -->
```

**Step 4: 类型检查**

```bash
pnpm --filter BSB-Frontend type-check
```
预期：无错误。

**Step 5: 提交**

```bash
git add BSB-Frontend/src/api/modules/box.ts BSB-Frontend/src/pages/box/BoxListPage.vue
git commit -m "feat(frontend/box): switch box list to node-grouping api"
```

---

## Task 5：前端 BoxDetailPage 完善 Slot Drawer（试剂类型选择 + 空槽新增试剂 + 图片上传反馈）

**Files:**
- Modify: `BSB-Frontend/src/api/modules/box.ts`（新增 createReagent）
- Modify: `BSB-Frontend/src/pages/box/BoxDetailPage.vue`

**Step 1: 在 box.ts 追加 createReagent API**

```typescript
// 追加到 box.ts 末尾（trial - 在 updateReagent 之后）
export const createReagent = (data: {
    boxId: string;
    position: string;
    name: string;
    description?: string;
    reagentTypeId?: string;
}) => alovaInstance.Post<Reagent>('/reagent/add', data);
```

**Step 2: 修改 BoxDetailPage.vue script — 新增 imports**

在当前 imports 末尾追加：
```typescript
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { listReagentTypes } from '@/api/modules/reagent-type';
import { createReagent } from '@/api/modules/box';
import type { ReagentTypeItem } from '@/api/modules/reagent-type';
```

**Step 3: 新增 refs**

在 `slotSaving` ref 之后追加：
```typescript
const reagentTypes = ref<ReagentTypeItem[]>([]);
const imageUploading = ref(false);
const imageUploadMsg = ref('');
```

**Step 4: 修改 onMounted，加载试剂类型**

在 `onMounted` 中，`listBoxLogs` 后追加：
```typescript
if (box.value) {
    const orgId = box.value.orgId;
    reagentTypes.value = await listReagentTypes(orgId).send().catch(() => []);
}
```

**Step 5: 更新 openSlotDrawer，初始化 slotTypeId**

```typescript
function openSlotDrawer(rowIdx: number, colIdx: number) {
    const reagent = grid.value[rowIdx]?.[colIdx] ?? null;
    drawerCell.value = { row: rowIdx + 1, col: colIdx + 1, reagent };
    slotName.value = reagent?.name ?? '';
    slotTypeId.value = reagent?.reagentTypeId ?? '';  // 初始化类型
    slotDesc.value = reagent?.description ?? '';
    drawerOpen.value = true;
}
```

**Step 6: 新增 handleCreateSlot 函数**（空槽新增试剂）

```typescript
async function handleCreateSlot() {
    if (!drawerCell.value || !box.value || !slotName.value.trim()) return;
    slotSaving.value = true;
    try {
        await createReagent({
            boxId: boxId.value,
            position: `${drawerCell.value.row}-${drawerCell.value.col}`,
            name: slotName.value.trim(),
            description: slotDesc.value.trim() || undefined,
            reagentTypeId: slotTypeId.value || undefined,
        }).send();
        reagents.value = await listReagents(boxId.value).send();
        drawerOpen.value = false;
    } catch {
        /* empty */
    } finally {
        slotSaving.value = false;
    }
}
```

**Step 7: 更新 handleSaveSlot，支持试剂类型保存**

```typescript
async function handleSaveSlot() {
    if (!drawerCell.value || !box.value) return;
    slotSaving.value = true;
    try {
        if (drawerCell.value.reagent) {
            await updateReagent({
                id: drawerCell.value.reagent.id,
                name: slotName.value || undefined,
                description: slotDesc.value || undefined,
            }).send();
        }
        reagents.value = await listReagents(boxId.value).send();
        drawerOpen.value = false;
    } catch {
        /* empty */
    } finally {
        slotSaving.value = false;
    }
}
```

**Step 8: 更新 handleUploadImage，加上 loading + 提示**

```typescript
async function handleUploadImage(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    imageUploading.value = true;
    imageUploadMsg.value = '';
    try {
        const uploaded = await uploadFile(file).send();
        await createBoxImage({ boxId: boxId.value, imageUrl: uploaded.url }).send();
        images.value = await listBoxImages(boxId.value).send();
        imageUploadMsg.value = '上传成功';
    } catch {
        imageUploadMsg.value = '上传失败，请重试';
    } finally {
        imageUploading.value = false;
        // 清空 input 以支持重复上传同一文件
        input.value = '';
    }
}
```

**Step 9: 修改 Slot Drawer template**

在 Drawer 的"备注"Input 之后、按钮之前，插入试剂类型 Select：
```html
<div class="space-y-1.5">
    <Label>试剂类型</Label>
    <Select v-model="slotTypeId">
        <SelectTrigger class="border-bsb-border-standard">
            <SelectValue placeholder="选择试剂类型（可选）" />
        </SelectTrigger>
        <SelectContent>
            <SelectItem value="">无</SelectItem>
            <SelectItem v-for="rt in reagentTypes" :key="rt.id" :value="rt.id">
                <div class="flex items-center gap-2">
                    <span v-if="rt.colorHex" class="inline-block size-3 rounded-full" :style="{ background: rt.colorHex }" />
                    {{ rt.name }}
                </div>
            </SelectItem>
        </SelectContent>
    </Select>
</div>
```

将原来仅有"更新试剂"按钮的区域改为：
```html
<!-- 有试剂：更新 -->
<Button
    v-if="drawerCell?.reagent"
    :disabled="slotSaving"
    class="w-full bg-bsb-accent-brand text-white hover:bg-bsb-accent-hover"
    @click="handleSaveSlot"
>
    {{ slotSaving ? '保存中…' : '更新试剂' }}
</Button>
<!-- 空槽：新增 -->
<Button
    v-else
    :disabled="slotSaving || !slotName.trim()"
    class="w-full bg-bsb-accent-brand text-white hover:bg-bsb-accent-hover"
    @click="handleCreateSlot"
>
    {{ slotSaving ? '保存中…' : '新增试剂' }}
</Button>
```

**Step 10: 修改图片上传区域**

将 `<Input type="file" ...>` 改为：
```html
<div class="flex items-center gap-3">
    <label class="cursor-pointer">
        <span
            class="inline-flex h-9 items-center gap-2 rounded-md border border-bsb-border-standard bg-white px-3 text-sm text-bsb-text-secondary transition hover:bg-bsb-bg-surface disabled:opacity-50"
            :class="imageUploading ? 'opacity-50 pointer-events-none' : ''"
        >
            <span v-if="imageUploading">上传中…</span>
            <span v-else>选择图片</span>
        </span>
        <input type="file" accept="image/*" class="sr-only" :disabled="imageUploading" @change="handleUploadImage" />
    </label>
    <span v-if="imageUploadMsg" class="text-xs" :class="imageUploadMsg.includes('失败') ? 'text-red-500' : 'text-green-600'">{{ imageUploadMsg }}</span>
</div>
```

**Step 11: 确保 Reagent schema 有 reagentTypeId 字段**

检查 `BSB-Frontend/src/schemas/box.schema.ts` 中 `Reagent` 类型是否包含 `reagentTypeId?: string | null`。若没有，追加该字段：
```typescript
reagentTypeId: z.string().nullable().optional(),
```

**Step 12: 类型检查**

```bash
pnpm --filter BSB-Frontend type-check
```
预期：无错误。

**Step 13: ESLint**

```bash
pnpm --filter BSB-Frontend eslint
```
预期：0 errors。

**Step 14: 提交**

```bash
git add BSB-Frontend/src/
git commit -m "feat(frontend/box): add reagent create in slot drawer, reagent type select, upload feedback"
```

---

## Task 6：前端 RoomDetailPage CONTAINER 导航 + 统一建节点弹窗（响应式 Dialog/Drawer）

**Files:**
- Modify: `BSB-Frontend/src/pages/room/RoomDetailPage.vue`

**Step 1: CONTAINER 子节点卡片点击跳转**

找到 template 中 CONTAINER 卡片的 `@click` 绑定：
```html
@click="child.type === 'BOX' ? router.push(`/box/${child.id}`) : undefined"
```
改为：
```html
@click="child.type === 'BOX' ? router.push(`/box/${child.id}`) : router.push(`/room/${child.id}`)"
```

**Step 2: 在 script setup 顶部追加响应式宽度检测**

```typescript
import { useWindowSize } from '@vueuse/core';
const { width } = useWindowSize();
const isNarrow = computed(() => width.value < 768);
```

注意：若项目未安装 `@vueuse/core`，改用手动方式：
```typescript
const isNarrow = ref(false);
function updateWidth() { isNarrow.value = window.innerWidth < 768; }
onMounted(() => { updateWidth(); window.addEventListener('resize', updateWidth); });
onUnmounted(() => window.removeEventListener('resize', updateWidth));
```
并在 script 中引入 `onUnmounted`。

**Step 3: 在 script setup 追加 BOX 相关 refs**

```typescript
import { createBox } from '@/api/modules/box';
const newRows = ref(9);
const newCols = ref(9);
```

**Step 4: 更新 handleCreate 逻辑分支**

```typescript
async function handleCreate() {
    if (!newName.value.trim() || !org.currentOrgId) return;
    creating.value = true;
    createError.value = '';
    try {
        if (newType.value === 'BOX') {
            // BOX 类型：通过 createBox API 创建，并刷新 children
            await createBox({
                orgId: org.currentOrgId,
                nodeId: nodeId.value,   // 父节点 ID
                name: newName.value.trim(),
                description: newDesc.value.trim() || undefined,
                rows: newRows.value,
                cols: newCols.value,
            }).send();
            // 重新拉取子节点列表（因为 createBox 会创建 Node 并关联 boxId）
            children.value = await filterNodes({
                orgId: org.currentOrgId,
                parentId: nodeId.value,
            }).send();
        } else {
            const created = await nodeStore.addNode({
                orgId: org.currentOrgId,
                parentId: nodeId.value,
                name: newName.value.trim(),
                description: newDesc.value.trim() || undefined,
                type: newType.value,
            });
            children.value.push(created);
        }
        newName.value = '';
        newDesc.value = '';
        newRows.value = 9;
        newCols.value = 9;
        createDialogOpen.value = false;
        setTimeout(() => staggerListIn('.child-card'), 50);
    } catch (e: unknown) {
        createError.value = e instanceof Error ? e.message : '创建失败';
    } finally {
        creating.value = false;
    }
}
```

**Step 5: 安装 Drawer 组件（如未安装）**

```bash
cd BSB-Frontend && npx shadcn-vue@latest add drawer --yes
```

**Step 6: 重构"添加子节点"弹窗为响应式 Dialog/Drawer**

在 script 顶部 import 追加：
```typescript
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/components/ui/drawer';
```

将原来的 Dialog `<DialogContent>...</DialogContent>` 部分提取为一个共享的内联模板，用 `v-if/v-else` 在 Dialog 和 Drawer 之间切换。完整 template 结构：

```html
<!-- 窄屏 Drawer -->
<Drawer v-if="isNarrow" v-model:open="createDialogOpen">
    <DrawerContent>
        <DrawerHeader><DrawerTitle>添加子节点</DrawerTitle></DrawerHeader>
        <!-- 表单内容（见下方共享部分） -->
        <div class="p-4 space-y-3">
            <!-- 与 Dialog 相同的表单字段 -->
        </div>
        <DrawerFooter class="flex gap-2">
            <Button variant="outline" @click="createDialogOpen = false">取消</Button>
            <Button :disabled="creating || !newName.trim()" class="bg-bsb-accent-brand text-white hover:bg-bsb-accent-hover flex-1" @click="handleCreate">
                {{ creating ? '创建中…' : '创建' }}
            </Button>
        </DrawerFooter>
    </DrawerContent>
</Drawer>

<!-- 宽屏 Dialog -->
<Dialog v-else v-model:open="createDialogOpen">
    <DialogContent>
        <DialogHeader><DialogTitle>添加子节点</DialogTitle></DialogHeader>
        <div class="space-y-3">
            <!-- 表单字段 -->
        </div>
        <DialogFooter>
            <Button variant="outline" @click="createDialogOpen = false">取消</Button>
            <Button :disabled="creating || !newName.trim()" class="bg-bsb-accent-brand text-white hover:bg-bsb-accent-hover" @click="handleCreate">
                {{ creating ? '创建中…' : '创建' }}
            </Button>
        </DialogFooter>
    </DialogContent>
</Dialog>
```

在两个弹窗内部，表单字段结构相同，包括：
- 名称 Input（必填）
- 类型 Select（BOX / CONTAINER）
- **当 newType === 'BOX' 时，额外显示行数/列数 Number Input**：
```html
<template v-if="newType === 'BOX'">
    <div class="grid grid-cols-2 gap-3">
        <div class="space-y-1.5">
            <Label>行数</Label>
            <Input v-model.number="newRows" type="number" min="1" max="99" />
        </div>
        <div class="space-y-1.5">
            <Label>列数</Label>
            <Input v-model.number="newCols" type="number" min="1" max="99" />
        </div>
    </div>
</template>
```
- 描述 Input（可选）
- 错误提示

**Step 7: 同时更新"添加子节点"按钮触发逻辑**

将 `<DialogTrigger as-child>` 改为统一的触发按钮（不使用 Trigger，手动设置 `createDialogOpen = true`）：

```html
<Button size="sm" variant="outline" class="gap-1.5 ..." @click="createDialogOpen = true">
    <Plus class="size-4" />
    添加子节点
</Button>
```

**Step 8: 类型检查 + ESLint**

```bash
pnpm --filter BSB-Frontend type-check && pnpm --filter BSB-Frontend eslint
```

**Step 9: 提交**

```bash
git add BSB-Frontend/src/pages/room/
git commit -m "feat(frontend/room): container nav, responsive create dialog, box rows/cols"
```

---

## Task 7：提取 NodeCanvas.vue 组件

**背景：** 将 NodePage 的 Vue Flow 画布逻辑提取为独立的 `NodeCanvas.vue` 组件，以便仪表盘复用。

**Files:**
- Create: `BSB-Frontend/src/components/node/NodeCanvas.vue`
- Modify: `BSB-Frontend/src/pages/node/NodePage.vue`

**Step 1: 创建 NodeCanvas.vue**

`NodeCanvas.vue` 接受 props：

```typescript
// Props
interface Props {
    orgId: string;
    height?: string;      // CSS height 字符串，默认 'calc(100vh - 48px)'
    compact?: boolean;    // true = 工具栏折叠
}
```

将 NodePage.vue 中从 `vfNodes/vfEdges` 到 `handleContextMenu` 的所有 script 逻辑、以及完整画布 template 移入 NodeCanvas.vue，使用 `props.orgId` 代替 `org.currentOrgId`（在组件内部仍可调用 nodeStore），`props.height` 作为画布容器的 `min-height` style。

**compact 模式**：当 `compact === true` 时，工具栏只显示图例和节点计数，隐藏 Filter 两个 Select 和 MiniMap：
```html
<template v-if="!compact">
    <!-- Filter: Type -->
    <Select .../>
    <!-- Filter: Grid -->
    <Select .../>
</template>
```

**Step 2: 修改 NodePage.vue**

移除所有已提取到 NodeCanvas 的逻辑，改为：
```vue
<template>
    <NodeCanvas :orgId="org.currentOrgId ?? ''" />
</template>

<script setup lang="ts">
import { useOrgStore } from '@/stores/org';
import NodeCanvas from '@/components/node/NodeCanvas.vue';
const org = useOrgStore();
</script>
```

**Step 3: 类型检查**

```bash
pnpm --filter BSB-Frontend type-check
```

**Step 4: 提交**

```bash
git add BSB-Frontend/src/components/node/ BSB-Frontend/src/pages/node/NodePage.vue
git commit -m "refactor(frontend/node): extract NodeCanvas.vue reusable component"
```

---

## Task 8：NodeCanvas UX 修复（响应式工具栏、内边距、父子节点、跳转按钮）

**Files:**
- Modify: `BSB-Frontend/src/components/node/NodeCanvas.vue`

**Step 1: 工具栏响应式**

将工具栏 div 的 class 改为支持换行：
```html
<div class="flex flex-wrap items-center gap-2 border-b border-bsb-border-standard bg-white px-4 py-2 overflow-x-auto">
```

**Step 2: 侧边栏内边距**

在 `<SheetContent>` 中加入 `class="... p-4"`（确保覆盖默认样式）：
```html
<SheetContent side="right" class="w-80 border-l border-bsb-border-standard bg-white p-4">
```

**Step 3: 新增父/子节点加载**

在 `onNodeClick` 回调中异步加载详情：
```typescript
import { getNode } from '@/api/modules/node';
const selectedNodeDetail = ref<NodeItem | null>(null);

onNodeClick(async ({ node }) => {
    selectedNode.value = node.data as NodeItem;
    drawerOpen.value = true;
    ctxMenu.value.visible = false;
    // 异步加载含子节点的完整信息
    try {
        selectedNodeDetail.value = await getNode(selectedNode.value.id).send();
    } catch {
        selectedNodeDetail.value = null;
    }
});
```

**Step 4: 在 Drawer 中展示父/子节点**

在"节点 ID"信息之后、删除按钮之前增加：
```html
<!-- 父节点 -->
<div v-if="selectedNodeDetail?.parentId" class="space-y-1">
    <p class="text-xs font-medium uppercase tracking-wide text-bsb-text-tertiary">父节点</p>
    <button
        class="text-sm text-bsb-accent-brand underline-offset-2 hover:underline"
        @click="router.push(`/room/${selectedNodeDetail.parentId}`); drawerOpen = false"
    >
        查看父节点
    </button>
</div>
<!-- 子节点列表 -->
<div v-if="selectedNodeDetail?.children && selectedNodeDetail.children.length > 0" class="space-y-1">
    <p class="text-xs font-medium uppercase tracking-wide text-bsb-text-tertiary">直接子节点（{{ selectedNodeDetail.children.length }}）</p>
    <div class="flex flex-wrap gap-1.5">
        <Badge
            v-for="child in selectedNodeDetail.children"
            :key="child.id"
            variant="outline"
            class="cursor-pointer text-xs hover:bg-bsb-bg-surface"
            @click="child.type === 'BOX' ? router.push(`/box/${child.id}`) : router.push(`/room/${child.id}`); drawerOpen = false"
        >
            {{ child.name }}
        </Badge>
    </div>
</div>
```

**Step 5: 为 ROOM/CONTAINER 添加跳转按钮**

在删除按钮前，当 selectedNode 不是 BOX 时显示跳转按钮：
```html
<Button
    v-if="selectedNode && selectedNode.type !== 'BOX'"
    size="sm"
    variant="outline"
    class="flex-1 border-bsb-border-standard text-bsb-text-secondary"
    @click="() => { router.push(`/room/${selectedNode!.id}`); drawerOpen = false; }"
>
    打开节点页
</Button>
```

**Step 6: 重命名筛选选项文案**

将 `<SelectItem value="yes">有网格</SelectItem>` 改为 `有网格配置`，
`<SelectItem value="no">无网格</SelectItem>` 改为 `无网格配置`。

**Step 7: 类型检查 + ESLint**

```bash
pnpm --filter BSB-Frontend type-check && pnpm --filter BSB-Frontend eslint
```

**Step 8: 提交**

```bash
git add BSB-Frontend/src/components/node/NodeCanvas.vue
git commit -m "fix(frontend/node-canvas): responsive toolbar, sidebar padding, parent/child nav"
```

---

## Task 9：仪表盘嵌入 NodeCanvas 缩略版

**Files:**
- Modify: `BSB-Frontend/src/pages/dashboard/DashboardPage.vue`

**Step 1: 在 DashboardPage.vue 中引入 NodeCanvas**

在 script 中追加：
```typescript
import NodeCanvas from '@/components/node/NodeCanvas.vue';
```

**Step 2: 在 template 末尾追加画布区域**

在 stats 卡片网格之后追加：
```html
<!-- Node Canvas 缩略版 -->
<div v-if="org.currentOrgId" class="space-y-3">
    <h2 class="text-sm font-[510] text-bsb-text-secondary">节点关系图</h2>
    <div class="overflow-hidden rounded-xl border border-bsb-border-standard">
        <NodeCanvas :org-id="org.currentOrgId" height="400px" :compact="true" />
    </div>
</div>
```

**Step 3: 类型检查**

```bash
pnpm --filter BSB-Frontend type-check
```

**Step 4: 提交**

```bash
git add BSB-Frontend/src/pages/dashboard/DashboardPage.vue
git commit -m "feat(frontend/dashboard): embed node canvas widget"
```

---

## Task 10：全量验证与最终提交

**Step 1: 后端完整验证**

```bash
pnpm --filter BSB-Backend build
pnpm --filter BSB-Backend test
```
预期：构建无错误，所有测试通过。

**Step 2: 前端完整验证**

```bash
pnpm --filter BSB-Frontend type-check
pnpm --filter BSB-Frontend eslint
pnpm --filter BSB-Frontend test
pnpm --filter BSB-Frontend test:e2e
```
预期：无错误，0 ESLint warnings，所有单元测试通过。

**Step 3: 检查 BSB-Frontend/src/schemas/box.schema.ts**

确认 `Reagent` 类型包含 `reagentTypeId` 字段（Task 5 Step 11 的补充验证）。

**Step 4: 最终 commit（如有任何散落改动）**

```bash
git add .
git commit -m "test(frontend): update unit tests for new box/reagent/node features"
```

---

## 快速参考

### Alova v3 Delete 正确姿势

```typescript
// ✅ 正确：body 直接传对象
alovaInstance.Delete<void>('/path/del', { id })
alovaInstance.Delete<void>('/path/del', { orgId })

// ❌ 错误（发送 {"data":{"id":"..."}}）
alovaInstance.Delete<void>('/path/del', { data: { id } })
```

### 后端 DTO 字段名参考

| 端点 | @Body 字段 |
|------|-----------|
| `DELETE /box/del` | `id` |
| `DELETE /box/alias/del` | `id` |
| `DELETE /box/image/del` | `id` |
| `DELETE /node/del` | `id` |
| `DELETE /node/grid/remove` | `nodeId` |
| `DELETE /org/del` | `orgId` |
| `DELETE /org/user/del` | `{ orgId, userId }` |
| `DELETE /org/user/quit` | `orgId` |
| `DELETE /reagent-type/del` | `id` |
| `DELETE /root/del` | `id` |
| `DELETE /share/revoke` | `shareId` |

### 调试命令

```bash
# 启动后端（开发模式）
pnpm --filter BSB-Backend start:dev

# 启动前端
pnpm --filter BSB-Frontend dev

# 后端日志位置
BSB-Backend/logs/
```
