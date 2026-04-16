# P2：后端新 API — Share / ReagentType / Node 扩展 / Org 扩展 实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在 P1 Schema 基础上，新建 `ShareModule`、`ReagentTypeModule` 两个完整模块，扩展 `NodeModule`（gridConfig、filter、type 字段），扩展 `OrgModule`（explore、members/search），使所有前端批次所需的后端接口就绪。

**Architecture:** 每个新模块遵循 Controller → Service → Repository 三层分离，新模块使用构造函数注入 OrgModule 依赖；Node/Org 扩展只修改已有文件，通过追加 DTO/方法完成，不重写已有逻辑。所有新接口配套 E2E 测试。

**Tech Stack:** NestJS 11 · Prisma 6 · nestjs-zod（DTO 校验）· Zod v4 · supertest（E2E）

---

## 规范速查

实施前必读：
- [BSB-Backend/AGENTS.md](../../BSB-Backend/AGENTS.md) — 核心设计原则、提交门槛
- [BSB-Backend/docs/03-architecture/request-pipeline.md](../../BSB-Backend/docs/03-architecture/request-pipeline.md) — 请求处理链
- [BSB-Backend/docs/03-architecture/exception-system.md](../../BSB-Backend/docs/03-architecture/exception-system.md) — 异常与错误码体系
- [BSB-Backend/docs/01-guides/testing.md](../../BSB-Backend/docs/01-guides/testing.md) — 测试规范
- [docs/plans/2026-04-15-full-system-redesign.md](./2026-04-15-full-system-redesign.md) — 完整设计文档

---

## 前置条件

P2 依赖 P1 已完成：

```bash
cd BSB-Backend
pnpm run build        # 必须无错误
pnpm test             # 必须全部通过
```

确认 Prisma Client 中以下类型存在：

```bash
grep -r "NodeGridConfig\|ResourceShare\|ReagentType" prisma/generated/client
```

---

## Task 1：扩展 Node DTO + Repository + Service（type / metadata / gridConfig / filter）

**Files:**
- Modify: `BSB-Backend/src/modules/node/node.dto.ts`
- Modify: `BSB-Backend/src/modules/node/node.repository.ts`
- Modify: `BSB-Backend/src/modules/node/node.service.ts`
- Modify: `BSB-Backend/src/modules/node/node.controller.ts`

### Step 1：扩展 node.dto.ts

在文件末尾追加以下 DTO：

```typescript
// 在现有 NodeTreeDto 之后追加

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

const NodeFilterDtoSchema = z
    .object({
        orgId: z.string().min(1).meta({ title: '组织 ID' }),
        type: z.enum(['ROOM', 'BOX', 'CONTAINER']).optional().meta({ title: '节点类型过滤' }),
        hasGrid: z.coerce.boolean().optional().meta({ title: '是否有网格配置' }),
        parentId: z.string().optional().nullable().meta({ title: '父节点 ID 过滤' }),
    })
    .meta({ description: '节点过滤查询参数' });

export class NodeFilterDto extends createZodDto(NodeFilterDtoSchema) {}
```

同时修改现有 `CreateNodeDtoSchema`，添加 `type` 和 `metadata` 字段：

```typescript
// 修改 CreateNodeDtoSchema：在 description 后添加
        type: z.enum(['ROOM', 'BOX', 'CONTAINER']).default('CONTAINER').meta({ title: '节点类型' }),
        metadata: z.record(z.unknown()).optional().meta({ title: '自定义属性' }),
```

修改 `UpdateNodeDtoSchema`，添加 `type` 和 `metadata` 字段：

```typescript
// 修改 UpdateNodeDtoSchema：在 description 后添加
        type: z.enum(['ROOM', 'BOX', 'CONTAINER']).optional().meta({ title: '节点类型' }),
        metadata: z.record(z.unknown()).optional().meta({ title: '自定义属性' }),
```

### Step 2：扩展 node.repository.ts

在文件末尾（`delete` 方法之后）追加：

```typescript
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

    async filter(orgId: string, opts: { type?: string; hasGrid?: boolean; parentId?: string | null }) {
        return this.db.node.findMany({
            where: {
                orgId,
                ...(opts.type && { type: opts.type as any }),
                ...(opts.hasGrid === true && { gridConfig: { isNot: null } }),
                ...(opts.hasGrid === false && { gridConfig: null }),
                ...(opts.parentId !== undefined && { parentId: opts.parentId }),
            },
            include: {
                gridConfig: true,
                _count: { select: { children: true } },
            },
            orderBy: { createdAt: 'asc' },
        });
    }
```

同时修改 `create` 方法签名，接受 `type` 和 `metadata`：

```typescript
    async create(data: {
        orgId: string;
        parentId?: string;
        name: string;
        description?: string;
        type?: string;
        metadata?: Record<string, unknown>;
    }) {
        return this.db.node.create({ data: data as any });
    }
```

修改 `update` 方法签名，接受 `type` 和 `metadata`：

```typescript
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
```

### Step 3：扩展 node.service.ts

在 `update` 方法之后追加：

```typescript
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

    async filter(opts: { orgId: string; type?: string; hasGrid?: boolean; parentId?: string | null }) {
        return this.nodeRepository.filter(opts.orgId, opts);
    }
```

同时修改 `create` 方法，透传 `type` 和 `metadata`：

