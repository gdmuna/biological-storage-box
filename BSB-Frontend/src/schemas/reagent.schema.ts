import { z } from 'zod/v4';

export const HazardLevelEnum = z.enum([
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

export type HazardLevel = z.infer<typeof HazardLevelEnum>;

export const ReagentSchema = z.object({
    id: z.string(),
    nodeId: z.string().nullable().optional(),
    orgId: z.string(),
    position: z.string(),
    name: z.string(),
    description: z.string().nullable().optional(),
    reagentTypeId: z.string().nullable().optional(),
    // P0 新增字段
    quantity: z.number().nullable().optional(),
    unit: z.string().nullable().optional(),
    expiryDate: z.string().nullable().optional(),
    manufactureDate: z.string().nullable().optional(),
    batchNo: z.string().nullable().optional(),
    catalogNo: z.string().nullable().optional(),
    manufacturer: z.string().nullable().optional(),
    casNumber: z.string().nullable().optional(),
    storageCondition: z.record(z.string(), z.unknown()).nullable().optional(),
    hazardLevel: HazardLevelEnum.nullable().optional(),
    minStockThreshold: z.number().nullable().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
});

export type Reagent = z.infer<typeof ReagentSchema>;

export const CreateReagentSchema = z.object({
    nodeId: z.string().min(1, '请选择储存盒'),
    position: z
        .string()
        .min(1, '请输入位置')
        .regex(/^\d+-\d+$/, '位置格式应为 行-列，例如 1-1'),
    name: z.string().min(1, '请输入试剂名称').max(128),
    description: z.string().max(512).optional(),
    reagentTypeId: z.string().nullable().optional(),
    quantity: z.number().nonnegative('数量不能为负数').optional(),
    unit: z.string().max(32).optional(),
    expiryDate: z.string().optional(),
    manufactureDate: z.string().optional(),
    batchNo: z.string().max(64).optional(),
    catalogNo: z.string().max(64).optional(),
    manufacturer: z.string().max(128).optional(),
    casNumber: z.string().max(32).optional(),
    storageCondition: z.record(z.string(), z.unknown()).optional(),
    hazardLevel: HazardLevelEnum.optional(),
    minStockThreshold: z.number().nonnegative('阈值不能为负数').optional(),
});

export type CreateReagentInput = z.infer<typeof CreateReagentSchema>;

export const UpdateReagentSchema = z.object({
    id: z.string().min(1),
    position: z.string().min(1).max(10).optional(),
    name: z.string().min(1).max(128).optional(),
    description: z.string().max(512).optional(),
    reagentTypeId: z.string().nullable().optional(),
    quantity: z.number().nonnegative().nullable().optional(),
    unit: z.string().max(32).nullable().optional(),
    expiryDate: z.string().nullable().optional(),
    manufactureDate: z.string().nullable().optional(),
    batchNo: z.string().max(64).nullable().optional(),
    catalogNo: z.string().max(64).nullable().optional(),
    manufacturer: z.string().max(128).nullable().optional(),
    casNumber: z.string().max(32).nullable().optional(),
    storageCondition: z.record(z.string(), z.unknown()).nullable().optional(),
    hazardLevel: HazardLevelEnum.nullable().optional(),
    minStockThreshold: z.number().nonnegative().nullable().optional(),
});

export type UpdateReagentInput = z.infer<typeof UpdateReagentSchema>;
