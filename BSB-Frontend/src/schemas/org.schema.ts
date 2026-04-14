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