```typescript
    async create(userId: string, dto: CreateNodeDto) {
        await this.assertOrgAdmin(dto.orgId, userId);
        return this.nodeRepository.create({
            orgId: dto.orgId,
            parentId: dto.parentId,
            name: dto.name,
            description: dto.description,
            type: (dto as any).type,
            metadata: (dto as any).metadata,
        });
    }
```

修改 `update` 方法，透传 `type` 和 `metadata`：

```typescript
    async update(userId: string, dto: UpdateNodeDto) {
        const node = await this.nodeRepository.findById(dto.id);
        if (!node) throw new NodeNotFoundException();
        await this.assertOrgAdmin(node.orgId, userId);
        if (dto.parentId !== undefined) {
            if (dto.parentId === dto.id) throw new NodeCircularReferenceException();
            if (dto.parentId && await this.nodeRepository.isDescendant(dto.id, dto.parentId)) {
                throw new NodeCircularReferenceException();
            }
        }
        return this.nodeRepository.update(dto.id, {
            parentId: dto.parentId,
            name: dto.name,
            description: dto.description,
            type: (dto as any).type,
            metadata: (dto as any).metadata,
        });
    }
```

### Step 4：扩展 node.controller.ts

在文件末尾追加三个新端点（在现有 `update` 之后）：

```typescript
import { SetGridConfigDto, RemoveGridConfigDto, NodeFilterDto } from './node.dto.js';
// （添加到文件顶部 import 语句中）

    @Post('grid/set')
    @ApiRoute({
        auth: 'required',
        summary: '设置节点网格配置（使节点可承载试剂槽位）',
        errors: [NODE_EXCEPTION.NodeNotFoundException.code, ORG_EXCEPTION.OrgNotAdminException.code],
    })
    async setGridConfig(@CurrentUser() user: AccessTokenClaim, @Body() body: SetGridConfigDto) {
        return this.nodeService.setGridConfig(user.sub, body);
    }

    @Delete('grid/remove')
    @ApiRoute({
        auth: 'required',
        summary: '移除节点网格配置',
        errors: [NODE_EXCEPTION.NodeNotFoundException.code, ORG_EXCEPTION.OrgNotAdminException.code],
    })
    async removeGridConfig(@CurrentUser() user: AccessTokenClaim, @Body() body: RemoveGridConfigDto) {
        await this.nodeService.removeGridConfig(user.sub, body);
    }

    @Get('filter')
    @ApiRoute({
        auth: 'required',
        summary: '按类型/组织/gridConfig 过滤节点列表（供前端过滤器使用）',
    })
    async filter(@Query() query: NodeFilterDto) {
        return this.nodeService.filter({
            orgId: query.orgId,
            type: query.type,
            hasGrid: query.hasGrid,
            parentId: query.parentId,
        });
    }
```

### Step 5：编译验证

```bash
cd BSB-Backend
pnpm run build
```

**预期**：无错误。

### Step 6：提交

```bash
git add BSB-Backend/src/modules/node/
git commit -m "feat(node): extend DTO/Repository/Service/Controller with type, metadata, gridConfig, filter"
```

---

## Task 2：扩展 Org DTO + Repository + Service + Controller（explore / members/search）

**Files:**
- Modify: `BSB-Backend/src/modules/org/org.dto.ts`
- Modify: `BSB-Backend/src/modules/org/org.repository.ts`
- Modify: `BSB-Backend/src/modules/org/org.service.ts`
- Modify: `BSB-Backend/src/modules/org/org.controller.ts`

### Step 1：扩展 org.dto.ts

在文件末尾追加：

```typescript
const ExploreOrgDtoSchema = z
    .object({
        keyword: z.string().max(64).optional().meta({ title: '搜索关键词（可选）' }),
        limit: z.coerce.number().int().min(1).max(50).default(20).meta({ title: '每页数量' }),
        offset: z.coerce.number().int().min(0).default(0).meta({ title: '偏移量' }),
    })
    .meta({ description: '探索公开组织查询参数' });

export class ExploreOrgDto extends createZodDto(ExploreOrgDtoSchema) {}

const MemberSearchDtoSchema = z
    .object({
        orgId: z.string().min(1).meta({ title: '组织 ID' }),
        keyword: z.string().min(1).max(64).meta({ title: '搜索关键词（username 或 email）' }),
    })
    .meta({ description: '在组织内搜索成员' });

export class MemberSearchDto extends createZodDto(MemberSearchDtoSchema) {}
```

同时修改 `UpdateOrgDtoSchema`，添加 `isPublic`、`avatarUrl`、`settings` 字段：

```typescript
// 在 description 字段之后追加：
        isPublic: z.boolean().optional().meta({ title: '是否公开可见' }),
        avatarUrl: z.string().url().optional().meta({ title: '组织头像 URL' }),
        settings: z.record(z.unknown()).optional().meta({ title: '组织设置（JSON）' }),
```

### Step 2：扩展 org.repository.ts

在 `delete` 方法之后追加：

