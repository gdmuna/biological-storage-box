import { createZodDto } from 'nestjs-zod';
import { z } from 'zod/v4';

// ── Box ────────────────────────────────────────────

const CreateBoxDtoSchema = z
    .object({
        orgId: z.string().min(1).meta({ title: '组织 ID' }),
        rootId: z.string().optional().meta({ title: 'Root ID' }),
        name: z.string().min(1).max(128).meta({ title: '名称', example: '样本盒 A-01' }),
        description: z.string().max(512).optional().meta({ title: '描述' }),
        rows: z.number().int().min(1).max(99).default(9).meta({ title: '行数' }),
        cols: z.number().int().min(1).max(99).default(9).meta({ title: '列数' }),
    })
    .meta({ description: '创建储存盒请求体' });

export class CreateBoxDto extends createZodDto(CreateBoxDtoSchema) {}

const UpdateBoxDtoSchema = z
    .object({
        id: z.string().min(1).meta({ title: 'Box ID' }),
        rootId: z.string().optional().nullable().meta({ title: 'Root ID' }),
        name: z.string().min(1).max(128).optional().meta({ title: '名称' }),
        description: z.string().max(512).optional().meta({ title: '描述' }),
    })
    .meta({ description: '更新储存盒请求体' });

export class UpdateBoxDto extends createZodDto(UpdateBoxDtoSchema) {}

const BoxIdDtoSchema = z
    .object({
        id: z.string().min(1).meta({ title: 'Box ID' }),
    })
    .meta({ description: 'Box ID 参数' });

export class BoxIdDto extends createZodDto(BoxIdDtoSchema) {}

const BoxListDtoSchema = z
    .object({
        orgId: z.string().min(1).meta({ title: '组织 ID' }),
    })
    .meta({ description: '储存盒列表查询参数' });

export class BoxListDto extends createZodDto(BoxListDtoSchema) {}

const BoxSearchDtoSchema = z
    .object({
        orgId: z.string().min(1).meta({ title: '组织 ID' }),
        keyword: z.string().min(1).meta({ title: '搜索关键词' }),
        limit: z.coerce.number().int().min(1).max(100).default(20).meta({ title: '数量上限' }),
    })
    .meta({ description: '搜索储存盒查询参数' });

export class BoxSearchDto extends createZodDto(BoxSearchDtoSchema) {}

const BoxRootListDtoSchema = z
    .object({
        orgId: z.string().min(1).meta({ title: '组织 ID' }),
    })
    .meta({ description: '按 Root 分组的储存盒列表查询参数' });

export class BoxRootListDto extends createZodDto(BoxRootListDtoSchema) {}

// ── BoxAlias ───────────────────────────────────────

const CreateBoxAliasDtoSchema = z
    .object({
        boxId: z.string().min(1).meta({ title: 'Box ID' }),
        alias: z.string().min(1).max(128).meta({ title: '别名' }),
    })
    .meta({ description: '创建储存盒别名请求体' });

export class CreateBoxAliasDto extends createZodDto(CreateBoxAliasDtoSchema) {}

const UpdateBoxAliasDtoSchema = z
    .object({
        id: z.string().min(1).meta({ title: 'Alias ID' }),
        alias: z.string().min(1).max(128).meta({ title: '别名' }),
    })
    .meta({ description: '更新储存盒别名请求体' });

export class UpdateBoxAliasDto extends createZodDto(UpdateBoxAliasDtoSchema) {}

const BoxAliasIdDtoSchema = z
    .object({
        id: z.string().min(1).meta({ title: 'Alias ID' }),
    })
    .meta({ description: 'Alias ID 参数' });

export class BoxAliasIdDto extends createZodDto(BoxAliasIdDtoSchema) {}

const BoxAliasListDtoSchema = z
    .object({
        boxId: z.string().min(1).meta({ title: 'Box ID' }),
    })
    .meta({ description: '储存盒别名列表查询参数' });

export class BoxAliasListDto extends createZodDto(BoxAliasListDtoSchema) {}

// ── BoxImage ───────────────────────────────────────

const CreateBoxImageDtoSchema = z
    .object({
        boxId: z.string().min(1).meta({ title: 'Box ID' }),
        imageUrl: z.string().url().meta({ title: '图片 URL' }),
    })
    .meta({ description: '创建储存盒图片请求体' });

export class CreateBoxImageDto extends createZodDto(CreateBoxImageDtoSchema) {}

const BoxImageIdDtoSchema = z
    .object({
        id: z.string().min(1).meta({ title: 'Image ID' }),
    })
    .meta({ description: 'Image ID 参数' });

export class BoxImageIdDto extends createZodDto(BoxImageIdDtoSchema) {}

const BoxImageListDtoSchema = z
    .object({
        boxId: z.string().min(1).meta({ title: 'Box ID' }),
    })
    .meta({ description: '储存盒图片列表查询参数' });

export class BoxImageListDto extends createZodDto(BoxImageListDtoSchema) {}

const BoxImageCompareDtoSchema = z
    .object({
        boxId: z.string().min(1).meta({ title: 'Box ID' }),
        imageUrl: z.string().url().meta({ title: '待比对图片 URL' }),
    })
    .meta({ description: '储存盒图片比对请求体' });

export class BoxImageCompareDto extends createZodDto(BoxImageCompareDtoSchema) {}
