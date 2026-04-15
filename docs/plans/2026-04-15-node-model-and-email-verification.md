# Node 父指针模型 + 邮箱验证码链 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 为 BSB-Backend 补充两个缺失功能：(1) 将 Root 固定两层的扁平层级抽象为 Node 父指针树，支持任意深度的位置层级；(2) 用 nodemailer 替换 UserService 中所有邮箱相关的 stub 实现。

**Architecture:** 特性 A 采用"并行引入"策略：新增 `Node` 模型与 `NodeModule`，保留 `Root` / `Box` 但为 Box 添加可选的 `nodeId` 软关联；`Box.rootId` 语义变为"第一层 Node ID"的别名字段（可渐进迁移）。特性 B 采用"基础设施先行"策略：先创建 `MailModule`（nodemailer 包装），再创建 `EmailVerificationRepository`，最后替换 stub。

**Tech Stack:** NestJS 11, Prisma 7 + PostgreSQL, nestjs-zod + zod v4, nodemailer, ULID, Jest 30 + ts-jest ESM

---

## 背景知识

### 代码约定（必读）
- **所有 ID 使用 ULID**，`@id @default(ulid())`，不使用 UUID
- **DTO 全部使用 `createZodDto()`** (nestjs-zod)，schema 用 `z.object({}).meta({})`
- **Exception 使用 `@RegisterException` 装饰器**，继承 `ClientException`（见 `src/common/exceptions/`）
- **Repository 注入 `DatabaseService`**，通过 `this.db.xxx` 操作 Prisma Client
- **模块文件结构**：`xxx.controller.ts`, `xxx.dto.ts`, `xxx.exception.ts`, `xxx.module.ts`, `xxx.repository.ts`, `xxx.service.ts`
- **测试 mock 约定**：`jest.Mocked<Pick<ServiceOrRepo, 'method1' | 'method2'>>` + 直接 `new Service(mocks as any)`
- **ESM 测试**：`jest.config.js` 使用 `extensionsToTreatAsEsm: ['.ts']`，import 需要 `.js` 后缀

### 已知 stub（将被替换）
```
src/modules/user/user.service.ts:
  Line ~57: sendEmailCode()  → return { sent: true }
  Line ~62: emailLogin()     → throw new Error('Email login not yet implemented')
  Line ~69: updateEmail()    → TODO: 验证码校验注释
  Line ~76: emailUpdatePassword() → TODO: 验证码校验注释
```

---

## 特性 A：Node 父指针模型

### Task A1: Prisma schema — 添加 Node 模型

**Files:**
- Modify: `BSB-Backend/prisma/schema.prisma`

**Step 1: 在 schema.prisma 中添加 Node 模型**

在 `model Root` 之前插入以下内容（将 `model Root {` 片段之前，`model Box` 关系字段 `root` 保持不变）：

```prisma
model Node {
  id          String    @id @default(ulid())
  orgId       String
  parentId    String?
  name        String
  description String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  org      Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)
  parent   Node?        @relation("NodeTree", fields: [parentId], references: [id], onDelete: SetNull)
  children Node[]       @relation("NodeTree")
  boxes    Box[]        @relation("BoxNode")

  @@index([orgId])
  @@index([parentId])
}
```

同时在 `model Organization` 下添加 `nodes` 关系字段（在 `roots Root[]` 行后）：

```prisma
  nodes Node[]
```

在 `model Box` 中添加 `nodeId` 字段（在 `rootId String?` 后）：

```prisma
  nodeId String?
```

并添加 `node` 关系（在 `root Root?` 关系行后）：

```prisma
  node  Node?   @relation("BoxNode", fields: [nodeId], references: [id], onDelete: SetNull)
```

以及添加索引（在 `@@index([rootId])` 后）：

```prisma
  @@index([nodeId])
```

**Step 2: 生成迁移**

```bash
cd BSB-Backend
pnpm db:migrate
```

输入迁移名称：`add_node_model`

预期：`migrations/` 目录下出现新的迁移文件，`generated/` 下 Prisma Client 重新生成。

**Step 3: 重新生成 Prisma Client**

```bash
pnpm db:gen-client
```

预期：无报错，`prisma/generated/` 更新完成。

**Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat(node): add Node model with parent pointer to schema"
```

---

### Task A2: NodeModule 骨架 — exception + dto + repository

**Files:**
- Create: `BSB-Backend/src/modules/node/node.exception.ts`
- Create: `BSB-Backend/src/modules/node/node.dto.ts`
- Create: `BSB-Backend/src/modules/node/node.repository.ts`

**Step 1: 创建 `node.exception.ts`**

```typescript
// BSB-Backend/src/modules/node/node.exception.ts
import { ClientException, RegisterException } from '@/common/exceptions/index.js';

export const NodeExceptionCode = {
    NOT_FOUND: 'NODE_NOT_FOUND',
    CIRCULAR_REFERENCE: 'NODE_CIRCULAR_REFERENCE',
} as const;

@RegisterException({
    code: NodeExceptionCode.NOT_FOUND,
    statusCode: 404,
    message: '节点不存在',
    description: '指定的 Node ID 未找到匹配的记录',
    retryable: false,
    logLevel: 'info',
})
export class NodeNotFoundException extends ClientException {}

@RegisterException({
    code: NodeExceptionCode.CIRCULAR_REFERENCE,
    statusCode: 400,
    message: '不允许循环引用',
    description: '将节点移动到自身或后代节点下会形成循环引用',
    retryable: false,
    logLevel: 'warn',
})
export class NodeCircularReferenceException extends ClientException {}