```typescript
    async explorePublic(keyword?: string, limit = 20, offset = 0) {
        return this.db.organization.findMany({
            where: {
                isPublic: true,
                ...(keyword && { name: { contains: keyword, mode: 'insensitive' } }),
            },
            take: limit,
            skip: offset,
            select: {
                id: true,
                name: true,
                description: true,
                avatarUrl: true,
                _count: { select: { members: { where: { status: 'ACTIVE' } } } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async searchMembersInOrg(orgId: string, keyword: string) {
        return this.db.organizationUser.findMany({
            where: {
                orgId,
                status: 'ACTIVE',
                user: {
                    OR: [
                        { username: { contains: keyword, mode: 'insensitive' } },
                        { email: { contains: keyword, mode: 'insensitive' } },
                    ],
                },
            },
            include: {
                user: { select: { id: true, username: true, nickname: true, email: true } },
            },
            take: 20,
        });
    }
```

同时修改 `update` 方法签名，接受新字段：

```typescript
    async update(id: string, data: {
        name?: string;
        description?: string;
        isPublic?: boolean;
        avatarUrl?: string;
        settings?: Record<string, unknown>;
    }) {
        return this.db.organization.update({ where: { id }, data: data as any });
    }
```

### Step 3：扩展 org.service.ts

在 `update` 方法之后追加：

```typescript
    async explore(keyword?: string, limit = 20, offset = 0) {
        return this.orgRepository.explorePublic(keyword, limit, offset);
    }

    async searchMembers(userId: string, orgId: string, keyword: string) {
        // 校验调用者是否为组织成员
        const membership = await this.orgRepository.findMembership(orgId, userId);
        if (!membership || membership.status !== 'ACTIVE') {
            throw new OrgNotMemberException();
        }
        return this.orgRepository.searchMembersInOrg(orgId, keyword);
    }
```

同时修改 `update` 方法，透传新字段：

```typescript
    async update(userId: string, dto: UpdateOrgDto) {
        const org = await this.orgRepository.findById(dto.orgId);
        if (!org) throw new OrgNotFoundException();
        const membership = await this.orgRepository.findMembership(dto.orgId, userId);
        if (!membership || (membership.role !== 'OWNER' && membership.role !== 'ADMIN')) {
            throw new OrgNotAdminException();
        }
        return this.orgRepository.update(dto.orgId, {
            ...(dto.name !== undefined && { name: dto.name }),
            ...(dto.description !== undefined && { description: dto.description }),
            ...((dto as any).isPublic !== undefined && { isPublic: (dto as any).isPublic }),
            ...((dto as any).avatarUrl !== undefined && { avatarUrl: (dto as any).avatarUrl }),
            ...((dto as any).settings !== undefined && { settings: (dto as any).settings }),
        });
    }
```

### Step 4：扩展 org.controller.ts

添加两个新端点（在 `update` 之后）：

```typescript
import { ExploreOrgDto, MemberSearchDto } from './org.dto.js';
// 追加到已有 import 行

    @Get('explore')
    @ApiRoute({
        auth: 'required',
        summary: '探索公开组织列表（支持分页与关键词搜索）',
    })
    async explore(@Query() query: ExploreOrgDto) {
        return this.orgService.explore(query.keyword, query.limit, query.offset);
    }

    @Get('members/search')
    @ApiRoute({
        auth: 'required',
        summary: '在组织内按 username/email 搜索成员',
        errors: [ORG_EXCEPTION.OrgNotMemberException.code],
    })
    async searchMembers(@CurrentUser() user: AccessTokenClaim, @Query() query: MemberSearchDto) {
        return this.orgService.searchMembers(user.sub, query.orgId, query.keyword);
    }
```

> `OrgNotMemberException` 已存在于 `org.exception.ts`，无需新建。

### Step 5：编译验证 + 提交

```bash
cd BSB-Backend
pnpm run build
git add BSB-Backend/src/modules/org/
git commit -m "feat(org): add explore, members/search endpoints; extend update with isPublic/avatarUrl/settings"
```

---

## Task 3：新建 ReagentTypeModule

**Files:**
- Create: `BSB-Backend/src/modules/reagent-type/reagent-type.dto.ts`
- Create: `BSB-Backend/src/modules/reagent-type/reagent-type.exception.ts`
- Create: `BSB-Backend/src/modules/reagent-type/reagent-type.repository.ts`
- Create: `BSB-Backend/src/modules/reagent-type/reagent-type.service.ts`
- Create: `BSB-Backend/src/modules/reagent-type/reagent-type.controller.ts`
- Create: `BSB-Backend/src/modules/reagent-type/reagent-type.module.ts`
- Modify: `BSB-Backend/src/modules/index.ts`
- Modify: `BSB-Backend/src/app.module.ts`

### Step 1：创建 reagent-type.dto.ts

