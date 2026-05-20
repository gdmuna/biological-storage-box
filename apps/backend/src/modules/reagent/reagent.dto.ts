import { createZodDto } from 'nestjs-zod';
import { z } from 'zod/v4';

const HazardLevelEnum = z.enum([
    'NONE',
    'GHS01',
    'GHS02',
    'GHS03',
    'GHS04',
    'GHS05',
    'GHS06',
    'GHS07',
    'GHS08',
    'GHS09',
]);

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
        quantity: z.number().nonnegative().nullable().optional().meta({ title: '库存数量' }),
        unit: z.string().max(32).nullable().optional().meta({ title: '单位' }),
        expiryDate: z.string().datetime().nullable().optional().meta({ title: '有效期' }),
        manufactureDate: z.string().datetime().nullable().optional().meta({ title: '生产日期' }),
        batchNo: z.string().max(64).nullable().optional().meta({ title: '批次号' }),
        catalogNo: z.string().max(64).nullable().optional().meta({ title: '货号' }),
        manufacturer: z.string().max(128).nullable().optional().meta({ title: '生产厂商' }),
        casNumber: z.string().max(32).nullable().optional().meta({ title: 'CAS 号' }),
        storageCondition: z
            .record(z.string(), z.unknown())
            .nullable()
            .optional()
            .meta({ title: '储存条件' }),
        hazardLevel: HazardLevelEnum.nullable().optional().meta({ title: 'GHS 危险类别' }),
        minStockThreshold: z
            .number()
            .nonnegative()
            .nullable()
            .optional()
            .meta({ title: '低库存预警阈值' }),
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
        quantity: z.number().nonnegative().optional().meta({ title: '库存数量' }),
        unit: z.string().max(32).optional().meta({ title: '单位' }),
        expiryDate: z.string().datetime().optional().meta({ title: '有效期' }),
        manufactureDate: z.string().datetime().optional().meta({ title: '生产日期' }),
        batchNo: z.string().max(64).optional().meta({ title: '批次号' }),
        catalogNo: z.string().max(64).optional().meta({ title: '货号' }),
        manufacturer: z.string().max(128).optional().meta({ title: '生产厂商' }),
        casNumber: z.string().max(32).optional().meta({ title: 'CAS 号' }),
        storageCondition: z.record(z.string(), z.unknown()).optional().meta({ title: '储存条件' }),
        hazardLevel: HazardLevelEnum.optional().meta({ title: 'GHS 危险类别' }),
        minStockThreshold: z.number().nonnegative().optional().meta({ title: '低库存预警阈值' }),
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
        quantity: z.number().nullable().optional().meta({ title: '库存数量' }),
        unit: z.string().nullable().optional().meta({ title: '单位' }),
        expiryDate: z.string().nullable().optional().meta({ title: '有效期' }),
        manufactureDate: z.string().nullable().optional().meta({ title: '生产日期' }),
        batchNo: z.string().nullable().optional().meta({ title: '批次号' }),
        catalogNo: z.string().nullable().optional().meta({ title: '货号' }),
        manufacturer: z.string().nullable().optional().meta({ title: '生产厂商' }),
        casNumber: z.string().nullable().optional().meta({ title: 'CAS 号' }),
        storageCondition: z
            .record(z.string(), z.unknown())
            .nullable()
            .optional()
            .meta({ title: '储存条件' }),
        hazardLevel: HazardLevelEnum.nullable().optional().meta({ title: 'GHS 危险类别' }),
        minStockThreshold: z.number().nullable().optional().meta({ title: '低库存预警阈值' }),
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
