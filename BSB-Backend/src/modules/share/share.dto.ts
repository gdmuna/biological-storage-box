import { createZodDto } from 'nestjs-zod';
import { z } from 'zod/v4';

const GrantShareDtoSchema = z
    .object({
        resourceType: z.enum(['NODE']).meta({ title: '资源类型' }),
        resourceId: z.string().min(1).meta({ title: '资源 ID' }),
        ownerOrgId: z.string().min(1).meta({ title: '归属组织 ID' }),
        granteeOrgId: z.string().min(1).meta({ title: '被授权组织 ID' }),
        permission: z.enum(['READ', 'WRITE']).default('READ').meta({ title: '权限级别' }),
    })
    .meta({ description: '主动授权共享请求体' });

export class GrantShareDto extends createZodDto(GrantShareDtoSchema) {}

const RequestShareDtoSchema = z
    .object({
        resourceType: z.enum(['NODE']).meta({ title: '资源类型' }),
        resourceId: z.string().min(1).meta({ title: '资源 ID' }),
        granteeOrgId: z.string().min(1).meta({ title: '申请组织 ID' }),
    })
    .meta({ description: '申请共享资源请求体' });

export class RequestShareDto extends createZodDto(RequestShareDtoSchema) {}

const RespondShareDtoSchema = z
    .object({
        shareId: z.string().min(1).meta({ title: '共享申请 ID' }),
        approve: z.boolean().meta({ title: 'true=批准, false=拒绝' }),
    })
    .meta({ description: '响应共享申请' });

export class RespondShareDto extends createZodDto(RespondShareDtoSchema) {}

const RevokeShareDtoSchema = z
    .object({
        shareId: z.string().min(1).meta({ title: '共享记录 ID' }),
    })
    .meta({ description: '撤销共享' });

export class RevokeShareDto extends createZodDto(RevokeShareDtoSchema) {}

const ShareListDtoSchema = z
    .object({
        orgId: z.string().min(1).meta({ title: '组织 ID' }),
    })
    .meta({ description: '共享列表查询参数' });

export class ShareListDto extends createZodDto(ShareListDtoSchema) {}

// ── 响应 VO ───────────────────────────────────────────────

const ShareVoSchema = z
    .object({
        id: z.string().meta({ title: '共享记录 ID' }),
        resourceType: z.enum(['NODE']).meta({ title: '资源类型' }),
        resourceId: z.string().meta({ title: '资源 ID' }),
        ownerOrgId: z.string().meta({ title: '归属组织 ID' }),
        granteeOrgId: z.string().meta({ title: '被授权组织 ID' }),
        permission: z.enum(['READ', 'WRITE']).meta({ title: '权限级别' }),
        status: z.enum(['PENDING', 'ACTIVE', 'REVOKED']).meta({ title: '状态' }),
        createdAt: z.string().meta({ title: '创建时间' }),
        updatedAt: z.string().meta({ title: '更新时间' }),
    })
    .meta({ description: '共享记录' });

export class ShareVo extends createZodDto(ShareVoSchema) {}

const OrgRefSchema = z.object({
    id: z.string(),
    name: z.string(),
});

const ShareOutboundItemVoSchema = z
    .object({
        id: z.string().meta({ title: '共享记录 ID' }),
        resourceType: z.enum(['NODE']).meta({ title: '资源类型' }),
        resourceId: z.string().meta({ title: '资源 ID' }),
        ownerOrgId: z.string().meta({ title: '归属组织 ID' }),
        granteeOrgId: z.string().meta({ title: '被授权组织 ID' }),
        permission: z.enum(['READ', 'WRITE']).meta({ title: '权限级别' }),
        status: z.enum(['PENDING', 'ACTIVE', 'REVOKED']).meta({ title: '状态' }),
        createdAt: z.string().meta({ title: '创建时间' }),
        updatedAt: z.string().meta({ title: '更新时间' }),
        granteeOrg: OrgRefSchema.meta({ title: '被授权组织信息' }),
    })
    .meta({ description: '已共享出去的资源列表项' });

export class ShareOutboundItemVo extends createZodDto(ShareOutboundItemVoSchema) {}

const ShareInboundItemVoSchema = z
    .object({
        id: z.string().meta({ title: '共享记录 ID' }),
        resourceType: z.enum(['NODE']).meta({ title: '资源类型' }),
        resourceId: z.string().meta({ title: '资源 ID' }),
        ownerOrgId: z.string().meta({ title: '归属组织 ID' }),
        granteeOrgId: z.string().meta({ title: '被授权组织 ID' }),
        permission: z.enum(['READ', 'WRITE']).meta({ title: '权限级别' }),
        status: z.enum(['PENDING', 'ACTIVE', 'REVOKED']).meta({ title: '状态' }),
        createdAt: z.string().meta({ title: '创建时间' }),
        updatedAt: z.string().meta({ title: '更新时间' }),
        ownerOrg: OrgRefSchema.meta({ title: '归属组织信息' }),
    })
    .meta({ description: '获得的共享资源列表项' });

export class ShareInboundItemVo extends createZodDto(ShareInboundItemVoSchema) {}
