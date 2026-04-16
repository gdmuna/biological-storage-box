# 全量修复设计文档

**日期**：2026-04-15
**范围**：前端 + 后端
**优先级**：P0（阻断性 Bug）→ P1（功能缺漏）→ P2（UX 改进）

---

## 问题清单与根因

### P0：全局删除操作失败

**根因**：Alova v3 Delete 方法签名为 `Delete(url, body, config?)`，但代码中所有删除调用均使用 `{ data: { id } }` 作为第二参数，导致实际发送的请求体为 `{"data":{"id":"…"}}` 而非后端期望的 `{"id":"…"}`。

受影响文件：
- `BSB-Frontend/src/api/modules/box.ts`（deleteBox、deleteBoxAlias）
- `BSB-Frontend/src/api/modules/box-image.ts`
- `BSB-Frontend/src/api/modules/node.ts`（deleteNode 同时有字段名错误：`nodeId` → `id`；removeGridConfig）
- `BSB-Frontend/src/api/modules/org.ts`
- `BSB-Frontend/src/api/modules/org-user.ts`（removeMember、quitOrg）
- `BSB-Frontend/src/api/modules/reagent-type.ts`
- `BSB-Frontend/src/api/modules/root.ts`
- `BSB-Frontend/src/api/modules/share.ts`

### P1：功能缺漏

1. **BoxListPage 分组错误**：`/box/root/list` 只按老 Root 分组，nodeId 关联的 Box 归入 rootName=null 组，前端标题显示为空。
2. **空槽无法新增试剂**：后端缺少 `POST /reagent/add` 端点，只有 update。
3. **Slot Drawer 无试剂类型选择**：`slotTypeId` ref 存在但未渲染 Select UI。
4. **CONTAINER 子节点无法展开**：RoomDetailPage 中 CONTAINER 卡片无点击跳转。
5. **BOX 创建缺行/列配置**：Room 添加子节点弹窗仅有名称/描述字段，BOX 类型需要 rows/cols。

### P2：UX 改进

6. **节点画布工具栏无响应式**：在移动端溢出。
7. **节点画布侧边栏无内边距**。
8. **ROOM/CONTAINER 节点缺跳转按钮**。
9. **Drawer 不展示父/子节点关系**。
10. **筛选器名称不直观**（"有网格"→"有网格配置"）。
11. **图片上传无进度反馈**。
12. **仪表盘需要节点画布缩略版**。

---

## 架构决策

### 后端新增接口

#### A. `GET /box/node/list?orgId=`

按 ROOM 节点分组返回 Box 列表：

```typescript
// 返回结构
Array<{
  nodeId: string | null;
  nodeName: string | null;
  boxes: Box[];
}>
```

实现路径：
- `box.repository.ts`：新增 `listGroupedByNode(orgId)` — 查询所有 ROOM type 节点 → include boxes；同时查 `nodeId: null AND rootId: null` 的无归属 Box
- `box.service.ts`：新增 `listGroupedByNode(orgId)`
- `box.controller.ts`：新增 `GET node/list` 路由
- `box.dto.ts`：复用 `BoxRootListDto`（只需要 orgId）

#### B. `POST /reagent/add`

在指定槽位创建新试剂：

```typescript
// CreateReagentDto
{
  boxId: string,        // required
  position: string,     // required，格式 "row-col"，例 "1-3"
  name: string,         // required
  description?: string,
  reagentTypeId?: string,
}
```

实现路径：
- `reagent.repository.ts`：新增 `create(data)` 方法
- `reagent.service.ts`：新增 `create(dto)` 方法（检查 boxId 存在性）
- `reagent.controller.ts`：新增 `POST add` 路由（需要 auth）
- `reagent.dto.ts`：编写 `CreateReagentDto` Schema

### 前端公共组件提取

#### NodeCanvas.vue（从 NodePage.vue 提取）

Props:
```typescript
interface NodeCanvasProps {
  orgId: string           // 组织 ID（数据来源）
  height?: string         // CSS 高度，默认 'calc(100vh - 48px)'
  compact?: boolean       // true = 工具栏默认折叠，无 MiniMap
}
```

NodePage.vue 改为引用 NodeCanvas 并保留完整工具栏。
DashboardPage 嵌入时传 `height="400px" :compact="true"`。

#### NodeCreateDialog.vue（新建）

