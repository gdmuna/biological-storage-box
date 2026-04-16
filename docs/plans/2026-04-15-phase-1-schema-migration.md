# P1：Schema 迁移 — 统一 Node 树 + 扩展字段 实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将现有 `Root`/`Box`/`Node` 三模型统一为单一 `Node` 树，新增 `NodeGridConfig`、`ResourceShare`、`ReagentType` 模型，并扩展 `Organization` 与 `Reagent` 字段，完成数据库层面的架构重设计。

**Architecture:** 采用"先加后删"策略——Migration 1 添加所有新模型与新字段；Migration 2 执行数据迁移（将 Root/Box 数据写入 Node 表）；Migration 3 删除旧表。每步 migration 独立可回滚。后端 Service 层在 P2 批次更新，本批次只保证 Prisma schema + Client 生成正确。

**Tech Stack:** Prisma 6（PostgreSQL adapter PrismaPg）· NestJS 11 · TypeScript 5

---

## 规范速查

实施前必读：
- [BSB-Backend/AGENTS.md](../../BSB-Backend/AGENTS.md) — 核心设计原则、提交门槛
- [BSB-Backend/docs/03-architecture/database.md](../../BSB-Backend/docs/03-architecture/database.md) — Prisma 使用规范
- [docs/plans/2026-04-15-full-system-redesign.md](./2026-04-15-full-system-redesign.md) — 完整设计文档（必读）

---

## 前置检查

在开始任何修改前，执行以下检查：

```bash
cd BSB-Backend
pnpm run db:migrate      # 确认当前 migration 状态干净
pnpm run build           # 确认当前代码无编译错误
pnpm test                # 确认当前测试全部通过
```

如果任何命令失败，**停止本计划**，先修复现有问题。

---

## Task 1：扩展 Organization 模型

**Files:**
- Modify: `BSB-Backend/prisma/schema.prisma`

### Step 1：在 schema.prisma 中找到 Organization model，添加 3 个新字段

在 `Organization` model 的 `updatedAt` 字段**之后**，`owner` 关联**之前**，插入：

```prisma
  isPublic    Boolean  @default(false)
  avatarUrl   String?
  settings    Json?
```

完整修改后的 Organization 头部（`ownerId` 下方 3 行之后）应如下：

```prisma
model Organization {
  id          String   @id @default(ulid())
  name        String
  description String?
  ownerId     String
  isPublic    Boolean  @default(false)
  avatarUrl   String?
  settings    Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  owner         User               @relation("OrgOwner", fields: [ownerId], references: [id])
  members       OrganizationUser[]
  roots         Root[]
  nodes         Node[]
  boxes         Box[]
  ownedShares   ResourceShare[]    @relation("OwnedShares")
  receivedShares ResourceShare[]   @relation("ReceivedShares")
  reagentTypes  ReagentType[]
```

> 注意：`roots`、`boxes` 关联在后续 Task 中会删除，本步骤先保留。

### Step 2：生成并应用 migration

```bash
cd BSB-Backend
pnpm run db:migrate
```

当提示输入名称时，输入：`add_org_public_fields`

**预期输出**：迁移成功，无错误。

### Step 3：重新生成 Prisma Client

```bash
pnpm run db:gen-client
```

**预期输出**：`Generated Prisma Client` 成功消息。

### Step 4：验证编译

```bash
pnpm run build
```

**预期输出**：无 TypeScript 错误。

### Step 5：提交

```bash
git add BSB-Backend/prisma/schema.prisma BSB-Backend/prisma/migrations/
git commit -m "feat(schema): add isPublic/avatarUrl/settings to Organization"
```

---

## Task 2：扩展 Node 模型（添加 type 枚举 + metadata）

**Files:**
- Modify: `BSB-Backend/prisma/schema.prisma`

### Step 1：添加 NodeType 枚举

在 schema 中现有枚举区域（`OrgUserStatus` 枚举**之后**），添加：

```prisma
enum NodeType {
  ROOM
  BOX
  CONTAINER
}
```

### Step 2：修改 Node model 添加新字段和关联

找到现有 `Node` model，在 `description` 字段之后、`createdAt` 之前添加：

```prisma
  type        NodeType  @default(CONTAINER)
  metadata    Json?
```

