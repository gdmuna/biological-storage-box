# Node Schema Alignment Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将后端 Node 模块与新数据库 Schema 对齐，清除全部冗余接口，并修复前后端所有测试用例。

**Architecture:** 后端保留 6 个活跃端点（add/del/tree/update/grid/set/grid/remove），前端通过 `GET /node/tree` 拿到扁平数组后在 store 内自行构建树结构，组件只消费 store 提供的 `treeNodes`（computed）。

**Tech Stack:** NestJS · Prisma · nestjs-zod · Vue 3 · Pinia · Alova · Vitest · Jest · Supertest

---

## 背景与约束

### 数据库 NodeType（Prisma Enum）
```
ROOT | CONTAINER | BOX | BOX_SLOT
```
旧代码用的 `ROOM`、`BOX`、`CONTAINER` 已废弃。

### 活跃端点清单（保留）
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/node/add` | 创建节点 |
| DELETE | `/node/del` | 删除节点 |
| GET | `/node/tree` | 返回组织下**扁平**节点数组 |
| PUT | `/node/update` | 更新节点（含移动） |
| POST | `/node/grid/set` | 设置网格配置 |
| DELETE | `/node/grid/remove` | 移除网格配置 |

### 已废弃（注释或删除）
- `GET /node/one` — 获取单节点详情
- `GET /node/list` — 分页列表
- `GET /node/filter` — 条件过滤

---

## Task 1：修复后端 DTO

**Files:**
- Modify: `BSB-Backend/src/modules/node/node.dto.ts`

当前问题：
- `UpdateNodeDto.type` enum 用的是旧值 `['ROOM', 'BOX', 'CONTAINER']`
- `NodeFilterDto.type` enum 也用的旧值，且整个 `NodeFilterDto` 已无活跃端点

### Step 1：确认测试当前会失败（构建检查）

```bash
pnpm --filter BSB-Backend build 2>&1 | head -40
```
预期：可能有类型错误或可以通过，但逻辑错误需要通过测试暴露。

### Step 2：修改 `node.dto.ts`

将 `UpdateNodeDtoSchema` 中的 type enum 从旧值改为新值，并删除 `NodeListDto` 和 `NodeFilterDto`：

```typescript
// node.dto.ts 最终完整内容

import { createZodDto } from 'nestjs-zod';
import { z } from 'zod/v4';

const CreateNodeDtoSchema = z
    .object({
        orgId: z.string().min(1).meta({ title: '组织 ID' }),
        parentId: z.string().optional().meta({ title: '父节点 ID（为空则为根节点）' }),
        name: z.string().min(1).max(128).meta({ title: '节点名称', example: '冷冻室 A' }),
        description: z.string().max(512).optional().meta({ title: '描述' }),
        type: z.enum(['ROOT', 'CONTAINER', 'BOX', 'BOX_SLOT']).meta({ title: '节点类型' }),
        metadata: z.record(z.string(), z.unknown()).optional().meta({ title: '自定义属性' }),
    })
    .meta({ description: '创建节点请求体' });

export class CreateNodeDto extends createZodDto(CreateNodeDtoSchema) {}

const UpdateNodeDtoSchema = z
    .object({
        id: z.string().min(1).meta({ title: 'Node ID' }),
        parentId: z.string().optional().nullable().meta({ title: '父节点 ID' }),
        name: z.string().min(1).max(128).optional().meta({ title: '节点名称' }),
        description: z.string().max(512).optional().meta({ title: '描述' }),
        type: z.enum(['ROOT', 'CONTAINER', 'BOX', 'BOX_SLOT']).optional().meta({ title: '节点类型' }),
        metadata: z.record(z.string(), z.unknown()).optional().meta({ title: '自定义属性' }),
    })
    .meta({ description: '更新节点请求体' });

export class UpdateNodeDto extends createZodDto(UpdateNodeDtoSchema) {}

const NodeIdDtoSchema = z
    .object({
        id: z.string().min(1).meta({ title: 'Node ID' }),
    })
    .meta({ description: 'Node ID 参数' });

export class NodeIdDto extends createZodDto(NodeIdDtoSchema) {}

const NodeTreeDtoSchema = z
    .object({
        orgId: z.string().min(1).meta({ title: '组织 ID' }),
    })
    .meta({ description: '获取组织完整节点树的查询参数' });

export class NodeTreeDto extends createZodDto(NodeTreeDtoSchema) {}

const SetGridConfigDtoSchema = z
    .object({
        nodeId: z.string().min(1).meta({ title: 'Node ID' }),
        rows: z.number().int().min(1).max(100).meta({ title: '行数' }),
        cols: z.number().int().min(1).max(100).meta({ title: '列数' }),
    })
    .meta({ description: '设置节点网格配置' });

export class SetGridConfigDto extends createZodDto(SetGridConfigDtoSchema) {}

const RemoveGridConfigDtoSchema = z
    .object({
        nodeId: z.string().min(1).meta({ title: 'Node ID' }),
    })
    .meta({ description: '移除节点网格配置' });

export class RemoveGridConfigDto extends createZodDto(RemoveGridConfigDtoSchema) {}
```

### Step 3：构建验证

```bash
pnpm --filter BSB-Backend build
```
预期：0 errors

### Step 4：提交

```bash
git add BSB-Backend/src/modules/node/node.dto.ts
git commit -m "fix(node): align DTO type enums with new NodeType schema, drop unused DTOs"
```

---

## Task 2：清理后端 Repository

**Files:**
- Modify: `BSB-Backend/src/modules/node/node.repository.ts`

当前问题：`filter` 方法有活跃实现但端点已注释掉；注释掉的 `findByIdWithChildren` 和 `listByOrgId` 残留。

### Step 1：修改 `node.repository.ts`

删除 `filter` 方法和注释掉的方法块，最终活跃方法：
`create` / `findById` / `loadTree` / `update` / `delete` / `setGridConfig` / `removeGridConfig` / `isDescendant`

```typescript
// node.repository.ts 最终完整内容

import { DatabaseService } from '@/infra/database/database.service.js';
import { NodeType } from '@root/prisma/generated/enums.js';