统一的节点/盒子创建组件：
- 宽屏（`<768px` 以上）→ Dialog
- 窄屏 → Drawer
- 动态表单：type=BOX 时显示 rows/cols + 调用 `createBox`；type=CONTAINER/ROOM 时调用 `createNode`

---

## 修复细节

### 全局 Delete 修复规则

| 文件 | 原写法 | 修复后 |
|------|--------|--------|
| `box.ts#deleteBox` | `Delete('/box/del', { data: { id } })` | `Delete('/box/del', { id })` |
| `box.ts#deleteBoxAlias` | `Delete('/box/alias/del', { data: { id } })` | `Delete('/box/alias/del', { id })` |
| `box-image.ts` | `Delete('/box/image/del', { data: { id } })` | `Delete('/box/image/del', { id })` |
| `node.ts#deleteNode` | `Delete('/node/del', { data: { nodeId } })` | `Delete('/node/del', { id: nodeId })` |
| `node.ts#removeGridConfig` | `Delete('/node/grid/remove', { data: { nodeId } })` | `Delete('/node/grid/remove', { nodeId })` |
| `org.ts#deleteOrg` | `Delete('/org/del', { data: { orgId } })` | `Delete('/org/del', { orgId })` |
| `org-user.ts#removeMember` | `Delete('/org/user/del', { data })` | `Delete('/org/user/del', data)` |
| `org-user.ts#quitOrg` | `Delete('/org/user/quit', { data: { orgId } })` | `Delete('/org/user/quit', { orgId })` |
| `reagent-type.ts` | `Delete('/reagent-type/del', { data: { id } })` | `Delete('/reagent-type/del', { id })` |
| `root.ts` | `Delete('/root/del', { data: { id } })` | `Delete('/root/del', { id })` |
| `share.ts` | `Delete('/share/revoke', { data: { shareId } })` | `Delete('/share/revoke', { shareId })` |

### BoxDetailPage Slot Drawer

新增逻辑：
1. `onMounted` 时同步加载 `listReagentTypes(orgId)`
2. Drawer 中加入 Select（试剂类型）
3. 空槽显示"新增试剂"按钮，调用 `createReagent({ boxId, position, name, reagentTypeId?, description? })`
4. 有试剂时保留"更新试剂"按钮
5. 上传图片时：按钮改为 Loading 状态，完成后显示 toast/inline 提示

### RoomDetailPage → 通用节点详情页

- CONTAINER 卡片加 `@click="router.push('/room/${child.id}')"`
- 添加子节点弹窗升级为 NodeCreateDialog 组件（宽屏 Dialog / 窄屏 Drawer）
- 弹窗类型选择 BOX 时，展示额外的 rows/cols 字段（默认 9, 9）
- 调用逻辑分支：BOX → `createBox({ orgId, nodeId: parent.id, name, desc, rows, cols })` / CONTAINER → `createNode({ orgId, parentId: parent.id, name, desc, type: 'CONTAINER' })`

### NodeCanvas 改造点

1. 工具栏容器：`flex flex-wrap gap-2`，小屏 `overflow-x-auto`
2. SheetContent：加 `p-4`
3. 添加 ROOM/CONTAINER 导航按钮
4. 在 `onNodeClick` 后异步调用 `getNode(selectedNode.id)` 更新 drawer 展示父/子节点
5. filterHasGrid Select 选项文案：`有网格配置` / `无网格配置`
6. compact 模式：工具栏仅显示图例、节点数量，省略过滤器

---

## 验收标准

```bash
# 后端
pnpm --filter BSB-Backend build       # 无错误
pnpm --filter BSB-Backend test        # 全量通过（需新增 /reagent/add、/box/node/list 测试）

# 前端
pnpm --filter BSB-Frontend type-check  # 无错误
pnpm --filter BSB-Frontend eslint      # 0 errors
pnpm --filter BSB-Frontend test        # 全量通过（需新增相关单元测试）
```

功能验收：
- 删除组织、Box、节点、试剂类型不再返回 `CLIENT_PARAMS_VALIDATION_FAILED`
- BoxListPage 正确按 ROOM 分组展示，不出现空标题组
- 空槽点击可新增试剂，已有试剂可选择类型
- RoomDetailPage 中 CONTAINER 可点击进入层级
- 添加 BOX 时能填写行/列数
- 仪表盘展示节点缩略图
- 节点画布在移动端工具栏不溢出