export default { NodeNotFoundException, NodeCircularReferenceException };
```

**Step 2: 创建 `node.dto.ts`**

```typescript
// BSB-Backend/src/modules/node/node.dto.ts
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod/v4';

const CreateNodeDtoSchema = z
    .object({
        orgId: z.string().min(1).meta({ title: '组织 ID' }),
        parentId: z.string().optional().meta({ title: '父节点 ID（为空则为根节点）' }),
        name: z.string().min(1).max(128).meta({ title: '节点名称', example: '冷冻室 A' }),
        description: z.string().max(512).optional().meta({ title: '描述' }),
    })
    .meta({ description: '创建节点请求体' });

export class CreateNodeDto extends createZodDto(CreateNodeDtoSchema) {}

const UpdateNodeDtoSchema = z
    .object({
        id: z.string().min(1).meta({ title: 'Node ID' }),
        parentId: z.string().optional().nullable().meta({ title: '父节点 ID' }),
        name: z.string().min(1).max(128).optional().meta({ title: '节点名称' }),
        description: z.string().max(512).optional().meta({ title: '描述' }),
    })
    .meta({ description: '更新节点请求体' });

export class UpdateNodeDto extends createZodDto(UpdateNodeDtoSchema) {}

const NodeIdDtoSchema = z
    .object({
        id: z.string().min(1).meta({ title: 'Node ID' }),
    })
    .meta({ description: 'Node ID 参数' });

export class NodeIdDto extends createZodDto(NodeIdDtoSchema) {}

const NodeListDtoSchema = z
    .object({
        orgId: z.string().min(1).meta({ title: '组织 ID' }),
        parentId: z.string().optional().meta({ title: '按父节点过滤（为空则查根节点）' }),
    })
    .meta({ description: '节点列表查询参数' });

export class NodeListDto extends createZodDto(NodeListDtoSchema) {}

const NodeTreeDtoSchema = z
    .object({
        orgId: z.string().min(1).meta({ title: '组织 ID' }),
    })
    .meta({ description: '获取组织完整节点树的查询参数' });

export class NodeTreeDto extends createZodDto(NodeTreeDtoSchema) {}
```

**Step 3: 创建 `node.repository.ts`**

```typescript
// BSB-Backend/src/modules/node/node.repository.ts
import { DatabaseService } from '@/infra/database/database.service.js';

import { Injectable } from '@nestjs/common';

@Injectable()
export class NodeRepository {
    constructor(private readonly db: DatabaseService) {}

    async create(data: {
        orgId: string;
        parentId?: string;
        name: string;
        description?: string;
    }) {
        return this.db.node.create({ data });
    }

    async findById(id: string) {
        return this.db.node.findUnique({ where: { id } });
    }

    async findByIdWithChildren(id: string) {
        return this.db.node.findUnique({
            where: { id },
            include: {
                children: { include: { _count: { select: { children: true, boxes: true } } } },
                _count: { select: { boxes: true } },
            },
        });
    }

    async listByOrgId(orgId: string, parentId?: string) {
        return this.db.node.findMany({
            where: {
                orgId,
                parentId: parentId ?? null,
            },
            include: { _count: { select: { children: true, boxes: true } } },
            orderBy: { createdAt: 'asc' },
        });
    }

