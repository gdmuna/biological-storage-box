import { z } from 'zod/v4';

export const OrgSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    ownerId: z.string(),
    createdAt: z.string(),
});

export type Org = z.infer<typeof OrgSchema>;

export const CreateOrgFormSchema = z.object({
    name: z.string().min(1).max(128),
    description: z.string().max(512).optional(),
});

export type CreateOrgForm = z.infer<typeof CreateOrgFormSchema>;

const OrgUserInfoSchema = z.object({
    id: z.string(),
    username: z.string(),
    nickname: z.string().nullable(),
    email: z.string(),
});

export const OrgMemberSchema = z.object({
    id: z.string(),
    orgId: z.string(),
    userId: z.string(),
    role: z.enum(['OWNER', 'ADMIN', 'MEMBER']),
    status: z.literal('ACTIVE'),
    createdAt: z.string(),
    updatedAt: z.string(),
    user: OrgUserInfoSchema,
});

export type OrgMember = z.infer<typeof OrgMemberSchema>;

export const PendingOrgUserSchema = z.object({
    id: z.string(),
    orgId: z.string(),
    userId: z.string(),
    role: z.enum(['OWNER', 'ADMIN', 'MEMBER']),
    status: z.literal('PENDING'),
    createdAt: z.string(),
    updatedAt: z.string(),
    user: OrgUserInfoSchema,
});

export type PendingOrgUser = z.infer<typeof PendingOrgUserSchema>;