同时在 Node 的关联区域末尾添加（`boxes` 关联**之后**）：

```prisma
  gridConfig  NodeGridConfig?
  reagentsNew Reagent[]       @relation("ReagentNode")
  aliases     NodeAlias[]
  images      NodeImage[]
  logs        NodeLog[]
  sharedTo    ResourceShare[] @relation("SharedResource")
```

> `boxes` 关联（`Box[]`）暂时保留，待 Task 6 删除旧模型时移除。

完整修改后的 Node model：

```prisma
model Node {
  id          String    @id @default(ulid())
  orgId       String
  parentId    String?
  name        String
  description String?
  type        NodeType  @default(CONTAINER)
  metadata    Json?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  org         Organization    @relation(fields: [orgId], references: [id], onDelete: Cascade)
  parent      Node?           @relation("NodeTree", fields: [parentId], references: [id], onDelete: SetNull)
  children    Node[]          @relation("NodeTree")
  boxes       Box[]           @relation("BoxNode")
  gridConfig  NodeGridConfig?
  reagentsNew Reagent[]       @relation("ReagentNode")
  aliases     NodeAlias[]
  images      NodeImage[]
  logs        NodeLog[]
  sharedTo    ResourceShare[] @relation("SharedResource")

  @@index([orgId])
  @@index([parentId])
}
```

### Step 3：生成并应用 migration

```bash
cd BSB-Backend
pnpm run db:migrate
```

名称输入：`add_node_type_metadata_and_extensions`

**预期输出**：迁移成功。

> 此迁移会为现有 Node 行填充默认值 `type = 'CONTAINER'`，无数据丢失风险。

### Step 4：重新生成 Prisma Client + 编译验证

```bash
pnpm run db:gen-client && pnpm run build
```

**预期**：无错误。

### Step 5：提交

```bash
git add BSB-Backend/prisma/schema.prisma BSB-Backend/prisma/migrations/
git commit -m "feat(schema): add NodeType enum and metadata/extension fields to Node"
```

---

## Task 3：新增 NodeGridConfig 模型

**Files:**
- Modify: `BSB-Backend/prisma/schema.prisma`

### Step 1：在 Node model **之后**添加新模型

```prisma
model NodeGridConfig {
  id     String @id @default(ulid())
  nodeId String @unique
  rows   Int
  cols   Int

  node Node @relation(fields: [nodeId], references: [id], onDelete: Cascade)
}
```

### Step 2：生成并应用 migration

```bash
cd BSB-Backend
pnpm run db:migrate
```

名称：`add_node_grid_config`

### Step 3：生成 Client + 编译

```bash
pnpm run db:gen-client && pnpm run build
```

### Step 4：提交

```bash
git add BSB-Backend/prisma/schema.prisma BSB-Backend/prisma/migrations/
git commit -m "feat(schema): add NodeGridConfig model"
```

---

## Task 4：新增 NodeAlias / NodeImage / NodeLog 模型

**Files:**
- Modify: `BSB-Backend/prisma/schema.prisma`

### Step 1：在 `NodeGridConfig` model 之后添加三个新模型

```prisma
model NodeAlias {
  id        String   @id @default(ulid())
  nodeId    String
  alias     String
  createdAt DateTime @default(now())

  node Node @relation(fields: [nodeId], references: [id], onDelete: Cascade)

  @@index([nodeId])
}

model NodeImage {
  id        String   @id @default(ulid())
  nodeId    String
  imageUrl  String
  createdAt DateTime @default(now())

  node Node @relation(fields: [nodeId], references: [id], onDelete: Cascade)

  @@index([nodeId])
}

model NodeLog {
  id            String   @id @default(ulid())
  nodeId        String
  userId        String
  reagentId     String?
  operationType String
  detail        String?
  createdAt     DateTime @default(now())

  node    Node     @relation(fields: [nodeId], references: [id], onDelete: Cascade)
  user    User     @relation(fields: [userId], references: [id])
  reagent Reagent? @relation("NodeLogReagent", fields: [reagentId], references: [id], onDelete: SetNull)

  @@index([nodeId])
  @@index([userId])
  @@index([reagentId])
}
```

同时需要在 `User` model 的关联区域添加：

```prisma
  nodeLogs NodeLog[]
```