```typescript
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod/v4';

const CreateReagentTypeDtoSchema = z
    .object({
        orgId: z.string().min(1).meta({ title: '组织 ID' }),
        name: z.string().min(1).max(128).meta({ title: '试剂类型名称', example: '青霉素' }),
        description: z.string().max(512).optional().meta({ title: '描述' }),
        colorHex: z
            .string()
            .regex(/^#[0-9a-fA-F]{6}$/)
            .optional()
            .meta({ title: '颜色（HEX）', example: '#2a9d99' }),
        unit: z.string().max(32).optional().meta({ title: '单位', example: 'mL' }),
    })
    .meta({ description: '创建试剂类型请求体' });

export class CreateReagentTypeDto extends createZodDto(CreateReagentTypeDtoSchema) {}

const UpdateReagentTypeDtoSchema = z
    .object({
        id: z.string().min(1).meta({ title: '试剂类型 ID' }),
        name: z.string().min(1).max(128).optional().meta({ title: '试剂类型名称' }),
        description: z.string().max(512).optional().meta({ title: '描述' }),
        colorHex: z
            .string()
            .regex(/^#[0-9a-fA-F]{6}$/)
            .optional()
            .meta({ title: '颜色（HEX）' }),
        unit: z.string().max(32).optional().meta({ title: '单位' }),
    })
    .meta({ description: '更新试剂类型请求体' });

export class UpdateReagentTypeDto extends createZodDto(UpdateReagentTypeDtoSchema) {}

const ReagentTypeIdDtoSchema = z
    .object({
        id: z.string().min(1).meta({ title: '试剂类型 ID' }),
    })
    .meta({ description: '试剂类型 ID 参数' });

export class ReagentTypeIdDto extends createZodDto(ReagentTypeIdDtoSchema) {}

const ListReagentTypeDtoSchema = z
    .object({
        orgId: z.string().min(1).meta({ title: '组织 ID' }),
    })
    .meta({ description: '获取组织试剂类型列表参数' });

export class ListReagentTypeDto extends createZodDto(ListReagentTypeDtoSchema) {}
```

### Step 2：创建 reagent-type.exception.ts

```typescript
import { ClientException, AuthException, RegisterException } from '@/common/exceptions/index.js';

export const ReagentTypeExceptionCode = {
    NOT_FOUND: 'REAGENT_TYPE_NOT_FOUND',
    NOT_ADMIN: 'REAGENT_TYPE_NOT_ADMIN',
} as const;

@RegisterException({
    code: ReagentTypeExceptionCode.NOT_FOUND,
    statusCode: 404,
    message: '试剂类型不存在',
    description: '指定的试剂类型 ID 未找到匹配的记录',
    retryable: false,
    logLevel: 'info',
})
export class ReagentTypeNotFoundException extends ClientException {}

@RegisterException({
    code: ReagentTypeExceptionCode.NOT_ADMIN,
    statusCode: 403,
    message: '需要管理员权限',
    description: '当前用户不是组织管理员，无权操作试剂类型',
    retryable: false,
    logLevel: 'info',
})
export class ReagentTypeNotAdminException extends AuthException {}

export default { ReagentTypeNotFoundException, ReagentTypeNotAdminException };
```

### Step 3：创建 reagent-type.repository.ts

```typescript
import { DatabaseService } from '@/infra/database/database.service.js';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ReagentTypeRepository {
    constructor(private readonly db: DatabaseService) {}

    async create(data: {
        orgId: string;
        name: string;
        description?: string;
        colorHex?: string;
        unit?: string;
    }) {
        return this.db.reagentType.create({ data: data as any });
    }

    async findById(id: string) {
        return this.db.reagentType.findUnique({ where: { id } });
    }

    async listByOrgId(orgId: string) {
        return this.db.reagentType.findMany({
            where: { orgId },
            orderBy: { createdAt: 'asc' },
        });
    }

    async update(id: string, data: { name?: string; description?: string; colorHex?: string; unit?: string }) {
        return this.db.reagentType.update({ where: { id }, data: data as any });
    }

    async delete(id: string) {
        return this.db.reagentType.delete({ where: { id } });
    }
}
```

### Step 4：创建 reagent-type.service.ts

```typescript
import {
    CreateReagentTypeDto,
    UpdateReagentTypeDto,
} from './reagent-type.dto.js';
import { ReagentTypeRepository } from './reagent-type.repository.js';
import {
    ReagentTypeNotFoundException,
    ReagentTypeNotAdminException,
} from './reagent-type.exception.js';
import { OrgRepository } from '@/modules/org/org.repository.js';
import { OrgNotFoundException } from '@/modules/org/org.exception.js';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ReagentTypeService {
    constructor(
        private readonly reagentTypeRepository: ReagentTypeRepository,
        private readonly orgRepository: OrgRepository,
    ) {}

    private async assertOrgAdmin(orgId: string, userId: string) {
        const org = await this.orgRepository.findById(orgId);
        if (!org) throw new OrgNotFoundException();
        const membership = await this.orgRepository.findMembership(orgId, userId);
        if (!membership || (membership.role !== 'OWNER' && membership.role !== 'ADMIN')) {
            throw new ReagentTypeNotAdminException();
        }
    }

    async create(userId: string, dto: CreateReagentTypeDto) {
        await this.assertOrgAdmin(dto.orgId, userId);
        return this.reagentTypeRepository.create({
            orgId: dto.orgId,
            name: dto.name,
            description: dto.description,
            colorHex: dto.colorHex,
            unit: dto.unit,
        });
    }

    async list(orgId: string) {
        return this.reagentTypeRepository.listByOrgId(orgId);
    }

    async update(userId: string, dto: UpdateReagentTypeDto) {
        const reagentType = await this.reagentTypeRepository.findById(dto.id);
        if (!reagentType) throw new ReagentTypeNotFoundException();
        await this.assertOrgAdmin(reagentType.orgId, userId);
        return this.reagentTypeRepository.update(dto.id, {
            name: dto.name,
            description: dto.description,
            colorHex: dto.colorHex,
            unit: dto.unit,
        });
    }

    async delete(userId: string, id: string) {
        const reagentType = await this.reagentTypeRepository.findById(id);
        if (!reagentType) throw new ReagentTypeNotFoundException();
        await this.assertOrgAdmin(reagentType.orgId, userId);
        await this.reagentTypeRepository.delete(id);
    }
}
```