    /**
     * 递归加载整棵树（深度优先）。
     * 适用于节点数量合理的场景（< 500 节点），否则应分批查询。
     */
    async loadTree(orgId: string) {
        return this.db.node.findMany({
            where: { orgId, parentId: null },
            include: {
                children: {
                    include: {
                        children: {
                            include: {
                                children: true,
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'asc' },
        });
    }

    async update(
        id: string,
        data: { parentId?: string | null; name?: string; description?: string }
    ) {
        return this.db.node.update({ where: { id }, data });
    }

    async delete(id: string) {
        return this.db.node.delete({ where: { id } });
    }

    /** 检查 candidate 是否是 nodeId 的后代，用于防循环 */
    async isDescendant(nodeId: string, candidateId: string): Promise<boolean> {
        let current: { id: string; parentId: string | null } | null =
            await this.db.node.findUnique({
                where: { id: candidateId },
                select: { id: true, parentId: true },
            });

        while (current && current.parentId) {
            if (current.parentId === nodeId) return true;
            current = await this.db.node.findUnique({
                where: { id: current.parentId },
                select: { id: true, parentId: true },
            });
        }
        return false;
    }
}
```

**Step 4: Commit**

```bash
git add BSB-Backend/src/modules/node/
git commit -m "feat(node): add NodeException, NodeDto, NodeRepository"
```

---

### Task A3: NodeService

**Files:**
- Create: `BSB-Backend/src/modules/node/node.service.ts`

**Step 1: 先写单元测试**

```typescript
// BSB-Backend/test/unit/node.service.spec.ts
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
    let nodeRepo: jest.Mocked<Pick<NodeRepository, 'create' | 'findById' | 'listByOrgId' | 'loadTree' | 'update' | 'delete' | 'isDescendant'>>;
    let orgRepo: jest.Mocked<Pick<OrgRepository, 'findById' | 'findMembership'>>;

    const userId = 'user_01';
    const orgId = 'org_01';
    const nodeId = 'node_01';

    beforeEach(() => {
        nodeRepo = {
            create: jest.fn(),
            findById: jest.fn(),
            listByOrgId: jest.fn(),
            loadTree: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            isDescendant: jest.fn(),
        };
        orgRepo = {
            findById: jest.fn(),
            findMembership: jest.fn(),
        };
        service = new NodeService(nodeRepo as any, orgRepo as any);
    });

    describe('create', () => {
        it('should create a root node when user is admin', async () => {
            orgRepo.findById.mockResolvedValue({ id: orgId } as any);
            orgRepo.findMembership.mockResolvedValue({ role: 'ADMIN' } as any);
            nodeRepo.create.mockResolvedValue({ id: nodeId, orgId, name: '冷冻室 A' } as any);

            const result = await service.create(userId, { orgId, name: '冷冻室 A' });
            expect(result.id).toBe(nodeId);
            expect(nodeRepo.create).toHaveBeenCalledWith({ orgId, name: '冷冻室 A', parentId: undefined, description: undefined });
        });

        it('should throw OrgNotFoundException when org not found', async () => {
            orgRepo.findById.mockResolvedValue(null);
            await expect(service.create(userId, { orgId, name: 'X' })).rejects.toThrow(OrgNotFoundException);
        });

        it('should throw OrgNotAdminException when user is member only', async () => {
            orgRepo.findById.mockResolvedValue({ id: orgId } as any);
            orgRepo.findMembership.mockResolvedValue({ role: 'MEMBER' } as any);
            await expect(service.create(userId, { orgId, name: 'X' })).rejects.toThrow(OrgNotAdminException);
        });
    });

    describe('delete', () => {
        it('should throw NodeNotFoundException when node not found', async () => {
            nodeRepo.findById.mockResolvedValue(null);
            await expect(service.delete(userId, nodeId)).rejects.toThrow(NodeNotFoundException);
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
                service.update(userId, { id: nodeId, parentId: 'child_node' })
            ).rejects.toThrow(NodeCircularReferenceException);
        });
    });
});
```

**Step 2: 运行测试确认失败**

```bash
cd BSB-Backend
pnpm test -- --testPathPattern="node.service.spec"
```

预期：FAIL，`Cannot find module '../../src/modules/node/node.service.js'`

**Step 3: 创建 `node.service.ts`**

```typescript
// BSB-Backend/src/modules/node/node.service.ts
import { CreateNodeDto, UpdateNodeDto } from './node.dto.js';
import { NodeRepository } from './node.repository.js';
import {
    NodeNotFoundException,
    NodeCircularReferenceException,
} from './node.exception.js';

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
        });
    }

    async delete(userId: string, id: string) {
        const node = await this.nodeRepository.findById(id);
        if (!node) throw new NodeNotFoundException();
        await this.assertOrgAdmin(node.orgId, userId);
        await this.nodeRepository.delete(id);
    }

    async getOne(id: string) {
        const node = await this.nodeRepository.findByIdWithChildren(id);
        if (!node) throw new NodeNotFoundException();
        return node;
    }

    async list(orgId: string, parentId?: string) {
        return this.nodeRepository.listByOrgId(orgId, parentId);
    }

    async getTree(orgId: string) {
        return this.nodeRepository.loadTree(orgId);
    }

    async update(userId: string, dto: UpdateNodeDto) {
        const node = await this.nodeRepository.findById(dto.id);
        if (!node) throw new NodeNotFoundException();
        await this.assertOrgAdmin(node.orgId, userId);

        // 防止循环引用：不能将节点移到自身或其后代
        if (dto.parentId && dto.parentId !== node.parentId) {
            if (dto.parentId === dto.id) throw new NodeCircularReferenceException();
            const circular = await this.nodeRepository.isDescendant(dto.id, dto.parentId);
            if (circular) throw new NodeCircularReferenceException();
        }

        return this.nodeRepository.update(dto.id, {
            ...(dto.parentId !== undefined && { parentId: dto.parentId }),
            ...(dto.name !== undefined && { name: dto.name }),
            ...(dto.description !== undefined && { description: dto.description }),
        });
    }
}
```

**Step 4: 运行测试确认通过**

```bash
pnpm test -- --testPathPattern="node.service.spec"
```

预期：PASS（5 个用例）

**Step 5: Commit**

```bash
git add BSB-Backend/src/modules/node/node.service.ts BSB-Backend/test/unit/node.service.spec.ts
git commit -m "feat(node): add NodeService with circular reference guard"
```

---

### Task A4: NodeController + NodeModule

**Files:**
- Create: `BSB-Backend/src/modules/node/node.controller.ts`
- Create: `BSB-Backend/src/modules/node/node.module.ts`
- Create: `BSB-Backend/src/modules/node/index.ts`

**Step 1: 先写 Controller 单元测试**

```typescript
// BSB-Backend/test/unit/node.controller.spec.ts
import { NodeController } from '../../src/modules/node/node.controller.js';
import { NodeService } from '../../src/modules/node/node.service.js';

