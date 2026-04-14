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
