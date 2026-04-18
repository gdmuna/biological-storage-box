import { createZodDto } from 'nestjs-zod';
import { z } from 'zod/v4';

const ReagentIdDtoSchema = z
    .object({
        id: z.string().min(1).meta({ title: 'Reagent ID' }),
    })
    .meta({ description: 'Reagent ID 参数' });

export class ReagentIdDto extends createZodDto(ReagentIdDtoSchema) {}

const ReagentListDtoSchema = z
    .object({
        orgId: z.string().min(1).optional().meta({ title: 'Organization ID' }),
        nodeId: z.string().min(1).optional().meta({ title: 'Box ID' }),
    })
    .meta({ description: '试剂列表查询参数' })
    .refine((data) => !!(data.orgId || data.nodeId), {
        message: 'orgId 或 nodeId 至少提供一个',
    });

export class ReagentListDto extends createZodDto(ReagentListDtoSchema) {}

const UpdateReagentDtoSchema = z
    .object({
        id: z.string().min(1).meta({ title: 'Reagent ID' }),
        position: z.string().min(1).max(10).optional().meta({ title: '位置', example: 'A1' }),
        name: z.string().min(1).max(128).optional().meta({ title: '名称' }),
        description: z.string().max(512).optional().meta({ title: '描述' }),
        reagentTypeId: z.string().nullable().optional().meta({ title: '试剂类型 ID' }),
    })
    .meta({ description: '更新试剂请求体' });

export class UpdateReagentDto extends createZodDto(UpdateReagentDtoSchema) {}

const CreateReagentDtoSchema = z
    .object({
        nodeId: z.string().min(1).meta({ title: 'Box ID' }),
        position: z
            .string()
            .min(1)
            .max(10)
            .regex(/^\d+-\d+$/, '位置格式应为 row-col，例如 1-3')
            .meta({ title: '位置', example: '1-3' }),
        name: z.string().min(1).max(128).meta({ title: '试剂名称' }),
        description: z.string().max(512).optional().meta({ title: '描述' }),
        reagentTypeId: z.string().nullable().optional().meta({ title: '试剂类型 ID' }),
    })
    .meta({ description: '新增试剂请求体' });

export class CreateReagentDto extends createZodDto(CreateReagentDtoSchema) {}

// ── 响应 VO ───────────────────────────────────────────────

const ReagentVoSchema = z
    .object({
        id: z.string().meta({ title: 'Reagent ID' }),
        nodeId: z.string().nullable().optional().meta({ title: 'Box ID' }),
        orgId: z.string().meta({ title: '组织 ID' }),
        position: z.string().meta({ title: '位置', example: '1-3' }),
        name: z.string().meta({ title: '试剂名称' }),
        description: z.string().nullable().optional().meta({ title: '描述' }),
        reagentTypeId: z.string().nullable().optional().meta({ title: '试剂类型 ID' }),
        createdAt: z.string().meta({ title: '创建时间' }),
        updatedAt: z.string().meta({ title: '更新时间' }),
    })
    .meta({ description: '试剂信息' });

export class ReagentVo extends createZodDto(ReagentVoSchema) {}

const DeleteReagentResultVoSchema = z
    .object({
        count: z.number().int().meta({ title: '删除数量' }),
    })
    .meta({ description: '删除试剂结果' });

export class DeleteReagentResultVo extends createZodDto(DeleteReagentResultVoSchema) {}