import { Injectable } from '@nestjs/common';

@Injectable()
export class NodeRepository {
    constructor(private readonly db: DatabaseService) {}

    async create(data: {
        orgId: string;
        parentId?: string;
        name: string;
        description?: string;
        type: NodeType;
        metadata?: Record<string, any>;
    }) {
        return this.db.node.create({ data: data as any });
    }

    async findById(id: string) {
        return this.db.node.findUnique({ where: { id } });
    }

    /**
     * 平铺查询整棵树后返回，前端负责构建树结构。
     * 适用于节点数量合理的场景（< 1000 节点）。
     */
    async loadTree(orgId: string) {
        return this.db.node.findMany({
            where: { orgId },
            orderBy: { createdAt: 'asc' },
        });
    }

    async update(
        id: string,
        data: {
            parentId?: string | null;
            name?: string;
            description?: string;
            type?: string;
            metadata?: Record<string, unknown>;
        }
    ) {
        return this.db.node.update({ where: { id }, data: data as any });
    }

    async delete(id: string) {
        return this.db.node.delete({ where: { id } });
    }

    async setGridConfig(nodeId: string, rows: number, cols: number) {
        return this.db.nodeGridConfig.upsert({
            where: { nodeId },
            create: { nodeId, rows, cols },
            update: { rows, cols },
        });
    }

    async removeGridConfig(nodeId: string) {
        return this.db.nodeGridConfig.deleteMany({ where: { nodeId } });
    }

    /**
     * 检查 candidateId 是否是 nodeId 的后代，防止循环引用。
     * 使用单条递归 CTE，无论树深度多少只执行一次数据库往返。
     */
    async isDescendant(nodeId: string, candidateId: string): Promise<boolean> {
        const rows = await this.db.$queryRaw<Array<{ exists: boolean }>>`
            WITH RECURSIVE ancestors AS (
                SELECT id, "parentId" FROM "Node" WHERE id = ${candidateId}
                UNION ALL
                SELECT n.id, n."parentId" FROM "Node" n
                INNER JOIN ancestors a ON n.id = a."parentId"
            )
            SELECT EXISTS (
                SELECT 1 FROM ancestors WHERE id = ${nodeId} AND id <> ${candidateId}
            ) AS exists
        `;
        return Boolean(rows[0]?.exists);
    }
}
```

### Step 2：构建验证

```bash
pnpm --filter BSB-Backend build
```
预期：0 errors

### Step 3：提交

```bash
git add BSB-Backend/src/modules/node/node.repository.ts
git commit -m "refactor(node): remove dead code from repository (filter, commented methods)"
```

---

## Task 3：清理后端 Service 和 Controller

**Files:**
- Modify: `BSB-Backend/src/modules/node/node.service.ts`
- Modify: `BSB-Backend/src/modules/node/node.controller.ts`

### Step 1：修改 `node.service.ts`

删除 `filter` 方法和注释块：

```typescript
// node.service.ts 最终完整内容

import { CreateNodeDto, UpdateNodeDto } from './node.dto.js';
import { NodeRepository } from './node.repository.js';
import { NodeNotFoundException, NodeCircularReferenceException } from './node.exception.js';

import { OrgRepository } from '@/modules/org/org.repository.js';
import { OrgNotFoundException, OrgNotAdminException } from '@/modules/org/org.exception.js';

import { Injectable } from '@nestjs/common';

@Injectable()
export class NodeService {
    constructor(
        private readonly nodeRepository: NodeRepository,
        private readonly orgRepository: OrgRepository
    ) {}

    private async assertOrgAdmin(orgId: string, userId: string) {
        const org = await this.orgRepository.findById(orgId);
        if (!org) throw new OrgNotFoundException();
        const membership = await this.orgRepository.findMembership(orgId, userId);
        if (!membership || (membership.role !== 'OWNER' && membership.role !== 'ADMIN')) {
            throw new OrgNotAdminException();
        }
    }

    async create(userId: string, dto: CreateNodeDto) {
        await this.assertOrgAdmin(dto.orgId, userId);
        return this.nodeRepository.create({
            orgId: dto.orgId,
            parentId: dto.parentId,
            name: dto.name,
            description: dto.description,
            type: dto.type,
            metadata: dto.metadata,
        });
    }

    async delete(userId: string, id: string) {
        const node = await this.nodeRepository.findById(id);
        if (!node) throw new NodeNotFoundException();
        await this.assertOrgAdmin(node.orgId, userId);
        await this.nodeRepository.delete(id);
    }

    async getTree(orgId: string) {
        return this.nodeRepository.loadTree(orgId);
    }

    async update(userId: string, dto: UpdateNodeDto) {
        const node = await this.nodeRepository.findById(dto.id);
        if (!node) throw new NodeNotFoundException();
        await this.assertOrgAdmin(node.orgId, userId);

        if (dto.parentId && dto.parentId !== node.parentId) {
            if (dto.parentId === dto.id) throw new NodeCircularReferenceException();
            const circular = await this.nodeRepository.isDescendant(dto.id, dto.parentId);
            if (circular) throw new NodeCircularReferenceException();
        }

        return this.nodeRepository.update(dto.id, {
            ...(dto.parentId !== undefined && { parentId: dto.parentId }),
            ...(dto.name !== undefined && { name: dto.name }),
            ...(dto.description !== undefined && { description: dto.description }),
            ...(dto.type !== undefined && { type: dto.type }),
            ...(dto.metadata !== undefined && { metadata: dto.metadata }),
        });
    }

    async setGridConfig(userId: string, dto: { nodeId: string; rows: number; cols: number }) {
        const node = await this.nodeRepository.findById(dto.nodeId);
        if (!node) throw new NodeNotFoundException();
        await this.assertOrgAdmin(node.orgId, userId);
        return this.nodeRepository.setGridConfig(dto.nodeId, dto.rows, dto.cols);
    }