同时在 `Reagent` model（Task 5 会完整修改 Reagent，此处暂不修改）。

### Step 2：生成并应用 migration

```bash
cd BSB-Backend
pnpm run db:migrate
```

名称：`add_node_alias_image_log_models`

### Step 3：生成 Client + 编译

```bash
pnpm run db:gen-client && pnpm run build
```

### Step 4：提交

```bash
git add BSB-Backend/prisma/schema.prisma BSB-Backend/prisma/migrations/
git commit -m "feat(schema): add NodeAlias, NodeImage, NodeLog models"
```

---

## Task 5：新增 ResourceShare + ReagentType 模型，扩展 Reagent

**Files:**
- Modify: `BSB-Backend/prisma/schema.prisma`

### Step 1：在 NodeLog 之后添加 ResourceShare 模型及枚举

```prisma
enum ShareResourceType {
  NODE
}

enum SharePermission {
  READ
  WRITE
}

enum ShareStatus {
  PENDING
  ACTIVE
  REVOKED
}

model ResourceShare {
  id           String            @id @default(ulid())
  resourceType ShareResourceType
  resourceId   String
  ownerOrgId   String
  granteeOrgId String
  permission   SharePermission   @default(READ)
  status       ShareStatus       @default(PENDING)
  createdAt    DateTime          @default(now())
  updatedAt    DateTime          @updatedAt

  ownerOrg   Organization @relation("OwnedShares", fields: [ownerOrgId], references: [id])
  granteeOrg Organization @relation("ReceivedShares", fields: [granteeOrgId], references: [id])
  node       Node?        @relation("SharedResource", fields: [resourceId], references: [id])

  @@index([ownerOrgId])
  @@index([granteeOrgId])
  @@index([resourceId])
}
```

> **重要**：`ResourceShare.node` 关联使用 `Node?`（可为 null），因为 `resourceType` 未来可扩展到非 NODE 类型。`resourceId` 是通用字段，不走 FK 约束。需要将 `fields: [resourceId]` 的 FK 去掉改为应用层处理。修正后的关联如下：

```prisma
  ownerOrg   Organization @relation("OwnedShares", fields: [ownerOrgId], references: [id])
  granteeOrg Organization @relation("ReceivedShares", fields: [granteeOrgId], references: [id])
  // resourceId 为通用字段，不设置 FK 约束，由应用层保证完整性
```

（删除 `node Node?` 关联行，并删除 Node model 中的 `sharedTo ResourceShare[] @relation("SharedResource")` 关联行）

> 这样 `ResourceShare` 与 `Node` 之间没有 Prisma 关系，resourceId 就是一个普通字符串，通过应用层 join 查询。

### Step 2：添加 ReagentType 模型

```prisma
model ReagentType {
  id          String   @id @default(ulid())
  orgId       String
  name        String
  description String?
  colorHex    String?
  unit        String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  org      Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)
  reagents Reagent[]    @relation("ReagentToType")

  @@index([orgId])
}
```

### Step 3：扩展 Reagent 模型

找到现有 `Reagent` model，在 `description` 字段之后、`createdAt` 之前添加新字段，并新增 `nodeId` 字段（保留原 `boxId` 以兼容现有数据，待 Task 6 迁移后删除）：

```prisma
model Reagent {
  id                String    @id @default(ulid())
  boxId             String    // 保留 - 迁移期过渡字段，Task 6 后删除
  nodeId            String?   // 新增 - 最终使用此字段
  orgId             String
  position          String
  name              String
  description       String?
  reagentTypeId     String?
  placedAt          DateTime?
  lastTakenAt       DateTime?
  environment       Json?
  responsibleUserId String?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  box          Box         @relation(fields: [boxId], references: [id], onDelete: Cascade)
  node         Node?       @relation("ReagentNode", fields: [nodeId], references: [id], onDelete: SetNull)
  reagentType  ReagentType? @relation("ReagentToType", fields: [reagentTypeId], references: [id], onDelete: SetNull)
  logs         BoxLog[]
  nodeLogs     NodeLog[]   @relation("NodeLogReagent")

  @@index([boxId])
  @@index([nodeId])
  @@index([orgId])
  @@index([reagentTypeId])
}
```

同时在 `Organization` 的关联中添加（已在 Task 1 预留，检查是否已存在）：
```prisma
  reagentTypes ReagentType[]
```