### Step 5：创建 reagent-type.controller.ts

```typescript
import {
    CreateReagentTypeDto,
    UpdateReagentTypeDto,
    ReagentTypeIdDto,
    ListReagentTypeDto,
} from './reagent-type.dto.js';
import { ReagentTypeService } from './reagent-type.service.js';
import REAGENT_TYPE_EXCEPTION from './reagent-type.exception.js';

import { ApiRoute, CurrentUser } from '@/common/decorators/index.js';
import type { AccessTokenClaim } from '@/modules/auth/services/token.service.js';

import { Controller, Post, Delete, Get, Put, Body, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('试剂类型模块')
@Controller('reagent-type')
export class ReagentTypeController {
    constructor(private readonly reagentTypeService: ReagentTypeService) {}

    @Post('add')
    @ApiRoute({
        auth: 'required',
        summary: '创建试剂类型预设',
        errors: [REAGENT_TYPE_EXCEPTION.ReagentTypeNotAdminException.code],
    })
    async create(@CurrentUser() user: AccessTokenClaim, @Body() body: CreateReagentTypeDto) {
        return this.reagentTypeService.create(user.sub, body);
    }

    @Get('list')
    @ApiRoute({
        auth: 'required',
        summary: '获取组织内所有试剂类型',
    })
    async list(@Query() query: ListReagentTypeDto) {
        return this.reagentTypeService.list(query.orgId);
    }

    @Put('update')
    @ApiRoute({
        auth: 'required',
        summary: '更新试剂类型',
        errors: [
            REAGENT_TYPE_EXCEPTION.ReagentTypeNotFoundException.code,
            REAGENT_TYPE_EXCEPTION.ReagentTypeNotAdminException.code,
        ],
    })
    async update(@CurrentUser() user: AccessTokenClaim, @Body() body: UpdateReagentTypeDto) {
        return this.reagentTypeService.update(user.sub, body);
    }

    @Delete('del')
    @ApiRoute({
        auth: 'required',
        summary: '删除试剂类型',
        errors: [
            REAGENT_TYPE_EXCEPTION.ReagentTypeNotFoundException.code,
            REAGENT_TYPE_EXCEPTION.ReagentTypeNotAdminException.code,
        ],
    })
    async delete(
        @CurrentUser() user: AccessTokenClaim,
        @Body() body: ReagentTypeIdDto,
    ) {
        await this.reagentTypeService.delete(user.sub, body.id);
    }
}
```

### Step 6：创建 reagent-type.module.ts

```typescript
import { ReagentTypeController } from './reagent-type.controller.js';
import { ReagentTypeService } from './reagent-type.service.js';
import { ReagentTypeRepository } from './reagent-type.repository.js';
import { OrgModule } from '@/modules/org/org.module.js';
import { Module } from '@nestjs/common';

@Module({
    imports: [OrgModule],
    controllers: [ReagentTypeController],
    providers: [ReagentTypeService, ReagentTypeRepository],
    exports: [ReagentTypeService],
})
export class ReagentTypeModule {}
```

### Step 7：注册到 modules/index.ts 和 app.module.ts

在 `BSB-Backend/src/modules/index.ts` 末尾追加：

```typescript
export * from './reagent-type/reagent-type.module.js';
```

在 `BSB-Backend/src/app.module.ts` 的 imports 数组和顶部 import 中添加 `ReagentTypeModule`：

```typescript
import { ReagentTypeModule } from '@/modules/index.js';
// 在 AppModule @Module imports 数组中添加：
// ReagentTypeModule,
```

### Step 8：编译验证 + 提交

```bash
cd BSB-Backend
pnpm run build
git add BSB-Backend/src/modules/reagent-type/ BSB-Backend/src/modules/index.ts BSB-Backend/src/app.module.ts
git commit -m "feat(reagent-type): add full ReagentType module (CRUD)"
```

---

## Task 4：新建 ShareModule

**Files:**
- Create: `BSB-Backend/src/modules/share/share.dto.ts`
- Create: `BSB-Backend/src/modules/share/share.exception.ts`
- Create: `BSB-Backend/src/modules/share/share.repository.ts`
- Create: `BSB-Backend/src/modules/share/share.service.ts`
- Create: `BSB-Backend/src/modules/share/share.controller.ts`
- Create: `BSB-Backend/src/modules/share/share.module.ts`
- Modify: `BSB-Backend/src/modules/index.ts`
- Modify: `BSB-Backend/src/app.module.ts`

### Step 1：创建 share.dto.ts