    async removeGridConfig(userId: string, dto: { nodeId: string }) {
        const node = await this.nodeRepository.findById(dto.nodeId);
        if (!node) throw new NodeNotFoundException();
        await this.assertOrgAdmin(node.orgId, userId);
        await this.nodeRepository.removeGridConfig(dto.nodeId);
    }
}
```

### Step 2：修改 `node.controller.ts`

删除注释掉的端点和对应的无用 DTO 导入：

```typescript
// node.controller.ts 最终完整内容

import {
    CreateNodeDto,
    UpdateNodeDto,
    NodeIdDto,
    NodeTreeDto,
    SetGridConfigDto,
    RemoveGridConfigDto,
} from './node.dto.js';
import { NodeService } from './node.service.js';
import NODE_EXCEPTION from './node.exception.js';
import ORG_EXCEPTION from '@/modules/org/org.exception.js';

import { ApiRoute, CurrentUser } from '@/common/decorators/index.js';
import type { AccessTokenClaim } from '@/modules/auth/services/token.service.js';

import { Controller, Post, Delete, Get, Put, Body, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('节点/位置模块')
@Controller('node')
export class NodeController {
    constructor(private readonly nodeService: NodeService) {}

    @Post('add')
    @ApiRoute({
        auth: 'required',
        summary: '创建节点',
        errors: [ORG_EXCEPTION.OrgNotFoundException.code, ORG_EXCEPTION.OrgNotAdminException.code],
    })
    async create(@CurrentUser() user: AccessTokenClaim, @Body() body: CreateNodeDto) {
        return this.nodeService.create(user.sub, body);
    }

    @Delete('del')
    @ApiRoute({
        auth: 'required',
        summary: '删除节点',
        errors: [
            NODE_EXCEPTION.NodeNotFoundException.code,
            ORG_EXCEPTION.OrgNotAdminException.code,
        ],
    })
    async delete(@CurrentUser() user: AccessTokenClaim, @Body() body: NodeIdDto) {
        await this.nodeService.delete(user.sub, body.id);
    }

    @Get('tree')
    @ApiRoute({
        auth: 'required',
        summary: '获取组织完整节点树（扁平数组，前端自行构建树）',
    })
    async getTree(@Query() query: NodeTreeDto) {
        return this.nodeService.getTree(query.orgId);
    }

    @Put('update')
    @ApiRoute({
        auth: 'required',
        summary: '更新节点信息（可移动到其他父节点）',
        errors: [
            NODE_EXCEPTION.NodeNotFoundException.code,
            NODE_EXCEPTION.NodeCircularReferenceException.code,
            ORG_EXCEPTION.OrgNotAdminException.code,
        ],
    })
    async update(@CurrentUser() user: AccessTokenClaim, @Body() body: UpdateNodeDto) {
        return this.nodeService.update(user.sub, body);
    }

    @Post('grid/set')
    @ApiRoute({
        auth: 'required',
        summary: '设置节点网格配置（使节点可承载试剂槽位）',
        errors: [
            NODE_EXCEPTION.NodeNotFoundException.code,
            ORG_EXCEPTION.OrgNotAdminException.code,
        ],
    })
    async setGridConfig(@CurrentUser() user: AccessTokenClaim, @Body() body: SetGridConfigDto) {
        return this.nodeService.setGridConfig(user.sub, body);
    }

    @Delete('grid/remove')
    @ApiRoute({
        auth: 'required',
        summary: '移除节点网格配置',
        errors: [
            NODE_EXCEPTION.NodeNotFoundException.code,
            ORG_EXCEPTION.OrgNotAdminException.code,
        ],
    })
    async removeGridConfig(
        @CurrentUser() user: AccessTokenClaim,
        @Body() body: RemoveGridConfigDto
    ) {
        await this.nodeService.removeGridConfig(user.sub, body);
    }
}
```

### Step 3：构建验证

```bash
pnpm --filter BSB-Backend build
```
预期：0 errors

### Step 4：提交

```bash
git add BSB-Backend/src/modules/node/node.service.ts BSB-Backend/src/modules/node/node.controller.ts
git commit -m "refactor(node): remove dead methods and endpoints, clean up imports"
```

---

## Task 4：修复后端单元测试 — NodeService

**Files:**
- Modify: `BSB-Backend/test/unit/node.service.spec.ts`

当前问题：
1. mock 声明了 `listByOrgId`（已从 repository 删除）
2. `create` 测试断言 `nodeRepo.create` 被调用时不包含 `type` 和 `metadata`，但实际代码传了

### Step 1：运行测试确认失败

```bash
pnpm --filter BSB-Backend test -- --testPathPattern=node.service
```
预期：FAIL（`listByOrgId` 不存在 / create 断言不匹配）

### Step 2：重写 `node.service.spec.ts`

```typescript
import { NodeService } from '../../src/modules/node/node.service.js';
import { NodeRepository } from '../../src/modules/node/node.repository.js';
import { OrgRepository } from '../../src/modules/org/org.repository.js';
import {
    NodeNotFoundException,
    NodeCircularReferenceException,
} from '../../src/modules/node/node.exception.js';
import { OrgNotFoundException, OrgNotAdminException } from '../../src/modules/org/org.exception.js';

describe('NodeService', () => {
    let service: NodeService;
    let nodeRepo: jest.Mocked<
        Pick<
            NodeRepository,
            | 'create'
            | 'findById'
            | 'loadTree'
            | 'update'
            | 'delete'
            | 'isDescendant'
            | 'setGridConfig'
            | 'removeGridConfig'
        >
    >;
    let orgRepo: jest.Mocked<Pick<OrgRepository, 'findById' | 'findMembership'>>;

    const userId = 'user_01';
    const orgId = 'org_01';
    const nodeId = 'node_01';

    beforeEach(() => {
        nodeRepo = {
            create: jest.fn(),
            findById: jest.fn(),
            loadTree: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            isDescendant: jest.fn(),
            setGridConfig: jest.fn(),
            removeGridConfig: jest.fn(),
        };
        orgRepo = {
            findById: jest.fn(),
            findMembership: jest.fn(),
        };
        service = new NodeService(nodeRepo as any, orgRepo as any);
    });

    describe('create', () => {
        it('should create a node when user is admin', async () => {
            orgRepo.findById.mockResolvedValue({ id: orgId } as any);
            orgRepo.findMembership.mockResolvedValue({ role: 'ADMIN' } as any);
            nodeRepo.create.mockResolvedValue({ id: nodeId, orgId, name: '冷冻室 A' } as any);

            const result = await service.create(userId, {
                orgId,
                name: '冷冻室 A',
                type: 'CONTAINER',
            } as any);
            expect(result.id).toBe(nodeId);
            expect(nodeRepo.create).toHaveBeenCalledWith({
                orgId,
                name: '冷冻室 A',
                type: 'CONTAINER',
                parentId: undefined,
                description: undefined,
                metadata: undefined,
            });
        });

        it('should throw OrgNotFoundException when org not found', async () => {
            orgRepo.findById.mockResolvedValue(null);
            await expect(
                service.create(userId, { orgId, name: 'X', type: 'CONTAINER' } as any),
            ).rejects.toThrow(OrgNotFoundException);
        });

        it('should throw OrgNotAdminException when user is member only', async () => {
            orgRepo.findById.mockResolvedValue({ id: orgId } as any);
            orgRepo.findMembership.mockResolvedValue({ role: 'MEMBER' } as any);
            await expect(
                service.create(userId, { orgId, name: 'X', type: 'CONTAINER' } as any),
            ).rejects.toThrow(OrgNotAdminException);
        });
    });

    describe('delete', () => {
        it('should throw NodeNotFoundException when node not found', async () => {
            nodeRepo.findById.mockResolvedValue(null);
            await expect(service.delete(userId, nodeId)).rejects.toThrow(NodeNotFoundException);
        });

        it('should delete node when user is admin', async () => {
            nodeRepo.findById.mockResolvedValue({ id: nodeId, orgId } as any);
            orgRepo.findById.mockResolvedValue({ id: orgId } as any);
            orgRepo.findMembership.mockResolvedValue({ role: 'ADMIN' } as any);
            nodeRepo.delete.mockResolvedValue(undefined as any);

            await service.delete(userId, nodeId);
            expect(nodeRepo.delete).toHaveBeenCalledWith(nodeId);
        });
    });

    describe('getTree', () => {
        it('should return flat node list', async () => {
            const flat = [
                { id: 'n1', orgId, parentId: null },
                { id: 'n2', orgId, parentId: 'n1' },
            ];
            nodeRepo.loadTree.mockResolvedValue(flat as any);
            const result = await service.getTree(orgId);
            expect(result).toEqual(flat);
            expect(nodeRepo.loadTree).toHaveBeenCalledWith(orgId);
        });
    });

    describe('update', () => {
        it('should throw NodeCircularReferenceException when moving to descendant', async () => {
            const node = { id: nodeId, orgId, parentId: null } as any;
            nodeRepo.findById.mockResolvedValue(node);
            orgRepo.findById.mockResolvedValue({ id: orgId } as any);
            orgRepo.findMembership.mockResolvedValue({ role: 'OWNER' } as any);
            nodeRepo.isDescendant.mockResolvedValue(true);

            await expect(
                service.update(userId, { id: nodeId, parentId: 'child_node' } as any),
            ).rejects.toThrow(NodeCircularReferenceException);
        });

        it('should throw NodeCircularReferenceException when moving to self', async () => {
            const node = { id: nodeId, orgId, parentId: null } as any;
            nodeRepo.findById.mockResolvedValue(node);
            orgRepo.findById.mockResolvedValue({ id: orgId } as any);
            orgRepo.findMembership.mockResolvedValue({ role: 'OWNER' } as any);

            await expect(
                service.update(userId, { id: nodeId, parentId: nodeId } as any),
            ).rejects.toThrow(NodeCircularReferenceException);
        });

        it('should update node when no circular reference', async () => {
            const node = { id: nodeId, orgId, parentId: null } as any;
            nodeRepo.findById.mockResolvedValue(node);
            orgRepo.findById.mockResolvedValue({ id: orgId } as any);
            orgRepo.findMembership.mockResolvedValue({ role: 'OWNER' } as any);
            nodeRepo.isDescendant.mockResolvedValue(false);
            nodeRepo.update.mockResolvedValue({ id: nodeId, name: 'Updated' } as any);

            const result = await service.update(userId, {
                id: nodeId,
                parentId: 'other_node',
                name: 'Updated',
            } as any);
            expect(result.name).toBe('Updated');
        });
    });

    describe('setGridConfig', () => {
        it('should throw NodeNotFoundException when node not found', async () => {
            nodeRepo.findById.mockResolvedValue(null);
            await expect(
                service.setGridConfig(userId, { nodeId, rows: 9, cols: 9 }),
            ).rejects.toThrow(NodeNotFoundException);
        });

        it('should set grid config when user is admin', async () => {
            nodeRepo.findById.mockResolvedValue({ id: nodeId, orgId } as any);
            orgRepo.findById.mockResolvedValue({ id: orgId } as any);
            orgRepo.findMembership.mockResolvedValue({ role: 'ADMIN' } as any);
            nodeRepo.setGridConfig.mockResolvedValue({ nodeId, rows: 9, cols: 9 } as any);

            const result = await service.setGridConfig(userId, { nodeId, rows: 9, cols: 9 });
            expect(result).toEqual({ nodeId, rows: 9, cols: 9 });
        });
    });

    describe('removeGridConfig', () => {
        it('should remove grid config when user is admin', async () => {
            nodeRepo.findById.mockResolvedValue({ id: nodeId, orgId } as any);
            orgRepo.findById.mockResolvedValue({ id: orgId } as any);
            orgRepo.findMembership.mockResolvedValue({ role: 'OWNER' } as any);
            nodeRepo.removeGridConfig.mockResolvedValue(undefined as any);

            await service.removeGridConfig(userId, { nodeId });
            expect(nodeRepo.removeGridConfig).toHaveBeenCalledWith(nodeId);
        });
    });
});
```

### Step 3：运行测试验证

```bash
pnpm --filter BSB-Backend test -- --testPathPattern=node.service
```
预期：PASS（全部通过）

### Step 4：提交

```bash
git add BSB-Backend/test/unit/node.service.spec.ts
git commit -m "test(node): rewrite service unit tests to match new NodeType and removed methods"
```

---

## Task 5：修复后端单元测试 — NodeController

**Files:**
- Modify: `BSB-Backend/test/unit/node.controller.spec.ts`

当前问题：
1. mock 包含 `getOne` 和 `list`（已从 service 删除）
2. 缺少 grid 操作的测试

### Step 1：运行测试确认失败

```bash
pnpm --filter BSB-Backend test -- --testPathPattern=node.controller
```
预期：FAIL 或有 TS 错误

### Step 2：重写 `node.controller.spec.ts`

```typescript
import { NodeController } from '../../src/modules/node/node.controller.js';
import { NodeService } from '../../src/modules/node/node.service.js';

describe('NodeController', () => {
    let controller: NodeController;
    let service: jest.Mocked<
        Pick<
            NodeService,
            'create' | 'delete' | 'getTree' | 'update' | 'setGridConfig' | 'removeGridConfig'
        >
    >;
    const user = { sub: 'user_01' } as any;

    beforeEach(() => {
        service = {
            create: jest.fn(),
            delete: jest.fn(),
            getTree: jest.fn(),
            update: jest.fn(),
            setGridConfig: jest.fn(),
            removeGridConfig: jest.fn(),
        };
        controller = new NodeController(service as any);
    });

    it('should call service.create', async () => {
        service.create.mockResolvedValue({ id: 'node_01' } as any);
        const result = await controller.create(user, {
            orgId: 'org_01',
            name: '冷冻室 A',
            type: 'CONTAINER',
        } as any);
        expect(service.create).toHaveBeenCalledWith('user_01', {
            orgId: 'org_01',
            name: '冷冻室 A',
            type: 'CONTAINER',
        });
        expect(result).toEqual({ id: 'node_01' });
    });

    it('should call service.delete', async () => {
        service.delete.mockResolvedValue(undefined);
        await controller.delete(user, { id: 'node_01' } as any);
        expect(service.delete).toHaveBeenCalledWith('user_01', 'node_01');
    });

    it('should call service.getTree and return flat list', async () => {
        const flat = [{ id: 'n1' }, { id: 'n2' }];
        service.getTree.mockResolvedValue(flat as any);
        const result = await controller.getTree({ orgId: 'org_01' } as any);
        expect(service.getTree).toHaveBeenCalledWith('org_01');
        expect(result).toEqual(flat);
    });

    it('should call service.update', async () => {
        service.update.mockResolvedValue({ id: 'node_01', name: 'Updated' } as any);
        const result = await controller.update(user, { id: 'node_01', name: 'Updated' } as any);
        expect(service.update).toHaveBeenCalledWith('user_01', { id: 'node_01', name: 'Updated' });
        expect(result).toEqual({ id: 'node_01', name: 'Updated' });
    });

    it('should call service.setGridConfig', async () => {
        service.setGridConfig.mockResolvedValue({ nodeId: 'node_01', rows: 9, cols: 9 } as any);
        const result = await controller.setGridConfig(user, {
            nodeId: 'node_01',
            rows: 9,
            cols: 9,
        } as any);
        expect(service.setGridConfig).toHaveBeenCalledWith('user_01', {
            nodeId: 'node_01',
            rows: 9,
            cols: 9,
        });
        expect(result).toEqual({ nodeId: 'node_01', rows: 9, cols: 9 });
    });

    it('should call service.removeGridConfig', async () => {
        service.removeGridConfig.mockResolvedValue(undefined);
        await controller.removeGridConfig(user, { nodeId: 'node_01' } as any);
        expect(service.removeGridConfig).toHaveBeenCalledWith('user_01', { nodeId: 'node_01' });
    });
});
```

### Step 3：运行测试验证

```bash
pnpm --filter BSB-Backend test -- --testPathPattern=node.controller
```
预期：PASS

### Step 4：提交

```bash
git add BSB-Backend/test/unit/node.controller.spec.ts
git commit -m "test(node): rewrite controller unit tests, remove dead method mocks, add grid tests"
```

---

## Task 6：修复后端 E2E 测试

**Files:**
- Modify: `BSB-Backend/test/e2e/node-extensions.e2e-spec.ts`

当前问题：
1. 使用 `type: 'ROOM'` — 无效 NodeType
2. 测试 `GET /node/filter` — 该端点已移除
3. 需要补充 `GET /node/tree` 测试

### Step 1：重写 `node-extensions.e2e-spec.ts`

```typescript
import { AppModule } from '@/app.module.js';

import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';

describe('Node Extensions (E2E)', () => {
    let app: INestApplication;
    let accessToken: string;
    let orgId: string;
    let nodeId: string;

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleRef.createNestApplication();
        app.use(cookieParser());
        await app.init();

        const suffix = Date.now().toString();
        await request(app.getHttpServer())
            .post('/auth/register')
            .send({
                username: `node_ext_${suffix}`,
                email: `node_ext_${suffix}@example.com`,
                password: 'P@ssw0rd!',
            })
            .expect(201);

        const loginRes = await request(app.getHttpServer())
            .post('/auth/login')
            .send({
                account: `node_ext_${suffix}@example.com`,
                password: 'P@ssw0rd!',
            })
            .expect(201);

        accessToken = loginRes.body.data.accessToken;

        const orgRes = await request(app.getHttpServer())
            .post('/org/create')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ name: 'Node Ext E2E Org' })
            .expect(201);

        orgId = orgRes.body.data.id;
    });

    afterAll(async () => {
        if (orgId) {
            await request(app.getHttpServer())
                .delete('/org/del')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ orgId });
        }
        await app.close();
    });

    it('POST /node/add — should create node with type CONTAINER', async () => {
        const res = await request(app.getHttpServer())
            .post('/node/add')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ orgId, name: 'Test Container', type: 'CONTAINER' })
            .expect(201);

        expect(res.body.success).toBe(true);
        expect(res.body.data.type).toBe('CONTAINER');
        nodeId = res.body.data.id;
    });

    it('GET /node/tree — should return flat array containing created node', async () => {
        const res = await request(app.getHttpServer())
            .get('/node/tree')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({ orgId })
            .expect(200);

        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.some((n: any) => n.id === nodeId)).toBe(true);
    });

    it('PUT /node/update — should update node name', async () => {
        const res = await request(app.getHttpServer())
            .put('/node/update')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ id: nodeId, name: 'Updated Container' })
            .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data.name).toBe('Updated Container');
    });

    it('POST /node/grid/set — should set gridConfig', async () => {
        const res = await request(app.getHttpServer())
            .post('/node/grid/set')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ nodeId, rows: 9, cols: 9 })
            .expect(201);

        expect(res.body.success).toBe(true);
        expect(res.body.data.rows).toBe(9);
        expect(res.body.data.cols).toBe(9);
    });

    it('DELETE /node/grid/remove — should remove gridConfig', async () => {
        await request(app.getHttpServer())
            .delete('/node/grid/remove')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ nodeId })
            .expect(200);
    });

    it('DELETE /node/del — should delete node', async () => {
        await request(app.getHttpServer())
            .delete('/node/del')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ id: nodeId })
            .expect(200);
    });
});
```

### Step 2：构建确认（E2E 不单独 build，确保编译通过）

```bash
pnpm --filter BSB-Backend build
```
预期：0 errors

### Step 3：提交

```bash
git add BSB-Backend/test/e2e/node-extensions.e2e-spec.ts
git commit -m "test(node): fix e2e tests - use valid NodeType, remove filter endpoint tests, add tree/update/delete tests"
```

---

## Task 7：修复前端 Node Schema

**Files:**
- Modify: `BSB-Frontend/src/schemas/node.schema.ts`

当前问题：type enum 使用旧值 `['ROOM', 'BOX', 'CONTAINER']`

### Step 1：修改 `node.schema.ts`

```typescript
import { z } from 'zod/v4';