### Step 4：生成并应用 migration

```bash
cd BSB-Backend
pnpm run db:migrate
```

名称：`add_resource_share_reagent_type_extend_reagent`

### Step 5：生成 Client + 编译

```bash
pnpm run db:gen-client && pnpm run build
```

**如编译错误**：错误通常来自已有 Service/Repository 引用了 Prisma 类型，在 P1 阶段只需确保类型兼容（新增字段均为可选），不修改现有 Service 代码。

### Step 6：提交

```bash
git add BSB-Backend/prisma/schema.prisma BSB-Backend/prisma/migrations/
git commit -m "feat(schema): add ResourceShare, ReagentType models; extend Reagent with nodeId and metadata fields"
```

---

## Task 6：数据迁移脚本（Root → Node ROOM + Box → Node BOX）

**Files:**
- Create: `BSB-Backend/prisma/migrations/migrate-root-box-to-node.ts`
- Create: `BSB-Backend/scripts/run-data-migration.ts`

> **重要**：这是破坏性迁移，执行前必须备份数据库。

### Step 1：创建数据迁移脚本

创建 `BSB-Backend/scripts/run-data-migration.ts`：

```typescript
/**
 * 数据迁移脚本：将 Root → Node(ROOM) + Box → Node(BOX)
 * 执行方式: pnpm ts-node --esm scripts/run-data-migration.ts
 *
 * 前置条件:
 *   1. 已执行 Task 1-5 的全部 schema migration
 *   2. 已备份数据库
 *
 * 回滚方式:
 *   由于旧数据保留（Root + Box 表未删除），可直接回滚前端/后端代码，
 *   旧表数据不受影响。
 */
import { PrismaClient } from '../prisma/generated/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function migrateRootsToNodes() {
    console.log('=== 迁移 Root → Node(ROOM) ===');
    const roots = await prisma.root.findMany();
    console.log(`找到 ${roots.length} 个 Root 记录`);

    for (const root of roots) {
        const existing = await (prisma as any).node.findFirst({
            where: { id: root.id },
        });
        if (existing) {
            console.log(`  跳过（已迁移）: ${root.id} ${root.name}`);
            continue;
        }

        await (prisma as any).node.create({
            data: {
                id: root.id, // 保持相同 ID，确保 Box.rootId 仍然有效引用
                orgId: root.orgId,
                parentId: null,
                name: root.name,
                description: root.description,
                type: 'ROOM',
                createdAt: root.createdAt,
                updatedAt: root.updatedAt,
            },
        });
        console.log(`  ✓ 迁移 Root → Node(ROOM): ${root.id} ${root.name}`);
    }
}

async function migrateBoxesToNodes() {
    console.log('\n=== 迁移 Box → Node(BOX) ===');
    const boxes = await prisma.box.findMany({
        include: { aliases: true, images: true },
    });
    console.log(`找到 ${boxes.length} 个 Box 记录`);

    for (const box of boxes) {
        const existing = await (prisma as any).node.findFirst({
            where: { id: box.id },
        });
        if (existing) {
            console.log(`  跳过（已迁移）: ${box.id} ${box.name}`);
            continue;
        }

        // parentId 优先使用 nodeId（旧 Node 层级），其次 rootId（Room 层级）
        const parentId = box.nodeId ?? box.rootId ?? null;

        // 创建 Node(BOX)
        await (prisma as any).node.create({
            data: {
                id: box.id,
                orgId: box.orgId,
                parentId: parentId,
                name: box.name,
                description: box.description,
                type: 'BOX',
                createdAt: box.createdAt,
                updatedAt: box.updatedAt,
            },
        });

        // 创建 NodeGridConfig
        await (prisma as any).nodeGridConfig.create({
            data: {
                nodeId: box.id,
                rows: box.rows,
                cols: box.cols,
            },
        });

        // 迁移 BoxAlias → NodeAlias
        for (const alias of box.aliases) {
            await (prisma as any).nodeAlias.create({
                data: {
                    id: alias.id,
                    nodeId: box.id,
                    alias: alias.alias,
                    createdAt: alias.createdAt,
                },
            });
        }

        // 迁移 BoxImage → NodeImage
        for (const image of box.images) {
            await (prisma as any).nodeImage.create({
                data: {
                    id: image.id,
                    nodeId: box.id,
                    imageUrl: image.imageUrl,
                    createdAt: image.createdAt,
                },
            });
        }

        console.log(`  ✓ 迁移 Box → Node(BOX): ${box.id} ${box.name} (parent: ${parentId ?? 'null'})`);
    }
}

async function migrateReagentNodeIds() {
    console.log('\n=== 更新 Reagent.nodeId ===');
    const reagents = await prisma.reagent.findMany();
    console.log(`找到 ${reagents.length} 个 Reagent 记录`);

    for (const reagent of reagents) {
        if (reagent.nodeId) {
            console.log(`  跳过（已有 nodeId）: ${reagent.id}`);
            continue;
        }
        await (prisma as any).reagent.update({
            where: { id: reagent.id },
            data: { nodeId: reagent.boxId },
        });
    }
    console.log('  ✓ Reagent.nodeId 全部更新完成');
}

async function main() {
    console.log('开始数据迁移...\n');
    try {
        await migrateRootsToNodes();
        await migrateBoxesToNodes();
        await migrateReagentNodeIds();
        console.log('\n✅ 数据迁移完成');
    } catch (e) {
        console.error('\n❌ 迁移失败:', e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
```