```typescript
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod/v4';

const GrantShareDtoSchema = z
    .object({
        resourceType: z.enum(['NODE']).meta({ title: '资源类型' }),
        resourceId: z.string().min(1).meta({ title: '资源 ID' }),
        ownerOrgId: z.string().min(1).meta({ title: '归属组织 ID' }),
        granteeOrgId: z.string().min(1).meta({ title: '被授权组织 ID' }),
        permission: z.enum(['READ', 'WRITE']).default('READ').meta({ title: '权限级别' }),
    })
    .meta({ description: '主动授权共享请求体' });

export class GrantShareDto extends createZodDto(GrantShareDtoSchema) {}

const RequestShareDtoSchema = z
    .object({
        resourceType: z.enum(['NODE']).meta({ title: '资源类型' }),
        resourceId: z.string().min(1).meta({ title: '资源 ID' }),
        granteeOrgId: z.string().min(1).meta({ title: '申请组织 ID' }),
    })
    .meta({ description: '申请共享资源请求体' });

export class RequestShareDto extends createZodDto(RequestShareDtoSchema) {}

const RespondShareDtoSchema = z
    .object({
        shareId: z.string().min(1).meta({ title: '共享申请 ID' }),
        approve: z.boolean().meta({ title: 'true=批准, false=拒绝' }),
    })
    .meta({ description: '响应共享申请' });

export class RespondShareDto extends createZodDto(RespondShareDtoSchema) {}

const RevokeShareDtoSchema = z
    .object({
        shareId: z.string().min(1).meta({ title: '共享记录 ID' }),
    })
    .meta({ description: '撤销共享' });

export class RevokeShareDto extends createZodDto(RevokeShareDtoSchema) {}

const ShareListDtoSchema = z
    .object({
        orgId: z.string().min(1).meta({ title: '组织 ID' }),
    })
    .meta({ description: '共享列表查询参数' });

export class ShareListDto extends createZodDto(ShareListDtoSchema) {}
```

### Step 2：创建 share.exception.ts

```typescript
import { ClientException, AuthException, RegisterException } from '@/common/exceptions/index.js';

export const ShareExceptionCode = {
    NOT_FOUND: 'SHARE_NOT_FOUND',
    NOT_OWNER: 'SHARE_NOT_OWNER',
    ALREADY_EXISTS: 'SHARE_ALREADY_EXISTS',
} as const;

@RegisterException({
    code: ShareExceptionCode.NOT_FOUND,
    statusCode: 404,
    message: '共享记录不存在',
    description: '指定的共享 ID 未找到匹配的记录',
    retryable: false,
    logLevel: 'info',
})
export class ShareNotFoundException extends ClientException {}

@RegisterException({
    code: ShareExceptionCode.NOT_OWNER,
    statusCode: 403,
    message: '只有资源归属组织才能执行此操作',
    description: '当前用户所在组织不是该资源的归属组织',
    retryable: false,
    logLevel: 'info',
})
export class ShareNotOwnerException extends AuthException {}

@RegisterException({
    code: ShareExceptionCode.ALREADY_EXISTS,
    statusCode: 409,
    message: '共享关系已存在',
    description: '该资源已向目标组织共享，请勿重复操作',
    retryable: false,
    logLevel: 'info',
})
export class ShareAlreadyExistsException extends ClientException {}

export default { ShareNotFoundException, ShareNotOwnerException, ShareAlreadyExistsException };
```

### Step 3：创建 share.repository.ts

```typescript
import { DatabaseService } from '@/infra/database/database.service.js';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ShareRepository {
    constructor(private readonly db: DatabaseService) {}

    async create(data: {
        resourceType: string;
        resourceId: string;
        ownerOrgId: string;
        granteeOrgId: string;
        permission: string;
        status: string;
    }) {
        return this.db.resourceShare.create({ data: data as any });
    }

    async findById(id: string) {
        return this.db.resourceShare.findUnique({ where: { id } });
    }

    async findDuplicate(resourceId: string, ownerOrgId: string, granteeOrgId: string) {
        return this.db.resourceShare.findFirst({
            where: {
                resourceId,
                ownerOrgId,
                granteeOrgId,
                status: { not: 'REVOKED' },
            },
        });
    }

    async listOutbound(ownerOrgId: string) {
        return this.db.resourceShare.findMany({
            where: { ownerOrgId, status: { not: 'REVOKED' } },
            include: {
                granteeOrg: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async listInbound(granteeOrgId: string) {
        return this.db.resourceShare.findMany({
            where: { granteeOrgId, status: 'ACTIVE' },
            include: {
                ownerOrg: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async updateStatus(id: string, status: string) {
        return this.db.resourceShare.update({
            where: { id },
            data: { status } as any,
        });
    }
}
```

### Step 4：创建 share.service.ts