export const NodeSchema = z.object({
    id: z.string(),
    orgId: z.string(),
    parentId: z.string().nullable(),
    name: z.string(),
    type: z.enum(['ROOT', 'CONTAINER', 'BOX', 'BOX_SLOT']).default('CONTAINER'),
    description: z.string().nullable().optional(),
    metadata: z.record(z.string(), z.unknown()).nullable().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
    gridConfig: z.object({ rows: z.number(), cols: z.number() }).nullable().optional(),
    _count: z.object({ children: z.number() }).optional(),
});

export const NodeWithChildrenSchema: z.ZodType<NodeWithChildren> = z.lazy(() =>
    NodeSchema.extend({
        children: z.array(NodeWithChildrenSchema).optional(),
    })
);

export type Node = z.infer<typeof NodeSchema>;
export type NodeWithChildren = z.infer<typeof NodeSchema> & {
    children?: NodeWithChildren[];
};
```

### Step 2：类型检查

```bash
pnpm --filter BSB-Frontend type-check
```

### Step 3：提交

```bash
git add BSB-Frontend/src/schemas/node.schema.ts
git commit -m "fix(frontend/node): align NodeType enum with backend schema (ROOT|CONTAINER|BOX|BOX_SLOT)"
```

---

## Task 8：修复前端 API 层

**Files:**
- Modify: `BSB-Frontend/src/api/modules/node.ts`

当前问题：`fetchNodeTree` 返回类型是 `NodeWithChildren[]`，但后端实际返回扁平 `Node[]`

### Step 1：修改 `node.ts` API 层

```typescript
import { alovaInstance } from '../client';
import { Node } from '@/schemas/node.schema';

