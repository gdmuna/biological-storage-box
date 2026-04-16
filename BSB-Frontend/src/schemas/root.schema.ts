import { z } from 'zod/v4';

export const RootSchema = z.object({
    id: z.string(),
    orgId: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    createdAt: z.string(),
});

export type Root = z.infer<typeof RootSchema>;