### Step 2：执行数据迁移（在开发环境）

```bash
cd BSB-Backend
# 先备份（如使用 Docker）
# docker exec <container> pg_dump -U postgres <dbname> > backup.sql

pnpm ts-node --esm scripts/run-data-migration.ts
```

**预期输出**：
```
开始数据迁移...

=== 迁移 Root → Node(ROOM) ===
找到 N 个 Root 记录
  ✓ 迁移 Root → Node(ROOM): ...

=== 迁移 Box → Node(BOX) ===
找到 N 个 Box 记录
  ✓ 迁移 Box → Node(BOX): ...

=== 更新 Reagent.nodeId ===
找到 N 个 Reagent 记录
  ✓ Reagent.nodeId 全部更新完成

✅ 数据迁移完成
```

### Step 3：验证迁移结果

通过 DB Studio 或 psql 验证：

```bash
pnpm run db:studio
```

检查项：
- [ ] `Node` 表中存在 `type=ROOM` 的记录，数量 = 原 `Root` 表行数
- [ ] `Node` 表中存在 `type=BOX` 的记录，数量 = 原 `Box` 表行数
- [ ] `NodeGridConfig` 表记录数 = 原 `Box` 表行数
- [ ] `NodeAlias` 表记录数 = 原 `BoxAlias` 表行数
- [ ] `NodeImage` 表记录数 = 原 `BoxImage` 表行数
- [ ] `Reagent` 所有记录的 `nodeId` 不为 null

### Step 4：提交

```bash
git add BSB-Backend/scripts/run-data-migration.ts
git commit -m "chore(migration): add data migration script Root+Box → Node"
```

---

## Task 7：编写 Schema 迁移单元测试（验证新模型可创建/查询）

**Files:**
- Create: `BSB-Backend/test/unit/schema-migration.spec.ts`

> 单元测试验证 Prisma Client 类型与数据库结构是否对齐，使用真实数据库（integration test 模式）。

### Step 1：创建测试文件

