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
        isPublic: z.boolean().optional().meta({ title: '是否公开可见' }),
        avatarUrl: z.string().url().optional().meta({ title: '组织头像 URL' }),
        settings: z.record(z.string(), z.unknown()).optional().meta({ title: '组织设置（JSON）' }),
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

const ExploreOrgDtoSchema = z
    .object({
        keyword: z.string().max(64).optional().meta({ title: '搜索关键词（可选）' }),
        limit: z.coerce.number().int().min(1).max(50).default(20).meta({ title: '每页数量' }),
        offset: z.coerce.number().int().min(0).default(0).meta({ title: '偏移量' }),
    })
    .meta({ description: '探索公开组织查询参数' });

export class ExploreOrgDto extends createZodDto(ExploreOrgDtoSchema) {}

const MemberSearchDtoSchema = z
    .object({
        orgId: z.string().min(1).meta({ title: '组织 ID' }),
        keyword: z.string().min(1).max(64).meta({ title: '搜索关键词（username 或 email）' }),
    })
    .meta({ description: '在组织内搜索成员' });

export class MemberSearchDto extends createZodDto(MemberSearchDtoSchema) {}

// ── 响应 VO ───────────────────────────────────────────────

const OrgVoSchema = z
    .object({
        id: z.string().meta({ title: '组织 ID' }),
        name: z.string().meta({ title: '组织名称' }),
        description: z.string().nullable().optional().meta({ title: '描述' }),
        ownerId: z.string().meta({ title: '创建者 ID' }),
        isPublic: z.boolean().meta({ title: '是否公开' }),
        avatarUrl: z.string().nullable().optional().meta({ title: '头像 URL' }),
        settings: z.record(z.string(), z.unknown()).nullable().optional().meta({ title: '设置' }),
        createdAt: z.string().meta({ title: '创建时间' }),
        updatedAt: z.string().meta({ title: '更新时间' }),
    })
    .meta({ description: '组织信息' });

export class OrgVo extends createZodDto(OrgVoSchema) {}

const OrgDetailVoSchema = z
    .object({
        id: z.string().meta({ title: '组织 ID' }),
        name: z.string().meta({ title: '组织名称' }),
        description: z.string().nullable().optional().meta({ title: '描述' }),
        ownerId: z.string().meta({ title: '创建者 ID' }),
        isPublic: z.boolean().meta({ title: '是否公开' }),
        avatarUrl: z.string().nullable().optional().meta({ title: '头像 URL' }),
        settings: z.record(z.string(), z.unknown()).nullable().optional().meta({ title: '设置' }),
        createdAt: z.string().meta({ title: '创建时间' }),
        updatedAt: z.string().meta({ title: '更新时间' }),
        owner: z
            .object({
                id: z.string(),
                username: z.string(),
                nickname: z.string().nullable().optional(),
            })
            .meta({ title: '所有者信息' }),
    })
    .meta({ description: '组织详情（含所有者）' });

export class OrgDetailVo extends createZodDto(OrgDetailVoSchema) {}

const OrgListItemVoSchema = z
    .object({
        id: z.string().meta({ title: '组织 ID' }),
        name: z.string().meta({ title: '组织名称' }),
        description: z.string().nullable().optional().meta({ title: '描述' }),
        ownerId: z.string().meta({ title: '创建者 ID' }),
        isPublic: z.boolean().meta({ title: '是否公开' }),
        avatarUrl: z.string().nullable().optional().meta({ title: '头像 URL' }),
        settings: z.record(z.string(), z.unknown()).nullable().optional().meta({ title: '设置' }),
        createdAt: z.string().meta({ title: '创建时间' }),
        updatedAt: z.string().meta({ title: '更新时间' }),
        _count: z.object({ members: z.number().int().meta({ title: '成员数' }) }),
    })
    .meta({ description: '组织列表项（含成员数）' });

export class OrgListItemVo extends createZodDto(OrgListItemVoSchema) {}

const OrgSearchResultVoSchema = z
    .object({
        id: z.string().meta({ title: '组织 ID' }),
        name: z.string().meta({ title: '组织名称' }),
        description: z.string().nullable().optional().meta({ title: '描述' }),
    })
    .meta({ description: '组织搜索结果' });

export class OrgSearchResultVo extends createZodDto(OrgSearchResultVoSchema) {}

const OrgExploreItemVoSchema = z
    .object({
        id: z.string().meta({ title: '组织 ID' }),
        name: z.string().meta({ title: '组织名称' }),
        description: z.string().nullable().optional().meta({ title: '描述' }),
        avatarUrl: z.string().nullable().optional().meta({ title: '头像 URL' }),
        _count: z.object({ members: z.number().int().meta({ title: '成员数' }) }),
    })
    .meta({ description: '公开组织探索结果' });

export class OrgExploreItemVo extends createZodDto(OrgExploreItemVoSchema) {}

const OrgMembershipVoSchema = z
    .object({
        id: z.string().meta({ title: '成员记录 ID' }),
        orgId: z.string().meta({ title: '组织 ID' }),
        userId: z.string().meta({ title: '用户 ID' }),
        role: z.enum(['OWNER', 'ADMIN', 'MEMBER']).meta({ title: '角色' }),
        status: z.enum(['PENDING', 'ACTIVE', 'REJECTED']).meta({ title: '状态' }),
        createdAt: z.string().meta({ title: '创建时间' }),
        updatedAt: z.string().meta({ title: '更新时间' }),
    })
    .meta({ description: '组织成员记录' });

export class OrgMembershipVo extends createZodDto(OrgMembershipVoSchema) {}

const OrgMemberWithUserVoSchema = z
    .object({
        id: z.string().meta({ title: '成员记录 ID' }),
        orgId: z.string().meta({ title: '组织 ID' }),
        userId: z.string().meta({ title: '用户 ID' }),
        role: z.enum(['OWNER', 'ADMIN', 'MEMBER']).meta({ title: '角色' }),
        status: z.enum(['PENDING', 'ACTIVE', 'REJECTED']).meta({ title: '状态' }),
        createdAt: z.string().meta({ title: '创建时间' }),
        updatedAt: z.string().meta({ title: '更新时间' }),
        user: z
            .object({
                id: z.string(),
                username: z.string(),
                nickname: z.string().nullable().optional(),
                email: z.string().email(),
            })
            .meta({ title: '用户信息' }),
    })
    .meta({ description: '含用户信息的成员记录' });

export class OrgMemberWithUserVo extends createZodDto(OrgMemberWithUserVoSchema) {}
