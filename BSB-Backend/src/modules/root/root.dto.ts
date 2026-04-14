import { createZodDto } from 'nestjs-zod';
import { z } from 'zod/v4';

const CreateRootDtoSchema = z
    .object({
        orgId: z.string().min(1).meta({ title: '组织 ID' }),
        name: z.string().min(1).max(128).meta({ title: '名称', example: '冷冻室 A' }),
        description: z.string().max(512).optional().meta({ title: '描述' }),
    })
    .meta({ description: '创建房间/位置请求体' });

export class CreateRootDto extends createZodDto(CreateRootDtoSchema) {}

const UpdateRootDtoSchema = z
    .object({
        id: z.string().min(1).meta({ title: 'Root ID' }),
        name: z.string().min(1).max(128).optional().meta({ title: '名称' }),
        description: z.string().max(512).optional().meta({ title: '描述' }),
    })
    .meta({ description: '更新房间/位置请求体' });

export class UpdateRootDto extends createZodDto(UpdateRootDtoSchema) {}

const RootIdDtoSchema = z
    .object({
        id: z.string().min(1).meta({ title: 'Root ID' }),
    })
    .meta({ description: 'Root ID 参数' });

export class RootIdDto extends createZodDto(RootIdDtoSchema) {}

const RootListDtoSchema = z
    .object({
        orgId: z.string().min(1).meta({ title: '组织 ID' }),
    })
    .meta({ description: '房间列表查询参数' });

export class RootListDto extends createZodDto(RootListDtoSchema) {}