/** Convenience alias used by stores and pages */
export type NodeItem = Node & { children?: NodeItem[] };

/** 获取组织下全部节点（扁平数组，前端自行构建树） */
export const fetchNodeTree = (orgId: string) =>
    alovaInstance.Get<Node[]>('/node/tree', { params: { orgId } });

/** 创建节点 */
export const createNode = (data: {
    orgId: string;
    name: string;
    parentId?: string;
    description?: string;
    type?: 'ROOT' | 'CONTAINER' | 'BOX' | 'BOX_SLOT';
    metadata?: Record<string, unknown>;
}) => alovaInstance.Post<Node>('/node/add', data);

/** 更新节点 */
export const updateNode = (data: {
    id: string;
    name?: string;
    parentId?: string | null;
    description?: string;
    type?: 'ROOT' | 'CONTAINER' | 'BOX' | 'BOX_SLOT';
}) => alovaInstance.Put<Node>('/node/update', data);

/** 删除节点 */
export const deleteNode = (id: string) => alovaInstance.Delete<void>('/node/del', { id });

/** 设置网格配置 */
export const setGridConfig = (data: { nodeId: string; rows: number; cols: number }) =>
    alovaInstance.Post<{ nodeId: string; rows: number; cols: number }>('/node/grid/set', data);