describe('NodeController', () => {
    let controller: NodeController;
    let service: jest.Mocked<Pick<NodeService, 'create' | 'delete' | 'getOne' | 'list' | 'getTree' | 'update'>>;
    const user = { sub: 'user_01' } as any;

    beforeEach(() => {
        service = {
            create: jest.fn(),
            delete: jest.fn(),
            getOne: jest.fn(),
            list: jest.fn(),
            getTree: jest.fn(),
            update: jest.fn(),
        };
        controller = new NodeController(service as any);
    });

    it('should call service.create', async () => {
        service.create.mockResolvedValue({ id: 'node_01' } as any);
        const result = await controller.create(user, { orgId: 'org_01', name: '冷冻室 A' } as any);
        expect(service.create).toHaveBeenCalledWith('user_01', { orgId: 'org_01', name: '冷冻室 A' });
        expect(result).toEqual({ id: 'node_01' });
    });

    it('should call service.getTree', async () => {
        service.getTree.mockResolvedValue([] as any);
        const result = await controller.getTree({ orgId: 'org_01' } as any);
        expect(service.getTree).toHaveBeenCalledWith('org_01');
        expect(result).toEqual([]);
    });
});
```

**Step 2: 运行测试确认失败**

```bash
pnpm test -- --testPathPattern="node.controller.spec"
```

预期：FAIL，`Cannot find module '../../src/modules/node/node.controller.js'`

**Step 3: 创建 `node.controller.ts`**

```typescript
// BSB-Backend/src/modules/node/node.controller.ts
import {
    CreateNodeDto,
    UpdateNodeDto,
    NodeIdDto,
    NodeListDto,
    NodeTreeDto,
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
        summary: '创建节点（根节点或子节点）',
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

    @Get('one')
    @ApiRoute({
        auth: 'required',
        summary: '获取节点详情（含直接子节点）',
        errors: [NODE_EXCEPTION.NodeNotFoundException.code],
    })
    async getOne(@Query() query: NodeIdDto) {
        return this.nodeService.getOne(query.id);
    }

    @Get('list')
    @ApiRoute({
        auth: 'required',
        summary: '获取组织下指定父节点的直接子节点列表',
    })
    async list(@Query() query: NodeListDto) {
        return this.nodeService.list(query.orgId, query.parentId);
    }

    @Get('tree')
    @ApiRoute({
        auth: 'required',
        summary: '获取组织完整节点树（4 层深度）',
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
}
```

**Step 4: 创建 `node.module.ts`**

```typescript
// BSB-Backend/src/modules/node/node.module.ts
import { NodeController } from './node.controller.js';
import { NodeService } from './node.service.js';
import { NodeRepository } from './node.repository.js';

import { OrgModule } from '@/modules/org/org.module.js';

import { Module } from '@nestjs/common';

@Module({
    imports: [OrgModule],
    controllers: [NodeController],
    providers: [NodeService, NodeRepository],
    exports: [NodeService, NodeRepository],
})
export class NodeModule {}
```

**Step 5: 创建 `index.ts`（barrel）**

```typescript
// BSB-Backend/src/modules/node/index.ts
export * from './node.controller.js';
export * from './node.dto.js';
export * from './node.exception.js';
export * from './node.module.js';
export * from './node.repository.js';
export * from './node.service.js';
```

**Step 6: 运行控制器测试**

```bash
pnpm test -- --testPathPattern="node.controller.spec"
```

预期：PASS

**Step 7: Commit**

```bash
git add BSB-Backend/src/modules/node/
git commit -m "feat(node): add NodeController, NodeModule, barrel export"
```

---

### Task A5: 注册 NodeModule 到应用

**Files:**
- Modify: `BSB-Backend/src/modules/index.ts`
- Modify: `BSB-Backend/src/app.module.ts`（如果显式导入模块）

**Step 1: 检查 `src/modules/index.ts` 当前内容**

打开文件，确认当前暴露的模块列表。典型内容如下：

```typescript
// 当前 src/modules/index.ts 大致内容
export * from './auth/index.js';
export * from './box/index.js';
// ...其他模块
export * from './root/index.js';
// ...
```

**Step 2: 在 `src/modules/index.ts` 末尾追加 NodeModule**

在文件末尾添加：

```typescript
export * from './node/index.js';
```

**Step 3: 检查 `src/app.module.ts` 是否需要手动导入**

查看 `app.module.ts` 中 `imports` 数组，如果它直接引用每个 Module（而不是通过 modules/index.ts 自动注册），则在 imports 数组中添加 `NodeModule`：

```typescript
import { NodeModule } from '@/modules/node/node.module.js';
// ...
@Module({
    imports: [
        // ...现有模块
        NodeModule,
    ],
})
```

**Step 4: 验证编译通过**

```bash
pnpm build
```

预期：无 TypeScript 编译错误。

**Step 5: Commit**

```bash
git add BSB-Backend/src/modules/index.ts BSB-Backend/src/app.module.ts
git commit -m "feat(node): register NodeModule in application"
```

---

### Task A6: 为 Box 关联 Node（可选关联字段接入 DTO/Repository）

**Files:**
- Modify: `BSB-Backend/src/modules/box/box.dto.ts`
- Modify: `BSB-Backend/src/modules/box/box.repository.ts`
- Modify: `BSB-Backend/src/modules/box/box.service.ts`

**Step 1: 更新 `box.dto.ts`**

在 `CreateBoxDtoSchema` 中添加 `nodeId` 字段（在 `rootId` 字段后）：

```typescript
nodeId: z.string().optional().meta({ title: 'Node ID（节点归属）' }),
```

在 `UpdateBoxDtoSchema` 中同样添加：

```typescript
nodeId: z.string().optional().nullable().meta({ title: 'Node ID' }),
```

**Step 2: 更新 `box.repository.ts` — create 和 update 方法**

`create` 方法的数据参数类型中添加 `nodeId?: string`：

```typescript
async create(data: {
    orgId: string;
    rootId?: string;
    nodeId?: string;       // 新增
    name: string;
    description?: string;
    rows: number;
    cols: number;
}) {
    return this.db.box.create({ data });
}
```

`update` 方法的数据参数类型中添加 `nodeId?: string | null`：

```typescript
async update(
    id: string,
    data: { rootId?: string | null; nodeId?: string | null; name?: string; description?: string }
) {
    return this.db.box.update({ where: { id }, data });
}
```

在 `findByIdWithDetail`、`listByOrgId` 等 include 中添加 `node: { select: { id: true, name: true } }`（与 `root` 字段对齐）。

**Step 3: 更新 `box.service.ts` — create 和 update 方法**

`create` 方法中传递 `nodeId`：

```typescript
async create(userId: string, dto: CreateBoxDto) {
    await this.assertOrgAdmin(dto.orgId, userId);
    return this.boxRepository.create({
        orgId: dto.orgId,
        rootId: dto.rootId,
        nodeId: dto.nodeId,   // 新增
        name: dto.name,
        description: dto.description,
        rows: dto.rows,
        cols: dto.cols,
    });
}
```

`update` 方法中同样添加：

```typescript
return this.boxRepository.update(dto.id, {
    ...(dto.rootId !== undefined && { rootId: dto.rootId }),
    ...(dto.nodeId !== undefined && { nodeId: dto.nodeId }),  // 新增
    ...(dto.name !== undefined && { name: dto.name }),
    ...(dto.description !== undefined && { description: dto.description }),
});
```

**Step 4: 运行现有 Box 测试**

```bash
pnpm test -- --testPathPattern="box\."
```

预期：全部 PASS（仅新增可选字段，不破坏已有行为）

**Step 5: Commit**

```bash
git add BSB-Backend/src/modules/box/
git commit -m "feat(box): add optional nodeId field to Box CRUD"
```

---

## 特性 B：nodemailer 邮箱验证码链

### Task B1: 安装 nodemailer 并配置 SMTP

**Files:**
- Modify: `BSB-Backend/package.json`
- Modify: `BSB-Backend/.env.development`（或对应的环境文件）
- Create: `BSB-Backend/src/constants/mail.constant.ts`
- Modify: `BSB-Backend/src/constants/index.ts`

**Step 1: 安装依赖**

```bash
cd BSB-Backend
pnpm add nodemailer
pnpm add -D @types/nodemailer
```

预期：`package.json` 中 `dependencies` 出现 `nodemailer`，`devDependencies` 出现 `@types/nodemailer`。

**Step 2: 添加 SMTP 环境变量**

打开 `.env.development`（或项目实际使用的 env 文件），追加：

```env
# SMTP 邮件服务
SMTP_HOST=smtp.example.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=no-reply@example.com
SMTP_PASS=your_smtp_password
SMTP_FROM="BSB 系统 <no-reply@example.com>"
```

> **注意**：生产环境使用真实 SMTP 凭据，**禁止硬编码**密码到代码中。

**Step 3: 创建 `mail.constant.ts`**

```typescript
// BSB-Backend/src/constants/mail.constant.ts
import { registerAs } from '@nestjs/config';

export interface MailConfig {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    pass: string;
    from: string;
}

export default registerAs('mail', (): MailConfig => ({
    host: process.env.SMTP_HOST ?? '',
    port: Number(process.env.SMTP_PORT ?? 465),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER ?? '',
    pass: process.env.SMTP_PASS ?? '',
    from: process.env.SMTP_FROM ?? '',
}));
```

**Step 4: 更新 `src/constants/index.ts`**

在现有 `AllConfig` 类型中追加 `mail` 键，并在 `load` 数组中引入新的 config factory。

找到当前 `index.ts` 中导出 `AllConfig` 的位置，修改示例（以现有文件内容为准）：

```typescript
import mailConfig, { MailConfig } from './mail.constant.js';

export interface AllConfig {
  // ... 已有字段 ...
  mail: MailConfig;
}

// 在 ConfigModule.forRoot 的 load 数组中添加 mailConfig：
export const configLoads = [
  // ...已有 config factories...
  mailConfig,
];
```

> **提示**：打开 `src/constants/index.ts` 确认具体导出格式，按实际文件结构追加，不要删除已有内容。

**Step 5: Commit**

```bash
git add BSB-Backend/package.json BSB-Backend/pnpm-lock.yaml BSB-Backend/src/constants/
git commit -m "feat(mail): add nodemailer dependency and SMTP config"
```

---

### Task B2: Prisma schema — 添加 EmailVerification 模型

**Files:**
- Modify: `BSB-Backend/prisma/schema.prisma`

**Step 1: 在 `Feedback` 模型之后追加 `EmailVerification` 模型**

```prisma
model EmailVerification {
  id        String   @id @default(ulid())
  email     String
  code      String
  expiresAt DateTime
  createdAt DateTime @default(now())

  @@index([email])
}
```

> 说明：不关联 `User`，因为邮箱登录时用户可能尚未注册，用 email 字段直接匹配。

**Step 2: 生成迁移**

```bash
pnpm db:migrate
```

输入迁移名称：`add_email_verification`

**Step 3: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat(mail): add EmailVerification model to schema"
```

---

### Task B3: MailService（nodemailer 基础设施层）

**Files:**
- Create: `BSB-Backend/src/infra/mail/mail.service.ts`
- Create: `BSB-Backend/src/infra/mail/mail.module.ts`

**Step 1: 创建 `mail.service.ts`**

```typescript
// BSB-Backend/src/infra/mail/mail.service.ts
import { AllConfig } from '@/constants/index.js';

import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { type Transporter } from 'nodemailer';

@Injectable()
export class MailService implements OnModuleInit {
    private transporter!: Transporter;

    constructor(private readonly configService: ConfigService<AllConfig, true>) {}

    onModuleInit() {
        const cfg = this.configService.get('mail', { infer: true });
        this.transporter = nodemailer.createTransport({
            host: cfg.host,
            port: cfg.port,
            secure: cfg.secure,
            auth: {
                user: cfg.user,
                pass: cfg.pass,
            },
        });
    }

    /**
     * 发送纯文本/HTML 邮件。
     *
     * @param to 收件人地址。
     * @param subject 主题。
     * @param text 纯文本正文（可选，html 优先）。
     * @param html HTML 正文（可选）。
     */
    async sendMail(params: {
        to: string;
        subject: string;
        text?: string;
        html?: string;
    }): Promise<void> {
        const from = this.configService.get('mail.from', { infer: true });
        await this.transporter.sendMail({
            from,
            to: params.to,
            subject: params.subject,
            text: params.text,
            html: params.html,
        });
    }

    /**
     * 发送 6 位验证码邮件（快捷方法）。
     */
    async sendVerificationCode(to: string, code: string): Promise<void> {
        await this.sendMail({
            to,
            subject: '【BSB】邮箱验证码',
            html: `
                <p>您好，</p>
                <p>您的验证码为：<strong style="font-size:24px;letter-spacing:4px">${code}</strong></p>
                <p>验证码 10 分钟内有效，请勿泄露。</p>
                <p>如非本人操作，请忽略此邮件。</p>
            `,
            text: `您的验证码为：${code}，10 分钟内有效。`,
        });
    }
}
```

**Step 2: 创建 `mail.module.ts`**

```typescript
// BSB-Backend/src/infra/mail/mail.module.ts
import { MailService } from './mail.service.js';

import { Global, Module } from '@nestjs/common';

@Global()
@Module({
    providers: [MailService],
    exports: [MailService],
})
export class MailModule {}
```

**Step 3: 在 `app.module.ts` 中导入 MailModule**

打开 `src/app.module.ts`，在 `imports` 数组中加入 `MailModule`：

```typescript
import { MailModule } from '@/infra/mail/mail.module.js';
// ...
@Module({
    imports: [
        // ... 已有模块（ConfigModule, DatabaseModule, etc.）
        MailModule,
        // ... 其他模块
    ],
})
```

**Step 4: 运行编译验证**

```bash
pnpm build
```

预期：无类型错误。

**Step 5: Commit**

```bash
git add BSB-Backend/src/infra/mail/
git commit -m "feat(mail): add MailService with nodemailer transporter"
```

---

### Task B4: EmailVerificationRepository + UserException 更新

**Files:**
- Create: `BSB-Backend/src/modules/user/email-verification.repository.ts`
- Modify: `BSB-Backend/src/modules/user/user.exception.ts`

**Step 1: 创建 `email-verification.repository.ts`**

```typescript
// BSB-Backend/src/modules/user/email-verification.repository.ts
import { DatabaseService } from '@/infra/database/database.service.js';

import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailVerificationRepository {
    constructor(private readonly db: DatabaseService) {}

    async create(email: string, code: string, expiresAt: Date) {
        return this.db.emailVerification.create({
            data: { email, code, expiresAt },
        });
    }

    async findLatestByEmail(email: string) {
        return this.db.emailVerification.findFirst({
            where: { email },
            orderBy: { createdAt: 'desc' },
        });
    }

    async deleteByEmail(email: string) {
        return this.db.emailVerification.deleteMany({ where: { email } });
    }
}
```

**Step 2: 在 `user.exception.ts` 中追加新的 Exception**

打开 `src/modules/user/user.exception.ts`，在文件末尾（`export default` 语句之前）追加：

```typescript
export const UserExceptionCode = {
    // ... 已有代码（保持原始 const 名，如果没有统一 const 则逐个添加）
    VERIFICATION_CODE_INVALID: 'VERIFICATION_CODE_INVALID',
    VERIFICATION_CODE_EXPIRED: 'VERIFICATION_CODE_EXPIRED',
    EMAIL_ALREADY_USED: 'EMAIL_ALREADY_USED',
} as const;

@RegisterException({
    code: 'VERIFICATION_CODE_INVALID',
    statusCode: 400,
    message: '验证码无效',
    description: '提供的邮箱验证码不正确或不存在',
    retryable: false,
    logLevel: 'info',
})
export class VerificationCodeInvalidException extends ClientException {}

@RegisterException({
    code: 'VERIFICATION_CODE_EXPIRED',
    statusCode: 400,
    message: '验证码已过期',
    description: '验证码超过有效期（10 分钟），请重新发送',
    retryable: true,
    logLevel: 'info',
})
export class VerificationCodeExpiredException extends ClientException {}

@RegisterException({
    code: 'EMAIL_ALREADY_USED',
    statusCode: 409,
    message: '该邮箱已被其他账号使用',
    description: '尝试绑定的新邮箱已存在于系统中',
    retryable: false,
    logLevel: 'warn',
})
export class EmailAlreadyUsedException extends ClientException {}
```

同时在文件末尾的 `export default` 对象中追加三个新 exception：

```typescript
export default {
    // ... 已有
    VerificationCodeInvalidException,
    VerificationCodeExpiredException,
    EmailAlreadyUsedException,
};
```

**Step 3: Commit**

```bash
git add BSB-Backend/src/modules/user/email-verification.repository.ts
git add BSB-Backend/src/modules/user/user.exception.ts
git commit -m "feat(mail): add EmailVerificationRepository and new user exceptions"
```

---

### Task B5: UserService — 替换 stub 实现

**Files:**
- Modify: `BSB-Backend/src/modules/user/user.service.ts`

**Step 1: 先更新 `user.service.ts` 的依赖注入**

将构造函数修改为注入 `MailService` 和 `EmailVerificationRepository`：

```typescript
import { MailService } from '@/infra/mail/mail.service.js';
import { EmailVerificationRepository } from './email-verification.repository.js';
import {
    UserNotFoundException,
    OldPasswordWrongException,
    EmailSameException,
    VerificationCodeInvalidException,
    VerificationCodeExpiredException,
    EmailAlreadyUsedException,
} from './user.exception.js';

// ... 其他 import 保持不变

@Injectable()
export class UserService {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly emailVerificationRepository: EmailVerificationRepository,
        private readonly mailService: MailService,
        private readonly configService: ConfigService<AllConfig, true>
    ) {}
```

**Step 2: 替换 `sendEmailCode()` stub**

将：

```typescript
async sendEmailCode(_email: string) {
    // TODO: 接入真实邮件服务，当前返回 stub
    return { sent: true };
}
```

替换为：

```typescript
async sendEmailCode(email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    // 生成 6 位随机数字验证码
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 分钟

    // 删除该邮箱的旧验证码（一次只允许一个有效码）
    await this.emailVerificationRepository.deleteByEmail(normalizedEmail);
    await this.emailVerificationRepository.create(normalizedEmail, code, expiresAt);
    await this.mailService.sendVerificationCode(normalizedEmail, code);

    return { sent: true };
}
```

**Step 3: 替换 `emailLogin()` stub**

将：

```typescript
async emailLogin(_email: string, _code: string) {
    // TODO: 接入真实验证码校验
    throw new Error('Email login not yet implemented');
}
```

替换为：

```typescript
async emailLogin(email: string, code: string) {
    const normalizedEmail = email.trim().toLowerCase();
    await this.verifyEmailCode(normalizedEmail, code);

    // 查找用户（邮箱登录不自动注册）
    const user = await this.userRepository.findByEmail(normalizedEmail);
    if (!user) throw new UserNotFoundException();

    // 验证通过后清除验证码
    await this.emailVerificationRepository.deleteByEmail(normalizedEmail);

    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
}
```

**Step 4: 补充私有辅助方法 `verifyEmailCode`**

在 `emailLogin` 之后添加：

```typescript
/** 验证邮箱验证码，通过返回 void，失败抛出异常。 */
private async verifyEmailCode(email: string, code: string): Promise<void> {
    const record = await this.emailVerificationRepository.findLatestByEmail(email);
    if (!record || record.code !== code) {
        throw new VerificationCodeInvalidException();
    }
    if (record.expiresAt < new Date()) {
        throw new VerificationCodeExpiredException();
    }
}
```

**Step 5: 替换 `updateEmail()` stub 中的 TODO**

将：

```typescript
async updateEmail(userId: string, newEmail: string, _code: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new UserNotFoundException();
    if (user.email === newEmail) throw new EmailSameException();
    // TODO: 验证码校验
    const updated = await this.userRepository.update(userId, { email: newEmail });
    const { passwordHash: _, ...safeUser } = updated;
    return safeUser;
}
```

替换为：

```typescript
async updateEmail(userId: string, newEmail: string, code: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new UserNotFoundException();
    const normalizedEmail = newEmail.trim().toLowerCase();
    if (user.email === normalizedEmail) throw new EmailSameException();

    // 检查新邮箱是否已被其他账号使用
    const existing = await this.userRepository.findByEmail(normalizedEmail);
    if (existing && existing.id !== userId) throw new EmailAlreadyUsedException();

    await this.verifyEmailCode(normalizedEmail, code);
    await this.emailVerificationRepository.deleteByEmail(normalizedEmail);

    const updated = await this.userRepository.update(userId, { email: normalizedEmail });
    const { passwordHash: _, ...safeUser } = updated;
    return safeUser;
}
```

**Step 6: 替换 `emailUpdatePassword()` TODO**

将：

```typescript
async emailUpdatePassword(_email: string, _code: string, newPassword: string) {
    // TODO: 验证码校验后，根据 email 找到用户修改密码
    const user = await this.userRepository.findByEmail(_email);
    if (!user) throw new UserNotFoundException();
    const saltRounds = this.configService.get('auth.bcryptSaltRound', { infer: true });
    const newHash = await bcrypt.hash(newPassword, saltRounds);
    await this.userRepository.update(user.id, { passwordHash: newHash });
}
```

替换为：

```typescript
async emailUpdatePassword(email: string, code: string, newPassword: string) {
    const normalizedEmail = email.trim().toLowerCase();
    await this.verifyEmailCode(normalizedEmail, code);

    const user = await this.userRepository.findByEmail(normalizedEmail);
    if (!user) throw new UserNotFoundException();

    const saltRounds = this.configService.get('auth.bcryptSaltRound', { infer: true });
    const newHash = await bcrypt.hash(newPassword, saltRounds);
    await this.userRepository.update(user.id, { passwordHash: newHash });
    await this.emailVerificationRepository.deleteByEmail(normalizedEmail);
}
```

**Step 7: Commit**

```bash
git add BSB-Backend/src/modules/user/user.service.ts
git commit -m "feat(mail): implement email verification code chain in UserService"
```

---

### Task B6: 更新 UserModule + UserService 单元测试

**Files:**
- Modify: `BSB-Backend/src/modules/user/user.module.ts`
- Modify: `BSB-Backend/test/unit/user.service.spec.ts`（或创建）

**Step 1: 更新 `user.module.ts` 以注入新依赖**

```typescript
// BSB-Backend/src/modules/user/user.module.ts
import { UserController } from './user.controller.js';
import { UserService } from './user.service.js';
import { UserRepository } from './user.repository.js';
import { EmailVerificationRepository } from './email-verification.repository.js';

import { Module } from '@nestjs/common';

@Module({
    controllers: [UserController],
    // MailService 通过 @Global() MailModule 自动提供，不需要在此 imports
    providers: [UserService, UserRepository, EmailVerificationRepository],
    exports: [UserService, UserRepository],
})
export class UserModule {}
```

**Step 2: 打开现有 `test/unit/user.service.spec.ts` 查看已有测试**

确认文件中的 mock 结构，然后新增针对邮箱验证码功能的用例。

**Step 3: 在 user.service.spec.ts 追加邮箱验证码测试**

在现有 test 文件的适当位置追加：

```typescript
// 追加到 describe('UserService', () => { ... }) 内部

describe('sendEmailCode', () => {
    it('should delete old code, save new code, and send email', async () => {
        evRepo.deleteByEmail.mockResolvedValue(undefined as any);
        evRepo.create.mockResolvedValue({ id: 'ev_01' } as any);
        mailService.sendVerificationCode.mockResolvedValue(undefined);

        const result = await service.sendEmailCode('test@example.com');
        expect(evRepo.deleteByEmail).toHaveBeenCalledWith('test@example.com');
        expect(evRepo.create).toHaveBeenCalled();
        expect(mailService.sendVerificationCode).toHaveBeenCalledWith('test@example.com', expect.stringMatching(/^\d{6}$/));
        expect(result).toEqual({ sent: true });
    });
});

describe('emailLogin', () => {
    it('should return user info on valid code', async () => {
        const futureDate = new Date(Date.now() + 5 * 60 * 1000);
        evRepo.findLatestByEmail.mockResolvedValue({ code: '123456', expiresAt: futureDate } as any);
        userRepo.findByEmail.mockResolvedValue({ id: 'u_01', email: 'test@example.com', passwordHash: 'hash' } as any);
        evRepo.deleteByEmail.mockResolvedValue(undefined as any);

        const result = await service.emailLogin('test@example.com', '123456');
        expect(result).not.toHaveProperty('passwordHash');
    });

    it('should throw VerificationCodeInvalidException on wrong code', async () => {
        evRepo.findLatestByEmail.mockResolvedValue({ code: '999999', expiresAt: new Date(Date.now() + 60000) } as any);
        await expect(service.emailLogin('test@example.com', '000000')).rejects.toThrow(VerificationCodeInvalidException);
    });

    it('should throw VerificationCodeExpiredException on expired code', async () => {
        const pastDate = new Date(Date.now() - 1000);
        evRepo.findLatestByEmail.mockResolvedValue({ code: '123456', expiresAt: pastDate } as any);
        await expect(service.emailLogin('test@example.com', '123456')).rejects.toThrow(VerificationCodeExpiredException);
    });
});
```

在 `beforeEach` 中追加 `evRepo` 和 `mailService` 的 mock（根据现有文件结构添加）：

```typescript
let evRepo: jest.Mocked<Pick<EmailVerificationRepository, 'create' | 'findLatestByEmail' | 'deleteByEmail'>>;
let mailService: jest.Mocked<Pick<MailService, 'sendVerificationCode'>>;

// in beforeEach:
evRepo = {
    create: jest.fn(),
    findLatestByEmail: jest.fn(),
    deleteByEmail: jest.fn(),
};
mailService = {
    sendVerificationCode: jest.fn(),
};
service = new UserService(userRepo as any, evRepo as any, mailService as any, configService as any);
```

**Step 4: 运行完整 UserService 测试**

```bash
pnpm test -- --testPathPattern="user.service.spec"
```

预期：PASS（包含新增的邮箱验证码用例）

**Step 5: Commit**

```bash
git add BSB-Backend/src/modules/user/user.module.ts
git add BSB-Backend/test/unit/user.service.spec.ts
git commit -m "test(user): add email verification code unit tests"
```

---

## 收尾检查

### 全量编译 + 测试

```bash
cd BSB-Backend
pnpm build
pnpm test
```

预期：
- 编译无任何 TypeScript 错误
- 所有单元测试通过（包括新增的 node.service.spec, node.controller.spec, user.service.spec）

### 检查 GitNexus 影响范围

```bash
npx gitnexus analyze
```

然后验证各修改符号的影响范围，特别关注：
- `UserService`（d=1 调用方：`UserController`）
- `BoxRepository`（d=1 调用方：`BoxService`）

### 最终 Commit 标记

```bash
git commit --allow-empty -m "chore: complete node-model and email-verification features"
```

---

## 附录：关键文件路径速查

| 类型 | 路径 |
|------|------|
| Prisma schema | `BSB-Backend/prisma/schema.prisma` |
| Node module | `BSB-Backend/src/modules/node/` |
| Mail infra | `BSB-Backend/src/infra/mail/` |
| EmailVerification repo | `BSB-Backend/src/modules/user/email-verification.repository.ts` |
| User service (stubs) | `BSB-Backend/src/modules/user/user.service.ts` |
| SMTP config | `BSB-Backend/src/constants/mail.constant.ts` |
| AllConfig | `BSB-Backend/src/constants/index.ts` |
| Unit tests | `BSB-Backend/test/unit/` |