```typescript
import { GrantShareDto, RequestShareDto, RespondShareDto, RevokeShareDto } from './share.dto.js';
import { ShareRepository } from './share.repository.js';
import {
    ShareNotFoundException,
    ShareNotOwnerException,
    ShareAlreadyExistsException,
} from './share.exception.js';
import { OrgRepository } from '@/modules/org/org.repository.js';
import { OrgNotFoundException, OrgNotAdminException } from '@/modules/org/org.exception.js';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ShareService {
    constructor(
        private readonly shareRepository: ShareRepository,
        private readonly orgRepository: OrgRepository,
    ) {}

    private async assertOrgAdmin(orgId: string, userId: string) {
        const org = await this.orgRepository.findById(orgId);
        if (!org) throw new OrgNotFoundException();
        const membership = await this.orgRepository.findMembership(orgId, userId);
        if (!membership || (membership.role !== 'OWNER' && membership.role !== 'ADMIN')) {
            throw new OrgNotAdminException();
        }
    }

    async grant(userId: string, dto: GrantShareDto) {
        await this.assertOrgAdmin(dto.ownerOrgId, userId);
        const existing = await this.shareRepository.findDuplicate(
            dto.resourceId,
            dto.ownerOrgId,
            dto.granteeOrgId,
        );
        if (existing) throw new ShareAlreadyExistsException();
        return this.shareRepository.create({
            resourceType: dto.resourceType,
            resourceId: dto.resourceId,
            ownerOrgId: dto.ownerOrgId,
            granteeOrgId: dto.granteeOrgId,
            permission: dto.permission,
            status: 'ACTIVE',
        });
    }

    async request(userId: string, dto: RequestShareDto) {
        // grantee org 的管理员发起申请
        await this.assertOrgAdmin(dto.granteeOrgId, userId);
        // 查找资源归属组织（通过 Node 的 orgId）
        // 此处 ownerOrgId 由应用层从 Node 查询获得
        // 为简化实现，要求前端同时传入 ownerOrgId（通过 get /node/one 获取）
        // 本接口暂时不实现资源归属查找，改为前端传 ownerOrgId
        throw new Error('Use grant endpoint instead; request flow requires UI to provide ownerOrgId.');
    }

    async respond(userId: string, dto: RespondShareDto) {
        const share = await this.shareRepository.findById(dto.shareId);
        if (!share) throw new ShareNotFoundException();
        await this.assertOrgAdmin(share.ownerOrgId, userId);
        return this.shareRepository.updateStatus(dto.shareId, dto.approve ? 'ACTIVE' : 'REVOKED');
    }

    async revoke(userId: string, shareId: string) {
        const share = await this.shareRepository.findById(shareId);
        if (!share) throw new ShareNotFoundException();
        await this.assertOrgAdmin(share.ownerOrgId, userId);
        return this.shareRepository.updateStatus(shareId, 'REVOKED');
    }

    async listOutbound(orgId: string) {
        return this.shareRepository.listOutbound(orgId);
    }

    async listInbound(orgId: string) {
        return this.shareRepository.listInbound(orgId);
    }
}
```

### Step 5：创建 share.controller.ts

```typescript
import {
    GrantShareDto,
    RespondShareDto,
    RevokeShareDto,
    ShareListDto,
} from './share.dto.js';
import { ShareService } from './share.service.js';
import SHARE_EXCEPTION from './share.exception.js';
import ORG_EXCEPTION from '@/modules/org/org.exception.js';

import { ApiRoute, CurrentUser } from '@/common/decorators/index.js';
import type { AccessTokenClaim } from '@/modules/auth/services/token.service.js';

import { Controller, Post, Delete, Get, Put, Body, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('资源共享模块')
@Controller('share')
export class ShareController {
    constructor(private readonly shareService: ShareService) {}

    @Post('grant')
    @ApiRoute({
        auth: 'required',
        summary: '主动授权：归属组织将资源共享给目标组织',
        errors: [
            ORG_EXCEPTION.OrgNotAdminException.code,
            SHARE_EXCEPTION.ShareAlreadyExistsException.code,
        ],
    })
    async grant(@CurrentUser() user: AccessTokenClaim, @Body() body: GrantShareDto) {
        return this.shareService.grant(user.sub, body);
    }

    @Put('respond')
    @ApiRoute({
        auth: 'required',
        summary: '响应共享申请（批准或拒绝）',
        errors: [
            SHARE_EXCEPTION.ShareNotFoundException.code,
            SHARE_EXCEPTION.ShareNotOwnerException.code,
        ],
    })
    async respond(@CurrentUser() user: AccessTokenClaim, @Body() body: RespondShareDto) {
        return this.shareService.respond(user.sub, body);
    }

    @Delete('revoke')
    @ApiRoute({
        auth: 'required',
        summary: '撤销共享',
        errors: [
            SHARE_EXCEPTION.ShareNotFoundException.code,
            SHARE_EXCEPTION.ShareNotOwnerException.code,
        ],
    })
    async revoke(@CurrentUser() user: AccessTokenClaim, @Body() body: RevokeShareDto) {
        await this.shareService.revoke(user.sub, body.shareId);
    }

    @Get('outbound')
    @ApiRoute({
        auth: 'required',
        summary: '获取我的组织已共享出去的资源列表',
    })
    async listOutbound(@Query() query: ShareListDto) {
        return this.shareService.listOutbound(query.orgId);
    }

    @Get('inbound')
    @ApiRoute({
        auth: 'required',
        summary: '获取我的组织获得的共享资源列表',
    })
    async listInbound(@Query() query: ShareListDto) {
        return this.shareService.listInbound(query.orgId);
    }
}
```

### Step 6：创建 share.module.ts

```typescript
import { ShareController } from './share.controller.js';
import { ShareService } from './share.service.js';
import { ShareRepository } from './share.repository.js';
import { OrgModule } from '@/modules/org/org.module.js';
import { Module } from '@nestjs/common';

@Module({
    imports: [OrgModule],
    controllers: [ShareController],
    providers: [ShareService, ShareRepository],
    exports: [ShareService],
})
export class ShareModule {}
```

### Step 7：注册模块

`BSB-Backend/src/modules/index.ts` 末尾追加：

```typescript
export * from './share/share.module.js';
```

`BSB-Backend/src/app.module.ts` 中添加 `ShareModule`（同 ReagentTypeModule 方式）。

### Step 8：编译验证 + 提交

```bash
cd BSB-Backend
pnpm run build
git add BSB-Backend/src/modules/share/ BSB-Backend/src/modules/index.ts BSB-Backend/src/app.module.ts
git commit -m "feat(share): add full ResourceShare module (grant/respond/revoke/list)"
```

---

## Task 5：E2E 测试