/** 移除网格配置 */
export const removeGridConfig = (nodeId: string) =>
    alovaInstance.Delete<void>('/node/grid/remove', { nodeId });
```

### Step 2：类型检查

```bash
pnpm --filter BSB-Frontend type-check
```

### Step 3：提交

```bash
git add BSB-Frontend/src/api/modules/node.ts
git commit -m "fix(frontend/node): fetchNodeTree returns flat Node[] not tree, clean up commented code"
```

---

## Task 9：重构前端 Node Store

**Files:**
- Modify: `BSB-Frontend/src/stores/node.ts`

当前问题：
1. `getNodeTree` 存在但测试调用的是 `fetchByOrg`（不存在）
2. 没有 `buildTree` 工具函数——后端返回扁平数组，store 必须自行构建树
3. 没有暴露 `treeNodes`（computed），组件需要消费树结构

### Step 1：修改 `stores/node.ts`

```typescript
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { fetchNodeTree, deleteNode, createNode, updateNode } from '@/api/modules/node';
import type { NodeItem } from '@/api/modules/node';
import type { Node } from '@/schemas/node.schema';

/** 将扁平节点列表构建为树结构（前端负责，O(n) 时间） */
function buildTree(flat: Node[]): NodeItem[] {
    const map = new Map<string, NodeItem>();
    for (const n of flat) map.set(n.id, { ...n, children: [] });

    const roots: NodeItem[] = [];
    for (const n of flat) {
        const item = map.get(n.id)!;
        if (n.parentId) {
            map.get(n.parentId)?.children?.push(item);
        } else {
            roots.push(item);
        }
    }
    return roots;
}