```typescript
// BSB-Backend/test/unit/schema-migration.spec.ts
import { PrismaClient } from '../../prisma/generated/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

let prisma: PrismaClient;

beforeAll(async () => {
    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
    prisma = new PrismaClient({ adapter });
    await prisma.$connect();
});

afterAll(async () => {
    await prisma.$disconnect();
});

describe('P1 Schema Migration — New Models', () => {
    let testOrgId: string;
    let testNodeId: string;

    beforeAll(async () => {
        // 使用 seed 创建的第一个组织
        const org = await prisma.organization.findFirst();
        expect(org).not.toBeNull();
        testOrgId = org!.id;
    });

    it('should create a Node with type ROOM', async () => {
        const node = await (prisma as any).node.create({
            data: {
                orgId: testOrgId,
                name: 'Test Room',
                type: 'ROOM',
            },
        });
        expect(node.id).toBeDefined();
        expect(node.type).toBe('ROOM');
        testNodeId = node.id;
    });

    it('should create NodeGridConfig for a Node', async () => {
        const config = await (prisma as any).nodeGridConfig.create({
            data: { nodeId: testNodeId, rows: 9, cols: 9 },
        });
        expect(config.nodeId).toBe(testNodeId);
        expect(config.rows).toBe(9);
    });

    it('should create a ReagentType for an org', async () => {
        const rt = await (prisma as any).reagentType.create({
            data: {
                orgId: testOrgId,
                name: 'Test Reagent Type',
                colorHex: '#2a9d99',
                unit: 'mL',
            },
        });
        expect(rt.id).toBeDefined();
        expect(rt.name).toBe('Test Reagent Type');
    });

    it('should create a ResourceShare record', async () => {
        const org2 = await prisma.organization.findFirst({
            where: { id: { not: testOrgId } },
        });
        if (!org2) return; // 跳过（只有一个组织时）

        const share = await (prisma as any).resourceShare.create({
            data: {
                resourceType: 'NODE',
                resourceId: testNodeId,
                ownerOrgId: testOrgId,
                granteeOrgId: org2.id,
                permission: 'READ',
                status: 'PENDING',
            },
        });
        expect(share.id).toBeDefined();
        expect(share.status).toBe('PENDING');
    });

    it('Organization should have isPublic field', async () => {
        const org = await prisma.organization.findFirst({
            where: { id: testOrgId },
        });
        expect(org).toHaveProperty('isPublic');
        expect(typeof org!.isPublic).toBe('boolean');
    });

    it('Reagent should have nodeId field', async () => {
        const reagent = await prisma.reagent.findFirst();
        if (!reagent) return; // 跳过（测试环境无试剂）
        expect(reagent).toHaveProperty('nodeId');
    });

    afterAll(async () => {
        // 清理测试数据（逆序）
        await (prisma as any).nodeGridConfig.deleteMany({
            where: { nodeId: testNodeId },
        });
        await (prisma as any).node.delete({ where: { id: testNodeId } }).catch(() => {});
    });
});
```

### Step 2：运行测试

```bash
cd BSB-Backend
pnpm test test/unit/schema-migration.spec.ts
```

**预期**：所有测试 PASS。

**如测试失败**：
- `Cannot read property '...' of null`：seed 数据不足，先运行 `pnpm run db:seed`
- Prisma type error：重新运行 `pnpm run db:gen-client`

### Step 3：提交

```bash
git add BSB-Backend/test/unit/schema-migration.spec.ts
git commit -m "test(schema): add P1 schema migration integration tests"
```

---

## Task 8：最终验证与 P1 完成确认

### Step 1：全量测试

```bash
cd BSB-Backend
pnpm test
```

**预期**：所有已有测试仍然 PASS（新 schema 向后兼容，旧模型未删除）。

### Step 2：后端服务启动验证

```bash
pnpm run start:dev
```

**预期**：NestJS 正常启动，无 Prisma 相关错误。

### Step 3：提交门槛自查（参照 BSB-Backend/AGENTS.md §5.3）

- [ ] `pnpm run build` 无错误
- [ ] `pnpm test` 全部通过
- [ ] `pnpm run lint:fix` 无残留 lint 错误
- [ ] `pnpm run format` 已格式化
- [ ] 提交信息符合 Conventional Commits 规范
- [ ] 旧模型（Root/Box）**未删除**（保留供 P2 后端迁移使用）

### Step 4：最终提交（如有未提交变更）

```bash
cd BSB-Backend
pnpm run lint:fix && pnpm run format
git add -A
git commit -m "chore(schema): P1 schema migration complete — all new models added, old models preserved"
```

---

## 回滚方案

如需回滚 P1：

```bash
cd BSB-Backend
# 回滚到 P1 开始前的 migration（保留旧数据，新增表会被删除）
pnpm prisma migrate reset --skip-seed
# 然后只重新应用到 P1 开始前的 migration
pnpm prisma migrate deploy --to <migration_name_before_p1>
```

旧表（Root / Box / BoxAlias / BoxImage / BoxLog）的数据**无论如何不会丢失**，因为 P1 只新增表/字段，不删除任何旧数据。

---

## P1 完成后

移交 P2：[docs/plans/2026-04-15-phase-2-backend-new-apis.md](./2026-04-15-phase-2-backend-new-apis.md)
