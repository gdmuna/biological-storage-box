import { z } from 'zod/v4';

export const BoxSchema = z.object({
    id: z.string(),
    orgId: z.string(),
    rootId: z.string().nullable(),
    name: z.string(),
    description: z.string().nullable(),
    rows: z.number(),
    cols: z.number(),
    createdAt: z.string(),
});

export type Box = z.infer<typeof BoxSchema>;

export const ReagentSchema = z.object({
    id: z.string(),
    boxId: z.string(),
    orgId: z.string(),
    position: z.string(),
    name: z.string(),
    description: z.string().nullable(),
});

export type Reagent = z.infer<typeof ReagentSchema>;