export const useNodeStore = defineStore('node', () => {
    /** 后端返回的原始扁平节点列表 */
    const nodes = ref<Node[]>([]);
    const loading = ref(false);

    /** 由 nodes 构建的树结构（前端计算，供 NodeCanvas 等组件使用） */
    const treeNodes = computed<NodeItem[]>(() => buildTree(nodes.value));

    /** 拉取组织下全部节点（扁平列表） */
    async function fetchByOrg(orgId: string, force = false) {
        loading.value = true;
        try {
            nodes.value = await fetchNodeTree(orgId).send(force);
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

    return { nodes, treeNodes, loading, fetchByOrg, addNode, removeNode, editNode };
});
```

### Step 2：类型检查

```bash
pnpm --filter BSB-Frontend type-check
```
预期：可能出现消费旧 `getNodeTree` 的文件报错——下一个 Task 修复。

### Step 3：提交

```bash
git add BSB-Frontend/src/stores/node.ts
git commit -m "refactor(frontend/store): add buildTree, rename getNodeTree->fetchByOrg, expose treeNodes computed"
```

---

## Task 10：修复前端 NodeCanvas.vue

**Files:**
- Modify: `BSB-Frontend/src/components/node/NodeCanvas.vue`

当前问题：
1. 调用了已被删除的 `getNodeTree` store 方法
2. 本地 `treeNodes` ref 与 store 的 `treeNodes` computed 重名
3. Filter 下拉选项包含 `ROOM` — 已废弃的类型

### Step 1：修改 `NodeCanvas.vue` 的 `<script setup>` 部分

关键改动点（找到原始代码对应位置逐一修改）：

**改动 A：** 移除本地 `treeNodes` ref，改用 store 的 `treeNodes` computed（通过 `storeToRefs`）：

```typescript
// 旧
import { useNodeStore } from '@/stores/node';
// ...
const nodeStore = useNodeStore();
const { getNodeTree } = nodeStore;
// ...
const treeNodes = ref<NodeWithChildren[]>([]);

// 新
import { storeToRefs } from 'pinia';
import { useNodeStore } from '@/stores/node';
// ...
const nodeStore = useNodeStore();
const { treeNodes } = storeToRefs(nodeStore);
```

**改动 B：** 移除 `NodeWithChildren` 导入（从 `node.schema` 移除，因为 `NodeItem` 已含 children）：

```typescript
// 旧
import type { NodeWithChildren } from '@/schemas/node.schema';

// 新（删除该行，NodeItem 来自 store/api）
```

**改动 C：** 更新 `fetchTree` 函数：

```typescript
// 旧
async function fetchTree() {
    if (!props.orgId) return;
    loading.value = true;
    try {
        treeNodes.value = await getNodeTree(props.orgId);
        setTimeout(() => fitView({ padding: 0.2 }), 100);
    } catch {
        /* empty */
    } finally {
        loading.value = false;
    }
}

// 新
async function fetchTree() {
    if (!props.orgId) return;
    try {
        await nodeStore.fetchByOrg(props.orgId);
        setTimeout(() => fitView({ padding: 0.2 }), 100);
    } catch {
        /* empty */
    }
}
```

注：`loading` 已在 store 内管理，移除本地 `loading` ref 的冗余（但要确认 template 中使用的是 `nodeStore.loading`）。

**改动 D：** 修改 `filteredTree` computed 的类型（本地 `loading` 改用 store 的）：

```typescript
// 删除本地 loading ref，改用 store 提供
const loading = computed(() => nodeStore.loading);
```

**改动 E：** 更新 template 中 Filter 下拉选项（将 `ROOM` 换为 `ROOT`，新增 `BOX_SLOT`）：

```html
<!-- 旧 -->
<SelectItem value="ROOM">ROOM</SelectItem>
<SelectItem value="BOX">BOX</SelectItem>
<SelectItem value="CONTAINER">CONTAINER</SelectItem>

<!-- 新 -->
<SelectItem value="ROOT">ROOT</SelectItem>
<SelectItem value="CONTAINER">CONTAINER</SelectItem>
<SelectItem value="BOX">BOX</SelectItem>
<SelectItem value="BOX_SLOT">BOX_SLOT</SelectItem>
```

同时更新 `typeColorMap` 和 `typeBgMap`：

```typescript
const typeColorMap: Record<string, string> = {
    ROOT: '#213183',
    CONTAINER: '#2a9d99',
    BOX: '#0075de',
    BOX_SLOT: '#0075ff'
};

const typeBgMap: Record<string, string> = {
    ROOT: '#f0f2ff',
    CONTAINER: '#f0fafa',
    BOX: '#f2f9ff',
    BOX_SLOT: '#f2f9de'
};
```

（这两个 map 原本用的是新类型名，已经正确，只需确认 `ROOM` 没出现即可。）

### Step 2：类型检查

```bash
pnpm --filter BSB-Frontend type-check
```
预期：0 errors

### Step 3：提交

```bash
git add BSB-Frontend/src/components/node/NodeCanvas.vue
git commit -m "fix(frontend/NodeCanvas): use store treeNodes, call fetchByOrg, fix filter options NodeType"
```

---

## Task 11：修复前端单元测试

**Files:**
- Modify: `BSB-Frontend/test/unit/stores/node.spec.ts`

当前问题：
1. 模拟了 `filterNodes`（已删除）
2. 调用 `store.fetchByOrg`（不存在，当时叫 `getNodeTree`）
3. 测试 `addNode` 断言总节点数，但 `fetchByOrg` mock 需要正确

### Step 1：运行现有测试确认失败

```bash
pnpm --filter BSB-Frontend test -- --reporter=verbose node.spec
```
预期：FAIL

### Step 2：重写 `node.spec.ts`

```typescript
import { setActivePinia, createPinia } from 'pinia';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useNodeStore } from '@/stores/node';

vi.mock('@/api/modules/node', () => ({
    fetchNodeTree: () => ({
        send: () =>
            Promise.resolve([
                {
                    id: 'n1',
                    name: 'Root A',
                    type: 'ROOT',
                    parentId: null,
                    orgId: 'org-1',
                    metadata: null,
                    gridConfig: null,
                    description: null,
                    createdAt: '',
                    updatedAt: '',
                },
                {
                    id: 'n2',
                    name: 'Container B',
                    type: 'CONTAINER',
                    parentId: 'n1',
                    orgId: 'org-1',
                    metadata: null,
                    gridConfig: null,
                    description: null,
                    createdAt: '',
                    updatedAt: '',
                },
            ]),
    }),
    createNode: () => ({
        send: () =>
            Promise.resolve({
                id: 'n3',
                name: 'Box 1',
                type: 'BOX',
                parentId: 'n1',
                orgId: 'org-1',
                metadata: null,
                gridConfig: null,
                description: null,
                createdAt: '',
                updatedAt: '',
            }),
    }),
    deleteNode: () => ({ send: () => Promise.resolve() }),
    updateNode: () => ({
        send: () =>
            Promise.resolve({
                id: 'n1',
                name: 'Root A Updated',
                type: 'ROOT',
                parentId: null,
                orgId: 'org-1',
                metadata: null,
                gridConfig: null,
                description: null,
                createdAt: '',
                updatedAt: '',
            }),
    }),
}));

describe('useNodeStore', () => {
    beforeEach(() => setActivePinia(createPinia()));

    it('fetchByOrg loads flat nodes', async () => {
        const store = useNodeStore();
        await store.fetchByOrg('org-1');
        expect(store.nodes.length).toBe(2);
        expect(store.nodes[0].type).toBe('ROOT');
    });

    it('treeNodes is built from flat nodes', async () => {
        const store = useNodeStore();
        await store.fetchByOrg('org-1');
        // n1 is root, n2 is child of n1
        expect(store.treeNodes.length).toBe(1);
        expect(store.treeNodes[0].id).toBe('n1');
        expect(store.treeNodes[0].children?.length).toBe(1);
        expect(store.treeNodes[0].children?.[0].id).toBe('n2');
    });

    it('addNode appends to flat list', async () => {
        const store = useNodeStore();
        await store.fetchByOrg('org-1');
        await store.addNode({ orgId: 'org-1', name: 'Box 1', type: 'BOX', parentId: 'n1' });
        expect(store.nodes.length).toBe(3);
    });

    it('removeNode removes from flat list', async () => {
        const store = useNodeStore();
        await store.fetchByOrg('org-1');
        await store.removeNode('n1');
        expect(store.nodes.length).toBe(1);
        expect(store.nodes.find((n) => n.id === 'n1')).toBeUndefined();
    });

    it('editNode updates node in flat list', async () => {
        const store = useNodeStore();
        await store.fetchByOrg('org-1');
        await store.editNode({ id: 'n1', name: 'Root A Updated' });
        expect(store.nodes.find((n) => n.id === 'n1')?.name).toBe('Root A Updated');
    });
});
```

### Step 3：运行测试验证

```bash
pnpm --filter BSB-Frontend test -- --reporter=verbose node.spec
```
预期：PASS（5 个测试全部通过）

### Step 4：提交

```bash
git add BSB-Frontend/test/unit/stores/node.spec.ts
git commit -m "test(frontend/node): rewrite store tests - fetchByOrg, treeNodes buildTree, correct NodeTypes"
```

---

## Task 12：全量验证

### Step 1：后端全量测试

```bash
pnpm --filter BSB-Backend test
```
预期：所有 unit 测试 PASS（E2E 需要数据库连接，可酌情跳过）

### Step 2：前端全量测试

```bash
pnpm --filter BSB-Frontend test
pnpm --filter BSB-Frontend test:e2e
```
预期：全部 PASS

### Step 3：前端类型检查

```bash
pnpm --filter BSB-Frontend type-check
```
预期：0 errors

### Step 4：后端构建

```bash
pnpm --filter BSB-Backend build
```
预期：0 errors

### Step 5：最终提交（如有遗漏的格式修复）

```bash
pnpm run format
git add -A
git commit -m "chore: format pass after node schema alignment"
```

---

## 变更摘要

| 文件 | 变更类型 | 说明 |
|------|---------|------|
| `BSB-Backend/src/modules/node/node.dto.ts` | 修复 | UpdateNodeDto type enum 对齐新 NodeType；删除 NodeListDto/NodeFilterDto |
| `BSB-Backend/src/modules/node/node.repository.ts` | 重构 | 删除 filter 方法和所有注释代码 |
| `BSB-Backend/src/modules/node/node.service.ts` | 重构 | 删除 filter 方法和注释方法 |
| `BSB-Backend/src/modules/node/node.controller.ts` | 重构 | 删除注释端点，清理无用 DTO 导入 |
| `BSB-Backend/test/unit/node.service.spec.ts` | 重写 | 修正 mock、补全覆盖 |
| `BSB-Backend/test/unit/node.controller.spec.ts` | 重写 | 移除废弃方法、补全 grid 测试 |
| `BSB-Backend/test/e2e/node-extensions.e2e-spec.ts` | 重写 | 修正 NodeType，删除 filter 测试 |
| `BSB-Frontend/src/schemas/node.schema.ts` | 修复 | type enum 对齐新 NodeType |
| `BSB-Frontend/src/api/modules/node.ts` | 修复 | fetchNodeTree 返回 Node[]，清理注释 |
| `BSB-Frontend/src/stores/node.ts` | 重构 | 添加 buildTree，getNodeTree→fetchByOrg，暴露 treeNodes |
| `BSB-Frontend/src/components/node/NodeCanvas.vue` | 修复 | 使用 store.fetchByOrg/treeNodes，更新 filter 选项 |
| `BSB-Frontend/test/unit/stores/node.spec.ts` | 重写 | 对齐新 store API，测试 buildTree |
