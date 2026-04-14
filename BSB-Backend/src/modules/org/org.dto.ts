import { createZodDto } from 'nestjs-zod';
import { z } from 'zod/v4';

// ── Org DTOs ──────────────────────────────────────────────

const CreateOrgDtoSchema = z
    .object({
        name: z.string().min(1).max(128).meta({ title: '组织名称', example: '实验室 A' }),
        description: z.string().max(512).optional().meta({ title: '描述' }),
    })
    .meta({ description: '创建组织请求体' });

export class CreateOrgDto extends createZodDto(CreateOrgDtoSchema) {}

const UpdateOrgDtoSchema = z
    .object({
        orgId: z.string().min(1).meta({ title: '组织 ID' }),
        name: z.string().min(1).max(128).optional().meta({ title: '组织名称' }),
        description: z.string().max(512).optional().meta({ title: '描述' }),
    })
    .meta({ description: '更新组织请求体' });

export class UpdateOrgDto extends createZodDto(UpdateOrgDtoSchema) {}

const OrgIdDtoSchema = z
    .object({
        orgId: z.string().min(1).meta({ title: '组织 ID' }),
    })
    .meta({ description: '组织 ID 参数' });

export class OrgIdDto extends createZodDto(OrgIdDtoSchema) {}

const SearchOrgDtoSchema = z
    .object({
        keyword: z.string().min(1).max(64).meta({ title: '搜索关键词' }),
        limit: z.coerce.number().int().min(1).max(50).default(10).meta({ title: '返回数量' }),
    })
    .meta({ description: '搜索组织查询参数' });

export class SearchOrgDto extends createZodDto(SearchOrgDtoSchema) {}

// ── Org User DTOs ─────────────────────────────────────────

const OrgUserActionDtoSchema = z
    .object({
        orgId: z.string().min(1).meta({ title: '组织 ID' }),
        userId: z.string().min(1).meta({ title: '用户 ID' }),
    })
    .meta({ description: '组织成员操作请求体' });

export class OrgUserActionDto extends createZodDto(OrgUserActionDtoSchema) {}

const UpdateAuthorityDtoSchema = z
    .object({
        orgId: z.string().min(1).meta({ title: '组织 ID' }),
        userId: z.string().min(1).meta({ title: '用户 ID' }),
        role: z.enum(['ADMIN', 'MEMBER']).meta({ title: '新角色' }),
    })
    .meta({ description: '修改成员权限请求体' });

export class UpdateAuthorityDto extends createZodDto(UpdateAuthorityDtoSchema) {}

const OrgUserListDtoSchema = z
    .object({
        orgId: z.string().min(1).meta({ title: '组织 ID' }),
    })
    .meta({ description: '组织成员列表查询参数' });

export class OrgUserListDto extends createZodDto(OrgUserListDtoSchema) {}
