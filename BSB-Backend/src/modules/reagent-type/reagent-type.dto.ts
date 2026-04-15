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