**Files:**
- Create: `BSB-Backend/test/e2e/reagent-type.e2e-spec.ts`
- Create: `BSB-Backend/test/e2e/share.e2e-spec.ts`
- Create: `BSB-Backend/test/e2e/node-extensions.e2e-spec.ts`

### Step 1：创建 node-extensions.e2e-spec.ts

```typescript
// BSB-Backend/test/e2e/node-extensions.e2e-spec.ts
import { setupE2EApp, getAdminToken, createTestOrg } from './helpers.js';
import * as request from 'supertest';

describe('Node Extensions (E2E)', () => {
    let app: any;
    let token: string;
    let orgId: string;
    let nodeId: string;

    beforeAll(async () => {
        app = await setupE2EApp();
        token = await getAdminToken(app);
        orgId = await createTestOrg(app, token);
    });

    afterAll(async () => await app.close());

    it('POST /node/add — should create node with type ROOM', async () => {
        const res = await request(app.getHttpServer())
            .post('/node/add')
            .set('Authorization', `Bearer ${token}`)
            .send({ orgId, name: 'Test Room', type: 'ROOM' })
            .expect(201);
        expect(res.body.data.type).toBe('ROOM');
        nodeId = res.body.data.id;
    });

    it('POST /node/grid/set — should set gridConfig', async () => {
        const res = await request(app.getHttpServer())
            .post('/node/grid/set')
            .set('Authorization', `Bearer ${token}`)
            .send({ nodeId, rows: 9, cols: 9 })
            .expect(201);
        expect(res.body.data.rows).toBe(9);
    });

    it('GET /node/filter — should filter by type', async () => {
        const res = await request(app.getHttpServer())
            .get(`/node/filter?orgId=${orgId}&type=ROOM`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200);
        expect(res.body.data.length).toBeGreaterThan(0);
        expect(res.body.data[0].type).toBe('ROOM');
    });

    it('GET /node/filter — should filter by hasGrid=true', async () => {
        const res = await request(app.getHttpServer())
            .get(`/node/filter?orgId=${orgId}&hasGrid=true`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200);
        expect(res.body.data.every((n: any) => n.gridConfig !== null)).toBe(true);
    });

    it('DELETE /node/grid/remove — should remove gridConfig', async () => {
        await request(app.getHttpServer())
            .delete('/node/grid/remove')
            .set('Authorization', `Bearer ${token}`)
            .send({ nodeId })
            .expect(200);
    });
});
```

### Step 2：创建 reagent-type.e2e-spec.ts

```typescript
// BSB-Backend/test/e2e/reagent-type.e2e-spec.ts
import { setupE2EApp, getAdminToken, createTestOrg } from './helpers.js';
import * as request from 'supertest';

describe('ReagentType (E2E)', () => {
    let app: any;
    let token: string;
    let orgId: string;
    let reagentTypeId: string;

    beforeAll(async () => {
        app = await setupE2EApp();
        token = await getAdminToken(app);
        orgId = await createTestOrg(app, token);
    });

    afterAll(async () => await app.close());

    it('POST /reagent-type/add — should create reagent type', async () => {
        const res = await request(app.getHttpServer())
            .post('/reagent-type/add')
            .set('Authorization', `Bearer ${token}`)
            .send({ orgId, name: '青霉素', colorHex: '#2a9d99', unit: 'mL' })
            .expect(201);
        expect(res.body.data.name).toBe('青霉素');
        reagentTypeId = res.body.data.id;
    });

    it('GET /reagent-type/list — should list reagent types', async () => {
        const res = await request(app.getHttpServer())
            .get(`/reagent-type/list?orgId=${orgId}`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200);
        expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('PUT /reagent-type/update — should update reagent type', async () => {
        const res = await request(app.getHttpServer())
            .put('/reagent-type/update')
            .set('Authorization', `Bearer ${token}`)
            .send({ id: reagentTypeId, colorHex: '#0075de' })
            .expect(200);
        expect(res.body.data.colorHex).toBe('#0075de');
    });

    it('DELETE /reagent-type/del — should delete reagent type', async () => {
        await request(app.getHttpServer())
            .delete('/reagent-type/del')
            .set('Authorization', `Bearer ${token}`)
            .send({ id: reagentTypeId })
            .expect(200);
    });
});
```

> **注意**：若 `helpers.ts` 不存在，需查看已有 E2E 测试的 setup 模式（`BSB-Backend/test/e2e/` 目录下），复用已有的 helper/setup 函数。

### Step 3：运行 E2E 测试

```bash
cd BSB-Backend
pnpm test:e2e
```

**预期**：新增测试全部通过，已有测试无回归。

### Step 4：提交

```bash
git add BSB-Backend/test/e2e/
git commit -m "test(e2e): add E2E tests for node-extensions, reagent-type, share modules"
```

---

## Task 6：最终验证

### Step 1：全量测试

```bash
cd BSB-Backend
pnpm test
pnpm run build
pnpm run lint:fix
pnpm run format
```

**全部通过则 P2 完成。**

### Step 2：提交门槛自查

- [ ] `pnpm run build` 无错误
- [ ] `pnpm test` 全部通过
- [ ] `pnpm run lint:fix` 无残留错误
- [ ] 所有新模块均有 E2E 测试
- [ ] 所有提交信息符合 Conventional Commits 规范

---

## P2 完成后

移交 P3：[docs/plans/2026-04-15-phase-3-frontend-org.md](./2026-04-15-phase-3-frontend-org.md)
