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
        type: z
            .enum(['ROOT', 'CONTAINER', 'BOX', 'BOX_SLOT'])
            .optional()
            .meta({ title: '节点类型' }),
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

// ── 响应 VO ───────────────────────────────────────────────

const NodeGridConfigVoSchema = z
    .object({
        id: z.string().meta({ title: 'GridConfig ID' }),
        nodeId: z.string().meta({ title: 'Node ID' }),
        rows: z.number().int().meta({ title: '行数' }),
        cols: z.number().int().meta({ title: '列数' }),
    })
    .meta({ description: '节点网格配置' });

export class NodeGridConfigVo extends createZodDto(NodeGridConfigVoSchema) {}

const NodeVoSchema = z
    .object({
        id: z.string().meta({ title: 'Node ID' }),
        orgId: z.string().meta({ title: '组织 ID' }),
        parentId: z.string().nullable().optional().meta({ title: '父节点 ID' }),
        name: z.string().meta({ title: '节点名称' }),
        description: z.string().nullable().optional().meta({ title: '描述' }),
        type: z.enum(['ROOT', 'CONTAINER', 'BOX', 'BOX_SLOT']).meta({ title: '节点类型' }),
        metadata: z
            .record(z.string(), z.unknown())
            .nullable()
            .optional()
            .meta({ title: '自定义属性' }),
        createdAt: z.string().meta({ title: '创建时间' }),
        updatedAt: z.string().meta({ title: '更新时间' }),
        gridConfig: NodeGridConfigVoSchema.nullable().optional().meta({ title: '网格配置' }),
    })
    .meta({ description: '节点信息' });

export class NodeVo extends createZodDto(NodeVoSchema) {}
