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
        boxId: z.string().min(1).meta({ title: 'Box ID' }),
    })
    .meta({ description: '试剂列表查询参数' });

export class ReagentListDto extends createZodDto(ReagentListDtoSchema) {}

const UpdateReagentDtoSchema = z
    .object({
        id: z.string().min(1).meta({ title: 'Reagent ID' }),
        position: z.string().min(1).max(10).optional().meta({ title: '位置', example: 'A1' }),
        name: z.string().min(1).max(128).optional().meta({ title: '名称' }),
        description: z.string().max(512).optional().meta({ title: '描述' }),
    })
    .meta({ description: '更新试剂请求体' });

export class UpdateReagentDto extends createZodDto(UpdateReagentDtoSchema) {}

const CreateReagentDtoSchema = z
    .object({
        boxId: z.string().min(1).meta({ title: 'Box ID' }),
        position: z
            .string()
            .min(1)
            .max(10)
            .regex(/^\d+-\d+$/, '位置格式应为 row-col，例如 1-3')
            .meta({ title: '位置', example: '1-3' }),
        name: z.string().min(1).max(128).meta({ title: '试剂名称' }),
        description: z.string().max(512).optional().meta({ title: '描述' }),
        reagentTypeId: z.string().optional().meta({ title: '试剂类型 ID' }),
    })
    .meta({ description: '新增试剂请求体' });

export class CreateReagentDto extends createZodDto(CreateReagentDtoSchema) {}
